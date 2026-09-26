# DOGFOOD OS — Threat Model & Security Assurance

## 1. Protected Assets & Trust Boundaries

```
[ UNTRUSTED INTERNET / LAN ]
              |
              v (Strict Authentication & Rate Limiting)
[ APPLICATION BOUNDARY (NestJS RBAC Guards) ]
              |
              +---> [ SENSITIVE ASSETS ]
              |     1. Pre-publication peer ballots
              |     2. Raw participant draft ideas (pre-submission)
              |     3. Cryptographic state hash nodes
              |     4. Finalized ranking snapshots
              |     5. Append-only audit logs
              v
[ DATA LAYER (PostgreSQL 16) ]
```

---

## 2. Executable Attack Test Matrix

| Attack Vector | Attacker Profile | Attempted Action | Expected Control | HTTP Status | Audit Action |
|---|---|---|---|---|---|
| **Peer Ballot Snooping** | Judge | Queries `/api/v1/events/:id/judging/projects/:pid/peer-ballots` pre-publication | Backend Policy Guard | `403 Forbidden` | `UNAUTHORIZED_ACCESS_BLOCKED` |
| **Post-Deadline Tamper** | Participant | Submits material update to frozen project via `/api/v1/submissions` | Server Freeze Timestamp | `400 Bad Request` | `SUBMISSION_TAMPER_REJECTED` |
| **Privilege Escalation** | Participant | Calls `/api/v1/events/:id/status` to advance event status | RolesGuard (requires ORGANIZER) | `403 Forbidden` | `UNAUTHORIZED_ACCESS_BLOCKED` |
| **Cryptographic Block Tampering** | Host / Malicious Actor | Directly alters payload score inside database `IntegrityHashNode` | SHA-256 Hash Chain Verification | Detected in `< 1s` | `TAMPER_FLAGGED_NODE_CORRUPT` |
| **State Finalization Mutation** | Organizer | Attempts to publish new ranking after `RESULTS_PUBLISHED` lock | Immutable State Lock | `409 Conflict` | `MUTATION_ON_LOCKED_STATE_DENIED` |

---

## 3. Cryptographic Verification Boundary

> [!NOTE]
> Local hashing proves that the exported sequence of events has not been silently modified after creation. It does not prove physical control over the host running the software. DOGFOOD OS documents this boundary clearly to prevent inflated or ungrounded security claims.
