import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailTemplateService } from './email-template.service';
import { BulkEmailService } from './bulk-email.service';
import { ListManagementService } from './list-management.service';

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private emailTemplate: EmailTemplateService,
    private bulkEmail: BulkEmailService,
    private listManagement: ListManagementService,
  ) {}

  async getCampaigns(eventId: string) {
    const campaigns = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_CAMPAIGN',
        eventId,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return campaigns.map((c) => {
      let details: any = {};
      try {
        details = JSON.parse(c.reason || '{}');
      } catch (e) {}
      return {
        id: c.id,
        ...details,
        createdAt: c.occurredAt,
      };
    });
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.auditEvent.findUnique({
      where: { id },
    });

    if (!campaign || campaign.action !== 'EMAIL_CAMPAIGN') {
      throw new NotFoundException('Campaign not found');
    }

    let details: any = {};
    try {
      details = JSON.parse(campaign.reason || '{}');
    } catch (e) {}
    
    const stats = await this.getCampaignStats(id);

    return {
      id: campaign.id,
      eventId: campaign.eventId,
      ...details,
      stats,
      createdAt: campaign.occurredAt,
    };
  }

  async createCampaign(data: {
    eventId: string;
    name: string;
    description?: string;
    templateId: string;
    listId?: string;
    recipients?: string[];
    filters?: any;
    scheduledAt?: string;
    variables?: Record<string, string>;
  }, userId: string) {
    const template = await this.emailTemplate.getTemplate(data.templateId);

    let recipients: string[] = [];
    
    if (data.listId) {
      const listRecipients = await this.listManagement.getRecipients(data.listId, 1, 10000);
      recipients = listRecipients.recipients.map((r: any) => r.email);
    } else if (data.recipients) {
      recipients = data.recipients;
    } else if (data.filters) {
      recipients = await this.getRecipientsFromFilters(data.eventId, data.filters);
    }

    const campaign = await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_CAMPAIGN',
        actorId: userId,
        actorRole: 'ORGANIZER',
        resourceType: 'CAMPAIGN',
        resourceId: `camp-${Date.now()}`,
        eventId: data.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          name: data.name,
          description: data.description,
          templateId: data.templateId,
          templateName: template.name,
          listId: data.listId,
          recipientCount: recipients.length,
          status: 'DRAFT',
          variables: data.variables || {},
          scheduledAt: data.scheduledAt,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    await this.storeRecipients(campaign.id, recipients);

    let details: any = {};
    try {
      details = JSON.parse(campaign.reason || '{}');
    } catch (e) {}

    return {
      id: campaign.id,
      ...details,
    };
  }

  async sendCampaign(id: string) {
    const campaign = await this.getCampaign(id);

    if (campaign.status === 'SENT') {
      throw new Error('Campaign already sent');
    }

    if (campaign.status === 'SENDING') {
      throw new Error('Campaign is already being sent');
    }

    await this.updateCampaignStatus(id, 'SENDING');

    const template = await this.emailTemplate.getTemplate(campaign.templateId);
    const rendered = await this.emailTemplate.renderTemplate(template, campaign.variables || {});
    const recipients = await this.getCampaignRecipients(id);

    await this.bulkEmail.sendBulk(
      {
        eventId: campaign.eventId,
        subject: rendered.subject,
        htmlContent: rendered.html,
        textContent: rendered.text,
        recipients: recipients.map((r: any) => r.email),
        trackOpens: true,
        trackClicks: true,
      },
      campaign.createdBy || 'system',
    );

    await this.updateCampaignStatus(id, 'SENT', new Date().toISOString());

    return {
      success: true,
      campaignId: id,
      recipientCount: recipients.length,
      status: 'sent',
    };
  }

  async scheduleCampaign(id: string, scheduledAt: Date) {
    const campaign = await this.getCampaign(id);

    if (campaign.status === 'SENT') {
      throw new Error('Campaign already sent');
    }

    const campaignRecord = await this.prisma.auditEvent.findUnique({ where: { id } });
    if (!campaignRecord) throw new NotFoundException('Campaign not found');

    let details: any = {};
    try {
      details = JSON.parse(campaignRecord.reason || '{}');
    } catch (e) {}

    details.scheduledAt = scheduledAt.toISOString();
    details.status = 'SCHEDULED';

    await this.prisma.auditEvent.update({
      where: { id },
      data: { reason: JSON.stringify(details) },
    });

    return {
      success: true,
      campaignId: id,
      scheduledAt: scheduledAt.toISOString(),
      status: 'scheduled',
    };
  }

  async cancelCampaign(id: string) {
    const campaign = await this.getCampaign(id);

    if (campaign.status === 'SENT') {
      throw new Error('Cannot cancel sent campaign');
    }

    await this.updateCampaignStatus(id, 'CANCELLED');

    return {
      success: true,
      campaignId: id,
      status: 'cancelled',
    };
  }

  async deleteCampaign(id: string) {
    const campaign = await this.getCampaign(id);

    if (campaign.status === 'SENDING') {
      throw new Error('Cannot delete campaign while sending');
    }

    await this.prisma.auditEvent.delete({ where: { id } }).catch(() => {});

    return {
      success: true,
      message: 'Campaign deleted',
    };
  }

  async getCampaignStats(campaignId: string) {
    const trackingRecords = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_TRACKING',
        reason: { contains: campaignId },
      },
    });

    const stats = {
      total: trackingRecords.length,
      queued: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      bounced: 0,
      unsubscribed: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
    };

    trackingRecords.forEach((record) => {
      let details: any = {};
      try {
        details = JSON.parse(record.reason || '{}');
      } catch (e) {}
      
      switch (details.status) {
        case 'queued':
          stats.queued++;
          break;
        case 'sent':
          stats.sent++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'bounced':
          stats.bounced++;
          break;
      }

      if (details.opened) stats.opened++;
      if (details.clicked) stats.clicked++;
      if (details.unsubscribed) stats.unsubscribed++;
    });

    if (stats.delivered > 0) {
      stats.openRate = Math.round((stats.opened / stats.delivered) * 100);
      stats.clickRate = Math.round((stats.clicked / stats.delivered) * 100);
    }

    if (stats.opened > 0) {
      stats.clickToOpenRate = Math.round((stats.clicked / stats.opened) * 100);
    }

    return stats;
  }

  async getAnalyticsOverview(eventId: string) {
    const campaigns = await this.getCampaigns(eventId);
    
    const overview = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'SENDING').length,
      scheduledCampaigns: campaigns.filter((c) => c.status === 'SCHEDULED').length,
      completedCampaigns: campaigns.filter((c) => c.status === 'SENT').length,
      totalEmailsSent: 0,
      totalOpens: 0,
      totalClicks: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
    };

    for (const campaign of campaigns) {
      if (campaign.status === 'SENT') {
        const stats = await this.getCampaignStats(campaign.id);
        overview.totalEmailsSent += stats.sent;
        overview.totalOpens += stats.opened;
        overview.totalClicks += stats.clicked;
      }
    }

    if (overview.completedCampaigns > 0) {
      const allStats = await Promise.all(
        campaigns
          .filter((c) => c.status === 'SENT')
          .map((c) => this.getCampaignStats(c.id)),
      );

      const totalOpenRate = allStats.reduce((sum, s) => sum + s.openRate, 0);
      const totalClickRate = allStats.reduce((sum, s) => sum + s.clickRate, 0);

      overview.averageOpenRate = Math.round(totalOpenRate / overview.completedCampaigns);
      overview.averageClickRate = Math.round(totalClickRate / overview.completedCampaigns);
    }

    return overview;
  }

  async getEngagementMetrics(eventId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const campaigns = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_CAMPAIGN',
        eventId,
        occurredAt: { gte: startDate },
      },
    });

    const dailyMetrics = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCampaigns = campaigns.filter((c) => {
        const cDate = c.occurredAt.toISOString().split('T')[0];
        return cDate === dateStr;
      });

      dailyMetrics.push({
        date: dateStr,
        campaignsSent: dayCampaigns.length,
      });
    }

    return {
      period: `Last ${days} days`,
      dailyMetrics: dailyMetrics.reverse(),
    };
  }

  async getRecipientDetails(campaignId: string, status?: string) {
    const trackingRecords = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_TRACKING',
        reason: { contains: campaignId },
      },
    });

    let recipients = trackingRecords.map((r) => {
      let details: any = {};
      try {
        details = JSON.parse(r.reason || '{}');
      } catch (e) {}
      return {
        email: details.email,
        status: details.status,
        queuedAt: details.queuedAt,
        sentAt: details.sentAt,
        deliveredAt: details.deliveredAt,
        openedAt: details.openedAt,
        clickedAt: details.clickedAt,
        opened: details.opened || false,
        clicked: details.clicked || false,
      };
    });

    if (status) {
      recipients = recipients.filter((r) => r.status === status);
    }

    return {
      campaignId,
      count: recipients.length,
      recipients,
    };
  }

  private async updateCampaignStatus(id: string, status: string, sentAt?: string) {
    const campaign = await this.prisma.auditEvent.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    let details: any = {};
    try {
      details = JSON.parse(campaign.reason || '{}');
    } catch (e) {}
    details.status = status;
    if (sentAt) details.sentAt = sentAt;
    details.updatedAt = new Date().toISOString();

    await this.prisma.auditEvent.update({
      where: { id },
      data: { reason: JSON.stringify(details) },
    });
  }

  private async storeRecipients(campaignId: string, recipients: string[]) {
    await this.prisma.auditEvent.create({
      data: {
        action: 'CAMPAIGN_RECIPIENTS',
        actorId: 'system',
        actorRole: 'ORGANIZER',
        resourceType: 'CAMPAIGN',
        resourceId: campaignId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          campaignId,
          recipients,
          count: recipients.length,
        }),
      },
    });
  }

  private async getCampaignRecipients(campaignId: string) {
    const record = await this.prisma.auditEvent.findFirst({
      where: {
        action: 'CAMPAIGN_RECIPIENTS',
        resourceId: campaignId,
      },
    });

    if (!record) return [];

    let details: any = {};
    try {
      details = JSON.parse(record.reason || '{}');
    } catch (e) {}
    return (details.recipients || []).map((email: string) => ({ email }));
  }

  private async getRecipientsFromFilters(eventId: string, filters: any): Promise<string[]> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        eventId,
        ...filters,
      },
      include: { user: true },
    });

    return memberships.map((m) => m.user.email);
  }
}
