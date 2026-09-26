import { Controller, Post, Body, Get, Req, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string; role?: Role }) {
    return this.authService.register(body.email, body.password, body.name, body.role);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  async googleLogin(@Body() body: { credential?: string; token?: string; email?: string; name?: string; googleId?: string }) {
    return this.authService.loginWithGoogle(body);
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
