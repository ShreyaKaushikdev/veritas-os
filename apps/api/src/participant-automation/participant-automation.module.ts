import { Module } from '@nestjs/common';
import { ParticipantAutomationController } from './participant-automation.controller';
import { ParticipantAutomationService } from './participant-automation.service';
import { IdeaRefinementService } from './services/idea-refinement.service';
import { DeadlineReminderService } from './services/deadline-reminder.service';
import { TeamCollaborationService } from './services/team-collaboration.service';
import { ProjectValidationService } from './services/project-validation.service';
import { TeamMatchingService } from './services/team-matching.service';
import { BlindSpotDetectionService } from './services/blindspot-detection.service';
import { VersionControlService } from './services/version-control.service';
import { SubmissionReceiptService } from './services/submission-receipt.service';
import { NotificationService } from './services/notification.service';
import { ThirdPartyIntegrationService } from './services/third-party-integration.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  controllers: [ParticipantAutomationController],
  providers: [
    PrismaService,
    ParticipantAutomationService,
    IdeaRefinementService,
    DeadlineReminderService,
    TeamCollaborationService,
    ProjectValidationService,
    TeamMatchingService,
    BlindSpotDetectionService,
    VersionControlService,
    SubmissionReceiptService,
    NotificationService,
    ThirdPartyIntegrationService,
  ],
  exports: [ParticipantAutomationService, NotificationService],
})
export class ParticipantAutomationModule {}
