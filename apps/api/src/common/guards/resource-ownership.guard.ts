import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { Role } from '../types';

/**
 * Resource Ownership Guard
 * Ensures users can only access/modify their own resources
 * Implements multi-tenant data isolation
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userRole: Role = user.role as Role;

    // Admin and Organizer bypass ownership checks
    if (userRole === Role.ADMIN || userRole === Role.ORGANIZER) {
      return true;
    }

    const resourceType = request.params?.resourceType || this.inferResourceType(request.url);
    const resourceId = request.params?.id || request.params?.projectId || request.params?.teamId;

    if (!resourceId) {
      return true; // No specific resource, let other guards handle
    }

    // Check ownership based on resource type
    const isOwner = await this.checkOwnership(user.id, userRole, resourceType, resourceId);

    if (!isOwner) {
      // Audit unauthorized access attempt
      try {
        await this.prisma.auditEvent.create({
          data: {
            actorId: user.id,
            actorRole: userRole,
            action: 'UNAUTHORIZED_RESOURCE_ACCESS',
            resourceType: resourceType,
            resourceId: resourceId,
            reason: `User attempted to access resource they don't own`,
            requestId: request.headers['x-request-id'] || 'REQ-OWN-403',
          },
        });
      } catch (e) {
        // Continue to ensure 403 is thrown
      }

      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }

  private inferResourceType(url: string): string {
    if (url.includes('/projects/')) return 'project';
    if (url.includes('/teams/')) return 'team';
    if (url.includes('/ballots/')) return 'ballot';
    if (url.includes('/tickets/')) return 'ticket';
    return 'unknown';
  }

  private async checkOwnership(
    userId: string,
    userRole: Role,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'project':
          return await this.checkProjectOwnership(userId, userRole, resourceId);
        
        case 'team':
          return await this.checkTeamMembership(userId, resourceId);
        
        case 'ballot':
          return await this.checkBallotOwnership(userId, userRole, resourceId);
        
        case 'ticket':
          return await this.checkTicketOwnership(userId, resourceId);
        
        default:
          return false;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return false;
    }
  }

  private async checkProjectOwnership(userId: string, userRole: Role, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
        assignments: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // PARTICIPANT: Only if they're in the team
    if (userRole === Role.PARTICIPANT) {
      return project.team.members.some(member => member.userId === userId);
    }

    // JUDGE: Only if assigned to this project
    if (userRole === Role.JUDGE) {
      return project.assignments.some(
        assignment => assignment.judgeId === userId && assignment.status === 'ACTIVE'
      );
    }

    return false;
  }

  private async checkTeamMembership(userId: string, teamId: string): Promise<boolean> {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId,
        },
      },
    });

    return !!membership;
  }

  private async checkBallotOwnership(userId: string, userRole: Role, ballotId: string): Promise<boolean> {
    const ballot = await this.prisma.ballot.findUnique({
      where: { id: ballotId },
    });

    if (!ballot) {
      throw new NotFoundException('Ballot not found');
    }

    // Only the judge who created the ballot can access it
    return ballot.judgeId === userId;
  }

  private async checkTicketOwnership(userId: string, ticketId: string): Promise<boolean> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket.reporterId === userId;
  }
}
