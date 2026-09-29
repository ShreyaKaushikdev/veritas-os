import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/types';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

/**
 * ✅ STRONG AUTHENTICATION SERVICE
 * 
 * KEY SECURITY FEATURES:
 * 1. Email-Role Binding: Once email+role registered, cannot be changed
 * 2. Brute Force Protection: Lock account after N failed attempts
 * 3. Password History: Prevent password reuse
 * 4. Session Management: Track device fingerprint, IP, user agent
 * 5. Login Auditing: Log all login attempts for security investigation
 * 6. Role Change Tracking: Audit all role transitions
 */
@Injectable()
export class StrongAuthService {
  private googleClient: OAuth2Client;
  
  // Configuration from environment
  private readonly MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  private readonly LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_DURATION_MINUTES || '15');
  private readonly BCRYPT_ROUNDS = 12;
  private readonly PASSWORD_HISTORY_SIZE = 5;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * ✅ FIX: Strong Registration with Email-Role Binding
   * 
   * Once a user registers with email + role, that binding is PERMANENT.
   * No user can change their email's role association.
   */
  async registerWithRoleBinding(
    email: string,
    password: string,
    name: string,
    role: Role = Role.PARTICIPANT
  ) {
    const existingBinding = await this.prisma.userRoleBinding.findUnique({
      where: { email }
    });

    // ✅ STRONG AUTH: Email-role binding is immutable
    if (existingBinding) {
      if (existingBinding.role !== role) {
        throw new ConflictException(
          `Email ${email} is already registered with role ${existingBinding.role}. Cannot register as ${role}.`
        );
      }
      // Same role registration = allow re-registration (account creation)
    }

    // Check if user with this email exists
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // ✅ STRONG AUTH: Verify role matches binding
      if (user.role !== role) {
        throw new ForbiddenException(
          `Role mismatch: Email ${email} is bound to role ${existingBinding?.role || user.role}`
        );
      }

      // Update password and mark verified
      const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
      await this.prisma.user.update({
        where: { email },
        data: { 
          passwordHash, 
          isVerified: true,
          loginAttempts: 0,
          failedLoginAttempts: 0,
        },
      });
      return this.createSession(user.id, null, null);
    }

    // ✅ STRONG AUTH: Create email-role binding FIRST
    if (!existingBinding) {
      await this.prisma.userRoleBinding.create({
        data: {
          email,
          role,
          isEmailVerified: false,
        },
      });
    }

    // ✅ STRONG AUTH: Create user with verified password
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user = await this.prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role,
        otp,
        otpExpiresAt,
        isVerified: false, // Requires email verification
        loginAttempts: 0,
        failedLoginAttempts: 0,
      },
    });

    // Create judge profile if registering as judge
    if (role === Role.JUDGE) {
      await this.prisma.judgePassport.create({
        data: {
          userId: user.id,
          calibrationBias: 0.0,
          reliabilityScore: 1.0,
        },
      });
    }

    // Send OTP email
    try {
      await this.emailService.sendOTP(email, otp, user.name);
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }

    // Audit log
    await this.prisma.auditEvent.create({
      data: {
        actorId: user.id,
        actorRole: role,
        action: 'USER_REGISTRATION',
        resourceType: 'USER',
        resourceId: user.id,
        reason: `New user registered as ${role} with email ${email}`,
        requestId: `REQ-REGISTER-${Date.now()}`,
      },
    });

    return {
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * ✅ FIX: Strong Login with Brute Force Protection
   */
  async loginWithBruteForceProtection(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ) {
    // Log login attempt for auditing
    await this.logLoginAttempt(email, ipAddress, userAgent, true);

    // Verify email-role binding exists
    const binding = await this.prisma.userRoleBinding.findUnique({
      where: { email }
    });

    if (!binding) {
      await this.logLoginAttempt(email, ipAddress, userAgent, false, 'NO_BINDING');
      throw new UnauthorizedException('Email not registered in system');
    }

    // Find user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      await this.logLoginAttempt(email, ipAddress, userAgent, false, 'USER_NOT_FOUND');
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ STRONG AUTH: Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      await this.logLoginAttempt(email, ipAddress, userAgent, false, 'ACCOUNT_LOCKED');
      throw new ForbiddenException(
        `Account locked due to ${user.lockReason}. Try again in ${minutesRemaining} minutes.`
      );
    }

    // ✅ STRONG AUTH: Check email verification
    if (!user.isVerified) {
      await this.logLoginAttempt(email, ipAddress, userAgent, false, 'EMAIL_NOT_VERIFIED');
      throw new UnauthorizedException('Email not verified. Please verify your email first.');
    }

    // ✅ STRONG AUTH: Verify role matches binding
    if (user.role !== binding.role) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: binding.role } // Force role alignment
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // ✅ STRONG AUTH: Increment failed attempts and lock if exceeded
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;
      let lockReason = null;

      if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60000);
        lockReason = 'BRUTE_FORCE_PROTECTION';
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
          lockedUntil,
          lockReason,
        },
      });

      await this.logLoginAttempt(email, ipAddress, userAgent, false, 'INVALID_PASSWORD');
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ STRONG AUTH: Successful login - reset failed attempts
    user = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: user.loginAttempts + 1,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lockReason: null,
      },
    });

    await this.logLoginAttempt(email, ipAddress, userAgent, true);

    // Create device fingerprint
    const deviceId = this.generateDeviceFingerprint(userAgent, ipAddress);

    // ✅ STRONG AUTH: Create session with device tracking
    return this.createSession(user.id, ipAddress, userAgent);
  }

  /**
   * ✅ FIX: Strong Google OAuth with JWT verification
   */
  async loginWithGoogleStrongAuth(
    credential: string,
    ipAddress: string,
    userAgent: string
  ) {
    // ✅ STRONG AUTH: Verify Google JWT signature
    let googleEmail: string;
    let googleName: string;
    let googleId: string;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      googleEmail = payload.email;
      googleName = payload.name || googleEmail.split('@')[0];
      googleId = payload.sub;
    } catch (error) {
      await this.logLoginAttempt('google-oauth', ipAddress, userAgent, false, 'INVALID_GOOGLE_JWT');
      throw new UnauthorizedException(`Invalid Google token: ${error.message}`);
    }

    // ✅ STRONG AUTH: Check email-role binding for Google user
    let binding = await this.prisma.userRoleBinding.findUnique({
      where: { email: googleEmail }
    });

    let user = await this.prisma.user.findUnique({ where: { email: googleEmail } });

    if (user && binding && user.role !== binding.role) {
      // Sync role from binding
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: binding.role }
      });
    }

    if (!user) {
      // Auto-create binding and user for first-time Google login
      if (!binding) {
        binding = await this.prisma.userRoleBinding.create({
          data: {
            email: googleEmail,
            role: Role.PARTICIPANT,
            isEmailVerified: true, // Google emails are pre-verified
            firstLoginAt: new Date(),
          },
        });
      }

      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, this.BCRYPT_ROUNDS);

      user = await this.prisma.user.create({
        data: {
          email: googleEmail,
          name: googleName,
          passwordHash,
          role: binding.role,
          googleId,
          isVerified: true,
          loginAttempts: 1,
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
        },
      });

      // Send welcome email
      try {
        await this.emailService.sendWelcomeEmail(googleEmail, googleName);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }

      await this.logLoginAttempt(googleEmail, ipAddress, userAgent, true);
    } else {
      // ✅ STRONG AUTH: Update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginAttempts: user.loginAttempts + 1,
          failedLoginAttempts: 0,
          isVerified: true,
        },
      });

      await this.logLoginAttempt(googleEmail, ipAddress, userAgent, true);
    }

    return this.createSession(user.id, ipAddress, userAgent);
  }

  /**
   * ✅ STRONG AUTH: Create session with device fingerprint
   */
  async createSession(
    userId: string,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // ✅ STRONG AUTH: Limit sessions per user (prevent session flooding)
    const existingSessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const MAX_SESSIONS = 5;
    if (existingSessions.length >= MAX_SESSIONS) {
      // Revoke oldest session
      await this.prisma.session.update({
        where: { id: existingSessions[0].id },
        data: { isActive: false, revokedAt: new Date() },
      });
    }

    const deviceId = this.generateDeviceFingerprint(userAgent, ipAddress);

    const session = await this.prisma.session.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        deviceId,
        isActive: true,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  /**
   * ✅ STRONG AUTH: Verify session validity with device fingerprint
   */
  async verifySessionWithDeviceCheck(
    token: string,
    ipAddress: string,
    userAgent: string
  ) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedException('Session invalid or revoked');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Session expired');
    }

    // ✅ STRONG AUTH: Check device fingerprint consistency
    const currentDeviceId = this.generateDeviceFingerprint(userAgent, ipAddress);
    const storedDeviceId = session.deviceId;

    if (currentDeviceId !== storedDeviceId) {
      // Log suspicious activity (device mismatch)
      await this.logLoginAttempt(
        session.user.email,
        ipAddress,
        userAgent,
        false,
        'DEVICE_MISMATCH'
      );

      // Don't fail here, just warn - allows same user on multiple devices
      console.warn(
        `⚠️ Device fingerprint mismatch for user ${session.user.id}: stored=${storedDeviceId}, current=${currentDeviceId}`
      );
    }

    return session.user;
  }

  /**
   * ✅ STRONG AUTH: Change password with history check
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // ✅ STRONG AUTH: Check password history to prevent reuse
    const previousHashes = user.previousPasswordHashes || [];
    const isPasswordReused = await Promise.all(
      previousHashes.map(hash => bcrypt.compare(newPassword, hash))
    );

    if (isPasswordReused.some(Boolean)) {
      throw new BadRequestException(
        `Cannot reuse last ${this.PASSWORD_HISTORY_SIZE} passwords`
      );
    }

    // ✅ STRONG AUTH: Update password and history
    const newPasswordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    const updatedHistory = [user.passwordHash, ...previousHashes].slice(
      0,
      this.PASSWORD_HISTORY_SIZE - 1
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        previousPasswordHashes: updatedHistory,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all sessions for security
    await this.prisma.session.updateMany(
      { where: { userId } },
      { isActive: false, revokedAt: new Date() }
    );

    return { success: true, message: 'Password changed successfully. Please login again.' };
  }

  /**
   * ✅ STRONG AUTH: Logout and revoke session
   */
  async logout(token: string) {
    await this.prisma.session.update(
      { where: { token } },
      { isActive: false, revokedAt: new Date() }
    );
    return { success: true };
  }

  /**
   * ✅ STRONG AUTH: Change user role (admin only, with audit trail)
   */
  async changeUserRole(
    userId: string,
    newRole: Role,
    changedByAdminId: string,
    reason: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ STRONG AUTH: Email-role binding is immutable - cannot change role after binding
    const binding = await this.prisma.userRoleBinding.findUnique({
      where: { email: user.email }
    });

    if (binding && binding.role !== newRole) {
      throw new ForbiddenException(
        `Cannot change role: Email ${user.email} is permanently bound to role ${binding.role}`
      );
    }

    // Log role change
    await this.prisma.roleChangeLog.create({
      data: {
        userId,
        oldRole: user.role,
        newRole,
        changedBy: changedByAdminId,
        reason,
        approved: true,
      },
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Audit log
    await this.prisma.auditEvent.create({
      data: {
        actorId: changedByAdminId,
        actorRole: Role.ADMIN,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'USER',
        resourceId: userId,
        beforeHash: user.role,
        afterHash: newRole,
        reason,
        requestId: `REQ-ROLE-${Date.now()}`,
      },
    });

    return updated;
  }

  // ============ HELPER METHODS ============

  private async logLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string
  ) {
    await this.prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        userAgent: userAgent?.substring(0, 500), // Truncate long user agents
        success,
        reason,
      },
    });
  }

  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const fingerprintString = `${userAgent || 'unknown'}::${ipAddress || 'unknown'}`;
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }
}
