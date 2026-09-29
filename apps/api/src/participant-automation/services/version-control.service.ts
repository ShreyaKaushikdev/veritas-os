import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class VersionControlService {
  constructor(private prisma: PrismaService) {}

  async createSnapshot(projectId: string, userId: string, label?: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const snapshot = {
      projectId,
      userId,
      label: label || `Snapshot ${new Date().toISOString()}`,
      data: {
        title: project.title,
        tagline: project.tagline,
        description: project.description,
        trackId: project.trackId,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
      },
      hash: this.generateHash(project),
      timestamp: new Date().toISOString(),
    };

    await this.prisma.auditEvent.create({
      data: {
        action: 'VERSION_SNAPSHOT',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'PROJECT',
        resourceId: projectId,
        eventId: project.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify(snapshot),
      },
    });

    return snapshot;
  }

  async getVersionHistory(projectId: string): Promise<any[]> {
    const snapshots = await this.prisma.auditEvent.findMany({
      where: {
        action: 'VERSION_SNAPSHOT',
        resourceId: projectId,
      },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });

    return snapshots.map((s) => {
      let details: any = {};
      try {
        details = JSON.parse(s.reason || '{}');
      } catch (e) {}
      return {
        id: s.id,
        ...details,
        createdAt: s.occurredAt,
      };
    });
  }

  async restoreVersion(projectId: string, versionId: string, userId: string): Promise<any> {
    const version = await this.prisma.auditEvent.findUnique({
      where: { id: versionId },
    });

    if (!version || version.action !== 'VERSION_SNAPSHOT') {
      throw new Error('Version not found');
    }

    let snapshot: any = {};
    try {
      snapshot = JSON.parse(version.reason || '{}');
    } catch (e) {}

    // Create a backup of current state before restoring
    await this.createSnapshot(projectId, userId, 'Pre-restore backup');

    // Restore the version
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: snapshot.data?.title,
        tagline: snapshot.data?.tagline,
        description: snapshot.data?.description,
        trackId: snapshot.data?.trackId,
        repoUrl: snapshot.data?.repoUrl,
        demoUrl: snapshot.data?.demoUrl,
      },
    });

    // Log the restore action
    await this.prisma.auditEvent.create({
      data: {
        action: 'VERSION_RESTORE',
        actorId: userId,
        actorRole: 'PARTICIPANT',
        resourceType: 'PROJECT',
        resourceId: projectId,
        eventId: version.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          projectId,
          restoredVersionId: versionId,
          restoredLabel: snapshot.label,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      restoredVersion: snapshot,
    };
  }

  private generateHash(project: any): string {
    const content = JSON.stringify({
      title: project.title,
      description: project.description,
      tagline: project.tagline,
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
