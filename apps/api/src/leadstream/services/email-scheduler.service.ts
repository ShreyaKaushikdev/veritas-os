import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CampaignService } from './campaign.service';

@Injectable()
export class EmailSchedulerService {
  constructor(
    private prisma: PrismaService,
    private campaign: CampaignService,
  ) {}

  async checkScheduledCampaigns() {
    const now = new Date();

    const campaigns = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_CAMPAIGN',
      },
    });

    for (const campaign of campaigns) {
      let details: any = {};
      try {
        details = JSON.parse(campaign.reason || '{}');
      } catch (e) {}

      if (details.status === 'SCHEDULED' && details.scheduledAt) {
        const scheduledTime = new Date(details.scheduledAt);

        if (scheduledTime <= now) {
          try {
            await this.campaign.sendCampaign(campaign.id);
          } catch (error: any) {
            details.status = 'FAILED';
            details.error = error.message;
            details.failedAt = new Date().toISOString();

            await this.prisma.auditEvent.update({
              where: { id: campaign.id },
              data: { reason: JSON.stringify(details) },
            });
          }
        }
      }
    }
  }

  async scheduleRecurringCampaign(config: {
    templateId: string;
    listId: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  }) {
    await this.prisma.auditEvent.create({
      data: {
        action: 'RECURRING_CAMPAIGN',
        actorId: 'system',
        actorRole: 'ORGANIZER',
        resourceType: 'CAMPAIGN',
        resourceId: `rec-${Date.now()}`,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          ...config,
          createdAt: new Date().toISOString(),
          active: true,
        }),
      },
    });

    return {
      success: true,
      message: 'Recurring campaign scheduled',
    };
  }

  async checkRecurringCampaigns() {
    const recurringCampaigns = await this.prisma.auditEvent.findMany({
      where: {
        action: 'RECURRING_CAMPAIGN',
      },
    });

    const now = new Date();

    for (const campaign of recurringCampaigns) {
      let config: any = {};
      try {
        config = JSON.parse(campaign.reason || '{}');
      } catch (e) {}

      if (!config.active) continue;

      const shouldSend = this.checkIfShouldSend(config, now);
      if (shouldSend) {
        console.log(`Processing recurring campaign: ${campaign.id}`);
      }
    }
  }

  private checkIfShouldSend(config: any, now: Date): boolean {
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    switch (config.schedule) {
      case 'daily':
        return true;

      case 'weekly':
        return dayOfWeek === config.dayOfWeek;

      case 'monthly':
        return dayOfMonth === config.dayOfMonth;

      default:
        return false;
    }
  }
}
