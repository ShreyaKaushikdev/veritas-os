import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function computeHashNode(previousHash: string, payload: any, resourceId: string): string {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(previousHash + payloadStr + resourceId).digest('hex');
}

export async function main() {
  console.log('🌱 Starting DOGFOOD OS SQLite database seeding...');

  try {
    await prisma.integrityHashNode.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.rankedProject.deleteMany();
    await prisma.rankingRun.deleteMany();
    await prisma.ballotScore.deleteMany();
    await prisma.ballot.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.ideaReport.deleteMany();
    await prisma.projectVersion.deleteMany();
    await prisma.judgeConflict.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.anchorProject.deleteMany();
    await prisma.rubricCriteria.deleteMany();
    await prisma.rubricVersion.deleteMany();
    await prisma.prize.deleteMany();
    await prisma.track.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.event.deleteMany();
    await prisma.judgePassport.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Tables already clean or first initialization.');
  }

  const defaultPassword = await bcrypt.hash('dogfood2026!', 10);

  // 1. Create Core Admin & Organizer
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dogfood.local',
      name: 'Root Administrator',
      passwordHash: defaultPassword,
      role: 'ADMIN',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@dogfood.local',
      name: 'Elena Rostova',
      passwordHash: defaultPassword,
      role: 'ORGANIZER',
    },
  });

  // 2. Create Hackathon Event
  const event = await prisma.event.create({
    data: {
      slug: 'hack-winter-2026',
      name: 'Autonomous Systems & Edge Intelligence 2026',
      description: 'The premier offline-first engineering hackathon exploring defensible agents, local compilers, and verifiable architectures.',
      status: 'JUDGING_OPEN',
      autopilotMode: 'ASSIST',
      timezone: 'UTC',
      regDeadline: new Date(Date.now() - 7 * 86400000),
      subDeadline: new Date(Date.now() - 2 * 86400000),
      freezeDeadline: new Date(Date.now() - 2 * 86400000),
      judgeDeadline: new Date(Date.now() + 2 * 86400000),
      minReviews: 3,
      disagreeThreshold: 1.5,
    },
  });

  await prisma.membership.create({
    data: {
      userId: organizer.id,
      eventId: event.id,
      role: 'ORGANIZER',
    },
  });

  // 3. Create Tracks
  const track1 = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'Autonomous Agents & Local Tooling',
      description: 'Agentic workflows running reliably with zero external API dependencies.',
    },
  });

  const track2 = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'Developer Infrastructure & Compilers',
      description: 'Systems software, compilation pipelines, debuggers, and performance engines.',
    },
  });

  const track3 = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'Verifiable & Local-First Systems',
      description: 'CRDTs, tamper-evident logs, peer-to-peer sync, and zero-knowledge verification.',
    },
  });

  const tracks = [track1, track2, track3];

  // 4. Create Rubric
  const rubric = await prisma.rubricVersion.create({
    data: {
      eventId: event.id,
      version: 1,
      isLocked: true,
    },
  });

  await prisma.event.update({
    where: { id: event.id },
    data: { currentRubricId: rubric.id },
  });

  const c1 = await prisma.rubricCriteria.create({
    data: {
      rubricVersionId: rubric.id,
      name: 'Technical Depth & Architecture',
      description: 'Sophistication of implementation, code quality, test coverage, and clear system boundaries.',
      weight: 0.35,
      minScore: 1,
      maxScore: 10,
      guidance: 'Look for clean interfaces, error boundaries, memory safety, and reproducibility.',
    },
  });

  const c2 = await prisma.rubricCriteria.create({
    data: {
      rubricVersionId: rubric.id,
      name: 'Rubric Alignment & Feasibility',
      description: 'Execution realism relative to hackathon timeframe and stated project goals.',
      weight: 0.25,
      minScore: 1,
      maxScore: 10,
      guidance: 'Penalize ungrounded vanity claims; reward functional vertical slices with working demos.',
    },
  });

  const c3 = await prisma.rubricCriteria.create({
    data: {
      rubricVersionId: rubric.id,
      name: 'Novelty & Problem Insight',
      description: 'Uniqueness of approach and genuine non-obvious engineering insight.',
      weight: 0.20,
      minScore: 1,
      maxScore: 10,
      guidance: 'Did the team solve a hard problem or just wrap a standard tutorial?',
    },
  });

  const c4 = await prisma.rubricCriteria.create({
    data: {
      rubricVersionId: rubric.id,
      name: 'Evidence & Reproducibility',
      description: 'Working local setup, test receipts, architectural diagrams, and verified benchmarks.',
      weight: 0.20,
      minScore: 1,
      maxScore: 10,
      guidance: 'Can another engineer run the test suite and verify the claims without manual repairs?',
    },
  });

  const criteria = [c1, c2, c3, c4];

  // 5. Create Anchor Projects for Judge Calibration
  await prisma.anchorProject.create({
    data: {
      eventId: event.id,
      title: 'Anchor Alpha: Barebone CLI Shell (Weak)',
      description: 'A simple wrapper around child_process with minimal error handling, no tests, and vague README.',
      tier: 'WEAK',
      targetScores: JSON.stringify({
        'Technical Depth & Architecture': 3.5,
        'Rubric Alignment & Feasibility': 4.0,
        'Novelty & Problem Insight': 2.5,
        'Evidence & Reproducibility': 3.0,
      }),
    },
  });

  await prisma.anchorProject.create({
    data: {
      eventId: event.id,
      title: 'Anchor Beta: Local SQLite Vector Indexer (Typical)',
      description: 'Well-structured local vector search using hnswlib and SQLite. Clean CLI, passing unit tests, average docs.',
      tier: 'TYPICAL',
      targetScores: JSON.stringify({
        'Technical Depth & Architecture': 6.5,
        'Rubric Alignment & Feasibility': 7.0,
        'Novelty & Problem Insight': 6.0,
        'Evidence & Reproducibility': 6.5,
      }),
    },
  });

  await prisma.anchorProject.create({
    data: {
      eventId: event.id,
      title: 'Anchor Gamma: Verified Deterministic WASM Sandbox (Strong)',
      description: 'Complete sandboxing engine with memory-metering, formal state proofs, fuzzing test suite, and benchmark receipts.',
      tier: 'STRONG',
      targetScores: JSON.stringify({
        'Technical Depth & Architecture': 9.0,
        'Rubric Alignment & Feasibility': 8.5,
        'Novelty & Problem Insight': 9.0,
        'Evidence & Reproducibility': 9.5,
      }),
    },
  });

  // 6. Create 30 Calibrated Judges
  const judges: any[] = [];
  for (let i = 1; i <= 30; i++) {
    const judge = await prisma.user.create({
      data: {
        email: `judge${i}@dogfood.local`,
        name: `Judge Dr. ${['Marcus Chen', 'Sarah Lin', 'David Vance', 'Amina Idris', 'Tobias Becker', 'Priya Nair', 'Viktor Orlov'][i % 7]} #${i}`,
        passwordHash: defaultPassword,
        role: 'JUDGE',
      },
    });

    await prisma.membership.create({
      data: {
        userId: judge.id,
        eventId: event.id,
        role: 'JUDGE',
      },
    });

    const bias = i <= 5 ? -0.8 : i <= 10 ? 0.7 : 0.05 * (i % 3 - 1);
    await prisma.judgePassport.create({
      data: {
        userId: judge.id,
        completedReviews: 12 + (i % 8),
        medianReviewSecs: 180 + (i % 60),
        calibrationBias: bias,
        reliabilityScore: 0.95 - (i % 5) * 0.02,
        eligibleTracks: JSON.stringify([tracks[i % 3].id, tracks[(i + 1) % 3].id]),
        notes: `Calibrated with anchor set 2026. Review pace: ${180 + (i % 60)}s avg.`,
      },
    });

    judges.push(judge);
  }

  // 7. Create 40 Projects & Participants
  const projectTitles = [
    { title: 'Substratum: Offline P2P Artifact Sync', track: 2, tech: 'Rust, libp2p, RocksDB', scoreTarget: 8.8 },
    { title: 'Kestrel: Zero-Network WebAssembly Agent Runtime', track: 0, tech: 'C++, QuickJS, WASI', scoreTarget: 9.2 },
    { title: 'Chronos: Tamper-Proof Event Sourced Ledger', track: 2, tech: 'TypeScript, Merkle Patricia Trees', scoreTarget: 8.5 },
    { title: 'Vectra: Memory-Hard Local Vector Search Engine', track: 1, tech: 'Zig, SIMD, AVX-512', scoreTarget: 8.9 },
    { title: 'Sentinel: Automated Privilege Escalation Linter', track: 1, tech: 'Python, AST, Tree-Sitter', scoreTarget: 7.9 },
    { title: 'Aegis: Self-Hosted Auditable API Gateway', track: 2, tech: 'Go, Envoy, eBPF', scoreTarget: 8.3 },
    { title: 'Prism: Rubric-Grounded Code Synthesis Evaluator', track: 0, tech: 'TypeScript, Ollama, LangChain', scoreTarget: 7.4 },
    { title: 'Bifrost: Air-Gapped Multi-Party Computation Key Ring', track: 2, tech: 'Rust, Curve25519, Shamir', scoreTarget: 9.0 },
    { title: 'Atlas: Autonomous Micro-Compiler for Edge MCUs', track: 1, tech: 'LLVM, C, ARM Thumb', scoreTarget: 8.6 },
    { title: 'Nexus: Conflict-Free Replicated Task Scheduler', track: 2, tech: 'Go, Raft, SQLite', scoreTarget: 7.8 },
    { title: 'Hydra: Distributed Disagreement Resolution Router', track: 0, tech: 'TypeScript, BullMQ, Redis', scoreTarget: 8.7 },
    { title: 'Solace: High-Throughput Deterministic State Machine', track: 1, tech: 'Rust, Tokio, io_uring', scoreTarget: 8.4 },
    { title: 'Ironclad: Formally Verified Kernel Sandbox', track: 2, tech: 'Coq, C, Linux seccomp', scoreTarget: 9.4 },
    { title: 'TraceOS: Zero-Overhead eBPF Observability Probe', track: 1, tech: 'C, eBPF, Grafana', scoreTarget: 8.1 },
    { title: 'Aether: Decentralized Metadata Registry', track: 2, tech: 'TypeScript, IPFS, Content-Addressing', scoreTarget: 7.2 },
    { title: 'Cortex: On-Device Code Intent Classifier', track: 0, tech: 'ONNX, C++, WebAssembly', scoreTarget: 7.0 },
    { title: 'Hyperion: Fast Multi-Threaded Shader Compiler', track: 1, tech: 'Rust, SPIR-V, Vulkan', scoreTarget: 8.9 },
    { title: 'Argus: Cryptographic Provenance Auditor', track: 2, tech: 'Python, OpenSSL, Sigstore', scoreTarget: 8.5 },
    { title: 'Zephyr: Lightweight Deterministic Actor Framework', track: 1, tech: 'Elixir, Erlang BEAM, C Node', scoreTarget: 7.6 },
    { title: 'Loom: Agentic Workflow Orchestrator with Deadlock Guarantees', track: 0, tech: 'TypeScript, Petri Nets', scoreTarget: 8.2 },
  ];

  for (let i = 21; i <= 40; i++) {
    projectTitles.push({
      title: `Project ${i}: System Innovation Initiative ${String.fromCharCode(65 + (i % 26))}`,
      track: i % 3,
      tech: 'TypeScript, Rust, SQLite',
      scoreTarget: 5.5 + ((i * 7) % 35) / 10,
    });
  }

  const projects: any[] = [];
  let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < projectTitles.length; i++) {
    const pData = projectTitles[i];
    const teamLeader = await prisma.user.create({
      data: {
        email: `team${i + 1}.leader@dogfood.local`,
        name: `Lead Dev ${i + 1}`,
        passwordHash: defaultPassword,
        role: 'PARTICIPANT',
      },
    });

    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        name: `Team ${pData.title.split(':')[0]}`,
        inviteCode: `INV-${1000 + i}`,
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: teamLeader.id,
        role: 'LEADER',
      },
    });

    const contentPayload = {
      title: pData.title,
      description: `Complete engineering solution for ${pData.title}. Features zero-network operation, comprehensive unit test suite, verifiable benchmarks, and modular architecture.`,
      techStack: pData.tech,
      repoUrl: `https://github.com/dogfood-hack/${pData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      demoUrl: `http://localhost:3000/demos/${pData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    };
    const contentHash = sha256(JSON.stringify(contentPayload));

    const project = await prisma.project.create({
      data: {
        eventId: event.id,
        teamId: team.id,
        trackId: tracks[pData.track].id,
        title: pData.title,
        tagline: `High-integrity engineering for ${pData.title.split(':')[0]}`,
        description: contentPayload.description,
        techStack: contentPayload.techStack,
        repoUrl: contentPayload.repoUrl,
        demoUrl: contentPayload.demoUrl,
        featuresList: '1. Modular Architecture\n2. Deterministic Verification\n3. Zero Network Reliance\n4. Cryptographic Proofs',
        teamHours: 48,
        eligibility: 'ELIGIBLE',
        isFrozen: true,
        frozenHash: contentHash,
        frozenAt: new Date(Date.now() - 36 * 3600000),
      },
    });

    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: 1,
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        techStack: project.techStack,
        contentHash: contentHash,
        editorId: teamLeader.id,
        reason: 'Final submission freeze at deadline boundary',
      },
    });

    const nodePayload = { projectId: project.id, title: project.title, contentHash };
    const nodeHash = computeHashNode(previousHash, nodePayload, project.id);
    await prisma.integrityHashNode.create({
      data: {
        eventId: event.id,
        nodeType: 'SUBMISSION_FREEZE',
        resourceId: project.id,
        previousHash: previousHash,
        currentHash: nodeHash,
        payloadJson: JSON.stringify(nodePayload),
      },
    });
    previousHash = nodeHash;

    if (i < 5) {
      await prisma.ideaReport.create({
        data: {
          projectId: project.id,
          eventId: event.id,
          inputSummary: `Idea evaluation for ${project.title} targeting ${tracks[pData.track].name}`,
          minPotential: Math.min(95, Math.round(pData.scoreTarget * 10 - 5)),
          maxPotential: Math.min(99, Math.round(pData.scoreTarget * 10 + 5)),
          confidence: 'HIGH',
          confidenceReason: 'Grounded in concrete repository architecture, declared 48-hour scope, and clear test evidence.',
          scopePressure: 'ACHIEVABLE',
          scopeReason: '4 core features proposed within realistic 48 engineer-hours budget.',
          blindSpots: JSON.stringify([
            'Edge failure recovery protocol under high load',
            'Cross-platform path normalization boundary tests',
          ]),
          improvementActions: JSON.stringify([
            'Add memory stress benchmark under low-RAM profile',
            'Demonstrate offline recovery when persistence volume is locked',
            'Provide single-command verification script in repo root',
          ]),
          criteriaBands: JSON.stringify({
            'Technical Depth & Architecture': '8.5 - 9.5 / 10',
            'Rubric Alignment & Feasibility': '8.0 - 9.0 / 10',
            'Novelty & Problem Insight': '8.5 - 9.5 / 10',
            'Evidence & Reproducibility': '9.0 - 10.0 / 10',
          }),
        },
      });
    }

    projects.push({ ...project, scoreTarget: pData.scoreTarget });
  }

  // 8. Assign Judges and Generate Submitted Ballots
  console.log('⚖️ Assigning judges and seeding calibrated ballots...');
  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    const assignedJudges = [
      judges[(i * 3) % judges.length],
      judges[(i * 3 + 1) % judges.length],
      judges[(i * 3 + 2) % judges.length],
    ];

    const isDisagreementCase = (i === 0 || i === 6);

    for (let j = 0; j < assignedJudges.length; j++) {
      const judge = assignedJudges[j];

      await prisma.assignment.create({
        data: {
          eventId: event.id,
          projectId: proj.id,
          judgeId: judge.id,
          isTargeted: false,
        },
      });

      let baseModifier = (j === 0 ? -0.2 : j === 1 ? 0.3 : 0.0);
      if (isDisagreementCase && j === 2) {
        baseModifier = -4.5;
      }

      let ballotWeighted = 0;
      const criterionScoresData: any[] = [];

      for (const crit of criteria) {
        let score = Math.max(1.0, Math.min(10.0, proj.scoreTarget + baseModifier + (Math.random() * 0.4 - 0.2)));
        score = Math.round(score * 10) / 10;
        ballotWeighted += score * crit.weight;
        criterionScoresData.push({ criteriaId: crit.id, score });
      }

      const ballotHash = sha256(`BALLOT:${proj.id}:${judge.id}:${ballotWeighted}`);
      const ballot = await prisma.ballot.create({
        data: {
          eventId: event.id,
          projectId: proj.id,
          judgeId: judge.id,
          rubricVersionId: rubric.id,
          status: 'SUBMITTED',
          weightedScore: Math.round(ballotWeighted * 100) / 100,
          feedback: `Strong execution on ${proj.title}. Code clean, architecture modular. Recommend deeper fault-tolerance verification.`,
          privateNotes: 'Independently evaluated against locked rubric criteria. No peer discussion.',
          submittedAt: new Date(Date.now() - (12 - j) * 3600000),
          ballotHash: ballotHash,
        },
      });

      for (const cs of criterionScoresData) {
        await prisma.ballotScore.create({
          data: {
            ballotId: ballot.id,
            criteriaId: cs.criteriaId,
            score: cs.score,
            comment: `Evaluated at ${cs.score}/10 based on submitted evidence.`,
          },
        });
      }

      const bPayload = { ballotId: ballot.id, projectId: proj.id, judgeId: judge.id, weightedScore: ballot.weightedScore };
      const bNodeHash = computeHashNode(previousHash, bPayload, ballot.id);
      await prisma.integrityHashNode.create({
        data: {
          eventId: event.id,
          nodeType: 'BALLOT_SUBMIT',
          resourceId: ballot.id,
          previousHash: previousHash,
          currentHash: bNodeHash,
          payloadJson: JSON.stringify(bPayload),
        },
      });
      previousHash = bNodeHash;
    }
  }

  // 9. Initial Ranking Run
  console.log('🏆 Computing initial baseline ranking run...');
  const runPayload = {
    method: 'RAW_WEIGHTED_MEAN',
    parameters: JSON.stringify({ weights: { c1: 0.35, c2: 0.25, c3: 0.20, c4: 0.20 }, minReviews: 3 }),
  };
  const runHash = sha256(JSON.stringify(runPayload) + Date.now());

  const rankingRun = await prisma.rankingRun.create({
    data: {
      eventId: event.id,
      rubricVersionId: rubric.id,
      method: 'RAW_WEIGHTED_MEAN',
      parameters: runPayload.parameters,
      isFinalized: false,
      isPublished: false,
      runHash: runHash,
    },
  });

  const rankedItems: any[] = [];
  for (const proj of projects) {
    const ballots = await prisma.ballot.findMany({
      where: { projectId: proj.id, status: 'SUBMITTED' },
    });
    const avgScore = ballots.reduce((acc, b) => acc + b.weightedScore, 0) / (ballots.length || 1);
    const variance = ballots.reduce((acc, b) => acc + Math.pow(b.weightedScore - avgScore, 2), 0) / (ballots.length || 1);
    const stdDev = Math.sqrt(variance);

    rankedItems.push({
      projectId: proj.id,
      rawScore: Math.round(avgScore * 100) / 100,
      normalizedScore: Math.round(avgScore * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      reviewCount: ballots.length,
      disagreementFlag: stdDev > event.disagreeThreshold,
    });
  }

  rankedItems.sort((a, b) => b.rawScore - a.rawScore);

  for (let rank = 1; rank <= rankedItems.length; rank++) {
    const item = rankedItems[rank - 1];
    await prisma.rankedProject.create({
      data: {
        rankingRunId: rankingRun.id,
        projectId: item.projectId,
        rank: rank,
        rawScore: item.rawScore,
        normalizedScore: item.normalizedScore,
        uncertainty: item.stdDev,
        reviewCount: item.reviewCount,
        scoreStdDev: item.stdDev,
        disagreementFlag: item.disagreementFlag,
        breakdownJson: JSON.stringify({ rank, rawScore: item.rawScore, stdDev: item.stdDev }),
      },
    });
  }

  const rPayload = { rankingRunId: rankingRun.id, method: rankingRun.method, runHash };
  const rNodeHash = computeHashNode(previousHash, rPayload, rankingRun.id);
  await prisma.integrityHashNode.create({
    data: {
      eventId: event.id,
      nodeType: 'RANKING_RUN',
      resourceId: rankingRun.id,
      previousHash: previousHash,
      currentHash: rNodeHash,
      payloadJson: JSON.stringify(rPayload),
    },
  });
  previousHash = rNodeHash;

  // 10. Audit events
  await prisma.auditEvent.create({
    data: {
      eventId: event.id,
      actorId: admin.id,
      actorRole: 'ADMIN',
      action: 'EVENT_INITIALIZED',
      resourceType: 'EVENT',
      resourceId: event.id,
      beforeHash: null,
      afterHash: sha256(event.name),
      reason: 'Standard offline initialization of event lifecycle',
      requestId: 'REQ-BOOT-001',
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventId: event.id,
      actorId: organizer.id,
      actorRole: 'ORGANIZER',
      action: 'RUBRIC_LOCKED',
      resourceType: 'RUBRIC_VERSION',
      resourceId: rubric.id,
      beforeHash: null,
      afterHash: sha256(`RUBRIC_V1_LOCKED`),
      reason: 'Organizer finalized and locked rubric criteria weights',
      requestId: 'REQ-RUBRIC-LOCK-002',
    },
  });

  console.log('✅ DOGFOOD OS SQLite seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
