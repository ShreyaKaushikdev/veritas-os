import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Role } from '../types';

/**
 * Data Isolation Service
 * Enforces multi-tenant architecture and data segregation
 * Ensures users only see data relevant to their role
 */
@Injectable()
export class DataIsolationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get filtered project query based on user role
   * CRITICAL: Enforces data isolation between roles
   */
  getProjectFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
        // Admin sees everything
        return eventId ? { eventId } : {};

      case Role.ORGANIZER:
        // Organizer sees all projects in their events
        if (eventId) {
          return { eventId };
        }
        // Get all events they organize
        return {
          event: {
            memberships: {
              some: {
                userId,
                role: Role.ORGANIZER,
              },
            },
          },
        };

      case Role.JUDGE:
        // CRITICAL: Judges ONLY see assigned projects
        return {
          AND: [
            eventId ? { eventId } : {},
            {
              assignments: {
                some: {
                  judgeId: userId,
                  status: 'ACTIVE',
                },
              },
            },
          ],
        };

      case Role.PARTICIPANT:
        // Participants ONLY see their own team's projects
        return {
          AND: [
            eventId ? { eventId } : {},
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        };

      default:
        // VISITOR or unknown - no access
        return { id: 'no-access' };
    }
  }

  /**
   * Get filtered ballot query based on user role
   */
  getBallotFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
      case Role.ORGANIZER:
        // Can see all ballots in event
        return eventId ? { eventId } : {};

      case Role.JUDGE:
        // ONLY see their own ballots
        return {
          AND: [
            eventId ? { eventId } : {},
            { judgeId: userId },
          ],
        };

      default:
        // Participants and visitors CANNOT see ballots
        return { id: 'no-access' };
    }
  }

  /**
   * Get filtered team query based on user role
   */
  getTeamFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
      case Role.ORGANIZER:
        // Can see all teams in event
        return eventId ? { eventId } : {};

      case Role.PARTICIPANT:
        // Only see teams they're members of
        return {
          AND: [
            eventId ? { eventId } : {},
            {
              members: {
                some: { userId },
              },
            },
          ],
        };

      case Role.JUDGE:
      default:
        // Judges and visitors CANNOT see team information
        return { id: 'no-access' };
    }
  }

  /**
   * Get filtered user query based on user role
   */
  getUserFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
        // Can see all users
        return {};

      case Role.ORGANIZER:
        // Can see all users in their events
        if (eventId) {
          return {
            memberships: {
              some: { eventId },
            },
          };
        }
        return {
          memberships: {
            some: {
              event: {
                memberships: {
                  some: {
                    userId,
                    role: Role.ORGANIZER,
                  },
                },
              },
            },
          },
        };

      default:
        // Other roles can only see their own profile
        return { id: userId };
    }
  }

  /**
   * Get filtered chat query based on user role
   */
  getChatFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
      case Role.ORGANIZER:
        // Can see all chat in event
        return eventId ? { eventId } : {};

      case Role.PARTICIPANT:
        // Can see public chat and their team's chat
        return {
          AND: [
            eventId ? { eventId } : {},
            {
              OR: [
                { projectId: null }, // Public lounge
                {
                  project: {
                    team: {
                      members: {
                        some: { userId },
                      },
                    },
                  },
                },
              ],
            },
          ],
        };

      case Role.JUDGE:
        // ONLY public chat, NO team channels
        return {
          AND: [
            eventId ? { eventId } : {},
            { projectId: null }, // Only public lounge
          ],
        };

      default:
        // Visitors see only public chat
        return {
          AND: [
            eventId ? { eventId } : {},
            { projectId: null },
          ],
        };
    }
  }

  /**
   * Get filtered ticket query based on user role
   */
  getTicketFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
        // Can see all tickets
        return eventId ? { eventId } : {};

      case Role.ORGANIZER:
        // Can see all tickets in their events
        return eventId ? { eventId } : {};

      default:
        // Users can only see their own tickets
        return {
          AND: [
            eventId ? { eventId } : {},
            { reporterId: userId },
          ],
        };
    }
  }

  /**
   * Get filtered assignment query based on user role
   */
  getAssignmentFilter(userId: string, userRole: Role, eventId?: string) {
    switch (userRole) {
      case Role.ADMIN:
      case Role.ORGANIZER:
        // Can see all assignments
        return eventId ? { eventId } : {};

      case Role.JUDGE:
        // Can only see their own assignments
        return {
          AND: [
            eventId ? { eventId } : {},
            { judgeId: userId },
          ],
        };

      default:
        // Participants and visitors cannot see assignments
        return { id: 'no-access' };
    }
  }

  /**
   * Get filtered event query based on user role
   */
  getEventFilter(userId: string, userRole: Role) {
    switch (userRole) {
      case Role.ADMIN:
        // Can see all events
        return {};

      case Role.ORGANIZER:
        // Can see events they organize
        return {
          memberships: {
            some: {
              userId,
              role: Role.ORGANIZER,
            },
          },
        };

      case Role.JUDGE:
        // Can see events they're judging
        return {
          memberships: {
            some: {
              userId,
              role: Role.JUDGE,
            },
          },
        };

      case Role.PARTICIPANT:
        // Can see events they're participating in
        return {
          memberships: {
            some: { userId },
          },
        };

      default:
        // Visitors see published events only
        return {
          status: {
            in: ['RESULTS_PUBLISHED', 'REGISTRATION_OPEN', 'SUBMISSION_OPEN'],
          },
        };
    }
  }

  /**
   * Check if user can access a specific resource
   */
  async canAccessProject(userId: string, userRole: Role, projectId: string): Promise<boolean> {
    const filter = this.getProjectFilter(userId, userRole);
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ...filter,
      },
    });
    return !!project;
  }

  async canAccessBallot(userId: string, userRole: Role, ballotId: string): Promise<boolean> {
    const filter = this.getBallotFilter(userId, userRole);
    const ballot = await this.prisma.ballot.findFirst({
      where: {
        id: ballotId,
        ...filter,
      },
    });
    return !!ballot;
  }

  async canAccessTeam(userId: string, userRole: Role, teamId: string): Promise<boolean> {
    const filter = this.getTeamFilter(userId, userRole);
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        ...filter,
      },
    });
    return !!team;
  }

  /**
   * Sanitize user data based on viewer's role
   * Removes sensitive information that shouldn't be exposed
   */
  sanitizeUserData(user: any, viewerRole: Role) {
    const sanitized = { ...user };

    // Remove sensitive fields for non-admin roles
    if (viewerRole !== Role.ADMIN) {
      delete sanitized.passwordHash;
      delete sanitized.otp;
      delete sanitized.otpExpiresAt;
      delete sanitized.sessions;
    }

    // Judges shouldn't see participant emails
    if (viewerRole === Role.JUDGE) {
      delete sanitized.email;
    }

    return sanitized;
  }

  /**
   * Sanitize project data based on viewer's role
   */
  sanitizeProjectData(project: any, viewerRole: Role, userId: string) {
    const sanitized = { ...project };

    // Hide team information from judges
    if (viewerRole === Role.JUDGE) {
      delete sanitized.team;
      delete sanitized.teamId;
      // Judges review projects blind
      if (sanitized.event?.blindReviewMode) {
        delete sanitized.title;
        sanitized.title = `Project #${sanitized.id.slice(0, 8)}`;
      }
    }

    // Participants shouldn't see ballot information
    if (viewerRole === Role.PARTICIPANT) {
      delete sanitized.ballots;
      delete sanitized.assignments;
    }

    return sanitized;
  }
}
