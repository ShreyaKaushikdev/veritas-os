# veritas-os — The Self-Hosted Hackathon Operating System (DOGFOOD OS)

> **Product Promise**: From idea intake to published results, every decision is explainable, auditable, portable, and runnable with one command.

DOGFOOD OS is an offline-first, agent-native platform that helps participants improve ideas before submission, makes judging defensible, and lets organizers run repeatable technical competitions without spreadsheet chaos.

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

## 🧪 Benchmark Suite (B1 - B6)

Run the verification suite:
```bash
node tests/run-benchmarks.js
```

Outputs verified receipts to `acceptance-report.txt`:
- **B1**: Cold Start & Seeding Baseline (`< 90s`)
- **B2**: Backend Role Isolation Matrix (`100% 403 enforcement`)
- **B3**: Cryptographic Tamper Detection (`< 1s detection latency`)
- **B4**: Disagreement Uncertainty Routing (targeted 4th review dispatch)
- **B5**: Weight Sensitivity Sandbox Non-Mutation Invariant
- **B6**: Offline Air-Gap & Deterministic Heuristics Guarantee

---

## 📄 License & Attribution

Licensed under the MIT License. Developed for high-integrity, fair judged technical competitions.
