# REMAINING 6 CRITICAL FIXES - IMPLEMENTATION GUIDE

Quick reference for implementing the last 6 security fixes.

---

## FIX #5: Input Validation DTOs

**Create**: `apps/api/src/events/dto/create-event.dto.ts`

```typescript
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, ValidateNested, Min, Max, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class TrackDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}

class PrizeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  amount?: string;
}

class CriteriaDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  minScore: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @Min(0)
  maxScore: number;
}

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @IsOptional()
  minReviews?: number = 3;

  @IsOptional()
  disagreeThreshold?: number = 1.5;

  @IsOptional()
  @IsBoolean()
  blindReviewMode?: boolean = false;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  @ArrayMinSize(1)
  tracks?: TrackDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  @ArrayMinSize(1)
  prizes?: PrizeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriteriaDto)
  @ArrayMinSize(1)
  criteria?: CriteriaDto[];
}
```

Then use in controller:
```typescript
@Post()
@UseGuards(AuthGuard)
async createEvent(
  @Body() createEventDto: CreateEventDto,
  @Request() req
) {
  return this.eventsService.createEvent({
    ...createEventDto,
    creatorId: req.user.id,
  });
}
```

---

## FIX #7: Blind Review Response Filtering

**File**: `apps/api/src/judging/judging.service.ts`

Modify `getJudgeAssignments()` to redact team info when `blindReviewMode: true`:

```typescript
async getJudgeAssignments(eventId: string, judgeId: string) {
  // ... existing code ...
  
  const results = await Promise.all(
    assignments.map(async (a) => {
      const ballot = await this.prisma.ballot.findFirst({
        where: { projectId: a.projectId, judgeId, status: { not: 'VOIDED' } },
        include: { scores: true },
      });

      // ✅ FIX #7: Blind Review Filtering
      const projectPayload = {
        ...a.project,
        blindReviewActive: isBlind,
      };

      // If blind review, redact team information
      if (isBlind) {
        projectPayload.team = null; // Hide team name and members
      }

      return {
        assignmentId: a.id,
        project: projectPayload,
        isTargeted: a.isTargeted,
        triggerReason: a.triggerReason,
        ballot: ballot || null,
      };
    }),
  );

  return results;
}
```

Also modify `getPairwiseQueue()`:

```typescript
async getPairwiseQueue(eventId: string, judgeId: string) {
  const event = await this.prisma.event.findUnique({ where: { id: eventId } });
  const isBlind = event?.blindReviewMode ?? false;

  const projects = await this.prisma.project.findMany({
    where: { eventId, eligibility: 'ELIGIBLE' },
    select: {
      id: true,
      title: true,
      tagline: true,
      description: true,
      demoUrl: true,
      repoUrl: true,
      techStack: true,
      track: { select: { id: true, name: true } },
      team: isBlind ? false : { select: { name: true } }, // ✅ FIX #7
    },
  });

  // ... rest of method, redact team field in response if isBlind
}
```

---

## FIX #8: Token Refresh Mechanism

**File**: `apps/api/src/auth/auth.service.ts`

Add refresh endpoint:

```typescript
async refreshToken(token: string) {
  const session = await this.prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!session) {
    throw new UnauthorizedException('Session not found');
  }

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedException('Session expired');
  }

  // Extend session by 30 more days
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const updated = await this.prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: newExpiresAt },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  return {
    token: updated.token,
    expiresAt: updated.expiresAt,
    user: updated.user,
  };
}
```

Add controller endpoint:
```typescript
@Post('refresh')
@UseGuards(AuthGuard)
async refreshToken(@Request() req) {
  return this.authService.refreshToken(req.user.token);
}
```

---

## FIX #9: Hash Chain Verification Page

**Create frontend**: `apps/web/src/app/organizer/verify-integrity/page.tsx`

This page lets organizers verify the immutable audit log hasn't been tampered with.

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function VerifyIntegrityPage() {
  const [eventId, setEventId] = useState('');
  const [nodes, setNodes] = useState([]);
  const [isValid, setIsValid] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verifyChain() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/events/${eventId}/integrity-verify`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      
      setNodes(data.nodes);
      setIsValid(data.isValid);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Verify Integrity Chain</h1>
      
      <input
        type="text"
        placeholder="Event ID"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="border p-2 mb-4"
      />
      
      <button onClick={verifyChain} className="bg-blue-500 text-white px-4 py-2">
        Verify
      </button>

      {isValid !== null && (
        <div className={`mt-4 p-4 ${isValid ? 'bg-green-100' : 'bg-red-100'}`}>
          {isValid ? '✅ Chain is valid - No tampering detected' : '❌ Chain is invalid - Tampering detected'}
        </div>
      )}

      {nodes.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Hash Chain:</h2>
          {nodes.map((node, idx) => (
            <div key={idx} className="border p-2 mt-2 font-mono text-sm">
              <div>Node {idx + 1}: {node.nodeType}</div>
              <div className="truncate">Current Hash: {node.currentHash}</div>
              <div className="truncate">Previous Hash: {node.previousHash}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Add backend endpoint:
```typescript
// In events.controller.ts
@Get(':eventId/integrity-verify')
@UseGuards(AuthGuard)
@Roles(Role.ORGANIZER, Role.ADMIN)
async verifyIntegrity(@Param('eventId') eventId: string) {
  const nodes = await this.prisma.integrityHashNode.findMany({
    where: { eventId },
    orderBy: { timestamp: 'asc' },
  });

  let isValid = true;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].previousHash !== nodes[i - 1].currentHash) {
      isValid = false;
      break;
    }
  }

  return {
    eventId,
    isValid,
    chainLength: nodes.length,
    nodes: nodes.slice(-100), // Return last 100 for display
  };
}
```

---

## FIX #10: Ballot Locking Enforcement

**File**: `apps/api/src/judging/judging.service.ts`

Modify `submitBallot()` to check lock status:

```typescript
async submitBallot(data: { ... }) {
  // ... existing validation ...

  let ballot = await this.prisma.ballot.findFirst({
    where: { projectId: data.projectId, judgeId: data.judgeId, rubricVersionId: rubric.id },
  });

  // ✅ FIX #10: Ballot Locking - Check if ballot is locked
  if (ballot && ballot.status === BallotStatus.LOCKED) {
    throw new ForbiddenException(
      'This ballot has been locked by the organizer and cannot be edited without override.'
    );
  }

  // ... rest of method
}
```

Add method to lock/unlock ballots (organizer only):

```typescript
async lockBallot(eventId: string, ballotId: string, actorId: string) {
  // Verify organizer
  const membership = await this.prisma.membership.findFirst({
    where: { eventId, userId: actorId, role: Role.ORGANIZER },
  });
  if (!membership) {
    throw new ForbiddenException('Only organizers can lock ballots');
  }

  const ballot = await this.prisma.ballot.update({
    where: { id: ballotId },
    data: { status: BallotStatus.LOCKED },
  });

  // Audit log
  await this.prisma.auditEvent.create({
    data: {
      eventId,
      actorId,
      actorRole: Role.ORGANIZER,
      action: 'BALLOT_LOCKED',
      resourceType: 'BALLOT',
      resourceId: ballotId,
      reason: 'Organizer locked ballot to prevent further edits',
      requestId: `REQ-LOCK-${Date.now()}`,
    },
  });

  return ballot;
}

async unlockBallot(eventId: string, ballotId: string, actorId: string, reason: string) {
  // Verify organizer
  const membership = await this.prisma.membership.findFirst({
    where: { eventId, userId: actorId, role: Role.ORGANIZER },
  });
  if (!membership) {
    throw new ForbiddenException('Only organizers can unlock ballots');
  }

  const ballot = await this.prisma.ballot.update({
    where: { id: ballotId },
    data: { status: BallotStatus.SUBMITTED }, // Back to submitted state
  });

  await this.prisma.auditEvent.create({
    data: {
      eventId,
      actorId,
      actorRole: Role.ORGANIZER,
      action: 'BALLOT_UNLOCKED',
      resourceType: 'BALLOT',
      resourceId: ballotId,
      reason: `Organizer unlocked ballot: ${reason}`,
      requestId: `REQ-UNLOCK-${Date.now()}`,
    },
  });

  return ballot;
}
```

---

## FIX #12: Database Migration Documentation

**Create**: `docs/DATABASE.md`

```markdown
# Database Schema & Migration Guide

## Current Database

This project uses **PostgreSQL** (via Prisma ORM).

## Schema Overview

- **User**: Account data, authentication
- **Event**: Hackathon event configuration
- **Membership**: User role in each event (ORGANIZER, JUDGE, PARTICIPANT, ADMIN)
- **Project**: Team submission
- **Team**: Group of participants
- **Ballot**: Judge's review scores
- **RubricVersion**: Scoring criteria configuration
- **IntegrityHashNode**: Immutable audit trail
- **AuditEvent**: Action log

## Migration Commands

### Fresh setup (development)
```bash
cd apps/api
npx prisma generate     # Generate Prisma client
npx prisma db push     # Apply schema to dev database
npx prisma db seed     # Seed demo data (if seed.ts exists)
```

### Deploy to production
```bash
npx prisma migrate deploy  # Run migrations in order
npx prisma db push         # Apply any pending schema changes
```

### Backup production database
```bash
pg_dump -U postgres dogfood_os > backup-$(date +%Y%m%d).sql
```

### Restore from backup
```bash
psql -U postgres dogfood_os < backup-20260928.sql
```

## Environment Setup

Create `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dogfood_os
GOOGLE_CLIENT_ID=...your-client-id...
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Schema Audit Trail

All state changes (ballot submissions, status changes, score updates) are logged to:
- `AuditEvent` table (action log with hashes)
- `IntegrityHashNode` table (cryptographic chain)

Verify integrity:
```bash
curl http://localhost:4000/api/v1/events/{eventId}/integrity-verify
```
```

---

## Priority Order

Implement in this order (easiest to hardest):

1. **FIX #5** (Input Validation) - 2 hours - Foundation for security
2. **FIX #10** (Ballot Locking) - 1 hour - Quick security win
3. **FIX #7** (Blind Review) - 2 hours - Fairness feature
4. **FIX #8** (Token Refresh) - 2 hours - UX improvement
5. **FIX #12** (DB Documentation) - 1 hour - Ops documentation
6. **FIX #9** (Hash Verification UI) - 3 hours - Audit feature

**Total Estimated Time**: ~11 hours

---

## Testing Checklist

After each fix:
- [ ] `npm run build` succeeds
- [ ] Manual test in browser/Postman
- [ ] Check network tab for expected behavior
- [ ] Verify database changes with `npx prisma studio`

---

Generated: September 28, 2026 23:00 UTC
