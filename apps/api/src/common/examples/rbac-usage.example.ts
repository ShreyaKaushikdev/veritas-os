/**
 * RBAC Usage Examples
 * Demonstrates how to use the permission system in controllers
 */

import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ResourceOwnershipGuard } from '../guards/resource-ownership.guard';
import { Permissions } from '../permissions/permissions.decorator';
import { Permission } from '../permissions/permission.types';
import { DataIsolationService } from '../services/data-isolation.service';
import { Role } from '../types';

/**
 * Example: Projects Controller with RBAC
 */
@Controller('api/v1/events/:eventId/projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectsControllerExample {
  constructor(private dataIsolation: DataIsolationService) {}

  /**
   * LIST PROJECTS
   * Different roles see different data:
   * - PARTICIPANT: Only their team's projects
   * - JUDGE: Only assigned projects
   * - ORGANIZER: All projects in event
   * - ADMIN: All projects
   */
  @Get()
  @Permissions(Permission.PROJECT_READ_OWN, Permission.PROJECT_READ_ASSIGNED, Permission.PROJECT_READ_ALL)
  async listProjects(@Req() req: any, @Param('eventId') eventId: string) {
    const user = req.user;
    const userRole: Role = user.role;

    // Apply data isolation filter
    const filter = this.dataIsolation.getProjectFilter(user.id, userRole, eventId);

    // Query with filter (pseudo-code)
    // const projects = await this.prisma.project.findMany({ where: filter });

    // Sanitize data based on viewer role
    // const sanitized = projects.map(p => this.dataIsolation.sanitizeProjectData(p, userRole, user.id));

    // return sanitized;
    return { message: 'Projects list with role-based filtering' };
  }

  /**
   * GET SINGLE PROJECT
   * Ownership is automatically checked by ResourceOwnershipGuard
   */
  @Get(':id')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.PROJECT_READ_OWN, Permission.PROJECT_READ_ASSIGNED)
  async getProject(@Req() req: any, @Param('id') projectId: string) {
    // If we reach here, user has permission to view this project
    return { message: 'Project details' };
  }

  /**
   * CREATE PROJECT
   * Only participants can create projects
   */
  @Post()
  @Permissions(Permission.PROJECT_CREATE)
  async createProject(@Req() req: any, @Body() createDto: any) {
    const user = req.user;
    
    // Only allow creating for own team
    // Validate team membership before creating
    
    return { message: 'Project created' };
  }

  /**
   * UPDATE PROJECT
   * Participants can update their own projects
   * Organizers can update any project
   */
  @Put(':id')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.PROJECT_UPDATE_OWN, Permission.PROJECT_UPDATE_ALL)
  async updateProject(
    @Req() req: any,
    @Param('id') projectId: string,
    @Body() updateDto: any
  ) {
    // ResourceOwnershipGuard ensures user owns this project (unless Organizer/Admin)
    return { message: 'Project updated' };
  }

  /**
   * DELETE PROJECT
   * Only participants can delete their own projects
   */
  @Delete(':id')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.PROJECT_DELETE_OWN)
  async deleteProject(@Req() req: any, @Param('id') projectId: string) {
    return { message: 'Project deleted' };
  }
}

/**
 * Example: Ballots Controller (Judge-only operations)
 */
@Controller('api/v1/events/:eventId/ballots')
@UseGuards(AuthGuard, PermissionsGuard)
export class BallotsControllerExample {
  constructor(private dataIsolation: DataIsolationService) {}

  /**
   * LIST BALLOTS
   * - JUDGE: Only their own ballots
   * - ORGANIZER: All ballots in event
   * - PARTICIPANT: NO ACCESS
   */
  @Get()
  @Permissions(Permission.BALLOT_READ_OWN, Permission.BALLOT_READ_ALL)
  async listBallots(@Req() req: any, @Param('eventId') eventId: string) {
    const user = req.user;
    const userRole: Role = user.role;

    // Apply data isolation filter
    const filter = this.dataIsolation.getBallotFilter(user.id, userRole, eventId);

    return { message: 'Ballots list with role-based filtering' };
  }

  /**
   * CREATE BALLOT
   * Only judges can create ballots for assigned projects
   */
  @Post()
  @Permissions(Permission.BALLOT_CREATE)
  async createBallot(@Req() req: any, @Body() createDto: any) {
    const user = req.user;
    
    // Verify judge is assigned to this project
    const isAssigned = await this.dataIsolation.canAccessProject(
      user.id,
      user.role,
      createDto.projectId
    );

    if (!isAssigned) {
      throw new Error('You are not assigned to judge this project');
    }

    return { message: 'Ballot created' };
  }

  /**
   * UPDATE BALLOT
   * Judges can only update their own ballots
   */
  @Put(':id')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.BALLOT_UPDATE_OWN)
  async updateBallot(
    @Req() req: any,
    @Param('id') ballotId: string,
    @Body() updateDto: any
  ) {
    return { message: 'Ballot updated' };
  }

  /**
   * SUBMIT BALLOT
   * Locks ballot after submission
   */
  @Post(':id/submit')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.BALLOT_SUBMIT)
  async submitBallot(@Req() req: any, @Param('id') ballotId: string) {
    return { message: 'Ballot submitted and locked' };
  }
}

/**
 * Example: Teams Controller (Participant operations)
 */
@Controller('api/v1/events/:eventId/teams')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamsControllerExample {
  constructor(private dataIsolation: DataIsolationService) {}

  /**
   * LIST TEAMS
   * - PARTICIPANT: Only teams they're members of
   * - ORGANIZER: All teams in event
   * - JUDGE: NO ACCESS (data isolation)
   */
  @Get()
  @Permissions(Permission.TEAM_READ_OWN, Permission.TEAM_READ_ALL)
  async listTeams(@Req() req: any, @Param('eventId') eventId: string) {
    const user = req.user;
    const userRole: Role = user.role;

    // Apply data isolation filter
    const filter = this.dataIsolation.getTeamFilter(user.id, userRole, eventId);

    // Judges will get empty results due to filter
    return { message: 'Teams list with role-based filtering' };
  }

  /**
   * CREATE TEAM
   * Participants can create teams
   */
  @Post()
  @Permissions(Permission.TEAM_CREATE)
  async createTeam(@Req() req: any, @Body() createDto: any) {
    return { message: 'Team created' };
  }

  /**
   * ADD TEAM MEMBER
   * Only team members can add other members
   */
  @Post(':id/members')
  @UseGuards(ResourceOwnershipGuard)
  @Permissions(Permission.TEAM_MANAGE_MEMBERS)
  async addMember(
    @Req() req: any,
    @Param('id') teamId: string,
    @Body() memberDto: any
  ) {
    return { message: 'Member added to team' };
  }
}

/**
 * Example: Organizer-only Operations
 */
@Controller('api/v1/events/:eventId/admin')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizerPanelExample {
  /**
   * ANALYTICS DASHBOARD
   * Only organizers and admins can access
   */
  @Get('analytics')
  @Permissions(Permission.EVENT_VIEW_ANALYTICS)
  async getAnalytics(@Param('eventId') eventId: string) {
    return {
      message: 'Event analytics',
      totalProjects: 0,
      totalJudges: 0,
      ballotProgress: 0,
    };
  }

  /**
   * MANAGE ASSIGNMENTS
   * Only organizers can assign judges to projects
   */
  @Post('assignments')
  @Permissions(Permission.ASSIGNMENT_CREATE)
  async createAssignment(@Body() assignmentDto: any) {
    return { message: 'Judge assigned to project' };
  }

  /**
   * PUBLISH RESULTS
   * Only organizers can publish final rankings
   */
  @Post('rankings/:runId/publish')
  @Permissions(Permission.RANKING_PUBLISH)
  async publishResults(@Param('runId') runId: string) {
    return { message: 'Results published' };
  }

  /**
   * VIEW ALL TICKETS
   * Organizers see all support tickets
   */
  @Get('tickets')
  @Permissions(Permission.TICKET_READ_ALL)
  async getAllTickets(@Req() req: any, @Param('eventId') eventId: string) {
    return { message: 'All support tickets in event' };
  }
}

/**
 * Example: Chat with Role-based Access
 */
@Controller('api/v1/events/:eventId/chat')
@UseGuards(AuthGuard, PermissionsGuard)
export class ChatControllerExample {
  constructor(private dataIsolation: DataIsolationService) {}

  /**
   * GET CHAT MESSAGES
   * Different roles see different channels:
   * - PARTICIPANT: Public lounge + their team channel
   * - JUDGE: Only public lounge (NO team channels)
   * - ORGANIZER: All channels
   */
  @Get()
  @Permissions(Permission.CHAT_READ_PUBLIC, Permission.CHAT_READ_PROJECT, Permission.CHAT_READ_ALL)
  async getChatMessages(@Req() req: any, @Param('eventId') eventId: string) {
    const user = req.user;
    const userRole: Role = user.role;

    // Apply data isolation filter
    const filter = this.dataIsolation.getChatFilter(user.id, userRole, eventId);

    return { message: 'Chat messages with role-based filtering' };
  }

  /**
   * SEND MESSAGE
   * All authenticated users can send messages
   */
  @Post()
  @Permissions(Permission.CHAT_SEND)
  async sendMessage(@Req() req: any, @Body() messageDto: any) {
    const user = req.user;
    
    // If sending to team channel, verify membership
    if (messageDto.projectId) {
      const canAccess = await this.dataIsolation.canAccessTeam(
        user.id,
        user.role,
        messageDto.projectId
      );
      
      if (!canAccess) {
        throw new Error('You cannot send messages to this channel');
      }
    }

    return { message: 'Message sent' };
  }

  /**
   * MODERATE CHAT
   * Only organizers can delete messages
   */
  @Delete(':messageId')
  @Permissions(Permission.CHAT_MODERATE)
  async deleteMessage(@Param('messageId') messageId: string) {
    return { message: 'Message deleted' };
  }
}
