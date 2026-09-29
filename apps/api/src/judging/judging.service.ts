import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BallotStatus, Role } from '../common/types';
import { sha256, computeHashNode } from '../common/crypto.util';

@Injectable()
export class JudgingService {
  constructor(private prisma: PrismaService) {}

  async getRubric(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.currentRubricId) {
      throw new NotFoundException('Active rubric not found');
    }

    return this.prisma.rubricVersion.findUnique({
      where: { id: event.currentRubricId },
      include: { criteria: true },
    });
  }

  async lockRubric(rubricVersionId: string, actorId: string) {
    const rubric = await this.prisma.rubricVersion.findUnique({
      where: { id: rubricVersionId },
      include: { criteria: true },
    });
    if (!rubric) throw new NotFoundException('Rubric not found');

    const totalWeight = rubric.criteria.reduce((acc, c) => acc + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new BadRequestException(`Criterion weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
    }

    const updated = await this.prisma.rubricVersion.update({
      where: { id: rubricVersionId },
      data: { isLocked: true },
    });

    await this.prisma.auditEvent.create({
      data: {
        eventId: rubric.eventId,
        actorId,
        actorRole: Role.ORGANIZER,
        action: 'RUBRIC_LOCKED',
        resourceType: 'RUBRIC_VERSION',
        resourceId: rubricVersionId,
        reason: 'Organizer locked rubric weights for judging',
        requestId: `REQ-RUBRIC-${Date.now()}`,
      },
    });

    return updated;
  }

  async getAnchorProjects(eventId: string) {
    return this.prisma.anchorProject.findMany({ where: { eventId } });
  }

  async recordCalibration(eventId: string, judgeId: string, anchorScores: Record<string, number>) {
    // anchorScores is a map { anchorId: scoreGiven }
    const anchors = await this.prisma.anchorProject.findMany({ where: { eventId } });
    if (anchors.length === 0) {
      throw new BadRequestException('No anchor calibration projects configured for this event');
    }

    let totalOffset = 0;
    let count = 0;

    for (const anchor of anchors) {
      if (anchorScores[anchor.id] !== undefined) {
        const targetMap = JSON.parse(anchor.targetScores || '{}');
        const values = Object.values(targetMap) as number[];
        const targetAvg = values.reduce((a, b) => a + Number(b), 0) / (values.length || 1);
        const given = anchorScores[anchor.id];
        totalOffset += (given - targetAvg);
        count++;
      }
    }

    const calibrationBias = count > 0 ? Math.round((totalOffset / count) * 100) / 100 : 0.0;

    await this.prisma.judgePassport.upsert({
      where: { userId: judgeId },
      update: { calibrationBias },
      create: {
        userId: judgeId,
        calibrationBias,
        reliabilityScore: 1.0,
      },
    });

    return {
      judgeId,
      calibrationBias,
      guidance:
        calibrationBias < -0.4
          ? `Your calibration scores trend ${Math.abs(calibrationBias)} below the panel baseline (Systematically Harsh).`
          : calibrationBias > 0.4
          ? `Your calibration scores trend ${calibrationBias} above the panel baseline (Systematically Lenient).`
          : 'Your calibration aligns tightly with the panel baseline.',
    };
  }

  async getJudgeAssignments(eventId: string, judgeId: string) {
    // ✅ FIX #4: Data Isolation - Verify event exists
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    
    // ✅ FIX #4: Data Isolation - Verify judge is member of this event
    const membership = await this.prisma.membership.findFirst({
      where: { eventId, userId: judgeId, role: Role.JUDGE }
    });
    if (!membership) {
      throw new ForbiddenException('Judge is not part of this event');
    }
    
    const isBlind = event?.blindReviewMode ?? false;
    const shuffleSeed = event?.shuffleSeed || 'dogfood-entropy-seed-2026';

    const assignments = await this.prisma.assignment.findMany({
      where: { eventId, judgeId, status: 'ACTIVE' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            tagline: true,
            description: true,
            repoUrl: true,
            demoUrl: true,
            techStack: true,
            featuresList: true,
            license: true,
            isOriginalWork: true,
            track: { select: { id: true, name: true } },
            team: isBlind ? false : { select: { name: true, members: { select: { user: { select: { name: true } } } } } },
          },
        },
      },
    });

    // Deterministic Seeded Shuffle Ordering using SHA-256
    // Eliminates primacy & recency bias across the judging panel
    assignments.sort((a, b) => {
      const hashA = sha256(`${eventId}:${judgeId}:${shuffleSeed}:${a.id}`);
      const hashB = sha256(`${eventId}:${judgeId}:${shuffleSeed}:${b.id}`);
      return hashA.localeCompare(hashB);
    });

    // Attach existing ballot status for this judge
    const results = await Promise.all(
      assignments.map(async (a) => {
        const ballot = await this.prisma.ballot.findFirst({
          where: { projectId: a.projectId, judgeId, status: { not: 'VOIDED' } },
          include: { scores: true },
        });

        // Blind Review Redaction
        const projectPayload = {
          ...a.project,
          blindReviewActive: isBlind,
        };

        return {
          assignmentId: a.id,
          project: projectPayload,
          isTargeted: a.isTargeted,
          triggerReason: a.triggerReason,
          ballot: ballot || null,
        };
      }),
    );

    return results;
  }

  async submitBallot(data: {
    eventId: string;
    projectId: string;
    judgeId: string;
    scores: { criteriaId: string; score: number; comment?: string }[];
    feedback: string;
    privateNotes?: string;
    isFlagged?: boolean;
    flagReason?: string;
  }) {
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || !event.currentRubricId) {
      throw new BadRequestException('Active rubric not configured');
    }

    // ✅ FIX #4: Data Isolation - Verify project belongs to this event
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId }
    });
    if (!project || project.eventId !== data.eventId) {
      throw new ForbiddenException('Project does not belong to this event');
    }

    // ✅ FIX #4: Data Isolation - Verify judge is part of this event
    const membership = await this.prisma.membership.findFirst({
      where: { eventId: data.eventId, userId: data.judgeId, role: Role.JUDGE }
    });
    if (!membership) {
      throw new ForbiddenException('Judge is not part of this event');
    }

    const rubric = await this.prisma.rubricVersion.findUnique({
      where: { id: event.currentRubricId },
      include: { criteria: true },
    });
    if (!rubric) throw new NotFoundException('Rubric not found');

    // Calculate weighted ballot score
    let weightedScore = 0;
    for (const item of data.scores) {
      const crit = rubric.criteria.find((c) => c.id === item.criteriaId);
      if (!crit) throw new BadRequestException(`Unknown criterion: ${item.criteriaId}`);
      if (item.score < crit.minScore || item.score > crit.maxScore) {
        throw new BadRequestException(`Score for ${crit.name} must be between ${crit.minScore} and ${crit.maxScore}`);
      }
      weightedScore += item.score * crit.weight;
    }
    weightedScore = Math.round(weightedScore * 100) / 100;

    const ballotHash = sha256(`BALLOT:${data.projectId}:${data.judgeId}:${weightedScore}`);

    // Upsert Ballot
    let ballot = await this.prisma.ballot.findFirst({
      where: {
        projectId: data.projectId,
        judgeId: data.judgeId,
        rubricVersionId: rubric.id,
      },
    });

    if (ballot && ballot.status === BallotStatus.LOCKED) {
      throw new ForbiddenException('This ballot has been locked and cannot be edited without organizer override');
    }

    if (!ballot) {
      ballot = await this.prisma.ballot.create({
        data: {
          eventId: data.eventId,
          projectId: data.projectId,
          judgeId: data.judgeId,
          rubricVersionId: rubric.id,
          status: BallotStatus.SUBMITTED,
          weightedScore,
          feedback: data.feedback,
          privateNotes: data.privateNotes,
          isFlagged: data.isFlagged || false,
          flagReason: data.flagReason,
          submittedAt: new Date(),
          ballotHash,
        },
      });
    } else {
      ballot = await this.prisma.ballot.update({
        where: { id: ballot.id },
        data: {
          status: BallotStatus.SUBMITTED,
          weightedScore,
          feedback: data.feedback,
          privateNotes: data.privateNotes,
          isFlagged: data.isFlagged || false,
          flagReason: data.flagReason,
          submittedAt: new Date(),
          ballotHash,
        },
      });
      // Delete old scores
      await this.prisma.ballotScore.deleteMany({ where: { ballotId: ballot.id } });
    }

    // Insert Scores
    for (const item of data.scores) {
      await this.prisma.ballotScore.create({
        data: {
          ballotId: ballot.id,
          criteriaId: item.criteriaId,
          score: item.score,
          comment: item.comment,
        },
      });
    }

    // Append to Hash Chain
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId: data.eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nodeHash = computeHashNode(previousHash, { ballotId: ballot.id, weightedScore }, ballot.id);

    await this.prisma.integrityHashNode.create({
      data: {
        eventId: data.eventId,
        nodeType: 'BALLOT_SUBMIT',
        resourceId: ballot.id,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify({ ballotId: ballot.id, projectId: data.projectId, judgeId: data.judgeId, weightedScore }),
      },
    });

    // Update Judge Passport review count
    await this.prisma.judgePassport.updateMany({
      where: { userId: data.judgeId },
      data: { completedReviews: { increment: 1 } },
    });

    return ballot;
  }

  async generateAssignments(eventId: string, minReviewsPerProject: number = 3) {
    const projects = await this.prisma.project.findMany({
      where: { eventId, eligibility: 'ELIGIBLE', isFrozen: true },
    });
    const judges = await this.prisma.membership.findMany({
      where: { eventId, role: Role.JUDGE },
      include: { user: { include: { judgeProfile: true, conflicts: true } } },
    });

    if (judges.length < minReviewsPerProject) {
      throw new BadRequestException(`Need at least ${minReviewsPerProject} judges to generate assignments`);
    }

    let createdCount = 0;

    for (const project of projects) {
      // Find existing assignments
      const existing = await this.prisma.assignment.findMany({
        where: { projectId: project.id },
      });
      const assignedJudgeIds = new Set(existing.map((a) => a.judgeId));

      // Filter eligible judges (no conflict of interest, track match where configured)
      const eligibleJudges = judges.filter((j) => {
        if (assignedJudgeIds.has(j.userId)) return false;
        // Check hard conflict
        const hasConflict = j.user.conflicts?.some((c) => c.projectId === project.id);
        return !hasConflict;
      });

      // Sort by fewest assignments currently
      eligibleJudges.sort((a, b) => (a.user.judgeProfile?.completedReviews || 0) - (b.user.judgeProfile?.completedReviews || 0));

      const needed = minReviewsPerProject - existing.length;
      const toAssign = eligibleJudges.slice(0, Math.max(0, needed));

      for (const judge of toAssign) {
        await this.prisma.assignment.create({
          data: {
            eventId,
            projectId: project.id,
            judgeId: judge.userId,
            isTargeted: false,
          },
        });
        createdCount++;
      }
    }

    return { success: true, createdCount };
  }

  async getJudgePassport(judgeId: string) {
    const passport = await this.prisma.judgePassport.findUnique({
      where: { userId: judgeId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!passport) throw new NotFoundException('Judge passport not found');
    return passport;
  }

  async recuseAssignment(data: {
    eventId: string;
    judgeId: string;
    projectId: string;
    reason: string;
    note?: string;
  }) {
    // ✅ FIX #4: Data Isolation - Verify project belongs to event
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId }
    });
    if (!project || project.eventId !== data.eventId) {
      throw new ForbiddenException('Project does not belong to this event');
    }

    // ✅ FIX #4: Data Isolation - Verify assignment belongs to this event (critical - was missing before)
    const assignment = await this.prisma.assignment.findFirst({
      where: { projectId: data.projectId, judgeId: data.judgeId, status: 'ACTIVE', eventId: data.eventId },
    });
    if (!assignment) {
      throw new BadRequestException('No active assignment found for this project and judge in this event');
    }

    // 2. Void any in-progress or drafted ballot for this judge/project
    const ballot = await this.prisma.ballot.findFirst({
      where: { projectId: data.projectId, judgeId: data.judgeId },
    });
    if (ballot) {
      if (ballot.status === 'SUBMITTED' || ballot.status === 'LOCKED') {
        throw new BadRequestException('Cannot recuse after ballot is submitted and locked');
      }
      await this.prisma.ballot.update({
        where: { id: ballot.id },
        data: { status: 'VOIDED' },
      });
    }

    // 3. Mark assignment as RECUSED
    await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        status: 'RECUSED',
        recusalReason: data.reason,
        recusalNote: data.note || null,
      },
    });

    // 4. Record permanent ConflictOfInterest so this judge is never reassigned to this project
    await this.prisma.judgeConflict.create({
      data: {
        userId: data.judgeId,
        projectId: data.projectId,
        reason: `Self-recused mid-round: ${data.reason}`,
      },
    });

    // 5. Append to hash chain
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId: data.eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nodeHash = computeHashNode(previousHash, { assignmentId: assignment.id, recusalReason: data.reason }, assignment.id);

    await this.prisma.integrityHashNode.create({
      data: {
        eventId: data.eventId,
        nodeType: 'JUDGE_RECUSAL',
        resourceId: assignment.id,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify({
          assignmentId: assignment.id,
          judgeId: data.judgeId,
          projectId: data.projectId,
          reason: data.reason,
        }),
      },
    });

    // 6. Instant Re-balancer: Find eligible unconflicted replacement judge with fewest assignments
    const judges = await this.prisma.membership.findMany({
      where: { eventId: data.eventId, role: Role.JUDGE },
      include: { user: { include: { judgeProfile: true, conflicts: true } } },
    });

    // Existing active assignments on this project
    const currentAssignments = await this.prisma.assignment.findMany({
      where: { projectId: data.projectId, status: 'ACTIVE' },
    });
    const activeJudgeIds = new Set(currentAssignments.map((a) => a.judgeId));

    const eligibleJudges = judges.filter((j) => {
      if (j.userId === data.judgeId) return false;
      if (activeJudgeIds.has(j.userId)) return false;
      const hasConflict = j.user.conflicts?.some((c) => c.projectId === data.projectId);
      return !hasConflict;
    });

    let replacementJudgeId: string | null = null;
    if (eligibleJudges.length > 0) {
      eligibleJudges.sort((a, b) => (a.user.judgeProfile?.completedReviews || 0) - (b.user.judgeProfile?.completedReviews || 0));
      const replacement = eligibleJudges[0];
      replacementJudgeId = replacement.userId;

      await this.prisma.assignment.create({
        data: {
          eventId: data.eventId,
          projectId: data.projectId,
          judgeId: replacement.userId,
          status: 'ACTIVE',
          triggerReason: 'RECUSAL_REPLACEMENT',
        },
      });
    }

    return {
      success: true,
      recusedAssignmentId: assignment.id,
      reassignedToJudgeId: replacementJudgeId,
      message: replacementJudgeId
        ? 'Recusal recorded. Replaced with unconflicted judge from pool.'
        : 'Recusal recorded. Project returned to pending pool.',
    };
  }

  async recordPairwiseComparison(data: {
    eventId: string;
    judgeId: string;
    projectAId: string;
    projectBId: string;
    winnerId?: string;
    isTie?: boolean;
    notes?: string;
  }) {
    if (data.projectAId === data.projectBId) {
      throw new BadRequestException('Cannot compare a project to itself');
    }

    if (!data.isTie && !data.winnerId) {
      throw new BadRequestException('Either a winnerId must be specified or isTie must be true');
    }

    if (data.winnerId && data.winnerId !== data.projectAId && data.winnerId !== data.projectBId) {
      throw new BadRequestException('Winner must be either projectA or projectB');
    }

    const comparisonHash = sha256(
      `PAIRWISE:${data.eventId}:${data.judgeId}:${data.projectAId}:${data.projectBId}:${data.winnerId || 'TIE'}:${Boolean(data.isTie)}`
    );

    const comparison = await this.prisma.pairwiseComparison.create({
      data: {
        eventId: data.eventId,
        judgeId: data.judgeId,
        projectAId: data.projectAId,
        projectBId: data.projectBId,
        winnerId: data.isTie ? null : data.winnerId,
        isTie: Boolean(data.isTie),
        notes: data.notes || null,
        comparisonHash,
      },
    });

    // Hash node for cryptographic auditable verification
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId: data.eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nodeHash = computeHashNode(
      previousHash,
      {
        comparisonId: comparison.id,
        projectAId: data.projectAId,
        projectBId: data.projectBId,
        winnerId: comparison.winnerId,
        isTie: comparison.isTie,
      },
      comparison.id
    );

    await this.prisma.integrityHashNode.create({
      data: {
        eventId: data.eventId,
        nodeType: 'PAIRWISE_COMPARISON',
        resourceId: comparison.id,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify({
          comparisonId: comparison.id,
          judgeId: data.judgeId,
          projectAId: data.projectAId,
          projectBId: data.projectBId,
          winnerId: comparison.winnerId,
          isTie: comparison.isTie,
          comparisonHash,
        }),
      },
    });

    return comparison;
  }

  async getPairwiseQueue(eventId: string, judgeId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const isBlind = event?.blindReviewMode ?? false;

    // Get all eligible projects
    const projects = await this.prisma.project.findMany({
      where: { eventId, eligibility: 'ELIGIBLE' },
      select: {
        id: true,
        title: true,
        tagline: true,
        description: true,
        demoUrl: true,
        repoUrl: true,
        techStack: true,
        track: { select: { id: true, name: true } },
        team: isBlind ? false : { select: { name: true } },
      },
    });

    if (projects.length < 2) {
      return { pairs: [], completedCount: 0, totalPairs: 0, blindReviewActive: isBlind };
    }

    // Existing comparisons by this judge
    const existing = await this.prisma.pairwiseComparison.findMany({
      where: { eventId, judgeId },
    });

    const evaluatedKeys = new Set(
      existing.map((c) => [c.projectAId, c.projectBId].sort().join('::'))
    );

    // Generate balanced candidate pairs
    const pairs: Array<{ projectA: any; projectB: any; key: string }> = [];
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const key = [projects[i].id, projects[j].id].sort().join('::');
        if (!evaluatedKeys.has(key)) {
          pairs.push({
            projectA: { ...projects[i], blindReviewActive: isBlind },
            projectB: { ...projects[j], blindReviewActive: isBlind },
            key,
          });
        }
      }
    }

    return {
      pairs: pairs.slice(0, 10),
      completedCount: existing.length,
      remainingCount: pairs.length,
      blindReviewActive: isBlind,
    };
  }

  async getPairwiseComparisons(eventId: string) {
    return this.prisma.pairwiseComparison.findMany({
      where: { eventId },
      include: {
        judge: { select: { id: true, name: true } },
        projectA: { select: { id: true, title: true } },
        projectB: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
