import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ThirdPartyIntegrationService } from '../../participant-automation/services/third-party-integration.service';
import * as crypto from 'crypto';

@Injectable()
export class BulkEmailService {
  constructor(
    private prisma: PrismaService,
    private thirdParty: ThirdPartyIntegrationService,
  ) {}

  async sendBulk(data: {
    eventId: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    recipients: string[];
    scheduledAt?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  }, userId: string) {
    // Create campaign record
    const campaign = await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_CAMPAIGN_BULK',
        actorId: userId,
        actorRole: 'ORGANIZER',
        resourceType: 'EVENT',
        resourceId: data.eventId,
        eventId: data.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          subject: data.subject,
          recipientCount: data.recipients.length,
          scheduledAt: data.scheduledAt,
          status: data.scheduledAt ? 'SCHEDULED' : 'SENDING',
          createdAt: new Date().toISOString(),
        }),
      },
    });

    const campaignId = campaign.id;

    // Process recipients and dispatch emails
    for (const email of data.recipients) {
      const trackingId = crypto.randomBytes(16).toString('hex');
      
      const emailData = {
        campaignId,
        to: email,
        subject: data.subject,
        html: this.injectTracking(data.htmlContent, trackingId, data.trackOpens, data.trackClicks),
        text: data.textContent,
        trackingId,
        trackOpens: data.trackOpens !== false,
        trackClicks: data.trackClicks !== false,
      };

      if (data.scheduledAt) {
        const delay = Math.max(0, new Date(data.scheduledAt).getTime() - Date.now());
        setTimeout(() => {
          this.processEmailDirect(emailData).catch(console.error);
        }, delay);
      } else {
        // Send asynchronously
        setImmediate(() => {
          this.processEmailDirect(emailData).catch(console.error);
        });
      }

      // Store tracking record
      await this.createTrackingRecord(campaignId, email, trackingId);
    }

    return {
      success: true,
      campaignId,
      recipientCount: data.recipients.length,
      status: data.scheduledAt ? 'scheduled' : 'queued',
      scheduledAt: data.scheduledAt,
      message: `Email ${data.scheduledAt ? 'scheduled' : 'queued'} for ${data.recipients.length} recipients`,
    };
  }

  async sendToGroup(data: {
    eventId: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    targetGroup: 'all' | 'participants' | 'judges' | 'teams' | 'custom';
    filters?: any;
    scheduledAt?: string;
  }, userId: string) {
    const recipients = await this.getGroupRecipients(data.eventId, data.targetGroup, data.filters);

    return this.sendBulk(
      {
        eventId: data.eventId,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        recipients: recipients.map((r: any) => r.email),
        scheduledAt: data.scheduledAt,
        trackOpens: true,
        trackClicks: true,
      },
      userId,
    );
  }

  private async getGroupRecipients(eventId: string, targetGroup: string, filters?: any) {
    let whereClause: any = { eventId };

    switch (targetGroup) {
      case 'all':
        break;

      case 'participants':
        whereClause.role = 'PARTICIPANT';
        break;

      case 'judges':
        whereClause.role = 'JUDGE';
        break;

      case 'teams':
        const teams = await this.prisma.team.findMany({
          where: { eventId },
          include: { members: { include: { user: true } } },
        });
        return teams.flatMap((t) => t.members.map((m) => m.user));

      case 'custom':
        if (filters) {
          whereClause = { ...whereClause, ...filters };
        }
        break;
    }

    const memberships = await this.prisma.membership.findMany({
      where: whereClause,
      include: { user: true },
    });

    return memberships.map((m) => m.user);
  }

  private injectTracking(html: string, trackingId: string, trackOpens?: boolean, trackClicks?: boolean): string {
    let trackedHtml = html;

    if (trackOpens !== false) {
      const trackingPixel = `<img src="${process.env.APP_URL || 'http://localhost:4000'}/api/v1/leadstream/tracking/opens/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
      trackedHtml = trackedHtml + trackingPixel;
    }

    if (trackClicks !== false) {
      trackedHtml = trackedHtml.replace(
        /href="([^"]+)"/g,
        (match, url) => {
          const trackingUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/v1/leadstream/tracking/clicks/${trackingId}?url=${encodeURIComponent(url)}`;
          return `href="${trackingUrl}"`;
        },
      );
    }

    if (!trackedHtml.includes('unsubscribe')) {
      const unsubscribeLink = `<div style="text-align:center;margin-top:40px;padding:20px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
        <p>Don't want to receive these emails? <a href="${process.env.APP_URL || 'http://localhost:4000'}/api/v1/leadstream/unsubscribe/${trackingId}" style="color:#10b981;">Unsubscribe</a></p>
      </div>`;
      trackedHtml = trackedHtml + unsubscribeLink;
    }

    return trackedHtml;
  }

  private async createTrackingRecord(campaignId: string, email: string, trackingId: string) {
    await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_TRACKING',
        actorId: 'system',
        actorRole: 'ADMIN',
        resourceType: 'CAMPAIGN',
        resourceId: campaignId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          campaignId,
          email,
          trackingId,
          status: 'queued',
          queuedAt: new Date().toISOString(),
          opened: false,
          clicked: false,
        }),
      },
    });
  }

  async processEmailDirect(emailData: any) {
    const { to, subject, html, trackingId } = emailData;

    try {
      await this.thirdParty.sendEmail({
        to,
        subject,
        html,
        from: process.env.LEADSTREAM_FROM_EMAIL || 'noreply@dogfood.os',
      });

      await this.updateTrackingStatus(trackingId, 'sent');
      return { success: true, email: to };
    } catch (error: any) {
      await this.updateTrackingStatus(trackingId, 'failed', error.message);
      throw error;
    }
  }

  private async updateTrackingStatus(trackingId: string, status: string, error?: string) {
    const tracking = await this.prisma.auditEvent.findFirst({
      where: {
        action: 'EMAIL_TRACKING',
        reason: { contains: trackingId },
      },
    });

    if (tracking) {
      let details: any = {};
      try {
        details = JSON.parse(tracking.reason || '{}');
      } catch (e) {}
      details.status = status;
      details[`${status}At`] = new Date().toISOString();
      if (error) details.error = error;

      await this.prisma.auditEvent.update({
        where: { id: tracking.id },
        data: { reason: JSON.stringify(details) },
      });
    }
  }
}
