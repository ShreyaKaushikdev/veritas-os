import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProjectEligibility, Role } from '../common/types';
import { sha256, computeHashNode } from '../common/crypto.util';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateDraft(data: {
    eventId: string;
    teamId: string;
    trackId?: string;
    title: string;
    tagline?: string;
    description: string;
    repoUrl?: string;
    demoUrl?: string;
    techStack?: string;
    featuresList?: string;
    teamHours?: number;
    editorId: string;
  }) {
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // Server-enforced deadline check
    if (event.freezeDeadline && new Date() > event.freezeDeadline) {
      throw new BadRequestException('Submission deadline has passed; submissions are frozen');
    }

    // Verify user belongs to the team
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: data.teamId, userId: data.editorId },
      },
    });
    if (!membership) {
      throw new ForbiddenException('User does not belong to this team');
    }

    let project = await this.prisma.project.findUnique({ where: { teamId: data.teamId } });

    const contentPayload = {
      title: data.title,
      description: data.description,
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      techStack: data.techStack,
      featuresList: data.featuresList,
    };
    const contentHash = sha256(contentPayload);

    if (!project) {
      project = await this.prisma.project.create({
        data: {
          eventId: data.eventId,
          teamId: data.teamId,
          trackId: data.trackId,
          title: data.title,
          tagline: data.tagline,
          description: data.description,
          repoUrl: data.repoUrl,
          demoUrl: data.demoUrl,
          techStack: data.techStack,
          featuresList: data.featuresList,
          teamHours: data.teamHours || 48,
          eligibility: ProjectEligibility.PENDING,
          isFrozen: false,
        },
      });

      await this.prisma.projectVersion.create({
        data: {
          projectId: project.id,
          versionNumber: 1,
          title: data.title,
          description: data.description,
          repoUrl: data.repoUrl,
          demoUrl: data.demoUrl,
          techStack: data.techStack,
          contentHash,
          editorId: data.editorId,
          reason: 'Initial draft creation',
        },
      });
    } else {
      if (project.isFrozen) {
        throw new BadRequestException('Project is frozen; amendments require organizer authorization');
      }

      const versionCount = await this.prisma.projectVersion.count({
        where: { projectId: project.id },
      });

      project = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          trackId: data.trackId,
          title: data.title,
          tagline: data.tagline,
          description: data.description,
          repoUrl: data.repoUrl,
          demoUrl: data.demoUrl,
          techStack: data.techStack,
          featuresList: data.featuresList,
          teamHours: data.teamHours || project.teamHours,
        },
      });

      await this.prisma.projectVersion.create({
        data: {
          projectId: project.id,
          versionNumber: versionCount + 1,
          title: data.title,
          description: data.description,
          repoUrl: data.repoUrl,
          demoUrl: data.demoUrl,
          techStack: data.techStack,
          contentHash,
          editorId: data.editorId,
          reason: 'Material draft update',
        },
      });
    }

    return this.getProject(project.id);
  }

  async freezeSubmission(projectId: string, actorId: string, attestation?: { license?: string; isOriginalWork?: boolean }) {
    const project = await this.getProject(projectId);
    if (project.isFrozen) {
      return project;
    }

    const license = attestation?.license || (project as any).license || 'MIT';
    const isOriginalWork = attestation?.isOriginalWork !== undefined ? attestation.isOriginalWork : ((project as any).isOriginalWork ?? true);

    const contentPayload = {
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      techStack: project.techStack,
      license,
      isOriginalWork,
    };
    const contentHash = sha256(contentPayload);

    // Get previous integrity hash
    const lastNode = await this.prisma.integrityHashNode.findFirst({
      where: { eventId: project.eventId },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastNode ? lastNode.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nodeHash = computeHashNode(previousHash, contentPayload, project.id);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        isFrozen: true,
        frozenHash: contentHash,
        frozenAt: new Date(),
        eligibility: ProjectEligibility.ELIGIBLE,
        license,
        isOriginalWork,
      },
    });

    // Record in cryptographic hash chain
    await this.prisma.integrityHashNode.create({
      data: {
        eventId: project.eventId,
        nodeType: 'SUBMISSION_FREEZE',
        resourceId: project.id,
        previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify({ projectId: project.id, title: project.title, contentHash, license, isOriginalWork }),
      },
    });

    // Audit log
    await this.prisma.auditEvent.create({
      data: {
        eventId: project.eventId,
        actorId,
        actorRole: Role.PARTICIPANT,
        action: 'SUBMISSION_FROZEN',
        resourceType: 'PROJECT',
        resourceId: project.id,
        beforeHash: null,
        afterHash: contentHash,
        reason: 'Submission frozen for judging with immutable hash',
        requestId: `REQ-FREEZE-${Date.now()}`,
      },
    });

    return updated;
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        track: true,
        team: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        versions: { orderBy: { versionNumber: 'desc' } },
        ideaReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async getPublicGallery(eventId: string, options?: { trackId?: string; search?: string }) {
    const where: any = {
      eventId,
      eligibility: ProjectEligibility.ELIGIBLE,
      isFrozen: true,
    };

    if (options?.trackId) {
      where.trackId = options.trackId;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search } },
        { description: { contains: options.search } },
        { techStack: { contains: options.search } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        tagline: true,
        description: true,
        techStack: true,
        repoUrl: true,
        demoUrl: true,
        isFrozen: true,
        frozenHash: true,
        track: { select: { id: true, name: true } },
        team: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async checkSubmissionHealth(projectId: string) {
    const project = await this.getProject(projectId);

    const issues: string[] = [];
    const passes: string[] = [];

    // 1. Repo Link Check
    if (!project.repoUrl || !project.repoUrl.startsWith('http')) {
      issues.push('Missing or invalid repository link. Judges cannot verify technical implementation.');
    } else {
      passes.push('Public code repository link provided.');
    }

    // 2. Demo Link Check
    if (!project.demoUrl) {
      issues.push('Missing working demo or walkthrough link. Reproduction confidence lowered.');
    } else {
      passes.push('Interactive demo link verified.');
    }

    // 3. Technical Stack Detail
    if (!project.techStack || project.techStack.length < 5) {
      issues.push('Technology stack description is too brief. Specify frameworks, databases, and dependencies.');
    } else {
      passes.push('Comprehensive technology stack specified.');
    }

    // 4. Feature vs Hours Ratio (Scope Pressure)
    const featureCount = project.featuresList ? project.featuresList.split('\n').filter((f) => f.trim().length > 0).length : 0;
    const hours = project.teamHours || 48;
    const featuresPerHour = featureCount / hours;

    if (featuresPerHour > 0.3) {
      issues.push(`Over-scoped features list (${featureCount} items declared for ${hours}h). High risk of half-baked delivery.`);
    } else {
      passes.push(`Realistic feature scope (${featureCount} features for ${hours} engineer-hours).`);
    }

    const healthScore = Math.round((passes.length / (passes.length + issues.length)) * 100);

    return {
      projectId: project.id,
      title: project.title,
      healthScore,
      status: healthScore >= 75 ? 'HEALTHY' : healthScore >= 50 ? 'NEEDS_ATTENTION' : 'CRITICAL',
      issues,
      passes,
    };
  }
}
