import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TrustController],
  providers: [TrustService, PrismaService],
  exports: [TrustService],
})
export class TrustModule {}
