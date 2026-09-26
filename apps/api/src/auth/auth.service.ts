import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/types';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(email: string, password: string, name: string, role: Role = Role.PARTICIPANT) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
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

    return this.createSession(user.id);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user.id);
  }

  async loginWithGoogle(data: { credential?: string; token?: string; email?: string; name?: string; googleId?: string }) {
    let email = data.email;
    let name = data.name;
    let googleId = data.googleId;

    // Decode Google JWT credential if passed from Google Identity Services
    if (data.credential) {
      try {
        const parts = data.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) {
            email = payload.email;
            name = payload.name || email.split('@')[0];
            googleId = payload.sub;
          }
        }
      } catch (err) {
        // Fall back to direct payload fields
      }
    }

    if (!email) {
      throw new UnauthorizedException('Missing email in Google authentication payload');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
          role: Role.PARTICIPANT,
        },
      });
    }

    return this.createSession(user.id);
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
