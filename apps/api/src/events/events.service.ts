import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventStatus, AutopilotMode, Role, BallotStatus } from '../common/types';
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
    regDeadline?: string | Date;
    subDeadline?: string | Date;
    freezeDeadline?: string | Date;
    judgeDeadline?: string | Date;
    minReviews?: number;
    disagreeThreshold?: number;
    blindReviewMode?: boolean;
    tracks?: Array<{ name: string; description: string }>;
    prizes?: Array<{ title: string; description: string; amount?: string }>;
    criteria?: Array<{
      name: string;
      description: string;
      weight: number;
      minScore: number;
      maxScore: number;
    }>;
    creatorId: string;
  }) {
    // ✅ FIX #6: Transaction Safety - Wrap event creation in transaction to prevent orphaned records
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw new BadRequestException('Event slug already taken');
      }

      // Create the event
      const event = await tx.event.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          timezone: data.timezone || 'UTC',
          regDeadline: data.regDeadline ? new Date(data.regDeadline) : undefined,
          subDeadline: data.subDeadline ? new Date(data.subDeadline) : undefined,
          freezeDeadline: data.freezeDeadline ? new Date(data.freezeDeadline) : undefined,
          judgeDeadline: data.judgeDeadline ? new Date(data.judgeDeadline) : undefined,
          minReviews: data.minReviews || 3,
          disagreeThreshold: data.disagreeThreshold || 1.5,
          blindReviewMode: data.blindReviewMode || false,
          status: EventStatus.DRAFT,
        },
      });

      // Assign creator as ORGANIZER
      await tx.membership.create({
        data: {
          userId: data.creatorId,
          eventId: event.id,
          role: Role.ORGANIZER,
        },
      });

      // Create tracks
      if (data.tracks && data.tracks.length > 0) {
        await tx.track.createMany({
          data: data.tracks.map((track) => ({
            eventId: event.id,
            name: track.name,
            description: track.description,
          })),
        });
      }

      // Create prizes
      if (data.prizes && data.prizes.length > 0) {
        await tx.prize.createMany({
          data: data.prizes.map((prize) => ({
            eventId: event.id,
            title: prize.title,
            description: prize.description,
            amount: prize.amount,
          })),
        });
      }

      // Create default rubric version with criteria
      const rubric = await tx.rubricVersion.create({
        data: {
          eventId: event.id,
          version: 1,
          isLocked: false,
        },
      });

      // Create rubric criteria
      if (data.criteria && data.criteria.length > 0) {
        await tx.rubricCriteria.createMany({
          data: data.criteria.map((crit) => ({
            rubricVersionId: rubric.id,
            name: crit.name,
            description: crit.description,
            weight: crit.weight,
            minScore: crit.minScore,
            maxScore: crit.maxScore,
          })),
        });
      }

      // Update event with current rubric
      await tx.event.update({
        where: { id: event.id },
        data: { currentRubricId: rubric.id },
      });

      // Return with all created data using a new Prisma call (after transaction)
      return event.id;
    }).then(eventId => this.getEvent(eventId));
  }

  async generateEventFromPrompt(prompt: string) {
    // Parse the prompt to extract key information
    // This is a simplified version - in production, you'd call an LLM API
    
    const now = new Date();
    const regDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const subDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const freezeDeadline = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days
    const judgeDeadline = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days

    // Extract keywords to determine event type
    const promptLower = prompt.toLowerCase();
    const isAI = promptLower.includes('ai') || promptLower.includes('machine learning') || promptLower.includes('ml');
    const isWeb3 = promptLower.includes('web3') || promptLower.includes('blockchain') || promptLower.includes('crypto');
    const isGreen = promptLower.includes('green') || promptLower.includes('sustainability') || promptLower.includes('climate');

    // Generate event name from prompt
    const eventName = prompt.split('.')[0].substring(0, 60) || 'Hackathon 2026';
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Generate tracks based on keywords
    const tracks = [];
    tracks.push({ name: 'Open Track', description: 'Any project ideas welcome' });
    
    if (isAI) {
      tracks.push({ name: 'AI/ML', description: 'Artificial intelligence and machine learning solutions' });
    }
    if (isWeb3) {
      tracks.push({ name: 'Web3', description: 'Blockchain and decentralized applications' });
    }
    if (isGreen) {
      tracks.push({ name: 'Sustainability', description: 'Climate and environmental solutions' });
    }

    // Default prizes
    const prizes = [
      { title: '🥇 First Place', description: 'Overall winner', amount: '$5,000' },
      { title: '🥈 Second Place', description: 'Runner-up', amount: '$3,000' },
      { title: '🥉 Third Place', description: 'Third place', amount: '$2,000' },
    ];

    // Default rubric criteria
    const criteria = [
      {
        name: 'Technical Depth',
        description: 'Code quality, architecture, and technical complexity',
        weight: 0.25,
        minScore: 1.0,
        maxScore: 10.0,
      },
      {
        name: 'Innovation',
        description: 'Novelty and creativity of the solution',
        weight: 0.25,
        minScore: 1.0,
        maxScore: 10.0,
      },
      {
        name: 'Feasibility',
        description: 'Realistic implementation and scope',
        weight: 0.25,
        minScore: 1.0,
        maxScore: 10.0,
      },
      {
        name: 'Presentation',
        description: 'Clarity of demo, documentation, and delivery',
        weight: 0.25,
        minScore: 1.0,
        maxScore: 10.0,
      },
    ];

    return {
      name: eventName,
      slug,
      description: prompt,
      timezone: 'UTC',
      regDeadline: regDeadline.toISOString(),
      subDeadline: subDeadline.toISOString(),
      freezeDeadline: freezeDeadline.toISOString(),
      judgeDeadline: judgeDeadline.toISOString(),
      minReviews: 3,
      disagreeThreshold: 1.5,
      blindReviewMode: false,
      tracks,
      prizes,
      criteria,
      anchors: [],
      _metadata: {
        generatedAt: now.toISOString(),
        isAI,
        isWeb3,
        isGreen,
      },
    };
  }

  async getEventPulse(eventId: string) {
    const event = await this.getEvent(eventId);
    
    // Fetch pulse metrics
    const [teams, projects, judges, assignments, ballots, members] = await Promise.all([
      this.prisma.team.count({ where: { eventId } }),
      this.prisma.project.count({ where: { eventId } }),
      this.prisma.membership.count({ where: { eventId, role: Role.JUDGE } }),
      this.prisma.assignment.count({ where: { eventId, status: 'ACTIVE' } }),
      this.prisma.ballot.count({ 
        where: { 
          project: { eventId },
          status: BallotStatus.SUBMITTED 
        } 
      }),
      this.prisma.membership.count({ 
        where: { 
          eventId, 
          role: Role.PARTICIPANT 
        } 
      }),
    ]);

    const submittedProjects = await this.prisma.project.count({
      where: { eventId, isFrozen: true }
    });

    const frozenProjects = submittedProjects;
    const totalProjects = projects || 1; // Avoid division by zero

    // Calculate active judges (those with at least one submitted ballot)
    const activeJudges = await this.prisma.ballot.findMany({
      where: {
        project: { eventId },
        status: BallotStatus.SUBMITTED
      },
      select: { judgeId: true },
      distinct: ['judgeId']
    });

    // Calculate calibration completion
    const judgePassports = await this.prisma.judgePassport.findMany({
      where: {
        user: {
          memberships: {
            some: { eventId, role: Role.JUDGE }
          }
        }
      }
    });

    const calibratedJudges = judgePassports.filter(jp => jp.calibrationBias !== null).length;
    const calibrationComplete = judges > 0 ? Math.round((calibratedJudges / judges) * 100) : 0;

    // Calculate health metrics
    const submissionProgress = Math.round((submittedProjects / totalProjects) * 100);
    const assignmentCoverage = assignments > 0 && totalProjects > 0 
      ? Math.round((assignments / (totalProjects * 4)) * 100) // Assuming 4 judges per project
      : 0;

    const expectedBallots = assignments;
    const judgingProgress = expectedBallots > 0 
      ? Math.round((ballots / expectedBallots) * 100) 
      : 0;

    // Generate alerts based on actual data
    const alerts = [];

    // Check for unsubmitted teams
    const unsubmittedTeams = teams - submittedProjects;
    if (unsubmittedTeams > 0 && event.status === EventStatus.SUBMISSION_OPEN) {
      alerts.push({
        id: 'unsubmitted-teams',
        severity: 'warning' as const,
        title: 'Teams Haven\'t Submitted',
        message: `${unsubmittedTeams} teams have not submitted their projects yet.`,
        count: unsubmittedTeams,
        actionLabel: 'View Teams',
        actionUrl: '/organizer/teams'
      });
    }

    // Check for uncalibrated judges
    const uncalibratedJudges = judges - calibratedJudges;
    if (uncalibratedJudges > 0 && event.status === EventStatus.JUDGING_OPEN) {
      alerts.push({
        id: 'uncalibrated-judges',
        severity: 'warning' as const,
        title: 'Judges Need Calibration',
        message: `${uncalibratedJudges} judges haven't completed calibration.`,
        count: uncalibratedJudges,
        actionLabel: 'Remind Judges',
        actionUrl: '/organizer/judges'
      });
    }

    // Check assignment coverage
    if (assignmentCoverage < 90 && event.status === EventStatus.JUDGING_OPEN) {
      alerts.push({
        id: 'low-coverage',
        severity: 'critical' as const,
        title: 'Assignment Coverage Low',
        message: `Only ${assignmentCoverage}% of required assignments are created.`,
        count: undefined,
        actionLabel: 'Generate Assignments',
        actionUrl: '/organizer/assignments'
      });
    }

    // Check if rubric is locked
    const rubric = await this.prisma.rubricVersion.findUnique({
      where: { id: event.currentRubricId || '' }
    });

    if (rubric?.isLocked) {
      alerts.push({
        id: 'rubric-locked',
        severity: 'success' as const,
        title: 'Rubric Locked',
        message: 'Scoring criteria are locked and ready for judging.',
        actionLabel: 'View Rubric',
        actionUrl: '/organizer/rubric'
      });
    } else if (event.status === EventStatus.JUDGING_OPEN) {
      alerts.push({
        id: 'rubric-unlocked',
        severity: 'critical' as const,
        title: 'Rubric Not Locked',
        message: 'Rubric must be locked before judging can begin.',
        actionLabel: 'Lock Rubric',
        actionUrl: '/organizer/rubric'
      });
    }

    // Check tracks configured
    const trackCount = event.tracks?.length || 0;
    if (trackCount > 0) {
      alerts.push({
        id: 'tracks-configured',
        severity: 'success' as const,
        title: 'Tracks Configured',
        message: `${trackCount} tracks are configured for this event.`,
        count: trackCount,
        actionLabel: 'View Tracks',
        actionUrl: '/organizer/tracks'
      });
    }

    // Build timeline
    const timeline = [
      {
        phase: 'DRAFT',
        label: 'Setup',
        status: this.getPhaseStatus('DRAFT', event.status),
        startTime: undefined,
        endTime: undefined,
        remaining: undefined
      },
      {
        phase: 'REGISTRATION_OPEN',
        label: 'Registration',
        status: this.getPhaseStatus('REGISTRATION_OPEN', event.status),
        startTime: undefined,
        endTime: undefined,
        remaining: undefined
      },
      {
        phase: 'SUBMISSION_OPEN',
        label: 'Build',
        status: this.getPhaseStatus('SUBMISSION_OPEN', event.status),
        startTime: undefined,
        endTime: event.subDeadline?.toISOString(),
        remaining: event.status === EventStatus.SUBMISSION_OPEN && event.subDeadline 
          ? this.calculateTimeRemaining(event.subDeadline)
          : undefined
      },
      {
        phase: 'SUBMISSION_FROZEN',
        label: 'Submit',
        status: this.getPhaseStatus('SUBMISSION_FROZEN', event.status),
        startTime: event.subDeadline?.toISOString(),
        endTime: undefined,
        remaining: undefined
      },
      {
        phase: 'JUDGING_OPEN',
        label: 'Judge',
        status: this.getPhaseStatus('JUDGING_OPEN', event.status),
        startTime: undefined,
        endTime: event.judgeDeadline?.toISOString(),
        remaining: event.status === EventStatus.JUDGING_OPEN && event.judgeDeadline
          ? this.calculateTimeRemaining(event.judgeDeadline)
          : undefined
      },
      {
        phase: 'RESULTS_FINALIZED',
        label: 'Results',
        status: this.getPhaseStatus('RESULTS_FINALIZED', event.status),
        startTime: undefined,
        endTime: undefined,
        remaining: undefined
      },
      {
        phase: 'RESULTS_PUBLISHED',
        label: 'Published',
        status: this.getPhaseStatus('RESULTS_PUBLISHED', event.status),
        startTime: undefined,
        endTime: undefined,
        remaining: undefined
      }
    ];

    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        currentPhase: this.getPhaseLabel(event.status),
        subDeadline: event.subDeadline?.toISOString() || null,
        judgeDeadline: event.judgeDeadline?.toISOString() || null
      },
      pulse: {
        participants: members,
        teams,
        projects,
        submitted: submittedProjects,
        frozen: frozenProjects,
        judges,
        activeJudges: activeJudges.length
      },
      alerts,
      timeline,
      health: {
        submissionProgress,
        judgingProgress,
        assignmentCoverage,
        calibrationComplete
      }
    };
  }

  private getPhaseStatus(phase: string, currentStatus: string): 'complete' | 'current' | 'upcoming' | 'blocked' {
    const phases = [
      'DRAFT',
      'REGISTRATION_OPEN',
      'SUBMISSION_OPEN',
      'SUBMISSION_FROZEN',
      'JUDGING_OPEN',
      'RESULTS_FINALIZED',
      'RESULTS_PUBLISHED'
    ];

    const currentIndex = phases.indexOf(currentStatus);
    const phaseIndex = phases.indexOf(phase);

    if (phaseIndex < currentIndex) return 'complete';
    if (phaseIndex === currentIndex) return 'current';
    return 'upcoming';
  }

  private getPhaseLabel(status: string): string {
    const labels: Record<string, string> = {
      'DRAFT': 'Setup',
      'REGISTRATION_OPEN': 'Registration',
      'SUBMISSION_OPEN': 'Build Phase',
      'SUBMISSION_FROZEN': 'Submission Closed',
      'JUDGING_OPEN': 'Judging',
      'RESULTS_FINALIZED': 'Results Ready',
      'RESULTS_PUBLISHED': 'Published',
      'ARCHIVED': 'Archived'
    };
    return labels[status] || status;
  }

  private calculateTimeRemaining(deadline: Date): string {
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diff = target - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
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

  async getParticipantsList(eventId: string) {
    const event = await this.getEvent(eventId);
    
    const memberships = await this.prisma.membership.findMany({
      where: { eventId },
      include: {
        user: {
          include: {
            teamMembers: {
              where: { team: { eventId } },
              include: {
                team: {
                  include: {
                    project: {
                      include: {
                        track: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return memberships.map((m) => {
      const teamMember = m.user.teamMembers[0];
      const team = teamMember?.team;
      const project = team?.project;
      
      return {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        teamName: team?.name || null,
        track: project?.track?.name || null,
        emailOptIn: m.user.emailOptInFuture,
        registeredAt: m.createdAt.toISOString(),
        hasSubmitted: project?.isFrozen || false
      };
    });
  }

  async getProjectsList(eventId: string) {
    const event = await this.getEvent(eventId);
    
    const projects = await this.prisma.project.findMany({
      where: { eventId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        track: true,
        ballots: {
          where: { status: BallotStatus.SUBMITTED },
          select: { weightedScore: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return projects.map((p) => {
      const scores = p.ballots.map(b => b.weightedScore);
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : null;
      
      let scoreStdDev = null;
      let hasHighVariance = false;
      
      if (scores.length >= 2 && avgScore !== null) {
        const variance = scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / scores.length;
        scoreStdDev = Math.sqrt(variance);
        hasHighVariance = scoreStdDev >= event.disagreeThreshold;
      }

      return {
        id: p.id,
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        teamName: p.team.name,
        teamSize: p.team.members.length,
        track: p.track?.name || null,
        trackColor: '#8b5cf6', // Purple default
        eligibility: p.eligibility,
        isFrozen: p.isFrozen,
        frozenAt: p.frozenAt?.toISOString() || null,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        techStack: p.techStack,
        ballotCount: p.ballots.length,
        avgScore,
        scoreStdDev,
        hasHighVariance,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      };
    });
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
