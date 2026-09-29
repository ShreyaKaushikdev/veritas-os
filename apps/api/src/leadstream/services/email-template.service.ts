import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  private templateLibrary = [
    {
      id: 'welcome-email',
      name: 'Welcome Email',
      category: 'onboarding',
      subject: 'Welcome to {{eventName}}! 🎉',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to {{eventName}}!</h1>
            </div>
            <div class="content">
              <p>Hi {{participantName}},</p>
              <p>We're excited to have you join us for {{eventName}}!</p>
              <p><strong>Event Details:</strong></p>
              <ul>
                <li>📅 Date: {{eventDate}}</li>
                <li>📍 Location: {{eventLocation}}</li>
                <li>⏰ Duration: {{eventDuration}}</li>
              </ul>
              <p>Here's what you need to do next:</p>
              <ol>
                <li>Complete your profile</li>
                <li>Form or join a team</li>
                <li>Submit your project idea</li>
              </ol>
              <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br/>{{organizerName}}<br/>{{eventName}} Team</p>
            </div>
            <div class="footer">
              <p>{{eventName}} | Powered by DOGFOOD OS</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['eventName', 'participantName', 'eventDate', 'eventLocation', 'eventDuration', 'dashboardUrl', 'organizerName'],
    },
    {
      id: 'deadline-reminder',
      name: 'Deadline Reminder',
      category: 'reminders',
      subject: '⏰ Reminder: {{deadlineType}} deadline approaching',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .deadline-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 14px 28px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Deadline Approaching</h1>
            </div>
            <div class="content">
              <p>Hi {{participantName}},</p>
              <p>This is a friendly reminder that the <strong>{{deadlineType}}</strong> deadline is approaching soon!</p>
              <div class="deadline-box">
                <p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">Time Remaining: {{timeRemaining}}</p>
                <p style="margin:8px 0 0 0;color:#78350f;">Deadline: {{deadlineDate}}</p>
              </div>
              <p><strong>What you need to do:</strong></p>
              <ul>
                <li>{{action1}}</li>
                <li>{{action2}}</li>
                <li>{{action3}}</li>
              </ul>
              <a href="{{actionUrl}}" class="button">Complete Now</a>
              <p>Don't miss out! Make sure to submit before the deadline.</p>
            </div>
            <div class="footer">
              <p>{{eventName}} | Powered by DOGFOOD OS</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['participantName', 'deadlineType', 'timeRemaining', 'deadlineDate', 'action1', 'action2', 'action3', 'actionUrl', 'eventName'],
    },
    {
      id: 'results-announcement',
      name: 'Results Announcement',
      category: 'announcements',
      subject: '🏆 {{eventName}} Results Are Here!',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .winner-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; padding: 14px 28px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Results Announced!</h1>
            </div>
            <div class="content">
              <p>Hi {{participantName}},</p>
              <p>The results for {{eventName}} are now available!</p>
              {{#if isWinner}}
              <div class="winner-box">
                <h2 style="color:#92400e;margin:0;">🎉 Congratulations!</h2>
                <p style="font-size:18px;color:#78350f;margin:10px 0;">Your team won <strong>{{prize}}</strong>!</p>
              </div>
              {{/if}}
              <p><strong>Final Leaderboard:</strong></p>
              <ol>
                <li>{{winner1}}</li>
                <li>{{winner2}}</li>
                <li>{{winner3}}</li>
              </ol>
              <a href="{{leaderboardUrl}}" class="button">View Full Results</a>
              <p>Thank you for participating! We hope to see you in future events.</p>
            </div>
            <div class="footer">
              <p>{{eventName}} | Powered by DOGFOOD OS</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['participantName', 'eventName', 'isWinner', 'prize', 'winner1', 'winner2', 'winner3', 'leaderboardUrl'],
    },
  ];

  constructor(private prisma: PrismaService) {}

  async getTemplates(eventId: string) {
    const templates = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_TEMPLATE',
        eventId,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return templates.map((t) => {
      let details: any = {};
      try {
        details = JSON.parse(t.reason || '{}');
      } catch (e) {}
      return {
        id: t.id,
        ...details,
        createdAt: t.occurredAt,
      };
    });
  }

  async getTemplate(id: string) {
    const template = await this.prisma.auditEvent.findUnique({
      where: { id },
    });

    if (!template || template.action !== 'EMAIL_TEMPLATE') {
      throw new NotFoundException('Template not found');
    }

    let details: any = {};
    try {
      details = JSON.parse(template.reason || '{}');
    } catch (e) {}

    return {
      id: template.id,
      ...details,
      createdAt: template.occurredAt,
    };
  }

  async createTemplate(data: {
    eventId: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category: string;
    variables?: string[];
  }, userId: string) {
    const template = await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_TEMPLATE',
        actorId: userId,
        actorRole: 'ORGANIZER',
        resourceType: 'TEMPLATE',
        resourceId: `tpl-${Date.now()}`,
        eventId: data.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          name: data.name,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          category: data.category,
          variables: data.variables || this.extractVariables(data.htmlContent),
          createdBy: userId,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    let details: any = {};
    try {
      details = JSON.parse(template.reason || '{}');
    } catch (e) {}

    return {
      id: template.id,
      ...details,
    };
  }

  async updateTemplate(id: string, data: any) {
    const template = await this.prisma.auditEvent.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    let details: any = {};
    try {
      details = JSON.parse(template.reason || '{}');
    } catch (e) {}

    const updatedDetails = {
      ...details,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.auditEvent.update({
      where: { id },
      data: {
        reason: JSON.stringify(updatedDetails),
      },
    });

    return {
      id: updated.id,
      ...updatedDetails,
    };
  }

  async deleteTemplate(id: string) {
    await this.prisma.auditEvent.delete({ where: { id } }).catch(() => {});
    return { success: true, message: 'Template deleted' };
  }

  async renderTemplate(template: any, variables: Record<string, any>) {
    try {
      const renderStr = (str: string) => {
        if (!str) return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
          const cleanKey = key.trim();
          return variables[cleanKey] !== undefined ? String(variables[cleanKey]) : `{{${cleanKey}}}`;
        });
      };

      const subject = renderStr(template.subject);
      const html = renderStr(template.htmlContent);
      const text = renderStr(template.textContent);

      return {
        subject,
        html,
        text,
        renderedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  private extractVariables(content: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim().split(' ')[0]; // Handle helpers like {{#if var}}
      if (!variable.startsWith('#') && !variable.startsWith('/')) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  getTemplateLibrary() {
    return {
      templates: this.templateLibrary,
      categories: ['onboarding', 'reminders', 'announcements', 'engagement'],
    };
  }

  async cloneFromLibrary(libraryId: string, data: { eventId: string; name: string }, userId: string) {
    const libraryTemplate = this.templateLibrary.find((t) => t.id === libraryId);
    
    if (!libraryTemplate) {
      throw new NotFoundException('Library template not found');
    }

    return this.createTemplate(
      {
        eventId: data.eventId,
        name: data.name || libraryTemplate.name,
        subject: libraryTemplate.subject,
        htmlContent: libraryTemplate.htmlContent,
        category: libraryTemplate.category,
        variables: libraryTemplate.variables,
      },
      userId,
    );
  }
}
