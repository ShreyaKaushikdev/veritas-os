import { Module } from '@nestjs/common';
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
import { PrismaService } from './prisma.service';

@Module({
  imports: [
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
  ],
  providers: [PrismaService],
})
export class AppModule {}
