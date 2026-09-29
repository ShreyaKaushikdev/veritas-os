import { Controller, Post, Body, Get, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MongoService } from './mongo.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

export interface SynthesizePromptDto {
  prompt: string;
  autoDeploy?: boolean;
}

@ApiTags('Autonomous Hackathon Orchestrator')
@Controller('autopilot')
@UseGuards(AuthGuard, RolesGuard)
export class AutopilotController {
  constructor(private readonly mongoService: MongoService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Get ready-to-use prompt presets for hackathon auto-configuration' })
  getPresets() {
    return [
      {
        id: 'ai-agents-solana',
        title: '⚡ 48h Solana & Autonomous Agents Hackathon',
        prompt: 'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.',
        badge: 'Web3 & AI',
      },
      {
        id: 'verifiable-zk',
        title: '🛡️ 36h Zero Knowledge & Cryptographic Trust Sprint',
        prompt: 'Organize a 36-hour ZK Cryptography & Verifiable Systems hackathon for 300 participants, $40k prize pool, 3 tracks (Provable State Machines, Private Voting DAGs, Circom Compilers), strict blind evaluation, anti-collusion trimmed mean, and zero-knowledge receipts.',
        badge: 'Cryptography',
      },
      {
        id: 'climatetech-depin',
        title: '🌍 72h Climate & Decentralized Physical Infrastructure',
        prompt: 'Launch a 72-hour global ClimateTech and DePIN hackathon with 800 hackers, $100k quadratic funding pool, 4 tracks (Renewable Microgrids, Carbon Proofs, Edge Sensor Networks, Circular Supply Chain), anchor calibrated scoring, and automated tie-breaking.',
        badge: 'Climate & IoT',
      },
      {
        id: 'enterprise-developer-infra',
        title: '⚙️ 48h Developer Infrastructure & Systems Architecture',
        prompt: 'Host a 48-hour high-performance Developer Infra sprint with 400 developers, $50,000 in prizes, 3 tracks (WASM & Kernel runtimes, Distributed Consensus, High-throughput Storage), peer-blind grading, and mathematical Git velocity audit.',
        badge: 'Systems & Infra',
      },
    ];
  }

  @Post('synthesize')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({ summary: 'Autonomous Prompt-to-Hackathon: Synthesize complete event, tracks, rubric, anchors, and manifest from a single prompt' })
  async synthesizeHackathon(@Body() body: SynthesizePromptDto) {
    if (!body || !body.prompt || body.prompt.trim().length < 8) {
      throw new BadRequestException('Please provide a descriptive prompt for the hackathon (e.g. duration, topic, tracks, prize pool, judging rules).');
    }

    const prompt = body.prompt.trim();
    const blueprint = this.parseAndSynthesize(prompt);

    if (body.autoDeploy) {
      await this.applyBlueprintToDatabase(blueprint);
      blueprint.appliedToCluster = true;
    }

    return blueprint;
  }

  @Post('apply')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({ summary: 'Apply a synthesized hackathon blueprint directly into MongoDB cluster' })
  async applyBlueprint(@Body() blueprint: any) {
    if (!blueprint || !blueprint.event || !blueprint.tracks) {
      throw new BadRequestException('Invalid hackathon blueprint object.');
    }

    const result = await this.applyBlueprintToDatabase(blueprint);
    return {
      success: true,
      message: `Successfully configured "${blueprint.event.name}" into live cluster with ${blueprint.tracks.length} tracks and ${result.projectCount} customized seed projects!`,
      ...result,
    };
  }

  private parseAndSynthesize(prompt: string) {
    const lower = prompt.toLowerCase();

    // 1. Duration Extraction
    let durationHours = 48;
    const hourMatch = lower.match(/(\d+)\s*(?:hour|hr|h)\b/);
    if (hourMatch) {
      durationHours = parseInt(hourMatch[1], 10);
    } else if (lower.includes('weekend')) {
      durationHours = 48;
    } else if (lower.includes('week') || lower.includes('7 days')) {
      durationHours = 168;
    }

    // 2. Participant Scale
    let participants = 400;
    const partMatch = lower.match(/(\d+)\s*(?:hacker|participant|developer|people|builder)/);
    if (partMatch) {
      participants = parseInt(partMatch[1], 10);
    }

    // 3. Prize Pool
    let prizeTotal = '$50,000';
    const prizeMatch = prompt.match(/\$([0-9,]+(?:k)?)/i) || prompt.match(/([0-9,]+)\s*(?:usd|dollars|\$)/i);
    if (prizeMatch) {
      prizeTotal = prizeMatch[0].startsWith('$') ? prizeMatch[0] : `$${prizeMatch[0]}`;
    }

    // 4. Domain & Track Synthesis
    let domain = 'Developer Systems & Autonomous Infrastructure';
    let tracks = [
      {
        id: 'track-infra',
        name: 'Developer Infra & Core Runtimes',
        tagline: 'High-throughput execution engines, WASM compilers, and low-latency network layers.',
        color: '#10b981',
      },
      {
        id: 'track-verifiable',
        name: 'Verifiable Systems & Cryptography',
        tagline: 'Provable state transitions, ZK circuit optimizations, and cryptographic ledgers.',
        color: '#06b6d4',
      },
      {
        id: 'track-agents',
        name: 'Autonomous Agents & Swarms',
        tagline: 'Multi-party agent topologies, deterministic state machines, and autonomous coordination.',
        color: '#8b5cf6',
      },
    ];

    if (lower.includes('solana') || lower.includes('web3') || lower.includes('defi')) {
      domain = 'Solana & Decentralized Execution Networks';
      tracks = [
        {
          id: 'track-defi-agents',
          name: 'Autonomous DeFi & Liquidity Swarms',
          tagline: 'High-frequency algorithmic execution, intent-based routing, and cross-program invocation.',
          color: '#14f195',
        },
        {
          id: 'track-zk-scale',
          name: 'Zero-Knowledge State Compression',
          tagline: 'Verifiable state proofs, succinct off-chain computations, and light client sync.',
          color: '#9945ff',
        },
        {
          id: 'track-depin-mesh',
          name: 'DePIN Edge Compute & Oracles',
          tagline: 'Decentralized physical resource networks, sensor telemetry, and hardware attestation.',
          color: '#38bdf8',
        },
      ];
    } else if (lower.includes('climate') || lower.includes('green') || lower.includes('carbon')) {
      domain = 'ClimateTech & Decentralized Energy Networks';
      tracks = [
        {
          id: 'track-microgrid',
          name: 'Autonomous Microgrids & Energy Trading',
          tagline: 'Peer-to-peer renewable arbitrage, smart transformer routing, and solar yield proofs.',
          color: '#10b981',
        },
        {
          id: 'track-carbon-mrv',
          name: 'Verifiable Carbon MRV & Satellite Oracles',
          tagline: 'Remote sensing verification, cryptographic biomass tracking, and tokenized removals.',
          color: '#14b8a6',
        },
        {
          id: 'track-circular-iot',
          name: 'Circular Materials & Edge Sensing',
          tagline: 'Lifecycle telemetry, hardware supply chain passports, and recycling incentive meshes.',
          color: '#84cc16',
        },
      ];
    } else if (lower.includes('ai') || lower.includes('agent') || lower.includes('llm')) {
      domain = 'Autonomous Agent Swarms & Neuro-Symbolic Intelligence';
      tracks = [
        {
          id: 'track-swarms',
          name: 'Multi-Agent Consensus & Swarm Topology',
          tagline: 'Decentralized coordination protocols, task negotiation, and peer-to-peer memory graphs.',
          color: '#8b5cf6',
        },
        {
          id: 'track-eval-guard',
          name: 'Deterministic Agent Guardrails & Audit',
          tagline: 'Verifiable execution sandboxes, tamper-evident trace logging, and safety proofs.',
          color: '#ec4899',
        },
        {
          id: 'track-agent-tools',
          name: 'Autonomous Tool Synthesis & Edge LLMs',
          tagline: 'Sub-50ms local inference pipelines, dynamic WASM tool compilation, and self-hosted agents.',
          color: '#f59e0b',
        },
      ];
    }

    // 5. Synthesize Event Details
    const nameMatch = prompt.match(/(?:run|organize|launch|host)\s+(?:a\s+)?([A-Za-z0-9\s&—–\-]+?)(?:\s+hackathon|\s+sprint|\s+competition)/i);
    const eventName = nameMatch && nameMatch[1].length > 4 ? `${nameMatch[1].trim()} Hackathon` : `${domain} Hackathon 2026`;
    const eventSlug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 6. Rubric Weights & Criteria Formulation (guaranteed sum = 1.0)
    const rubricCriteria = [
      {
        id: 'crit-depth',
        name: 'Technical Depth & Architecture',
        weight: 0.35,
        minScore: 1,
        maxScore: 5,
        description: 'Quality of codebase, systems engineering complexity, absence of mock shims, and robust concurrency handling.',
      },
      {
        id: 'crit-novelty',
        name: 'Algorithmic Novelty & Problem Insight',
        weight: 0.25,
        minScore: 1,
        maxScore: 5,
        description: 'Originality of technical approach, breakthrough design decisions, and avoidance of boilerplate wrappers.',
      },
      {
        id: 'crit-execution',
        name: 'Working Implementation & Completeness',
        weight: 0.20,
        minScore: 1,
        maxScore: 5,
        description: 'End-to-end working demo, reproducible local cold start, and clean test pass rate.',
      },
      {
        id: 'crit-impact',
        name: 'Domain Viability & Developer Experience',
        weight: 0.20,
        minScore: 1,
        maxScore: 5,
        description: 'Interface ergonomics, API elegance, and realistic deployment readiness in real production environments.',
      },
    ];

    // 7. Calibration Anchors
    const anchorProjects = [
      {
        id: 'anchor-high',
        title: 'HyperAnchor Alpha (Top Tier Benchmark)',
        baselineScore: 4.8,
        description: 'Reference project demonstrating exhaustive test suites, sub-10ms latency, and zero external mock dependencies.',
      },
      {
        id: 'anchor-med',
        title: 'StandardAnchor Beta (Median Tier Benchmark)',
        baselineScore: 3.2,
        description: 'Reference project with functional happy path, solid UI, but basic error recovery and standard architectural depth.',
      },
      {
        id: 'anchor-low',
        title: 'ShallowAnchor Gamma (Baseline Tier Benchmark)',
        baselineScore: 1.8,
        description: 'Reference project showing incomplete API stubs, unhandled race conditions, and heavy template scaffolding.',
      },
    ];

    // 8. Sample Projects Seed Pool
    const seedProjects = [
      {
        title: 'HyperCore Protocol',
        tagline: `Provable, sub-millisecond execution pipeline for ${tracks[0].name}.`,
        track: tracks[0].name,
        rank: 1,
        elo: 108.4,
        meanScore: 4.92,
        teamMembers: ['Alex Rivera (Lead)', 'Siddharth Rao'],
      },
      {
        title: 'AetherZK Verification Node',
        tagline: `Succinct cryptographic state attestation built for ${tracks[1].name}.`,
        track: tracks[1].name,
        rank: 2,
        elo: 96.2,
        meanScore: 4.75,
        teamMembers: ['Elena Rostova (Lead)', 'David Kim'],
      },
      {
        title: 'MeshMesh Topology',
        tagline: `P2P gossip synchronization and resilient state propagation for ${tracks[2].name}.`,
        track: tracks[2].name,
        rank: 3,
        elo: 92.5,
        meanScore: 4.60,
        teamMembers: ['Marcus Aurelius', 'Tanya Vance'],
      },
      {
        title: 'Vectra SIMD Acceleration',
        tagline: `Low-level assembly primitives delivering 8x memory throughput in ${tracks[0].name}.`,
        track: tracks[0].name,
        rank: 4,
        elo: 88.0,
        meanScore: 4.45,
        teamMembers: ['Kenji Sato', 'Chao Wei'],
      },
    ];

    // 9. Generate Production .dogfood.toml manifest
    const manifestToml = `[event]
name = "${eventName}"
slug = "${eventSlug}"
duration_hours = ${durationHours}
expected_participants = ${participants}
prize_pool = "${prizeTotal}"
timezone = "UTC"
autopilot_mode = "ASSIST"

[judging]
blind_review = true
min_reviews_per_project = 4
anchor_calibration = true
pairwise_elo_enabled = true
anti_collusion_trimmed_mean = true
tie_break_hierarchy = ["rubric_weight", "score_dispersion_stddev", "head_to_head_pairwise"]

[[tracks]]
id = "${tracks[0].id}"
name = "${tracks[0].name}"
tagline = "${tracks[0].tagline}"

[[tracks]]
id = "${tracks[1].id}"
name = "${tracks[1].name}"
tagline = "${tracks[1].tagline}"

[[tracks]]
id = "${tracks[2].id}"
name = "${tracks[2].name}"
tagline = "${tracks[2].tagline}"

[rubric]
version = "1.0.0"
locked = true

[[rubric.criteria]]
name = "Technical Depth & Architecture"
weight = 0.35
scale = [1, 5]

[[rubric.criteria]]
name = "Algorithmic Novelty & Problem Insight"
weight = 0.25
scale = [1, 5]

[[rubric.criteria]]
name = "Working Implementation & Completeness"
weight = 0.20
scale = [1, 5]

[[rubric.criteria]]
name = "Domain Viability & Developer Experience"
weight = 0.20
scale = [1, 5]
`;

    return {
      event: {
        name: eventName,
        slug: eventSlug,
        domain,
        durationHours,
        participants,
        prizeTotal,
        blindReviewMode: true,
        pairwiseEloEnabled: true,
        autopilotMode: 'ASSIST',
      },
      tracks,
      rubric: {
        version: '1.0.0',
        isLocked: true,
        criteria: rubricCriteria,
      },
      anchors: anchorProjects,
      seedProjects,
      manifestToml,
      appliedToCluster: false,
    };
  }

  private async applyBlueprintToDatabase(blueprint: any) {
    const db = this.mongoService.getDb();
    if (!db) {
      throw new BadRequestException('MongoDB database not connected. Please ensure MongoDB is running.');
    }

    // 1. Update active event in MongoDB
    const eventId = blueprint.event?.id || 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f';
    await db.collection('events').updateOne(
      { id: eventId },
      {
        $set: {
          id: eventId,
          name: blueprint.event.name,
          slug: blueprint.event.slug,
          domain: blueprint.event.domain,
          durationHours: blueprint.event.durationHours,
          participants: blueprint.event.participants,
          prizeTotal: blueprint.event.prizeTotal,
          tracks: blueprint.tracks,
          rubric: blueprint.rubric,
          status: 'REGISTRATION_OPEN',
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // 2. Clear old demo projects, ballots, and disputes for a clean authentic hackathon
    await db.collection('projects').deleteMany({});
    await db.collection('ballots').deleteMany({});
    await db.collection('disputes').deleteMany({});

    // Only seed mock projects if explicitly requested by blueprint.seedDemo
    let projectsCount = 0;
    let ballotsCount = 0;

    if (blueprint.seedDemo && Array.isArray(blueprint.seedProjects) && blueprint.seedProjects.length > 0) {
      const projectsToInsert = blueprint.seedProjects.map((p: any, idx: number) => ({
        id: `proj-${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`,
        title: p.title,
        tagline: p.tagline,
        track: p.track,
        rank: p.rank || idx + 1,
        elo: p.elo || 90.0,
        eloShift: `+${Math.floor(Math.random() * 8 + 4)}`,
        meanScore: p.meanScore || 4.5,
        repoUrl: `https://github.com/dogfood-teams/${p.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        commitSha: Math.random().toString(16).substring(2, 18),
        teamMembers: p.teamMembers || ['Lead Developer', 'Systems Engineer'],
        criteriaScores: { depth: 85, novelty: 80, feasibility: 88, presentation: 82 },
        updatedAt: new Date().toISOString(),
      }));

      await db.collection('projects').insertMany(projectsToInsert);
      projectsCount = projectsToInsert.length;
    }

    return {
      eventId,
      eventName: blueprint.event?.name,
      slug: blueprint.event?.slug,
      tracks: blueprint.tracks,
      projectCount: projectsCount,
      ballotCount: ballotsCount,
    };
  }
}
