import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IdeaRefinementService } from './services/idea-refinement.service';
import { DeadlineReminderService } from './services/deadline-reminder.service';
import { TeamCollaborationService } from './services/team-collaboration.service';
import { ProjectValidationService } from './services/project-validation.service';
import { TeamMatchingService } from './services/team-matching.service';
import { BlindSpotDetectionService } from './services/blindspot-detection.service';
import { VersionControlService } from './services/version-control.service';
import { SubmissionReceiptService } from './services/submission-receipt.service';
import { NotificationService } from './services/notification.service';

@Injectable()
export class ParticipantAutomationService {
  constructor(
    private prisma: PrismaService,
    private ideaRefinement: IdeaRefinementService,
    private deadlineReminder: DeadlineReminderService,
    private teamCollaboration: TeamCollaborationService,
    private projectValidation: ProjectValidationService,
    private teamMatching: TeamMatchingService,
    private blindspotDetection: BlindSpotDetectionService,
    private versionControl: VersionControlService,
    private submissionReceipt: SubmissionReceiptService,
    private notification: NotificationService,
  ) {}

  // ==================== IDEA REFINEMENT ====================

  async analyzeIdeaRealtime(eventId: string, data: any, userId: string) {
    // Verify user has access to this event
    await this.verifyEventAccess(eventId, userId);

    const analysis = await this.ideaRefinement.analyzeIdea(eventId, data);
    
    // Store analysis for history
    if (data.projectId) {
      await this.ideaRefinement.saveAnalysisHistory(data.projectId, userId, analysis);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      analysis,
    };
  }

  async getIdeaAnalysisHistory(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.ideaRefinement.getAnalysisHistory(projectId);
  }

  // ==================== PROJECT VALIDATION ====================

  async validateProject(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.projectValidation.validateProject(projectId);
  }

  async preFlightSubmissionCheck(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.projectValidation.preFlightCheck(projectId);
  }

  // ==================== VERSION CONTROL ====================

  async getProjectVersionHistory(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.versionControl.getVersionHistory(projectId);
  }

  async createManualSnapshot(projectId: string, userId: string, label?: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.versionControl.createSnapshot(projectId, userId, label);
  }

  async restoreVersion(projectId: string, versionId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.versionControl.restoreVersion(projectId, versionId, userId);
  }

  // ==================== TEAM COLLABORATION ====================

  async getTeamActivityDigest(teamId: string, days: number, userId: string) {
    await this.verifyTeamAccess(teamId, userId);
    return this.teamCollaboration.generateActivityDigest(teamId, days);
  }

  async getCollaborationInsights(teamId: string, userId: string) {
    await this.verifyTeamAccess(teamId, userId);
    return this.teamCollaboration.getCollaborationInsights(teamId);
  }

  // ==================== TEAM MATCHING ====================

  async getTeamRecommendations(eventId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);
    return this.teamMatching.getRecommendations(eventId, userId);
  }

  async updateParticipantProfile(targetUserId: string, data: any, requestingUserId: string) {
    if (targetUserId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s profile');
    }
    return this.teamMatching.updateUserProfile(targetUserId, data);
  }

  // ==================== DEADLINE MANAGEMENT ====================

  async getUpcomingDeadlines(eventId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);
    return this.deadlineReminder.getUpcomingDeadlines(eventId, userId);
  }

  async updateNotificationPreferences(targetUserId: string, preferences: any, requestingUserId: string) {
    if (targetUserId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s preferences');
    }
    return this.notification.updatePreferences(targetUserId, preferences);
  }

  // ==================== SUBMISSION RECEIPTS ====================

  async getSubmissionReceipt(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.submissionReceipt.generateReceipt(projectId);
  }

  async generateReceiptPDF(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.submissionReceipt.generatePDF(projectId);
  }

  // ==================== BLIND SPOT DETECTION ====================

  async scanProjectBlindspots(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);
    return this.blindspotDetection.scanProject(projectId);
  }

  // ==================== DASHBOARD ====================

  async getParticipantDashboard(targetUserId: string, requestingUserId: string) {
    if (targetUserId !== requestingUserId) {
      // Check if requesting user is organizer/admin
      const requestingUser = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
      });
      
      if (!['ORGANIZER', 'ADMIN'].includes(requestingUser?.role)) {
        throw new ForbiddenException('Cannot view another user\'s dashboard');
      }
    }

    const [teams, projects, deadlines, notifications, activitySummary] = await Promise.all([
      this.getUserTeams(targetUserId),
      this.getUserProjects(targetUserId),
      this.deadlineReminder.getUpcomingDeadlinesForUser(targetUserId),
      this.notification.getRecentNotifications(targetUserId),
      this.getActivitySummary(targetUserId),
    ]);

    return {
      user: await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, role: true },
      }),
      teams,
      projects,
      deadlines,
      notifications,
      activitySummary,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== WEBHOOKS ====================

  async handleSlackWebhook(body: any) {
    return this.notification.handleSlackWebhook(body);
  }

  async handleDiscordWebhook(body: any) {
    return this.notification.handleDiscordWebhook(body);
  }

  // ==================== SMS TESTING & PREFERENCES ====================

  async sendTestSMS(phone: string, customMessage: string | undefined, userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Format phone number if needed
    const formattedPhone = this.formatPhoneNumber(phone);

    // Default test message
    const message = customMessage || 
      `🎯 Test SMS from DOGFOOD OS!\n\nIf you received this message, your SMS integration is working perfectly!\n\nSent by: ${user.name}\nTime: ${new Date().toLocaleString()}\n\nReply STOP to unsubscribe.`;

    // Send via notification service
    const success = await this.notification.sendTestSMS(formattedPhone, message);

    return {
      success,
      message: success 
        ? `✅ SMS sent successfully to ${formattedPhone}!` 
        : '❌ SMS failed to send. Check your Twilio configuration.',
      phone: formattedPhone,
      timestamp: new Date().toISOString(),
      twilioConfigured: this.isTwilioConfigured(),
      instructions: success 
        ? 'Check your phone for the test message!' 
        : 'Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in your .env file.',
    };
  }

  async updateSMSPreferences(targetUserId: string, data: any, requestingUserId: string) {
    if (targetUserId !== requestingUserId) {
      throw new ForbiddenException('Cannot update another user\'s SMS preferences');
    }

    // Validate phone number format if provided
    if (data.phone) {
      data.phone = this.formatPhoneNumber(data.phone);
    }

    // Update preferences via notification service
    const currentPrefs = await this.notification.getPreferences(targetUserId);
    const updatedPrefs = {
      ...currentPrefs,
      sms: data.enableSMS,
      phone: data.phone || currentPrefs.phone,
    };

    await this.notification.updatePreferences(targetUserId, updatedPrefs);

    return {
      success: true,
      message: data.enableSMS 
        ? '✅ SMS notifications enabled!' 
        : '⚠️ SMS notifications disabled.',
      preferences: updatedPrefs,
      twilioConfigured: this.isTwilioConfigured(),
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');

    // If doesn't start with +, assume US and add +1
    if (!formatted.startsWith('+')) {
      formatted = `+1${formatted}`;
    }

    // Validate length (should be at least 11 chars with country code)
    if (formatted.length < 11) {
      throw new Error('Invalid phone number format. Use format: +1234567890');
    }

    return formatted;
  }

  private isTwilioConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  // ==================== PRIVATE HELPERS ====================

  private async verifyEventAccess(eventId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { eventId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('No access to this event');
    }
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: { include: { members: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember = project.team.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('No access to this project');
    }
  }

  private async verifyTeamAccess(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('No access to this team');
    }
  }

  private async getUserTeams(userId: string) {
    return this.prisma.team.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        event: { select: { id: true, name: true, status: true } },
        project: true,
      },
    });
  }

  private async getUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        team: { members: { some: { userId } } },
      },
      include: {
        team: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async getActivitySummary(userId: string) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const [projectUpdates, teamActivity, notifications] = await Promise.all([
      this.prisma.project.count({
        where: {
          team: { members: { some: { userId } } },
          updatedAt: { gte: last7Days },
        },
      }),
      this.prisma.chatMessage.count({
        where: {
          authorId: userId,
          createdAt: { gte: last7Days },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          actorId: userId,
          occurredAt: { gte: last7Days },
        },
      }),
    ]);

    return {
      last7Days: {
        projectUpdates,
        teamMessages: teamActivity,
        notifications,
      },
    };
  }
}
