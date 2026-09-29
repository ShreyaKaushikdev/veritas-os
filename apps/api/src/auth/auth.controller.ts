import { Controller, Post, Body, Get, Req, UseGuards, Headers, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() body: { email: string; password: string; name: string; role?: Role; judgeReferralCode?: string }) {
    return this.authService.register(body.email, body.password, body.name, body.role, body.judgeReferralCode);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOTP(body.email, body.otp);
  }

  @Post('resend-otp')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  async resendOTP(@Body() body: { email: string }) {
    return this.authService.resendOTP(body.email);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleLogin(@Body() body: { credential?: string; token?: string; email?: string; name?: string; googleId?: string }) {
    return this.authService.loginWithGoogle(body);
  }

  @Get('google/login')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const session = await this.authService.googleAuthCallback(req.user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${session.token}`);
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return this.authService.logout(token || '');
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async me(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
