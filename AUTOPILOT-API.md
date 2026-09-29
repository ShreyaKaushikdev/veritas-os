# DOGFOOD OS — Autopilot & Automation API Specification

> **The feature in one line.** An organiser types *"I need to organise a 48-hour AI agent hackathon, 300 hackers, $40k prize pool"* and a complete, correct, reviewable hackathon exists — with every generated value traceable to the sentence that produced it.
>
> **Status.** Design + build spec. Not implemented. Depends on the Phase 0/1/2 prerequisites in [`NOTES.md` §7](./NOTES.md#7-remediation-backlog).
> **Related.** [`SYSTEM-DESIGN.md`](./SYSTEM-DESIGN.md) §6 (state machines), §9 (API design), §18 (evolution). [`ENGINEERING-PRINCIPLES.md`](./ENGINEERING-PRINCIPLES.md) §2 (make illegal states unrepresentable), §5 (purity at the core), §33 (a budget number without a measurement is a wish).

---

## Table of contents

1. [Three defects that block this feature](#1-three-defects-that-block-this-feature)
2. [The core principle: propose → confirm → apply](#2-the-core-principle-propose--confirm--apply)
3. [Data model](#3-data-model)
4. [The extractor: a swappable interface](#4-the-extractor-a-swappable-interface)
5. [DTOs — the first real ones in this codebase](#5-dtos--the-first-real-ones-in-this-codebase)
6. [Endpoints](#6-endpoints)
7. [The apply transaction](#7-the-apply-transaction)
8. [Automation runtime](#8-automation-runtime)
9. [Supporting APIs a real hackathon needs](#9-supporting-apis-a-real-hackathon-needs)
10. [File manifest](#10-file-manifest)
11. [Build order and acceptance tests](#11-build-order-and-acceptance-tests)
12. [Constraints and non-goals](#12-constraints-and-non-goals)

---

## 1. Three defects that block this feature

These must be fixed as part of this work, not before it. Each one silently breaks the feature.

### 1.1 The `ValidationPipe` is a no-op

`apps/api/src/main.ts:17-22` configures a global `ValidationPipe({ whitelist: true, transform: true })`. There are **zero DTO classes and zero `class-validator` imports** anywhere in `apps/api/src` — every controller takes `body: any`.

Without a class carrying validation decorators, `whitelist: true` has no metadata to work from, so it strips nothing and validates nothing. **The pipe gives the appearance of input validation and provides none.** For an endpoint that turns free text into a database write, that is not acceptable — see §5.

### 1.2 `autopilotMode` is decorative

`AutopilotMode` is declared at `common/types.ts:36-40` and `Event.autopilotMode` exists at `schema.prisma:117`. It is written at `events.service.ts:148` and read once for display at `events.service.ts:319`. **Nothing subscribes to it.** Setting the dial to `FULL` changes nothing.

The three modes must be given real semantics before this feature means anything:

| Mode | Semantics |
|---|---|
| `OFF` | No automation. Every lifecycle transition is a manual organiser action. |
| `ASSIST` | Automation **proposes**. Triggers evaluate and create an `AutomationRun` in `PENDING`, awaiting organiser approval. Nothing mutates without a human. |
| `FULL` | Automation **executes** for rules where `requiresApproval = false`. Rules with `requiresApproval = true` still queue — `FULL` never bypasses an irreversible action. |

That last row is deliberate. `FULL` means "don't ask me about reversible things", not "do anything irreversible without me". Publishing results cannot be unattended, because it is the one action that cannot be walked back.

### 1.3 `createEvent` produces an unjudgeable event

`events.service.ts:48-98` creates the `Event`, an `ORGANIZER` `Membership`, and an **empty** `RubricVersion` v1 with no `RubricCriteria`. It never creates `Track`, `Prize`, or `AnchorProject` rows — despite all three tables existing (`schema.prisma:158, 167, 201`).

An event with no criteria cannot accept a meaningful ballot, because `BallotScore` requires a `criteriaId` (`schema.prisma:347-357`). **Today, creating an event produces something that cannot be judged.** The blueprint apply flow is the natural place to fix this, because it is the first flow that knows what the criteria should be.

---

## 2. The core principle: propose → confirm → apply

**Free text must never write to the database directly.**

The existing implementation violates this: `POST /autopilot/synthesize` returns a blueprint and `POST /autopilot/apply` accepts that blueprint **back from the request body** (`database/autopilot.controller.ts:46-77`). Between those two calls the blueprint is client-side and editable by anyone. It is also unauthenticated, and `applyBlueprintToDatabase` writes to a hardcoded UUID and calls `deleteMany({})` on the projects and ballots collections (`:391, 411, 433`).

The correct shape makes the blueprint a **persisted, content-hashed artifact**:

```
  prompt
    │
    ▼
┌─────────────────┐   organizer reviews, edits, confirms
│   BLUEPRINT     │◀──────────────────────────────┐
│  id + specHash  │                               │
│  provenance[]   │─── PATCH /blueprints/:id ─────┘
│  unresolved[]   │
└────────┬────────┘
         │ POST /blueprints/:id/apply   (body carries only confirmations, not config)
         ▼
      EVENT  ── genesis IntegrityHashNode binds specHash
```

Three properties fall out of this that the current design lacks:

| Property | Why it matters here |
|---|---|
| **The apply step cannot be tampered with** | It references a server-side `id`, not a client-supplied body. The spec that gets applied is the spec that was reviewed. |
| **The event's lineage traces to a sentence** | The genesis hash node binds `specHash`. `GET /trust/verify/{eventId}` can therefore answer "was this event configured as described?" — the same guarantee the system already gives for ballots. |
| **It is re-openable** | The organiser can close the tab, come back in an hour, and the blueprint is still there. `POST /autopilot/synthesize` is stateless, so today it is not. |

### 2.1 Provenance — the feature that makes this defensible

Every field in the generated spec carries where it came from:

```json
{ "field": "expectedParticipants", "value": 300, "source": "prompt",
  "evidence": "300 hackers", "defaulted": false, "confidence": 1.0 }
```

`source` is one of `prompt` | `inferred` | `template` | `default`. The UI highlights `defaulted: true` rows and requires an explicit acknowledgement before apply.

**This is the differentiating design decision of the whole feature.** A tool that silently invents configuration is indistinguishable from one that is guessing. Showing the guesses — and making the organiser confirm them — is what turns "the AI made me an event" into "I made an event and I can see exactly what was assumed." That is the same discipline as `THREAT-MODEL.md:37-38`, applied to the interface.

### 2.2 Unresolved — tell the user what you did not understand

```json
"unresolved": [
  { "field": "judgeDeadline",
    "question": "No judging window given. Set to submission close + 30h.",
    "assumed": "2026-10-13T18:00:00Z",
    "blocking": false },
  { "field": "rubric",
    "question": "No judging criteria given. Using the standard 4-criterion technical rubric.",
    "assumed": "rubric-v1-standard",
    "blocking": false }
]
```

`blocking: true` means apply is refused until resolved. Reserve it for things that make the event nonsensical or unsafe to run — a rubric with weights that do not sum to 1.0, a submission deadline before the start date, zero judges invited. Everything else proceeds with a visible assumption.

---

## 3. Data model

Add to `apps/api/prisma/schema.prisma`, matching existing conventions (`@id @default(uuid())`, `@updatedAt`, explicit `onDelete`, `@@index` on every foreign key used for lookup).

```prisma
enum BlueprintStatus {
  DRAFT
  APPLIED
  SUPERSEDED
}

enum FieldSource {
  PROMPT
  INFERRED
  TEMPLATE
  DEFAULT
}

enum AutomationTrigger {
  DEADLINE_REACHED
  REVIEWS_MET
  SIGMA_EXCEEDED
  JUDGE_INACTIVE
  ANOMALY_UNRESOLVED
  MANUAL
}

enum AutomationAction {
  ADVANCE_STATUS
  FREEZE_ALL_PROJECTS
  GENERATE_ASSIGNMENTS
  TARGETED_REVIEW
  FINALIZE_RANKING
  PUBLISH_RESULTS
  REASSIGN_JUDGE_QUEUE
  NOTIFY_AUDIENCE
}

enum RunStatus {
  PENDING
  APPROVED
  RUNNING
  DONE
  FAILED
  REJECTED
}

model Blueprint {
  id          String          @id @default(uuid())
  createdById String
  createdBy   User            @relation(fields: [createdById], references: [id], onDelete: Restrict)
  prompt      String
  inputHash   String
  spec        Json
  specHash    String
  provenance  Json
  unresolved  Json
  status      BlueprintStatus @default(DRAFT)
  eventId     String?         @unique
  event       Event?          @relation(fields: [eventId], references: [id], onDelete: SetNull)
  appliedAt   DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([createdById, status])
  @@index([status, createdAt])
}

model AutomationRule {
  id               String           @id @default(uuid())
  eventId          String
  event            Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  trigger          AutomationTrigger
  action           AutomationAction
  config           Json?
  enabled          Boolean          @default(true)
  requiresApproval Boolean          @default(false)
  lastFiredAt      DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  runs             AutomationRun[]
  @@unique([eventId, trigger, action])
  @@index([eventId, enabled])
}

model AutomationRun {
  id           String         @id @default(uuid())
  eventId      String
  event        Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  ruleId       String?
  rule         AutomationRule? @relation(fields: [ruleId], references: [id], onDelete: SetNull)
  trigger      AutomationTrigger
  action       AutomationAction
  status       RunStatus      @default(PENDING)
  mode         AutopilotMode
  input        Json
  output       Json?
  error        String?
  proposedById String?
  approvedById String?
  rejectedById String?
  startedAt    DateTime?
  finishedAt   DateTime?
  createdAt    DateTime       @default(now())

  @@index([eventId, status])
  @@index([status, createdAt])
}
```

Add to `Event`:

```prisma
  blueprintId      String?
  blueprint        Blueprint?      @relation(fields: [blueprintId], references: [id], onDelete: SetNull)
  startsAt         DateTime?
  expectedParticipants Int?
  judgesPerProject Int             @default(3)
  automationRules  AutomationRule[]
  automationRuns   AutomationRun[]
```

Add to `Track` (ordering and capacity are needed by the gallery and by the organiser UI):

```prisma
  order       Int    @default(0)
  capacity    Int?
```

### 3.1 Design notes on the schema

| Decision | Reasoning |
|---|---|
| `Blueprint.createdBy` is `Restrict` | Same reasoning as `AuditEvent.actor Restrict` (`schema.prisma:401`): a user who authored a configuration must not be deletable while that configuration exists. |
| `Blueprint.event` is `SetNull`, and `Event.blueprintId` is *also* present | **This is redundant and one of them should go.** Keeping both invites drift. Recommended: keep only `Event.blueprintId` (the event points at what created it) and drop the back-relation, OR keep only `Blueprint.eventId`. If both are kept they must be written in the same transaction and asserted equal. Flagged because it is exactly the class of duplication that produced `common/types.ts` and the shadowed `JudgingMongoController`. |
| `@@unique([eventId, trigger, action])` on `AutomationRule` | One rule per trigger+action per event. Prevents an organiser from accidentally registering `DEADLINE_REACHED → ADVANCE_STATUS` twice and double-firing. |
| `AutomationRun.ruleId` is `SetNull` | Deleting a rule must not delete the record of what it did. Same append-only instinct as the audit trail. |
| `AutomationRun` stores `input`/`output` as `Json` | A run must be reproducible after the fact: given `input` and the code version, `output` is derivable. This is the automation equivalent of the `RankingRun` proof (`SYSTEM-DESIGN.md` §7.4). |
| `RunStatus` has no `CANCELLED` | An organiser who does not want a proposal simply disables the rule. `REJECTED` covers a one-off decline. Keeping the enum minimal is worth more than the extra state. |

### 3.2 Pre-existing columns this reuses

Do **not** add these — they already exist and should be used:

| Column | Location | Note |
|---|---|---|
| `Event.regDeadline` | `schema.prisma:119` | Not `registrationDeadline`. Use the existing name. |
| `Event.subDeadline` | `:120` | |
| `Event.freezeDeadline` | `:121` | |
| `Event.judgeDeadline` | `:122` | |
| `Event.minReviews` | `:123` | Default 3. |
| `Event.disagreeThreshold` | `:124` | Default 1.5. |
| `Event.blindReviewMode` | `:126` | Default `false`. |
| `Event.autopilotMode` | `:117` | Default `ASSIST`. |
| `Event.shuffleSeed` | `:127` | **Hardcoded default `"dogfood-entropy-seed-2026"`.** Must be replaced with `crypto.randomBytes` at event creation or assignment order is publicly predictable — `NOTES.md` F-10. |
| `Event.minReviews` / `disagreeThreshold` / `blindReviewMode` | `:123-126` | These are the automation rule *parameters*; store them on the rule's `config` only for overrides, never as a second copy. |

### 3.3 Schema caveats

- `Prize.amount` is `String?` (`schema.prisma:173`), **not** a numeric column. The blueprint must emit a string (`"40000 USD"`). Do not "fix" this to `Int` in this PR — money needs a currency and a scale, and that is a separate migration with its own backfill. Note it in the backlog.
- `AnchorProject.targetScores` is a JSON **string** (`:208`). Serialise carefully.
- `sha256()` in `common/crypto.util.ts:3-5` uses plain `JSON.stringify`, which is **not canonical** — key insertion order changes the hash. `specHash` must use a canonical serialiser (sorted keys, stable number formatting) or the same spec will hash differently across runs, and the genesis node will not verify. Add `canonicalJson()` to `crypto.util.ts` and use it for every hash in this feature. This is the canonicalisation issue flagged in `SYSTEM-DESIGN.md` §7.5.

---

## 4. The extractor: a swappable interface

The prompt→spec step is the only part that should ever change. Isolate it behind an interface so the pipeline can be built and shipped with a deterministic implementation and later given a model without touching anything else.

```ts
// apps/api/src/blueprints/domain/extractor.ts
// Pure. No framework imports. No I/O. No Date.now(). See ENGINEERING-PRINCIPLES §5.

export interface ExtractionContext {
  readonly prompt: string;
  readonly now: Date;              // passed in, never read from the clock
  readonly timezone: string;
  readonly templateId?: string;
}

export interface ExtractedField<T = unknown> {
  readonly field: string;
  readonly value: T;
  readonly source: FieldSource;
  readonly evidence?: string;      // the substring that produced it
  readonly confidence: number;     // 0..1
  readonly defaulted: boolean;
}

export interface UnresolvedQuestion {
  readonly field: string;
  readonly question: string;
  readonly assumed?: unknown;
  readonly blocking: boolean;
}

export interface ExtractionResult {
  readonly spec: EventSpec;
  readonly provenance: ExtractedField[];
  readonly unresolved: UnresolvedQuestion[];
}

export interface SpecExtractor {
  readonly name: string;
  readonly version: string;        // stored on the Blueprint. Bump on any change.
  extract(ctx: ExtractionContext): Promise<ExtractionResult>;
}
```

`version` is not optional bookkeeping. The same prompt must produce the same blueprint for the reproducibility claim to hold, and when the extractor's behaviour changes you need to know which blueprints were produced by which version.

### 4.1 `EventSpec` — the contract between extractor and apply

```ts
export interface EventSpec {
  name: string;
  slug: string;
  description: string;
  domain: string;
  timezone: string;

  startsAt: string;                // ISO-8601 with offset
  regDeadline: string;
  subDeadline: string;
  freezeDeadline: string;
  judgeDeadline: string;

  expectedParticipants?: number;
  judgesPerProject: number;
  minReviews: number;
  disagreeThreshold: number;
  blindReviewMode: boolean;
  autopilotMode: AutopilotMode;

  tracks: TrackSpec[];
  rubric: RubricSpec;
  prizes: PrizeSpec[];
  anchors: AnchorSpec[];
}

export interface TrackSpec { name: string; description: string; order: number; capacity?: number }
export interface PrizeSpec  { title: string; description: string; amount?: string }
export interface AnchorSpec { title: string; description: string; tier: 'WEAK' | 'TYPICAL' | 'STRONG'; targetScores: Record<string, number> }

export interface RubricSpec {
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
    guidance?: string;
  }>;
}
```

### 4.2 Validation invariants — enforced by the extractor, always

These are not advisory. An extractor that returns an invalid `EventSpec` is a bug, and the check must be a pure function so it is unit-testable without a database.

| # | Invariant | Violation |
|---|---|---|
| E1 | `Σ criteria.weight ≈ 1.0` (± 0.01) | `unresolved` entry, `blocking: true` |
| E2 | Every `weight > 0` | reject |
| E3 | Every `minScore < maxScore` | reject |
| E4 | `1 ≤ judgesPerProject ≤ minReviews` | clamp and mark `defaulted` |
| E5 | `startsAt ≤ regDeadline ≤ subDeadline ≤ freezeDeadline ≤ judgeDeadline` | `blocking: true` — an out-of-order event cannot run |
| E6 | `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is unique | `blocking: true`; suggest a slug if taken |
| E7 | `disagreeThreshold > 0` | clamp to 1.5, mark `defaulted` |
| E8 | 1–12 tracks, each name unique within the event | reject |
| E9 | Duration ≤ 30 days | `blocking: true` — longer is a sign the extractor misparsed |
| E10 | Every anchor `tier` has ≥ 1 target score | reject |

E5 and E6 are the two that actually bite in practice, and both should be tested with adversarial prompts.

### 4.3 The deterministic extractor

Start here. It must handle the ~80% of real hackathons, which are described in terms of: **duration, headcount, money, topic, judging style.**

| Signal | Patterns | Default if absent |
|---|---|---|
| Duration | `48h`, `48 hour`, `2-day`, `weekend`, `24 hours`, `3 days` | 48h, `source: DEFAULT` |
| Headcount | `300 hackers`, `for 300 people`, `500 participants` | 100, `DEFAULT` |
| Prize pool | `$40k`, `$40,000`, `40k usd`, `prize pool of 40000` | omit, `DEFAULT` |
| Topic / domain | keyword sets: `ai`/`llm`/`agent`, `zk`/`zero knowledge`, `web3`/`solana`/`defi`, `climate`/`depin`, `infra`/`systems` | `general`, `DEFAULT` |
| Judging style | `blind`, `peer review`, `calibrated`, `anchors` → `blindReviewMode`, `minReviews` | blind on, 3 reviews, `DEFAULT` |
| Timezone | IANA string, or a city lookup table | `UTC`, `DEFAULT` |

The existing `parseAndSynthesize` (`database/autopilot.controller.ts:79-382`) is a reasonable starting sketch for the track/domain keyword sets — the track definitions at `:130-196` are good domain content and worth **porting**, not discarding. What must be discarded: the hardcoded `durationHours = 48` fallbacks that are not marked as defaults, and the entire `applyBlueprintToDatabase` method (`:384-466`), which is a demo that deletes data.

**The distinguishing feature of the new extractor is not better parsing. It is that every value carries `provenance` and every gap produces an `unresolved` entry.** The old one returns the same shape of object with none of the honesty.

### 4.4 Local model extractor (later, optional)

`ExtractedField` maps cleanly onto a structured-output schema, so a local llama.cpp / Qwen model can implement the same interface. Two hard rules when it lands:

1. **It must be swappable without touching apply.** Register by `ExtractedToken` in the DI container; the deterministic extractor is the default and the fallback.
2. **It may never influence scoring, ranking, eligibility, or any published number.** This is `D11` in `ENGINEERING-PRINCIPLES.md`. It fills in configuration that a human then confirms. If the model proposed a weight, that weight is a `DEFAULT`-sourced field requiring acknowledgement — not a `PROMPT`-sourced one — because the model did not hear it from the organiser.

---

## 5. DTOs — the first real ones in this codebase

There are currently no DTO classes and no `class-validator` usage. These are the first, and they matter more than usual here because the endpoint's whole job is turning untrusted text into trusted configuration.

```ts
// apps/api/src/blueprints/dto/create-blueprint.dto.ts
import { IsString, IsOptional, IsBoolean, IsIn, MaxLength, MinLength } from 'class-validator';

export class CreateBlueprintDto {
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  templateId?: string;

  @IsOptional()
  @IsIn(['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Australia/Sydney'])
  timezone?: string;
}
```

```ts
// apps/api/src/blueprints/dto/apply-blueprint.dto.ts
export class ApplyBlueprintDto {
  @IsBoolean()
  @IsOptional()
  confirmDefaults?: boolean;      // must be true if the spec has defaulted:true fields

  @IsOptional()
  @IsISO8601()
  startsAt?: string;              // override the derived start

  @IsOptional()
  @IsString()
  @MaxLength(500)
  idempotencyKey?: string;
}
```

```ts
// apps/api/src/automation/dto/update-automation.dto.ts
export class UpdateAutomationDto {
  @IsIn(['OFF', 'ASSIST', 'FULL'])
  mode: AutopilotMode;

  @IsOptional()
  rules?: Array<{
    @IsIn(['DEADLINE_REACHED','REVIEWS_MET','SIGMA_EXCEEDED','JUDGE_INACTIVE','ANOMALY_UNRESOLVED','MANUAL'])
    trigger: AutomationTrigger;
    @IsIn(['ADVANCE_STATUS','FREEZE_ALL_PROJECTS','GENERATE_ASSIGNMENTS','TARGETED_REVIEW','FINALIZE_RANKING','PUBLISH_RESULTS','REASSIGN_JUDGE_QUEUE','NOTIFY_AUDIENCE'])
    action: AutomationAction;
    @IsBoolean() enabled: boolean;
    @IsBoolean() requiresApproval: boolean;
    @IsOptional() config?: Record<string, unknown>;
  }>;
}
```

Note the `ApplyBlueprintDto` carries **only confirmations, not configuration.** That is the enforcement of §2 at the type level: it is structurally impossible to apply a spec the client altered, because the client has no field to alter it with. Any configuration change goes through `PATCH /blueprints/:id`, which recomputes `specHash` and moves the blueprint out of any `APPLIED` state.

---

## 6. Endpoints

All under the existing `api/v1` prefix and the existing `@Roles` decorator (`common/decorators/roles.decorator.ts`). All require `AuthGuard` + `RolesGuard` with `@Roles(Role.ORGANIZER, Role.ADMIN)` — **except** `preview` and `templates`, which are safe for any authenticated user because they persist nothing.

> **Prerequisite.** These endpoints are only safe once `AuthGuard` fails closed and `@Public()` exists (`NOTES.md` F-2). Do not ship this feature on the current guard.

### 6.1 `GET /api/v1/blueprints/templates`

The four presets currently hardcoded in a controller at `database/autopilot.controller.ts:18-43` become data.

```http
GET /api/v1/blueprints/templates
```

```json
{
  "data": [
    { "id": "ai-agents-solana",
      "title": "48h Solana & Autonomous Agents Hackathon",
      "badge": "Web3 & AI",
      "summary": "48h · 500 hackers · $60,000 · 3 tracks · blind peer evaluation · Elo ranking",
      "prompt": "Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking." }
  ]
}
```

Returning the `prompt` lets a template be a starting point that the organiser edits, rather than a config they cannot change. Storing templates as data (a `Template` table or a JSON resource file loaded at boot) rather than in a controller means they can be edited without a deploy and reviewed in a PR.

### 6.2 `POST /api/v1/blueprints/preview`

Dry run for live typing. **Persists nothing, touches no database.**

```http
POST /api/v1/blueprints/preview
{ "prompt": "48 hour AI agent hackathon, 300 hackers, $40k prize pool, blind judging" }
```

```json
{
  "data": {
    "spec": { "...": "as in §4.1" },
    "provenance": [
      { "field": "spec.durationHours",  "value": 48,    "source": "PROMPT", "evidence": "48 hour",   "defaulted": false, "confidence": 1.0 },
      { "field": "spec.expectedParticipants", "value": 300, "source": "PROMPT", "evidence": "300 hackers", "defaulted": false, "confidence": 1.0 },
      { "field": "spec.prizes[0].amount","value": "40000 USD", "source": "PROMPT", "evidence": "$40k prize pool", "defaulted": false, "confidence": 0.95 },
      { "field": "spec.blindReviewMode", "value": true,  "source": "PROMPT", "evidence": "blind judging", "defaulted": false, "confidence": 1.0 },
      { "field": "spec.tracks",          "value": 3,     "source": "INFERRED", "evidence": "AI agent", "defaulted": true,  "confidence": 0.6 },
      { "field": "spec.judgesPerProject","value": 3,     "source": "DEFAULT", "evidence": null,        "defaulted": true,  "confidence": 1.0 },
      { "field": "spec.disagreeThreshold","value": 1.5,  "source": "DEFAULT", "evidence": null,        "defaulted": true,  "confidence": 1.0 }
    ],
    "unresolved": [
      { "field": "spec.judgeDeadline",
        "question": "No judging window given. Assumed submission close + 30h.",
        "assumed": "2026-10-13T18:00:00Z", "blocking": false },
      { "field": "spec.rubric",
        "question": "No criteria given. Using the standard 4-criterion technical rubric.",
        "assumed": "rubric-standard-v1", "blocking": false }
    ],
    "validation": { "ok": true, "violations": [] },
    "extractor": { "name": "deterministic", "version": "1.0.0" }
  }
}
```

Include `extractor.version` in the response. It makes a behaviour change explainable after the fact: "this blueprint was produced by extractor 1.0.0, before the duration regex was fixed."

### 6.3 `POST /api/v1/blueprints`

Persists. Returns an id and a hash.

```http
POST /api/v1/blueprints
{ "prompt": "...", "templateId": "ai-agents-solana", "timezone": "Asia/Kolkata" }
```

```json
{
  "data": {
    "id": "7c1f...",
    "status": "DRAFT",
    "inputHash": "sha256:9ab4...",
    "specHash": "sha256:a3f2...",
    "spec": { "...": "..." },
    "provenance": [ "..." ],
    "unresolved": [ "..." ],
    "extractor": { "name": "deterministic", "version": "1.0.0" },
    "hasDefaultedFields": true,
    "links": {
      "self": "/api/v1/blueprints/7c1f...",
      "apply": "/api/v1/blueprints/7c1f.../apply",
      "event": null
    }
  }
}
```

`hasDefaultedFields` is a convenience flag so the UI does not have to scan `provenance`. The server still checks the real array.

### 6.4 `GET /api/v1/blueprints/:id`

Returns the blueprint plus, if applied, the event id. Scoped to `createdById` — one organiser must not be able to read or apply another's draft. (A second read-only organiser on the same event may need access; that is a membership question, resolve it when the multi-organiser work happens, and default to creator-only.)

### 6.5 `PATCH /api/v1/blueprints/:id`

```http
PATCH /api/v1/blueprints/7c1f...
{ "spec": { "tracks": [ "..." ], "judgesPerProject": 4 } }
```

Behaviour:
- Deep-merges into the stored spec.
- **Re-runs every §4.2 invariant.** A PATCH is the most likely way to produce an invalid spec, so validation is mandatory here and not optional.
- Recomputes `specHash` with `canonicalJson()`.
- Adds a `provenance` row per changed field: `{ source: "INFERRED", evidence: "organizer edit", defaulted: false }` — a human edit is *not* a default and must not be shown as one.
- If `status === APPLIED`, returns `409`. Applied blueprints are immutable; changes go through a new blueprint or `PATCH /events/:id` directly. This is the immutability guarantee that makes the genesis hash node meaningful.

A JSON-merge-patch endpoint is sufficient. Do not build a full JSON-Patch (RFC 6902) implementation — there is no consumer that needs it, and `ENGINEERING-PRINCIPLES.md` §9 says do not build for a case that will not arrive.

### 6.6 `POST /api/v1/blueprints/:id/apply`

The commit step. See §7 for the transaction.

```http
POST /api/v1/blueprints/7c1f.../apply
{ "confirmDefaults": true, "startsAt": "2026-10-10T09:00:00Z", "idempotencyKey": "..." }
```

`201`:
```json
{
  "data": {
    "blueprintId": "7c1f...",
    "eventId": "b8a1...",
    "slug": "ai-agent-hackathon",
    "created": {
      "tracks": 3, "prizes": 1, "rubricVersions": 1, "rubricCriteria": 4,
      "anchors": 3, "memberships": 1, "auditEvents": 13, "hashNodes": 1
    },
    "genesisHash": "sha256:5e91...",
    "nextState": "DRAFT",
    "links": { "event": "/api/v1/events/b8a1...", "commandCenter": "/api/v1/events/b8a1.../command-center" }
  }
}
```

Error cases:

| Condition | Status | Body |
|---|---|---|
| `hasDefaultedFields && !confirmDefaults` | `422` | `{ error: { code: 'DEFAULTS_UNCONFIRMED', details: [ { field, value } ] } }` |
| Any `unresolved[].blocking === true` | `422` | `{ error: { code: 'BLOCKING_UNRESOLVED', details: [...] } }` |
| Blueprint already applied | `409` | `{ error: { code: 'BLUEPRINT_ALREADY_APPLIED' } }` |
| Slug taken | `409` | `{ error: { code: 'SLUG_TAKEN', details: { suggested: 'ai-agent-hackathon-2' } } }` |
| Not the creator | `403` | |
| Reused `idempotencyKey` with a different body | `422` | |
| Reused `idempotencyKey` with the same body | `201` | the original response, no re-execution |

### 6.7 Endpoint summary

| Method | Path | Auth | Persists | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/blueprints/templates` | any auth | no | Preset library as data |
| `POST` | `/api/v1/blueprints/preview` | any auth | no | Dry run for live typing |
| `POST` | `/api/v1/blueprints` | `ORGANIZER` | yes | Generate and persist |
| `GET` | `/api/v1/blueprints/:id` | creator | no | Read |
| `PATCH` | `/api/v1/blueprints/:id` | creator | yes | Edit, re-validate, re-hash |
| `POST` | `/api/v1/blueprints/:id/apply` | `ORGANIZER` | yes | Commit → `Event` |
| `GET` | `/api/v1/events/:id/blueprint` | any member | no | Which blueprint made this event |
| `GET` | `/api/v1/events/:id/automation` | `ORGANIZER` | no | Rules + next fire time |
| `PATCH` | `/api/v1/events/:id/automation` | `ORGANIZER` | yes | Set mode + rules |
| `POST` | `/api/v1/events/:id/automation/preview` | `ORGANIZER` | no | "At 14:00 Sat this fires X" |
| `GET` | `/api/v1/events/:id/automation/runs` | `ORGANIZER` | no | Execution log |
| `POST` | `/api/v1/events/:id/automation/runs/:runId/approve` | `ORGANIZER` | yes | Human-in-the-loop gate |
| `POST` | `/api/v1/events/:id/automation/runs/:runId/reject` | `ORGANIZER` | yes | Decline a proposal |

---

## 7. The apply transaction

One `prisma.$transaction`. Every write below, or none.

```
$transaction(async (tx) => {
  1  re-read blueprint, assert status === DRAFT, assert createdById === caller
  2  re-run all §4.2 invariants                    // never trust a stored "valid" flag
  3  assert idempotencyKey unused, or return the stored response
  4  assert slug free

  5  Event.create({
       name, slug, description, timezone,
       status: DRAFT,
       autopilotMode: spec.autopilotMode,
       regDeadline, subDeadline, freezeDeadline, judgeDeadline,
       startsAt, expectedParticipants,
       judgesPerProject, minReviews, disagreeThreshold, blindReviewMode,
       shuffleSeed: crypto.randomBytes(16).toString('hex'),   // NOT the schema default
       blueprintId,
     })

  6  Membership.create({ userId: creator, eventId, role: ORGANIZER })

  7  RubricVersion.create({ eventId, version: 1, isLocked: false })
  8  RubricVersion → RubricCriteria.createMany(spec.rubric.criteria)
  9  Event.update({ currentRubricId: rubricVersion.id })

 10  Track.createMany(spec.tracks)
 11  Prize.createMany(spec.prizes)
 12  AnchorProject.createMany(spec.anchors)

 13  IntegrityHashNode.create({                    // GENESIS
       eventId, nodeType: 'BLUEPRINT_GENESIS',
       previousHash: '0'.repeat(64),
       payload: canonicalJson({ blueprintId, specHash, prompt: sha256(prompt) }),
       resourceId: blueprintId,
     })

 14  AuditEvent.create × N — one per created resource group, all actorId = creator
 15  AutomationRule.createMany(default rules for this event, from the autopilot mode)

 16  Blueprint.update({ status: APPLIED, eventId, appliedAt })
 17  record idempotencyKey → response
})
```

### 7.1 Non-negotiable details

| # | Rule | Why |
|---|---|---|
| A1 | **`shuffleSeed` is `crypto.randomBytes(16)`, never the schema default.** | `schema.prisma:127` hardcodes `"dogfood-entropy-seed-2026"`. Anyone who reads the source can predict the judge assignment order. `NOTES.md` F-10. |
| A2 | The genesis node is in the **same transaction** as the `Event`. | An event with no chain head is corrupt state. A `GET /trust/verify/{eventId}` that walks from genesis must find one. |
| A3 | `payload` uses `canonicalJson()`, not `JSON.stringify`. | `crypto.util.ts:3-5` is order-dependent. Non-canonical hashing means the genesis node fails to verify after any key reordering. |
| A4 | Re-validate invariants inside the transaction (step 2). | A stored `valid: true` from a PATCH five minutes ago is a claim, not a fact. |
| A5 | `isLocked: false` on the created rubric. | The rubric is locked by the `RUBRIC_LOCKED` automation rule or a manual action, **not** at creation. Locking at creation would make the organiser's chance to edit it zero, and `Ballot.rubricVersionId` is `Restrict` (`schema.prisma:329`) so a locked version can never be changed. |
| A6 | Seed anchors with `tier` and `targetScores`. | `AnchorProject.targetScores` is a JSON **string** (`:208`). Serialise explicitly. |
| A7 | Default rules are created from the mode. | An event in `ASSIST` with no rules is a dial that does nothing — exactly the current defect. |
| A8 | `expectations` are seeded as a *proposal*, never an execution. | Creating an event must not advance its state. `nextState` is always `DRAFT`. |

---

## 8. Automation runtime

### 8.1 Default rules created by apply

| Trigger | Action | `requiresApproval` | Rationale |
|---|---|---|---|
| `regDeadline` reached | `ADVANCE_STATUS → REGISTRATION_OPEN` | `false` | Time-based, reversible (you can close registration again) |
| `subDeadline` reached | `ADVANCE_STATUS → SUBMISSION_OPEN` | `false` | Same |
| `freezeDeadline` reached | `FREEZE_ALL_PROJECTS` | `false` | The deadline *is* the agreement. Delaying it because a human was asleep is worse than freezing on time. |
| `freezeDeadline` reached | `ADVANCE_STATUS → SUBMISSION_FROZEN` | `false` | Idempotent with the above |
| `JUDGING_OPEN` entered | `GENERATE_ASSIGNMENTS` | `false` | Deterministic from `shuffleSeed` |
| `SIGMA_EXCEEDED` | `TARGETED_REVIEW` | `false` | Time-sensitive; a judge is waiting |
| `minReviews` met for all | `FINALIZE_RANKING` | **`true`** | Ranking finalisation is the point of no return for scoring |
| `minReviews` met for all | `ADVANCE_STATUS → RESULTS_FINALIZED` | **`true`** | |
| ranking finalized | `PUBLISH_RESULTS` | **`true`** | **Irreversible. Never unattended, in any mode.** |
| judge inactive 72h | `REASSIGN_JUDGE_QUEUE` | **`true`** | Affects a real person's workload |
| 24h before any deadline | `NOTIFY_AUDIENCE` | `false` | Cheap, and missing it is worse |
| `ANOMALY_UNRESOLVED` for 48h | `MANUAL → ADVANCE_STATUS` | **`true`** | Surfaces a stuck event instead of letting it rot |

`PUBLISH_RESULTS` requiring approval in `FULL` mode is the single most important row. See §1.2.

### 8.2 Trigger evaluation

Triggers are evaluated by a scheduler tick, not by a cron per event. One tick every 30 seconds:

```
every 30s:
  for each event where status is active and autopilotMode != OFF:
    for each enabled rule on that event:
      if lastFiredAt is within the rule's cooldown: skip
      if trigger.evaluate(event) is false: continue

      proposed = action.dryRun(event)          // never mutate during evaluation

      if mode == FULL and not rule.requiresApproval:
        AutomationRun.create({ status: RUNNING, ... })
        action.execute(event)                  // in a transaction
        AutomationRun.update({ status: DONE, output })
      else:
        AutomationRun.create({ status: PENDING, input: proposed })
        // ASSIST, or FULL with requiresApproval
```

Four rules for the evaluator:

1. **`dryRun` must be pure and must not mutate.** It is the same computation `execute` will do, minus the writes — so the proposal shown to the organiser is exactly what will happen. This is what makes "approve" meaningful rather than a guess.
2. **Cooldown per rule.** Without it, a rule whose condition stays true re-fires every tick. `lastFiredAt` plus a per-trigger minimum interval (`DEADLINE_REACHED`: once; `SIGMA_EXCEEDED`: once per project; `JUDGE_INACTIVE`: once per judge per event).
3. **De-duplicate proposals.** If a `PENDING` run already exists for the same `(eventId, ruleId, input)`, do not create another. Otherwise a stuck `PENDING` run generates a new identical proposal every 30 seconds.
4. **The tick must be safe to run twice.** It is a scan-and-compare over persisted state, and `AutomationRun` needs a `@@unique` on `(eventId, ruleId, status)`-ish key to make double-execution impossible. Simpler: guard each execution on `status == PENDING` → `RUNNING` as a compare-and-swap inside the run's transaction.

### 8.3 `GET /api/v1/events/:id/automation`

```json
{
  "data": {
    "mode": "ASSIST",
    "rules": [
      { "id": "r1", "trigger": "DEADLINE_REACHED", "action": "FREEZE_ALL_PROJECTS",
        "enabled": true, "requiresApproval": false, "lastFiredAt": null,
        "nextEvaluationAt": "2026-10-12T09:00:05Z" }
    ],
    "pendingRuns": 2,
    "scheduler": { "intervalSeconds": 30, "lastTickAt": "2026-10-10T09:00:00Z", "healthy": true }
  }
}
```

`scheduler.healthy` is the visible symptom of §1.2 being fixed. Today the dial changes a column and nothing else; after this, a stale `lastTickAt` tells the organiser the automation is dead.

### 8.4 `POST /api/v1/events/:id/automation/preview`

The dry run, exposed. Answers "what will this event do, and when?" without waiting for the event to happen.

```http
POST /api/v1/events/:id/automation/preview
```

```json
{
  "data": {
    "projected": [
      { "at": "2026-10-10T18:00:05Z", "rule": "DEADLINE_REACHED → REGISTRATION_OPEN",
        "mode": "ASSIST", "willAutoRun": true, "summary": "Opens registration. 0 registered." },
      { "at": "2026-10-12T09:00:05Z", "rule": "DEADLINE_REACHED → FREEZE_ALL_PROJECTS",
        "mode": "ASSIST", "willAutoRun": true, "summary": "Freezes 0 projects (none submitted yet)." },
      { "at": "2026-10-12T09:00:05Z", "rule": "DEADLINE_REACHED → GENERATE_ASSIGNMENTS",
        "mode": "ASSIST", "willAutoRun": false,
        "summary": "BLOCKED — 0 judges invited. Assignment generation will fail." }
    ],
    "blockers": [
      { "code": "NO_JUDGES_INVITED", "message": "0 judges on this event. Invite at least 4 before judging opens.",
        "fix": "POST /api/v1/events/{id}/invitations" }
    ]
  }
}
```

**The `blockers` array is the highest-value output here.** It converts "the automation silently did nothing" into "here is exactly what is missing and here is the endpoint that fixes it." That is the same principle as `unresolved` in §2.2, applied to runtime.

### 8.5 Run approval

```http
POST /api/v1/events/:id/automation/runs/:runId/approve
{ "note": "Checked the σ values, looks right." }
```

Approving executes the action **in a new transaction** and appends an `AuditEvent` with `approvedById` and the note. The `AutomationRun` keeps `input` and gains `output`, so the proposal that was approved and the result that happened are both on record.

A run cannot be approved twice (`409`), cannot be approved after rejection (`409`), and cannot be approved by a user who is not an organiser on that event (`403`). If the event's state changed between proposal and approval such that the action is no longer legal — e.g. it was already published — return `409 STALE_PROPOSAL` and include a fresh projection so the organiser can re-decide with current information.

---

## 9. Supporting APIs a real hackathon needs

The blueprint creates an event. It does not create a hackathon. These are the gaps between "an event row exists" and "a hackathon can run".

### 9.1 Judge invitations — the critical hole

**There is currently no way to add a judge to an event.** No endpoint, no model. `Assignment` generation therefore has nothing to assign to, and `AutomationRule` `GENERATE_ASSIGNMENTS` can never succeed. This is the highest-priority item in this section.

```http
POST   /api/v1/events/:id/invitations          # invite by email, returns tokens
GET    /api/v1/events/:id/invitations          # list: pending / accepted / expired
DELETE /api/v1/events/:id/invitations/:invId   # revoke
POST   /api/v1/invitations/:token/accept       # PUBLIC — judge accepts, role assigned
GET    /api/v1/events/:id/judges               # roster + passport + workload
POST   /api/v1/events/:id/judges/import        # bulk CSV
```

```prisma
model Invitation {
  id          String         @id @default(uuid())
  eventId     String
  event       Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  email       String
  role        Role
  tokenHash   String         // sha256 of the token; the raw token is returned once and never stored
  invitedById String
  status      InviteStatus   @default(PENDING)   // PENDING | ACCEPTED | REVOKED | EXPIRED
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime       @default(now())

  @@unique([eventId, email])
  @@index([eventId, status])
}
```

Notes:
- **Store `tokenHash`, not `token`.** Same reasoning as the session decision (`D3`): a database read must not yield a usable credential. `crypto.util.ts:sha256` is already available.
- `accept` is `@Public()` — it is authenticated by the token in the URL, not by a session. This is the one legitimate public endpoint in the design, and it is public *because* it is unforgeable, not because the guard is off.
- `accept` must create a `User` if absent **with no password** (or a random one) and a `JudgePassport` (`schema.prisma:84-92`) with `calibrationBias: 0.0`, `reliabilityScore: 1.0` — mirroring `auth.service.ts:27-35`. Never let a judge's role come from a request body.
- `@@unique([eventId, email])` makes re-inviting idempotent.

### 9.2 Everything else

| Method | Path | Why |
|---|---|---|
| `GET` | `/api/v1/events/:id/public-page` | The shareable registration page. Public — published events only. This is what "I want to organise a hackathon" produces as an artefact to send people. |
| `POST` | `/api/v1/events/:id/registrations` | Participant self-registration. Creates `Membership` (`@@unique[userId,eventId]` at `:155` makes it idempotent) |
| `POST` | `/api/v1/events/:id/registrations/import` | Bulk CSV for 500-person events |
| `GET` | `/api/v1/events/:id/blueprint` | Which blueprint created this event, with provenance — closes the lineage loop |
| `POST` | `/api/v1/events/:id/clone` | Exists (`events.controller.ts:44-48`). Should clone the **blueprint**, not the raw event, so tracks/rubric/anchors/rules come along |
| `POST` | `/api/v1/events/:id/publishes` | Multi-sig sign-off. `ranking.service.ts` has the primitives; expose them as an endpoint with a `GET /publishes/{id}` status |
| `GET` | `/api/v1/events/:id/schedule` | Human-readable timeline derived from the deadlines. One call, so the web client does not reimplement the arithmetic |

---

## 10. File manifest

### Create

```
apps/api/src/blueprints/
  blueprints.module.ts
  blueprints.controller.ts
  blueprints.service.ts
  domain/
    extractor.ts               # SpecExtractor interface + EventSpec types (§4)
    deterministic-extractor.ts # regex/synonym impl (§4.3)
    validate-spec.ts           # E1–E10 pure invariants (§4.2)
    canonical.ts               # canonicalJson -> move to common/crypto.util.ts
    rubric-presets.ts          # standard criteria sets as data
  dto/
    create-blueprint.dto.ts
    update-blueprint.dto.ts
    apply-blueprint.dto.ts

apps/api/src/automation/
  automation.module.ts
  automation.controller.ts
  automation.service.ts
  automation.scheduler.ts      # the 30s tick (§8.2)
  rules/
    rule.base.ts               # interface: trigger(), dryRun(), execute(), cooldown()
    deadline-rules.ts          # DEADLINE_REACHED x4
    judging-rules.ts           # REVIEWS_MET, SIGMA_EXCEEDED, TARGETED_REVIEW
    publish-rules.ts           # FINALIZE_RANKING, PUBLISH_RESULTS
    attention-rules.ts         # JUDGE_INACTIVE, NOTIFY_AUDIENCE
  dto/
    update-automation.dto.ts
    decide-run.dto.ts

apps/api/src/invitations/
  invitations.module.ts
  invitations.controller.ts
  invitations.service.ts
  dto/issue-invitations.dto.ts

apps/api/src/common/decorators/public.decorator.ts   # @Public() — NOTES.md F-2 prerequisite
apps/api/src/common/pipes/                          # or extend main.ts
apps/api/src/database/migrations/                    # if using Prisma migrate

tests/
  blueprints/
    deterministic-extractor.spec.ts   # pure. Adversarial prompts.
    validate-spec.spec.ts             # E1–E10, one test each
    apply.e2e-spec.ts                 # transaction + idempotency + atomicity
  automation/
    rules.spec.ts
    scheduler.spec.ts                 # double-tick safety, cooldown, dedup
    approvals.e2e-spec.ts
```

### Modify

| File | Change | Risk |
|---|---|---|
| `apps/api/prisma/schema.prisma` | Add `Blueprint`, `AutomationRule`, `AutomationRun`, `Invitation`, 2 enums; add columns to `Event`; add `order`/`capacity` to `Track` | Needs a real migration. `NOTES.md` §5.5 — there is no `migrations/` dir today |
| `apps/api/src/app.module.ts` | Import `BlueprintsModule`, `AutomationModule`, `InvitationsModule` | Also fix the duplicated `PrismaService` provider (`NOTES.md` F-8) |
| `apps/api/src/common/crypto.util.ts` | Add `canonicalJson()`; make `sha256` use it | **Changes every existing hash.** Existing `IntegrityHashNode` rows will fail verification. Either version the hash (`sha256:v2:` prefix) or accept a one-time re-chain. Do not silently break `/verify`. |
| `apps/api/src/common/guards/auth.guard.ts` | Fail closed; honour `@Public()` | **Prerequisite.** Breaks 12 currently-working unauthenticated reads until they are marked `@Public()` |
| `apps/api/src/events/events.service.ts` | `createEvent` should delegate to the blueprint apply path, or be deprecated in favour of it | Two creation paths is how the Mongo/Postgres split happened. Pick one. |
| `apps/api/src/main.ts` | No change needed for the pipe, but add `ValidationPipe({ forbidNonWhitelisted: true, transform: true })` once DTOs exist | `forbidNonWhitelisted` is what makes `whitelist: true` mean anything |
| `apps/web/src/app/organizer/page.tsx` | The organiser UI for blueprints | Only after the API is stable |
| `openapi.yaml` | Regenerate. Do not hand-edit. | `NOTES.md` F-4 |

### Delete

| Path | Why |
|---|---|
| `apps/api/src/database/autopilot.controller.ts` | Superseded entirely. Port the track/domain keyword sets from `:130-196` into `deterministic-extractor.ts` first. Delete `applyBlueprintToDatabase` (`:384-466`) without porting — it is a data-destroying demo. |
| `tests/run-benchmarks.js` B2, B6 | `NOTES.md` F-9. Cannot fail. |

### Keep but do not build on

`apps/api/src/database/dogfood.controller.ts` — fixture stub. `NOTES.md` F-3. If it survives at all it belongs behind `ENABLE_DEMO_ROUTES` in a dev-only module, never in the published spec.

---

## 11. Build order and acceptance tests

### Step 1 — Extractor (pure, no I/O)

No database, no Nest. This is the whole feature's intelligence and it must be testable in milliseconds.

- [ ] `validate-spec.ts` implements E1–E10
- [ ] `deterministic-extractor.ts` with provenance + unresolved
- [ ] `canonicalJson()` added
- [ ] Same prompt → byte-identical spec, 100 runs
- [ ] E5 tested with a prompt that puts deadlines out of order → `blocking: true`
- [ ] E6 tested with a prompt producing an invalid slug → `blocking: true`
- [ ] `"a weekend hackathon"` → 48h, `source: DEFAULT`
- [ ] `"$1.5M prize"` → `"1500000 USD"`, `evidence: "$1.5M"`
- [ ] `"72 hour climate hackathon for 800 people"` → 72h, 800, climate tracks, 3 `provenance` rows
- [ ] **Every defaulted value has a `provenance` row.** A test that walks `spec` and asserts each field appears in `provenance` — this is the property that makes the feature honest, and it is the one most likely to regress
- [ ] Prompts that match nothing → all `DEFAULT`, every one in `provenance`, ≥ 1 `unresolved`

### Step 2 — Blueprint persistence

- [ ] `POST /blueprints/preview` persists nothing (assert DB row count unchanged)
- [ ] `POST /blueprints` → `specHash` stable across identical input
- [ ] `PATCH` re-validates; invalid PATCH → `422`, blueprint unchanged
- [ ] `PATCH` on an `APPLIED` blueprint → `409`
- [ ] `GET /blueprints/:id` by a non-creator → `403`
- [ ] `specHash` changes after PATCH; does not change on a no-op PATCH

### Step 3 — Apply

- [ ] All 17 transaction steps succeed; row counts match `created`
- [ ] **`Event.shuffleSeed` is not the schema default and is 32 hex chars**
- [ ] Genesis `IntegrityHashNode` exists with `previousHash` = 64 zeros
- [ ] `GET /trust/verify/{eventId}` succeeds on a freshly applied event
- [ ] `verify` still succeeds on events that predate this feature (regression — see the `crypto.util.ts` risk)
- [ ] Rollback: force a failure at step 12 → **zero** rows from steps 5–16
- [ ] Same `idempotencyKey` twice → one event, identical response
- [ ] Same key, different body → `422`
- [ ] `confirmDefaults` omitted with defaulted fields → `422 DEFAULTS_UNCONFIRMED`
- [ ] Blocking `unresolved` → `422`
- [ ] Slug collision → `409` with a suggestion
- [ ] Created rubric has ≥ 1 criterion (fixes §1.3) and `isLocked === false`
- [ ] `Track`, `Prize`, `AnchorProject` rows exist and match the spec
- [ ] `AuditEvent` count matches `created.auditEvents`

### Step 4 — Automation runtime

- [ ] `ASSIST` + trigger fires → `PENDING` run, **no state change**
- [ ] `FULL` + `requiresApproval: false` → executes, `DONE`
- [ ] `FULL` + `PUBLISH_RESULTS` (requiresApproval `true`) → `PENDING`, **does not publish**
- [ ] Approve → executes; `approvedById` and `note` recorded
- [ ] Double-approve → `409`; second execution does not occur
- [ ] Reject → `REJECTED`; no execution
- [ ] Stale proposal (event published between propose and approve) → `409 STALE_PROPOSAL` with a fresh projection
- [ ] `dryRun` output equals `execute` output for the same input
- [ ] Two scheduler ticks in the same second → exactly one execution
- [ ] Duplicate `PENDING` suppression: condition stays true for 5 ticks → 1 run, not 5
- [ ] `mode: OFF` → no runs created at all
- [ ] `GET /automation/preview` reports `NO_JUDGES_INVITED` with a `fix` pointer
- [ ] Mode change is audited

### Step 5 — Invitations

- [ ] Invite → token returned once, `tokenHash` stored, raw token not in the DB
- [ ] `accept` is `@Public()` and works without a session
- [ ] Accepting creates `User` + `Membership(JUDGE)` + `JudgePassport`
- [ ] Re-accepting the same token → `409`
- [ ] Expired token → `410`
- [ ] Revoked token → `410`
- [ ] Re-inviting the same email → `409` or idempotent per the `@@unique`

### Step 6 — Contract and CI

- [ ] Every DTO has response `@ApiResponse({ type })` — no `description: ''` bodies
- [ ] `securitySchemes` present; all non-public operations carry `security`
- [ ] CI regenerates `openapi.yaml` and **fails on drift**
- [ ] The old `/autopilot/*` routes are **absent** from the generated spec
- [ ] `typecheck` and `lint` pass
- [ ] The extractor is in the coverage gate at ≥ 90% branch coverage
- [ ] One mutation test: break the E5 check, confirm the suite goes red

---

## 12. Constraints and non-goals

Binding constraints, restated from `SYSTEM-DESIGN.md` §1.3, with what they mean *here specifically*.

| # | Constraint | Consequence for this feature |
|---|---|---|
| C1 | **Air-gapped** | The extractor must be swappable and must work with no network. The deterministic implementation is not a placeholder to be replaced later — it is the shipping default and the fallback if a model ever fails. |
| C2 | **One command** | Nothing in this feature adds a service. If the scheduler needs a queue, use Postgres — `SELECT … FOR UPDATE SKIP LOCKED` is sufficient at this scale and avoids adding Redis, which is already in Compose and read by nothing (`NOTES.md` F-11). |
| C3 | **Verifiable** | The genesis hash node is this feature's central claim. If the blueprint lineage is not in the chain, the feature is a form filler and not part of the product. |
| C4 | **Reproducible** | Same prompt + same extractor version → same `specHash`. This is why `version` is required on the interface. |
| C6 | **Offline judging** | Every automation action is idempotent and re-entrant. The tick can run twice, be interrupted, or resume after a restart. |

### Non-goals

Per `ENGINEERING-PRINCIPLES.md` §9, these are explicitly out of scope and a PR that adds one needs a stronger argument than convenience:

| Not building | Why |
|---|---|
| A general conversation/chat interface for configuring an event | One prompt, one blueprint, one review screen. A conversational loop is unbounded scope for a bounded problem. |
| A plugin system for custom rules | 12 rules cover the domain. A registry is premature. |
| Streaming / SSE token-by-token generation | The deterministic extractor is synchronous and fast. If a local model lands, add it then. |
| Automated judge recruitment from a public directory | Privacy problem, and out of scope. Invitations are explicit. |
| Letting the extractor set `minReviews`, `disagreeThreshold`, or any weight without `defaulted: true` | These are integrity parameters. `D11`: automation configures, humans decide. |
| Multi-tenant / white-label | One event per deployment satisfies C2. |
| Any outbound network call | C1. |

### The one thing to get right

If only one part of this ships, ship **provenance + unresolved + blockers**.

A hackathon organiser typing one sentence and getting a working event is a nice demo. An organiser typing one sentence and seeing *exactly* which six values were assumed, which two questions were not answered, and which one thing will silently fail on Saturday because no judges were invited — that is a product they will trust with their competition, and it is the same standard `THREAT-MODEL.md:37-38` already sets for cryptographic guarantees.

Everything else in this document is plumbing that makes that possible.
