import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient;
  private db: Db;
  private isConnected = false;

  private readonly uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  private readonly dbName = process.env.MONGODB_DB_NAME || 'dogfood_os';

  async onModuleInit() {
    await this.connect();
    await this.initializeIndexesAndSeed();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('MongoDB connection closed.');
    }
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      this.logger.log(`Successfully connected to MongoDB at ${this.uri}, database: ${this.dbName}`);
    } catch (error) {
      this.logger.error(`Failed to connect to MongoDB at ${this.uri}: ${(error as Error).message}`);
      this.isConnected = false;
    }
  }

  getDb(): Db {
    return this.db;
  }

  getCollection<T = any>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected. Please ensure MongoDB is running on port 27017.');
    }
    return this.db.collection<T>(name);
  }

  get status() {
    return {
      connected: this.isConnected,
      database: this.dbName,
      uri: this.uri,
    };
  }

  async initializeIndexesAndSeed() {
    if (!this.isConnected || !this.db) return;

    try {
      // 1. Create indexes
      await this.db.collection('projects').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('projects').createIndex({ track: 1 });
      await this.db.collection('projects').createIndex({ rank: 1 });

      await this.db.collection('ballots').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('ballots').createIndex({ projectId: 1 });
      await this.db.collection('ballots').createIndex({ judgeId: 1 });
      await this.db.collection('ballots').createIndex({ status: 1 });

      await this.db.collection('events').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('disputes').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('trust_ledger').createIndex({ blockHeight: 1 }, { unique: true });

      // 2. Check if already seeded - DO NOT auto-seed mock data; platform runs on 100% live data
      const projectCount = await this.db.collection('projects').countDocuments();
      this.logger.log(`MongoDB connected. Current live projects count: ${projectCount}.`);
    } catch (e) {
      this.logger.warn(`Index check warning: ${(e as Error).message}`);
    }
  }

  async clearDatabase() {
    if (!this.isConnected || !this.db) return;
    await Promise.all([
      this.db.collection('projects').deleteMany({}),
      this.db.collection('ballots').deleteMany({}),
      this.db.collection('disputes').deleteMany({}),
      this.db.collection('trust_ledger').deleteMany({}),
      this.db.collection('events').deleteMany({}),
    ]);
    this.logger.log('Database cleared of all seeded and mock data. Running in 100% clean live mode.');
  }

  async seedDatabase() {
    const eventId = 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f';

    // 1. Seed Active Event
    await this.db.collection('events').updateOne(
      { id: eventId },
      {
        $set: {
          id: eventId,
          name: 'Autonomous Systems & Edge Intelligence 2026',
          slug: 'autonomous-systems-2026',
          status: 'JUDGING_OPEN',
          currentRound: 4,
          tracks: [
            { id: 'track-1', name: 'Autonomous Agents', percentage: 52.5, color: '#10B981' },
            { id: 'track-2', name: 'Developer Infra', percentage: 27.5, color: '#6366F1' },
            { id: 'track-3', name: 'Verifiable Systems', percentage: 20.0, color: '#06B6D4' },
          ],
          quorumThreshold: 0.95,
          totalRegisteredTeams: 40,
          totalAssignedBallots: 120,
          freezeDeadline: new Date(Date.now() + 3.25 * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // 2. Seed 40 Verified Projects
    const tracks = ['Autonomous Agents', 'Developer Infra', 'Verifiable Systems'];
    const projectTemplates = [
      {
        id: 'proj-01',
        title: 'HyperAgent Engine',
        tagline: 'Autonomous execution layer with Multi-Party Computation state',
        track: 'Developer Infra',
        rank: 1,
        elo: 98.4,
        eloShift: '+34',
        meanScore: 4.88,
        repoUrl: 'https://github.com/dogfood-teams/hyperagent-engine',
        commitSha: 'a89c201f8d9b1c7a',
        teamMembers: ['Alex Rivera (Lead)', 'Siddharth Rao', 'Chloe Bennett'],
        criteriaScores: { depth: 98, novelty: 96, feasibility: 95, presentation: 99 },
      },
      {
        id: 'proj-02',
        title: 'ZeroKernel V3',
        tagline: 'Provable compiler optimization pipelines using ZK circuits',
        track: 'Verifiable Systems',
        rank: 2,
        elo: 96.1,
        eloShift: '+18',
        meanScore: 4.75,
        repoUrl: 'https://github.com/dogfood-teams/zerokernel-v3',
        commitSha: '7f91c3da8901b22e',
        teamMembers: ['David Kim', 'Elena Rostova (Lead)'],
        criteriaScores: { depth: 96, novelty: 95, feasibility: 92, presentation: 94 },
      },
      {
        id: 'proj-03',
        title: 'MeshMesh Topology',
        tagline: 'Sub-10ms peer discovery over WebRTC with DHT verification',
        track: 'Autonomous Agents',
        rank: 3,
        elo: 94.8,
        eloShift: '+22',
        meanScore: 4.62,
        repoUrl: 'https://github.com/dogfood-teams/meshmesh-topology',
        commitSha: '3c8290f91ab047d1',
        teamMembers: ['Marcus Aurelius', 'Tanya Vance'],
        criteriaScores: { depth: 94, novelty: 93, feasibility: 94, presentation: 93 },
      },
      {
        id: 'proj-04',
        title: 'OmniQuery Vector Cache',
        tagline: 'High-throughput 12ms embedding search with SIMD acceleration',
        track: 'Developer Infra',
        rank: 4,
        elo: 93.5,
        eloShift: '+15',
        meanScore: 4.54,
        repoUrl: 'https://github.com/dogfood-teams/omniquery-cache',
        commitSha: '9b1104e8d3c719aa',
        teamMembers: ['Sarah Jenkins', 'Lucas Morita'],
        criteriaScores: { depth: 92, novelty: 91, feasibility: 95, presentation: 92 },
      },
      {
        id: 'proj-05',
        title: 'Vectra SIMD Vector Engine',
        tagline: 'Parallelized token scoring with AVX-512 acceleration',
        track: 'Autonomous Agents',
        rank: 5,
        elo: 91.9,
        eloShift: '+10',
        meanScore: 4.41,
        repoUrl: 'https://github.com/dogfood-teams/vectra-simd',
        commitSha: 'e9921da4c8f01b33',
        teamMembers: ['Vikram Patel (Lead)', 'Liam O Connor'],
        criteriaScores: { depth: 95, novelty: 90, feasibility: 88, presentation: 89 },
        isDisputed: true,
      },
      {
        id: 'proj-06',
        title: 'Ironclad Verified Sandbox',
        tagline: 'WebAssembly micro-containers with deterministic WASI memory bounds',
        track: 'Verifiable Systems',
        rank: 6,
        elo: 90.7,
        eloShift: '+8',
        meanScore: 4.38,
        repoUrl: 'https://github.com/dogfood-teams/ironclad-sandbox',
        commitSha: '5a8190c1e7d23a41',
        teamMembers: ['Nina Petrova', 'Zackary Thorne'],
        criteriaScores: { depth: 90, novelty: 89, feasibility: 91, presentation: 90 },
        isDisputed: true,
      },
    ];

    // Generate remaining 34 projects dynamically to reach 40
    const sampleThemes = [
      'EdgeInfer Nano', 'VaporSync Protocol', 'NeuroShield MPC', 'Substratum DAG',
      'QuantumProof KMS', 'KubeKernel Micro', 'PrismFlow DAG', 'AuraMesh Peer',
      'SynapseCache Zero', 'DeepTrace Profiler', 'FluxState Engine', 'BeaconMesh ZK',
      'Chronos Ledger', 'TitanWasm Runtime', 'Argus Sentinel', 'Boreal Crypt',
      'ApexRouter P2P', 'EchoProtocol TLS', 'HyperGraph DB', 'OmniSeal Enclave',
      'VortexState Engine', 'HelixValidator DAG', 'ZenithProxy Layer', 'OrionStream P2P',
      'PulseEngine Realtime', 'AtlasKernel OS', 'CipherGrid MPC', 'AetherState DAG',
      'SpectraVector SIMD', 'NovaCompiler LLVM', 'StratumMesh ZK', 'PolarisTelemetry Node',
      'ForgeContainer Wasm', 'AxiomProof System'
    ];

    const allProjects = [...projectTemplates];
    for (let i = 0; i < sampleThemes.length; i++) {
      const idx = i + 7;
      const track = tracks[i % tracks.length];
      const eloScore = Number((89.5 - i * 0.95).toFixed(1));
      const meanScore = Number((4.32 - i * 0.045).toFixed(2));
      allProjects.push({
        id: `proj-${idx < 10 ? '0' + idx : idx}`,
        title: sampleThemes[i],
        tagline: `High-assurance ${track.toLowerCase()} module with deterministic guarantees`,
        track,
        rank: idx,
        elo: eloScore,
        eloShift: `+${Math.floor(Math.random() * 15 + 4)}`,
        meanScore,
        repoUrl: `https://github.com/dogfood-teams/${sampleThemes[i].toLowerCase().replace(/\s+/g, '-')}`,
        commitSha: Math.random().toString(16).substring(2, 18),
        teamMembers: [`Dev_${i + 1}`, `Lead_${i + 1}`],
        criteriaScores: {
          depth: Math.floor(Math.random() * 20 + 75),
          novelty: Math.floor(Math.random() * 20 + 75),
          feasibility: Math.floor(Math.random() * 20 + 75),
          presentation: Math.floor(Math.random() * 20 + 75),
        },
      });
    }

    await this.db.collection('projects').deleteMany({});
    await this.db.collection('projects').insertMany(allProjects);

    // 3. Seed 120 Ballots (3 per project: 114 locked, 2 disputed, 4 pending)
    const allBallots = [];
    const judges = ['anon-eval#0x8F4A', 'anon-eval#0x3C1B', 'anon-eval#0x99D2', 'anon-eval#0x44B1', 'anon-eval#0x77E0'];
    let ballotCounter = 1;

    for (const p of allProjects) {
      for (let j = 0; j < 3; j++) {
        const bId = `BLT-${1000 + ballotCounter}`;
        const judgeId = judges[(ballotCounter + j) % judges.length];
        let status = 'LOCKED';
        let score = Number((p.meanScore + (j - 1) * 0.15).toFixed(2));

        if (p.id === 'proj-05' && j === 1) {
          status = 'DISPUTED';
          score = 3.0; // Deliberate outlier delta
        } else if (p.id === 'proj-06' && j === 2) {
          status = 'DISPUTED';
          score = 4.21; // Tie trigger
        } else if (ballotCounter > 116) {
          status = 'IN_PROGRESS';
        }

        allBallots.push({
          id: bId,
          projectId: p.id,
          projectTitle: p.title,
          track: p.track,
          judgeId,
          score,
          status,
          criteria: {
            technicalDepth: Number((score * 0.95).toFixed(1)),
            novelty: Number((score * 0.98).toFixed(1)),
            feasibility: Number((score * 0.92).toFixed(1)),
            impact: Number((score * 0.96).toFixed(1)),
          },
          signatureSha256: `0x${Math.random().toString(16).substring(2, 26)}...${Math.random().toString(16).substring(2, 8)}`,
          submittedAt: new Date(Date.now() - ballotCounter * 45000).toISOString(),
        });
        ballotCounter++;
      }
    }

    await this.db.collection('ballots').deleteMany({});
    await this.db.collection('ballots').insertMany(allBallots);

    // 4. Seed Disputes
    const disputes = [
      {
        id: 'dsp-01',
        ballotId: 'BLT-1014',
        projectId: 'proj-05',
        projectTitle: 'Vectra SIMD Vector Engine',
        criterion: 'Criterion 3: Technical Novelty',
        delta: 1.8,
        threshold: 1.5,
        judgeA: 'Judge Dr. Sarah Lin #2 (Score: 4.8)',
        judgeB: 'Judge #14 (Score: 3.0)',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: 'dsp-02',
        ballotId: 'BLT-1018',
        projectId: 'proj-06',
        projectTitle: 'Ironclad Verified Sandbox',
        criterion: 'Tie-break trigger',
        delta: 0.0,
        threshold: 0.0,
        judgeA: 'Substratum (Score: 4.21)',
        judgeB: 'Ironclad (Score: 4.21)',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 360000).toISOString(),
      },
    ];
    await this.db.collection('disputes').deleteMany({});
    await this.db.collection('disputes').insertMany(disputes);

    // 5. Seed Trust Ledger (Merkle DAG blocks)
    const ledgerBlocks = [
      {
        blockHeight: 4892104,
        stateRootSha256: '0x7f49c2a81de09b3c4f78e19203a98762514bcda9e201',
        zkSnarkHash: 'zkSNARK#blk4892104-e9a8f2',
        verificationTimeMs: 1.4,
        status: 'VERIFIED_IMMUTABLE',
        ballotsCommitted: 114,
        timestamp: new Date().toISOString(),
      },
      {
        blockHeight: 4892103,
        stateRootSha256: '0x3c1b99a801e23f99aa8723b1029487c654129e00192',
        zkSnarkHash: 'zkSNARK#blk4892103-88c91a',
        verificationTimeMs: 1.2,
        status: 'VERIFIED_IMMUTABLE',
        ballotsCommitted: 110,
        timestamp: new Date(Date.now() - 600000).toISOString(),
      },
    ];
    await this.db.collection('trust_ledger').deleteMany({});
    await this.db.collection('trust_ledger').insertMany(ledgerBlocks);

    this.logger.log('Database seeding complete: 40 projects, 120 ballots, 2 disputes, and Merkle ledger created.');
  }
}
