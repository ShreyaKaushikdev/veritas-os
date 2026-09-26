# DOGFOOD OS — Architecture & System Design Specification

## 1. System Shape & Modularity

DOGFOOD OS is structured as a **Modular Monolith** with clear domain boundaries. This shape was selected over microservices to fit the zero-network offline deployment requirement (`docker compose up`) while preserving clear decoupling across domain modules.

### Component Topology

```
+-----------------------------------------------------------------------------------+
|                                 Presentation Layer                                |
|   Next.js 14 (App Router) • React Three Fiber (3D Moments) • Tailwind Glassmorphic |
+-----------------------------------------------------------------------------------+
                                          |
                                          | JSON REST / Session Tokens
                                          v
+-----------------------------------------------------------------------------------+
|                                 Application Layer                                 |
|                                                                                   |
|  +---------------------+  +---------------------+  +---------------------+        |
|  |   Identity & RBAC   |  |   Event Lifecycle   |  |  Submission Engine  |        |
|  |  Session, 5 Roles   |  |  Autopilot (Dial)   |  |  Version Freeze Hsh |        |
|  +---------------------+  +---------------------+  +---------------------+        |
|                                                                                   |
|  +---------------------+  +---------------------+  +---------------------+        |
|  |   Judging Console   |  |   Ranking Engine    |  |  Participant Coach  |        |
|  |  J/K HUD, Anchors   |  |  MAD, Z-Score, Sand |  |  Rubric Bands Heur  |        |
|  +---------------------+  +---------------------+  +---------------------+        |
|                                                                                   |
|  +---------------------+  +---------------------+  +---------------------+        |
|  |  Integrity Engine   |  |     Trust Layer     |  |   Export Engine     |        |
|  |  Disagreement σ >1.5|  |  Append-Only Log,   |  |  JSON/CSV Manifest  |        |
|  |  Targeted 4th Rev   |  |  Hash Chain /verify |  |  SHA-256 Checksum   |        |
|  +---------------------+  +---------------------+  +---------------------+        |
+-----------------------------------------------------------------------------------+
                                          |
                                          | Prisma ORM
                                          v
+-----------------------------------------------------------------------------------+
|                                 Persistence Layer                                 |
|       PostgreSQL 16 (Relational Source of Truth) • Redis 7 • MinIO (Local S3)      |
+-----------------------------------------------------------------------------------+
```

---

## 2. State Machines

### 2.1 Event Lifecycle State Machine
```
   +--------+
   | DRAFT  |
   +----+---+
        |
        v
+-------------------+
| REGISTRATION_OPEN |
+-------+-----------+
        |
        v
+-----------------+
| SUBMISSION_OPEN |
+-------+---------+
        |  (Server-Enforced Deadline)
        v
+-------------------+
| SUBMISSION_FROZEN | <--- Immutable Content Hash Computed
+-------+-----------+
        |
        v
+----------------+
|  JUDGING_OPEN  | <--- Independent Calibrated Ballots
+-------+--------+
        |
        v
+-------------------+
| RESULTS_FINALIZED | <--- Disagreements Resolved, Weights Locked
+-------+-----------+
        |
        v
+-------------------+
| RESULTS_PUBLISHED | <--- Public Gallery & 3D Ceremony Unlocked
+-------+-----------+
        |
        v
    +----------+
    | ARCHIVED |
    +----------+
```

### 2.2 Submission State Machine
```
[DRAFT]  --->  [SUBMITTED]  --->  [FROZEN]  --->  [ELIGIBLE / DISQUALIFIED]
                                     |
                       (Post-Freeze Correction Request)
                                     v
                       [SEPARATE AMENDMENT VERSION]
                       (Frozen content is never mutated)
```

### 2.3 Ballot State Machine
```
[UNASSIGNED]  --->  [ASSIGNED]  --->  [IN_PROGRESS]  --->  [SUBMITTED]  --->  [LOCKED]
                                                                ^                 |
                                                                |   (Override)    |
                                                                +--- [REOPENED] <-+
```

---

## 3. Cryptographic State Lineage & Hash Chain

DOGFOOD OS enforces an append-only cryptographic hash chain over critical competition milestones:

$$\text{CurrentHash}_n = \text{SHA-256}(\text{PreviousHash}_{n-1} + \text{PayloadJson}_n + \text{ResourceId}_n)$$

1. **Genesis Node**: `0000000000000000000000000000000000000000000000000000000000000000`
2. **Submission Freeze Node**: Binds team submission payload, repo URL, demo URL, and timestamp.
3. **Ballot Submit Node**: Binds judge ID, weighted criterion scores, feedback hash, and timestamp.
4. **Ranking Run Node**: Binds active rubric version, normalization algorithm, input ballot IDs, and output ordering.
5. **Publication Node**: Finalized snapshot hash published for public verification.

### Verification Contract (`GET /api/v1/trust/verify/{eventId}`)
- Traverses all $N$ nodes sequentially in UTC order.
- Validates that $\text{node.previousHash} == \text{node}_{n-1}\text{.currentHash}$.
- Re-hashes the payload and asserts strict equality with $\text{node.currentHash}$.
- Execution time: Guaranteed $< 1000\text{ ms}$ for 40 projects and 120 ballots.

---

## 4. Failure Modes & Degradation Hierarchy

| Failure Scenario | System Reaction | Recovery Path |
|---|---|---|
| **External Network Down** | Zero impact. System is 100% self-contained locally. | Continue standard operation. |
| **Local AI Service Unavailable** | Participant Coach degrades gracefully to deterministic rule engine. | Rubric heuristics compute criteria bands and scope pressure. |
| **Extreme Judge Disagreement ($\sigma \ge 1.5$)** | Disagreement engine flags anomaly; organizer command center recommends targeted 4th review. | Targeted review dispatched to neutral high-reliability judge. |
| **Ranking Calculation Error** | Previous ranking run remains unchanged in database. | System logs failure to audit log and preserves active run. |
| **Submission Edit After Deadline** | Request rejected with HTTP 400; frozen version preserved intact. | Team can file an amendment request for organizer approval. |
