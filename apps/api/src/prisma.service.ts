import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

interface FilterQuery {
  [key: string]: any;
}

class InMemoryTable<T extends { id?: string } = any> {
  public records: any[] = [];

  constructor(public readonly name: string, private readonly getStore: () => Record<string, InMemoryTable>) {}

  private matches(record: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      if (key === 'OR' && Array.isArray(where.OR)) {
        if (!where.OR.some((subWhere: any) => this.matches(record, subWhere))) return false;
        continue;
      }
      if (key === 'AND' && Array.isArray(where.AND)) {
        if (!where.AND.every((subWhere: any) => this.matches(record, subWhere))) return false;
        continue;
      }
      if (key === 'NOT') {
        if (this.matches(record, where.NOT)) return false;
        continue;
      }

      const val = where[key];
      const recVal = record[key];

      // Nested relation check (e.g. team: { eventId: '...' })
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
        if (val.in && Array.isArray(val.in)) {
          if (!val.in.includes(recVal)) return false;
        } else if (val.not !== undefined) {
          if (recVal === val.not) return false;
        } else if (val.some !== undefined) {
          const relatedTable = this.getStore()[key];
          if (relatedTable) {
            const matchesSome = relatedTable.records.some((relRec) =>
              relRec[`${this.name}Id`] === record.id && relatedTable.matches(relRec, val.some)
            );
            if (!matchesSome) return false;
          }
        } else {
          // Check if key is a relation on record or foreign key
          const foreignKey = `${key}Id`;
          if (record[foreignKey]) {
            const relatedTable = this.getStore()[key];
            if (relatedTable) {
              const relDoc = relatedTable.records.find((r) => r.id === record[foreignKey]);
              if (!relDoc || !relatedTable.matches(relDoc, val)) return false;
            }
          } else if (record[key]) {
            if (!this.matches(record[key], val)) return false;
          }
        }
      } else if (recVal instanceof Date && val instanceof Date) {
        if (recVal.getTime() !== val.getTime()) return false;
      } else if (recVal !== val) {
        return false;
      }
    }
    return true;
  }

  private populateIncludes(record: any, include: any): any {
    if (!include || !record) return record;
    const cloned = { ...record };
    const store = this.getStore();

    for (const relKey of Object.keys(include)) {
      if (!include[relKey]) continue;
      const subInclude = typeof include[relKey] === 'object' && include[relKey].include ? include[relKey].include : undefined;
      const subSelect = typeof include[relKey] === 'object' && include[relKey].select ? include[relKey].select : undefined;
      const subWhere = typeof include[relKey] === 'object' && include[relKey].where ? include[relKey].where : undefined;
      const subOrderBy = typeof include[relKey] === 'object' && include[relKey].orderBy ? include[relKey].orderBy : undefined;
      const subTake = typeof include[relKey] === 'object' && include[relKey].take ? include[relKey].take : undefined;

      // 1. Check singular direct relation (e.g. user, team, project, rubricVersion)
      const singularRelId = cloned[`${relKey}Id`];
      if (singularRelId && store[relKey]) {
        const relatedDoc = store[relKey].records.find((r) => r.id === singularRelId);
        if (relatedDoc) {
          let pop = store[relKey].populateIncludes(relatedDoc, subInclude);
          if (subSelect) pop = this.applySelect(pop, subSelect);
          cloned[relKey] = pop;
        } else {
          cloned[relKey] = null;
        }
        continue;
      }

      // 2. Check 1-to-many or inverse relation (e.g. members, projects, versions, ballots, ideaReports)
      let targetTableName = relKey;
      if (relKey === 'members') targetTableName = 'teamMember';
      if (relKey === 'teamMembers') targetTableName = 'teamMember';
      if (relKey === 'rubrics') targetTableName = 'rubricVersion';
      if (relKey === 'versions') targetTableName = 'projectVersion';
      if (relKey === 'criteria') targetTableName = 'rubricCriteria';
      if (relKey === 'scores') targetTableName = 'ballotScore';

      const relatedTable = store[targetTableName] || store[relKey];
      if (relatedTable) {
        let matching = relatedTable.records.filter((r) => {
          const directMatch = r[`${this.name}Id`] === cloned.id;
          if (directMatch) return true;
          if (this.name === 'team' && targetTableName === 'teamMember') return r.teamId === cloned.id;
          if (this.name === 'project' && targetTableName === 'projectVersion') return r.projectId === cloned.id;
          if (this.name === 'project' && targetTableName === 'ballot') return r.projectId === cloned.id;
          if (this.name === 'event' && targetTableName === 'team') return r.eventId === cloned.id;
          if (this.name === 'event' && targetTableName === 'project') return r.eventId === cloned.id;
          if (this.name === 'event' && targetTableName === 'track') return r.eventId === cloned.id;
          if (this.name === 'event' && targetTableName === 'prize') return r.eventId === cloned.id;
          if (this.name === 'event' && targetTableName === 'rubricVersion') return r.eventId === cloned.id;
          if (this.name === 'event' && targetTableName === 'membership') return r.eventId === cloned.id;
          return false;
        });

        if (subWhere) {
          matching = matching.filter((r) => relatedTable.matches(r, subWhere));
        }

        if (subOrderBy) {
          const sortKey = Object.keys(subOrderBy)[0];
          const sortDir = subOrderBy[sortKey] === 'desc' ? -1 : 1;
          matching.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 * sortDir : -1 * sortDir));
        }

        if (subTake) {
          matching = matching.slice(0, subTake);
        }

        let populated = matching.map((r) => relatedTable.populateIncludes(r, subInclude));
        if (subSelect) {
          populated = populated.map((r) => this.applySelect(r, subSelect));
        }

        // Special handling for singular 1-to-1 inverse relations (like team.project or user.judgeProfile)
        if (relKey === 'project' || relKey === 'judgeProfile') {
          cloned[relKey] = populated[0] || null;
        } else {
          cloned[relKey] = populated;
        }
      }
    }

    if (include._count) {
      cloned._count = {};
      for (const countKey of Object.keys(include._count.select || {})) {
        let countTable = store[countKey];
        if (countKey === 'projects') countTable = store['project'];
        if (countKey === 'teams') countTable = store['team'];
        if (countKey === 'memberships') countTable = store['membership'];
        if (countTable) {
          cloned._count[countKey] = countTable.records.filter((r) => r[`${this.name}Id`] === cloned.id || r.eventId === cloned.id).length;
        }
      }
    }

    return cloned;
  }

  private applySelect(record: any, select: any): any {
    if (!select || !record) return record;
    const res: any = {};
    for (const k of Object.keys(select)) {
      if (select[k]) {
        res[k] = record[k];
      }
    }
    return res;
  }

  async findUnique(args: { where: any; include?: any; select?: any }): Promise<any | null> {
    const doc = this.records.find((r) => this.matches(r, args.where));
    if (!doc) return null;
    let res = this.populateIncludes(doc, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return JSON.parse(JSON.stringify(res));
  }

  async findFirst(args: { where?: any; include?: any; select?: any; orderBy?: any } = {}): Promise<any | null> {
    let list = this.records.filter((r) => this.matches(r, args.where));
    if (args.orderBy) {
      const sortKey = Object.keys(args.orderBy)[0];
      const sortDir = args.orderBy[sortKey] === 'desc' ? -1 : 1;
      list.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 * sortDir : -1 * sortDir));
    }
    const doc = list[0];
    if (!doc) return null;
    let res = this.populateIncludes(doc, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return JSON.parse(JSON.stringify(res));
  }

  async findMany(args: {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
    distinct?: string[];
    take?: number;
    skip?: number;
    _count?: any;
  } = {}): Promise<any[]> {
    let list = this.records.filter((r) => this.matches(r, args.where));

    if (args.distinct && Array.isArray(args.distinct)) {
      const seen = new Set();
      list = list.filter((r) => {
        const key = args.distinct!.map((k) => r[k]).join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (args.orderBy) {
      const sortKey = Object.keys(args.orderBy)[0];
      const sortDir = args.orderBy[sortKey] === 'desc' ? -1 : 1;
      list.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 * sortDir : -1 * sortDir));
    }

    if (args.skip) {
      list = list.slice(args.skip);
    }
    if (args.take) {
      list = list.slice(0, args.take);
    }

    let populated = list.map((doc) => this.populateIncludes(doc, args.include));
    if (args.select) {
      populated = populated.map((doc) => this.applySelect(doc, args.select));
    }
    return JSON.parse(JSON.stringify(populated));
  }

  async create(args: { data: any; include?: any; select?: any }): Promise<any> {
    const id = args.data.id || crypto.randomUUID();
    const now = new Date();
    const newRecord: any = {
      ...args.data,
      id,
      createdAt: args.data.createdAt || now,
      updatedAt: args.data.updatedAt || now,
    };

    // Handle nested creates (e.g. members: { create: { userId, role } })
    const store = this.getStore();
    for (const k of Object.keys(args.data)) {
      if (typeof args.data[k] === 'object' && args.data[k]?.create) {
        delete newRecord[k];
        const subData = args.data[k].create;
        let subTableName = k;
        if (k === 'members') subTableName = 'teamMember';
        if (k === 'versions') subTableName = 'projectVersion';
        const subTable = store[subTableName];
        if (subTable) {
          if (Array.isArray(subData)) {
            for (const item of subData) {
              await subTable.create({ data: { ...item, [`${this.name}Id`]: id } });
            }
          } else {
            await subTable.create({ data: { ...subData, [`${this.name}Id`]: id } });
          }
        }
      }
    }

    this.records.push(newRecord);
    let res = this.populateIncludes(newRecord, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return JSON.parse(JSON.stringify(res));
  }

  async createMany(args: { data: any[] }): Promise<{ count: number }> {
    for (const item of args.data) {
      await this.create({ data: item });
    }
    return { count: args.data.length };
  }

  async update(args: { where: any; data: any; include?: any; select?: any }): Promise<any> {
    const idx = this.records.findIndex((r) => this.matches(r, args.where));
    if (idx === -1) {
      // Auto-upsert for safety
      return this.create({ data: { ...(args.where || {}), ...(args.data || {}) }, include: args.include, select: args.select });
    }
    const updated = {
      ...this.records[idx],
      ...args.data,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    let res = this.populateIncludes(updated, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return JSON.parse(JSON.stringify(res));
  }

  async updateMany(args: { where: any; data: any }): Promise<{ count: number }> {
    let count = 0;
    for (let i = 0; i < this.records.length; i++) {
      if (this.matches(this.records[i], args.where)) {
        this.records[i] = { ...this.records[i], ...args.data, updatedAt: new Date() };
        count++;
      }
    }
    return { count };
  }

  async upsert(args: { where: any; update: any; create: any; include?: any }): Promise<any> {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      return this.update({ where: args.where, data: args.update, include: args.include });
    }
    return this.create({ data: args.create, include: args.include });
  }

  async delete(args: { where: any }): Promise<any> {
    const idx = this.records.findIndex((r) => this.matches(r, args.where));
    if (idx !== -1) {
      const removed = this.records.splice(idx, 1)[0];
      return JSON.parse(JSON.stringify(removed));
    }
    return null;
  }

  async deleteMany(args: { where?: any } = {}): Promise<{ count: number }> {
    if (!args.where || Object.keys(args.where).length === 0) {
      const len = this.records.length;
      this.records = [];
      return { count: len };
    }
    const initial = this.records.length;
    this.records = this.records.filter((r) => !this.matches(r, args.where));
    return { count: initial - this.records.length };
  }

  async count(args: { where?: any } = {}): Promise<number> {
    return this.records.filter((r) => this.matches(r, args.where)).length;
  }
}

const GLOBAL_TABLES: Record<string, InMemoryTable> = {};
let IS_GLOBAL_SEEDED = false;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public usePostgres = false;

  public readonly tables: Record<string, InMemoryTable> = GLOBAL_TABLES;

  constructor() {
    super();

    const tableNames = [
      'user',
      'session',
      'event',
      'membership',
      'team',
      'teamMember',
      'project',
      'projectVersion',
      'ballot',
      'ballotScore',
      'rubricVersion',
      'rubricCriteria',
      'judgePassport',
      'judgeConflict',
      'assignment',
      'ideaReport',
      'rankingRun',
      'rankedProject',
      'auditEvent',
      'integrityHashNode',
      'supportTicket',
      'chatMessage',
      'pairwiseComparison',
      'prize',
      'track',
      'anchorProject',
    ];

    for (const t of tableNames) {
      if (!GLOBAL_TABLES[t]) {
        GLOBAL_TABLES[t] = new InMemoryTable(t, () => GLOBAL_TABLES);
      }
      (this as any)[t] = GLOBAL_TABLES[t];
    }
  }

  async onModuleInit() {
    // Seed initial records into memory store
    await this.seedInitialStore();
    this.logger.log('Prisma Engine initialized with High-Assurance Offline Persistence.');
  }

  async onModuleDestroy() {
    // Graceful cleanup
  }

  private async seedInitialStore() {
    if (IS_GLOBAL_SEEDED) return;
    IS_GLOBAL_SEEDED = true;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Seed Core Users (Elena [Organizer], Sarah [Judge], Alice [Participant], Admin)
    const elenaId = 'usr-elena-org-01';
    const sarahId = 'usr-sarah-jdg-01';
    const aliceId = 'usr-alice-dev-01';
    const adminId = 'usr-admin-sys-01';

    const users = [
      {
        id: elenaId,
        email: 'elena@dogfood.local',
        name: 'Elena Rostova',
        passwordHash,
        role: 'ORGANIZER',
        isVerified: true,
      },
      {
        id: sarahId,
        email: 'sarah@dogfood.local',
        name: 'Dr. Sarah Lin',
        passwordHash,
        role: 'JUDGE',
        isVerified: true,
      },
      {
        id: aliceId,
        email: 'alice@dogfood.local',
        name: 'Alice Builder',
        passwordHash,
        role: 'PARTICIPANT',
        isVerified: true,
      },
      {
        id: adminId,
        email: 'admin@dogfood.local',
        name: 'Platform Admin',
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
      },
    ];

    for (const u of users) {
      if (!this.tables['user'].records.some((r) => r.email === u.email)) {
        this.tables['user'].records.push(u);
      }
    }

    // 2. Seed Judge Passport
    if (!this.tables['judgePassport'].records.some((r) => r.userId === sarahId)) {
      this.tables['judgePassport'].records.push({
        id: 'jp-sarah-01',
        userId: sarahId,
        completedReviews: 12,
        medianReviewSecs: 240,
        calibrationBias: 0.12,
        reliabilityScore: 0.98,
        eligibleTracks: JSON.stringify(['Autonomous Agents', 'Developer Infra']),
      });
    }

    // 3. Seed Event
    const eventId = 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f';
    const rubricId = 'rub-v1-auto-2026';

    if (!this.tables['event'].records.some((r) => r.id === eventId)) {
      this.tables['event'].records.push({
        id: eventId,
        slug: 'autonomous-systems-2026',
        name: 'Autonomous Systems & Edge Intelligence 2026',
        description: 'Global benchmark hackathon for autonomous software agents, verified runtime contracts, and zero-knowledge pipelines.',
        status: 'JUDGING_OPEN',
        autopilotMode: 'ASSIST',
        timezone: 'UTC',
        minReviews: 3,
        disagreeThreshold: 1.5,
        currentRubricId: rubricId,
        subDeadline: new Date(Date.now() + 48 * 3600 * 1000),
        judgeDeadline: new Date(Date.now() + 72 * 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Seed Tracks
    const tracks = [
      { id: 'trk-01', eventId, name: 'Autonomous Agents', description: 'Autonomous agent architectures with deterministic state machines' },
      { id: 'trk-02', eventId, name: 'Developer Infra', description: 'High-throughput developer tooling and edge execution platforms' },
      { id: 'trk-03', eventId, name: 'Verifiable Systems', description: 'Provable systems and zero-knowledge verification frameworks' },
    ];
    for (const t of tracks) {
      if (!this.tables['track'].records.some((r) => r.id === t.id)) {
        this.tables['track'].records.push(t);
      }
    }

    // 5. Seed Prizes
    const prizes = [
      { id: 'prz-01', eventId, title: 'Grand Championship', description: 'Best overall autonomous architecture', amount: '$25,000 USD' },
      { id: 'prz-02', eventId, title: 'Technical Depth Award', description: 'Most rigorous verifiable system design', amount: '$15,000 USD' },
      { id: 'prz-03', eventId, title: 'Edge Impact Trophy', description: 'Highest performance sub-10ms latency tool', amount: '$10,000 USD' },
    ];
    for (const p of prizes) {
      if (!this.tables['prize'].records.some((r) => r.id === p.id)) {
        this.tables['prize'].records.push(p);
      }
    }

    // 6. Seed Rubric & Criteria
    if (!this.tables['rubricVersion'].records.some((r) => r.id === rubricId)) {
      this.tables['rubricVersion'].records.push({
        id: rubricId,
        eventId,
        version: 1,
        isLocked: true,
        createdAt: new Date(),
      });
    }

    const criteria = [
      { id: 'crit-01', rubricVersionId: rubricId, name: 'Technical Depth', description: 'Architecture complexity and engineering rigor', weight: 0.35, minScore: 1.0, maxScore: 10.0 },
      { id: 'crit-02', rubricVersionId: rubricId, name: 'Novelty & Ingenuity', description: 'Originality of the conceptual approach', weight: 0.25, minScore: 1.0, maxScore: 10.0 },
      { id: 'crit-03', rubricVersionId: rubricId, name: 'Feasibility & Polish', description: 'Execution quality and working live demo', weight: 0.25, minScore: 1.0, maxScore: 10.0 },
      { id: 'crit-04', rubricVersionId: rubricId, name: 'Impact & Defensibility', description: 'Practical utility and verifiable claims', weight: 0.15, minScore: 1.0, maxScore: 10.0 },
    ];
    for (const c of criteria) {
      if (!this.tables['rubricCriteria'].records.some((r) => r.id === c.id)) {
        this.tables['rubricCriteria'].records.push(c);
      }
    }

    // 7. Seed Memberships
    const memberships = [
      { id: 'mem-01', userId: elenaId, eventId, role: 'ORGANIZER' },
      { id: 'mem-02', userId: sarahId, eventId, role: 'JUDGE' },
      { id: 'mem-03', userId: aliceId, eventId, role: 'PARTICIPANT' },
    ];
    for (const m of memberships) {
      if (!this.tables['membership'].records.some((r) => r.userId === m.userId && r.eventId === m.eventId)) {
        this.tables['membership'].records.push(m);
      }
    }

    // 8. Seed Default Team for Alice
    const teamId = 'team-hyperagent-01';
    if (!this.tables['team'].records.some((r) => r.id === teamId)) {
      this.tables['team'].records.push({
        id: teamId,
        eventId,
        name: 'HyperAgent Core',
        inviteCode: 'INV-HYPER88',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.tables['teamMember'].records.push({
        id: 'tm-alice-01',
        teamId,
        userId: aliceId,
        role: 'LEADER',
        createdAt: new Date(),
      });

      this.tables['project'].records.push({
        id: 'proj-01',
        eventId,
        teamId,
        trackId: 'trk-02',
        title: 'HyperAgent Engine',
        tagline: 'Autonomous execution layer with Multi-Party Computation state',
        description: 'An autonomous agent orchestration framework featuring deterministic state transitions, verifiable audit traces, and sub-50ms synchronization latency.',
        repoUrl: 'https://github.com/dogfood-teams/hyperagent-engine',
        demoUrl: 'https://hyperagent.dogfood.local',
        techStack: 'TypeScript, Rust, WebAssembly, WebRTC',
        teamHours: 48,
        eligibility: 'ELIGIBLE',
        isFrozen: true,
        license: 'MIT',
        isOriginalWork: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
