import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { TeamsModule } from './teams/teams.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { JudgingModule } from './judging/judging.module';
import { RankingModule } from './ranking/ranking.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { TrustModule } from './trust/trust.module';
import { SupportModule } from './support/support.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './database/database.module';
import { ParticipantAutomationModule } from './participant-automation/participant-automation.module';
import { LeadstreamModule } from './leadstream/leadstream.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 999999, // 100 requests per minute (global default)
      },
    ]),
    DatabaseModule,
    AuthModule,
    EventsModule,
    TeamsModule,
    SubmissionsModule,
    JudgingModule,
    RankingModule,
    IntelligenceModule,
    TrustModule,
    SupportModule,
    ChatModule,
    ParticipantAutomationModule,
    LeadstreamModule,
  ],
  providers: [
    PrismaService,
    // ✅ FIX #3: Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
