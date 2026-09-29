import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class EmailTrackingService {
  constructor(private prisma: PrismaService) {}

  async trackOpen(trackingId: string) {
    const tracking = await this.getTracking(trackingId);

    if (!tracking) {
      console.log(`Tracking ID not found: ${trackingId}`);
      return;
    }

    let details: any = {};
    try {
      details = JSON.parse(tracking.reason || '{}');
    } catch (e) {}

    // Only track first open
    if (!details.opened) {
      details.opened = true;
      details.openedAt = new Date().toISOString();
      details.openCount = 1;
    } else {
      details.openCount = (details.openCount || 1) + 1;
      details.lastOpenedAt = new Date().toISOString();
    }

    await this.prisma.auditEvent.update({
      where: { id: tracking.id },
      data: { reason: JSON.stringify(details) },
    });

    console.log(`Email opened: ${details.email} (Campaign: ${details.campaignId})`);
  }

  async trackClick(trackingId: string, url: string) {
    const tracking = await this.getTracking(trackingId);

    if (!tracking) {
      console.log(`Tracking ID not found: ${trackingId}`);
      return;
    }

    let details: any = {};
    try {
      details = JSON.parse(tracking.reason || '{}');
    } catch (e) {}

    // Track click
    if (!details.clicked) {
      details.clicked = true;
      details.clickedAt = new Date().toISOString();
      details.clicks = [{ url, timestamp: new Date().toISOString() }];
    } else {
      details.clicks = details.clicks || [];
      details.clicks.push({ url, timestamp: new Date().toISOString() });
      details.lastClickedAt = new Date().toISOString();
    }

    details.clickCount = details.clicks.length;

    await this.prisma.auditEvent.update({
      where: { id: tracking.id },
      data: { reason: JSON.stringify(details) },
    });

    console.log(`Link clicked: ${url} by ${details.email}`);
  }

  async unsubscribe(token: string) {
    const trackingId = this.decodeUnsubscribeToken(token);
    const tracking = await this.getTracking(trackingId);

    if (!tracking) {
      return { success: false, message: 'Invalid unsubscribe link' };
    }

    let details: any = {};
    try {
      details = JSON.parse(tracking.reason || '{}');
    } catch (e) {}
    details.unsubscribed = true;
    details.unsubscribedAt = new Date().toISOString();

    await this.prisma.auditEvent.update({
      where: { id: tracking.id },
      data: { reason: JSON.stringify(details) },
    });

    // Store global unsubscribe preference
    await this.storeUnsubscribePreference(details.email);

    return {
      success: true,
      message: 'You have been unsubscribed successfully',
      email: details.email,
    };
  }

  async getEmailPreferences(token: string) {
    const trackingId = this.decodeUnsubscribeToken(token);
    const tracking = await this.getTracking(trackingId);

    if (!tracking) {
      return null;
    }

    let details: any = {};
    try {
      details = JSON.parse(tracking.reason || '{}');
    } catch (e) {}

    return {
      email: details.email,
      unsubscribed: details.unsubscribed || false,
      preferences: {
        marketingEmails: !details.unsubscribed,
        eventUpdates: true,
        deadlineReminders: true,
        teamNotifications: true,
      },
    };
  }

  async updateEmailPreferences(token: string, preferences: any) {
    const trackingId = this.decodeUnsubscribeToken(token);
    const tracking = await this.getTracking(trackingId);

    if (!tracking) {
      return { success: false, message: 'Invalid token' };
    }

    let details: any = {};
    try {
      details = JSON.parse(tracking.reason || '{}');
    } catch (e) {}

    // Update preferences
    details.preferences = preferences;
    details.preferencesUpdatedAt = new Date().toISOString();

    await this.prisma.auditEvent.update({
      where: { id: tracking.id },
      data: { reason: JSON.stringify(details) },
    });

    return {
      success: true,
      message: 'Preferences updated',
      preferences,
    };
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    const unsubscribe = await this.prisma.auditEvent.findFirst({
      where: {
        action: 'EMAIL_UNSUBSCRIBE',
        reason: { contains: email },
      },
    });

    return !!unsubscribe;
  }

  private async getTracking(trackingId: string) {
    return this.prisma.auditEvent.findFirst({
      where: {
        action: 'EMAIL_TRACKING',
        reason: { contains: trackingId },
      },
    });
  }

  private decodeUnsubscribeToken(token: string): string {
    return token;
  }

  private async storeUnsubscribePreference(email: string) {
    await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_UNSUBSCRIBE',
        actorId: 'system',
        actorRole: 'PARTICIPANT',
        resourceType: 'EMAIL',
        resourceId: email,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          email,
          unsubscribedAt: new Date().toISOString(),
          reason: 'user_request',
        }),
      },
    });
  }
}
