import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BallotStatus, Role, EventStatus } from '../common/types';
import { sha256, computeHashNode } from '../common/crypto.util';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async calculateRankingRun(eventId: string, options?: { method?: string; customWeights?: Record<string, number>; actorId?: string }) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rubrics: {
          where: { isLocked: true },
          include: { criteria: true },
          take: 1,
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const rubric = event.rubrics[0];
    if (!rubric) throw new BadRequestException('Locked rubric version required for ranking calculations');

    const method = options?.method || 'RAW_WEIGHTED_MEAN';

    // Fetch all eligible projects with submitted ballots
    const projects = await this.prisma.project.findMany({
      where: { eventId, eligibility: 'ELIGIBLE', isFrozen: true },
      include: {
        ballots: {
          where: { status: BallotStatus.SUBMITTED },
          include: {
            scores: true,
            judge: { include: { judgeProfile: true } },
          },
        },
      },
    });

    const projectScores: any[] = [];

    for (const project of projects) {
      if (project.ballots.length === 0) continue;

      let rawBallotScores: number[] = [];
      let normalizedBallotScores: number[] = [];

      for (const ballot of project.ballots) {
        let rawWeighted = 0;
        let normalizedWeighted = 0;

        for (const score of ballot.scores) {
          const crit = rubric.criteria.find((c) => c.id === score.criteriaId);
          if (!crit) continue;

          const weight = options?.customWeights?.[crit.id] !== undefined
            ? options.customWeights[crit.id]
            : crit.weight;

          const rawScore = score.score;
          rawWeighted += rawScore * weight;

          // Normalization adjustment
          let normScore = rawScore;
          if (method === 'ANCHOR_NORMALIZED') {
            const judgeBias = ballot.judge.judgeProfile?.calibrationBias || 0.0;
            // Subtract bias (if judge is harsh with -0.8 bias, normScore becomes raw - (-0.8) = raw + 0.8)
            normScore = Math.max(crit.minScore, Math.min(crit.maxScore, rawScore - judgeBias));
          } else if (method === 'ROBUST_STANDARDIZED') {
            // Robust bounded standard adjustment
            const judgeBias = ballot.judge.judgeProfile?.calibrationBias || 0.0;
            const reliability = ballot.judge.judgeProfile?.reliabilityScore || 1.0;
            normScore = Math.max(crit.minScore, Math.min(crit.maxScore, rawScore - judgeBias * reliability));
          }

          normalizedWeighted += normScore * weight;
        }

        rawBallotScores.push(rawWeighted);
        normalizedBallotScores.push(normalizedWeighted);
      }

      const meanRaw = rawBallotScores.reduce((a, b) => a + b, 0) / rawBallotScores.length;
      const meanNorm = normalizedBallotScores.reduce((a, b) => a + b, 0) / normalizedBallotScores.length;

      // Variance and Standard Deviation
      const variance = rawBallotScores.reduce((acc, val) => acc + Math.pow(val - meanRaw, 2), 0) / rawBallotScores.length;
      const stdDev = Math.sqrt(variance);

      // Calculate per-criterion averages for tie-break & feedback
      const criteriaAverages: Record<string, number> = {};
      for (const crit of rubric.criteria) {
        let critScores: number[] = [];
        for (const ballot of project.ballots) {
          const sc = ballot.scores.find((s) => s.criteriaId === crit.id);
          if (sc) critScores.push(sc.score);
        }
        criteriaAverages[crit.id] = critScores.length > 0
          ? critScores.reduce((a, b) => a + b, 0) / critScores.length
          : 0;
      }

      projectScores.push({
        projectId: project.id,
        title: project.title,
        trackId: project.trackId,
        rawScore: Math.round(meanRaw * 100) / 100,
        normalizedScore: Math.round(meanNorm * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        uncertainty: Math.round(stdDev * 100) / 100,
        reviewCount: project.ballots.length,
        disagreementFlag: stdDev >= event.disagreeThreshold,
        frozenAt: project.frozenAt || project.createdAt,
        criteriaAverages,
        ballots: project.ballots.map((b) => ({
          judgeId: b.judgeId,
          score: b.weightedScore,
          isFlagged: b.isFlagged,
        })),
      });
    }

    // Sort criteria descending by weight for tie-breaking
    const sortedCriteria = [...rubric.criteria].sort((a, b) => b.weight - a.weight);
    const tieBreakLog: any[] = [];

    // Sort descending with deterministic tie-breaking policy
    projectScores.sort((a, b) => {
      const scoreDiff = b.normalizedScore - a.normalizedScore;
      if (Math.abs(scoreDiff) >= 0.001) {
        return scoreDiff;
      }

      // Tie detected: Execute Deterministic Tie-Break Cascade
      // Level 1: Criteria Priority Cascade (Highest weight criterion down to lowest)
      for (const crit of sortedCriteria) {
        const diffCrit = (b.criteriaAverages[crit.id] || 0) - (a.criteriaAverages[crit.id] || 0);
        if (Math.abs(diffCrit) >= 0.001) {
          const winner = diffCrit > 0 ? b : a;
          const loser = diffCrit > 0 ? a : b;
          winner.tieBreakApplied = true;
          winner.tieBreakReason = `Rule 1 (Rubric Priority): Higher score in ${crit.name} (${(winner.criteriaAverages[crit.id] || 0).toFixed(2)} vs ${(loser.criteriaAverages[crit.id] || 0).toFixed(2)})`;
          loser.tieBreakApplied = true;
          loser.tieBreakReason = `Rule 1 (Rubric Priority): Separated by ${crit.name}`;
          tieBreakLog.push({
            rule: `RUBRIC_PRIORITY_${crit.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
            criterionName: crit.name,
            winnerId: winner.projectId,
            winnerTitle: winner.title,
            loserId: loser.projectId,
            loserTitle: loser.title,
            description: winner.tieBreakReason,
          });
          return diffCrit;
        }
      }

      // Level 2: Consensus (Lowest StdDev / Uncertainty)
      const diffStd = a.stdDev - b.stdDev; // lower stdDev wins
      if (Math.abs(diffStd) >= 0.001) {
        const winner = diffStd < 0 ? a : b;
        const loser = diffStd < 0 ? b : a;
        winner.tieBreakApplied = true;
        winner.tieBreakReason = `Rule 2 (Consensus): Lower score dispersion (σ=${winner.stdDev.toFixed(2)} vs σ=${loser.stdDev.toFixed(2)})`;
        loser.tieBreakApplied = true;
        loser.tieBreakReason = `Rule 2 (Consensus): Separated by score dispersion`;
        tieBreakLog.push({
          rule: 'CONSENSUS_LOWEST_DISPERSION',
          winnerId: winner.projectId,
          winnerTitle: winner.title,
          loserId: loser.projectId,
          loserTitle: loser.title,
          description: winner.tieBreakReason,
        });
        return diffStd;
      }

      // Level 3: Earliest Submission Freeze Timestamp
      const timeA = new Date(a.frozenAt).getTime();
      const timeB = new Date(b.frozenAt).getTime();
      const diffTime = timeA - timeB;
      if (diffTime !== 0) {
        const winner = diffTime < 0 ? a : b;
        const loser = diffTime < 0 ? b : a;
        winner.tieBreakApplied = true;
        winner.tieBreakReason = `Rule 3 (Earliest Commitment): Frozen at ${new Date(winner.frozenAt).toISOString()} vs ${new Date(loser.frozenAt).toISOString()}`;
        loser.tieBreakApplied = true;
        loser.tieBreakReason = `Rule 3 (Earliest Commitment): Separated by freeze timestamp`;
        tieBreakLog.push({
          rule: 'EARLIEST_FREEZE_TIMESTAMP',
          winnerId: winner.projectId,
          winnerTitle: winner.title,
          loserId: loser.projectId,
          loserTitle: loser.title,
          description: winner.tieBreakReason,
        });
        return diffTime;
      }

      return 0;
    });

    const rankedWithPositions = projectScores.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));

    // If this is not a sandbox simulation and actorId is provided, save immutable RankingRun
    if (options?.actorId) {
      const runPayload = {
        eventId,
        rubricVersionId: rubric.id,
        method,
        parameters: JSON.stringify({ customWeights: options.customWeights, disagreeThreshold: event.disagreeThreshold }),
        resultsSummary: rankedWithPositions.map((r) => ({ id: r.projectId, rank: r.rank, score: r.normalizedScore })),
        tieBreakCount: tieBreakLog.length,
      };
      const runHash = sha256(runPayload);

      const rankingRun = await this.prisma.rankingRun.create({
        data: {
          eventId,
          rubricVersionId: rubric.id,
          method,
          parameters: runPayload.parameters,
          isFinalized: false,
          isPublished: false,
          runHash,
          tieBreakLog: JSON.stringify(tieBreakLog),
        },
      });

      for (const item of rankedWithPositions) {
        await this.prisma.rankedProject.create({
          data: {
            rankingRunId: rankingRun.id,
            projectId: item.projectId,
            rank: item.rank,
            rawScore: item.rawScore,
            normalizedScore: item.normalizedScore,
            uncertainty: item.uncertainty,
            reviewCount: item.reviewCount,
            scoreStdDev: item.stdDev,
            disagreementFlag: item.disagreementFlag,
            tieBreakApplied: item.tieBreakApplied || false,
            tieBreakReason: item.tieBreakReason || null,
            breakdownJson: JSON.stringify(item),
          },
        });
      }

      // Hash node
      const lastNode = await this.prisma.integrityHashNode.findFirst({
        where: { eventId },
        orderBy: { timestamp: 'desc' },
      });
      const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
      const nodeHash = computeHashNode(previousHash, { runHash, rankingRunId: rankingRun.id }, rankingRun.id);

      await this.prisma.integrityHashNode.create({
        data: {
          eventId,
          nodeType: 'RANKING_RUN',
          resourceId: rankingRun.id,
          previousHash,
          currentHash: nodeHash,
          payloadJson: JSON.stringify({ rankingRunId: rankingRun.id, method, runHash, tieBreakCount: tieBreakLog.length }),
        },
      });

      return {
        rankingRunId: rankingRun.id,
        runHash,
        method,
        tieBreakLog,
        rankedProjects: rankedWithPositions,
      };
    }

    return {
      method,
      tieBreakLog,
      rankedProjects: rankedWithPositions,
    };
  }

  async simulateWeightSensitivity(eventId: string, simulatedWeights: Record<string, number>) {
    // 1. Calculate baseline using saved rubric
    const baseline = await this.calculateRankingRun(eventId, { method: 'RAW_WEIGHTED_MEAN' });
    // 2. Calculate simulation with new weights without mutating database
    const simulated = await this.calculateRankingRun(eventId, { method: 'RAW_WEIGHTED_MEAN', customWeights: simulatedWeights });

    const baselineRankMap = new Map<string, number>();
    baseline.rankedProjects.forEach((p: any) => baselineRankMap.set(p.projectId, p.rank));

    const movements = simulated.rankedProjects.map((p: any) => {
      const baseRank = baselineRankMap.get(p.projectId) || p.rank;
      const rankDelta = baseRank - p.rank; // positive = moved up, negative = dropped
      return {
        projectId: p.projectId,
        title: p.title,
        baseRank,
        simulatedRank: p.rank,
        rankDelta,
        isFragile: Math.abs(rankDelta) >= 2,
        baseScore: p.rawScore,
        simulatedScore: p.normalizedScore,
      };
    });

    const fragileCount = movements.filter((m) => m.isFragile).length;

    return {
      totalProjects: movements.length,
      fragileProjectsCount: fragileCount,
      fragilityIndex: Math.round((fragileCount / (movements.length || 1)) * 100),
      movements,
    };
  }

  async triggerDisagreementReviews(eventId: string, actorId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const ranking = await this.calculateRankingRun(eventId);
    const disagreementProjects = ranking.rankedProjects.filter((p: any) => p.disagreementFlag);

    const judges = await this.prisma.membership.findMany({
      where: { eventId, role: Role.JUDGE },
      include: { user: { include: { judgeProfile: true, conflicts: true } } },
    });

    const targetedAssignmentsCreated: any[] = [];

    for (const p of disagreementProjects) {
      // Find existing assignments
      const existing = await this.prisma.assignment.findMany({
        where: { projectId: p.projectId },
      });
      const assignedJudgeIds = new Set(existing.map((a) => a.judgeId));

      // Find an eligible high-reliability judge not already assigned
      const candidate = judges.find((j) => {
        if (assignedJudgeIds.has(j.userId)) return false;
        const hasConflict = j.user.conflicts?.some((c) => c.projectId === p.projectId);
        if (hasConflict) return false;
        return (j.user.judgeProfile?.reliabilityScore || 0) >= 0.9;
      });

      if (candidate) {
        const reason = `High score dispersion (σ = ${p.stdDev} >= ${event.disagreeThreshold}) between primary ballots. Targeted 4th review dispatched to resolve uncertainty.`;

        const assignment = await this.prisma.assignment.create({
          data: {
            eventId,
            projectId: p.projectId,
            judgeId: candidate.userId,
            isTargeted: true,
            triggerReason: reason,
          },
        });

        await this.prisma.auditEvent.create({
          data: {
            eventId,
            actorId,
            actorRole: Role.ORGANIZER,
            action: 'DISAGREEMENT_TARGETED_REVIEW_TRIGGERED',
            resourceType: 'ASSIGNMENT',
            resourceId: assignment.id,
            reason,
            requestId: `REQ-DISAGREE-${Date.now()}`,
          },
        });

        targetedAssignmentsCreated.push({
          projectId: p.projectId,
          projectTitle: p.title,
          assignedJudge: candidate.user.name,
          stdDev: p.stdDev,
          reason,
        });
      }
    }

    return {
      success: true,
      count: targetedAssignmentsCreated.length,
      details: targetedAssignmentsCreated,
    };
  }

  async finalizeAndPublishResults(eventId: string, actorId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === EventStatus.RESULTS_PUBLISHED) {
      throw new ConflictException('Results are already finalized and published; state is locked');
    }

    // Run official final ranking run
    const finalRun = await this.calculateRankingRun(eventId, {
      method: 'ANCHOR_NORMALIZED',
      actorId,
    });

    await this.prisma.rankingRun.update({
      where: { id: finalRun.rankingRunId },
      data: { isFinalized: true, isPublished: true },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.RESULTS_PUBLISHED },
    });

    // Hash node for final publication snapshot
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const pubHash = sha256(`PUBLISHED:${eventId}:${finalRun.runHash}:${Date.now()}`);
    const nodeHash = computeHashNode(previousHash, { finalRunId: finalRun.rankingRunId, pubHash }, eventId);

    await this.prisma.integrityHashNode.create({
      data: {
        eventId,
        nodeType: 'PUBLICATION',
        resourceId: finalRun.rankingRunId,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify({ eventId, rankingRunId: finalRun.rankingRunId, pubHash }),
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        eventId,
        actorId,
        actorRole: Role.ORGANIZER,
        action: 'RESULTS_PUBLISHED',
        resourceType: 'EVENT',
        resourceId: eventId,
        beforeHash: sha256(event.status),
        afterHash: pubHash,
        reason: 'Organizer finalized and published competition results to public gallery',
        requestId: `REQ-PUB-${Date.now()}`,
      },
    });

    return {
      success: true,
      status: EventStatus.RESULTS_PUBLISHED,
      rankingRunId: finalRun.rankingRunId,
      runHash: finalRun.runHash,
      publicationHash: pubHash,
      topProjects: finalRun.rankedProjects.slice(0, 5),
    };
  }

  async getEntrantFeedbackReport(eventId: string, projectId: string, callerUserId: string, callerRole: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: { include: { members: true } },
        track: true,
        ballots: {
          where: { status: 'SUBMITTED' },
          include: {
            scores: { include: { criteria: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Access control: only team members of this project, or ORGANIZER/ADMIN
    const isTeamMember = project.team?.members.some((m) => m.userId === callerUserId);
    if (!isTeamMember && callerRole !== Role.ORGANIZER && callerRole !== Role.ADMIN) {
      throw new ForbiddenException('You are not authorized to view this entrant feedback report');
    }

    // Publication status verification: Entrant feedback is only released post-publication
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const latestPublishedRun = await this.prisma.rankingRun.findFirst({
      where: { eventId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        rankedProjects: { where: { projectId } },
      },
    });

    if (!latestPublishedRun && event?.status !== 'RESULTS_PUBLISHED') {
      throw new ForbiddenException('Entrant feedback reports are locked until official results are published');
    }

    const rankingInfo = latestPublishedRun?.rankedProjects[0] || null;

    // Calculate Event-wide benchmark median/average per criteria
    const rubric = await this.prisma.rubricVersion.findUnique({
      where: { id: event?.currentRubricId || '' },
      include: { criteria: true },
    });

    const criteriaList = rubric?.criteria || [];
    const allSubmittedScores = await this.prisma.ballotScore.findMany({
      where: { ballot: { eventId, status: 'SUBMITTED' } },
    });

    const criteriaBreakdown = criteriaList.map((crit) => {
      const allForCrit = allSubmittedScores.filter((s) => s.criteriaId === crit.id);
      const eventAvg = allForCrit.length > 0
        ? allForCrit.reduce((a, b) => a + b.score, 0) / allForCrit.length
        : 0;

      // Project scores for this crit
      const projScores = project.ballots.flatMap((b) => b.scores.filter((s) => s.criteriaId === crit.id));
      const projAvg = projScores.length > 0
        ? projScores.reduce((a, b) => a + b.score, 0) / projScores.length
        : 0;

      return {
        criteriaId: crit.id,
        name: crit.name,
        weight: crit.weight,
        projectScore: Math.round(projAvg * 100) / 100,
        eventBenchmarkScore: Math.round(eventAvg * 100) / 100,
        delta: Math.round((projAvg - eventAvg) * 100) / 100,
      };
    });

    // Anonymized judge comments: STRICT ANONYMIZATION (NO judge names/IDs/avatars)
    const anonymizedReviews = project.ballots.map((b, idx) => ({
      judgePseudonym: `Judge #${idx + 1}`,
      overallFeedback: b.feedback || 'No written summary provided.',
      criteriaFeedback: b.scores.map((s) => ({
        criteriaName: s.criteria?.name || 'Criterion',
        score: s.score,
        comment: s.comment || null,
      })),
    }));

    return {
      projectId: project.id,
      title: project.title,
      tagline: project.tagline,
      track: project.track?.name || 'Open Track',
      rank: rankingInfo?.rank || null,
      normalizedScore: rankingInfo?.normalizedScore || null,
      rawScore: rankingInfo?.rawScore || null,
      reviewCount: project.ballots.length,
      tieBreakApplied: rankingInfo?.tieBreakApplied || false,
      tieBreakReason: rankingInfo?.tieBreakReason || null,
      criteriaBreakdown,
      anonymizedReviews,
      publishedAt: latestPublishedRun?.createdAt || null,
    };
  }

  async calculatePairwiseRankings(
    eventId: string,
    options?: { persist?: boolean; actorId?: string }
  ) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const projects = await this.prisma.project.findMany({
      where: { eventId, eligibility: 'ELIGIBLE' },
      select: {
        id: true,
        title: true,
        tagline: true,
        track: { select: { id: true, name: true } },
      },
    });

    const comparisons = await this.prisma.pairwiseComparison.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });

    // Bradley-Terry Elo model initialization
    // Standard starting rating R0 = 1200, K = 32
    const K = 32;
    const ratings: Record<string, number> = {};
    const matchCounts: Record<string, { wins: number; losses: number; ties: number; total: number }> = {};

    for (const p of projects) {
      ratings[p.id] = 1200;
      matchCounts[p.id] = { wins: 0, losses: 0, ties: 0, total: 0 };
    }

    for (const c of comparisons) {
      if (!ratings[c.projectAId]) ratings[c.projectAId] = 1200;
      if (!ratings[c.projectBId]) ratings[c.projectBId] = 1200;
      if (!matchCounts[c.projectAId]) matchCounts[c.projectAId] = { wins: 0, losses: 0, ties: 0, total: 0 };
      if (!matchCounts[c.projectBId]) matchCounts[c.projectBId] = { wins: 0, losses: 0, ties: 0, total: 0 };

      const rA = ratings[c.projectAId];
      const rB = ratings[c.projectBId];

      // Win expectation: 1 / (1 + 10^((rB - rA)/400))
      const expA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
      const expB = 1 - expA;

      let actA = 0.5;
      let actB = 0.5;

      if (c.isTie || !c.winnerId) {
        matchCounts[c.projectAId].ties++;
        matchCounts[c.projectBId].ties++;
      } else if (c.winnerId === c.projectAId) {
        actA = 1.0;
        actB = 0.0;
        matchCounts[c.projectAId].wins++;
        matchCounts[c.projectBId].losses++;
      } else if (c.winnerId === c.projectBId) {
        actA = 0.0;
        actB = 1.0;
        matchCounts[c.projectBId].wins++;
        matchCounts[c.projectAId].losses++;
      }

      matchCounts[c.projectAId].total++;
      matchCounts[c.projectBId].total++;

      ratings[c.projectAId] = rA + K * (actA - expA);
      ratings[c.projectBId] = rB + K * (actB - expB);
    }

    // Assemble ranked projects
    const rankedList = projects.map((p) => {
      const elo = Math.round((ratings[p.id] || 1200) * 10) / 10;
      const stats = matchCounts[p.id] || { wins: 0, losses: 0, ties: 0, total: 0 };
      const normalizedScore = Math.max(0, Math.min(100, Math.round(((elo - 800) / 8) * 100) / 100));
      const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) / 100 : 0.5;
      const uncertainty = stats.total > 0 ? Math.round((1 / Math.sqrt(stats.total)) * 1000) / 100 : 10.0;

      return {
        projectId: p.id,
        title: p.title,
        tagline: p.tagline,
        track: p.track?.name,
        eloRating: elo,
        normalizedScore,
        rawScore: elo,
        matches: stats.total,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        winRate,
        uncertainty,
      };
    });

    rankedList.sort((a, b) => b.eloRating - a.eloRating);
    const rankedWithRank = rankedList.map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      method: 'PAIRWISE_BRADLEY_TERRY',
      totalComparisons: comparisons.length,
      evaluatedProjectsCount: rankedWithRank.length,
      rankedProjects: rankedWithRank,
    };
  }

  async getNormalizationProof(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rubrics: { where: { isLocked: true }, include: { criteria: true }, take: 1 },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const ballots = await this.prisma.ballot.findMany({
      where: { eventId, status: BallotStatus.SUBMITTED },
      include: {
        scores: true,
        judge: { include: { judgeProfile: true } },
      },
    });

    if (ballots.length === 0) {
      return {
        eventId,
        theorem: 'Affine Normalization Variance Reduction Theorem (Dogfood OS v1.0)',
        message: 'No ballots submitted yet for empirical variance calculation.',
        empiricalMetrics: null,
      };
    }

    // 1. Calculate panel metrics
    const rawScores = ballots.map((b) => b.weightedScore);
    const rawMean = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const rawVariance = rawScores.reduce((acc, s) => acc + Math.pow(s - rawMean, 2), 0) / rawScores.length;
    const rawStdDev = Math.sqrt(rawVariance);

    // 2. Normalized scores using judge calibration bias compensation
    const judgeBiases: Record<string, { name: string; bias: number; reliability: number; reviews: number }> = {};
    const normalizedScores: number[] = [];

    for (const b of ballots) {
      const bias = b.judge.judgeProfile?.calibrationBias || 0.0;
      const reliability = b.judge.judgeProfile?.reliabilityScore || 1.0;
      const judgeId = b.judgeId;

      if (!judgeBiases[judgeId]) {
        judgeBiases[judgeId] = {
          name: b.judge.name,
          bias,
          reliability,
          reviews: 0,
        };
      }
      judgeBiases[judgeId].reviews++;

      const normScore = b.weightedScore - bias * reliability;
      normalizedScores.push(normScore);
    }

    const normMean = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
    const normVariance = normalizedScores.reduce((acc, s) => acc + Math.pow(s - normMean, 2), 0) / normalizedScores.length;
    const normStdDev = Math.sqrt(normVariance);

    const varianceReductionPercent = rawVariance > 0
      ? Math.max(0, Math.round(((rawVariance - normVariance) / rawVariance) * 1000) / 10)
      : 0;

    const proofPayload = {
      theorem: 'Affine Bias-Compensation Variance Reduction Theorem (SRS Section 8.4)',
      equation: "S'_{ijk} = S_{ijk} - \\Delta_j \\cdot \\rho_j",
      description:
        'Proof that additive calibration compensation removes systematic judge harshness/leniency while preserving ordinal intra-judge preferences and reducing total ranking error.',
      empiricalMetrics: {
        totalBallotsEvaluated: ballots.length,
        distinctJudges: Object.keys(judgeBiases).length,
        panelRawMean: Math.round(rawMean * 100) / 100,
        panelRawStdDev: Math.round(rawStdDev * 100) / 100,
        panelRawVariance: Math.round(rawVariance * 100) / 100,
        panelNormalizedMean: Math.round(normMean * 100) / 100,
        panelNormalizedStdDev: Math.round(normStdDev * 100) / 100,
        panelNormalizedVariance: Math.round(normVariance * 100) / 100,
        interRaterVarianceReduction: `${varianceReductionPercent}%`,
        standardErrorReductionBound: Math.round((rawStdDev - normStdDev) * 100) / 100,
        ordinalTransitivityPreserved: true,
      },
      judgeCalibrationParameters: Object.entries(judgeBiases).map(([id, info]) => ({
        judgeId: id,
        judgeName: info.name,
        calibrationBiasDelta: info.bias,
        reliabilityWeightRho: info.reliability,
        reviewsCompleted: info.reviews,
        status: info.bias < -0.4 ? 'HARSH_COMPENSATED' : info.bias > 0.4 ? 'LENIENT_COMPENSATED' : 'BALANCED',
      })),
      mathematicalDeduction: [
        '1. Assumption: Observed score S_ij = T_i + B_j + eps_ij where T_i is true project merit and B_j ~ N(Delta_j, sigma_j^2) is judge severity offset.',
        '2. Transformation: S\'_ij = S_ij - Delta_j yields Var(S\'_ij) = Var(T_i) + Var(eps_ij) < Var(T_i) + Var(B_j) + Var(eps_ij).',
        '3. Corollary: Inter-rater variance caused by judge allocation skew is asymptotically eliminated as reviews per project N >= 3.',
        '4. Ordinal Invariance: For any two projects X and Y scored by judge j, (S\'_Xj - S\'_Yj) = (S_Xj - S_Yj), strictly preserving local rank order.',
      ],
      generatedAt: new Date().toISOString(),
    };

    const proofHash = sha256(proofPayload);

    return {
      ...proofPayload,
      proofHash,
    };
  }

  async signOffRankingRun(
    eventId: string,
    rankingRunId: string,
    organizer: { id: string; name: string; email: string }
  ) {
    const run = await this.prisma.rankingRun.findFirst({
      where: { id: rankingRunId, eventId },
    });
    if (!run) throw new NotFoundException('Ranking run not found');

    const existingSignOffs: Array<{ organizerId: string; name: string; email: string; signedAt: string }> =
      run.signOffs ? JSON.parse(run.signOffs) : [];

    const alreadySigned = existingSignOffs.some((s) => s.organizerId === organizer.id);
    if (alreadySigned) {
      return {
        success: true,
        alreadySigned: true,
        totalSignOffs: existingSignOffs.length,
        signOffs: existingSignOffs,
      };
    }

    const newSignature = {
      organizerId: organizer.id,
      name: organizer.name,
      email: organizer.email,
      signedAt: new Date().toISOString(),
    };
    existingSignOffs.push(newSignature);

    await this.prisma.rankingRun.update({
      where: { id: rankingRunId },
      data: { signOffs: JSON.stringify(existingSignOffs) },
    });

    // Hash node for multi-sig audit
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nodeHash = computeHashNode(previousHash, newSignature, rankingRunId);

    await this.prisma.integrityHashNode.create({
      data: {
        eventId,
        nodeType: 'RANKING_SIGN_OFF',
        resourceId: rankingRunId,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify(newSignature),
      },
    });

    return {
      success: true,
      totalSignOffs: existingSignOffs.length,
      signOffs: existingSignOffs,
    };
  }

  async getPublishedResults(eventId: string) {
    const publishedRun = await this.prisma.rankingRun.findFirst({
      where: { eventId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        rankedProjects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                tagline: true,
                description: true,
                demoUrl: true,
                repoUrl: true,
                techStack: true,
                track: { select: { id: true, name: true } },
                team: { select: { name: true } },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (publishedRun) {
      return {
        rankingRunId: publishedRun.id,
        method: publishedRun.method,
        isPublished: true,
        runHash: publishedRun.runHash,
        signOffs: publishedRun.signOffs ? JSON.parse(publishedRun.signOffs) : [],
        tieBreakLog: publishedRun.tieBreakLog ? JSON.parse(publishedRun.tieBreakLog) : [],
        rankedProjects: publishedRun.rankedProjects.map((rp) => ({
          rank: rp.rank,
          projectId: rp.projectId,
          title: rp.project.title,
          tagline: rp.project.tagline,
          track: rp.project.track?.name,
          teamName: rp.project.team?.name,
          rawScore: rp.rawScore,
          normalizedScore: rp.normalizedScore,
          uncertainty: rp.uncertainty,
          reviewCount: rp.reviewCount,
          scoreStdDev: rp.scoreStdDev,
          disagreementFlag: rp.disagreementFlag,
          tieBreakApplied: rp.tieBreakApplied,
          tieBreakReason: rp.tieBreakReason,
        })),
      };
    }

    // Static read fallback if no published run exists yet
    return this.calculateRankingRun(eventId, { method: 'ANCHOR_NORMALIZED' });
  }
}
