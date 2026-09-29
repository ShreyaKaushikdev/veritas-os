import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ThirdPartyIntegrationService } from './third-party-integration.service';

export interface IdeaAnalysis {
  scoreBand: { min: number; max: number; predicted: number };
  scopePressure: { level: string; gauge: number; warning?: string };
  blindSpots: Array<{ criterion: string; gap: string; severity: 'high' | 'medium' | 'low' }>;
  strengths: string[];
  actionableImprovements: Array<{ priority: number; suggestion: string; impact: string }>;
  rubricCoverage: { [criterion: string]: { covered: boolean; score: number; feedback: string } };
  competitorComparison: { percentile: number; differentiators: string[] };
  readabilityScore: number;
  technicalDepth: number;
  innovationScore: number;
}

@Injectable()
export class IdeaRefinementService {
  constructor(
    private prisma: PrismaService,
    private thirdParty: ThirdPartyIntegrationService,
  ) {}

  async analyzeIdea(eventId: string, data: any): Promise<IdeaAnalysis> {
    // Fetch event rubric
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { rubrics: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Perform multi-dimensional analysis
    const [
      rubricAnalysis,
      scopeAnalysis,
      blindspotAnalysis,
      competitorAnalysis,
      qualityMetrics,
      aiEnhancement,
    ] = await Promise.all([
      this.analyzeAgainstRubric(data, event.rubrics),
      this.analyzeScopePressure(data),
      this.detectBlindspots(data, event.rubrics),
      this.compareWithCompetitors(eventId, data),
      this.calculateQualityMetrics(data),
      this.getAIEnhancements(data),
    ]);

    return {
      scoreBand: this.calculateScoreBand(rubricAnalysis),
      scopePressure: scopeAnalysis,
      blindSpots: blindspotAnalysis,
      strengths: this.extractStrengths(rubricAnalysis, qualityMetrics),
      actionableImprovements: this.generateImprovements(
        rubricAnalysis,
        blindspotAnalysis,
        aiEnhancement,
      ),
      rubricCoverage: rubricAnalysis,
      competitorComparison: competitorAnalysis,
      ...qualityMetrics,
    };
  }

  private async analyzeAgainstRubric(data: any, rubrics: any[]) {
    const coverage: any = {};

    for (const rubric of rubrics) {
      const criteriaAnalysis = await this.analyzeCriterion(
        data.title + ' ' + data.description,
        rubric,
      );
      coverage[rubric.name] = criteriaAnalysis;
    }

    return coverage;
  }

  private async analyzeCriterion(content: string, rubric: any) {
    // Use AI/NLP to analyze how well content matches criterion
    const keywords = this.extractCriterionKeywords(rubric);
    const keywordMatches = keywords.filter((kw) =>
      content.toLowerCase().includes(kw.toLowerCase()),
    ).length;

    const coveragePercent = (keywordMatches / Math.max(keywords.length, 1)) * 100;
    const score = Math.min((coveragePercent / 100) * rubric.maxScore, rubric.maxScore);

    return {
      covered: coveragePercent > 30,
      score: Math.round(score * 10) / 10,
      feedback: this.generateCriterionFeedback(rubric.name, coveragePercent, content),
    };
  }

  private extractCriterionKeywords(rubric: any): string[] {
    // Extract keywords from rubric description/criteria
    const text = (rubric.description || '') + ' ' + (rubric.name || '');
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4);
    return [...new Set(words)];
  }

  private generateCriterionFeedback(criterion: string, coverage: number, content: string): string {
    if (coverage > 70) {
      return `Strong coverage of ${criterion}. Well articulated.`;
    } else if (coverage > 40) {
      return `Moderate coverage of ${criterion}. Consider expanding this aspect.`;
    } else {
      return `Limited coverage of ${criterion}. This needs more attention and detail.`;
    }
  }

  private async analyzeScopePressure(data: any): Promise<any> {
    const content = data.title + ' ' + data.description;
    const wordCount = content.split(/\s+/).length;

    // Calculate complexity indicators
    const technicalTerms = this.countTechnicalTerms(content);
    const features = this.extractFeatures(content);
    const timeIndicators = this.extractTimeCommitments(content);

    const complexityScore = technicalTerms * 2 + features.length * 5;
    const scopePressureGauge = Math.min((complexityScore / 50) * 100, 100);

    let level = 'low';
    let warning = undefined;

    if (scopePressureGauge > 75) {
      level = 'critical';
      warning = 'Very ambitious scope! Consider reducing features to ensure quality delivery.';
    } else if (scopePressureGauge > 50) {
      level = 'high';
      warning = 'Ambitious scope. Make sure timeline is realistic.';
    } else if (scopePressureGauge > 25) {
      level = 'moderate';
    }

    return {
      level,
      gauge: Math.round(scopePressureGauge),
      warning,
      indicators: {
        technicalComplexity: technicalTerms,
        featureCount: features.length,
        estimatedHours: timeIndicators,
      },
    };
  }

  private countTechnicalTerms(content: string): number {
    const technicalKeywords = [
      'api', 'database', 'algorithm', 'machine learning', 'blockchain',
      'microservice', 'authentication', 'deployment', 'infrastructure',
      'optimization', 'scalability', 'architecture', 'integration',
    ];

    return technicalKeywords.filter((kw) =>
      content.toLowerCase().includes(kw),
    ).length;
  }

  private extractFeatures(content: string): string[] {
    // Simple feature extraction based on patterns
    const featurePatterns = [
      /will (implement|build|create|develop|add) ([^.]+)/gi,
      /features? (include|are) ([^.]+)/gi,
      /supports? ([^.]+)/gi,
    ];

    const features: string[] = [];
    featurePatterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        features.push(match[0]);
      }
    });

    return features;
  }

  private extractTimeCommitments(content: string): number {
    // Extract hour/day commitments
    const timePattern = /(\d+)\s*(hours?|days?|weeks?)/gi;
    const matches = content.matchAll(timePattern);

    let totalHours = 0;
    for (const match of matches) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('hour')) totalHours += value;
      else if (unit.startsWith('day')) totalHours += value * 8;
      else if (unit.startsWith('week')) totalHours += value * 40;
    }

    return totalHours || 40; // Default estimate
  }

  private async detectBlindspots(data: any, rubrics: any[]): Promise<any[]> {
    const blindspots: any[] = [];
    const content = (data.title + ' ' + data.description).toLowerCase();

    // Check for missing critical elements
    const criticalElements = [
      { keyword: 'user', criterion: 'User Focus', message: 'No mention of target users or user needs' },
      { keyword: 'problem', criterion: 'Problem Statement', message: 'Problem being solved is unclear' },
      { keyword: 'impact', criterion: 'Impact', message: 'Expected impact or outcomes not described' },
      { keyword: 'technical', criterion: 'Technical Approach', message: 'Technical implementation details missing' },
      { keyword: 'feasibility', criterion: 'Feasibility', message: 'Project feasibility not addressed' },
    ];

    for (const element of criticalElements) {
      if (!content.includes(element.keyword)) {
        blindspots.push({
          criterion: element.criterion,
          gap: element.message,
          severity: this.calculateSeverity(element.criterion, rubrics),
        });
      }
    }

    // Check for vague language
    const vagueTerms = ['innovative', 'revolutionary', 'cutting-edge', 'next-generation'];
    const vagueCount = vagueTerms.filter((term) => content.includes(term)).length;

    if (vagueCount > 2) {
      blindspots.push({
        criterion: 'Specificity',
        gap: 'Too much marketing language. Add concrete technical details.',
        severity: 'medium',
      });
    }

    return blindspots;
  }

  private calculateSeverity(criterion: string, rubrics: any[]): 'high' | 'medium' | 'low' {
    const rubric = rubrics.find((r) => r.name.toLowerCase().includes(criterion.toLowerCase()));
    
    if (!rubric) return 'low';
    
    const weight = rubric.weight || 1;
    if (weight >= 3) return 'high';
    if (weight >= 2) return 'medium';
    return 'low';
  }

  private async compareWithCompetitors(eventId: string, data: any): Promise<any> {
    // Fetch other projects in same event (anonymized)
    const otherProjects = await this.prisma.project.findMany({
      where: { eventId },
      select: { description: true, tagline: true },
      take: 50,
    });

    if (otherProjects.length === 0) {
      return { percentile: 50, differentiators: [] };
    }

    // Simple similarity scoring
    const currentContent = data.description.toLowerCase();
    const similarities = otherProjects.map((p) => {
      const otherContent = (p.description || '').toLowerCase();
      return this.calculateSimilarity(currentContent, otherContent);
    });

    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const percentile = 100 - avgSimilarity * 100;

    return {
      percentile: Math.round(percentile),
      differentiators: this.extractDifferentiators(data, otherProjects),
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private extractDifferentiators(data: any, others: any[]): string[] {
    // Extract unique aspects not commonly mentioned
    const currentWords = new Set<string>((data.description || '').toLowerCase().split(/\s+/));
    const commonWords = new Set<string>();

    others.forEach((p) => {
      const words = (p.description || '').toLowerCase().split(/\s+/);
      words.forEach((w: string) => commonWords.add(w));
    });

    const unique: string[] = [...currentWords].filter((w: string) => !commonWords.has(w) && w.length > 5);
    return unique.slice(0, 5);
  }

  private async calculateQualityMetrics(data: any): Promise<any> {
    const content = data.description || '';

    return {
      readabilityScore: this.calculateReadability(content),
      technicalDepth: this.calculateTechnicalDepth(content),
      innovationScore: this.calculateInnovation(content),
    };
  }

  private calculateReadability(content: string): number {
    // Simple Flesch reading ease approximation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = words * 1.5; // Rough estimate

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateTechnicalDepth(content: string): number {
    const technicalIndicators = [
      'architecture', 'algorithm', 'optimization', 'performance',
      'scalability', 'security', 'database', 'api', 'protocol',
    ];

    const matches = technicalIndicators.filter((term) =>
      content.toLowerCase().includes(term),
    ).length;

    return Math.min((matches / technicalIndicators.length) * 100, 100);
  }

  private calculateInnovation(content: string): number {
    const innovationKeywords = [
      'novel', 'first', 'unique', 'innovative', 'new approach',
      'breakthrough', 'pioneering', 'unprecedented',
    ];

    const matches = innovationKeywords.filter((term) =>
      content.toLowerCase().includes(term),
    ).length;

    return Math.min((matches / 3) * 100, 100);
  }

  private async getAIEnhancements(data: any): Promise<any> {
    // Call third-party AI services for enhancement suggestions
    return this.thirdParty.getAISuggestions(data);
  }

  private calculateScoreBand(rubricAnalysis: any): any {
    const scores = Object.values(rubricAnalysis).map((r: any) => r.score);
    const totalScore = scores.reduce((a: number, b: number) => a + b, 0);
    
    const uncertainty = 10; // ±10 point uncertainty band
    
    return {
      predicted: Math.round(totalScore),
      min: Math.max(0, Math.round(totalScore - uncertainty)),
      max: Math.min(100, Math.round(totalScore + uncertainty)),
    };
  }

  private extractStrengths(rubricAnalysis: any, qualityMetrics: any): string[] {
    const strengths: string[] = [];

    // High-scoring criteria
    Object.entries(rubricAnalysis).forEach(([criterion, data]: [string, any]) => {
      if (data.score > 7) {
        strengths.push(`Strong ${criterion.toLowerCase()} with clear articulation`);
      }
    });

    // Quality metrics
    if (qualityMetrics.readabilityScore > 60) {
      strengths.push('Highly readable and well-structured');
    }

    if (qualityMetrics.technicalDepth > 50) {
      strengths.push('Good technical depth and detail');
    }

    return strengths.slice(0, 5);
  }

  private generateImprovements(
    rubricAnalysis: any,
    blindspots: any[],
    aiEnhancement: any,
  ): any[] {
    const improvements: any[] = [];

    // Address blindspots first (highest priority)
    blindspots
      .filter((b) => b.severity === 'high')
      .forEach((b, idx) => {
        improvements.push({
          priority: idx + 1,
          suggestion: `Address ${b.criterion}: ${b.gap}`,
          impact: 'High - Critical for rubric compliance',
        });
      });

    // Low-scoring criteria
    Object.entries(rubricAnalysis)
      .filter(([_, data]: [string, any]) => data.score < 5)
      .forEach(([criterion, data]: [string, any], idx) => {
        improvements.push({
          priority: improvements.length + 1,
          suggestion: `Enhance ${criterion}: ${data.feedback}`,
          impact: 'Medium - Improves rubric score',
        });
      });

    // AI suggestions
    if (aiEnhancement?.suggestions) {
      aiEnhancement.suggestions.slice(0, 2).forEach((s: string) => {
        improvements.push({
          priority: improvements.length + 1,
          suggestion: s,
          impact: 'Low - Polish and refinement',
        });
      });
    }

    return improvements.slice(0, 3); // Top 3 improvements
  }

  async saveAnalysisHistory(projectId: string, userId: string, analysis: IdeaAnalysis) {
    // Store in database for historical tracking
    await this.prisma.auditEvent.create({
      data: {
        action: 'IDEA_ANALYSIS',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'PROJECT',
        resourceId: projectId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          projectId,
          analysis,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }

  async getAnalysisHistory(projectId: string) {
    const history = await this.prisma.auditEvent.findMany({
      where: {
        action: 'IDEA_ANALYSIS',
        resourceId: projectId,
      },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return history.map((h) => {
      let details: any = {};
      try {
        details = JSON.parse(h.reason || '{}');
      } catch (e) {}
      return {
        timestamp: h.occurredAt,
        analysis: details.analysis,
      };
    });
  }
}
