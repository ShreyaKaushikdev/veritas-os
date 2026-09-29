import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TeamCollaborationService {
  constructor(private prisma: PrismaService) {}

  async generateActivityDigest(teamId: string, days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [projects, messages, events] = await Promise.all([
      this.getProjectActivity(teamId, startDate),
      this.getChatActivity(teamId, startDate),
      this.getAuditActivity(teamId, startDate),
    ]);

    return {
      teamId,
      period: { start: startDate, end: new Date(), days },
      summary: {
        projectUpdates: projects.length,
        messages: messages.length,
        events: events.length,
        activeMembers: this.countActiveMembers(projects, messages),
      },
      details: {
        projects,
        recentMessages: messages.slice(0, 10),
        recentEvents: events.slice(0, 10),
      },
    };
  }

  async getCollaborationInsights(teamId: string): Promise<any> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true } },
        project: true,
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const memberActivity = await Promise.all(
      team.members.map(async (member) => {
        const [projectEdits, messages] = await Promise.all([
          this.prisma.auditEvent.count({
            where: {
              actorId: member.userId,
              action: { in: ['PROJECT_UPDATE', 'VERSION_SNAPSHOT'] },
              occurredAt: { gte: last30Days },
            },
          }),
          this.prisma.chatMessage.count({
            where: {
              authorId: member.userId,
              createdAt: { gte: last30Days },
            },
          }),
        ]);

        return {
          user: member.user,
          activity: {
            projectEdits,
            messages,
            totalActivity: projectEdits + messages,
          },
        };
      }),
    );

    return {
      teamId,
      teamName: team.name,
      memberCount: team.members.length,
      projectCount: team.project ? 1 : 0,
      memberActivity: memberActivity.sort((a, b) => b.activity.totalActivity - a.activity.totalActivity),
      insights: this.generateInsights(memberActivity, team),
    };
  }

  private async getProjectActivity(teamId: string, startDate: Date): Promise<any[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        action: { in: ['PROJECT_CREATE', 'PROJECT_UPDATE', 'VERSION_SNAPSHOT'] },
        occurredAt: { gte: startDate },
      },
      orderBy: { occurredAt: 'desc' },
    });

    return events.map((e) => ({
      type: e.action,
      timestamp: e.occurredAt,
      userId: e.actorId,
    }));
  }

  private async getChatActivity(teamId: string, startDate: Date): Promise<any[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        projectId: teamId,
        createdAt: { gte: startDate },
      },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return messages;
  }

  private async getAuditActivity(teamId: string, startDate: Date): Promise<any[]> {
    return [];
  }

  private countActiveMembers(projects: any[], messages: any[]): number {
    const activeUserIds = new Set([
      ...projects.map((p) => p.userId || p.actorId),
      ...messages.map((m) => m.userId || m.authorId),
    ]);

    return activeUserIds.size;
  }

  private generateInsights(memberActivity: any[], team: any): string[] {
    const insights: string[] = [];
    const totalActivity = memberActivity.reduce((sum, m) => sum + m.activity.totalActivity, 0);
    const avgActivity = totalActivity / memberActivity.length;

    const lowActivity = memberActivity.filter((m) => m.activity.totalActivity < avgActivity * 0.5);

    if (lowActivity.length > 0) {
      insights.push(`${lowActivity.length} team member(s) may need engagement boost`);
    }

    const highActivity = memberActivity.filter((m) => m.activity.totalActivity > avgActivity * 1.5);

    if (highActivity.length > 0) {
      insights.push(`${highActivity.length} highly active contributor(s)`);
    }

    if (totalActivity === 0) {
      insights.push('Team has been quiet recently. Consider scheduling a check-in.');
    }

    return insights;
  }
}
