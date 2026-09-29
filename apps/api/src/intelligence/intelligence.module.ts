import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [IntelligenceController],
  providers: [IntelligenceService, LlmService, PrismaService],
  exports: [IntelligenceService, LlmService],
})
export class IntelligenceModule {}
