import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [IntelligenceController],
  providers: [IntelligenceService, PrismaService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
