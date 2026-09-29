# DOGFOOD OS — Software Engineering Principles

> **What this document is.** The normative rulebook for this codebase. Every principle is stated as a rule, paired with a **mechanism** that makes it enforceable, and a **verdict** for the current state of the repository.
>
> **How to read the verdict column.** `HOLD` — the principle is followed. `GAP` — followed in the good paths, broken in others. `BROKEN` — not followed. `ABSENT` — the thing does not exist. A principle with no mechanism is a preference; a principle with a CI gate is a rule. The point of this document is to move every `BROKEN` and `ABSENT` to `HOLD`.
>
> **Related.** [`SYSTEM-DESIGN.md`](./SYSTEM-DESIGN.md) is the design this rulebook protects. [`NOTES.md`](./NOTES.md) is the evidence base for the verdicts.

---

## How to use this document

1. **Before writing code:** read the relevant section. Most changes here touch *two* principles at once — adding an endpoint touches R1 (deny by default), R2 (object-level authz), A1 (contract), and D1 (audit).
2. **In review:** the verdict column is the checklist. A PR that closes a `BROKEN` is worth more than a PR that adds a feature.
3. **In CI:** every `ABSENT` mechanism below is a missing pipeline step. The full list is in §18.

---

## Table of contents

**I. Correctness**
1. [Invariants over intentions](#1-invariants-over-intentions)
2. [Make illegal states unrepresentable](#2-make-illegal-states-unrepresentable)
3. [Enforce at the lowest layer](#3-enforce-at-the-lowest-layer)
4. [Determinism](#4-determinism)
5. [Purity at the core](#5-purity-at-the-core)

**II. Design**
6. [One source of truth](#6-one-source-of-truth)
7. [Boundaries and dependency direction](#7-boundaries-and-dependency-direction)
8. [Delete, don't accumulate](#8-delete-dont-accumulate)
9. [Design for the constraint, not the average case](#9-design-for-the-constraint-not-the-average-case)

**III. Security**
10. [Deny by default](#10-deny-by-default)
11. [Authorise the object, not just the role](#11-authorise-the-object-not-just-the-role)
12. [Never trust the client](#12-never-trust-the-client)
13. [Verify every credential](#13-verify-every-credential)
14. [Secrets are not configuration](#14-secrets-are-not-configuration)
15. [Least privilege by construction](#15-least-privilege-by-construction)

**IV. Data**
16. [Append-only where it counts](#16-append-only-where-it-counts)
17. [Migrations are history](#17-migrations-are-history)
18. [Idempotency as a default](#18-idempotency-as-a-default)
19. [Concurrency is a design input](#19-concurrency-is-a-design-input)

**V. Interfaces**
20. [One client, generated types](#20-one-client-generated-types)
21. [Contracts are verified, not documented](#21-contracts-are-verified-not-documented)
22. [Errors are part of the API](#22-errors-are-part-of-the-api)

**VI. Delivery**
23. [It must build](#23-it-must-build)
24. [Configuration is typed and validated](#24-configuration-is-typed-and-validated)
25. [No root, no secrets in layers](#25-no-root-no-secrets-in-layers)
26. [The pipeline is the product](#26-the-pipeline-is-the-product)

**VII. Quality**
27. [A test that cannot fail is worse than no test](#27-a-test-that-cannot-fail-is-worse-than-no-test)
28. [Attack matrices are executable](#28-attack-matrices-are-executable)
29. [Performance is a budget](#29-performance-is-a-budget)
30. [Observability](#30-observability)

**VIII. Honesty**
31. [Never claim what you have not measured](#31-never-claim-what-you-have-not-measured)
32. [Receipts are generated, not transcribed](#32-receipts-are-generated-not-transcribed)
33. [A budget number without a measurement is a wish](#33-a-budget-number-without-a-measurement-is-a-wish)
34. [Document the boundary of your guarantees](#34-document-the-boundary-of-your-guarantees)
35. [Delete the claim when you delete the code](#35-delete-the-claim-when-you-delete-the-code)
36. [The rulebook applies to this document](#36-the-rulebook-applies-to-this-document)

**Appendices**
- [A. Principle to CI gate](#appendix-a-principle-to-ci-gate)
- [B. Review checklist](#appendix-b-review-checklist)
- [C. Definition of done](#appendix-c-definition-of-done)
- [D. Anti-patterns in this repository](#appendix-d-anti-patterns-in-this-repository)

---

# I. Correctness

## 1. Invariants over intentions

**Rule.** The system's guarantees are expressed as invariants — properties that hold for every reachable state — and each invariant is enforced at the lowest layer that can enforce it and tested from the outside.

**Why.** An intention is a comment. An invariant is a constraint the compiler, the database, or a test enforces. In a platform whose product is *"the results are defensible"*, the difference between "we do not allow post-deadline edits" and "`isFrozen` is set and the content hash is immutable and a post-deadline write returns 400 and a test asserts it" is the entire product.

**Mechanism.**
- Every invariant gets a row in the enforcement table (`SYSTEM-DESIGN.md` §5.2): DB constraint, application check, or test — and never only a comment.
- Cross-module invariants are tested **black-box over HTTP**, not by calling services in-process. A service-level test cannot catch a missing guard; the attack matrix must (`NOTES.md` F-9).
- No invariant may be enforced *only* in application code while a second write path exists. Seven of ten invariants currently are (`NOTES.md` §5.2).

**Verdict: `GAP`.** The invariants are identified and mostly real — `@@unique[projectId,judgeId,rubricVersionId]`, `Project.teamId @unique`, `AuditEvent.actor Restrict`, `Ballot.rubricVersionId Restrict` are all excellent. But 7 of 10 are app-level only, and a second write path exists that honours none of them.

---

## 2. Make illegal states unrepresentable

**Rule.** A state the system must never enter must not merely be rejected at runtime — it must be impossible to construct. Where it cannot be impossible, the check must be exhaustive and machine-verified.

**Why.** Runtime `if` statements are forgotten. The cost of a forgotten check is a security incident; the cost of a type or a schema constraint is a compile error. This is the difference between "we check for this" and "this cannot happen".

**Mechanism.**
- Enums over stringly-typed status fields. `BallotStatus`, `EventStatus`, `ProjectEligibility`, `Role` exist — use them everywhere, including in TypeScript. **Today `common/types.ts:1-40` re-declares all of them, creating a second source of truth that can drift from the schema.** Import the Prisma-generated enums and delete `common/types.ts`.
- `??unique` over check-then-insert. I2, I3, I10 are done right.
- **`Restrict` over `Cascade` for anything evidentiary.** `Ballot`/`RankingRun` → `RubricVersion` is `Restrict` (correct). `Event` → `IntegrityHashNode` is `Cascade` (**wrong** — cascading an event delete destroys the chain that proves its results). An event with published results should not be deletable.
- An **explicit state-transition table** (`SYSTEM-DESIGN.md` §6.5) plus one exhaustive test: for every `(from, to)` pair, assert the table permits exactly the legal ones. That single test is a complete proof of the state machine — a level of provable correctness this product's claims actually require and hand-written `if` chains cannot deliver.

**Verdict: `ABSENT`.** The primitives exist (`Restrict`, enums, `@@unique`) but are applied inconsistently, duplicated in TypeScript, and the state machines are enforced by scattered conditionals with no exhaustive test. This is the highest-leverage structural improvement available: it converts "we check for this" into "this cannot happen".

---

## 3. Enforce at the lowest layer

**Rule.** Each invariant is enforced in exactly one place — the lowest layer that can see the whole truth — and other layers may not duplicate or contradict it. A check that exists in both the database and the service is fine; a check that exists in two services is a bug.

**Why.** Duplicated validation drifts. When the copy in `projects-mongo.controller.ts` and the copy in `submissions.service.ts` disagree, you do not know which one is authoritative, and the answer is "whichever request the attacker chose". That is precisely what the Mongo/Postgres split produced here.

**Mechanism.** Column table: for each invariant, name the single enforcing layer. Anything enforcing it elsewhere is either deleted or converted into a *defence-in-depth* comment that says so. Add a CI check for duplicate route registrations — a second class with an already-registered name is a silent shadow (`projects-mongo.controller.ts:180` vs `database.controller.ts:65` is the live example, and it cost four working routes).

**Verdict: `BROKEN`.** Two parallel application layers enforce overlapping, divergent rules. The same "one team per event" idea exists as a `@@unique` in Postgres and as ad-hoc logic in two places elsewhere.

---

## 4. Determinism

**Rule.** Any computation that affects a decision, a score, a hash, an ordering, or an assignment is a pure function of its declared inputs. No `Math.random()`, no `Date.now()`, no `process.env`, no network, no iteration over an unordered collection. Where a random or time-dependent value is genuinely required, it is **generated once, stored, and reused** — never re-derived.

**Why.** C4 requires that ranking be re-derivable from raw inputs. A single `Math.random()` in the seed (`seed.ts:465`) means two runs produce different ballots, so no result is reproducible and no bug is bisectable. A hardcoded `shuffleSeed` default (`schema.prisma:123`) makes assignment order predictable to anyone who reads the source — deterministic in the worst possible direction.

**Mechanism.**
- Seeded PRNG (mulberry32/xorshift) for all fixtures. `Math.random()` is banned in `prisma/` — enforce with ESLint `no-restricted-globals`.
- Every domain function takes all inputs as parameters. No reading `Date.now()` inside a scoring function — pass `now` in.
- Randomised-but-persisted: `Event.shuffleSeed` is generated with `crypto.randomBytes` at event creation and stored. Re-running assignment uses the stored seed. This is the *correct* pattern and it is already 90% implemented (`schema.prisma:123`) — it just needs a random default.
- Sort before hashing or comparing. Iteration order of a JS `Set` or a Mongo cursor is not a stable input to a hash.
- Golden-file tests: a fixed input must produce a byte-identical output, checked in CI. This is the only way to detect a dependency upgrade that changes a sort comparator.

**Verdict: `BROKEN`.** `seed.ts:465` and `seed.sqlite.ts:455` use `Math.random()`. `schema.prisma:123` hardcodes the shuffle seed. `trust.service.ts` verification depends on UTC ordering of timestamps with no monotonic sequence. `intelligence.service.ts` heuristics are deterministic — keep that property and test it.

---

## 5. Purity at the core

**Rule.** The domain layer — ranking maths, hash chain, state transitions, heuristics, tie-breaks — imports nothing. Not NestJS, not Prisma, not `fs`, not `process`. Its functions take inputs and return outputs.

**Why.** This is what makes the core testable at the speed of a unit test. Today, verifying the hash chain requires a database, which is why B3 (`run-benchmarks.js:103-145`) needs a live Prisma read, and why the tie-break rules can only be checked against seeded rows. Pure functions would be tested in milliseconds with exact inputs — and the ranking maths, the one place a subtle bug silently changes winners, would finally be exhaustively testable.

**Mechanism.**
- `apps/api/src/domain/` with **no framework imports at all**. Enforce with an ESLint boundary rule and a dependency-cruiser check in CI.
- The repository pattern below it: `apps/api/src/*/*.repository.ts` is the only place Prisma is imported.
- Signing a ballot hash requires serialising a payload. That serialisation is a pure function and belongs in the domain layer; the `INSERT` does not.

**Verdict: `ABSENT`.** `ranking.service.ts` and `trust.service.ts` mix domain maths with Prisma calls in the same method. There is no `domain/` directory. This is why there are no unit tests in the repository.

---

# II. Design

## 6. One source of truth

**Rule.** For each fact, exactly one store is authoritative. A second store is a cache, a projection, or an error. Derived data is never authoritative, and no decision may read from a derived store.

**Why.** Two stores that both claim authority means the answer to "what is true?" depends on which endpoint the caller used. That is not a data-model preference; it is a correctness hazard with a security dimension — if the authoritative store has strong integrity guarantees and the other does not, then the weak one is a full bypass of those guarantees.

**Mechanism.**
- `README.md`, `ARCHITECTURE.md` and `acceptance-report.txt` name exactly one system of record. Enforce with a test asserting a single configured datastore and a startup assertion that fails if an undeclared one is reachable.
- Derived stores declare their derivation and invalidation. `RankedProject` is a projection of `Ballot`; it is rebuilt, never edited.
- If a second store exists, the write path to it goes through the module that owns the first, and its consistency requirement is written down.
- **A derived value must never feed an authoritative decision.** If the ranking depends on a dashboard number, the design is wrong.

**Verdict: `BROKEN`.** Postgres is documented as the source of truth and is *deliberately not connected* (`prisma.service.ts:16-21`). MongoDB is what the UI reads. `apps/api/.env:4` points Prisma at a `mongodb://` URL against a `postgresql` provider. A second, unauthenticated trust ledger exists in Mongo, so the append-only guarantee can be voided by anyone who finds `POST /database/clear`. This is the single most consequential structural violation in the repository.

---

## 7. Boundaries and dependency direction

**Rule.** Modules communicate through explicit interfaces and domain events, never by reaching into another module's tables. Dependencies point downward only: presentation → interface → application → domain → infrastructure. No cycles, ever.

**Why.** A boundary that is a convention rather than a constraint is a suggestion. The `DatabaseModule` reaching straight to Mongo for projects, ballots, and the trust ledger crosses every boundary in the system at once.

**Mechanism.**
- Each module owns its tables. Cross-module reads go through the owning module's service. Cross-module writes are forbidden.
- `trust` is **write-only from the outside**: other modules append, nobody reads or mutates. That is what makes the integrity guarantee meaningful.
- **Domain events are the seam** — publish `BallotLocked`, `RubricLocked`, `RankingPublished` on an in-process emitter. This is what makes later features (notifications, exports, the ceremony) additive rather than invasive, and it is the honest prerequisite for an out-of-process broker later.
- `dependency-cruiser` or `eslint-plugin-boundaries` in CI, failing the build on a forbidden edge. A cycle is a build error, not a review comment.

**Verdict: `GAP`.** The guarded modules respect boundaries reasonably well and the service-layer decomposition is genuinely clean. `DatabaseModule` violates every boundary at once, and the duplicate `JudgingMongoController` shows the boundary is not structurally enforced — a second class with the same name registered from a different file.

---

## 8. Delete, don't accumulate

**Rule.** When a design changes, the old design is **deleted in the same change**. No `legacy`, no `v2-old`, no "temporary" comment older than one release, no dead route kept "just in case".

**Why.** Accumulated dead code is not neutral. It is a false affordance: it looks like a working feature, so the next engineer trusts it, documents it, and builds on it. Every serious finding in `NOTES.md` traces to this:

| Dead thing | What it caused |
|---|---|
| Second `JudgingMongoController` (`projects-mongo.controller.ts:180`) | 4 working routes return 404; the client (`api.ts:518,530,540,545`) calls them; a receipt claims they passed |
| `schema.sqlite.prisma` + `seed.sqlite.ts` | Two sources of truth for 28 models; `dev.db` committed to git |
| `common/types.ts` | Enums can drift from the Prisma schema |
| Duplicate `PrismaService` provider (`app.module.ts:15-30`) | Two connection pools against one database |
| Stale `apps/openapi.yaml` | A second contract that disagrees with the first and with the code |
| `JWT_SECRET`, `REDIS_URL`, `STORAGE_*`, `SMTP_*`, `AI_PROVIDER` | An operator's mental model of the system is wrong in five places |
| `JudgingMongoController` routes in the generated spec | The public contract advertises a fixture stub |

**Mechanism.**
- Dead code is a build failure. `knip` or `ts-prune` in CI flags unused exports, files, and dependencies; the build fails above a threshold of zero.
- No file may be named `*.old.*`, `*.bak`, `*_v1`, or contain "deprecated" for more than one release — enforced by a CI grep.
- A `git log --diff-filter=D` review at each milestone: anything still referenced after a phase must be justified in writing.
- Deleting is a *complete* action. Removing the Mongo layer means removing its routes, its spec entries, its client wrappers, its Compose service, its env vars, and its benchmark checks in one change. A partial delete leaves a trap.

**Verdict: `BROKEN`.** Nine distinct accumulations identified, each with a live consequence.

---

## 9. Design for the constraint, not the average case

**Rule.** Design to the system's actual binding constraints and stated non-goals, and write the non-goals down. Optimise for correctness under real load; do not pre-build for scale that will never arrive.

**Why.** The two failure modes are equally bad: over-engineering for hypothetical load, and under-engineering for the real constraint. This system's real constraint is **provable correctness under modest load** (200 judges, 500 projects), not throughput. The k6 spike test asserts 4,000 VUs (`k6/spike.js:12-35`) — 20× the realistic peak — and the honest framing is "how far from the cliff are we", never "we handle 4,000 users".

**Mechanism.**
- Six constraints and a non-goals list, written down (`SYSTEM-DESIGN.md` §1.3, §18.4). Every proposal is evaluated against them.
- **Non-goals are enforced, not just listed.** No plugin marketplace, no microservices, no WebSockets, no multi-tenancy, no outbound network call. A PR that violates a non-goal needs a stronger argument than convenience.
- Load tests label the scenario: `realistic` vs `headroom`. Never present a headroom number as capacity.
- Do not add infrastructure before measuring. Redis is in Compose, read by nothing — a premature cache on an unmeasured workload adds invalidation bugs and removes zero milliseconds.

**Verdict: `GAP`.** The constraints are well chosen and the monolith decision is correct. But the non-goals are never written down, and the 4,000-VU spike is presented as capacity evidence rather than a headroom probe.

---

# III. Security

## 10. Deny by default

**Rule.** Access is denied unless it is explicitly granted. Every endpoint declares, in code, whether it is `@Public()` or requires a session; every authenticated endpoint declares required roles. Absence of a declaration is a **build error**, never an implicit grant.

**Why.** "Public" expressed as *omission* means every forgotten guard is an open door, and the failure is silent. This is the root cause of the most severe class of finding in this repository: 37 unauthenticated routes, including data wipe, full database export, and ballot injection.

**Mechanism.**
- `AuthGuard` **rejects** a missing or invalid token. Today it returns `true` for both (`auth.guard.ts:12-15, 26-28`) — it is a decorator, not an enforcer.
- `@Public()` is the *only* way to open a route, so opening one is a greppable, reviewable line someone wrote.
- CI check: **every controller method has `@Public()` or `@Roles(...)`. No exceptions, no allowlist file.** This single check would have prevented the entire finding class.
- A public allowlist in one visible place (`SYSTEM-DESIGN.md` §9.5): health, published events, published ranking, normalization proof, trust verify, receipt lookup. Roughly six read endpoints. Everything else requires a session.
- The fail-open `AuthGuard` is the highest-priority single-line fix in the repository.

**Verdict: `BROKEN`.** 7 controllers with zero guards, 37 open routes, a fail-open guard, and no `@Public()` decorator anywhere. `README.md:85` and `.dogfood.toml:38` both claim backend-enforced role isolation.

---

## 11. Authorise the object, not just the role

**Rule.** Authentication answers *who*. Role checks answer *may this role*. Neither answers *may this user touch this row*. Object-level authorisation is a separate, mandatory check in the service layer, and it is enforced **in the query**, not after the fetch.

**Why.** Role-based access control alone means every judge can read every ballot in the event. Judge isolation (`README.md:87`) is a *product requirement* that RBAC structurally cannot express. And fetch-then-check leaks existence through response timing and status codes — a `403` for a row that does not exist and a `403` for one that does are the same response only by accident.

**Mechanism.**
- Every query filters by the caller's own scope: `where: { eventId, judgeId: caller }`. Not `findUnique` then `if (!allowed) throw`.
- CI check: no controller may call a service method that takes an id without also passing the caller's identity.
- A test per resource asserting that user A gets `403`/`404` for user B's object. Object-level authz has no test suite today, which is why `GET /judge/scores/{judgeId}` (`dogfood.controller.ts:87`) ships open — it returns another judge's scores to anyone.
- Admin is not a universal bypass. `RolesGuard` grants `ADMIN` unconditionally (`roles.guard.ts:14-52`), so one compromised admin session reads every ballot. Scope admin to administration operations.

**Verdict: `BROKEN`.** `GET /judge/scores/:judgeId` returns another judge's scores unauthenticated. `GET /projects/:id` returns that project's ballots unauthenticated. `teams.controller.ts:25` and `submissions.controller.ts:28,33` have no `@Roles` at all.

---

## 12. Never trust the client

**Rule.** The client supplies intent, never facts. Deadlines, roles, eligibility, scores' weights, timestamps, and identifiers are all resolved server-side. A client-supplied value is validated, never trusted.

**Why.** Every place a client value is trusted is a place the client can lie. The freeze deadline is the clearest case: if the client sends the time, the entire freeze guarantee is decorative.

**Mechanism.**
- **No client-supplied timestamp in any DTO.** Deadlines compare against the server clock, always.
- `Event.shuffleSeed` is server-generated and stored, never client-supplied. The current hardcoded default (`schema.prisma:123`) is trusted *and* predictable.
- `role` is never read from a request body. `auth.service.ts:11` takes `role: Role = Role.PARTICIPANT` from the caller — a self-escalation vector on any open registration endpoint. Ignore the parameter; default to `PARTICIPANT` and use an organiser invite to create judges.
- Weights and normalisation parameters are validated against the locked rubric server-side. A sandbox that "simulates" arbitrary weights must still validate them.
- Server-side score validation: clamp to `criteria.minScore`/`maxScore` at the boundary, never trust the submitted number.

**Verdict: `BROKEN`.** Caller-settable `role` on register; a hardcoded, publicly-knowable `shuffleSeed`; and the Mongo path accepts unfrozen submissions (`projects-mongo.controller.ts:67`), which is the freeze guarantee bypassed wholesale.

---

## 13. Verify every credential

**Rule.** A credential is not a credential until it has been cryptographically verified against the issuer. Unverified input is **attacker-controlled input**, regardless of where it came from.

**Why.** This is the most severe finding in the repository and it is a two-line bug. `auth.service.ts:60-75` base64-decodes an attacker-supplied token, reads `payload.email` out of the unsigned payload, and on any failure silently falls back to a caller-supplied `email` — then looks up that user and creates one if absent. `POST /api/v1/auth/google {"email":"admin@..."}` returns a valid session for the admin. Because `RolesGuard` grants `ADMIN` unconditionally, that is one request to full platform control.

**Mechanism.**
- Google credentials verified against JWKS (or `tokeninfo`): signature, `iss`, `aud`, `exp`, and `email_verified`. Use `google-auth-library` rather than hand-rolling.
- **The email-fallback path is deleted entirely.** It is the actual vulnerability; the JWT parsing is merely the front door.
- `googleId` stored with a `@unique` index. Never auto-link an account by email match alone — that is account takeover via a permissive identity provider.
- No silent `catch`. The current `catch (err) { /* Fall back */ }` (`auth.service.ts:72-74`) converts a verification failure into a successful login. **A `catch` that changes an auth outcome from fail to succeed is a vulnerability, and CI should flag `catch` blocks in the auth module outright.**
- Every authentication decision emits an audit event: success, failure, provider, and the asserted subject.

**Verdict: `BROKEN`.** Fix before anything else in the security track. This is a one-request privilege escalation to `ADMIN`.

---

## 14. Secrets are not configuration

**Rule.** Secrets come from the environment or a secret store at runtime. They are never in the repository, never in an image layer, never in a committed database file, never in a log line, never in an API response.

**Why.** A committed secret is a permanent leak — git history is forever, and every clone and CI cache has it. A secret in an image layer is equally permanent, and `docker history` reveals it to anyone who can pull.

**Mechanism.**
- `.gitignore` + `gitleaks` in CI. **`apps/api/prisma/dev.db` is committed right now** despite `.gitignore:37` — the ignore rule was added and the file force-added anyway. That is exactly the failure the check exists to catch.
- `.dockerignore` excluding `.env*`, `*.db`, `node_modules`, `.next`, `dist`, `.git`. **There is no `.dockerignore`, and `Dockerfile.api:9` does `COPY apps/api ./apps/api` — so `apps/api/.env` (with `JWT_SECRET` and DB credentials) is baked into a layer.** Assert in CI via `docker history --no-trunc` that no layer contains a secret.
- A typed config module that redacts at the logger, not at call sites. Call sites are where people forget.
- CI test: no password, token, URI, or `DATABASE_URL` appears in any response body. `GET /database/status` currently leaks the Mongo URI (`database.controller.ts:31-32`).
- `JWT_SECRET` is declared in four files and read by none. **Delete every secret-shaped variable that nothing reads** — a variable nobody reads is a false promise that someone will later start reading.

**Verdict: `BROKEN`.** `dev.db` committed; no `.dockerignore` and `.env` baked into the image; Mongo URI leaked in a response; four dead secret variables.

---

## 15. Least privilege by construction

**Rule.** Every component and credential gets the minimum access it needs, and the minimum is the default. Removing capability must be easier than adding it.

**Why.** `POST /database/clear` and `GET /projects/export/json` require no privilege at all, which is the strongest possible statement that privilege was never modelled. A Redis, a MinIO, and a MailHog run in Compose that no code path uses — that is privilege granted to nothing.

**Mechanism.**
- Separate DB roles per concern: read-only for the gallery, read-write for judging, DDL only for migrations. The gallery role physically cannot read a ballot.
- The `web` container gets no database credentials at all. It talks only to the API.
- Feature-flag anything that is not part of the product, and default it off. `DogfoodController` should exist only behind an explicit `ENABLE_DEMO_ROUTES` in a dev-only module — a fixture stub that is *documented as public API in the shipped OpenAPI spec* (`openapi.yaml:216-281`) is a permanent, unauthenticated capability.
- Destructive operations (`/database/clear`, `/database/reseed`, `/autopilot/apply`) require `ADMIN` **and** an explicit `--i-mean-it` confirmation, and always emit an audit event.
- Seeded accounts: **one documented demo password, printed by the seeder** — never one bcrypt hash reused across admin, organizer, and all 30 judges (`seed.ts:44,47,60,235,310`).
- Session TTL in hours with rotation, not 30 days without (`auth.service.ts:102`). TOTP for `ORGANIZER` and `ADMIN`.

**Verdict: `BROKEN`.** No privilege model exists on the demo path. `POST /database/clear` and `GET /projects/export/json` are anonymous. One shared seeded password across 32 privileged accounts.

---

# IV. Data

## 16. Append-only where it counts

**Rule.** Evidence — audit events, integrity hash nodes, submitted ballots, frozen content, published rankings — is **append-only**. Corrections are new records. There is exactly one append-only ledger, and it is the authoritative one.

**Why.** An append-only guarantee is void the moment one unauthenticated route can delete a row. The Postgres chain is genuinely well designed (a chain, not per-record hashes, so it detects deletion *and* reordering — the two attacks that matter most for a results system). But `projects-mongo.controller.ts:433-490` implements a **second** ledger in Mongo, writable by anyone via `POST /trust/commit` and erasable via `POST /database/clear`. So the guarantee in `THREAT-MODEL.md:23-31` holds only on one of two paths.

**Mechanism.**
- `trust` exposes `append()` and `verify()`. No `update`, no `delete`, ever. Enforce with a repository that does not export them.
- `AuditEvent.actor` is `Restrict` (`schema.prisma:401`) — a user in the audit log cannot be deleted. **Keep that.** `AuditEvent.event` is `SetNull` (398), which lets event deletion orphan the trail; use `Restrict` or soft-delete.
- One ledger. Delete the Mongo implementation.
- **Verify on a schedule, not only on request.** A `GET /verify` a human clicks proves nothing about 03:00. Verify every 5 minutes, store the result, alert on change.
- Anchor the chain head externally — a file plus a printed checksum offline, a public append-only log online. Without anchoring, DB-write compromise is undetectable.
- State the retention policy. "Append-only" and "immutable forever" are different promises and the difference matters for a records system.

**Verdict: `GAP`.** The Postgres chain is good. A second unauthenticated ledger voids it, and verification is never scheduled.

---

## 17. Migrations are history

**Rule.** Schema changes ship as committed, ordered, reviewable migrations — never `db push`. Expand/contract: never drop a column in the same release that stops writing it. Every migration is either reversible or explicitly marked irreversible with a reason.

**Why.** `db push` diffs the live database and mutates it. There is no record of what changed, no rollback, no review, and no way to tell whether two environments match. For a system whose value is auditability, having an unauditable schema is self-refuting. `Dockerfile.api:30` runs `migrate deploy` against a `migrations/` directory that does not exist.

**Mechanism.**
- `migrations/` committed. `migrate deploy` in production, `migrate dev` locally. CI runs `prisma migrate diff` and fails if the schema and migrations disagree.
- Backfills are idempotent, resumable jobs — **never inside the migration transaction**, which holds locks and leaves the DB half-migrated on failure.
- Two-release rule for destructive changes: *n* stops writing, *n+1* drops.
- Seed scripts are **not** run on container start. `Dockerfile.api:30` runs the destructive seed on every start, and `seed.ts:17-39` deletes all 23 tables. A restart must never be able to destroy data.
- One schema, one seed. Delete `schema.sqlite.prisma` and `seed.sqlite.ts`.

**Verdict: `ABSENT`.** No `migrations/` directory; the README instructs `prisma:push`; the destructive seed runs on every container start.

---

## 18. Idempotency as a default

**Rule.** Any mutating operation a client might retry is idempotent. Retries are the normal case, not the exception — venue Wi-Fi fails mid-submit, and a judge who loses a ballot will hit save again.

**Why.** A lost ballot is the worst failure this system can produce. A judge who believes they submitted, who did not, and who discovers it after publication, has a legitimacy problem the platform cannot repair. Non-idempotent writes turn a network blip into a data-integrity incident.

**Mechanism.**
- `Idempotency-Key` header on every mutation; key + body stored with the response for a TTL.
- Same key + same body → stored response, no re-execution. Same key + different body → `422`.
- Natural keys do the work where they exist: `@@unique[projectId,judgeId,rubricVersionId]` makes ballot submission naturally idempotent. **Use the unique constraint — do not check-then-insert, which races.**
- `benchmarks/harness.js:394-395` already sends two identical ballot POSTs. Turn it into an assertion.
- Optimistic UI for ballot scoring is only safe *because* the submit is idempotent. That dependency should be explicit.

**Verdict: `GAP`.** The natural key exists and the harness probes it, but nothing asserts idempotency, and there is no `Idempotency-Key` support anywhere.

---

## 19. Concurrency is a design input

**Rule.** Identify every race in the system, name the mechanism that resolves it, and test it. One mechanism is not a general answer — a double-submit, two organizers publishing, and a judge scoring while being recused are three different problems.

**Why.** These are not exotic. Two organizers double-clicking publish at the end of a hackathon is the normal case, not the tail. Judging is a write-heavy workload with multiple actors on the same rows.

**Mechanism.**

| Race | Mechanism | Status |
|---|---|---|
| Double ballot submit | `@@unique` + upsert + idempotency key | Constraint ✅, not asserted |
| Two organizers publish | `SELECT … FOR UPDATE` on `Event`, or optimistic `version` CAS | **App-level only** |
| Judge scores while being recused | Re-check `JudgeConflict` **inside** the ballot transaction | **App-level only** |
| Recusal vs. assignment generation | Re-issue in one transaction, excluding the recused judge; `@@unique[projectId,judgeId]` (318) prevents duplicates | Postgres ✅ / Mongo is dead code |
| Simultaneous chain appends | Append under the same row lock; the tip hash is denormalised onto `Event` | **App-level only** |

- Every one of these gets a concurrency test: two parallel requests, assert exactly one wins.
- B5 (`run-benchmarks.js:189-214`) — the weight-sandbox non-mutation invariant — is a real concurrency test and the best one in the repository. Keep it, and write one per race above.

**Verdict: `GAP`.** Constraints are well chosen and the one non-mutation test is real. Every actual race is handled in application code with no test, and the duplicate `PrismaService` provider means two connection pools can contend against one database.

---

# V. Interfaces

## 20. One client, generated types

**Rule.** Exactly one HTTP client, in one place. No `fetch` outside it. All API types are **generated** from the OpenAPI spec, never hand-written.

**Why.** Hand-written types and hand-written paths drift silently and are never detected. `apps/web/src/lib/api.ts` is 785 lines of carefully written wrappers that **8 of 9 pages do not use** — the pages hand-roll their own URL strings. The result: five routes that 404 and two response-shape mismatches, none of which any test or type check catches, because the client was never the source of truth for anything.

**Mechanism.**
- ESLint `no-restricted-imports` banning `fetch` outside `lib/api`. Enforced, not documented.
- `openapi-typescript` in CI; generated types committed. A hand-edited type file fails the build.
- Response shapes come from response DTO classes, so a service returning a bare array when the client expects `{events: []}` is a **compile** error rather than a runtime `undefined`.
- One auth strategy: `httpOnly` + `Secure` + `SameSite=Strict` cookies, so an XSS cannot read the token. `api.ts:13` acknowledges the `localStorage` problem without fixing it.

**Verdict: `BROKEN`.** 8 of 9 pages bypass the client. Five known 404s, two known shape mismatches, no generated types, and `api.ts:776-784` is the repo's own TODO list of endpoints that were never built.

---

## 21. Contracts are verified, not documented

**Rule.** The API contract is generated, committed, validated, and **diffed in CI**. Any drift between code and spec fails the build.

**Why.** The current arrangement makes drift structurally invisible. The spec is written at runtime by the app that is being described (`main.ts:35-43`) and committed — so it can only ever describe what the code already does, never what the code *should* do, and comparing it to anything is circular. Meanwhile a **second** stale copy exists (`apps/openapi.yaml`, 92 lines behind) that declares a fictional `bearerFormat: JWT` for what are opaque hex tokens, and the generated spec has an empty `components:` block — no `securitySchemes`, no response schemas on any of 84 operations, so no codegen and no validation are possible.

**Mechanism.**
- Spec generation is an explicit script (`npm run openapi:emit`), never a side effect of booting. A boot that writes to a tracked file dirties the working tree every time.
- Response DTO classes with `@ApiResponse({ type: ... })` on every route, so schemas are generated rather than hand-written.
- CI: regenerate → diff → fail on any difference.
- Spectral (or `@stoplight/spectral-cli`) in CI. `BENCHMARKS.md:488` already tells contributors to do this and no step exists.
- One spec, one location. Delete `apps/openapi.yaml`.
- Demo and fixture routes are excluded from the published contract or live behind a dev-only flag. Advertising `/gallery` and `/judge/scores` as public API (`openapi.yaml:216-281`) is publishing an unauthenticated capability as a feature.

**Verdict: `BROKEN`.** Runtime-generated, committed, duplicated, schema-less, untested, and advertising the fixture stub.

---

## 22. Errors are part of the API

**Rule.** Errors are typed, coded, documented, and stable. `code` is machine-readable and never changes meaning; `message` is for humans. Every failure mode has a defined status code and a defined response shape.

**Why.** An undocumented error is an outage with extra steps. If a client cannot distinguish "403, you are not permitted" from "404, it does not exist" from "409, wrong state", it cannot produce a useful message, and neither can an operator reading a log.

**Mechanism.**
- One exception filter producing `{ error: { code, message, details?, traceId } }` across the whole API.
- Every DTO failure is `400` with per-field `details`. Every semantic failure is `422`.
- `404` is returned for objects the caller may not know exist — **existence must not leak through status codes** (see principle 11).
- `409` for every illegal state transition, citing the state machine. This is where `SUBMISSION_FROZEN` and `RESULTS_PUBLISHED` violations land.
- Every 4xx/5xx is logged with `traceId` and correlated to the `AuditEvent` for security-relevant denials.
- Error codes are enumerated in the OpenAPI spec, so clients can generate exhaustive handling.

**Verdict: `GAP`.** `THREAT-MODEL.md:25-31` specifies correct status codes for five attack vectors, which is a good start. There is no global filter, no error envelope, and no documented error code set.

---

# VI. Delivery

## 23. It must build

**Rule.** The documented one-command path is the acceptance test for the build. If `docker compose up` does not produce a working system from a clean clone, the system does not exist.

**Why.** This is not a theoretical standard. `docker compose up` is **documented three times** — `README.md:9-28`, `acceptance-report.txt:30` ("seeded portal ready in < 90s"), and `.dogfood.toml:46` (`cold_start_seconds = 45`) — and it fails in three independent ways:

| Blocker | Evidence |
|---|---|
| `Dockerfile.web:26` copies `/app/apps/web/public`, which does not exist | `Test-Path` → `False`; absent from `git ls-files` |
| `Dockerfile.api:30` runs `ts-node` after `npm install --omit=dev` (line 20); `ts-node` is a devDependency (`apps/api/package.json:44`) | Runner has no `ts-node` → the `&&` chain fails → the API never starts |
| Compose has no MongoDB service while the UI only calls Mongo routes | `docker-compose.yml:4-56` |

Plus: the destructive seed runs on **every** start (`seed.ts:17-39` deletes 23 tables).

**Mechanism.**
- CI builds both images from a clean clone and runs the compose stack end to end. A PR that does not build does not merge.
- `npm ci`, never `npm install` — a build that ignores the lockfile is not reproducible.
- Pin base images by digest (`node:20-alpine` floats).
- Compile the seed to JS in the build stage. **`ts-node` in a production `CMD` is the tell that the build and run stages were never tested separately.**
- The build must succeed on a machine with **no** `node_modules`, no Docker layer cache, and no network — because that is the documented air-gapped scenario.

**Verdict: `BROKEN`.** The flagship one-command path is documented three times and does not work.

---

## 24. Configuration is typed and validated

**Rule.** All configuration enters through one typed module that parses `process.env` and **throws** on a missing or malformed required value. No `process.env.X` scattered through services.

**Why.** Scattered `process.env` reads are why the incoherence went unnoticed. `JWT_SECRET`, `REDIS_URL`, `STORAGE_*`, `SMTP_*`, `AI_PROVIDER` are declared in four files and read by nothing, while `MONGODB_URI` — which the app genuinely requires — appears only in a gitignored `.env` that nobody outside this machine can see. Compose therefore runs a Redis, a MinIO and a MailHog that no code path uses, and omits the one service the UI needs.

**Mechanism.**
- One `config` module, one schema, typed exports. `process.env` appears in exactly one file.
- **Startup validation throws.** A required variable that is missing is a startup failure, not a warning.
- **Fail fast on an unreachable database.** `prisma.service.ts:19-21` swallows the connection error with an empty `catch`; the consequence is that Postgres being down produces a *half-working app* rather than an error. The single most consequential line in the deployment story.
- **Every variable is read by code or deleted.** Enforce with a test that reflects over the config schema and asserts every key is consumed, plus a lint for unused keys in `.env.example`. An env var nobody reads is a lie in the operator's mental model.
- Document the **air-gapped** variable set explicitly. It is the product's differentiator, and today `.env.example` is a hosted/production template while the offline variables live in an untracked file.

**Verdict: `BROKEN`.** Five dead variables, two undocumented live ones, and a swallowed database connection error that converts a hard failure into a silent one.

---

## 25. No root, no secrets in layers

**Rule.** Containers run as a non-root user. Image layers contain no secrets, no `.env`, no database files, and no `.git`. Verified in CI, not assumed.

**Why.** Neither Dockerfile sets `USER`, so both images run as **root**. With no `.dockerignore`, `Dockerfile.api:9` bakes `apps/api/.env` — containing `JWT_SECRET` and database credentials — into a layer, and `Dockerfile.api:23` copies the whole `prisma/` directory including the committed `dev.db`. Anyone with the image or the registry cache has both the credentials and the data. A secret in a layer is permanent; `docker history` reveals it to anyone who can pull.

**Mechanism.**
- `USER node` (or equivalent) in every runtime stage.
- `.dockerignore`: `.env*`, `*.db`, `.git`, `node_modules`, `.next`, `dist`, `benchmarks/receipts`, `*.md`.
- CI: `docker history --no-trunc` on both images, asserted not to contain a secret pattern.
- CI: assert the container's default user is not root, by running `id`.
- Copy artifacts explicitly, never `COPY . .` in the runtime stage.

**Verdict: `BROKEN`.** Both images run as root; `.env` and `dev.db` are in the image; there is no `.dockerignore`.

---

## 26. The pipeline is the product

**Rule.** The quality gates **are** the delivery process. If a gate is not automated, it does not exist, regardless of how carefully it is described in a document.

**Why.** This repository has excellent prose and no pipeline. `ARCHITECTURE.md` documents a hash chain; `THREAT-MODEL.md` documents an attack matrix; `BENCHMARKS.md:9-19` states an outstanding honesty standard; and **there is no CI at all** — no `.github/workflows`, no linter, no type check, no unit test runner. The only automated check is `tests/run-benchmarks.js`, which the repository itself deprecates at lines 3-5, and two of whose nine checks cannot fail.

Consider what a pipeline would have caught, unaided:

| Gate | Defect it would have caught |
|---|---|
| `build` | Both Docker blockers; the missing `public/` |
| `typecheck` | The response-shape mismatches at `api.ts:217,313`; the duplicate `PrismaService` |
| `unit` (domain) | Nothing — the domain layer does not exist yet |
| `integration` | **B2 and B6, which cannot fail** |
| `contract` diff | The stale `apps/openapi.yaml`; the fixture stub in the published spec |
| `security` (`gitleaks`, `npm audit`) | The committed `dev.db` |
| `docker` (layers, non-root) | The baked `.env`; root user |
| `perf` (k6 budgets) | Every unsubstantiated latency claim |
| threat-matrix tests | All 37 unauthenticated routes |

Every serious finding in `NOTES.md` corresponds to a missing pipeline step. That is the strongest argument for building one, and the reason it precedes every other improvement: **the pipeline is what stops the defects from coming back.**

**Mechanism.** The full pipeline is specified in `SYSTEM-DESIGN.md` §16.5. In order of value: `typecheck` → `lint` → `unit` → `integration` → `contract` → `security` → `build` → `docker` → `perf`.

**Verdict: `ABSENT`.** No CI, no linter, no type check, no unit test runner. This is the top-priority item after the build is fixed.

---

# VII. Quality

## 27. A test that cannot fail is worse than no test

**Rule.** Every test must be able to fail. If you cannot describe the input that makes it red, delete it. A test that passes unconditionally is counted as coverage and provides none.

**Why.** This repository contains the clearest live example of the failure mode:

| Check | Why it cannot fail |
|---|---|
| **B2** (`run-benchmarks.js:75-98`) | Calls a local helper `evaluatePermission()` and asserts booleans **in-process. No HTTP request is made.** The receipt string at line 98 is a hardcoded literal. The README presents this as "Backend Role Isolation Matrix — 100% 403 enforcement" |
| **B6** (`run-benchmarks.js:220-221`) | `let b6Pass = true;` with a static detail string. Reads no env var, opens no socket. Presented as "100% functional with zero cloud dependencies" |
| **B1** (`:34-60`) | Times a live Prisma read with `Date.now()` against a 90 s target — trivially true |

Meanwhile 37 routes are genuinely unauthenticated and a forged Google credential genuinely issues an admin session. So the checks that cannot fail report 100% enforcement, and the real enforcement state is zero on the demo path. **This is worse than having no tests, because it converts an open vulnerability into a documented success.**

**Mechanism.**
- **Mutation testing on the critical suite.** Change `403` to `200` in the guard; a test that still passes is not a test. Run Stryker on the domain and security suites.
- **A failing-test demo in CI.** Periodically introduce a known defect and assert the suite goes red. A suite nobody has seen fail is a suite of unknown value.
- Coverage is measured on the **domain layer** and enforced ≥ 90% there. A repository-wide percentage hides the domain layer behind controller lines.
- Delete B2 and B6 rather than fixing them: they were proving a local helper, and the real proof is an HTTP test.
- `run.py:264` returns `0` unconditionally — it exits 0 even when every check fails, so it cannot gate anything. **A test runner that always exits 0 is a report generator, not a gate.**

**Verdict: `BROKEN`.** Two of nine checks are hardcoded, one is trivial, and the runner cannot fail a build.

---

## 28. Attack matrices are executable

**Rule.** Every row of a threat model is an automated test against a booted application. A threat model that is prose is a document; a threat model that is code is a control.

**Why.** `THREAT-MODEL.md:2` is a well-built matrix — five vectors with attacker profile, attempted action, expected control, HTTP status, and audit action. It is excellent, and **nothing checks any of it.** Meanwhile the one automated check that claims to verify role isolation (B2) never issues an HTTP request. The matrix and the test suite are describing two different systems, and only one of them exists.

**Mechanism.** Each row becomes a supertest case against a real instance with a real database. Enumerate the ones that must exist beyond the current five:

| Attack | Expected | Today |
|---|---|---|
| Judge reads peer ballots pre-publication | `403` | ⚠ |
| Participant advances event status | `403` | ⚠ |
| Post-deadline submission mutation | `400` | ⚠ |
| Tampered hash node payload | detected + audited | ⚠ |
| Republish after `RESULTS_PUBLISHED` | `409` | ⚠ |
| Unauthenticated `POST /database/clear` | `401/403` | ❌ **`200`** |
| Unauthenticated `GET /projects/export/json` | `401/403` | ❌ **`200`** |
| Forged Google credential | `401` | ❌ **session issued** |
| Ballot injection as a non-judge | `403` | ❌ open |
| Read another judge's scores | `403` | ❌ open |
| Non-organizer creates a judge account | `403` | ❌ open |
| Password or URI in any response body | never | ❌ leaks in `/database/status` |
| Password in any log line | never | ❌ unasserted |
| Weight simulation mutates `RankingRun` | count unchanged | ✅ **B5 — promote it** |

Also add the missing **threats**, not just the missing tests: ballot reopening abuse, the caller-settable `role` on register, session fixation, **judge collusion**, seeded-credential reuse, CSV/JSON export injection, and the predictable `shuffleSeed`.

**Verdict: `GAP`.** A strong matrix exists in prose. Exactly one row is tested (B5), and it is the non-mutation one rather than a security one.

---

## 29. Performance is a budget

**Rule.** Latency and throughput are **budgets with thresholds**, asserted in CI against a seeded instance. A budget nobody checks is a wish. A number measured once by hand and copied into a README is a decoration.

**Why.** This repository has excellent thresholds — `k6/smoke.js:4-50` (p95 < 300 ms, errors < 1%), `k6/spike.js:12-35` (read < 450 ms, write < 800 ms, error < 2%), `ARCHITECTURE.md:127` (verification < 1 s) — and **no k6 output file anywhere in the repository.** The committed receipt that claims `p95 = 2ms` comes from a script that times a single in-process `Date.now()` read, and the repository deprecates exactly that number at `run-benchmarks.js:3-5` ("Do not cite legacy 0.02s / 8ms metrics"). `acceptance-report.txt` reports `Total Test Duration: 0.17s` in the same breath as claiming a sub-90-second cold start.

**Mechanism.**
- A `perf` CI job runs the k6 suite against a seeded instance and **fails the build** when a threshold is breached.
- Budgets are declared in one file and consumed by both k6 and CI, so the numbers cannot diverge from the thresholds.
- **Cold start is measured honestly**: `docker compose up` → first successful request, on a cold machine with no layer cache, reported with the machine spec. `prisma.service.ts:16` currently *skips connecting* to Postgres — exactly the kind of shortcut that produces a flattering number.
- Never present a headroom figure (4,000 VUs) as capacity for a real workload (200 judges). Label the scenario.
- Track the p95 of the operations that matter, per `SYSTEM-DESIGN.md` §15.3. Prioritise N+1 elimination, cursor pagination, and caching the immutable (frozen projects, locked rubrics, published rankings never change).

**Verdict: `BROKEN`.** Well-designed thresholds, no output, and fabricated numbers in the committed reports.

---

## 30. Observability

**Rule.** Every request is traceable end to end. Every security-relevant decision is recorded. A failure is loud. An operator can answer "what happened at 14:03 during the freeze window?" — which is the one question this platform exists to answer.

**Why.** For a product whose value is auditability, having no telemetry is a structural contradiction. There is no structured logger, no request-ID middleware, no metrics, no tracing, and no error reporting. Failures are swallowed by empty `catch` blocks in at least four places: `prisma.service.ts:19-21, 27-29`, `mongo.service.ts:28-37`, `main.ts:40-43`, and the spec writer. An empty `catch` in a system like this is not a style issue — it is the mechanism by which `NOTES.md` F-6 (Postgres never connects, nothing says so) happened.

**Mechanism.**
- Structured JSON logging to stdout, one object per event, carrying `requestId`, `userId`, `eventId`, `route`, `durationMs`, `outcome`. Secrets redacted **at the logger**, not at call sites.
- **No empty `catch`.** ESLint `no-empty` as an error, plus a custom rule banning `catch` blocks in the auth module (principle 13). An empty `catch` must be a deliberate, commented decision to tolerate a specific failure.
- `requestId` propagated into every `AuditEvent` and `IntegrityHashNode`. The chain tells you *what* happened; the trace tells you *how long it took and what it touched*.
- `/api/v1/health` for liveness (never touches the DB) and `/api/v1/ready` for readiness (DB, migrations, chain). The distinction matters here because "Postgres is unreachable" is precisely a readiness failure being reported as health.
- `/api/v1/metrics` in Prometheus format for the metrics in `SYSTEM-DESIGN.md` §14.2.
- **Security events are alerting events.** A chain verification failure pages. So does an `auth_denied_total` spike. A tamper-detection capability nobody is watching is a log file.

**Verdict: `ABSENT`.**

---

# VIII. Honesty

> This section exists because it is the principle this repository most needs and least practises. `THREAT-MODEL.md:37-38` — *"Local hashing proves that the exported sequence of events has not been silently modified after creation. It does not prove physical control over the host"* — is the correct standard and should be the template for everything below. Read that note next to a receipt asserting `GROTH16_VERIFIED_1.4MS` from a codebase with no ZK library, and the gap is the whole story.

## 31. Never claim what you have not measured

**Rule.** A claim ships with its measurement: the command, the environment, the commit SHA, the date. If it was not measured, it is not claimed.

**Why.** `acceptance-report.txt` is the counterexample. It reports `Overall Status: VERIFIED GREEN (PASS)` and `Total Test Duration: 0.17s`, and is presented in `README.md:45` as official `run.py` output — but it is not `run.py` output. `run.py` prints T1/T2 labels with 8 checks; this file's layout, its B1–B9 IDs, and its duration line match `tests/run-benchmarks.js`, the script the repository itself deprecates at lines 3-5. So a reader is told a deprecated script produced the evidence for the flagship system. **`THREAT-MODEL.md:37-38` is honest; `acceptance-report.txt` is not. Both are in the same repository.**

**Mechanism.**
- A claim is a sentence plus a command plus a timestamp. No bare numbers in a README.
- Claims live in ONE place (`README.md`) and every number in it links to the artifact that produced it.
- When a measurement becomes impossible — a feature is deleted, an environment changes — the claim is **deleted in the same commit**. This is principle 8 applied to documentation.
- `BENCHMARKS.md:9-19` ("Honesty Rules First") is already an excellent standard. **Keep every clause and make the code comply.** The problem is the code, not the standard.

**Verdict: `BROKEN`.** Delete `acceptance-report.txt`. It is a transcription of a deprecated script, it overstates the system, and it is attributed to a tool that did not produce it.

---

## 32. Receipts are generated, not transcribed

**Rule.** Every benchmark receipt is emitted by code, in CI, with a commit SHA and an environment footer. Nobody types a number into a file.

**Why.** Hand-written evidence is unfalsifiable and, once wrong, permanently discredits the evidence that is right. Both committed receipts are wrong:

- `benchmarks/receipts/receipt-2026-09-24T18-12-39-629Z.json:38-52` claims `pairwise_elo_engine: passed` with Elo deltas — **against a route that is not registered** (`projects-mongo.controller.ts:180` is a shadowed second class declaration; the four routes 404). It cannot be reproduced.
- `benchmarks/receipts/receipt-2026-09-24T17-45-43-749Z.json` records **2 passed / 2 failed** — and was left in the repository next to its sibling.
- Both self-label `loopback: true` with no caveat tag, while `BENCHMARKS.md:16-17` requires loopback results to be labelled.
- The receipt's own table at `BENCHMARKS.md:549-560` is blank: `_______`.

**Mechanism.**
- CI emits receipts as build artifacts: `{ commit, environment, startedAt, durationMs, thresholds, results[], rawOutput }`.
- A receipt is valid only for the commit it names. A receipt for an older commit is history, not evidence, and must not be cited as current.
- **A failed receipt is committed too**, with the same prominence as a passing one. Deleting failures is the single fastest way to make a benchmark suite meaningless.
- Raw output is pasted, never transcribed (`BENCHMARKS.md:18`). A summary that does not match its raw output is discarded.

**Verdict: `BROKEN`.** One unreproducible receipt claiming a nonexistent route, one failing receipt retained, both uncaveated.

---

## 33. A budget number without a measurement is a wish

**Rule.** Every number in a document — latency, throughput, count, duration, percentage — is either measured by a committed artifact or removed.

**Why.** The unsourced numbers in this repository are specific and checkable:

| Number | Source | Reality |
|---|---|---|
| `p95 latency = 2ms` | `README.md:143` | Timed around one in-process `Date.now()` read; deprecated at `run-benchmarks.js:3-5` |
| `Total Test Duration: 0.17s` | `acceptance-report.txt` | Same script, and it contradicts the repo's own `< 90s` cold-start claim in the same file |
| `cold_start_seconds = 45` | `.dogfood.toml:46` | Nothing measures cold start; `prisma.service.ts:16` *skips* connecting to Postgres, which would flatter it |
| `docker compose up -> < 90s` | `acceptance-report.txt:30` | The web image cannot build; the API `CMD` cannot run |
| `sub-40 ms` recusal | `acceptance-report.txt:26` | No latency is measured anywhere. The advertised Mongo path is unregistered dead code |
| `GROTH16_VERIFIED_1.4MS` | receipt | No Groth16 or ZK library in any `package.json`. The field is a constant |
| `100% 403 enforcement` | `README.md:136` (B2) | B2 makes **no HTTP request** (`run-benchmarks.js:75-98`) |
| `100% functional, zero cloud deps` | `README.md:140` (B6) | `let b6Pass = true` (`run-benchmarks.js:220-221`) |
| `Execution time: < 1000 ms` | `ARCHITECTURE.md:127` | A reasonable target. Unmeasured, but honestly framed as a *target* — keep it framed that way |

**Mechanism.**
- A CI check greps the docs for numeric claims and requires each to link to a receipt. Unlinked numbers fail review.
- Prefer the phrasing "target: X" over "achieved: X" until X is measured. `ARCHITECTURE.md:127` already does this correctly.
- When a feature is deleted, every number describing it is deleted with it — the ZK receipt field, the pairwise receipt, the `<100 ms` recusal claim.

**Verdict: `BROKEN`.** Nine specific unsourced numbers, including the two that report 100% on capabilities that are at 0% on the live path.

---

## 34. Document the boundary of your guarantees

**Rule.** Every security or integrity guarantee states what it does **not** prove. A guarantee without a stated boundary reads as a stronger claim than it is.

**Why.** `THREAT-MODEL.md:37-38` gets this exactly right and is the best paragraph in the repository:

> *"Local hashing proves that the exported sequence of events has not been silently modified after creation. It does not prove physical control over the host running the software."*

That single note prevents an entire class of overclaim. It should be the house style. The same discipline applies to the chain's other limits (`SYSTEM-DESIGN.md` §7.2): a chain proves the sequence you kept is **unaltered**, not that it is **complete**; a per-record hash proves one record is intact but cannot detect deletion or reordering, which is why a chain is the right structure; and local hashing says nothing about whether the ballots inside it were cast in good faith.

**Mechanism.**
- Every guarantee in `THREAT-MODEL.md`, `ARCHITECTURE.md`, and `DATA-MODEL.md` gets a "does not prove" line. It is a required section, not a nicety.
- The most dangerous claims get theirs first: chain integrity, role isolation, reproducibility, offline capability.
- New features that make a security claim are rejected in review until the boundary is written.

**Verdict: `GAP`.** One exemplary note in `THREAT-MODEL.md`, applied nowhere else — while sibling documents claim JWT auth, ZK proofs, and 100% role enforcement without a boundary.

---

## 35. Delete the claim when you delete the code

**Rule.** Documentation is not a historical record. When behaviour changes, the documents describing the old behaviour are edited in the same commit.

**Why.** This repository has accumulated **three mutually incompatible taxonomies** for the same benchmark IDs: `README.md:103` says B1–B9; `tests/run-benchmarks.js:2,27` still says B1–B6 in a file that implements B1–B9; `BENCHMARKS.md:549-560` assigns completely different meanings (sub-100 ms recusal, p95 read, p95 write) to the same IDs. There is no way to look up what B4 means.

The pattern repeats throughout: a `LIVE`/`DEMO` split that no page respects, a spec advertising routes that are hardcoded fixtures, a data model that never grew an `ARCHIVED` state the architecture diagram shows, a JWT scheme for tokens that are not JWTs, and a README pointing at a report that a different tool produced. **Each is a small failure to update one file when another file changed.** Collectively they are why the documentation cannot currently be used to evaluate the system — and for a project whose thesis is *auditability*, untrustworthy documentation is a product defect, not a cosmetic one.

**Mechanism.**
- A PR that changes behaviour and does not change the docs that describe it **fails review**. Automated where possible: a grep-based check that flags stale endpoint paths and renamed files in `*.md`.
- One owner per document, named in the file.
- Quarterly doc-drift review: for each claim in `NOTES.md` §5, is it now true?
- When deleting a feature, search the docs for it. `grep -r` is the whole procedure.

**Verdict: `BROKEN`.** Three benchmark taxonomies, a stale duplicate spec, and ~15 specific claims contradicted by the code.

---

## 36. The rulebook applies to this document

**Rule.** These principles are not aspirational. They apply to the documentation, to the tests, to the commits, and to this file. Where this document describes a practice the repository does not follow, the document is either corrected or the practice is scheduled.

**Why.** A rulebook that describes an unreachable standard is the same failure as a README that claims an unmeasured number: it teaches the reader to discount the source. And the same trap is available here — a 36-principle document in a repository with no CI, no linter, and no type check could easily read as theatre.

**Mechanism.**
- Every principle carries a verdict (§ column) and a CI gate (Appendix A). A principle with neither is a preference, and preferences do not belong in a rulebook.
- `NOTES.md` §7 sequences the work. This document states the destination; that one is the route.
- **A principle is added only with its mechanism.** If you cannot name the check that enforces it, it is a value, not a rule — put it in `README.md` as such, or drop it.
- Revise the verdicts as the phases land. A rulebook whose verdicts are all `BROKEN` forever is a complaint, not a standard.

**Verdict: this is the document you are reading.** Its verdicts are the honest ones. The phases in `NOTES.md` §7 are how they change.

---

# Appendix A: Principle to CI gate

Every `ABSENT` or `BROKEN` mechanism above is a missing pipeline step. Build them in this order — the first four close entire defect classes.

| # | Gate | Principles enforced | Current |
|---|---|---|---|
| 1 | `typecheck` — `tsc --noEmit`, both workspaces | 5, 20, 2 | **missing** |
| 2 | `lint` — ESLint: `no-restricted-imports` (bans bare `fetch` outside `lib/api`), `no-restricted-globals` (`Math.random` in `prisma/`), `no-empty` as **error** (empty `catch`), boundary rules on `domain/` | 5, 8, 13, 20, 30 | **missing** |
| 3 | **authz declaration check** — every controller method has `@Public()` or `@Roles(...)` | 10, 11 | **missing** |
| 4 | `unit` — domain layer, no DB, no network, < 30 s, coverage ≥ 90% | 1, 2, 4, 5, 28 | **missing** (no `domain/`) |
| 5 | `integration` — booted app + real Postgres; the 14-row threat matrix; transaction-atomicity fault injection | 1, 3, 16, 18, 19, 28 | **missing** |
| 6 | `contract` — regenerate `openapi.yaml`, diff against committed, Spectral lint, fail on drift | 20, 21, 22 | **missing** |
| 7 | `security` — `gitleaks`, `npm audit --audit-level=high`, dependency review | 14, 25 | **missing** |
| 8 | `db` — `prisma validate` + `migrate diff`; schema and migrations must agree | 2, 17 | **missing** |
| 9 | `build` — both workspaces compile; `npm ci` only | 23 | **missing** |
| 10 | `docker` — build both images; `docker history` has no secret; `id` is not root; compose stack boots clean | 23, 25 | **missing** |
| 11 | `perf` — k6 smoke against a seeded instance; budgets asserted; receipts emitted with commit SHA | 29, 32, 33 | **missing** |
| 12 | `deadcode` — `knip`/`ts-prune`; zero unused exports, files, dependencies; no `*.old.*`/`*_v1` | 8 | **missing** |
| 13 | `config` — every config key is consumed; no `process.env` outside the config module; unused `.env.example` keys fail | 24 | **missing** |
| 14 | `secrets-response` — no password, token, or `DATABASE_URL` in any response body; no secret in any log line | 14, 22, 30 | **missing** |
| 15 | `docs` — grep `*.md` for endpoint paths and verify each is registered; flag stale numbers without receipts | 31, 33, 35 | **missing** |
| 16 | `mutation` — Stryker on the domain + security suites | 27 | **missing** |

---

# Appendix B: Review checklist

## Correctness
- [ ] Is each new invariant enforced at the lowest layer, and listed in the enforcement table?
- [ ] Are illegal states unrepresentable, or at least covered by one exhaustive test?
- [ ] Is the new logic deterministic — no `Math.random()`, no `Date.now()` inside a decision, no unordered iteration before hashing?
- [ ] Does the domain layer still import nothing?

## Design
- [ ] Is this a second source of truth for anything? (principle 6)
- [ ] Does the change cross a module boundary by reaching into another module's tables? (principle 7)
- [ ] Is anything being *added* that should be *deleted*? (principle 8)
- [ ] Does this violate a documented non-goal? (principle 9)

## Security
- [ ] Does the new endpoint declare `@Public()` or `@Roles(...)`? (principle 10)
- [ ] Is object-level authorisation enforced **in the query**? (principle 11)
- [ ] Is any fact taken from the client — timestamp, role, weight, id? (principle 12)
- [ ] Is every credential cryptographically verified, with **no** email fallback and **no** fail-open `catch`? (principle 13)
- [ ] Does any secret reach a file, a layer, a log, or a response? (principle 14)
- [ ] Is the minimum privilege identified, and is capability harder to add than to remove? (principle 15)

## Data
- [ ] Is this table append-only? If not, why not? (principle 16)
- [ ] Does this ship a migration, or a `db push`? Expand or contract? (principle 17)
- [ ] Is this endpoint retryable — and therefore idempotent? (principle 18)
- [ ] What is the race here, and which mechanism resolves it? Is it tested? (principle 19)

## Interfaces
- [ ] Is this `fetch` outside `lib/api`? (principle 20)
- [ ] Will the OpenAPI spec change, and will CI catch the drift? (principle 21)
- [ ] What is the error code, and is it in the spec? (principle 22)

## Delivery
- [ ] Does `docker compose up` still work from a clean clone? (principle 23)
- [ ] Is this variable read by code — or should it be deleted? (principle 24)
- [ ] Does this image run as non-root with no secrets in any layer? (principle 25)
- [ ] Which gate in Appendix A proves this change is correct? (principle 26)

## Quality
- [ ] **What input makes this test red?** If I cannot answer, delete it. (principle 27)
- [ ] Which threat-model row does this test? (principle 28)
- [ ] What is the budget, and is it asserted? (principle 29)
- [ ] If this fails at 14:03, what will the log say? (principle 30)

## Honesty
- [ ] Is every number in this PR measured, with a receipt? (principle 31, 33)
- [ ] Is the receipt generated by code in this commit? (principle 32)
- [ ] Does the new claim state what it does **not** prove? (principle 34)
- [ ] Which document am I updating in this same commit? (principle 35)

---

# Appendix C: Definition of done

A change is done when all of these are true. Not "it works on my machine".

1. `typecheck` and `lint` pass with zero warnings.
2. Every new invariant is enforced at the lowest layer **and** tested from outside.
3. Every new endpoint declares `@Public()` or `@Roles(...)`, and object-level authorisation is enforced in the query.
4. Every new endpoint is idempotent, or is documented as non-retryable.
5. Every new race is named, has a mechanism, and has a concurrency test.
6. The OpenAPI spec is regenerated, the diff is committed, and CI verifies it.
7. Every new claim carries a measurement, or is phrased as a target.
8. Every new security guarantee has a "does not prove" line.
9. `docker compose up` works from a clean clone with no layer cache.
10. **Every document describing the changed behaviour is updated in this commit.**
11. No dead code, no dead config, no dead route, no commented-out block.
12. The CI gate that proves this change is correct exists and is required.

---

# Appendix D: Anti-patterns in this repository

Concrete, file-referenced, and each with the principle it violates. This list is the practical form of `NOTES.md`; keep it current as items are fixed.

| # | Anti-pattern | Where | Violates |
|---|---|---|---|
| A1 | Guard that never rejects — returns `true` for both a missing and an invalid token | `auth.guard.ts:12-15, 26-28` | 10 |
| A2 | Trusting an unverified JWT payload, with a caller-supplied-email fallback and a silent `catch` | `auth.service.ts:54-98` | 13, 12 |
| A3 | "Public" expressed as omission — 7 controllers, 37 routes, no guard | `database.module.ts:10-18` | 10 |
| A4 | A second declaration of a class name, imported from a different file — 4 routes silently 404 | `projects-mongo.controller.ts:180` vs `database.controller.ts:65` | 3, 8 |
| A5 | Swallowed connection error turning a hard failure into a silent one | `prisma.service.ts:19-21` | 24, 30 |
| A6 | `return 0` unconditionally — a test runner that cannot fail a build | `run.py:264` | 27 |
| A7 | A test that asserts a local helper and makes no HTTP request, reported as "100% 403 enforcement" | `run-benchmarks.js:75-98` | 27, 31 |
| A8 | `let b6Pass = true` with a static detail string | `run-benchmarks.js:220-221` | 27, 33 |
| A9 | A receipt asserting a cryptographic proof no code in the repository can produce | `receipt-2026-09-24T18-12-39-629Z.json` | 31, 32 |
| A10 | A receipt claiming a route that is not registered | same receipt, `:38-52` | 32 |
| A11 | A report attributed to a tool that did not produce it | `acceptance-report.txt` vs `README.md:45` | 31, 35 |
| A12 | Three incompatible taxonomies for the same benchmark IDs | `README.md:103`, `run-benchmarks.js:2,27`, `BENCHMARKS.md:549-560` | 35 |
| A13 | A spec written at runtime, committed, and duplicated in a stale second copy | `main.ts:35-43`, `apps/openapi.yaml` | 21, 8 |
| A14 | A hand-curated 785-line client that 8 of 9 pages bypass | `apps/web/src/lib/api.ts` | 20 |
| A15 | One bcrypt hash reused across admin, organizer, and 30 judges | `seed.ts:44,47,60,235,310` | 15 |
| A16 | `Math.random()` in a seed, making every dataset unreproducible | `seed.ts:465` | 4 |
| A17 | A hardcoded, publicly-known `shuffleSeed` — deterministic in the worst direction | `schema.prisma:123` | 4, 12 |
| A18 | A destructive seed on every container start — a restart can delete all data | `Dockerfile.api:30` + `seed.ts:17-39` | 17, 23 |
| A19 | `ts-node` in a production `CMD` after `--omit=dev` — the build and run stages were never tested | `Dockerfile.api:20,30` | 23 |
| A20 | `COPY` of a non-existent directory — the image cannot build | `Dockerfile.web:26` | 23 |
| A21 | No `.dockerignore`, so `.env` and a committed `dev.db` are baked into a layer | `Dockerfile.api:9,23` | 14, 25 |
| A22 | No `USER` — both images run as root | both Dockerfiles | 25 |
| A23 | Five env vars read by nothing, two live ones documented nowhere | `.env.example`, `apps/api/.env`, Compose | 24, 8 |
| A24 | A committed SQLite database despite a `.gitignore` entry for `*.db` | `apps/api/prisma/dev.db` | 14 |
| A25 | Enums duplicated in TypeScript, free to drift from the schema | `common/types.ts:1-40` | 2, 8 |
| A26 | Two `PrismaService` providers — two pools against one database | `app.module.ts:15-30` | 8, 19 |
| A27 | Two schemas, two seeds, one of them committed as a `.db` | `prisma/` | 8, 17 |
| A28 | A rate limiter that is per-process, resets on restart, and is invisible to a second replica | `support.controller.ts:8-33` | 15 |
| A29 | Email "sent" by building a payload and commenting that it is simulated | `events.service.ts:432`, `support.service.ts:96` | 31, 33 |
| A30 | Excellent, honest boundary documentation sitting next to unearned claims in sibling documents | `THREAT-MODEL.md:37-38` vs `acceptance-report.txt` | 34, 31 |

**A30 is the one to internalise.** The repository already knows how to be honest about the limits of a guarantee — it says so explicitly, in one document, in the right words. The discipline is not missing. It is not applied consistently. Every other item in this table is a specific instance of applying it everywhere.

---

## Document map

| Document | Role |
|---|---|
| [`README.md`](./README.md) | Product promise and quickstart. **Update after remediation Phase 3** |
| [`SYSTEM-DESIGN.md`](./SYSTEM-DESIGN.md) | The design these principles protect |
| [`NOTES.md`](./NOTES.md) | Ground truth, findings, and the remediation backlog this rulebook sequences |
| [`AUTOPILOT-API.md`](./AUTOPILOT-API.md) | The automation feature, specified end to end. Applies principles 2, 5, 10, 33 throughout |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Short-form architecture. Accurate as far as it goes |
| [`DATA-MODEL.md`](./DATA-MODEL.md) | Entities and invariants |
| [`JUDGING.md`](./JUDGING.md) | Scoring, calibration, disagreement |
| [`THREAT-MODEL.md`](./THREAT-MODEL.md) | Assets, attack matrix, crypto boundary. **The honesty standard** |
| [`benchmarks/BENCHMARKS.md`](./benchmarks/BENCHMARKS.md) | "Honesty Rules First" — the measurement standard |
| [`ENGINEERING-PRINCIPLES.md`](./ENGINEERING-PRINCIPLES.md) | This document |
