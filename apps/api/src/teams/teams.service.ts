import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(eventId: string, name: string, creatorId: string) {
    // Check single membership policy: participant cannot belong to multiple teams in the same event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId: creatorId,
        team: { eventId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of a team in this event');
    }

    const inviteCode = 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const team = await this.prisma.team.create({
      data: {
        eventId,
        name,
        inviteCode,
        members: {
          create: {
            userId: creatorId,
            role: 'LEADER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        project: true,
      },
    });

    return team;
  }

  async joinTeam(inviteCode: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Invalid or expired team invitation code');
    }

    // Check single membership policy in this event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { eventId: team.eventId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already in a team for this event');
    }

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'MEMBER',
      },
    });

    return this.getTeam(team.id);
  }

  async getTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        project: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    return team;
  }

  async getUserTeamForEvent(eventId: string, userId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { eventId },
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            project: {
              include: {
                versions: { orderBy: { versionNumber: 'desc' } },
                ideaReports: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    return member ? member.team : null;
  }
}
