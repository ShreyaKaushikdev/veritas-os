import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ParticipantAutomationService } from './participant-automation.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@Controller('api/v1/participant-automation')
@UseGuards(AuthGuard)
export class ParticipantAutomationController {
  constructor(private readonly automationService: ParticipantAutomationService) {}

  // ==================== IDEA REFINEMENT ====================
  
  @Post('events/:eventId/analyze-idea')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async analyzeIdea(
    @Param('eventId') eventId: string,
    @Body() body: { projectId?: string; description: string; title: string; tagline?: string },
    @Req() req: any,
  ) {
    return this.automationService.analyzeIdeaRealtime(eventId, body, req.user.id);
  }

  @Get('events/:eventId/projects/:projectId/idea-history')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getIdeaAnalysisHistory(
    @Param('eventId') eventId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.getIdeaAnalysisHistory(projectId, req.user.id);
  }

  // ==================== PROJECT VALIDATION ====================

  @Post('projects/:projectId/validate')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async validateProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.validateProject(projectId, req.user.id);
  }

  @Post('projects/:projectId/pre-flight-check')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async preFlightCheck(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.preFlightSubmissionCheck(projectId, req.user.id);
  }

  // ==================== VERSION CONTROL ====================

  @Get('projects/:projectId/versions')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getProjectVersions(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.getProjectVersionHistory(projectId, req.user.id);
  }

  @Post('projects/:projectId/versions/snapshot')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async createSnapshot(
    @Param('projectId') projectId: string,
    @Body() body: { label?: string },
    @Req() req: any,
  ) {
    return this.automationService.createManualSnapshot(projectId, req.user.id, body.label);
  }

  @Post('projects/:projectId/versions/:versionId/restore')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async restoreVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Req() req: any,
  ) {
    return this.automationService.restoreVersion(projectId, versionId, req.user.id);
  }

  // ==================== TEAM COLLABORATION ====================

  @Get('teams/:teamId/activity-digest')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getTeamActivityDigest(
    @Param('teamId') teamId: string,
    @Query('days') days: string,
    @Req() req: any,
  ) {
    return this.automationService.getTeamActivityDigest(teamId, parseInt(days) || 7, req.user.id);
  }

  @Get('teams/:teamId/collaboration-insights')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getCollaborationInsights(
    @Param('teamId') teamId: string,
    @Req() req: any,
  ) {
    return this.automationService.getCollaborationInsights(teamId, req.user.id);
  }

  // ==================== TEAM MATCHING ====================

  @Get('events/:eventId/team-recommendations')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getTeamRecommendations(
    @Param('eventId') eventId: string,
    @Req() req: any,
  ) {
    return this.automationService.getTeamRecommendations(eventId, req.user.id);
  }

  @Post('users/:userId/skills-profile')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async updateSkillsProfile(
    @Param('userId') userId: string,
    @Body() body: { skills: string[]; interests: string[]; timezone: string; availability: string },
    @Req() req: any,
  ) {
    return this.automationService.updateParticipantProfile(userId, body, req.user.id);
  }

  // ==================== DEADLINE MANAGEMENT ====================

  @Get('events/:eventId/deadlines')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getUpcomingDeadlines(
    @Param('eventId') eventId: string,
    @Req() req: any,
  ) {
    return this.automationService.getUpcomingDeadlines(eventId, req.user.id);
  }

  @Post('users/:userId/notification-preferences')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async updateNotificationPreferences(
    @Param('userId') userId: string,
    @Body() body: { email: boolean; inApp: boolean; slack?: boolean; discord?: boolean },
    @Req() req: any,
  ) {
    return this.automationService.updateNotificationPreferences(userId, body, req.user.id);
  }

  // ==================== SUBMISSION RECEIPTS ====================

  @Get('projects/:projectId/submission-receipt')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getSubmissionReceipt(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.getSubmissionReceipt(projectId, req.user.id);
  }

  @Get('projects/:projectId/submission-receipt/pdf')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async downloadReceiptPDF(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.generateReceiptPDF(projectId, req.user.id);
  }

  // ==================== BLIND SPOT DETECTION ====================

  @Post('projects/:projectId/blindspot-scan')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async scanForBlindspots(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.automationService.scanProjectBlindspots(projectId, req.user.id);
  }

  // ==================== DASHBOARD OVERVIEW ====================

  @Get('users/:userId/dashboard')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getParticipantDashboard(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.automationService.getParticipantDashboard(userId, req.user.id);
  }

  // ==================== WEBHOOKS & INTEGRATIONS ====================

  @Post('webhooks/slack')
  async handleSlackWebhook(@Body() body: any) {
    return this.automationService.handleSlackWebhook(body);
  }

  @Post('webhooks/discord')
  async handleDiscordWebhook(@Body() body: any) {
    return this.automationService.handleDiscordWebhook(body);
  }

  // ==================== SMS TESTING ====================

  @Post('test-sms')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async sendTestSMS(
    @Body() body: { phone: string; message?: string },
    @Req() req: any,
  ) {
    return this.automationService.sendTestSMS(body.phone, body.message, req.user.id);
  }

  @Post('users/:userId/sms-preferences')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async updateSMSPreferences(
    @Param('userId') userId: string,
    @Body() body: { enableSMS: boolean; phone?: string },
    @Req() req: any,
  ) {
    return this.automationService.updateSMSPreferences(userId, body, req.user.id);
  }
}
