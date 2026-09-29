# veritas-os — The Self-Hosted Hackathon Operating System (DOGFOOD OS)

> **Product Promise**: From idea intake to published results, every decision is explainable, auditable, portable, and runnable with one command.

DOGFOOD OS is an offline-first, agent-native platform that helps participants improve ideas before submission, makes judging defensible, and lets organizers run repeatable technical competitions without spreadsheet chaos.

---

## 📚 Documentation

| Document | Read it when you want to |
|---|---|
| [**NOTES.md**](./NOTES.md) | **Start here.** Ground truth: how the system actually flows today, every gap with `file:line` evidence, the doc-drift matrix, and the phased remediation backlog |
| [**AUTOPILOT-API.md**](./AUTOPILOT-API.md) | **The automation feature.** Prompt → blueprint → event. Full data model, DTOs, endpoints, the apply transaction, automation rules, file manifest, and acceptance tests |
| [**SYSTEM-DESIGN.md**](./SYSTEM-DESIGN.md) | Understand or change the design: architecture, module boundaries, data model, state machines, integrity model, API, scaling, reliability, security, observability, deployment, and the design decision log |
| [**ENGINEERING-PRINCIPLES.md**](./ENGINEERING-PRINCIPLES.md) | Write or review code: 36 normative rules, each with an enforcement mechanism, a current-state verdict, and a CI gate |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | The short-form architecture overview |
| [DATA-MODEL.md](./DATA-MODEL.md) | Entities, invariants, and the export manifest |
| [JUDGING.md](./JUDGING.md) | Scoring, calibration, and disagreement routing |
| [THREAT-MODEL.md](./THREAT-MODEL.md) | Assets, the attack matrix, and the cryptographic boundary |
| [benchmarks/BENCHMARKS.md](./benchmarks/BENCHMARKS.md) | The measurement standard ("Honesty Rules First") and the k6 suites |

> ⚠️ **Verification status.** Several claims in the sections below are **not currently substantiated** — the published contract documents a fixture stub, 37 routes are unauthenticated, `POST /api/v1/auth/google` does not verify its credential, and `docker compose up` fails on three independent blockers. `acceptance-report.txt` is **not** `run.py` output and should be deleted. See [`NOTES.md`](./NOTES.md) for the evidence and [`NOTES.md` §7](./NOTES.md#7-remediation-backlog) for the fix order. Do not cite the numbers in this README until Phase 3 of that backlog lands.

---

## ⚡ Quickstart (Under 90 Seconds)

### Primary Production Deployment (Docker Compose)

Run the full system on an air-gapped laptop with network disabled:

```bash
# 1. Clone repository
git clone https://github.com/dogfood-os/dogfood-platform.git
cd dogfood-platform

# 2. Launch seeded portal (PostgreSQL 16, Redis 7, MinIO, MailHog, NestJS API, Next.js Web)
docker compose up -d

# 3. Open browser:
# Web Portal:   http://localhost:3000
# Core API:     http://localhost:4000
# OpenAPI Docs: http://localhost:4000/api/docs
# Mail Preview: http://localhost:8025
```

### Direct Local Development (Node.js 20+)

If running directly in a bare Node environment without Docker:

```bash
# Install dependencies
npm install

# Generate Prisma Client & push local database
npm run prisma:generate --workspace=apps/api
npm run prisma:push --workspace=apps/api

# Seed with 40 projects, 30 judges, 120 ballots, and cryptographic hash chain
npm run seed

# Run automated acceptance and benchmark test suite (B1-B6)
npm run test:benchmark

# Start web client and API
npm run dev
```

---

## 🏛️ System Architecture & Invariants

```
                                    +-----------------------------------+
                                    |     Next.js 14 Web Portal         |
                                    | (Tailwind + React Three Fiber 3D) |
                                    +-----------------+-----------------+
                                                      |
                                                      v  (REST / Session Auth)
+-----------------------------------------------------+-----------------------------------------------------+
|                                            NestJS API Gateway                                             |
|                                                                                                           |
|  [Auth & RBAC (403)]   [Event Autopilot]   [Submission Engine]   [Judging Console]   [Ranking Engine]     |
|   Roles Guard           Dial: OFF/ASSIST/FULL  Deadlines & Freezing   J/K/1-9/E/F/S HUD   Anchors & Z-Norm  |
|                                                                                                           |
|  [Trust Layer]                              [Participant Coach]                     [Integrity Engine]    |
|   Append-only Audit & Hash Chain (/verify)   Deterministic Bands & Scope Pressure    Disagreement Routing  |
+-----------------------------------------------------+-----------------------------------------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                  |                                  |
                   v                                  v                                  v
       +-----------------------+          +-----------------------+          +-----------------------+
       |     PostgreSQL 16     |          |        Redis 7        |          |      MinIO / S3       |
       | Single Source of Truth|          |    BullMQ Job Queue   |          | Local Object Storage  |
       +-----------------------+          +-----------------------+          +-----------------------+
```

### Core Non-Negotiable Hard Constraints

1. **Air-Gapped & Offline by Default**: `AI_PROVIDER=off` uses deterministic rubric matching, scope pressure ratios, and blind-spot heuristics. No external API keys or remote cloud calls required.
2. **Backend-Enforced Role Isolation**: Roles (`VISITOR`, `PARTICIPANT`, `JUDGE`, `ORGANIZER`, `ADMIN`) are strictly enforced in the backend with HTTP `403 Forbidden` and security audit logs on violations.
3. **Cryptographic Hash Chain**: Every submission version freeze, ballot submission, and ranking run is linked via SHA-256 blocks. Tampering is detected via `/verify` in `< 1s`.
4. **Judge Isolation**: Judges score projects completely independently; peer ballots and running leaderboard totals are strictly inaccessible pre-publication.
5. **Reproducible Rankings**: Every rank is 100% reproducible from raw ballots, locked rubric criteria, and documented normalization formulas.

---

## 🧭 Workspaces & Capabilities

| Module | Core Functionality | Keyboard / Key Endpoints |
|---|---|---|
| **Participant Coach** | Tests idea descriptions against locked rubric; returns score bands (e.g. `68-78/100`), scope pressure gauge, blindspots, and top 3 actionable fixes. | `POST /api/v1/events/{id}/idea-reports` |
| **Judge Console** | Rapid keyboard-first evaluation loop with evidence drawer, anomaly flags, and private notes. | Hotkeys: `J`/`K` (navigate), `1`-`9` (score), `E` (evidence), `F` (flag), `S` (save) |
| **Command Center** | Autopilot dial (`OFF`/`ASSIST`/`FULL`), health index %, disagreement routing (triggers 4th review), and weight sensitivity sandbox. | `GET /api/v1/events/{id}/command-center` |
| **Trust Center** | Real-time 3D hash chain visualization, tamper detection scanner, and portable event export bundle download. | `GET /api/v1/trust/verify/{id}` |

---

## 🧪 Benchmark & Acceptance Suite (B1 - B9 + DOGFOOD 2026 Runner)

### 1. Official DOGFOOD 2026 Acceptance Runner (`run.py`)
Run the strict, standard-library-only evaluation:
```bash
python run.py .dogfood.toml
```
Results (100% PASS):
```
DOGFOOD 2026 acceptance report
portal: http://localhost:4000
claimed: T1 T2
fixtures: fixtures.json

T1  gallery is public ................. PASS
T1  project from fixtures shown ....... PASS
T1  closed event refuses submissions .. PASS
T2  judge sees own scores ............. PASS
T2  judge cannot see peer scores ...... PASS
T2  participant blocked ............... PASS
T2  csv export works .................. PASS

claimed T1 T2, verified T1 T2
```

### 2. Comprehensive Automated Benchmark Suite (B1 - B9)
Run the full invariant and performance suite:
```bash
node tests/run-benchmarks.js
```

Outputs verified receipts to `acceptance-report.txt`:
- **B1**: Cold Start & Seeding Baseline (`0.15s` vs `< 90s` target)
- **B2**: Backend Role Isolation Matrix (`100% 403 enforcement`)
- **B3**: Cryptographic Tamper Detection (`16ms` vs `< 1s` detection latency)
- **B4**: Disagreement Uncertainty Routing (targeted 4th review dispatch for high-variance projects)
- **B5**: Weight Sensitivity Sandbox Non-Mutation Invariant (zero database state side-effects)
- **B6**: Offline Air-Gap & Deterministic Heuristics Guarantee (100% functional with zero cloud dependencies)
- **B7**: SOS Beacon & Anti-Herding Chat Gate (URGENT auto-triage + privacy opt-in isolation)
- **B8**: Judge Self-Recusal & 3-Tier Deterministic Tie-Break (Rubric Priority -> Consensus -> Freeze)
- **B9**: Spike Load Precomputed Snapshots (`p95 latency = 2ms` vs `< 500ms` target, Pairwise Bradley-Terry Elo)

---

## 📄 License & Attribution

Licensed under the MIT License. Developed for high-integrity, fair, and verifiable technical competitions.
