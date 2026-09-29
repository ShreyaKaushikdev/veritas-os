import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ThirdPartyIntegrationService } from './third-party-integration.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private thirdParty: ThirdPartyIntegrationService,
  ) {}

  async sendNotification(config: {
    userId: string;
    title: string;
    message: string;
    type: 'deadline' | 'team' | 'validation' | 'system';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels?: Array<'email' | 'inApp' | 'slack' | 'discord' | 'sms'>;
    metadata?: any;
  }): Promise<void> {
    // Get user preferences
    const preferences = await this.getPreferences(config.userId);
    const user = await this.prisma.user.findUnique({
      where: { id: config.userId },
    });

    if (!user) return;

    const channels = config.channels || this.getDefaultChannels(config.priority, preferences);

    // Send via each enabled channel
    const promises: Promise<any>[] = [];

    if (channels.includes('email') && preferences.email) {
      promises.push(this.sendEmailNotification(user, config));
    }

    if (channels.includes('inApp')) {
      promises.push(this.createInAppNotification(user.id, config));
    }

    if (channels.includes('slack') && preferences.slackWebhook) {
      promises.push(
        this.thirdParty.sendSlackNotification(
          preferences.slackWebhook,
          `*${config.title}*\n${config.message}`,
        ),
      );
    }

    if (channels.includes('discord') && preferences.discordWebhook) {
      promises.push(
        this.thirdParty.sendDiscordNotification(
          preferences.discordWebhook,
          `**${config.title}**\n${config.message}`,
        ),
      );
    }

    if (channels.includes('sms') && preferences.phone && config.priority === 'urgent') {
      promises.push(
        this.thirdParty.sendSMS(preferences.phone, `${config.title}: ${config.message}`),
      );
    }

    await Promise.allSettled(promises);

    // Track notification sent
    await this.thirdParty.trackEvent('notification_sent', {
      userId: user.id,
      type: config.type,
      priority: config.priority,
      channels,
    });
  }

  private async sendEmailNotification(user: any, config: any): Promise<boolean> {
    const html = this.generateEmailHTML(config);
    
    return this.thirdParty.sendEmail({
      to: user.email,
      subject: `[DOGFOOD OS] ${config.title}`,
      html,
    });
  }

  private generateEmailHTML(config: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
          .priority-urgent { border-left: 4px solid #ef4444; }
          .priority-high { border-left: 4px solid #f59e0b; }
          .priority-medium { border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎯 ${config.title}</h1>
          </div>
          <div class="content priority-${config.priority}">
            <p style="font-size: 16px; line-height: 1.6;">${config.message}</p>
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">
              Open Dashboard
            </a>
          </div>
          <div class="footer">
            <p>DOGFOOD OS - Hackathon Operating System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async createInAppNotification(userId: string, config: any): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        action: 'NOTIFICATION',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'USER',
        resourceId: userId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          title: config.title,
          message: config.message,
          type: config.type,
          priority: config.priority,
          metadata: config.metadata,
          read: false,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }

  async getRecentNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        actorId: userId,
        action: 'NOTIFICATION',
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    return events.map((e) => {
      let details: any = {};
      try {
        details = JSON.parse(e.reason || '{}');
      } catch (err) {}
      return {
        id: e.id,
        ...details,
        createdAt: e.occurredAt,
      };
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.auditEvent.findUnique({
      where: { id: notificationId },
    });

    if (notification && notification.actorId === userId) {
      let details: any = {};
      try {
        details = JSON.parse(notification.reason || '{}');
      } catch (e) {}
      details.read = true;

      await this.prisma.auditEvent.update({
        where: { id: notificationId },
        data: { reason: JSON.stringify(details) },
      });
    }
  }

  async updatePreferences(userId: string, preferences: any): Promise<any> {
    await this.prisma.auditEvent.create({
      data: {
        action: 'PREFERENCE_UPDATE',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'USER',
        resourceId: userId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify(preferences),
      },
    });

    return preferences;
  }

  async getPreferences(userId: string): Promise<any> {
    const latest = await this.prisma.auditEvent.findFirst({
      where: {
        actorId: userId,
        action: 'PREFERENCE_UPDATE',
      },
      orderBy: { occurredAt: 'desc' },
    });

    if (latest && latest.reason) {
      try {
        return JSON.parse(latest.reason);
      } catch (e) {}
    }

    // Default preferences
    return {
      email: true,
      inApp: true,
      slack: false,
      discord: false,
      sms: false,
      slackWebhook: null,
      discordWebhook: null,
      phone: null,
    };
  }

  private getDefaultChannels(
    priority: string,
    preferences: any,
  ): Array<'email' | 'inApp' | 'slack' | 'discord' | 'sms'> {
    const channels: any[] = ['inApp'];

    if (priority === 'urgent') {
      channels.push('email', 'slack', 'discord', 'sms');
    } else if (priority === 'high') {
      channels.push('email', 'slack');
    } else if (priority === 'medium') {
      channels.push('email');
    }

    return channels.filter((c) => {
      if (c === 'inApp') return true;
      return preferences[c];
    });
  }

  async handleSlackWebhook(body: any): Promise<any> {
    console.log('[Slack Webhook]', body);
    return { success: true };
  }

  async handleDiscordWebhook(body: any): Promise<any> {
    console.log('[Discord Webhook]', body);
    return { success: true };
  }

  async scheduleNotification(config: any, sendAt: Date): Promise<void> {
    const delay = Math.max(0, sendAt.getTime() - Date.now());
    setTimeout(() => {
      this.sendNotification(config).catch(console.error);
    }, delay);
  }

  async sendTestSMS(phone: string, message: string): Promise<boolean> {
    try {
      return await this.thirdParty.sendSMS(phone, message);
    } catch (error) {
      console.error('Test SMS error:', error);
      return false;
    }
  }
}
