import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/types';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(eventId: string, projectId: string | null, userId: string, userRole: string) {
    // 1. Participant check: participants are strictly forbidden from judges' chat
    if (userRole === Role.PARTICIPANT || userRole === Role.VISITOR) {
      throw new ForbiddenException('Participants and visitors are not permitted in judges deliberation rooms');
    }

    // 2. If this is a project-specific thread, check anti-herding gating rule for judges:
    // A judge must have submitted their own ballot for this project before opening the discussion!
    if (projectId && userRole === Role.JUDGE) {
      const ballot = await this.prisma.ballot.findFirst({
        where: {
          eventId,
          projectId,
          judgeId: userId,
          status: 'SUBMITTED',
        },
      });

      if (!ballot) {
        throw new ForbiddenException(
          'ANTI-HERDING LOCK: Discussion unlocks after you submit your independent score for this project.',
        );
      }
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        eventId,
        projectId: projectId || null,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      eventId,
      projectId: projectId || null,
      roomType: projectId ? 'PROJECT_DELIBERATION' : 'JUDGES_LOUNGE',
      isUnlocked: true,
      messages,
    };
  }

  async postMessage(eventId: string, projectId: string | null, authorId: string, authorRole: string, body: string) {
    if (authorRole === Role.PARTICIPANT || authorRole === Role.VISITOR) {
      throw new ForbiddenException('Participants cannot post in judges rooms');
    }

    // Anti-herding check for judges
    if (projectId && authorRole === Role.JUDGE) {
      const ballot = await this.prisma.ballot.findFirst({
        where: {
          eventId,
          projectId,
          judgeId: authorId,
          status: 'SUBMITTED',
        },
      });

      if (!ballot) {
        throw new ForbiddenException(
          'ANTI-HERDING LOCK: You must submit your ballot before joining the discussion for this project.',
        );
      }
    }

    const msg = await this.prisma.chatMessage.create({
      data: {
        eventId,
        projectId: projectId || null,
        authorId,
        body,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    // Append to audit log
    await this.prisma.auditEvent.create({
      data: {
        eventId,
        actorId: authorId,
        actorRole: authorRole as Role,
        action: projectId ? 'PROJECT_DELIBERATION_COMMENT' : 'JUDGES_LOUNGE_COMMENT',
        resourceType: 'CHAT_MESSAGE',
        resourceId: msg.id,
        reason: `Comment in ${projectId ? `project ${projectId}` : 'lounge'}: ${body.slice(0, 40)}...`,
        requestId: `REQ-CHAT-${Date.now()}`,
      },
    });

    return msg;
  }
}
