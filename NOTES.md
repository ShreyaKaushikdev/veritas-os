# DOGFOOD OS — Engineering Notes, Flow Review & Findings

> **Purpose.** This is the *ground-truth* document. It records what the system actually does today, where the code contradicts its own documentation, and what must change before any of the published claims can be made honestly.
>
> **Status of every claim below:** verified by direct file read, with `file:line` evidence. No command was executed against a running server; runtime 404s and shape mismatches are derived from static route registration and are marked as such.
>
> **Companion docs.** Design intent lives in [`SYSTEM-DESIGN.md`](./SYSTEM-DESIGN.md). Normative rules live in [`ENGINEERING-PRINCIPLES.md`](./ENGINEERING-PRINCIPLES.md). This document is the *delta* between the two and the code.

---

## Table of Contents

1. [Executive summary](#1-executive-summary)
2. [The overall flow, end to end](#2-the-overall-flow-end-to-end)
3. [Two systems in one process](#3-two-systems-in-one-process)
4. [Findings — severity ranked](#4-findings--severity-ranked)
5. [Documentation drift matrix](#5-documentation-drift-matrix)
6. [Test & acceptance integrity](#6-test--acceptance-integrity)
7. [Remediation backlog](#7-remediation-backlog)
8. [Not yet reviewed](#8-not-yet-reviewed)

---

## 1. Executive summary

The domain design in this repository is genuinely good. The rubric versioning, ballot-to-locked-rubric binding, recusal with assignment re-issue, the append-only `AuditEvent` + `IntegrityHashNode` chain, three-tier deterministic tie-breaks, and the separation of ranking *preview* from *publish* are all sound decisions, and they are implemented in the Postgres/Prisma service layer.

The problem is that **none of it is what runs, and the documents describe a third thing that does not exist.**

Three concrete facts define the current state:

| Fact | Evidence |
|---|---|
| The Postgres service layer is largely bypassed at runtime. The connection is deliberately skipped and errors are swallowed. | `apps/api/src/prisma.service.ts:16-21` |
| The shipped UI talks exclusively to a second, entirely unguarded MongoDB application layer living in the same process. | `apps/api/src/database/database.module.ts:10-18`, `apps/web/src/lib/api.ts:11-19` |
| The "verified green" acceptance report is not the output of the tool the README calls official, and two of its nine checks cannot fail. | `acceptance-report.txt`, `README.md:45`, `tests/run-benchmarks.js:75-98, 220-221` |

The single most damaging item is not architectural. It is that `POST /api/v1/auth/google` authenticates any caller as any identity. `apps/api/src/auth/auth.service.ts:54-98` base64-decodes an attacker-supplied token, reads `payload.email` out of it, never checks a signature, and then creates or logs into that account. Combined with the global `ADMIN` override in `apps/api/src/common/guards/roles.guard.ts:14-52`, that is a one-request privilege escalation to full administrative control of the platform.

Nothing here is unrecoverable. The domain layer is real and worth keeping. But **no claim in `README.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `THREAT-MODEL.md`, `.dogfood.toml`, or `acceptance-report.txt` can currently be substantiated**, and the fastest credible path is: cut the Mongo layer, make auth fail closed, fix the container build, then re-earn the claims.

---

## 2. The overall flow, end to end

### 2.1 Intended flow (what the docs describe)

```
Participant        Organizer         Judge            Anyone
     |                 |                |                |
     | idea report     | create event   |                |
     |----->---------->| autopilot dial |                |
     |                 | set rubric     |                |
     |                 | set deadlines  |                |
     | draft -> freeze |                |                |
     |---- freeze hash |                |                |
     |                 | generate assignments (shuffle-seeded)
     |                 |---->---------->| review queue   |
     |                 |                | anchor calibrate
     |                 |                | score 1-9 / flag
     |                 |                |----- ballot lock + hash
     |                 | sigma scan     |                |
     |                 | sigma >= 1.5 -> targeted 4th review| 
     |                 | ranking preview (non-mutating)   |
     |                 | publish -> lock + hash + sign-off
     |                 |------------------------------->| public gallery + /verify
```

That flow is implemented — on the Postgres path. `apps/api/src/judging/judging.service.ts` handles calibration, ballots, and recusal. `apps/api/src/ranking/ranking.service.ts` handles preview, publish, sign-off, and the hash-chain appends. `apps/api/src/trust/trust.service.ts` handles chain verification.

### 2.2 Actual flow (what a browser hits today)

```
Browser (Next.js 14, apps/web/src/app/*)
  |
  |  8 of 9 pages hand-roll fetch() with their own URL strings.
  |  Only app/page.tsx:30 imports the curated client (lib/api.ts).
  |
  v
NestJS process (single, port 4000)
  |
  +-- /api/v1/* ......... 11 guarded Prisma controllers   [ Postgres — connection skipped]
  |
  +-- /database/* ....... 3 controllers, NO guards        [ MongoDB ]
  +-- /judging/* ........                                 [ MongoDB ]
  +-- /dashboard/* ......                                 [ MongoDB ]
  +-- /projects/* .......                                 [ MongoDB ]
  +-- /trust/* ..........                                 [ MongoDB ]
  +-- /autopilot/* ......                                 [ MongoDB ]
  +-- /gallery, /submit, /judge/scores*, /export/csv      [ DogfoodController — hardcoded fixtures.json ]
```

The browser lands in the lower six. Consequences:

- The Postgres domain layer is exercised only by `tests/run-benchmarks.js`, which calls service logic **in-process**, and by nobody else.
- The `openapi.yaml` served at `/api/docs` documents the fixture stub as first-class public API (`openapi.yaml:216-281`).
- On boot the API **overwrites the tracked root `openapi.yaml`** (`apps/api/src/main.ts:35-43`), so every local start dirties the working tree.

### 2.3 Bootstrap sequence

| Step | File | What happens |
|---|---|---|
| 1 | `apps/api/src/main.ts:8-31` | CORS enabled broadly, global `ValidationPipe`, Swagger built. |
| 2 | `apps/api/src/main.ts:35-43` | Root `openapi.yaml` **written to disk at runtime**. |
| 3 | `apps/api/src/app.module.ts:15-30` | 11 domain modules + `@Global()` `DatabaseModule`. `PrismaService` is provided **twice** — directly and inside `DatabaseModule` — so two client instances can exist. |
| 4 | `apps/api/src/prisma.service.ts:14-22` | Postgres connect is **skipped** when the URL matches the local default, and any error is swallowed. No health signal either way. |
| 5 | `apps/api/src/database/mongo.service.ts:28-37` | Mongo connects; failure is logged and swallowed. On success, `seedDatabase()` runs (line 81). |
| 6 | `apps/api/src/database/database.module.ts:10-18` | 7 controllers registered with **zero guard metadata**. |

Steps 4 and 5 are the root of the incoherence: a failure to reach the source of truth produces no error, only an absence.

### 2.4 Data flow per request (guarded path)

```
HTTP → CORS → ValidationPipe(DTO) → AuthGuard(session lookup) → RolesGuard(@Roles + Membership)
      → Controller → Service (business rules, transactions) → PrismaService → PostgreSQL
                                                                     ↘ AuditEvent + IntegrityHashNode append
```

Reasonable. The weakness is that `AuthGuard` is step 3 and it never rejects — see finding **F-2**.

### 2.5 Data flow per request (Mongo path)

```
HTTP → Controller → raw `mongodb` driver collection.find()/insertMany() → MongoDB
```

No DTO validation layer of consequence, no service tier, no transaction boundary, no audit append on the Postgres side, and no guard. The trust ledger that `THREAT-MODEL.md:23-31` calls immutable lives here, and `POST /database/clear` is reachable by anyone.

---

## 3. Two systems in one process

This is the structural problem worth naming precisely, because it explains almost every other finding.

| | **Path A — "LIVE"** | **Path B — "DEMO"** |
|---|---|---|
| Location | `apps/api/src/{auth,events,teams,submissions,judging,ranking,intelligence,trust,support,chat}/` | `apps/api/src/database/` |
| Store | PostgreSQL 16 via Prisma | MongoDB via raw driver |
| Schema | 28 models, 5 enums, FKs, unique constraints, `@@index` | Implicit, in code |
| Auth | 10 controllers with `AuthGuard` + `RolesGuard` | None |
| Transactions | Prisma `$transaction` available | None |
| Integrity chain | `AuditEvent` + `IntegrityHashNode` (`schema.prisma:395,412`) | A second, unrelated Merkle ledger (`projects-mongo.controller.ts:433-490`) |
| Who calls it | Nobody in the UI | All 9 pages |
| Self-described as | `LIVE` in `lib/api.ts:11` | `DEMO` in `lib/api.ts:325,422,535,552` |

The label in `apps/web/src/lib/api.ts:11-19` is the honest part of this repo. The problem is that the `LIVE` path is the one nobody uses, the `DEMO` path is the one that is unguarded, and `openapi.yaml` documents the fixture stub.

**Recommendation:** delete Path B outright. Not harden it — delete it. It duplicates the domain model, it invalidates every security claim, and the domain logic it approximates already exists and is better in Path A.

---

## 4. Findings — severity ranked

### F-1 — CRITICAL — Unauthenticated account takeover via `POST /api/v1/auth/google`

`apps/api/src/auth/auth.service.ts:54-98`

```ts
if (data.credential) {
  const parts = data.credential.split('.');
  if (parts.length === 3) {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (payload.email) { email = payload.email; name = payload.name || ...; googleId = payload.sub; }
  }
}
if (!email) throw new UnauthorizedException(...);
let user = await this.prisma.user.findUnique({ where: { email } });
if (!user) { /* create user */ }
return this.createSession(user.id);
```

Defects:
- No signature verification. The token is never checked against Google's public keys.
- No `iss`, `aud`, or `exp` validation.
- On any decode failure it silently falls back to caller-supplied `data.email` (line 73).
- The `email` field alone is sufficient, so a plain `{"email":"admin@..."}` body works with no `credential` at all.
- `googleId` is read but never stored or checked for uniqueness — no account-linking logic exists.
- The resulting user is **created if absent** (lines 84-95), so this is also an unauthenticated account-provisioning endpoint.

Impact: `POST /api/v1/auth/google {"email":"<any existing user>"}` returns a valid session token for that user. Because `roles.guard.ts:14-52` grants `ADMIN` unconditionally, targeting a seeded admin yields full platform control.

Fix: verify the credential against `https://www.googleapis.com/oauth2/v3/tokeninfo` (or JWKS with `google-auth-library`), require `email_verified`, reject on any failure, and remove the email-fallback path entirely. Delete `data.email` / `data.name` from the parameter type.

### F-2 — CRITICAL — `AuthGuard` fails open

`apps/api/src/common/guards/auth.guard.ts:12-15, 26-28`

```ts
if (!authHeader) { return true; }                       // line 12-15
...
if (!session || session.expiresAt < new Date()) { return true; }   // line 26-28
```

A missing token **and** an invalid/expired token both resolve to "allow", with the request proceeding anonymously. The guard is a *decorator*, not an enforcer.

There is also no `@Public()` decorator anywhere in `apps/api/src/common/decorators/` — only `roles.decorator.ts`. So today the only way to express "this route is public" is "omit `@Roles` and hope". That is how the 7 unguarded controllers in F-3 exist.

Fix: invert to deny-by-default. `AuthGuard` rejects `401` unless a valid session is present or the handler is explicitly marked `@Public()`. Add `@Public()` to the ~12 routes that are genuinely public (event list/detail, published ranking, gallery, trust verify, auth endpoints, health).

### F-3 — CRITICAL — 37 unauthenticated routes, 7 of them destructive or exfiltrating

`apps/api/src/database/database.module.ts:10-18` registers 7 controllers with no guard metadata.

| Route | Controller | Effect |
|---|---|---|
| `POST /database/clear` | `database.controller.ts:43-46` | **Deletes all Mongo data** |
| `POST /database/reseed` | `database.controller.ts:53` | Wipes and reseeds |
| `GET /database/status` | `database.controller.ts:31-32` | Leaks the Mongo URI and collection counts |
| `GET /projects/export/json` | `projects-mongo.controller.ts:146` | **Full database export** |
| `GET /projects/:id` | `projects-mongo.controller.ts:47` | **Returns that project's ballots** |
| `POST /projects` | `projects-mongo.controller.ts:67` | Creates unfrozen submissions, bypassing freeze rules |
| `GET/POST /judging/ballots` | `database.controller.ts:69,86` | Reads all ballots / **injects ballots, rewriting Elo** |
| `GET /judge/scores/:judgeId` | `dogfood.controller.ts:87` | **Another judge's scores, unauthenticated** |
| `POST /autopilot/apply` | `autopilot.controller.ts:64,385-390` | **Writes an event blueprint into the DB** |
| `POST /trust/commit` | `projects-mongo.controller.ts:450` | Appends to the "immutable" ledger |
| `GET /autopilot/presets`, `GET /gallery`, `POST /submit`, `GET /judge/scores`, `GET /export/csv` | | Fixture/demo surface |

This voids `README.md:85` ("Backend-Enforced Role Isolation ... HTTP 403") and `.dogfood.toml:38` (`role_isolation_backend`) outright.

### F-4 — HIGH — The published contract is the fixture stub, and two specs disagree

- Root `openapi.yaml` is **machine-generated at boot** (`apps/api/src/main.ts:35-43`) and is git-tracked, so every start rewrites it.
- It advertises `DogfoodController`'s hardcoded routes as public API: `/gallery` (216), `/submit` (226), `/judge/scores` (235), `/judge/scores/{judgeId}` (249), `/export/csv` (268).
- `components:` is empty (953) — **no `securitySchemes`, no response schemas anywhere**. No client codegen or contract validation is possible.
- `apps/openapi.yaml` is a **stale second copy**: 92 lines behind, missing the five Dogfood routes, missing `GET /judging/ballots`, missing `/api/v1/trust/events/:eventId/{audit-trail,export}` and the whole chat block. It also declares a `bearer`/`bearerFormat: JWT` scheme at 870-874 that does not exist — sessions are opaque 32-byte hex (`auth.service.ts:101`).
- `benchmarks/BENCHMARKS.md:5` names `openapi.yaml` as the protocol spec and line 488 tells contributors to lint it with Spectral. No lint step exists.

Fix: stop writing the spec at runtime. Add a checked-in, DTO-decorated spec with response schemas, add Spectral to CI, delete `apps/openapi.yaml`, delete the `apps/api/.env` copy, and stop tracking root `openapi.yaml` (or gate regeneration behind an explicit `npm run openapi:emit`).

### F-5 — HIGH — Docker cannot deliver the documented one-command experience

Three independent blockers:

1. `Dockerfile.web:26` — `COPY --from=builder /app/apps/web/public ./apps/web/public`, but **`apps/web/public` does not exist** (verified: `Test-Path` → `False`, absent from `git ls-files`). The web image cannot build.
2. `Dockerfile.api:30` — `CMD ["sh","-c","npx prisma migrate deploy && ts-node prisma/seed.ts && node dist/main.js"]` while the runner stage runs `npm install --omit=dev` (line 20) and `ts-node` is a **devDependency** (`apps/api/package.json:44`). `ts-node` is absent in the runner, so the command chain fails. It also re-runs the destructive seed on every start — `apps/api/prisma/seed.ts:17-39` `deleteMany`s all 23 tables.
3. **No `.dockerignore`** (verified absent). `Dockerfile.api:9` does `COPY apps/api ./apps/api`, baking the untracked-but-present `apps/api/.env` (which contains `JWT_SECRET` and DB credentials) into the builder layer. `Dockerfile.api:23` copies all of `prisma/`, including the committed `apps/api/prisma/dev.db`. Neither Dockerfile sets `USER`, so both images run as **root**.

Additionally, `docker-compose.yml:4-56` has **no MongoDB service** and passes no `MONGODB_URI`, so in the documented deployment the UI's only data source does not exist. This contradicts `README.md:9-28` and `acceptance-report.txt:30`.

### F-6 — HIGH — Runtime data-source incoherence

- `apps/api/.env:4` sets `DATABASE_URL="mongodb://127.0.0.1:27017/dogfood_os"` while `apps/api/prisma/schema.prisma:2-5` declares `provider = "postgresql"`. Prisma cannot parse that URL.
- `apps/api/src/prisma.service.ts:16` skips `$connect()` entirely when the URL contains the local-default Postgres string, and line 19-21 swallows all errors.
- `MONGODB_URI` / `MONGODB_DB_NAME` (`mongo.service.ts:11-12`) appear **only** in `apps/api/.env` — in no template, not in Compose.
- `Dockerfile.api` and `docker-compose.yml` have no Mongo service, and `apps/api/src/prisma.service.ts:20` comments "MongoDB is primary active database" while `README.md:77` and `acceptance-report.txt:31` claim "Single source of truth: PostgreSQL 16".

There is no single source of truth today. There are two, and the docs name the one that isn't running.

### F-7 — HIGH — Client/server contract drift

`apps/web/src/lib/api.ts` calls paths that do not exist:

| Call | Actual route | Result |
|---|---|---|
| `/api/v1/events/{id}/audit-trail` (562) | `/api/v1/trust/events/:eventId/audit-trail` (`trust.controller.ts:24`) | 404 |
| `/api/v1/events/{id}/export` (566) | `/api/v1/trust/events/:eventId/export` (`trust.controller.ts:30`) | 404 |
| `/judging/pairwise` (518, 530) | not registered | 404 |
| `/judging/recuse` (540) | not registered | 404 |
| `/judging/disputes*` (545) | not registered | 404 |
| expects `{events: [...]}` (217) | `events.service.ts:10-11` returns a bare array | shape mismatch |
| expects `{projects: [...]}` (313) | `submissions.service.ts:222-241` returns a bare array | shape mismatch |

Root cause of the 404 group: `apps/api/src/database/projects-mongo.controller.ts:180` declares a **second** `JudgingMongoController` holding `POST /judging/pairwise` (263), `POST /judging/recuse` (334), `GET /judging/disputes` (372), `POST /judging/disputes/:id/resolve` (385). `database.module.ts:3,14` imports the class from `database.controller.ts` instead. The four routes are therefore dead code — confirmed by their absence from the generated `openapi.yaml`.

And because only 1 of 9 pages imports `lib/api` at all, even the curated layer is largely unexercised; the other 8 pages hand-roll strings, so drift is unbounded.

`api.ts:776-784` is the repo's own TODO list of endpoints that were never built.

### F-8 — HIGH — Dead code: duplicate and superseded modules

- Two full Prisma schemas: `apps/api/prisma/schema.prisma` (474 lines) and `schema.sqlite.prisma` (437 lines), the latter degrading every enum to a string.
- Two near-identical seeds: `seed.ts` (641 lines) and `seed.sqlite.ts` (618 lines).
- Two `JudgingMongoController` classes (F-7).
- `prisma.service.ts:14-22` — the Postgres path can be silently inert.
- `apps/api/src/common/types.ts:1-40` re-declares `Role`, `EventStatus`, etc., duplicating the Prisma enums. Two sources of truth for the same enums.
- `apps/api/prisma/dev.db` is **committed to git** (2,484 lines) despite `.gitignore:37` having `*.db`.
- `tests/k6-load-test.js` is legacy per its own header; `benchmarks/k6/{smoke,spike}.js` supersede it.

### F-9 — MEDIUM — Acceptance evidence is not trustworthy

- `run.py` builds exactly **8 checks, all T1/T2** (`run.py:91-187`). T3 and T4 have none, so they can never appear in `verified` (245-254) — which is why `.dogfood.toml:11` only *claims* `["T1","T2"]`.
- All five routes it exercises (`.dogfood.toml:14-18`) are `DogfoodController` stub routes. It **never touches `/api/v1/*`**, never touches Postgres, never touches a real domain service.
- The tokens it sends (`.dogfood.toml:21-24`) are literals — `Bearer participant-token`, `judge-a-token`, `judge-b-token`, `organizer-token` — not real sessions. The stub fabricates the 403s itself.
- **`run.py:264` returns `0` unconditionally.** It exits 0 even when every check fails, so it cannot gate anything.
- `request()` (60-75) converts any transport failure into `(0, "Exception: …")` rather than raising, so a down server looks like a specific assertion failure.

`acceptance-report.txt` is **not** `run.py` output. Its layout, the B1–B9 IDs, and the `Total Test Duration: 0.17s` line match `tests/run-benchmarks.js`, which the repo itself deprecates at lines 3-5 ("Do not cite legacy 0.02s / 8ms metrics"), and which `README.md:45` nonetheless presents as "official `run.py` test outputs".

Within B1–B9:
- **B2 (63-100) cannot fail.** It calls a local helper `evaluatePermission()` (75) and asserts booleans in-process. **No HTTP request is made.** The receipt string at 98 is a hardcoded literal.
- **B6 (217-223) cannot fail.** `let b6Pass = true;` at 220 with a static detail string at 221. It reads no env var and opens no socket.
- B1 (34-60) times a live Prisma read with `Date.now()` and compares to a 90 s target — trivially true.
- B3, B4, B7, B8, B9 do real work and are worth keeping.

`benchmarks/BENCHMARKS.md:9-19` ("Honesty Rules First") is an excellent standard — real stack, true wall-clock cold start, real k6 binary, raw pasted receipts, retire legacy stubs. The shipped code does not meet it:
- `harness.js` claims to measure "cold start wall-clock timing" and to "inject a manual bit flip … and restore state" (`BENCHMARKS.md:243-244`); it does neither — it measures one request round-trip.
- The doc's own receipt table (`BENCHMARKS.md:549-560`) is blank (`_______`).
- **No k6 output file exists anywhere in the repo.**
- Receipt `benchmarks/receipts/receipt-2026-09-24T18-12-39-629Z.json:38-52` claims `pairwise_elo_engine: passed` with Elo deltas, against a route that is not registered (F-7). It cannot be reproduced.
- The sibling receipt from the same day, `receipt-2026-09-24T17-45-43-749Z.json`, records **2 passed / 2 failed** and was left in the tree.
- Both receipts are self-labelled `loopback: true` with no caveat tag.

Three mutually incompatible B-taxonomies are in circulation: `README.md:103` (B1-B9), `tests/run-benchmarks.js:2,27` (header still says B1-B6), `BENCHMARKS.md:549-560` (sub-100 ms recusal, p95 read, p95 write — a different meaning per ID).

### F-10 — MEDIUM — Credential, secret and data hygiene

| Issue | Location |
|---|---|
| One shared password `dogfood2026!` for admin, organizer, all 30 judges, and the team lead — hashed once at line 44, reused at 51, 60, 235, 310 | `apps/api/prisma/seed.ts` |
| Same pattern in the SQLite seed | `seed.sqlite.ts:47,50` |
| Non-deterministic seeding via `Math.random()` jitter | `seed.ts:465`, `seed.sqlite.ts:455` |
| Deterministic default `shuffleSeed = "dogfood-entropy-seed-2026"` makes judge assignment order predictable | `schema.prisma:123` |
| 30-day session lifetime, no rotation, no revocation-on-role-change | `auth.service.ts:102` |
| `logout` deletes sessions by caller-supplied token with no ownership check | `auth.service.ts:130-133` |
| `JWT_SECRET` declared in 4 places, read by nothing (sessions are opaque hex) | `.env.example:14`, `apps/api/.env:5`, `apps/api/.env.example:3`, `docker-compose.yml:76` |
| `REDIS_URL`, `STORAGE_*`, `SMTP_*`, `AI_PROVIDER` read by nothing | see F-11 |
| `support.controller.ts:8-33` — in-process token bucket, resets on restart, not shared across replicas | |
| `apps/api/prisma/dev.db` committed despite `.gitignore:37` | |

### F-11 — MEDIUM — Dead configuration and services

| Declared | Read by code? |
|---|---|
| `JWT_SECRET` | No — sessions are opaque random hex |
| `REDIS_URL` (`.env.example:43`, `compose:68`) | No |
| `STORAGE_ENDPOINT/ACCESS_KEY/SECRET_KEY/BUCKET` (`.env.example:35-38`, `compose:69-72`) | No |
| `SMTP_HOST/SMTP_PORT` (`compose:73-74`) | No — email is *simulated* (`events.service.ts:432`, `support.service.ts:96`) |
| `AI_PROVIDER` (`.env.example:49`, `compose:75`) | No — grep across all `.ts/.tsx/.js/.json/.md/.yaml/.py` for `anthropic\|openai\|gemini\|ollama\|langchain\|llamaindex\|huggingface\|cohere\|perplexity\|claude\|gpt-*` returns **zero matches** |
| `GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No — see F-1 |
| `MONGODB_URI`, `MONGODB_DB_NAME` | **Yes** — but present only in `apps/api/.env`, in no template and no Compose file |

So Compose runs a Redis, a MinIO and a MailHog that no code path uses, while the one variable the app actually needs is undocumented. "AI" in this project means the deterministic heuristics in `intelligence.service.ts:8-44` (rubric alignment, scope pressure, blindspot) and the preset generator in `autopilot.controller.ts`. The offline/air-gap claim is **accurate** — there is no network code at all — but B6's "verification" is hardcoded (F-9).

### F-12 — MEDIUM — No CI, no unit tests, no type-check gate

- `package.json:1-29` has **no** `lint`, **no** `typecheck`, **no** `test`. The only script is `test:benchmark` (16) → `tests/run-benchmarks.js`.
- No `.github/workflows`. No Jest/Vitest config. No ESLint config.
- No root `tsconfig.json`, no `nest-cli.json`, no `next.config.js`, no `.dockerignore`.
- `@nestjs/cli` is not a dependency — the build is bare `tsc` with no Nest project descriptor.
- No unit tests anywhere; no integration test that boots the app and asserts a status code.

---

## 5. Documentation drift matrix

| Claim | Source | Reality |
|---|---|---|
| "Modular monolith" | `ARCHITECTURE.md:3-5` | Structurally true, but a second parallel application layer lives inside the process and serves the UI |
| "Single source of truth: PostgreSQL 16 / Prisma" | `acceptance-report.txt:31`, `README.md:77` | Connect is skipped and errors swallowed (`prisma.service.ts:16-21`); local `.env` points Prisma at `mongodb://`; UI reads Mongo |
| "Append-only audit trail + hash chain" | `THREAT-MODEL.md:23-31`, `DATA-MODEL.md:26-31` | Real on the Postgres path; a **second unauthenticated** ledger exists in Mongo, and `POST /database/clear` is open to anyone |
| "Backend-enforced role isolation (HTTP 403)" | `acceptance-report.txt:33`, `.dogfood.toml:38` | True for 10 controllers; 7 more have **no guard**, including data wipe, full export, ballot injection, and peer scores. `AuthGuard` fails open. B2's "proof" never issues a request |
| "Append-only event sourcing" | `acceptance-report.txt:34` | No event store or snapshot layer. `AuditEvent.event` is `SetNull` on event delete (`schema.prisma:398`) |
| "Frozen submissions; one team per event; locked rubric binding" | `DATA-MODEL.md:26-31` | Enforced in Postgres (`schema.prisma:237,343`); `POST /projects` in Mongo accepts unfrozen work freely |
| "Air-gap, `AI_PROVIDER=off` deterministic" | `.env.example:46-49`, `acceptance-report.txt:36` | **Accurate** — zero network code exists. But B6 is hardcoded |
| "`docker compose up` → portal in < 90 s" | `README.md:9-50`, `acceptance-report.txt:30`, `.dogfood.toml:46` | Web image cannot build (missing `public/`); API CMD fails (`ts-node` omitted); no Mongo service |
| "Report produced by `run.py`" | `README.md:45` | It is `tests/run-benchmarks.js` output; `run.py` emits T1/T2 and 8 checks and always exits 0 |
| "JWT" auth | `apps/openapi.yaml:870-874`, `JWT_SECRET` ×4 | Opaque 32-byte hex, 30-day lifetime, no JWT anywhere |
| "Merkle DAG", "GROTH16_VERIFIED_1.4MS", 3D Moments as verified | `acceptance-report.txt:23-24,27`, receipt field | React Three Fiber scenes; no Groth16 or ZK library in any manifest; the receipt field is a constant |
| "Judge self-recusal with pool re-assignment, sub-40 ms" | `acceptance-report.txt:26`, `BENCHMARKS.md:539`, `story/page.tsx:458` | Recusal exists on Postgres; the Mongo `<100 ms` variant is unregistered dead code; no latency is measured anywhere |
| B1–B6 / B1–B9 / B1–B10 | `README.md:45`; `run-benchmarks.js:2,27`; `BENCHMARKS.md:549-560` | Three incompatible taxonomies; the doc's own table is blank |

**Strongest thing in the repo:** `THREAT-MODEL.md:37-38` — the note that local hashing proves non-modification of the event sequence but *not* physical control of the host. That is exactly the right epistemic boundary, and it should be the template for everything else in this table.

---

## 6. Test & acceptance integrity

### 6.1 What is real and worth keeping

| Suite | Verdict |
|---|---|
| `tests/run-benchmarks.js` B3, B4, B5, B7, B8, B9 | Real assertions against real service logic. Keep and convert to a proper test runner. |
| `benchmarks/k6/smoke.js` | Sensible: 5 VU / 30 s, p95 < 300 ms, errors < 1%, hits `/database/status`, `/projects?sort=rank`, `/trust/ledger`. |
| `benchmarks/k6/spike.js` | Sensible: ramping VUs to 4,000, 80/15/5 read/write/submit mix, custom Trend/Counter/Rate, thresholds read < 450 ms, write < 800 ms, error < 2%. |
| `benchmarks/BENCHMARKS.md:9-19` "Honesty Rules First" | Excellent standard. The problem is the code, not the standard. |
| `THREAT-MODEL.md:2` attack matrix | Well-scoped with concrete vectors, expected controls, and status codes. This should become real executable tests. |

### 6.2 What must go

- B2 and B6 — cannot fail (`run-benchmarks.js:75-98, 220-221`).
- `acceptance-report.txt` — delete it. It is a transcription of a deprecated script and it overstates the system.
- `apps/openapi.yaml` — stale duplicate.
- `benchmarks/receipts/receipt-2026-09-24T18-12-39-629Z.json` — claims an unregistered route passed; not reproducible.
- `run.py`'s unconditional `return 0` (line 264).

### 6.3 The invariant set that *should* be executable

`THREAT-MODEL.md:25-31` already names them. Turn each into a black-box HTTP test against a booted app — that is the whole point of an attack matrix:

1. Judge cannot read peer ballots pre-publication → `403`
2. Post-deadline submission mutation → `400`
3. Participant calling `/api/v1/events/:id/status` → `403`
4. Tampered `IntegrityHashNode` payload → detected, `TAMPER_FLAGGED_NODE_CORRUPT`
5. Republish after `RESULTS_PUBLISHED` → `409`
6. Unauthenticated `GET /database/clear` → `401/403` **(currently `200`)**
7. Unauthenticated `GET /projects/export/json` → `401/403` **(currently `200`)**
8. Forged `POST /api/v1/auth/google` credential → `401` **(currently `200` + session issued)**
9. `weight simulation` leaves `RankingRun` count unchanged **(B5 already does this — promote it)**
10. Two identical ballot POSTs are idempotent, not additive

---

## 7. Remediation backlog

Ordered by dependency, not by severity — the security items are worthless if the app cannot boot.

### Phase 0 — Make it run (blocks everything)

| # | Action | Files |
|---|---|---|
| 0.1 | Create `apps/web/public/` (with `.gitkeep`) | `Dockerfile.web:26` blocker |
| 0.2 | Add `.dockerignore`; exclude `.env`, `*.db`, `node_modules`, `.next`, `dist` | new file |
| 0.3 | Build the seed to JS in the builder stage; `CMD` runs `node prisma/seed.js` — never `ts-node` | `Dockerfile.api:30` |
| 0.4 | Stop seeding on every start. Seed only when the DB is empty, or behind an explicit `SEED_ON_START` flag | `Dockerfile.api:30`, `seed.ts:17-39` |
| 0.5 | Add a MongoDB service to Compose, or delete the Mongo layer (Phase 1) | `docker-compose.yml:4-56` |
| 0.6 | Add `USER` to both Dockerfiles (non-root) | both |
| 0.7 | Untrack `apps/api/prisma/dev.db`; `git rm --cached` | — |
| 0.8 | Provide a Mongo **and** a Postgres `DATABASE_URL` in `.env.example` and Compose | `apps/api/.env:4` |

### Phase 1 — Cut the duplicate system

| # | Action | Files |
|---|---|---|
| 1.1 | Delete `apps/api/src/database/{database,projects-mongo,autopilot,dogfood}.controller.ts`, `mongo.service.ts`, and `DatabaseModule` | `apps/api/src/database/` |
| 1.2 | Delete `benchmarks/harness.js` checks against Mongo routes | `benchmarks/harness.js:328,356,394,420,428` |
| 1.3 | Repoint all 9 web pages at `/api/v1/*`; delete the `LIVE`/`DEMO` split in `api.ts:11-19` | `apps/web/src/**` |
| 1.4 | Delete `DogfoodController` fixtures surface from the spec, or move it behind an explicit `ENABLE_DEMO_ROUTES` flag in a dev-only module | — |
| 1.5 | Fix `api.ts` path + shape drift: audit-trail, export, wrapper shapes at 217 and 313 | `apps/web/src/lib/api.ts` |
| 1.6 | Make **every** page import `lib/api`; no hand-rolled URL strings in components | `apps/web/src/app/**` |
| 1.7 | Delete `schema.sqlite.prisma` and `seed.sqlite.ts`, or move them under `tools/` clearly marked unsupported | `apps/api/prisma/` |
| 1.8 | Delete `apps/openapi.yaml` | — |
| 1.9 | Stop writing `openapi.yaml` at boot; gate it behind `npm run openapi:emit` | `main.ts:35-43` |

### Phase 2 — Close the security holes

| # | Action | Files |
|---|---|---|
| 2.1 | **Verify** the Google credential (JWKS/tokeninfo), require `email_verified`, delete the `data.email` fallback, store `googleId` with a unique index | `auth.service.ts:54-98`, `schema.prisma` |
| 2.2 | Invert `AuthGuard` to deny-by-default; add a `@Public()` decorator; mark ~12 routes | `auth.guard.ts`, `common/decorators/` |
| 2.3 | Re-audit every controller for `@Public` / `@Roles`; require an explicit declaration | all controllers |
| 2.4 | Fix `logout` to require session ownership | `auth.service.ts:130-133` |
| 2.5 | `bootstrap.role` must not be caller-settable — the `role` param on `register` (line 11) is a self-escalation vector on any open registration endpoint | `auth.service.ts:11` |
| 2.6 | Reduce session TTL to hours, add rotation + revocation on role change | `auth.service.ts:102` |
| 2.7 | Move the rate limiter to shared state (Redis is already in Compose) or drop the claim | `support.controller.ts:8-33` |
| 2.8 | Tighter CORS allowlist instead of `enableCors()` defaults | `main.ts` |

### Phase 3 — Make claims true

| # | Action | Files |
|---|---|---|
| 3.1 | Add `lint` and `typecheck` scripts; wire `tsc --noEmit` for both workspaces | `package.json` |
| 3.2 | Add a real test runner (Vitest or Jest) + supertest; add `.github/workflows/ci.yml` | new |
| 3.3 | Convert the 5 good B-checks to real tests; **delete B2 and B6** | `tests/run-benchmarks.js` |
| 3.4 | Turn the 10 invariants in §6.3 into executable black-box HTTP tests | new |
| 3.5 | Fix `run.py:264` to return non-zero on any failure; add T3/T4 checks that exercise `/api/v1/*` | `run.py` |
| 3.6 | Delete `acceptance-report.txt`; regenerate it from a real CI run with a commit SHA and environment footer | — |
| 3.7 | Settle on one B-taxonomy; make `BENCHMARKS.md:549-560` a real table; actually commit k6 output files | `BENCHMARKS.md` |
| 3.8 | Add response DTO classes + `securitySchemes` to the OpenAPI spec; add Spectral to CI | `main.ts`, `openapi.yaml` |
| 3.9 | Generate `openapi.yaml` in CI and diff it — a spec drift must fail the build | new |

### Phase 4 — Data and hygiene

| # | Action | Files |
|---|---|---|
| 4.1 | Unique per-role seed passwords, or one documented demo password printed by the seeder | `seed.ts:44-310` |
| 4.2 | Replace `Math.random()` with a seeded PRNG so seeding is reproducible | `seed.ts:465` |
| 4.3 | Randomize `shuffleSeed` per event; never a hardcoded default | `schema.prisma:123` |
| 4.4 | Delete dead env vars (`JWT_SECRET`, `REDIS_URL`, `STORAGE_*`, `SMTP_*`, `AI_PROVIDER`) **or** implement them. Document `MONGODB_URI` if the Mongo layer survives Phase 1 | env templates, Compose |
| 4.5 | Untrack `prisma/dev.db`; add a real `migrations/` directory and use `migrate deploy` | `apps/api/prisma/` |
| 4.6 | Single source of truth for enums: import Prisma-generated enums everywhere, delete `common/types.ts` | `common/types.ts` |
| 4.7 | Resolve the duplicate `PrismaService` provider | `app.module.ts:15-30` |
| 4.8 | Real email via the MailHog SMTP in Compose, or drop the claim | `events.service.ts:432`, `support.service.ts:96` |

---

## 8. Not yet reviewed

Flagged so the next reviewer does not assume coverage:

- **`hackathon-platform-prd.pdf`** (530 KB, root) — the authoritative requirements document. Binary; not parsed. Every "invariant" above was derived from the repo's own docs, so it is possible the PRD defines scope this audit has not considered. **This should be read first in any next pass.**
- **`apps/web/src/lib/terms.ts`** (365 lines) — content and consumers not traced.
- **Runtime confirmation** of the 404s and response-shape mismatches in F-7. Analysis is static; nothing was executed. The route table in `openapi.yaml` corroborates the 404 group, but the shape mismatches are inferred from return-type reading.
- **Behavioral impact** of the dual `PrismaService` provider (`app.module.ts:15-30`) — in particular whether two clients against one Postgres cause contention or divergent connection pools.
- **`benchmarks/k6/`** thresholds were not executed; no k6 binary output exists to review.
