import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailTemplateService } from './services/email-template.service';
import { BulkEmailService } from './services/bulk-email.service';
import { CampaignService } from './services/campaign.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailSchedulerService } from './services/email-scheduler.service';
import { ListManagementService } from './services/list-management.service';

@Injectable()
export class LeadstreamService {
  constructor(
    private prisma: PrismaService,
    private emailTemplate: EmailTemplateService,
    private bulkEmail: BulkEmailService,
    private campaign: CampaignService,
    private tracking: EmailTrackingService,
    private scheduler: EmailSchedulerService,
    private listManagement: ListManagementService,
  ) {}

  // ==================== EMAIL TEMPLATES ====================

  async getTemplates(eventId: string, userId: string) {
    await this.verifyOrganizerAccess(eventId, userId);
    return this.emailTemplate.getTemplates(eventId);
  }

  async getTemplate(id: string, userId: string) {
    const template = await this.emailTemplate.getTemplate(id);
    await this.verifyOrganizerAccess(template.eventId, userId);
    return template;
  }

  async createTemplate(data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.emailTemplate.createTemplate(data, userId);
  }

  async updateTemplate(id: string, data: any, userId: string) {
    const template = await this.emailTemplate.getTemplate(id);
    await this.verifyOrganizerAccess(template.eventId, userId);
    return this.emailTemplate.updateTemplate(id, data);
  }

  async deleteTemplate(id: string, userId: string) {
    const template = await this.emailTemplate.getTemplate(id);
    await this.verifyOrganizerAccess(template.eventId, userId);
    return this.emailTemplate.deleteTemplate(id);
  }

  async previewTemplate(id: string, variables: Record<string, string> | undefined, userId: string) {
    const template = await this.emailTemplate.getTemplate(id);
    await this.verifyOrganizerAccess(template.eventId, userId);
    return this.emailTemplate.renderTemplate(template, variables || {});
  }

  // ==================== RECIPIENT LISTS ====================

  async getLists(eventId: string, userId: string) {
    await this.verifyOrganizerAccess(eventId, userId);
    return this.listManagement.getLists(eventId);
  }

  async createList(data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.listManagement.createList(data, userId);
  }

  async addRecipientsToList(listId: string, data: any, userId: string) {
    const list = await this.listManagement.getList(listId);
    await this.verifyOrganizerAccess(list.eventId, userId);
    return this.listManagement.addRecipients(listId, data);
  }

  async importCSVToList(listId: string, file: any, userId: string) {
    const list = await this.listManagement.getList(listId);
    await this.verifyOrganizerAccess(list.eventId, userId);
    return this.listManagement.importCSV(listId, file);
  }

  async getListRecipients(listId: string, page: number, limit: number, userId: string) {
    const list = await this.listManagement.getList(listId);
    await this.verifyOrganizerAccess(list.eventId, userId);
    return this.listManagement.getRecipients(listId, page, limit);
  }

  async deleteList(id: string, userId: string) {
    const list = await this.listManagement.getList(id);
    await this.verifyOrganizerAccess(list.eventId, userId);
    return this.listManagement.deleteList(id);
  }

  // ==================== CAMPAIGNS ====================

  async getCampaigns(eventId: string, userId: string) {
    await this.verifyOrganizerAccess(eventId, userId);
    return this.campaign.getCampaigns(eventId);
  }

  async getCampaign(id: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return campaign;
  }

  async createCampaign(data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.campaign.createCampaign(data, userId);
  }

  async sendCampaign(id: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.sendCampaign(id);
  }

  async scheduleCampaign(id: string, scheduledAt: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.scheduleCampaign(id, new Date(scheduledAt));
  }

  async cancelCampaign(id: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.cancelCampaign(id);
  }

  async getCampaignStats(id: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.getCampaignStats(id);
  }

  async deleteCampaign(id: string, userId: string) {
    const campaign = await this.campaign.getCampaign(id);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.deleteCampaign(id);
  }

  // ==================== QUICK SEND ====================

  async sendBulkEmail(data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.bulkEmail.sendBulk(data, userId);
  }

  async sendToGroup(data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.bulkEmail.sendToGroup(data, userId);
  }

  // ==================== EMAIL TRACKING ====================

  async trackOpen(trackingId: string) {
    return this.tracking.trackOpen(trackingId);
  }

  async trackClick(trackingId: string, url: string) {
    return this.tracking.trackClick(trackingId, url);
  }

  // ==================== ANALYTICS ====================

  async getAnalyticsOverview(eventId: string, userId: string) {
    await this.verifyOrganizerAccess(eventId, userId);
    return this.campaign.getAnalyticsOverview(eventId);
  }

  async getEngagementMetrics(eventId: string, days: number, userId: string) {
    await this.verifyOrganizerAccess(eventId, userId);
    return this.campaign.getEngagementMetrics(eventId, days);
  }

  async getCampaignRecipientDetails(campaignId: string, status: string, userId: string) {
    const campaign = await this.campaign.getCampaign(campaignId);
    await this.verifyOrganizerAccess(campaign.eventId, userId);
    return this.campaign.getRecipientDetails(campaignId, status);
  }

  // ==================== UNSUBSCRIBE ====================

  async unsubscribe(token: string) {
    return this.tracking.unsubscribe(token);
  }

  async getEmailPreferences(token: string) {
    return this.tracking.getEmailPreferences(token);
  }

  async updateEmailPreferences(token: string, preferences: any) {
    return this.tracking.updateEmailPreferences(token, preferences);
  }

  // ==================== TEMPLATE LIBRARY ====================

  async getTemplateLibrary() {
    return this.emailTemplate.getTemplateLibrary();
  }

  async cloneTemplateFromLibrary(libraryId: string, data: any, userId: string) {
    await this.verifyOrganizerAccess(data.eventId, userId);
    return this.emailTemplate.cloneFromLibrary(libraryId, data, userId);
  }

  // ==================== PRIVATE HELPERS ====================

  private async verifyOrganizerAccess(eventId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        eventId,
        userId,
        role: { in: ['ORGANIZER', 'ADMIN'] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only organizers can access Leadstream');
    }
  }
}
