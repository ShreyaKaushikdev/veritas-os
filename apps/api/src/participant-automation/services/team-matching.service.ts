import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TeamMatchingService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(eventId: string, userId: string): Promise<any> {
    // Get user's profile
    const userProfile = await this.getUserProfile(userId);

    // Get available teams in the event
    const teams = await this.prisma.team.findMany({
      where: {
        eventId,
        members: {
          none: { userId }, // Not already a member
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        _count: { select: { members: true } },
      },
    });

    // Score and rank teams
    const scoredTeams = await Promise.all(
      teams.map(async (team) => ({
        team,
        score: await this.calculateMatchScore(userProfile, team),
      })),
    );

    scoredTeams.sort((a, b) => b.score.total - a.score.total);

    return {
      recommendations: scoredTeams.slice(0, 10).map((st) => ({
        teamId: st.team.id,
        teamName: st.team.name,
        memberCount: st.team._count.members,
        matchScore: st.score.total,
        reasons: st.score.reasons,
        members: st.team.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
        })),
      })),
    };
  }

  async updateUserProfile(userId: string, data: any): Promise<any> {
    await this.prisma.auditEvent.create({
      data: {
        action: 'PROFILE_UPDATE',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'USER',
        resourceId: userId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          skills: data.skills || [],
          interests: data.interests || [],
          timezone: data.timezone || 'UTC',
          availability: data.availability || 'flexible',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return data;
  }

  private async getUserProfile(userId: string): Promise<any> {
    const latest = await this.prisma.auditEvent.findFirst({
      where: {
        actorId: userId,
        action: 'PROFILE_UPDATE',
      },
      orderBy: { occurredAt: 'desc' },
    });

    if (latest && latest.reason) {
      try {
        return JSON.parse(latest.reason);
      } catch (e) {
        // Fallback
      }
    }

    // Default profile
    return {
      skills: [],
      interests: [],
      timezone: 'UTC',
      availability: 'flexible',
    };
  }

  private async calculateMatchScore(userProfile: any, team: any): Promise<any> {
    const reasons: string[] = [];
    let total = 0;

    // Skill complementarity (0-40 points)
    const skillMatch = this.calculateSkillMatch(userProfile, team);
    total += skillMatch.score;
    if (skillMatch.score > 20) {
      reasons.push(skillMatch.reason);
    }

    // Team size preference (0-20 points)
    const sizeScore = this.calculateSizePreference(team);
    total += sizeScore;
    if (sizeScore > 10) {
      reasons.push('Good team size');
    }

    // Timezone compatibility (0-20 points)
    const timezoneScore = await this.calculateTimezoneMatch(userProfile, team);
    total += timezoneScore;
    if (timezoneScore > 10) {
      reasons.push('Compatible timezone');
    }

    // Activity level (0-20 points)
    const activityScore = await this.calculateActivityLevel(team);
    total += activityScore;
    if (activityScore > 10) {
      reasons.push('Active team');
    }

    return { total, reasons };
  }

  private calculateSkillMatch(userProfile: any, team: any): any {
    const userSkills = new Set<string>(userProfile.skills || []);
    const teamSkills = new Set<string>();

    team.members?.forEach((member: any) => {
      // Would need to fetch member profiles
    });

    const overlap = [...userSkills].filter((s: string) => teamSkills.has(s)).length;
    const complementary = userSkills.size - overlap;

    const score = Math.min(complementary * 10, 40);
    return {
      score,
      reason: `${complementary} complementary skills`,
    };
  }

  private calculateSizePreference(team: any): number {
    const size = team.members?.length || 0;
    
    // Prefer teams with 2-4 members
    if (size >= 2 && size <= 4) return 20;
    if (size === 1 || size === 5) return 15;
    return 10;
  }

  private async calculateTimezoneMatch(userProfile: any, team: any): Promise<number> {
    // Simplified: assume all members in UTC for now
    return 15;
  }

  private async calculateActivityLevel(team: any): Promise<number> {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const activityCount = await this.prisma.chatMessage.count({
      where: {
        projectId: team.id,
        createdAt: { gte: last7Days },
      },
    });

    return Math.min(activityCount * 2, 20);
  }
}
