import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BlindSpotDetectionService {
  constructor(private prisma: PrismaService) {}

  async scanProject(projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        event: { include: { rubrics: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const [
      rubricBlindspots,
      competitorAnalysis,
      commonMistakes,
      languageIssues,
    ] = await Promise.all([
      this.detectRubricBlindspots(project),
      this.compareWithCompetitors(project),
      this.checkCommonMistakes(project),
      this.analyzeLanguageQuality(project),
    ]);

    const allBlindspots = [
      ...rubricBlindspots,
      ...competitorAnalysis.blindspots,
      ...commonMistakes,
      ...languageIssues,
    ];

    return {
      projectId,
      timestamp: new Date().toISOString(),
      blindspots: allBlindspots,
      summary: {
        total: allBlindspots.length,
        critical: allBlindspots.filter((b) => b.severity === 'critical').length,
        high: allBlindspots.filter((b) => b.severity === 'high').length,
        medium: allBlindspots.filter((b) => b.severity === 'medium').length,
      },
      recommendations: this.generateRecommendations(allBlindspots),
    };
  }

  private async detectRubricBlindspots(project: any): Promise<any[]> {
    const blindspots: any[] = [];
    const description = (project.description || '').toLowerCase();
    const rubrics = project.event.rubrics || [];

    for (const rubric of rubrics) {
      const keywords = this.extractRubricKeywords(rubric);
      const mentionCount = keywords.filter((kw) => description.includes(kw.toLowerCase())).length;
      const coverage = mentionCount / Math.max(keywords.length, 1);

      if (coverage < 0.3) {
        blindspots.push({
          type: 'rubric_gap',
          criterion: rubric.name,
          severity: this.calculateSeverity(rubric.weight),
          message: `Limited coverage of "${rubric.name}" criterion`,
          suggestion: `Add details about ${keywords.slice(0, 3).join(', ')}`,
          impact: `This criterion is worth ${rubric.weight || 1}x weight`,
        });
      }
    }

    return blindspots;
  }

  private extractRubricKeywords(rubric: any): string[] {
    const text = `${rubric.name} ${rubric.description || ''}`.toLowerCase();
    return text.split(/\W+/).filter((w) => w.length > 4).slice(0, 10);
  }

  private calculateSeverity(weight: number): 'critical' | 'high' | 'medium' | 'low' {
    if (weight >= 3) return 'critical';
    if (weight >= 2) return 'high';
    if (weight >= 1) return 'medium';
    return 'low';
  }

  private async compareWithCompetitors(project: any): Promise<any> {
    const competitors = await this.prisma.project.findMany({
      where: {
        eventId: project.eventId,
        id: { not: project.id },
      },
      select: {
        description: true,
        track: true,
      },
      take: 20,
    });

    const blindspots: any[] = [];
    const currentContent = (project.description || '').toLowerCase();

    // Find common themes in competitors
    const competitorThemes = this.extractCommonThemes(competitors);

    for (const theme of competitorThemes) {
      if (!currentContent.includes(theme.keyword.toLowerCase())) {
        if (theme.frequency > 0.5) {
          blindspots.push({
            type: 'competitive_gap',
            severity: 'medium',
            message: `${Math.round(theme.frequency * 100)}% of competitors mention "${theme.keyword}"`,
            suggestion: `Consider addressing ${theme.keyword} if relevant to your project`,
            impact: 'May affect competitive positioning',
          });
        }
      }
    }

    return { blindspots };
  }

  private extractCommonThemes(competitors: any[]): any[] {
    const keywordCounts = new Map<string, number>();
    const totalProjects = competitors.length;

    const importantKeywords = [
      'scalability', 'user experience', 'security', 'performance',
      'accessibility', 'innovation', 'impact', 'feasibility',
      'technical', 'architecture', 'data', 'algorithm',
    ];

    for (const competitor of competitors) {
      const content = (competitor.description || '').toLowerCase();
      for (const keyword of importantKeywords) {
        if (content.includes(keyword)) {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        }
      }
    }

    return Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({
        keyword,
        frequency: count / totalProjects,
      }))
      .filter((t) => t.frequency > 0.3)
      .sort((a, b) => b.frequency - a.frequency);
  }

  private async checkCommonMistakes(project: any): Promise<any[]> {
    const blindspots: any[] = [];
    const content = (project.title + ' ' + project.description).toLowerCase();

    // Common mistake patterns
    const mistakes = [
      {
        pattern: /we will|we plan to|we hope to/gi,
        message: 'Future tense detected - judges prefer present/past achievements',
        severity: 'medium',
        suggestion: 'Rephrase accomplishments in present or past tense',
      },
      {
        pattern: /amazing|incredible|revolutionary|groundbreaking/gi,
        message: 'Superlative language without evidence',
        severity: 'medium',
        suggestion: 'Replace marketing language with specific metrics or evidence',
      },
      {
        pattern: /\.{3,}|!!!+/g,
        message: 'Informal punctuation detected',
        severity: 'low',
        suggestion: 'Use professional formatting',
      },
    ];

    for (const mistake of mistakes) {
      if (mistake.pattern.test(content)) {
        blindspots.push({
          type: 'common_mistake',
          severity: mistake.severity,
          message: mistake.message,
          suggestion: mistake.suggestion,
          impact: 'May reduce perceived professionalism',
        });
      }
    }

    // Check for missing elements
    const requiredElements = [
      { keyword: 'problem', message: 'Problem statement unclear or missing' },
      { keyword: 'solution', message: 'Solution description unclear or missing' },
      { keyword: 'user', message: 'Target audience not clearly defined' },
      { keyword: 'technical', message: 'Technical details sparse' },
    ];

    for (const element of requiredElements) {
      if (!content.includes(element.keyword)) {
        blindspots.push({
          type: 'missing_element',
          severity: 'high',
          message: element.message,
          suggestion: `Add clear description of ${element.keyword}`,
          impact: 'Critical for judge comprehension',
        });
      }
    }

    return blindspots;
  }

  private async analyzeLanguageQuality(project: any): Promise<any[]> {
    const blindspots: any[] = [];
    const description = project.description || '';

    // Check readability
    const sentences = description.split(/[.!?]+/).length;
    const words = description.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    if (avgWordsPerSentence > 30) {
      blindspots.push({
        type: 'readability',
        severity: 'medium',
        message: 'Long sentences may reduce readability',
        suggestion: 'Break down complex sentences for clarity',
        impact: 'May affect judge comprehension',
      });
    }

    // Check for jargon overuse
    const technicalTermCount = this.countTechnicalTerms(description);
    if (technicalTermCount > words * 0.15) {
      blindspots.push({
        type: 'jargon_overuse',
        severity: 'low',
        message: 'High technical jargon density',
        suggestion: 'Balance technical terms with plain language explanations',
        impact: 'May alienate non-technical judges',
      });
    }

    return blindspots;
  }

  private countTechnicalTerms(text: string): number {
    const technicalPatterns = [
      /API|SDK|CLI|REST|GraphQL|WebSocket/gi,
      /database|SQL|NoSQL|PostgreSQL|MongoDB/gi,
      /framework|library|module|package/gi,
      /algorithm|optimization|complexity/gi,
    ];

    let count = 0;
    for (const pattern of technicalPatterns) {
      const matches = text.match(pattern);
      count += matches ? matches.length : 0;
    }

    return count;
  }

  private generateRecommendations(blindspots: any[]): string[] {
    const recommendations: string[] = [];
    const criticalBlindspots = blindspots.filter((b) => b.severity === 'critical');
    const highBlindspots = blindspots.filter((b) => b.severity === 'high');

    if (criticalBlindspots.length > 0) {
      recommendations.push(
        `URGENT: Address ${criticalBlindspots.length} critical issue(s) before submission`,
      );
    }

    if (highBlindspots.length > 0) {
      recommendations.push(
        `Important: Fix ${highBlindspots.length} high-priority issue(s) to improve scoring`,
      );
    }

    // Type-specific recommendations
    const rubricGaps = blindspots.filter((b) => b.type === 'rubric_gap');
    if (rubricGaps.length > 0) {
      recommendations.push(
        `Expand coverage of ${rubricGaps.length} rubric criteria for higher scores`,
      );
    }

    return recommendations;
  }
}
