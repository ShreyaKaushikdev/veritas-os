import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PassportModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
