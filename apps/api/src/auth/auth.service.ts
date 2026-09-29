import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/types';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(email: string, password: string, name: string, role: Role = Role.PARTICIPANT, judgeReferralCode?: string) {
    // ✅ SECURITY: Validate role self-assignment
    const allowedSelfRegisterRoles = [Role.PARTICIPANT, Role.JUDGE];
    if (!allowedSelfRegisterRoles.includes(role)) {
      throw new BadRequestException(
        `Cannot self-register as ${role}. Only PARTICIPANT and JUDGE roles are available for registration.`
      );
    }

    // ✅ SECURITY: JUDGE role requires a valid referral code
    if (role === Role.JUDGE) {
      const validJudgeCode = process.env.JUDGE_REFERRAL_CODE || 'JUDGE-2024-VERITAS';
      if (!judgeReferralCode || judgeReferralCode !== validJudgeCode) {
        throw new BadRequestException('Invalid judge referral code. Please contact the organizer for a valid code.');
      }
    }

    // Validate password strength
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // ✅ AUDIT FIX C2: Reject duplicate registrations — never overwrite existing passwords
      throw new ConflictException('An account with this email already exists. Please log in instead.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role,
        otp,
        otpExpiresAt,
        isVerified: true, // Instant access in offline/self-hosted mode
      },
    });

    if (role === Role.JUDGE) {
      await this.prisma.judgePassport.create({
        data: {
          userId: user.id,
          calibrationBias: 0.0,
          reliabilityScore: 1.0,
        },
      });
    }

    // Try sending email if configured
    try {
      await this.emailService.sendOTP(email, otp, user.name);
    } catch (error) {
      // Ignore SMTP failure in offline mode
    }

    return this.createSession(user.id);
  }

  async verifyOTP(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark user as verified and clear OTP
    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Create session
    return this.createSession(user.id);
  }

  async resendOTP(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt },
    });

    // Send OTP email
    try {
      await this.emailService.sendOTP(email, otp, user.name);
      return {
        success: true,
        message: 'OTP has been resent to your email.',
      };
    } catch (error) {
      console.error('Failed to resend OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async login(email: string, password: string) {
    // ✅ SECURITY: No auto-provisioning. Users must register first.
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Use generic message to prevent email enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      // User exists but registered via Google OAuth — no password set
      throw new UnauthorizedException('This account uses Google Sign-In. Please sign in with Google.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified. Please check your email for the verification code.');
    }

    return this.createSession(user.id);
  }

  async loginWithGoogle(data: { credential?: string; token?: string; email?: string; name?: string; googleId?: string }) {
    let email = data.email;
    let name = data.name;
    let googleId = data.googleId;

    // ✅ FIX #1: Verify Google JWT signature against Google's public keys
    if (data.credential) {
      try {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: data.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new UnauthorizedException('Invalid Google token payload');
        }

        email = payload.email;
        name = payload.name || email.split('@')[0];
        googleId = payload.sub;
      } catch (error) {
        throw new UnauthorizedException(`Invalid Google token: ${error.message}`);
      }
    }

    if (!email) {
      throw new UnauthorizedException('Missing email in Google authentication payload');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);  // ✅ FIX #11: Increase bcrypt rounds to 12
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
          role: Role.PARTICIPANT,
          googleId: googleId || null,
          isVerified: true, // Google accounts are pre-verified
        },
      });

      // Send welcome email for new Google users
      try {
        await this.emailService.sendWelcomeEmail(email, user.name);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    } else if (!user.googleId && googleId) {
      // Link Google ID to existing account
      await this.prisma.user.update({
        where: { email },
        data: { googleId, isVerified: true },
      });
    }

    return this.createSession(user.id);
  }

  async googleAuthCallback(user: any) {
    // This is called by Passport strategy
    let existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      existingUser = await this.prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          passwordHash,
          role: Role.PARTICIPANT,
          googleId: user.googleId,
          isVerified: true,
        },
      });

      // Send welcome email
      try {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    } else if (!existingUser.googleId) {
      // Link Google ID to existing account
      await this.prisma.user.update({
        where: { email: user.email },
        data: { googleId: user.googleId, isVerified: true },
      });
    }

    return this.createSession(existingUser.id);
  }

  async createSession(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await this.prisma.session.create({
      data: {
        userId,
        token,
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

  async logout(token: string) {
    await this.prisma.session.deleteMany({ where: { token } });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        memberships: {
          include: {
            event: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
        judgeProfile: true,
      },
    });
    return user;
  }
}
