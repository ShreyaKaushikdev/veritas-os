import { Module } from '@nestjs/common';
import { LeadstreamController } from './leadstream.controller';
import { LeadstreamService } from './leadstream.service';
import { EmailTemplateService } from './services/email-template.service';
import { BulkEmailService } from './services/bulk-email.service';
import { CampaignService } from './services/campaign.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailSchedulerService } from './services/email-scheduler.service';
import { ListManagementService } from './services/list-management.service';
import { PrismaService } from '../prisma.service';
import { ThirdPartyIntegrationService } from '../participant-automation/services/third-party-integration.service';

@Module({
  imports: [],
  controllers: [LeadstreamController],
  providers: [
    PrismaService,
    LeadstreamService,
    EmailTemplateService,
    BulkEmailService,
    CampaignService,
    EmailTrackingService,
    EmailSchedulerService,
    ListManagementService,
    ThirdPartyIntegrationService,
  ],
  exports: [LeadstreamService, BulkEmailService],
})
export class LeadstreamModule {}
