# DOGFOOD OS — System Design

> **Status.** Sections marked **[AS-IS]** describe the current implementation. Sections marked **[TARGET]** describe the design the repository is documented to have and should converge on. [`NOTES.md`](./NOTES.md) holds the evidence and the gap list. Normative engineering rules live in [`ENGINEERING-PRINCIPLES.md`](./ENGINEERING-PRINCIPLES.md).
>
> **Scope.** This document covers the whole system: architecture style, module boundaries, data model, state machines, integrity model, API design, consistency, caching, concurrency, reliability, security, observability, deployment, capacity, testing strategy, and evolution.

---

## Table of Contents

**Part I — Architecture**
1. [System context](#1-system-context)
2. [Architecture style and why](#2-architecture-style-and-why)
3. [Module boundaries](#3-module-boundaries)
4. [Layering and dependency rule](#4-layering-and-dependency-rule)

**Part II — Data**
5. [Data model](#5-data-model)
6. [State machines](#6-state-machines)
7. [Integrity model](#7-integrity-model)
8. [Consistency, transactions, concurrency](#8-consistency-transactions-concurrency)

**Part III — Interfaces**
9. [API design](#9-api-design)
10. [Ranking and scoring algorithms](#10-ranking-and-scoring-algorithms)
11. [Frontend architecture](#11-frontend-architecture)

**Part IV — Quality attributes**
12. [Reliability and failure modes](#12-reliability-and-failure-modes)
13. [Security architecture](#13-security-architecture)
14. [Observability](#14-observability)
15. [Performance and capacity](#15-performance-and-capacity)
16. [Deployment and configuration](#16-deployment-and-configuration)

**Part V — Process**
17. [Testing strategy](#17-testing-strategy)
18. [Evolution path](#18-evolution-path)
19. [Design decision log](#19-design-decision-log)

---

# Part I — Architecture

## 1. System context

DOGFOOD OS runs hackathons: participants submit projects, judges score them against a locked rubric, organizers publish defensible rankings. The differentiating constraint is that **every decision must be explainable and independently verifiable after the fact** — that is what separates it from a spreadsheet.

### 1.1 Actors

| Actor | Description | Trust level |
|---|---|---|
| `VISITOR` | Unauthenticated. Can browse published results only. | Untrusted |
| `PARTICIPANT` | Team lead/member. Submits, sees own feedback. | Low — must never see peer ballots |
| `JUDGE` | Scored against anchors, has a `JudgePassport`. | Medium — must not influence peers |
| `ORGANIZER` | Runs the event, owns rubric and publication. | High |
| `ADMIN` | Platform operator. | Highest |

### 1.2 System context diagram

```
                          ┌──────────────────────────────┐
   Hackathon participants │                              │
   Judges                 │      DOGFOOD OS (air-gapped) │
   Organizers  ───────────▶   single deployable, no      │
   Public visitors        │   external network dependency│
                          └──────────────┬───────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              PostgreSQL 16        Object storage        SMTP sink
              (system of record)   (project artifacts)  (MailHog locally)
```

**[AS-IS] deviation.** The shipped UI calls a MongoDB layer, not this. See `NOTES.md` F-3, F-6.

### 1.3 Design constraints

These are the constraints that make the design decisions in this document inevitable rather than arbitrary.

| # | Constraint | Consequence |
|---|---|---|
| C1 | **Air-gapped.** Must run on a laptop with the network disabled. | No SaaS dependency, no LLM call in any critical path, no CDN, no remote auth provider. Determinism over capability. |
| C2 | **One-command deployment.** `docker compose up`. | Few, well-known components. No orchestrator, no service mesh, no external DB. |
| C3 | **Verifiability.** An organizer must be able to prove results were not tampered with. | Append-only hash chain, immutable ranking snapshots, locked rubric versions. Integrity is a first-class feature, not a logging afterthought. |
| C4 | **Reproducibility.** Ranking must be re-derivable from raw inputs. | No hidden state in the ranking run. Version the algorithm. Store the inputs, not just the output. |
| C5 | **Small-team velocity.** A hackathon team, not a platform team. | Modular monolith, not microservices. Buy, don't build. |
| C6 | **Offline judging.** Judges may be on flaky venue Wi-Fi. | Idempotent writes, resumable sessions, no long-lived state on the client. |

**On C1 + "AI":** the tension between "offline-first" and "AI-assisted" is resolved by making the AI path *optional and non-authoritative*. The deterministic heuristic engine (`intelligence.service.ts:8-44`) is the **only** path that may influence a decision. If a model provider is configured, it may only produce advisory text that is clearly labelled and never enters scoring, ranking, or eligibility. **[TARGET]** — `AI_PROVIDER` should either be implemented behind that advisory-only contract or deleted. It is currently declared in four files and read by none (`NOTES.md` F-11).

---

## 2. Architecture style and why

### 2.1 Chosen: Modular Monolith **[AS-IS]**

One deployable, multiple modules with enforced internal boundaries, a relational source of truth, and a stateless API tier.

**Why not microservices:**

| C1/C2 | Air-gap + one command. A service mesh is a second distributed systems problem to operate on a laptop. |
|---|---|
| C3/C4 | Cross-module invariants (rubric lock binds ballots; publish binds hash chain) want **ACID transactions in one database**. Microservices would force saga/compensation and weaken exactly the guarantees that are the product. |
| C5 | Team of ~4. Microservices multiply the surface area per engineer. |
| — | There is no independent scaling axis. Judges scale with event size, which Postgres handles on one node for realistic hackathon volumes. |

**The honest caveat.** A modular monolith is only real if the boundaries are *enforced*. **[AS-IS]** they are not: `apps/api/src/database/` is a second application layer inside the same process, reaching past every module boundary straight to its own datastore, and it owns 37 routes. That is not a module; it is a monolith inside the monolith. `NOTES.md` Phase 1 removes it.

### 2.2 Layered architecture **[TARGET]**

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION      apps/web — Next.js 14 App Router          │
│                    Server Components for reads, Client for   │
│                    interactive judging console                │
├──────────────────────────────────────────────────────────────┤
│  INTERFACE         Controllers (NestJS)                      │
│                    HTTP concern only: bind, validate,         │
│                    authorise, delegate, serialise             │
│                    MUST NOT contain business logic            │
├──────────────────────────────────────────────────────────────┤
│  APPLICATION       Services (NestJS providers)                │
│                    Use-case orchestration, transaction        │
│                    boundaries, authorisation that depends     │
│                    on domain state                            │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN            Pure functions + value objects             │
│                    Ranking math, hash chain, state machine    │
│                    transitions, weight validation             │
│                    ZERO imports from NestJS, Prisma, or any  │
│                    framework — this is what makes it testable │
├──────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE    Prisma repositories, mail, storage         │
│                    The ONLY layer that knows SQL exists       │
└──────────────────────────────────────────────────────────────┘
```

**The one rule that matters:** dependencies point downward only. The domain layer imports nothing. **[AS-IS]** `ranking.service.ts` and `trust.service.ts` mix domain math with Prisma calls in the same method, which is why the only automated tests for them (`run-benchmarks.js`) have to reach into a live database. Extract the math into pure functions and those tests become fast, hermetic, and actually trustworthy.

### 2.3 Component topology **[AS-IS]**

```
┌────────────────────────────────────────────────────────────────────┐
│ apps/web — Next.js 14 · React Three Fiber · Tailwind               │
│ 9 pages: dashboard gallery judge organizer participant story verify  │
│ ⚠ 8 of 9 hand-roll fetch(); only page.tsx:30 uses lib/api.ts       │
└───────────────────────────────┬────────────────────────────────────┘
                                │ JSON over HTTP, opaque session token
┌───────────────────────────────▼────────────────────────────────────┐
│ apps/api — NestJS 10 · Express                                     │
│                                                                      │
│ ┌── GUARDED (AuthGuard + RolesGuard) ─────────────────────────────┐ │
│ │ auth    events   teams   submissions   judging   ranking        │ │
│ │ intelligence   trust   support   chat                           │ │
│ │                          10 controllers, /api/v1/*               │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌── UNGUARDED ⚠ ─────────────────────────────────────────────────┐ │
│ │ database  projects  judging  trust  dashboard  autopilot        │ │
│ │ dogfood  (7 controllers, 37 routes, MongoDB, zero guards)        │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────┬───────────────────┘
       │ Prisma                                    │ raw mongodb driver
┌──────▼──────────────────┐              ┌────────▼──────────────────┐
│ PostgreSQL 16           │              │ MongoDB  ⚠               │
│ 28 models, 5 enums      │              │ implicit schema, in code  │
│ connect SKIPPED ⚠       │              │ THE DATA SOURCE THE UI    │
│ (prisma.service.ts:16)  │              │ ACTUALLY USES             │
└─────────────────────────┘              └───────────────────────────┘
```

---

## 3. Module boundaries

**[AS-IS]** Eleven guarded domain modules plus the `DatabaseModule`. Boundary rule: *a module may read another module's tables only through that module's service.*

| Module | Owns | Publishes | Must not touch |
|---|---|---|---|
| `auth` | `User`, `Session`, `JudgePassport`, `Membership` | `AuthGuard`, `RolesGuard`, `currentUser` | Domain tables |
| `events` | `Event`, `Track`, `Prize` | `EventService.assertTransition()`, deadline clock | Submissions, judging |
| `teams` | `Team`, `TeamMember` | `assertSingleTeamPerEvent()` | — |
| `submissions` | `Project`, `ProjectVersion` | `freeze()`, `isFrozen()`, content hash | Ranking, judging |
| `judging` | `RubricVersion`, `RubricCriteria`, `AnchorProject`, `Assignment`, `Ballot`, `BallotScore`, `PairwiseComparison`, `JudgeConflict` | `assertRubricLocked()`, assignment generator, recusal | Ranking internals |
| `ranking` | `RankingRun`, `RankedProject` | `preview()`, `publish()`, normalisation, tie-breaks | Raw ballot mutation |
| `trust` | `AuditEvent`, `IntegrityHashNode` | `append()`, `verify()` | Anything — write-only to all other modules |
| `intelligence` | `IdeaReport` | deterministic heuristic engine | Scoring, ranking, eligibility |
| `support` | `SupportTicket` | triage | — |
| `chat` | `ChatMessage` | anti-herding gate | — |

### 3.1 Why `trust` is special

`trust` is the only module other modules **write to** and never read from. `AuditEvent` and `IntegrityHashNode` are append-only from the application's perspective. This is the module that makes C3 real, so its isolation is not stylistic:

- No module may `update` or `delete` an `AuditEvent` or `IntegrityHashNode`.
- `trust` exposes `append()` and `verify()` and nothing else.
- **`AuditEvent.actor` is `Restrict` on delete** (`schema.prisma:401`) — a user cannot be deleted while they are in the audit log. That is a correct and deliberate FK choice.
- **`AuditEvent.event` is `SetNull`** (`schema.prisma:398`). **[TARGET]** This is weaker than it looks: deleting an event orphans its audit trail. Prefer `Restrict`, or a soft-delete `deletedAt` on `Event`.

**[AS-IS] breach.** `apps/api/src/database/projects-mongo.controller.ts:433-490` implements a *second*, independent ledger in Mongo, reachable at `POST /trust/commit` by anyone, and erasable via `POST /database/clear`. The append-only guarantee in `THREAT-MODEL.md:23-31` holds only for the Postgres path and only while nobody touches the Mongo path.

### 3.2 Cross-module interaction rules

1. **No direct foreign-key writes across modules.** `ranking` may not insert a `Ballot`. It reads them.
2. **Events cross via the audit log**, not via method calls. `ranking.publish()` appends to `trust`; it does not call `judging.notify()`.
3. **Domain events are the seam.** Publish `BallotLocked`, `RubricLocked`, `RankingPublished` on an in-process emitter. This is what makes Phase 2 features (notifications, exports, the 3D ceremony) additive rather than invasive — and what would make an out-of-process broker a later, optional step rather than a rewrite.
4. **Circular dependencies are a design failure.** If `a` needs `b` and `b` needs `a`, the shared concept belongs in a third module or in the domain layer.

---

## 4. Layering and dependency rule

```
apps/web/src/lib/api.ts          single HTTP client, one place that knows the base URL
        │  (⚠ AS-IS: bypassed by 8 of 9 pages)
        ▼
apps/api/src/*/*.controller.ts   bind + validate + authorise + delegate
        ▼
apps/api/src/*/*.service.ts      use cases, transaction boundaries
        ▼
apps/api/src/domain/             ⚠ DOES NOT EXIST YET — extract ranking math,
        │                          hash chain, state machine transitions here
        ▼
apps/api/src/*/*.repository.ts   ⚠ DOES NOT EXIST YET — Prisma calls
```

**[TARGET] The repository pattern is not optional here.** Without it, every service both holds business rules and speaks Prisma, which means (a) business rules cannot be unit-tested without a database, (b) `RankingService` cannot be tested against a synthetic ballot set without seeding 120 rows, and (c) the "non-mutating sandbox" invariant (B5) can only be verified by querying a live DB before and after.

---

# Part II — Data

## 5. Data model

### 5.1 Entity relationship **[AS-IS]**

```
User ──1:N──► Session                     JudgePassport (1:1, userId @unique)
 │                                            JudgeConflict ──► User, Project
 ├──1:N──► Membership ──► Event            (@@unique[userId,eventId])
 ├──1:N──► TeamMember ──► Team
 ├──1:N──► Assignment ──► Project          (@@unique[projectId,judgeId])
 └──1:N──► Ballot ──► Project              (@@unique[projectId,judgeId,rubricVersionId])

Event ──1:N──► Track                       Team.inviteCode @unique
      ├──1:N──► Prize                      Project.teamId @unique  ← one project per team
      ├──1:N──► RubricVersion ──1:N──► RubricCriteria
      ├──1:N──► AnchorProject
      ├──1:N──► Project ──1:N──► ProjectVersion
      ├──1:N──► RankingRun ──1:N──► RankedProject
      ├──1:N──► IntegrityHashNode          (chain)
      ├──1:N──► SupportTicket
      ├──1:N──► ChatMessage
      └──1:N──► PairwiseComparison
Ballot ──1:N──► BallotScore                (@@unique[ballotId,criteriaId])
```

28 models, 5 enums (`Role`, `EventStatus`, `ProjectEligibility`, `BallotStatus`, `AutopilotMode`). Source: `apps/api/prisma/schema.prisma:1-474`.

### 5.2 Invariants and where they are enforced **[AS-IS]**

This table is the most valuable artifact in the repository. The invariants are correct; the problem is that several are enforced *only* in application code and therefore only on one of two data paths.

| # | Invariant | DB enforcement | App enforcement | Gap |
|---|---|---|---|---|
| I1 | A ballot must bind a **locked** rubric version | FK `Restrict` (`schema.prisma:329`); `@@unique[projectId,judgeId,rubricVersionId]` (343) | `judging.service.ts` lock check | Lock is app-level — a direct SQL insert bypasses it. **[TARGET]** add a DB trigger or make `isLocked` a separate immutable `RubricVersion` state that cannot be un-set |
| I2 | One team per event per user | `Membership @@unique[userId,eventId]` (151) | `teams.service.ts:9-46` | ✅ double-enforced |
| I3 | One project per team | `Project.teamId @unique` (237) | — | ✅ |
| I4 | Frozen submissions are immutable | `isFrozen` (250) | `submissions.service.ts:130` | **App-level only.** Mongo `POST /projects` accepts unfrozen work freely (`projects-mongo.controller.ts:67`) |
| I5 | Audit log is append-only | `actor Restrict` (401) | — | **`event SetNull` (398) allows orphaning.** Mongo ledger is fully mutable |
| I6 | Chain is append-only | — | `trust.service.ts` verify | **App-level only**, and only on Postgres |
| I7 | A judge cannot be assigned to a conflicted project | `JudgeConflict` (97) | `judging.service.ts` recusal | App-level |
| I8 | Ballot scores sum to a valid total | — | service | App-level |
| I9 | Published results are final | `RankingRun.isPublished` (368) | `ranking.service.ts:400-447` | App-level |
| I10 | One ballot score per criterion | `@@unique[ballotId,criteriaId]` (356) | — | ✅ |

**Observation.** 7 of 10 invariants are enforced only in TypeScript. That is acceptable *if and only if* there is exactly one write path. There are two (`NOTES.md` §3), so every app-level invariant is currently optional.

### 5.3 Indexing strategy **[AS-IS]**

Correct and purposeful — every index maps to a real query:

| Index | Serves |
|---|---|
| `Project @@index([eventId, eligibility, isFrozen])` (267) | Ranking input selection — the hot path |
| `Ballot @@index([eventId, projectId, status])` (344) | σ (dispersion) scan across judges for a project |
| `Assignment @@unique([projectId, judgeId])` (318) | Duplicate-assignment prevention during re-issue after recusal |
| `Ballot @@unique([projectId, judgeId, rubricVersionId])` (343) | Idempotent ballot submission |
| `SupportTicket @@index([eventId, status, priority])` (441) | Inbox query |
| `ChatMessage @@index([eventId, projectId])` (454) | Project deliberation thread |
| `PairwiseComparison @@index([eventId, judgeId])` (473) | Judge's own comparison history |

**[AS-IS] missing:** no index on `Session.token` beyond the `@unique` (77 — fine), no index on `Session.expiresAt` for cleanup sweeps, no index on `AuditEvent` despite it being append-heavy and read by `/verify`, no index on `IntegrityHashNode(eventId, timestamp)` — which the chain verification traversal (`ARCHITECTURE.md:124-127`, "traverses all N nodes sequentially in UTC order") will need.

### 5.4 Deletion policy **[AS-IS]**

| Relation | Policy | Assessment |
|---|---|---|
| `User` → `Session`, `JudgePassport`, `TeamMember` | `Cascade` | Correct — dependent data has no meaning alone |
| `Event` → `Track`, `Prize`, `Project`, `RubricVersion`, `AnchorProject`, `SupportTicket`, `ChatMessage`, `IntegrityHashNode` | `Cascade` | **Risky.** Cascading an event delete destroys the hash chain that proves the event's results. An event with published results should not be deletable at all |
| `Event` → `AuditEvent` | `SetNull` | Orphaning; see I5 |
| `User` → `AuditEvent` | `Restrict` | **Correct** — a user in the audit log cannot be deleted |
| `Ballot`/`RankingRun` → `RubricVersion` | `Restrict` | **Correct** — a locked rubric referenced by a ballot must not vanish |
| `Track` → `Project` | `SetNull` | Reasonable |

**[TARGET]** Introduce `Event.archivedAt` soft-delete. `ARCHITECTURE.md:86-88` already models an `ARCHIVED` terminal state, but the schema has no way to represent it — the `EventStatus` enum in the schema does not include it. Either add it, or drop it from the diagram.

### 5.5 Schema management **[AS-IS]**

Two problems:

1. **No `migrations/` directory.** `Dockerfile.api:30` runs `npx prisma migrate deploy` against nothing. The README instructs `prisma:push` (`README.md:40`), which is `db push` — it diffs the live schema and mutates it. That is fine for a scratch laptop and unacceptable for anything with a history. Migrations are how you get a reviewable, reversible, ordered record of every schema change.
2. **Two schemas.** `schema.prisma` (474 lines) and `schema.sqlite.prisma` (437 lines), the latter degrading every enum to a bare string. Plus two seeds. **[TARGET]** One schema, one seed, migrations committed.

---

## 6. State machines

State machines are the highest-leverage design tool in this codebase because they make illegal transitions *representable as impossible* rather than as runtime checks someone might forget.

### 6.1 Event lifecycle

```
    DRAFT
      │  publish()
      ▼
  REGISTRATION_OPEN ◄──────────┐  extend (before submission opens)
      │  closeRegistration()   │
      ▼                        │
  SUBMISSION_OPEN ─────────────┘
      │  deadline reached (SERVER clock, not client)
      ▼
  SUBMISSION_FROZEN  ◄─── immutable content hash computed per project
      │  organizer opens judging
      ▼
   JUDGING_OPEN       ◄─── assignments generated, anchors calibrated
      │  minReviews (3) met AND disagreeThreshold (σ 1.5) routing resolved
      ▼
 RESULTS_FINALIZED    ◄─── ranking run finalized, weights locked
      │  publish()
      ▼
  RESULTS_PUBLISHED  ◄─── public gallery + /verify unlocked; LOCKED
      │
      ▼
   ARCHIVED
```

**Rules:**

| From | To | Guard |
|---|---|---|
| `DRAFT` | `REGISTRATION_OPEN` | `ORGANIZER`/`ADMIN` |
| `REGISTRATION_OPEN` | `SUBMISSION_OPEN` | `ORGANIZER`; server deadline |
| `SUBMISSION_OPEN` | `SUBMISSION_FROZEN` | Server clock ≥ `freezeDeadline`. **Client time is never trusted** |
| `SUBMISSION_FROZEN` | `JUDGING_OPEN` | All eligible projects frozen; rubric locked |
| `JUDGING_OPEN` | `RESULTS_FINALIZED` | `minReviews` met per project; no unresolved σ anomaly |
| `RESULTS_FINALIZED` | `RESULTS_PUBLISHED` | `ORGANIZER`; appends hash node |
| `RESULTS_PUBLISHED` | *anything else* | **Rejected — `409 Conflict`** |

**No backward transitions except `REGISTRATION_OPEN → SUBMISSION_OPEN` extension.** A published event is terminal (`THREAT-MODEL.md:31` expects `409`, which is correct).

`ARCHITECTURE.md:2.1` omits the backward extension arrow; that is a documentation simplification, not a bug.

### 6.2 Submission lifecycle

```
  DRAFT ──submit──► SUBMITTED ──freeze──► FROZEN ──judge──► ELIGIBLE
                      │                    │                └─► DISQUALIFIED
                      │                    │
                      │                    └──correction──► AMENDMENT VERSION
                      │                                      (new ProjectVersion;
                      │                                       frozen content
                      │                                       is NEVER mutated)
                      └──(withdraw)──► WITHDRAWN
```

**The freeze boundary is the single most important design decision in the system.** Before it, a project is a mutable working document. After it, it is evidence. Amendments do not edit frozen content — they append a new `ProjectVersion` (`schema.prisma:270`) with an incremented `versionNumber` and a recorded reason, so the original stays verifiable.

`THREAT-MODEL.md:28` expects `400` for a post-deadline mutation attempt. Correct, and it must be enforced against the **server** clock with no client-supplied timestamp parameter anywhere in the DTO.

### 6.3 Ballot lifecycle

```
  UNASSIGNED ──generate──► ASSIGNED ──open──► IN_PROGRESS ──submit──► SUBMITTED
                                                                      │
                                                          lock + hash  │
                                                                      ▼
                                                                   LOCKED
                                                                      │
                                            organizer override ──────┤
                                                                      ▼
                                                                 REOPENED
                                                                      │
                                                        (reason recorded in AuditEvent)
```

**`REOPENED` is a security-relevant state.** Any override must record `actorId`, `reason`, and the prior hash. An unexplained reopen is indistinguishable from score tampering, and it is the most likely real-world attack on a judging system. `THREAT-MODEL.md` does not cover it — it should.

### 6.4 Rubric lifecycle

```
  DRAFT ──organizer──► ACTIVE(v1) ──first ballot──► LOCKED(v1)
                          │                          │
                          │ (new version)            │ (never unlocked)
                          ▼                          ▼
                       DRAFT(v2) ───────────────► LOCKED(v2)
```

`Ballot.rubricVersionId` is `Restrict` (`schema.prisma:329`) — a ballot can never be re-pointed at a different rubric. Combined with `@@unique[projectId, judgeId, rubricVersionId]`, the consequence is: **once judging starts on v1, v1 is the only rubric that counts.** A rubric change mid-round silently splits the cohort. The design should forbid rubric edits once any ballot exists, not merely discourage them.

### 6.5 Implementing state machines **[TARGET]**

State is currently spread across `Event.status`, `Project.isFrozen` + `eligibility`, `Ballot.status`, and `RubricVersion.isLocked`, with transitions enforced ad hoc inside services. That produces the bug class where `A → C` is possible because nothing knows `B` is required.

**Recommended:** a tiny explicit transition table in the domain layer, dependency-free and exhaustively unit-testable.

```ts
type Transition<S extends string> = { from: S; to: S; guard: (ctx: Ctx) => boolean };

export const EVENT_TRANSITIONS: Transition<EventStatus>[] = [
  { from: 'DRAFT',               to: 'REGISTRATION_OPEN', guard: isOrganizer },
  { from: 'REGISTRATION_OPEN',   to: 'SUBMISSION_OPEN',   guard: isOrganizer },
  { from: 'SUBMISSION_OPEN',     to: 'SUBMISSION_FROZEN', guard: serverPastDeadline },
  { from: 'SUBMISSION_FROZEN',   to: 'JUDGING_OPEN',      guard: rubricLockedAndProjectsFrozen },
  { from: 'JUDGING_OPEN',        to: 'RESULTS_FINALIZED', guard: reviewsMetAndAnomaliesResolved },
  { from: 'RESULTS_FINALIZED',   to: 'RESULTS_PUBLISHED', guard: isOrganizer },
  { from: 'RESULTS_PUBLISHED',   to: 'ARCHIVED',          guard: isOrganizer },
];
```

Benefits that matter for this project specifically:

- One exhaustive test asserts that every `(from, to)` pair not in the table is rejected. That is a *complete* proof of the state machine, which is exactly the kind of claim C3 demands and exactly what hand-written `if` statements cannot give you.
- No framework dependency, so the domain layer stays pure.
- Adding a state becomes a one-line table change plus a test, not an archaeology exercise.

---

## 7. Integrity model

This is the product's differentiator and the strongest design thinking in the repository. C3 requires that tampering be *detectable*, and `THREAT-MODEL.md:37-38` states the boundary honestly — local hashing proves the event sequence was not silently modified, not that the host is trustworthy. Keep that note; it is the right epistemic framing and most projects get this wrong by overclaiming.

### 7.1 Hash chain **[AS-IS]**

```
CurrentHash(n) = SHA-256( PreviousHash(n-1) ‖ PayloadJson(n) ‖ ResourceId(n) ‖ Timestamp(n) )

Genesis: 0000...0000  (64 zeros)
```

Node types and what each binds:

| Node | Binds | Protects against |
|---|---|---|
| Submission freeze | team payload, repo URL, demo URL, timestamp | Editing a submission after the deadline |
| Ballot submit | judge, weighted scores, feedback hash, timestamp | Editing or deleting a score after the fact |
| Ranking run | rubric version, normalisation algorithm, input ballot IDs, output order | Quietly re-running ranking with different weights |
| Publication | finalized snapshot hash | Withdrawing or altering published results |

**Why a chain and not per-record hashes.** A per-record hash proves one record is intact. A chain proves *ordering and completeness*: you cannot delete node 7 without breaking the link from node 8, and you cannot insert a node without recomputing every hash after it. Deletion and reordering — the two attacks that matter most for a results system — are exactly what a chain catches and a bare hash does not.

**Verification** (`trust.service.ts:9-53+`): traverse nodes in UTC order, assert `node[n].previousHash == node[n-1].currentHash`, re-hash each payload and assert equality with `node.currentHash`. `ARCHITECTURE.md:127` claims < 1000 ms for 40 projects / 120 ballots. **[TARGET]** That is a reasonable target but nothing measures it — `NOTES.md` F-9. Make it a test with a budget assertion.

### 7.2 What the chain does not prove

State this in the product, not just the docs. The chain proves **non-modification of the recorded sequence**. It does **not** prove:

| Not proven | Why | What would be needed |
|---|---|---|
| The host is trustworthy | Anyone with DB write access can recompute the entire chain | External anchoring: periodically publish the chain head to an append-only public record, or have multiple judges co-sign |
| Ballots were cast in good faith | A judge can score badly; the chain only proves the score was not changed after casting | Judge identity attestation; calibration records; the anchor projects |
| No ballot was fabricated | An attacker with a stolen session can cast a legitimate-looking ballot | Per-judge ballot receipts the judge can verify independently |
| The inputs were complete | A chain over a partial set of ballots is internally consistent | `minReviews` enforcement at the DB level; completeness proofs |

The last row matters most. A chain proves the sequence you kept is intact, not that it is complete. "Prove the ledger is unaltered" and "prove the ledger is complete" are different claims and the system currently only makes the first.

### 7.3 Multi-party sign-off **[AS-IS]**

`ranking.service.ts` supports sign-off with multiple parties. This is the right instinct: an organizer alone can publish anything, and requiring ≥2 distinct signers converts "trust the operator" into "verify the signatures". **[TARGET]** Push further — sign the *chain head*, not the result, so a sign-off covers the whole history, and derive the sign-off from distinct humans with distinct credentials rather than distinct roles (an organizer with two accounts is not two parties).

### 7.4 Machine-checkable proofs **[TARGET]**

For a results system, a **reproducibility proof** is stronger than a hash chain and cheap to build:

```
RankingProof = {
  rubricVersionId, rubricWeights,
  normalisation: { method, parameters },
  inputBallotIds: [...],        // sorted, content-addressed
  algorithmVersion,            // explicit, not implied by deploy
  output: [...],               // ordered ranked projects
  runHash
}
```

Anyone can recompute `output` from `inputBallotIds` + the declared parameters and diff it against the stored result. No chain traversal required, no trust in the operator, and it doubles as a regression test. `RankingRun` (`schema.prisma:359-375`) already has `method`, `parameters`, and `runHash` — the ingredients are there; the proof is not being emitted.

A Merkle root over the ranked output (a Merkle tree, not a linear chain) would additionally let you prove *"project X ranked 3rd"* in O(log n) without revealing the other 39 results. That is the right primitive for a pre-publication leaderboard that is provably fair without being public.

### 7.5 The 3D visualisation is not a proof

`acceptance-report.txt:23-24,27` and the `zkProofStatus: "GROTH16_VERIFIED_1.4MS"` field in `benchmarks/receipts/receipt-2026-09-24T18-12-39-629Z.json` are a real problem. `apps/web/src/components/3d/*` are React Three Fiber scenes. No Groth16, ZK, or any cryptographic library beyond Node's `crypto` appears in any `package.json`. A receipt asserting a verified ZK proof that no code produces is a fabricated artifact, and fabricated artifacts destroy the credibility of the receipts that *are* real.

Remove the field. If ZK is a goal, implement it and report the proof size and verification time you actually measure. **`THREAT-MODEL.md:37-38` is the standard to hold this to.**

---

## 8. Consistency, transactions, concurrency

### 8.1 Consistency model **[TARGET]**

**Strong consistency for the record. Eventual consistency for everything derived.**

| Data | Model | Why |
|---|---|---|
| Ballots, rubric versions, frozen projects, ranking runs, hash nodes, audit events | **ACID, serialisable where it matters** | These are the evidence. A partially-visible ballot or a ranking computed over a moving target is a correctness bug, not a latency bug |
| `IdeaReport` heuristics | Eventual | Advisory, recomputable, never authoritative |
| Dashboard aggregates, command-center metrics, gallery listings | Eventual + cached | Read-heavy, derivable, cheap to recompute |
| 3D ceremony assets, exports | Eventual, precomputed | Large, non-interactive, cacheable |
| Notifications | At-least-once, idempotent handlers | Duplicates are acceptable; loss is not |

**Rule: nothing derived may ever be the input to an authoritative decision.** If the ranking depends on a dashboard number, the design is wrong.

### 8.2 Transaction boundaries **[TARGET]**

Every multi-write use case is one transaction. The critical ones:

**Ballot submission** — one transaction:
1. Assert the rubric is locked and the assignment is `ASSIGNED`/`IN_PROGRESS`.
2. Assert the judge has no active `JudgeConflict` with the project.
3. Upsert all `BallotScore` rows (one per criterion) and the `Ballot` total.
4. Set `Ballot.status = LOCKED`.
5. Append an `IntegrityHashNode` binding judge + scores + feedback hash.
6. Append an `AuditEvent`.

The hash node and the ballot **must** commit together. If the ballot commits and the node does not, the chain has a silent gap and verification cannot distinguish "no ballot" from "deleted ballot" — which is the entire guarantee.

**Ranking publication** — one transaction:
1. Re-assert the event is in `RESULTS_FINALIZED`.
2. Materialise `RankingRun` + all `RankedProject` rows.
3. Set `RankingRun.isFinalized = true`.
4. Append the ranking-run hash node binding the input ballot IDs and the output ordering.
5. Append the audit event.

Then, in a **separate** transaction, transition to `RESULTS_PUBLISHED` and append the publication node. Two transactions, because publish is the irreversible step and should be separately retryable.

**Submission freeze** — one transaction per project: set `isFrozen`, compute and store `frozenHash`, append the freeze node. A project that is `isFrozen` without a hash node is corrupt state and should fail a health check.

### 8.3 Concurrency control **[TARGET]**

Four distinct races, four distinct mechanisms. Do not use one mechanism for all of them.

| Race | Scenario | Mechanism |
|---|---|---|
| **Double submit** | Judge double-taps save; retry after a timeout | `@@unique[projectId,judgeId,rubricVersionId]` + `upsert` + idempotency key |
| **Two organizers publishing** | Both click publish at once | `SELECT ... FOR UPDATE` on the `Event` row, or an optimistic `version` column with a compare-and-swap |
| **Judge vs. recusal** | Recusal lands while a ballot is in flight | Transactional guard: re-check `JudgeConflict` inside the ballot transaction. Recusal that loses the race must invalidate the ballot, not silently coexist with it |
| **Recusal vs. assignment generation** | Recusal mid-round leaves a project under-assigned | Re-issue loop: on recusal, re-run the assignment generator for affected projects within one transaction, excluding the recused judge. `@@unique[projectId,judgeId]` (318) prevents duplicates |

**[AS-IS] the recusal re-issue path is unverifiable.** The Postgres implementation is in `judging.service.ts`, but the only caller of the Mongo variant (`projects-mongo.controller.ts:334`) is unregistered dead code, and the committed receipt claiming it passed targets a route that does not exist (`NOTES.md` F-9).

### 8.4 Idempotency **[TARGET]**

Offline judging (C6) means retries are the normal case, not the exception. Every mutating endpoint that a client might retry needs:

- An `Idempotency-Key` header, stored with the response for the request's TTL.
- The same key + same body → the stored response, no re-execution.
- The same key + different body → `422 Unprocessable Entity`.

`benchmarks/harness.js:394-395` already sends two identical ballot POSTs, which is the right instinct. Make it an assertion.

### 8.5 Clock **[TARGET]**

`SUBMISSION_OPEN → SUBMISSION_FROZEN` is a **server-authoritative** transition. Never accept a client timestamp in a DTO. `Event.shuffleSeed` (`schema.prisma:123`) exists precisely to make assignment deterministic and replayable — extend the same reasoning to deadlines: store them as UTC instants and compare against the server clock. Note the current default seed is a hardcoded constant, which makes assignment order predictable to anyone who reads the source; randomise per event and persist.

### 8.6 Migration and backfill **[TARGET]**

With no `migrations/` directory (see §5.5), schema change is `db push` — an unreviewed mutation. The rules that follow from having a record:

- Schema changes ship as a committed migration in the same PR as the code that needs it.
- Every migration needs a documented `down`, or an explicit "irreversible, reason: …".
- Backfills run as idempotent, resumable jobs — never inside the migration transaction, because a long backfill holds locks and a failed backfill inside a migration leaves the DB half-migrated.
- Destructive column drops are two-release: release *n* stops writing the column, release *n+1* drops it.

---

# Part III — Interfaces

## 9. API design

### 9.1 Conventions **[AS-IS]**

- Base path `/api/v1`, versioned at the prefix.
- JSON in, JSON out. Session token via `Authorization: Bearer <opaque hex>` (`auth.guard.ts:10` also accepts `x-session-token`).
- Global `ValidationPipe` (`main.ts`) + per-route DTO classes from `class-validator`.
- Swagger UI at `/api/docs`; spec written to root `openapi.yaml` at boot (`main.ts:35-43`).

### 9.2 Resource map **[AS-IS]**

| Prefix | Controller | Guard | Roles |
|---|---|---|---|
| `/api/v1/auth` | `auth` | only `me` | — |
| `/api/v1/events` | `events` | ✅ | `ORGANIZER`/`ADMIN` on mutations |
| `/api/v1/teams` | `teams` | ✅ | — |
| `/api/v1/submissions` | `submissions` | ✅ | — |
| `/api/v1/events/:eventId/judging` | `judging` | ✅ | mixed |
| `/api/v1/events/:eventId/ranking` | `ranking` | ✅ | `ORGANIZER`/`ADMIN` on mutations |
| `/api/v1/events/:eventId/idea-reports` | `intelligence` | ✅ | `PARTICIPANT`/`ORGANIZER`/`ADMIN` |
| `/api/v1/trust` | `trust` | ✅ | `ADMIN`/`ORGANIZER` on audit/export |
| `/api/v1` | `support` | ✅ | — |
| `/api/v1/events/:eventId/chat` | `chat` | ✅ | `JUDGE`/`ORGANIZER`/`ADMIN` |
| `/database`, `/judging`, `/dashboard`, `/projects`, `/trust`, `/autopilot`, root | 7 controllers | **none** | **none** |

**[AS-IS] the contract is a mess, concretely:**

- Root `openapi.yaml` documents `DogfoodController`'s fixture routes (`/gallery` 216, `/submit` 226, `/judge/scores` 235, `/judge/scores/{judgeId}` 249, `/export/csv` 268) as first-class public API.
- `components:` is empty (line 953) — no `securitySchemes`, no response schemas on any of the 84 operations. No codegen, no contract validation.
- `apps/openapi.yaml` is a stale second copy (92 lines behind) that declares a fictional `bearerFormat: JWT` scheme (870-874) for what are opaque hex tokens.
- The spec is a **build artifact written at runtime** and committed to git, so every local start rewrites a tracked file.
- `benchmarks/BENCHMARKS.md:5` names this file as the protocol spec and line 488 tells contributors to lint it with Spectral. There is no lint step.

### 9.3 REST conventions **[TARGET]**

| Convention | Rule |
|---|---|
| Plural nouns | `/api/v1/projects`, never `/api/v1/project` |
| No verbs in paths | `POST /api/v1/events/{id}/submissions`, not `/submitProject` |
| Nesting ≤ 2 levels | `/api/v1/events/{eventId}/submissions/{id}` ✅ · `/api/v1/events/{eventId}/judging/ballots/{id}/scores` ❌ → `/api/v1/ballots/{id}/scores` |
| State transitions are sub-resources | `POST /api/v1/events/{id}/transitions` with `{ to: 'SUBMISSION_FROZEN' }` — one auditable endpoint instead of six verbs |
| Correct status codes | `200` read · `201` create (+`Location`) · `202` accepted async · `204` delete · `400` malformed · `401` no/invalid credentials · `403` authenticated but not permitted · `404` absent **or invisible by design** · `409` state conflict · `422` semantically invalid · `429` rate limited |
| Errors are typed | `{ error: { code, message, details?, traceId } }` — `code` is stable and machine-readable, `message` is for humans |
| Pagination | Cursor-based (`?after=&limit=`) — offset pagination breaks under concurrent writes, which matters for a live gallery |
| Every list is filterable and sortable | `?status=&track=&sort=rank` |
| Every mutating request takes an idempotency key | See §8.4 |

### 9.4 Response envelope **[TARGET]**

```
{ "data": ..., "meta": { "requestId", "nextCursor"?, "warnings": [] } }
```

Consistent envelopes mean the client never guesses whether it got `{events: []}` or `[]` — a bug class that is live right now (`api.ts:217` expects `{events}` while `events.service.ts:10-11` returns a bare array; `api.ts:313` expects `{projects}` while `submissions.service.ts:222-241` returns a bare array).

### 9.5 Public API **[TARGET]**

Everything on this list must be reachable **without** a token, and everything else must require one:

```
GET  /api/v1/health                          liveness
GET  /api/v1/events                          published events
GET  /api/v1/events/{slug}                   event detail
GET  /api/v1/events/{id}/gallery             published, eligible projects
GET  /api/v1/events/{id}/ranking/published   public results
GET  /api/v1/events/{id}/ranking/normalization-proof   reproducibility proof
GET  /api/v1/trust/verify/{eventId}          chain verification
GET  /api/v1/trust/receipts/{hash}           single receipt
```

Everything else requires a valid session. **An explicit allowlist, not a deny-everything-and-hope posture** — which is the current state, where 37 routes are open because nobody declared them closed (`NOTES.md` F-2, F-3).

### 9.6 API versioning **[TARGET]**

URL prefix (`/api/v1`) is right. Add:

- **Additive-only within a major.** New optional fields, new endpoints. Never remove a field, never change a type, never change a meaning.
- **Deprecation headers** (`Deprecation: true`, `Sunset: <date>`, `Link: …; rel="deprecation"`) at least one release before removal.
- **Parallel support.** `/v1` and `/v2` run simultaneously; the client migrates; then `/v1` is retired.
- **Contract enforcement in CI**: generate the spec in a test, diff it against the committed file, and fail the build on drift. A spec that is only ever written by the running app cannot detect contract regressions.

### 9.7 Rate limiting **[TARGET]**

Differentiate by cost and by actor, not a flat per-IP bucket:

| Endpoint class | Limit | Why |
|---|---|---|
| `/auth/*` | 5/min per IP + per-email | Credential stuffing, account enumeration |
| Mutation endpoints | 60/min per user | Abuse |
| Read endpoints | 600/min per user | Normal UI polling |
| `/trust/verify` | 30/min | Verification is O(chain) — it is a DoS vector against yourself |
| Anonymous | Global aggregate ceiling | The real defence is a gateway limit |

`support.controller.ts:8-33` has an in-process token bucket: 5 tickets/hour, per-process, reset on restart, invisible to a second replica. Redis is already in `docker-compose.yml:22-34`; use it, or delete the claim.

---

## 10. Ranking and scoring algorithms

The technical heart. C4 requires reproducibility, which constrains the design far more than accuracy does.

### 10.1 Weighted rubric score **[AS-IS]**

```
criterionScore  = clamp(raw, criteria.minScore, criteria.maxScore)     -- schema 191-192
weightedScore   = Σ (criterionScore × criteria.weight) / Σ criteria.weight
```

`RubricCriteria.weight` defaults to `0.25` (`schema.prisma:190`) — 4 criteria summing to 1.0.

**Normalising by `Σ weight` rather than assuming weights sum to 1.0** is the correct choice: it makes the score well-defined even for a partially-specified or re-weighted rubric, and it means changing weights cannot silently rescale everyone's score. Keep it.

**[TARGET] requirements:**

- Weights are validated at lock time: every weight > 0, `Σ ≈ 1.0` within a declared tolerance. Reject a rubric that does not balance *before* any ballot exists — the whole point of locking is that the formula stops moving.
- `min`/`max` are per criterion, so criteria are comparable before weighting. Good design; enforce it at lock time.
- Missing scores are **not** zero-filled. A criterion the judge skipped is *missing data*, and silently treating it as 0 or as the midpoint distorts the mean. Mark the ballot incomplete, and treat incompleteness as a signal in the anomaly scan (§10.3).

### 10.2 Inter-judge agreement **[AS-IS]**

The system measures dispersion and routes outliers. `Event.disagreeThreshold` defaults to `1.5` (`schema.prisma:120`), and `RankedProject.disagreementFlag` (389) records the outcome.

```
scores(i)   = weighted score from judge i for project p
μ           = mean(scores)
σ           = stddev(scores)            -- sample, n-1
dispersion  = σ / μ                    -- coefficient of variation
flagged     = dispersion ≥ disagreeThreshold
```

**Why a coefficient of variation rather than raw σ.** Raw σ scales with the mean, so a project everyone scores 8.0 ± 0.5 is not meaningfully in disagreement, while a project scored 4.0 ± 2.0 very much is. CV is scale-free. The right choice.

**What CV cannot distinguish**, and this must be documented:

| Situation | CV | Reality |
|---|---|---|
| Judges disagree about quality | high | Genuine disagreement — this is what the threshold is for |
| One judge is harsh **across all projects** | low for that project | **Systematic bias, not disagreement.** CV is computed per project, so a consistently harsh judge looks *fine*. This is the single most dangerous blind spot |
| One judge is harsh **on this project only** | high | Correctly flagged ✅ |
| Rubric is ambiguous | high | Should fix the rubric, not add a judge |
| Anchors were not calibrated | high | The judge's fault or the anchors'? Unknowable from the numbers |

**[TARGET] The fix for row 2 is a two-way dispersion decomposition.** Compute each judge's deviation from their own mean across projects (the judge's personal offset), subtract it, then recompute dispersion on the centred scores. What remains is genuine project-specific disagreement. This is a standard judge-bias correction (mean-centring / "z-score against judge" normalisation) and it directly addresses `JudgePassport.calibrationBias` (`schema.prisma:90`) which is currently written but not used in the maths.

### 10.3 Targeted re-review **[AS-IS]**

When a project is flagged, a neutral high-reliability judge is assigned a 4th review. `Assignment.isTargeted` (311) records it. `JudgePassport.reliabilityScore` (91) drives selection.

This is the right response to high dispersion: **ask a third party rather than averaging**, because averaging collapses a real disagreement into fake consensus.

**[TARGET] guardrails, or the anti-herding mechanism becomes a herding mechanism:**

1. **The targeted judge must not be able to see the existing three scores** before submitting. If they can, they anchor.
2. **The targeted review must not be knowable to the original judges** until publication. If a judge learns they were flagged, they may change their score for the next project.
3. **Cap targeted reviews per judge per round** to prevent overloading a reliable judge and creating a new bias.
4. **The targeted score is a data point, not a tiebreak.** It enters the aggregate with a declared weight. Making it decisive reintroduces exactly the central-tendency problem the whole feature exists to fix.
5. **Log every targeted assignment to the audit trail**, including the dispersion value that triggered it.

### 10.4 Tie-breaking **[AS-IS]**

Three tiers (`tests/run-benchmarks.js:283-318`, `acceptance-report.txt`):

```
1. Rubric priority   — higher score on the highest-weighted criterion
2. Consensus         — median (not mean) across judges
3. Earliest freeze   — earliest frozen submission timestamp
```

**Tier 1 has a problem worth naming.** Deciding by highest-weighted criterion means the outcome turns almost entirely on whichever single criterion happens to carry the most weight. With `weight = 0.25` defaults across 4 criteria, this is often a coin flip on one dimension. A better tier 1 is the **lexicographic vector of per-criterion medians**, weighted — it uses all criteria and still respects weights, and it cannot be gamed by a single dimension.

**Tier 2 correctly uses the median.** The median is robust to a single outlier judge where the mean is not. This matters more here than in most ranking systems because a flagged judge may still have a ballot counted.

**Tier 3 must use the server-recorded freeze time**, never a client timestamp, and must be documented publicly in advance. Using earliest submission as the final tiebreak rewards whoever typed fastest, not whoever built best. The honest framing is: it is a **deterministic lottery surrogate**, chosen over "random" because it is reproducible and auditable. Say that explicitly, publish the rule before the event, and never change it after a ballot is cast. `RankedProject.tieBreakApplied` (391) records which tier fired.

### 10.5 Pairwise ranking **[AS-IS / DEAD]**

`PairwiseComparison` (`schema.prisma:457-473`) with `PairwiseA`/`PairwiseB` named relations and `isTie`. The service implements Bradley-Terry Elo (`ranking.service.ts`).

Bradley-Terry is the right model for pairwise data — it handles non-transitive preferences, which a points-based score cannot.

**[AS-IS] it is unreachable.** The controller holding these routes (`projects-mongo.controller.ts:180`, with `pairwise` at 263, `recuse` at 334, `disputes` at 372, `disputes/:id/resolve` at 385) is a **second declaration of a class name that is imported from a different file** (`database.module.ts:3,14`). Four routes are dead. The committed receipt that claims `pairwise_elo_engine: passed` targets them. `api.ts:518,530,540,545` calls them. Every part of the pairwise feature is in a state where it appears to work and does not.

**Tie handling:** if `isTie` is common, standard Elo (which assumes a decisive outcome) drifts. Use a proper draw model — e.g. treat a tie as 0.5 wins for both and fit Bradley-Terry by maximum likelihood on the win/tie/loss counts, with a ridge regulariser to prevent unbounded parameters when the comparison graph is disconnected. **[TARGET]** A disconnected comparison graph — some projects never compared to others — is the failure mode to check for explicitly, because Elo will happily produce a confident total order out of two disconnected components, which is meaningless.

### 10.6 Reproducibility **[TARGET]**

Non-negotiable for C4, and currently only partly satisfied. A ranking run must record enough to recompute bit-for-bit:

| Recorded | Location | Status |
|---|---|---|
| Rubric version + weights | `RankingRun.rubricVersionId` (364) `Restrict` | ✅ |
| Normalisation method | `RankingRun.method` | ✅ |
| Parameters | `RankingRun.parameters` | ✅ |
| **Exact input ballot IDs** | — | **Not stored.** Store a sorted, content-addressed list |
| **Algorithm version** | — | **Not stored.** A deploy changes results; declare the version |
| Input ballot content hashes | `Ballot.ballotHash` | Exists — snapshot the values at run time |
| Run hash | `RankingRun.runHash` | ✅ |
| Output ordering | `RankedProject` | ✅ |

Two gaps matter. Without the **input ballot ID list**, a later ballot edit changes what the run *would* produce while the stored output stays put — so the chain still verifies while the result is no longer reproducible. Without an **algorithm version**, a bug fix silently changes results with no way to distinguish "corrected" from "manipulated".

---

## 11. Frontend architecture

### 11.1 Current shape **[AS-IS]**

Next.js 14 App Router, React 18, Tailwind, React Three Fiber. 9 pages, 12 components, one shared client at `apps/web/src/lib/api.ts` (785 lines) and a terminology module at `apps/web/src/lib/terms.ts` (365 lines, consumers untraced).

**The central problem: 8 of 9 pages do not use the shared client.** Only `app/page.tsx:30` imports it; the other eight hand-roll `fetch` with their own URL strings. So:

- The carefully written wrappers in `api.ts` are ~90% dead code.
- Path drift is unbounded and undetected (`api.ts:562,566,518,530,540,545` all 404; shape mismatches at 217 and 313).
- `api.ts:11-19` self-documents a `LIVE`/`DEMO` split that the pages then ignore, and `api.ts:325,422,535,552` label the judging/dashboard/trust blocks `[DEMO]`.

### 11.2 Target structure **[TARGET]**

```
apps/web/src/
  app/                          routes only — thin, no data fetching
  components/
    ui/                         presentational, no fetch
    features/                   per-domain: gallery/, judging/, ranking/, trust/
  lib/
    api/                        ONE client: base URL, auth header, error normalisation
    query/                      caching, dedup, revalidation, optimistic updates
    types/                      generated from the OpenAPI spec — never hand-written
  server/                       server-only: data loaders, auth verification
```

Rules:

1. **One HTTP client.** No `fetch` outside `lib/api`. Enforce with an ESLint `no-restricted-imports` rule, not a convention.
2. **Types are generated, not written.** `openapi-typescript` from the checked-in spec, verified in CI. This eliminates the entire class of shape mismatch in `NOTES.md` F-7.
3. **Server Components for reads, Client Components for interaction.** Most of these pages are reads. Server Components remove the client bundle, the loading spinners, and the waterfall.
4. **One caching strategy, chosen deliberately.** Next's default is aggressive per-route caching, which is wrong for a live leaderboard. Pick one — revalidate-on-mutation, or explicit `no-store` plus client-side SWR — and apply it uniformly. Mixed defaults are how you get a gallery that shows stale results with no way to tell.
5. **The token does not live in `localStorage`.** `api.ts:13` acknowledges this. An `httpOnly` + `SameSite=Strict` + `Secure` cookie removes the XSS-token-theft class entirely. If a bearer token is required, keep it in memory only and accept re-auth on reload.

### 11.3 The 3D layer **[TARGET]**

`components/3d/*` — `DefensiblePodiumScene`, `IntegrityChainScene`, `PotentialRadarScene`, `VolumetricHeroStack`. Four bespoke R3F scenes.

These are legitimate differentiators *as long as they are honest about what they are*. A 3D visualisation of a hash chain is a good way to make an integrity guarantee legible to a non-technical organizer. It is not a zero-knowledge proof, and the receipt that says otherwise must go (`NOTES.md` F-9, §7.5).

Practical guidance: lazy-load the 3D bundle (`next/dynamic`, `ssr: false`) so it never blocks first paint — R3F is heavy and the other 8 pages should not pay for it; respect `prefers-reduced-motion`; and provide a real table view as the accessible equivalent. A results system must be usable without WebGL and without animation.

---

# Part IV — Quality attributes

## 12. Reliability and failure modes

### 12.1 Failure mode matrix

`ARCHITECTURE.md:133-139` has a good start. Completed, with the "how it actually behaves" column added because two of these rows are not currently true:

| # | Failure | System response | Recovery | **Actual behaviour** |
|---|---|---|---|---|
| F1 | Network down | Zero impact | — | ✅ **True.** No outbound calls exist |
| F2 | Postgres down | Serve degraded | Fail fast, refuse writes | ❌ **Fails silently** — `prisma.service.ts:19-21` swallows the error and the app serves Mongo data instead of an error. C6 is respected; C3 is not |
| F3 | Mongo down | Serve Postgres path | — | ❌ Silently degrades to a half-working UI (`mongo.service.ts:28-37`) |
| F4 | Judge disconnects mid-ballot | Draft persists locally, resume | Idempotent submit | ⚠ Sessions are 30 days; drafts are in-memory only. `chat`/`judging` UI state is lost on reload |
| F5 | Judge conflict (recusal) discovered mid-round | Re-issue assignments | Audit trail | ⚠ Postgres ✅; the advertised Mongo path is dead code |
| F6 | High disagreement (σ ≥ 1.5) | Flag, assign targeted 4th review | — | ✅ Implemented, unverifiable (no test) |
| F7 | Ranking calculation error | Previous run unchanged | Audit log, retry | ✅ B5 asserts this — **the best real test in the repo** |
| F8 | Post-deadline mutation attempt | `400` | Amendment request | ⚠ App-level only; Mongo path accepts it |
| F9 | Republish after publish | `409` | — | ⚠ App-level only |
| F10 | Seed runs on container start | — | — | ❌ `Dockerfile.api:30` runs the destructive seed on **every** start — `seed.ts:17-39` deletes all 23 tables |
| F11 | Build fails in Docker | — | — | ❌ `Dockerfile.web:26` copies a non-existent `apps/web/public`; `Dockerfile.api:30` calls `ts-node` which `--omit=dev` removed |

**The theme across F2, F3, F10, F11 is the same: the system is loud when it works and silent when it does not.** A failed database connection must be a startup failure, not a warning.

### 12.2 Degradation policy **[TARGET]**

| Layer | On failure |
|---|---|
| UI | Show a cached read-only view with a stale-data banner. Never a spinner that never resolves |
| API | Return `503` with `Retry-After`. Never a partial answer presented as complete |
| Reads | Serve the last known good projection if a cache exists |
| Writes | Fail. Queue if the operation is idempotent and deferred; drop with a visible error otherwise |
| Judging | **Never degrade.** If a ballot cannot be recorded, judging stops. A lost ballot silently is the worst possible failure in this system |

### 12.3 Health and readiness **[TARGET]**

Two distinct endpoints, and the distinction matters here because F2 is precisely a readiness failure being reported as health:

```
GET /api/v1/health     liveness  — process is up. Never touches the DB.
                       If this fails, restart. Used by the container HEALTHCHECK.

GET /api/v1/ready      readiness — schema current, migrations applied, chain
                       verifiable, seed present. Touches everything.
                       If this fails, remove from the load balancer but do NOT restart.
```

Plus a `GET /api/v1/health/deep` that verifies the hash chain, the ballot/rubric binding invariants, and orphan detection. A platform whose entire value proposition is verifiable integrity should be able to prove its own integrity on demand.

### 12.4 Recovery guarantees **[TARGET]**

| Guarantee | Mechanism |
|---|---|
| No lost ballot | `Ballot.status` transitions committed atomically with the hash node; idempotent retry |
| No orphaned chain node | Same transaction as the mutation it records |
| No lost audit event | Same transaction; `AuditEvent.actor Restrict` prevents silent user deletion |
| Recoverable ranking | Ranking is a pure function of stored inputs → recompute, never restore from backup |
| Recoverable session | Sessions are disposable — re-login is always available |
| RPO / RTO | Postgres PITR + nightly base backup. RPO 24 h, RTO 1 h. For an air-gapped laptop, also test a full `pg_dump` restore into a fresh volume — an untested backup is not a backup |

**The elegant consequence of making ranking a pure function:** you never need to back up `RankedProject`. You back up ballots and rubrics, and recompute. That removes the largest and most volatile table from the recovery surface.

---

## 13. Security architecture

### 13.1 Threat model structure **[AS-IS]**

`THREAT-MODEL.md` has the right shape: assets, trust boundaries, an executable attack matrix with vectors and expected status codes, and — importantly — an honest note at line 37 about what local hashing does not prove.

**Keep that note and make it the house style.** `NOTES.md` §5 shows the rest of the repository routinely overclaims; `THREAT-MODEL.md:37-38` is the counterexample.

The model is incomplete. Missing threats: ballot **reopening** abuse (§6.3), the **registration role parameter** (`auth.service.ts:11` lets a caller request `JUDGE` or `ADMIN` — a self-escalation vector on any open registration endpoint), **session fixation/hijacking**, **judge collusion** (three judges coordinating scores), **seeded-credential reuse** (`seed.ts:44-310` gives admin, organizer, and all 30 judges the same password), **CSV/JSON export injection**, and **predictable `shuffleSeed`** (`schema.prisma:123`) which lets someone pre-compute their own assignment.

### 13.2 Authentication **[TARGET]**

Current: bcrypt (cost 10 — raise to 12+), opaque 32-byte hex sessions, 30-day TTL, no rotation.

| Area | Requirement |
|---|---|
| Password hashing | Argon2id preferred, bcrypt cost ≥ 12 as the floor. `cost 10` (`auth.service.ts:17`) is below current guidance |
| Session storage | **Opaque tokens, server-side, hashed at rest** (store `SHA-256(token)`, compare hashes). A DB read then yields no usable credential |
| Session lifetime | Short access window (hours), longer refresh with rotation. 30 days with no rotation (`auth.service.ts:102`) is a standing key |
| Rotation | On privilege change, on password change, and on every refresh. Invalidate the whole family on suspected theft |
| Revocation | Immediate on role change, on `logout`, and on admin action. Today `logout` deletes by caller-supplied token with no ownership check (`auth.service.ts:130-133`) |
| OAuth | **Verify the signature.** JWKS or `tokeninfo`; check `iss`, `aud`, `exp`, `email_verified`. See `NOTES.md` F-1 — this is the most severe finding in the repository |
| Account linking | Unique `googleId`; never auto-link by email alone (that is how you get an account-takeover via a matching email at a permissive provider) |
| Registration | `role` must not come from the request body. Ignore it and default to `PARTICIPANT`; organizer invites judges |
| MFA | TOTP for `ORGANIZER` and `ADMIN` at minimum |

### 13.3 Authorisation **[TARGET]**

**Current posture is broken and this is the most important structural fix.** `AuthGuard` returns `true` for a missing token *and* for an invalid/expired token (`auth.guard.ts:12-15, 26-28`). There is no `@Public()` decorator. The result is that "public" is expressed by *omission*, so 37 routes are open — including `POST /database/clear`, `GET /projects/export/json`, and `GET/POST /judging/ballots` (`NOTES.md` F-2, F-3).

Target:

1. `AuthGuard` **denies by default**. Valid session required, or the handler must be explicitly `@Public()`.
2. `@Public()` is a deliberate, greppable, reviewable act. "I opened this route" must be a line someone wrote, not a guard someone forgot.
3. `@Roles(...)` is mandatory on every non-`@Public` route. A CI check fails the build if a controller method has neither.
4. `RolesGuard` must not grant `ADMIN` unconditionally — scope admin to administration operations, so a compromised admin session cannot silently read every ballot.
5. **Object-level authorisation on every access.** The guard answers "may this *role* do this?"; the service must answer "may *this user* touch *this row*?" A judge asking for `/projects/{id}` must be checked against their own `Assignment`. `[AS-IS]` `teams.controller.ts:25` (`get :id`) and `submissions.controller.ts:28,33` have no `@Roles` at all.
6. **Tenant isolation in the query, not after it.** Every query filters by the event/team the caller belongs to. Fetch-then-check leaks existence through response timing and status codes.
7. **Deny by default on resource state.** A judge cannot read a ballot when the event is `RESULTS_PUBLISHED`? They can — after publication the isolation rules legitimately change. Encode that in the state machine, not in scattered `if` statements.

### 13.4 Data protection **[TARGET]**

| Data | Classification | Control |
|---|---|---|
| Ballots pre-publication | **Critical** | Never returned to another judge. Never in logs, never in analytics, never in an error payload |
| Participant drafts | **High** | Organizer-visible only where the feature requires it; encrypted at rest |
| Password hashes | **Critical** | Argon2id/bcrypt ≥ 12. Never logged, never returned by any endpoint |
| Session tokens | **Critical** | Hashed at rest. `httpOnly` + `Secure` + `SameSite=Strict` cookies. Rotate |
| `MONGODB_URI`, `DATABASE_URL` | **Critical** | Never in any response — `GET /database/status` currently leaks it (`database.controller.ts:31-32`) |
| Seeded credentials | **High** | One documented demo password, printed by the seeder, never a shared bcrypt hash reused across 32 accounts |
| PII in exports | **Medium** | `ranking.service.ts` already scrubs entrant feedback. Apply the same scrubbing to every export path |
| Audit log | **High** | Append-only; `actor Restrict`; retention policy stated |

**[AS-IS] breach.** `apps/api/prisma/dev.db` is **committed to git** despite `.gitignore:37`, and it is the SQLite variant of the schema. `apps/api/.env` is correctly gitignored but there is **no `.dockerignore`**, and `Dockerfile.api:9` does `COPY apps/api ./apps/api` — so the build bakes `.env` and the DB into an image layer. Both images also run as **root** (no `USER` directive). Anyone with access to either image or to the registry cache has the credentials and the data.

### 13.5 Cryptographic hygiene **[TARGET]**

- **`JWT_SECRET` is declared in four files and read by none** (`NOTES.md` F-11). Sessions are opaque hex. Either delete the variable or stop describing the system as JWT-based — `apps/openapi.yaml:870-874` currently advertises `bearerFormat: JWT` for a non-JWT.
- **Hash chains need keyed hashing (HMAC), not bare SHA-256**, if you want tamper-evidence against an attacker with write access. Bare SHA-256 detects *accidental* corruption and *naive* tampering. An attacker who can write to the DB can recompute the entire chain. HMAC-SHA-256 with a key the DB layer cannot read raises the bar substantially, and pairing that with periodic external anchoring of the chain head is what actually closes the gap (`ARCHITECTURE.md:127` claims sub-second verification; the honest version is "detects modification without the key").
- **Separate the payload hash from the chain hash.** Canonicalise `payloadJson` deterministically (sorted keys, fixed number formatting) or the same logical payload will hash differently and break verification.
- **A chain over UTC-ordered timestamps is only as good as the clock.** Anchor node ordering to a monotonic sequence, not a wall clock.
- Constant-time comparison for anything secret-adjacent. `crypto.timingSafeEqual` where a timing side channel is plausible.

### 13.6 Dependency and supply chain **[TARGET]**

- `npm audit` in CI, non-zero exit on high/critical.
- Dependabot/Renovate with review, not auto-merge on anything security-relevant.
- **The ZK/proof claim in the receipts is a supply-chain-of-claims problem.** A field asserting `GROTH16_VERIFIED_1.4MS` with no implementing library is worse than no field: it manufactures trust. Receipts must be generated by code, and the generating code must be in the repository.
- Pin the base image by digest, not by tag (`node:20-alpine` floats).

### 13.7 Security controls as code **[TARGET]**

Every row of the `THREAT-MODEL.md:25-31` matrix becomes an executable test. That is what "executable attack matrix" means, and today the matrix is prose that nothing checks — while B2, the check that supposedly proves role isolation, never issues an HTTP request (`run-benchmarks.js:75-98`).

| Attack | Assertion | Current |
|---|---|---|
| Judge reads peer ballots pre-publication | `403` | ⚠ guarded on one path |
| Participant advances event status | `403` | ⚠ guarded |
| Post-deadline submission mutation | `400` | ⚠ app-level |
| Tampered hash node payload | detected, audited | ⚠ app-level |
| Republish after `RESULTS_PUBLISHED` | `409` | ⚠ app-level |
| Unauthenticated DB wipe | `401/403` | ❌ **`200`** |
| Unauthenticated full export | `401/403` | ❌ **`200`** |
| Forged Google credential | `401` | ❌ **`200` + session issued** |
| Ballot injection as a non-judge | `403` | ❌ **open** |
| Reading another judge's scores | `403` | ❌ **open** |
| Non-organizer creating a judge | `403` | ❌ **open** |
| Weight simulation mutates `RankingRun` | count unchanged | ✅ B5 |
| Two identical ballot POSTs | idempotent | ❌ unasserted |
| Password in any log line | never | ❌ unasserted |
| PII in a published payload | never | ⚠ partial |

---

## 14. Observability

### 14.1 Current state **[AS-IS]**

Effectively none. There is no structured logger, no request-ID middleware, no metrics endpoint, no tracing, no error reporting. `main.ts:47-48` writes two `console.log` lines with mojibake (`??`) where an emoji was intended. Failures are swallowed with empty `catch` blocks in at least four places: `prisma.service.ts:19-21, 27-29`, `mongo.service.ts:28-37`, `main.ts:40-43`, and the `openapi.yaml` writer.

**For a system whose product is auditability, having no telemetry is a structural contradiction.** An operator cannot answer "what happened at 14:03 during the freeze window?" — which is the single question this platform exists to answer.

### 14.2 Target **[TARGET]**

**Structured logging.** JSON to stdout, one object per event. Every line carries `requestId`, `userId`, `eventId`, `route`, `durationMs`, `outcome`. Secrets never logged — redact at the logger, not at call sites, because call sites are where people forget. Audit-grade events (`BALLOT_LOCKED`, `RANKING_PUBLISHED`, `ACCESS_DENIED`) are `INFO` in the application log **and** appended to `AuditEvent`; the former is for debugging, the latter is for evidence, and conflating them is how you end up with an audit log full of noise.

**Metrics** (`/api/v1/metrics`, Prometheus format):

| Metric | Type | Why |
|---|---|---|
| `http_requests_total{route,method,status}` | counter | Traffic and error rate |
| `http_request_duration_ms{route}` | histogram | p50/p95/p99 — the numbers the k6 thresholds assert |
| `ballots_submitted_total{eventId}` | counter | Judging throughput |
| `ballot_lock_latency_ms` | histogram | Judge UX |
| `disagreement_rate{eventId}` | gauge | Anomaly rate |
| `targeted_reviews_total{eventId}` | counter | Escalation volume |
| `ranking_run_duration_ms` | gauge | Recompute cost |
| `hash_chain_length{eventId}` | gauge | Ledger growth |
| `db_pool_active` / `db_pool_wait_ms` | gauge/histogram | The usual Postgres bottleneck |
| `auth_denied_total{route,reason}` | counter | Attack signal |

**Tracing.** OpenTelemetry with the `requestId` propagated into every `AuditEvent` and `IntegrityHashNode`. When a judge disputes a score six weeks later, the chain tells you *what* happened; the trace tells you *how long it took and what it touched*. Both are needed.

**Alerting** (local-only, e.g. Alertmanager → MailHog):

| Alert | Condition | Severity |
|---|---|---|
| Judging integrity | Any chain verification failure | **Page** |
| Chain unreachable | `hash_chain_length` missing for > 60 s during a live event | **Page** |
| Auth anomalies | `auth_denied_total` spike, or repeated failures from one identity | High |
| Judging stalled | Zero ballots for 30 min during `JUDGING_OPEN` | Medium |
| Database | Pool saturation > 80%, or connections > 90% of `max_connections` | High |
| p95 latency | k6 threshold breach sustained 5 min | Medium |

### 14.3 Audit trail **[AS-IS]**

`AuditEvent` (`schema.prisma:395-410`) records actor, action, resource, and timestamp. `IntegrityHashNode` (412-422) chains the state transitions. `tests/run-benchmarks.js:103-145` (B3) and `apps/api/src/trust/trust.service.ts` implement and check verification.

**Both are real and both are good.** The problems are that verification is never *scheduled*, and that a second, unauthenticated ledger in Mongo undermines the guarantee entirely.

**[TARGET]**

1. **Verify on a schedule, not only on request.** A `GET /verify` that a human clicks proves nothing about integrity at 03:00. Verify every 5 minutes, store the result, alert on change.
2. **Anchor the chain head externally.** For an air-gapped box the anchor is a file plus a printed checksum; for a networked one, a public append-only log. Without external anchoring, DB-write-access compromise is undetectable.
3. **One ledger.** Delete the Mongo implementation.
4. **Retention is a stated policy.** Append-only logs grow forever. Decide the retention window, and decide whether "append-only" means "immutable forever" or "immutable for N years" — those are different promises.
5. **Never let an audit write fail silently.** Today, an `AuditEvent` insert that throws is indistinguishable from one that was never attempted.

---

## 15. Performance and capacity

### 15.1 What the numbers actually are **[AS-IS]**

`ARCHITECTURE.md:127` claims sub-second hash verification for 40 projects / 120 ballots. `k6/smoke.js:4-50` targets p95 < 300 ms with 5 VUs. `k6/spike.js:12-35` ramps to 4,000 VUs with read p95 < 450 ms, write p95 < 800 ms, error < 2%. `acceptance-report.txt` claims `0.17s` total and `p95 = 2ms`.

**None of these are measured.** There is no k6 output file in the repository. The `2ms` and `0.17s` figures come from a script that measures `Date.now()` around a single in-process read (`run-benchmarks.js:34-60`) and the repo explicitly deprecates them at lines 3-5.

### 15.2 Capacity model **[TARGET]**

Realistic hackathon scale, which is much smaller than the k6 spike implies:

| Dimension | Realistic | k6 spike asserts |
|---|---|---|
| Concurrent judges | 50–200 | 4,000 VUs |
| Projects per event | 40–500 | — |
| Ballots per event | 120–2,000 | — |
| Peak read QPS | ~200 (gallery polling) | 3,200 |
| Peak write QPS | ~5 (ballot saves) | 600 |

**The design conclusion: this workload is trivially handled by one Postgres instance and one API replica, and the interesting engineering is correctness, not throughput.** That is the right trade for a 4-person team, and it is why the modular monolith is the correct choice. Optimise for *provable correctness under modest load* rather than for scale you will never see.

`k6/spike.js` at 4,000 VUs is worth keeping as a **headroom** test — it answers "how far from the cliff are we?" — but it should be labelled as such and never presented as a real-world load figure. Presenting a synthetic 4,000-VU number as capacity for a 200-judge product is the same overclaim problem as the ZK receipt.

### 15.3 Performance budget **[TARGET]**

| Operation | p95 target | Notes |
|---|---|---|
| `GET /events`, `GET /gallery` | < 100 ms | Cached; the most-called endpoint |
| `GET /project/{id}` | < 150 ms | Includes rubric + own feedback |
| `POST /ballot` | < 400 ms | Transactional: ballot + scores + hash node + audit |
| `GET /ranking/preview` | < 2 s | Heavy compute; **must** be async or cached — never inline on a page load |
| `POST /ranking/publish` | < 5 s | Once per event |
| `GET /trust/verify/{id}` | < 1 s | O(chain); rate-limited (`§9.7`) |
| `POST /judging/recuse` | < 100 ms | Includes re-issue of affected assignments |

Enforce these as **CI performance tests** against a seeded database, not as one-off measurements. A budget nobody checks is a wish.

### 15.4 Optimisation strategy **[TARGET]**

Ordered by return on effort:

1. **N+1 elimination.** `getCommandCenterMetrics` (`events.service.ts:275`), the gallery (`:222-241`), and the ranking input query are the likely offenders. Use `include`/`select` deliberately. This is the highest-value fix and costs nothing.
2. **Cursor pagination** on every list (§9.3). Offset pagination degrades linearly and skips/duplicates under concurrent writes.
3. **Cache the immutable.** Frozen projects, locked rubrics, and published rankings never change. They are the ideal cache population — cache them hard, keyed by `eventId` + `rubricVersionId`, invalidated on hash-node append.
4. **Precompute ranking.** Never compute σ or the full ranking on a request path. Compute on a schedule or on demand, store the projection, serve the projection. `RankedProject` already exists for exactly this.
5. **Denormalise the hash tip.** `IntegrityHashNode` chain-tip hash on the `Event` row, updated in the same transaction as the append. Turns the chain traversal from O(n) to O(1) for the common "is it still valid?" check.
6. **Connection pooling.** PgBouncer in transaction mode, or at minimum a correct `max`/`idleTimeout` on the Prisma pool. Two `PrismaService` instances (`app.module.ts:15-30`) can each hold a full pool — that is a real connection-limit bug waiting to happen.
7. **Do not add Redis or a cache layer before measuring.** Redis is in `docker-compose.yml:22-34` and read by nothing. A premature cache on an unmeasured workload adds invalidation bugs and removes zero milliseconds.

### 15.5 Frontend performance **[TARGET]**

- Server Components by default → smaller bundle, no waterfall, no loading spinners.
- `next/dynamic` with `ssr: false` for the four 3D scenes. R3F is large and 8 of 9 pages do not need it.
- Virtualise the gallery and the judge review queue. 500 projects in the DOM is a jank generator.
- Optimistic UI for ballot scoring with rollback on failure — the single biggest perceived-latency win in a judging console, and it works because ballot submission is idempotent (§8.4).
- Image/virtual-asset discipline; no layout shift in the results table (reserve row height before data arrives).

---

## 16. Deployment and configuration

### 16.1 Target topology **[TARGET]**

```
                       ┌──────────────────────────┐
  Browser ──HTTPS──▶   │  Reverse proxy / gateway │  (TLS, rate limit, static)
                       └────────────┬─────────────┘
                        ┌───────────┴───────────┐
                        ▼                       ▼
                 ┌─────────────┐         ┌─────────────┐
                 │ Next.js     │         │ NestJS API  │  (N replicas,
                 │ (stateless) │         │ (stateless) │   session in DB)
                 └─────────────┘         └──────┬──────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        ▼                        ▼                        ▼
                 ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
                 │ PostgreSQL  │         │ Object      │         │ SMTP sink   │
                 │ 16          │         │ storage     │         │ (MailHog)   │
                 │ (system of  │         │ (MinIO)     │         └─────────────┘
                 │  record)    │         └─────────────┘
                 └─────────────┘
```

The API and web tiers are stateless (sessions live in Postgres, `schema.prisma:75-82`), so they scale horizontally with no coordination. That is the correct shape and it costs nothing because sessions were never in memory. **[AS-IS]** the one exception is the rate limiter (`support.controller.ts:8-33`), which is per-process and breaks the model — move it to Postgres or Redis.

### 16.2 Configuration **[AS-IS / TARGET]**

**The current configuration is actively misleading.** Declared but read by nothing: `JWT_SECRET`, `REDIS_URL`, `STORAGE_*`, `SMTP_*`, `AI_PROVIDER`, `GOOGLE_CLIENT_ID/SECRET`. Read by code but declared **nowhere**: `MONGODB_URI`, `MONGODB_DB_NAME` (only in the gitignored `apps/api/.env`).

That is why `docker-compose.yml` runs a Redis, a MinIO and a MailHog that no code path uses, while omitting the one service the app actually needs.

**[TARGET] configuration rules:**

1. **Every variable is read by code or deleted.** An env var that nothing reads is a lie in the operator's mental model. Enforce with a test that reflects over the config schema and asserts every key is consumed, plus a lint for unused keys in `.env.example`.
2. **Typed and validated at startup.** One `config` module that parses `process.env` into a typed object and **throws** on a missing or malformed required value. No `process.env.X` scattered through services — that is why the mismatch went unnoticed.
3. **Fail fast.** An air-gapped box should not boot into a half-working state because Postgres was unreachable. `prisma.service.ts:19-21` swallowing the connection error is the single most consequential line in the deployment story.
4. **No secrets in images or layers.** `.dockerignore` must exclude `.env*`, `*.db`, `node_modules`, `.next`, `dist`, `.git`, `benchmarks/receipts`. Verify with `docker history` in CI.
5. **Twelve-factor.** Config from env, one disposable filesystem, no local state, backing services addressed by URI, logs to stdout, and **all twelve** of the remaining factors actually followed — not just the easy three.
6. **Document the air-gapped path explicitly.** The offline story is the product's differentiator. Today `.env.example` is a hosted/production template (`README.md` references it) and the offline variables live in an untracked file nobody can see.

### 16.3 Containerisation **[AS-IS]**

Three independent blockers make `docker compose up` fail:

| # | Blocker | Evidence |
|---|---|---|
| 1 | `Dockerfile.web:26` copies `/app/apps/web/public`, which **does not exist** | `Test-Path` → `False`; absent from `git ls-files` |
| 2 | `Dockerfile.api:30` runs `ts-node` after `npm install --omit=dev` (line 20); `ts-node` is a devDependency (`apps/api/package.json:44`) | Runner stage has no `ts-node` → the `&&` chain fails → the API never starts |
| 3 | No `.dockerignore`, so `COPY apps/api ./apps/api` (`Dockerfile.api:9`) bakes `.env` and the committed `dev.db` into a layer | Verified absent |

Plus: no `USER` in either Dockerfile (both run as **root**); the destructive seed runs on **every** start (`Dockerfile.api:30` → `seed.ts:17-39` deletes 23 tables); and Compose has no Mongo service while the UI only calls Mongo routes.

**[TARGET]**

```dockerfile
# multi-stage: deps → build → runtime
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci                                  # ci, not install — respect the lockfile

FROM deps AS build
COPY . .
RUN npx prisma generate \
 && npm run build --workspace=apps/api \
 && npm run build --workspace=apps/web

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
# seed compiled to JS in the build stage — never ts-node in the runner
RUN node -e "require('fs').mkdirSync('/app/apps/api/prisma',{recursive:true})"
USER node                                  # never root
CMD ["sh","-c","npx prisma migrate deploy && node dist/main.js"]
```

Note: `npm ci`, not `npm install` — a Dockerfile that ignores the lockfile is not reproducible. And the seed is **removed** from the start command; seeding belongs in an explicit, separately-invoked step (`docker compose run --rm api node prisma/seed.js`) so that restarting a container can never delete production data.

### 16.4 Health checks and lifecycle **[TARGET]**

`/api/v1/health` for liveness (no DB), `/api/v1/ready` for readiness (DB, migrations, chain). Compose already has a Postgres healthcheck (`docker-compose.yml:16-20`) and an api gate on postgres+redis (79-83) — but not on the service the UI actually needs. Also: `depends_on` orders startup, not readiness, so anything that depends on a service being *usable* needs the healthcheck, not just `depends_on`.

### 16.5 CI/CD **[TARGET]**

There is **no CI** (`NOTES.md` F-12). Minimum viable pipeline, in order of value:

```
lint         ESLint + Prettier, zero warnings
typecheck    tsc --noEmit on apps/api and apps/web
unit         domain layer pure functions — no DB, no network, < 30s
integration  booted app + real Postgres, supertest against the THREAT-MODEL matrix
contract     regenerate openapi.yaml, diff against committed — drift fails
db           prisma validate + migrate diff — schema and migrations must agree
security     npm audit --audit-level=high, gitleaks, dependency review
build        both workspaces compile
perf         k6 smoke against a seeded instance, budgets asserted
docker       build both images, assert no .env in any layer, run as non-root
```

Every one of those steps corresponds to a live defect in this repository. B2 and B6 would have been deleted by the first "integration" run. The Docker blockers would have been caught by "build". The `openapi.yaml` staleness would have been caught by "contract". The unauthenticated routes would have been caught by the threat-matrix tests.

**`contract` is the highest-value single step here** because the spec is currently written at runtime and committed, which makes drift invisible by construction.

### 16.6 Release strategy **[TARGET]**

- Trunk-based, `main` is always releasable, short-lived branches.
- Migrations gated behind the same deploy as the code that needs them, forward-compatible: **expand, deploy, contract.** Never rename or drop a column in the same release that stops writing it (§8.6).
- Versioned, immutable images by digest. `latest` is not a deployable tag.
- Every release notes entry states: what changed, what migrations ran, what is now false in the docs. **The last one is unusual and it is the point of this repository** — `NOTES.md` §5 is a long list of claims that quietly stopped being true.

---

# Part V — Process

## 17. Testing strategy

### 17.1 Principles

1. **Test the invariants, not the endpoints.** "The hash chain detects a modified payload" is an invariant. "POST /trust/verify returns 200" is not.
2. **A test that cannot fail is worse than no test**, because it is counted as coverage. B2 (`run-benchmarks.js:75-98`) calls a local helper and asserts booleans in-process; B6 (`:220-221`) is `let b6Pass = true`. Both are counted as passes. Delete them.
3. **Attack matrices are executable or they are marketing.** `THREAT-MODEL.md:25-31` is a good matrix that nothing checks.
4. **Claims are generated by code.** A hand-written "VERIFIED GREEN" report is a liability. A CI job that emits a report with a commit SHA, environment, and timestamp is evidence.
5. **Test the pure domain without infrastructure.** Ranking math, the hash chain, the state machine, and the heuristic engine should need no database. Extracting them (§4) is what makes this possible.

### 17.2 Test pyramid for this system **[TARGET]**

| Layer | Share | Content | Needs DB? |
|---|---|---|---|
| **Unit** | 60% | Domain layer: weighted score, CV, mean-centring, Bradley-Terry, hash chain, state transitions, heuristics | **No** |
| **Integration** | 25% | Service + real Postgres: freeze, ballot, recusal + re-issue, preview non-mutation, publish, verify | Yes |
| **Contract / e2e** | 10% | The `THREAT-MODEL.md` matrix over HTTP; the critical user journeys (submit → freeze → judge → publish → verify) | Yes |
| **Performance** | 5% | k6 smoke + budgets; spike as a headroom probe | Yes |

### 17.3 The suite that should exist **[TARGET]**

**Domain unit tests (no DB):**
- Weighted score: boundary `min`/`max` clamping; weights that do not sum to 1.0; zero-weight criterion rejected at lock; missing score ≠ zero.
- CV: scale invariance (×2 on all scores leaves CV unchanged); a harsh judge *across all projects* does **not** flag; a harsh judge *on one project* does.
- Bradley-Terry: known ordering; a draw-heavy comparison set; a **disconnected** comparison graph is detected rather than silently ordered.
- Hash chain: genesis; append; **delete a middle node → detected**; **reorder two nodes → detected**; modify a payload → detected; empty chain; single node.
- State machine: every `(from, to)` pair not in the table is rejected — one exhaustive test, which is the entire value proposition of an explicit transition table.
- Heuristics: deterministic across runs (same input → same output, always).

**Integration:**
- Ballot submission commits ballot + scores + hash node + audit **atomically** — inject a failure at each step and assert nothing partial survives.
- Two identical ballot POSTs are idempotent.
- Recusal re-issues assignments and excludes the recused judge; `@@unique[projectId,judgeId]` holds.
- Weight simulation leaves the `RankingRun` count unchanged **(promote B5)**.
- Publish appends the chain node and locks the event; a second publish is `409`.

**Contract / e2e — the `THREAT-MODEL.md` matrix as code:**

| # | Attack | Expected | Today |
|---|---|---|---|
| 1 | Judge reads peer ballots pre-publication | `403` | ⚠ |
| 2 | Participant calls `/events/:id/status` | `403` | ⚠ |
| 3 | Post-deadline submission mutation | `400` | ⚠ |
| 4 | Tampered hash node payload | detected + audited | ⚠ |
| 5 | Republish after `RESULTS_PUBLISHED` | `409` | ⚠ |
| 6 | Unauthenticated `POST /database/clear` | `401/403` | ❌ `200` |
| 7 | Unauthenticated `GET /projects/export/json` | `401/403` | ❌ `200` |
| 8 | Forged Google credential | `401` | ❌ session issued |
| 9 | Ballot injection as a non-judge | `403` | ❌ open |
| 10 | Read another judge's scores | `403` | ❌ open |
| 11 | Non-organizer creates a judge account | `403` | ❌ open |
| 12 | Password appears in any log line | never | ❌ unasserted |
| 13 | PII in a published payload | never | ⚠ partial |
| 14 | Password or URI in any response body | never | ❌ leaks in `/database/status` |

Rows 6–11 and 14 are the acceptance criteria for Phase 2 of the remediation backlog. **They are the tests that would have prevented every critical finding in `NOTES.md`.**

### 17.4 Coverage **[TARGET]**

Measure **domain-layer** coverage and enforce ≥ 90% there. Do **not** chase a repository-wide percentage: controllers and repositories are covered by integration tests, and a coverage number that includes them is a number that hides the domain layer. Branch coverage matters more than line coverage for the ranking maths.

### 17.5 Performance testing **[TARGET]**

`benchmarks/BENCHMARKS.md:9-19` ("Honesty Rules First") is a better standard than most production projects have: real stack only, true wall-clock cold start, real k6 binary, loopback caveats labelled, raw pasted receipts never transcribed, retire legacy stub metrics. **Keep every clause and make the code comply.** The current code meets none of the first two (no cold-start measurement exists) and produces no raw receipts.

Cold start must be measured honestly: `docker compose up` → first successful request, on a cold machine with no layer cache, reported with the machine spec. `prisma.service.ts:16` currently *skips connecting*, which is exactly the kind of shortcut that produces a flattering 0.15 s number.

---

## 18. Evolution path

### 18.1 Now → next

**Phase 0 — Make it run** (`NOTES.md` Phase 0). Fix the three Docker blockers, add `.dockerignore`, stop seeding on start, add the missing `public/`. *Nothing else matters until the app boots.*

**Phase 1 — Cut the duplicate system.** Delete `apps/api/src/database/`, repoint the UI at `/api/v1/*`, fix the `api.ts` path and shape drift, delete the stale `apps/openapi.yaml`, stop writing the spec at boot. *This single phase removes 37 unauthenticated routes, one duplicate datastore, and most of the documentation drift in one move.*

**Phase 2 — Close the security holes.** Verify the Google credential, invert `AuthGuard` to deny-by-default, add `@Public()`, audit every controller, fix `logout` ownership, remove the caller-settable `role`, shorten session TTL. *Then the `THREAT-MODEL.md` matrix becomes true and testable.*

**Phase 3 — Make the claims honest.** Add CI, add a real test runner, delete B2 and B6, fix `run.py`'s exit code, add T3/T4 checks against `/api/v1/*`, delete `acceptance-report.txt`, generate the spec in CI and fail on drift, run the k6 suites and commit real output.

**Phase 4 — Extract the domain layer.** Pure functions for ranking, hash chain, state machine, heuristics. This is what makes Phase 3's unit tests possible and what turns the security matrix from integration-only into fast.

### 18.2 Scaling triggers

Reconsider the modular monolith **only** when one of these is true:

| Trigger | Response |
|---|---|
| A module needs to scale/deploy independently for a *real* reason | Extract that module. `ranking` and `trust` are the candidates — both are compute- and integrity-heavy and both are cleanly separable |
| Write contention on Postgres blocks judging during a spike | Read replicas for the gallery, or move `intelligence` off the hot path |
| The team grows past ~15 engineers across independently-owned modules | Then, and only then, extract along the existing module boundaries |
| Judge count exceeds ~5,000 concurrent | Session store to Redis; stateless API already prepared for it |

Do **not** extract for style, for resume optics, or because a blog post said so. The boundaries in §3 are already the seams; extraction later is cheap if the boundaries are real, and impossible if they are not.

### 18.3 What to build later, in priority order

1. **Judge bias correction** using `JudgePassport.calibrationBias` in the mean-centring decomposition (§10.2). Highest value per line of code.
2. **Reproducibility proof** as a first-class export (§7.4, §10.6) — the `RankingRun` fields already exist.
3. **Merkle root over ranked output** — O(log n) proof of a single placement without revealing the rest.
4. **External chain-head anchoring** — the actual answer to "prove the host was not compromised."
5. **Real mail via the Compose SMTP** (`events.service.ts:432`, `support.service.ts:96` both simulate) or delete the claim.
6. **Multi-event organiser view** and cross-event analytics.
7. **Advisory LLM integration** behind the non-authoritative contract in §1.3 — clearly labelled, never touching scoring, ranking, or eligibility.

### 18.4 Things not to build

| Do not | Why |
|---|---|
| A plugin/module marketplace | Yields nothing at hackathon scale; pure attack surface |
| Microservices | §2.1 — the constraints forbid it and the team cannot operate it |
| A general-purpose workflow engine | The three state machines in §6 cover the entire domain |
| Real-time WebSocket collaboration | Polling at 5 s is sufficient for a 200-judge event, and WebSockets break the stateless replica model in §16.1 |
| Multi-tenancy / white-labelling | One event per deployment satisfies C2; multi-tenancy fights the air-gap story |
| Anything that requires a network call | C1. This is the constraint that makes the product distinctive — do not erode it for convenience |

---

## 19. Design decision log

Recording *why* is what stops the next engineer from "helpfully" undoing a decision they did not understand.

| # | Decision | Rationale | Revisit when |
|---|---|---|---|
| D1 | Modular monolith, not microservices | C1/C2 air-gap + one command; C3/C4 want ACID across module boundaries; C5 team size | Team > 15 engineers with independent module ownership |
| D2 | PostgreSQL as the single source of truth | Transactions across ballot/rubric/publish; referential integrity for I1–I10; `Restrict` on audit actors is only expressible in a relational store | Never for this product. Mongo as a cache is fine; as a source of truth is not |
| D3 | Opaque session tokens, not JWT | Instant revocation matters more than stateless verification for a system where an admin must be able to cut access instantly. Slightly more DB load, which is irrelevant at this scale | If read throughput ever dominates writes — it will not |
| D4 | Append-only hash chain over per-record hashes | Detects **deletion and reordering**, which are the attacks that matter for a results system and which bare per-record hashes miss | Never |
| D5 | Rubric locked before any ballot | Makes the score formula immutable while data is being collected. `Ballot.rubricVersionId Restrict` enforces the binding | Never |
| D6 | Frozen content immutable; amendments are new versions | Preserves verifiability of what was submitted at the deadline | Never |
| D7 | Ranking is a pure function of stored inputs | Recompute instead of restore — removes `RankedProject` from the backup surface and makes reproducibility a property rather than a hope | Never |
| D8 | Preview is non-mutating and sandboxed | Lets organizers explore weights without any risk to the official run. B5 is a real test of exactly this | Never |
| D9 | Targeted 4th review rather than averaging | Averaging collapses genuine disagreement into false consensus. A neutral third party is the honest resolution | If anchoring is unavailable, in which case averaging is the fallback |
| D10 | Deterministic 3-tier tie-break, published in advance | Reproducible and auditable. Randomness is neither. "Earliest freeze" is a lottery surrogate and should be documented as one | Only by publishing a new rule *before* any ballot is cast |
| D11 | `AI_PROVIDER` may never influence a decision | C1 offline. The deterministic engine is the only authoritative path | Only if an offline model is bundled and its determinism is proven |
| D12 | Median, not mean, for consensus | Robust to a single outlier judge, which is exactly the failure mode in §10.4 | Never |
| D13 | CV rather than raw σ for dispersion | Scale-free; a project scored 8.0 ± 0.5 is not meaningfully in disagreement | Add mean-centring when bias correction lands (D14) |
| D14 | Judge bias correction via mean-centring **[TARGET]** | The current per-project CV cannot distinguish disagreement from a systematically harsh judge — the most dangerous blind spot in the scoring model | Already scoped; needs unit tests before it ships |
| D15 | Sessions in the database, not in memory | Keeps the API stateless so it scales horizontally with zero coordination | Move to Redis only if session lookup shows up in p95 |
| D16 | Explicit state-transition table **[TARGET]** | Makes illegal transitions *unrepresentable* and lets one exhaustive test prove the whole machine — which is the level of proof C3 demands and hand-written `if` statements cannot give | Never |
| D17 | Contract drift fails CI **[TARGET]** | The spec is currently written at runtime and committed, which makes drift invisible by construction | Never |
| D18 | Delete the demo layer, do not harden it **[TARGET]** | It duplicates the domain model, invalidates every security claim, and the better implementation of every feature it approximates already exists in the Postgres layer | Never |

---

## Appendix — Document map

| Document | Contains | Audience |
|---|---|---|
| [`README.md`](./README.md) | Product promise, quickstart, capabilities | Everyone. **Update after Phase 3** — several current claims are unverified (`NOTES.md` §5) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Topology, state machines, hash chain, failure modes | Superseded in scope by this document. Keep as the short version; it is accurate as far as it goes |
| [`DATA-MODEL.md`](./DATA-MODEL.md) | Entities, invariants, export manifest | Accurate. Extend with the §5.2 enforcement table |
| [`JUDGING.md`](./JUDGING.md) | Scoring, calibration, disagreement | Accurate. Extend with §10.2–10.5 |
| [`THREAT-MODEL.md`](./THREAT-MODEL.md) | Assets, attack matrix, crypto boundary | **The best-written document in the repository.** §37-38's honesty note should be the template for everything in `NOTES.md` §5 |
| [`benchmarks/BENCHMARKS.md`](./benchmarks/BENCHMARKS.md) | Honesty rules, k6 suites, runbook | Excellent standard, non-compliant code (§17.5) |
| [`NOTES.md`](./NOTES.md) | **Ground truth.** Flow, findings, drift matrix, remediation backlog | Read first. This document |
| [`AUTOPILOT-API.md`](./AUTOPILOT-API.md) | Prompt → blueprint → event. The automation feature specified end to end | Building or reviewing the automation work. Extends §6, §9, §18.3 |
| [`ENGINEERING-PRINCIPLES.md`](./ENGINEERING-PRINCIPLES.md) | **The rulebook.** Normative rules with enforcement mechanisms | Read before writing code |
| [`openapi.yaml`](./openapi.yaml) | Generated contract | Currently a build artifact; make it CI-verified (D17) |
