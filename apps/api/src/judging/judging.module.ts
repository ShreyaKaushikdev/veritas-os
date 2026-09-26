import { Module } from '@nestjs/common';
import { JudgingController } from './judging.controller';
import { JudgingService } from './judging.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [JudgingController],
  providers: [JudgingService, PrismaService],
  exports: [JudgingService],
})
export class JudgingModule {}
