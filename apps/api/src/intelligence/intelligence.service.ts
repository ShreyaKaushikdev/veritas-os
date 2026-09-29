import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IntelligenceService {
  constructor(private prisma: PrismaService) {}

  async generateIdeaPotentialReport(data: {
    eventId: string;
    projectId?: string;
    ideaTitle: string;
    ideaDescription: string;
    techStack: string;
    features: string[];
    teamHours: number;
    teamSkills?: string[];
  }) {
    // ✅ FIX #4: Data Isolation - Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: data.eventId },
      include: {
        rubrics: {
          where: { isLocked: true },
          include: { criteria: true },
          take: 1,
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    
    // ✅ FIX #4: Data Isolation - If projectId provided, verify it belongs to this event
    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId }
      });
      if (!project || project.eventId !== data.eventId) {
        throw new ForbiddenException('Project does not belong to this event');
      }
    }

    const rubric = event.rubrics[0];
    const criteriaList = (rubric && rubric.criteria && rubric.criteria.length > 0)
      ? rubric.criteria
      : [
          { id: '1', name: 'Technical Depth & Architecture', weight: 0.35, minScore: 1, maxScore: 10 },
          { id: '2', name: 'Rubric Alignment & Feasibility', weight: 0.25, minScore: 1, maxScore: 10 },
          { id: '3', name: 'Novelty & Problem Insight', weight: 0.20, minScore: 1, maxScore: 10 },
          { id: '4', name: 'Evidence & Reproducibility', weight: 0.20, minScore: 1, maxScore: 10 },
        ];

    // Rule-based heuristic evaluation engine (runs deterministic & air-gapped)
    const hours = data.teamHours || 48;
    const featureCount = data.features?.length || 1;
    const textLength = (data.ideaDescription || '').length;
    const hasArchitecture = /architecture|modular|interface|boundary|pipeline|database|protocol/i.test(data.ideaDescription);
    const hasSecurityOrEdge = /security|tamper|offline|sandbox|audit|error|fallback/i.test(data.ideaDescription);
    const hasBenchmark = /benchmark|test|fuzz|reproduc|receipt/i.test(data.ideaDescription);

    // Scope Pressure Calculation
    let scopePressure = 'ACHIEVABLE';
    let scopeReason = `${featureCount} features mapped within ${hours} declared engineer-hours.`;
    if (featureCount > 7 && hours <= 48) {
      scopePressure = 'UNREALISTIC';
      scopeReason = `${featureCount} complex features declared for ${hours}h budget. High likelihood of surface-level execution.`;
    } else if (featureCount > 4 && hours <= 36) {
      scopePressure = 'AT_RISK';
      scopeReason = `${featureCount} features leaves little margin for testing, documentation, or unexpected debugging.`;
    }

    // Confidence Level
    let confidence = 'MEDIUM';
    let confidenceReason = 'Preliminary estimate based on self-reported architecture and features. True ranking depends on working code evidence and judge calibration.';
    if (textLength > 400 && hasArchitecture && hasBenchmark) {
      confidence = 'HIGH';
      confidenceReason = 'Detailed technical specifications and concrete verification strategy identified in description.';
    } else if (textLength < 150) {
      confidence = 'LOW';
      confidenceReason = 'Idea description is very brief; criterion bands reflect wide uncertainty bounds.';
    }

    // Rubric Criteria Bands Calculation
    const criteriaBands: Record<string, { band: string; reason: string }> = {};
    let totalMin = 0;
    let totalMax = 0;

    for (const crit of criteriaList) {
      let base = 6.5;
      let reason = 'Solid baseline alignment with expected hackathon deliverable.';

      if (crit.name.includes('Depth') || crit.name.includes('Architecture')) {
        if (hasArchitecture) {
          base += 1.8;
          reason = 'Concrete architectural constructs and modular components specified.';
        } else {
          base -= 1.2;
          reason = 'System architecture undefined; high risk of monolithic or fragile code.';
        }
      } else if (crit.name.includes('Feasibility') || crit.name.includes('Alignment')) {
        if (scopePressure === 'ACHIEVABLE') {
          base += 1.5;
          reason = 'Scope appears disciplined and deliverable in event timeframe.';
        } else if (scopePressure === 'UNREALISTIC') {
          base -= 2.2;
          reason = 'Over-scoped feature commitment poses serious risk to working demo.';
        }
      } else if (crit.name.includes('Novelty') || crit.name.includes('Insight')) {
        if (hasSecurityOrEdge) {
          base += 1.6;
          reason = 'Addresses genuine edge cases, offline safety, or tamper resistance.';
        } else {
          base += 0.5;
          reason = 'Standard technical approach; consider highlighting non-obvious algorithmic advantages.';
        }
      } else if (crit.name.includes('Evidence') || crit.name.includes('Reproducibility')) {
        if (hasBenchmark) {
          base += 1.9;
          reason = 'Includes reproducible benchmarks, automated tests, or verifiable proofs.';
        } else {
          base -= 1.5;
          reason = 'Missing verification plan; prepare single-command local testing script.';
        }
      }

      const minB = Math.max(1.0, Math.round((base - 0.8) * 10) / 10);
      const maxB = Math.min(10.0, Math.round((base + 0.8) * 10) / 10);

      criteriaBands[crit.name] = {
        band: `${minB} - ${maxB} / 10`,
        reason,
      };

      totalMin += minB * crit.weight * 10;
      totalMax += maxB * crit.weight * 10;
    }

    const minPotential = Math.round(totalMin);
    const maxPotential = Math.round(totalMax);

    // Blind spots
    const blindSpots: string[] = [];
    if (!hasArchitecture) blindSpots.push('Missing explicit module boundaries and inter-process communication model.');
    if (!hasBenchmark) blindSpots.push('No documented local benchmarking or automated verification path.');
    if (!hasSecurityOrEdge) blindSpots.push('No analysis of failure modes or network partition behavior.');
    if (featureCount > 5) blindSpots.push('Lack of fallback plan if secondary features fail during the demo.');

    // Top 3 Actionable Improvements
    const improvementActions: string[] = [
      'Scope reduction: Lock the primary core vertical slice first before implementing peripheral features.',
      'Evidence guarantee: Provide a single offline run script (e.g. `docker compose up` or `npm test`) with zero network dependency.',
      'Defensible demo: Prepare a deterministic scenario script showing error recovery and boundary verification.',
    ];

    const report = await this.prisma.ideaReport.create({
      data: {
        projectId: data.projectId || null,
        eventId: data.eventId,
        inputSummary: `Idea: "${data.ideaTitle}" (${data.features.length} features, ${data.techStack})`,
        minPotential,
        maxPotential,
        confidence,
        confidenceReason,
        scopePressure,
        scopeReason,
        blindSpots: JSON.stringify(blindSpots),
        improvementActions: JSON.stringify(improvementActions),
        criteriaBands: JSON.stringify(criteriaBands),
      },
    });

    return {
      id: report.id,
      overallPotential: `${minPotential} - ${maxPotential} / 100`,
      minPotential,
      maxPotential,
      confidence,
      confidenceReason,
      scopePressure,
      scopeReason,
      criteriaBands,
      blindSpots,
      improvementActions,
      disclaimer: 'DOGFOOD OS Coach provides rubric alignment guidance and uncertainty estimates. It CANNOT predict final judge preference or unseen competitor submissions.',
    };
  }

  async getReport(reportId: string, eventId: string) {
    // ✅ FIX #4: Data Isolation - Verify report belongs to this event
    const report = await this.prisma.ideaReport.findUnique({ 
      where: { id: reportId } 
    });
    if (!report) throw new NotFoundException('Report not found');
    
    if (report.eventId !== eventId) {
      throw new ForbiddenException('Report does not belong to this event');
    }

    return {
      ...report,
      blindSpots: JSON.parse(report.blindSpots || '[]'),
      improvementActions: JSON.parse(report.improvementActions || '[]'),
      criteriaBands: JSON.parse(report.criteriaBands || '{}'),
    };
  }

  async deleteReport(reportId: string, eventId: string) {
    // ✅ FIX #4: Data Isolation - Verify report belongs to this event before deletion
    const report = await this.prisma.ideaReport.findUnique({
      where: { id: reportId }
    });
    if (!report) throw new NotFoundException('Report not found');
    
    if (report.eventId !== eventId) {
      throw new ForbiddenException('Report does not belong to this event');
    }

    await this.prisma.ideaReport.delete({ where: { id: reportId } });
    return { success: true };
  }
}
