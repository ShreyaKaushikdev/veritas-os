import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadstreamService } from './leadstream.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@Controller('api/v1/leadstream')
@UseGuards(AuthGuard)
export class LeadstreamController {
  constructor(private readonly leadstreamService: LeadstreamService) {}

  // ==================== EMAIL TEMPLATES ====================

  @Get('templates')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getTemplates(@Query('eventId') eventId: string, @Req() req: any) {
    return this.leadstreamService.getTemplates(eventId, req.user.id);
  }

  @Get('templates/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getTemplate(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.getTemplate(id, req.user.id);
  }

  @Post('templates')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createTemplate(
    @Body() body: {
      eventId: string;
      name: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      category: string;
      variables?: string[];
    },
    @Req() req: any,
  ) {
    return this.leadstreamService.createTemplate(body, req.user.id);
  }

  @Put('templates/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.leadstreamService.updateTemplate(id, body, req.user.id);
  }

  @Delete('templates/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.deleteTemplate(id, req.user.id);
  }

  @Post('templates/:id/preview')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async previewTemplate(
    @Param('id') id: string,
    @Body() body: { variables?: Record<string, string> },
    @Req() req: any,
  ) {
    return this.leadstreamService.previewTemplate(id, body.variables, req.user.id);
  }

  // ==================== RECIPIENT LISTS ====================

  @Get('lists')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getLists(@Query('eventId') eventId: string, @Req() req: any) {
    return this.leadstreamService.getLists(eventId, req.user.id);
  }

  @Post('lists')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createList(
    @Body() body: {
      eventId: string;
      name: string;
      description?: string;
      filters?: any;
    },
    @Req() req: any,
  ) {
    return this.leadstreamService.createList(body, req.user.id);
  }

  @Post('lists/:id/recipients')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async addRecipientsToList(
    @Param('id') id: string,
    @Body() body: { emails?: string[]; userIds?: string[]; csvData?: string },
    @Req() req: any,
  ) {
    return this.leadstreamService.addRecipientsToList(id, body, req.user.id);
  }

  @Post('lists/:id/import-csv')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.leadstreamService.importCSVToList(id, file, req.user.id);
  }

  @Get('lists/:id/recipients')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getListRecipients(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.leadstreamService.getListRecipients(
      id,
      parseInt(page) || 1,
      parseInt(limit) || 50,
      req.user.id,
    );
  }

  @Delete('lists/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async deleteList(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.deleteList(id, req.user.id);
  }

  // ==================== CAMPAIGNS ====================

  @Get('campaigns')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getCampaigns(@Query('eventId') eventId: string, @Req() req: any) {
    return this.leadstreamService.getCampaigns(eventId, req.user.id);
  }

  @Get('campaigns/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getCampaign(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.getCampaign(id, req.user.id);
  }

  @Post('campaigns')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createCampaign(
    @Body() body: {
      eventId: string;
      name: string;
      description?: string;
      templateId: string;
      listId?: string;
      recipients?: string[];
      filters?: any;
      scheduledAt?: string;
      variables?: Record<string, string>;
    },
    @Req() req: any,
  ) {
    return this.leadstreamService.createCampaign(body, req.user.id);
  }

  @Post('campaigns/:id/send')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async sendCampaign(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.sendCampaign(id, req.user.id);
  }

  @Post('campaigns/:id/schedule')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async scheduleCampaign(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
    @Req() req: any,
  ) {
    return this.leadstreamService.scheduleCampaign(id, body.scheduledAt, req.user.id);
  }

  @Post('campaigns/:id/cancel')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async cancelCampaign(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.cancelCampaign(id, req.user.id);
  }

  @Get('campaigns/:id/stats')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getCampaignStats(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.getCampaignStats(id, req.user.id);
  }

  @Delete('campaigns/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async deleteCampaign(@Param('id') id: string, @Req() req: any) {
    return this.leadstreamService.deleteCampaign(id, req.user.id);
  }

  // ==================== QUICK SEND ====================

  @Post('send-bulk')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async sendBulkEmail(
    @Body() body: {
      eventId: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      recipients: string[];
      scheduledAt?: string;
      trackOpens?: boolean;
      trackClicks?: boolean;
    },
    @Req() req: any,
  ) {
    return this.leadstreamService.sendBulkEmail(body, req.user.id);
  }

  @Post('send-to-group')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async sendToGroup(
    @Body() body: {
      eventId: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      targetGroup: 'all' | 'participants' | 'judges' | 'teams' | 'custom';
      filters?: any;
      scheduledAt?: string;
    },
    @Req() req: any,
  ) {
    return this.leadstreamService.sendToGroup(body, req.user.id);
  }

  // ==================== EMAIL TRACKING ====================

  @Get('tracking/opens/:trackingId')
  async trackOpen(@Param('trackingId') trackingId: string) {
    await this.leadstreamService.trackOpen(trackingId);
    // Return 1x1 transparent pixel
    return Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
  }

  @Get('tracking/clicks/:trackingId')
  async trackClick(
    @Param('trackingId') trackingId: string,
    @Query('url') url: string,
  ) {
    await this.leadstreamService.trackClick(trackingId, url);
    // Redirect to actual URL
    return { redirectUrl: url };
  }

  // ==================== ANALYTICS & REPORTING ====================

  @Get('analytics/overview')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getAnalyticsOverview(@Query('eventId') eventId: string, @Req() req: any) {
    return this.leadstreamService.getAnalyticsOverview(eventId, req.user.id);
  }

  @Get('analytics/engagement')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getEngagementMetrics(
    @Query('eventId') eventId: string,
    @Query('days') days: string,
    @Req() req: any,
  ) {
    return this.leadstreamService.getEngagementMetrics(
      eventId,
      parseInt(days) || 30,
      req.user.id,
    );
  }

  @Get('analytics/campaigns/:id/recipients')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getCampaignRecipientDetails(
    @Param('id') id: string,
    @Query('status') status: string,
    @Req() req: any,
  ) {
    return this.leadstreamService.getCampaignRecipientDetails(id, status, req.user.id);
  }

  // ==================== UNSUBSCRIBE & PREFERENCES ====================

  @Post('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string) {
    return this.leadstreamService.unsubscribe(token);
  }

  @Get('preferences/:token')
  async getEmailPreferences(@Param('token') token: string) {
    return this.leadstreamService.getEmailPreferences(token);
  }

  @Put('preferences/:token')
  async updateEmailPreferences(
    @Param('token') token: string,
    @Body() body: any,
  ) {
    return this.leadstreamService.updateEmailPreferences(token, body);
  }

  // ==================== TEMPLATES LIBRARY ====================

  @Get('template-library')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getTemplateLibrary() {
    return this.leadstreamService.getTemplateLibrary();
  }

  @Post('template-library/:id/clone')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async cloneTemplateFromLibrary(
    @Param('id') id: string,
    @Body() body: { eventId: string; name: string },
    @Req() req: any,
  ) {
    return this.leadstreamService.cloneTemplateFromLibrary(id, body, req.user.id);
  }
}
