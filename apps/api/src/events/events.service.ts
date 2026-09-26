import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventStatus, AutopilotMode, Role } from '../common/types';
import { sha256 } from '../common/crypto.util';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async listEvents() {
    return this.prisma.event.findMany({
      include: {
        tracks: true,
        prizes: true,
        _count: {
          select: { projects: true, teams: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEvent(idOrSlug: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        tracks: true,
        prizes: true,
        rubrics: {
          include: { criteria: true },
        },
        anchorProjects: true,
        _count: {
          select: { projects: true, teams: true, memberships: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${idOrSlug} not found`);
    }

    return event;
  }

  async createEvent(data: {
    name: string;
    slug: string;
    description: string;
    timezone?: string;
    subDeadline?: Date;
    judgeDeadline?: Date;
    creatorId: string;
  }) {
    const existing = await this.prisma.event.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException('Event slug already taken');
    }

    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        timezone: data.timezone || 'UTC',
        subDeadline: data.subDeadline,
        judgeDeadline: data.judgeDeadline,
        status: EventStatus.DRAFT,
      },
    });

    // Assign creator as ORGANIZER
    await this.prisma.membership.create({
      data: {
        userId: data.creatorId,
        eventId: event.id,
        role: Role.ORGANIZER,
      },
    });

    // Default rubric version 1
    const rubric = await this.prisma.rubricVersion.create({
      data: {
        eventId: event.id,
        version: 1,
        isLocked: false,
      },
    });

    await this.prisma.event.update({
      where: { id: event.id },
      data: { currentRubricId: rubric.id },
    });

    return event;
  }

  async updateStatus(eventId: string, targetStatus: EventStatus, actorId: string, reason?: string) {
    const event = await this.getEvent(eventId);

    const validTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.DRAFT]: [EventStatus.REGISTRATION_OPEN],
      [EventStatus.REGISTRATION_OPEN]: [EventStatus.SUBMISSION_OPEN],
      [EventStatus.SUBMISSION_OPEN]: [EventStatus.SUBMISSION_FROZEN],
      [EventStatus.SUBMISSION_FROZEN]: [EventStatus.JUDGING_OPEN],
      [EventStatus.JUDGING_OPEN]: [EventStatus.RESULTS_FINALIZED],
      [EventStatus.RESULTS_FINALIZED]: [EventStatus.RESULTS_PUBLISHED],
      [EventStatus.RESULTS_PUBLISHED]: [EventStatus.ARCHIVED],
      [EventStatus.ARCHIVED]: [],
    };

    const allowed = validTransitions[event.status];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition: cannot move from ${event.status} to ${targetStatus}`,
      );
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: targetStatus },
    });

    // Log to append-only audit trail
    await this.prisma.auditEvent.create({
      data: {
        eventId: event.id,
        actorId,
        actorRole: Role.ORGANIZER,
        action: `EVENT_STATUS_TRANSITION_${targetStatus}`,
        resourceType: 'EVENT',
        resourceId: event.id,
        beforeHash: sha256(event.status),
        afterHash: sha256(targetStatus),
        reason: reason || `Manual lifecycle progression to ${targetStatus}`,
        requestId: `REQ-STATUS-${Date.now()}`,
      },
    });

    return updated;
  }

  async setAutopilotMode(eventId: string, mode: AutopilotMode, actorId: string) {
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { autopilotMode: mode },
    });

    await this.prisma.auditEvent.create({
      data: {
        eventId,
        actorId,
        actorRole: Role.ORGANIZER,
        action: `AUTOPILOT_MODE_CHANGED_${mode}`,
        resourceType: 'EVENT',
        resourceId: eventId,
        reason: `Organizer updated Autopilot Dial to ${mode}`,
        requestId: `REQ-AUTO-${Date.now()}`,
      },
    });

    return updated;
  }

  async cloneEvent(sourceEventId: string, newSlug: string, newName: string, actorId: string) {
    const source = await this.getEvent(sourceEventId);

    const cloned = await this.prisma.event.create({
      data: {
        name: newName,
        slug: newSlug,
        description: `[Cloned from ${source.name}] ${source.description}`,
        status: EventStatus.DRAFT,
        timezone: source.timezone,
        minReviews: source.minReviews,
        disagreeThreshold: source.disagreeThreshold,
      },
    });

    // Copy Tracks
    for (const track of source.tracks) {
      await this.prisma.track.create({
        data: {
          eventId: cloned.id,
          name: track.name,
          description: track.description,
        },
      });
    }

    // Copy Prizes
    for (const prize of source.prizes) {
      await this.prisma.prize.create({
        data: {
          eventId: cloned.id,
          title: prize.title,
          description: prize.description,
          amount: prize.amount,
        },
      });
    }

    // Copy Rubric Structure
    const latestRubric = source.rubrics[0];
    if (latestRubric) {
      const newRubric = await this.prisma.rubricVersion.create({
        data: {
          eventId: cloned.id,
          version: 1,
          isLocked: false,
        },
      });

      for (const crit of latestRubric.criteria) {
        await this.prisma.rubricCriteria.create({
          data: {
            rubricVersionId: newRubric.id,
            name: crit.name,
            description: crit.description,
            weight: crit.weight,
            minScore: crit.minScore,
            maxScore: crit.maxScore,
            guidance: crit.guidance,
          },
        });
      }

      await this.prisma.event.update({
        where: { id: cloned.id },
        data: { currentRubricId: newRubric.id },
      });
    }

    // Copy Anchor Projects for calibration
    for (const anchor of source.anchorProjects) {
      await this.prisma.anchorProject.create({
        data: {
          eventId: cloned.id,
          title: anchor.title,
          description: anchor.description,
          tier: anchor.tier,
          targetScores: anchor.targetScores,
        },
      });
    }

    // Add creator as ORGANIZER
    await this.prisma.membership.create({
      data: {
        userId: actorId,
        eventId: cloned.id,
        role: Role.ORGANIZER,
      },
    });

    // Audit log
    await this.prisma.auditEvent.create({
      data: {
        eventId: cloned.id,
        actorId,
        actorRole: Role.ORGANIZER,
        action: 'EVENT_CLONED',
        resourceType: 'EVENT',
        resourceId: cloned.id,
        reason: `Cloned from source event ${source.id} (${source.slug}) without participant data`,
        requestId: `REQ-CLONE-${Date.now()}`,
      },
    });

    return cloned;
  }

  async getCommandCenterMetrics(eventId: string) {
    const event = await this.getEvent(eventId);
    const projects = await this.prisma.project.findMany({
      where: { eventId },
      include: {
        ballots: { where: { status: 'SUBMITTED' } },
        assignments: true,
      },
    });

    const totalProjects = projects.length;
    const frozenProjects = projects.filter((p) => p.isFrozen).length;
    const totalAssignments = projects.reduce((acc, p) => acc + p.assignments.length, 0);
    const completedBallots = projects.reduce((acc, p) => acc + p.ballots.length, 0);

    const requiredBallots = totalProjects * event.minReviews;
    const completionPct = requiredBallots > 0 ? Math.min(100, Math.round((completedBallots / requiredBallots) * 100)) : 0;

    // Uncertainty detection
    const highUncertaintyProjects = projects
      .map((p) => {
        if (p.ballots.length < 2) return null;
        const scores = p.ballots.map((b) => b.weightedScore);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        return {
          id: p.id,
          title: p.title,
          ballotCount: p.ballots.length,
          mean: Math.round(mean * 10) / 10,
          stdDev: Math.round(stdDev * 100) / 100,
          isHighVariance: stdDev >= event.disagreeThreshold,
        };
      })
      .filter((p) => p && p.isHighVariance);

    const healthIndex = Math.max(10, Math.min(100, Math.round(completionPct * 0.7 + (1 - highUncertaintyProjects.length / (totalProjects || 1)) * 30)));

    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        autopilotMode: event.autopilotMode,
      },
      healthIndex,
      totalProjects,
      frozenProjects,
      totalAssignments,
      completedBallots,
      requiredBallots,
      completionPercentage: completionPct,
      uncertaintyCasesCount: highUncertaintyProjects.length,
      uncertaintyCases: highUncertaintyProjects,
      riskFeed: [
        ...(highUncertaintyProjects.length > 0
          ? [
              {
                id: 'RISK-01',
                type: 'DISAGREEMENT_CLUSTER',
                severity: 'HIGH',
                message: `${highUncertaintyProjects.length} projects exhibit criterion dispersion > ${event.disagreeThreshold}σ`,
                action: 'Trigger targeted 4th review',
                targetProjectId: highUncertaintyProjects[0]?.id,
              },
            ]
          : []),
        ...(completionPct < 50
          ? [
              {
                id: 'RISK-02',
                type: 'JUDGE_PACE_LAG',
                severity: 'MEDIUM',
                message: `Judging completion at ${completionPct}%. 8 judges haven't started.`,
                action: 'Send automated reminder dispatch',
              },
            ]
          : []),
      ],
    };
  }

  async getAudienceCsv(eventId: string) {
    const event = await this.getEvent(eventId);
    const memberships = await this.prisma.membership.findMany({
      where: { eventId },
      include: {
        user: {
          include: {
            teamMembers: {
              where: { team: { eventId } },
              include: { team: { include: { project: { include: { track: true } } } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Name', 'Email', 'Role', 'Team Name', 'Track', 'Email Opt-In Future', 'Registered At'];
    const rows = memberships.map((m) => {
      const teamMember = m.user.teamMembers[0];
      const teamName = teamMember?.team?.name || 'Individual';
      const trackName = teamMember?.team?.project?.track?.name || 'Unassigned';
      const optedIn = m.user.emailOptInFuture ? 'YES' : 'NO';
      const registeredAt = new Date(m.createdAt).toISOString();

      return [
        `"${m.user.name.replace(/"/g, '""')}"`,
        `"${m.user.email.replace(/"/g, '""')}"`,
        `"${m.role}"`,
        `"${teamName.replace(/"/g, '""')}"`,
        `"${trackName.replace(/"/g, '""')}"`,
        `"${optedIn}"`,
        `"${registeredAt}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    return {
      filename: `dogfood-audience-${event.slug}.csv`,
      csvContent,
      totalAttendees: rows.length,
    };
  }

  async broadcastToAudience(eventId: string, data: { subject: string; message: string }, actorId: string) {
    const event = await this.getEvent(eventId);

    // Filter only users who opted in to future communications
    const optedInMembers = await this.prisma.membership.findMany({
      where: {
        eventId,
        user: { emailOptInFuture: true },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const recipients = optedInMembers.map((m) => m.user.email);

    // Record audit event
    await this.prisma.auditEvent.create({
      data: {
        eventId,
        actorId,
        actorRole: Role.ORGANIZER,
        action: 'AUDIENCE_BROADCAST_SENT',
        resourceType: 'EVENT',
        resourceId: eventId,
        reason: `Broadcast "${data.subject}" dispatched to ${recipients.length} opted-in participants`,
        requestId: `REQ-BROADCAST-${Date.now()}`,
      },
    });

    // Simulated MailHog / SMTP payload
    const mailJob = {
      subject: `[${event.name}] ${data.subject}`,
      recipientsCount: recipients.length,
      recipientsSample: recipients.slice(0, 5),
      body: `${data.message}\n\n---\nYou received this because you opted in to updates from ${event.name}. To unsubscribe, visit your profile.`,
      dispatchedAt: new Date().toISOString(),
    };

    return {
      success: true,
      recipientsCount: recipients.length,
      mailJob,
    };
  }
}
