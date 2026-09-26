import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { sha256, computeHashNode } from '../common/crypto.util';

@Injectable()
export class TrustService {
  constructor(private prisma: PrismaService) {}

  async verifyHashChain(eventId: string) {
    const startTime = Date.now();

    const nodes = await this.prisma.integrityHashNode.findMany({
      where: { eventId },
      orderBy: { timestamp: 'asc' },
    });

    if (nodes.length === 0) {
      return {
        eventId,
        isValid: true,
        isTampered: false,
        chainLength: 0,
        tamperedNodesCount: 0,
        tamperAlerts: [],
        executionTimeMs: Date.now() - startTime,
        merkleRoot: '0000000000000000000000000000000000000000000000000000000000000000',
      };
    }

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const tamperAlerts: any[] = [];
    const verifiedNodes: any[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      let isNodeValid = true;

      // 1. Check previous hash link
      if (node.previousHash !== previousHash) {
        tamperAlerts.push({
          nodeIndex: i,
          nodeId: node.id,
          nodeType: node.nodeType,
          resourceId: node.resourceId,
          error: 'BROKEN_LINK',
          expectedPreviousHash: previousHash,
          actualPreviousHash: node.previousHash,
        });
        isNodeValid = false;
      }

      // 2. Re-compute current hash from payload
      const expectedCurrentHash = computeHashNode(node.previousHash, JSON.parse(node.payloadJson), node.resourceId);
      if (expectedCurrentHash !== node.currentHash) {
        tamperAlerts.push({
          nodeIndex: i,
          nodeId: node.id,
          nodeType: node.nodeType,
          resourceId: node.resourceId,
          error: 'PAYLOAD_TAMPERED',
          expectedHash: expectedCurrentHash,
          storedHash: node.currentHash,
        });
        isNodeValid = false;
      }

      verifiedNodes.push({
        id: node.id,
        nodeType: node.nodeType,
        resourceId: node.resourceId,
        currentHash: node.currentHash,
        isValid: isNodeValid,
        timestamp: node.timestamp,
      });

      previousHash = node.currentHash;
    }

    const executionTimeMs = Date.now() - startTime;
    const isTampered = tamperAlerts.length > 0;
    const latestRankingRun = await this.prisma.rankingRun.findFirst({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    const tieBreakReceipts = latestRankingRun?.tieBreakLog ? JSON.parse(latestRankingRun.tieBreakLog) : [];

    return {
      eventId,
      isValid: !isTampered,
      isTampered,
      chainLength: nodes.length,
      tamperedNodesCount: tamperAlerts.length,
      tamperAlerts,
      verifiedNodes: verifiedNodes.slice(-15), // latest 15 for visualization
      latestHash: previousHash,
      executionTimeMs,
      tieBreakPolicy: {
        hierarchy: [
          '1. Rubric Priority: Descending weight criterion comparison',
          '2. Consensus: Lowest score dispersion (StdDev σ)',
          '3. Earliest Commitment: Earliest submission freeze timestamp',
        ],
        appliedTieBreaks: tieBreakReceipts,
      },
      auditGuarantee: 'Deterministic SHA-256 local hash chain over submission freeze, ballots, recusal, ranking runs, and publications.',
    };
  }

  async simulateTamper(nodeId: string) {
    const node = await this.prisma.integrityHashNode.findUnique({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('Node not found');

    // Alter the payload directly in database to simulate malicious tampering
    const altered = await this.prisma.integrityHashNode.update({
      where: { id: nodeId },
      data: {
        payloadJson: JSON.stringify({ ...JSON.parse(node.payloadJson), score: 99.9, tampered: true }),
      },
    });

    return {
      success: true,
      message: `Node ${nodeId} payload tampered. Running /verify will now flag cryptographic tampering.`,
      node: altered,
    };
  }

  async getAuditTrail(eventId: string) {
    return this.prisma.auditEvent.findMany({
      where: { eventId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  async generateExportBundle(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tracks: true,
        prizes: true,
        rubrics: { include: { criteria: true } },
        projects: {
          include: {
            team: { include: { members: { include: { user: true } } } },
            versions: true,
            ballots: { include: { scores: true } },
          },
        },
        rankingRuns: { include: { rankedProjects: true } },
        auditEvents: true,
        hashNodes: true,
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    const manifest = {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      eventId: event.id,
      eventName: event.name,
      totalProjects: event.projects.length,
      totalAuditEvents: event.auditEvents.length,
      totalHashNodes: event.hashNodes.length,
      chainHeadHash: event.hashNodes.length > 0 ? event.hashNodes[event.hashNodes.length - 1].currentHash : null,
    };

    const bundleJson = JSON.stringify({ manifest, event }, null, 2);
    const bundleChecksum = sha256(bundleJson);

    return {
      manifest,
      bundleChecksum,
      bundleJson,
    };
  }
}
