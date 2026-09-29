import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProjectValidationService {
  constructor(private prisma: PrismaService) {}

  async validateProject(projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        event: { include: { rubrics: true } },
        team: { include: { members: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const validations = {
      requiredFields: this.validateRequiredFields(project),
      characterLimits: this.validateCharacterLimits(project),
      links: await this.validateLinks(project),
      attachments: this.validateAttachments(project),
      rubricCoverage: this.validateRubricCoverage(project),
      teamCompletion: this.validateTeamInformation(project),
    };

    const allPassed = Object.values(validations).every((v: any) => v.passed);
    const criticalIssues = Object.values(validations).filter((v: any) => !v.passed && v.severity === 'critical');

    return {
      projectId,
      passed: allPassed,
      canSubmit: criticalIssues.length === 0,
      validations,
      summary: {
        total: Object.keys(validations).length,
        passed: Object.values(validations).filter((v: any) => v.passed).length,
        failed: Object.values(validations).filter((v: any) => !v.passed).length,
        critical: criticalIssues.length,
      },
    };
  }

  async preFlightCheck(projectId: string): Promise<any> {
    const validation = await this.validateProject(projectId);
    
    const checklist = [
      {
        item: 'Project title is descriptive',
        passed: validation.validations.requiredFields.fields.title,
        required: true,
      },
      {
        item: 'Description meets minimum length',
        passed: validation.validations.characterLimits.description.passed,
        required: true,
      },
      {
        item: 'All links are accessible',
        passed: validation.validations.links.passed,
        required: false,
      },
      {
        item: 'Team information complete',
        passed: validation.validations.teamCompletion.passed,
        required: true,
      },
      {
        item: 'Covers all rubric criteria',
        passed: validation.validations.rubricCoverage.passed,
        required: false,
      },
    ];

    return {
      ready: validation.canSubmit,
      checklist,
      blockers: checklist.filter((c) => !c.passed && c.required),
      recommendations: checklist.filter((c) => !c.passed && !c.required),
    };
  }

  private validateRequiredFields(project: any): any {
    const fields = {
      title: !!project.title && project.title.trim().length > 0,
      description: !!project.description && project.description.trim().length > 0,
      tagline: !!project.tagline && project.tagline.trim().length > 0,
    };

    return {
      passed: Object.values(fields).every((v) => v),
      severity: 'critical',
      fields,
      message: Object.values(fields).every((v) => v) 
        ? 'All required fields completed'
        : 'Some required fields are missing',
    };
  }

  private validateCharacterLimits(project: any): any {
    const limits = {
      title: { min: 10, max: 100, current: project.title?.length || 0 },
      tagline: { min: 20, max: 150, current: project.tagline?.length || 0 },
      description: { min: 200, max: 5000, current: project.description?.length || 0 },
    };

    const results: any = {};
    for (const [field, limit] of Object.entries(limits)) {
      results[field] = {
        passed: limit.current >= limit.min && limit.current <= limit.max,
        current: limit.current,
        min: limit.min,
        max: limit.max,
        message: limit.current < limit.min 
          ? `Too short (${limit.current}/${limit.min} chars)`
          : limit.current > limit.max
          ? `Too long (${limit.current}/${limit.max} chars)`
          : 'Within limits',
      };
    }

    return {
      passed: Object.values(results).every((r: any) => r.passed),
      severity: 'high',
      ...results,
    };
  }

  private async validateLinks(project: any): Promise<any> {
    const links = this.extractLinks(project.description || '');
    const validationResults = [];

    for (const link of links) {
      try {
        // Simple URL validation
        new URL(link);
        validationResults.push({ link, valid: true, accessible: true });
      } catch (error) {
        validationResults.push({ link, valid: false, accessible: false, error: 'Invalid URL' });
      }
    }

    return {
      passed: validationResults.every((r) => r.valid),
      severity: 'medium',
      links: validationResults,
      count: links.length,
    };
  }

  private extractLinks(text: string): string[] {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.match(urlPattern) || [];
  }

  private validateAttachments(project: any): any {
    // Assuming attachments are stored in a separate field
    const attachments = project.attachments || [];

    return {
      passed: true, // Non-critical
      severity: 'low',
      count: attachments.length,
      message: attachments.length > 0 
        ? `${attachments.length} attachment(s) added`
        : 'No attachments (optional)',
    };
  }

  private validateRubricCoverage(project: any): any {
    const rubrics = project.event.rubrics || [];
    const description = (project.description || '').toLowerCase();

    const coverage = rubrics.map((rubric: any) => {
      const keywords = rubric.name.toLowerCase().split(' ');
      const mentioned = keywords.some((kw: string) => description.includes(kw));

      return {
        criterion: rubric.name,
        covered: mentioned,
        weight: rubric.weight || 1,
      };
    });

    const coveragePercent = (coverage.filter((c) => c.covered).length / Math.max(rubrics.length, 1)) * 100;

    return {
      passed: coveragePercent >= 60,
      severity: 'medium',
      coverage,
      coveragePercent: Math.round(coveragePercent),
      message: `${Math.round(coveragePercent)}% of rubric criteria addressed`,
    };
  }

  private validateTeamInformation(project: any): any {
    const team = project.team;
    const hasMembers = team.members && team.members.length > 0;

    return {
      passed: hasMembers,
      severity: 'high',
      teamSize: team.members?.length || 0,
      teamName: team.name,
      message: hasMembers 
        ? `Team of ${team.members.length} member(s)`
        : 'No team members',
    };
  }
}
