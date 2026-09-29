# 🔧 CRITICAL FIXES - IMPLEMENTATION GUIDE

## Status: Ready to Implement
**Total Critical Issues**: 12  
**Estimated Time**: 26.25 hours  
**Priority**: 🔴 DO BEFORE PRODUCTION

---

## FIX #1: JWT SIGNATURE VERIFICATION (CRITICAL SECURITY)
**File**: `apps/api/src/auth/auth.controller.ts`  
**Current Code** (VULNERABLE):
```typescript
@Post('google')
async googleAuth(@Body() body: { credential: string }) {
  const decoded = jwt_decode(body.credential);  // ❌ NO VERIFICATION
  return this.authService.handleGoogleLogin(decoded);
}
```

**Fixed Code**:
```typescript
import { OAuth2Client } from 'google-auth-library';

@Controller('api/v1/auth')
export class AuthController {
  private googleClient: OAuth2Client;

  constructor(private authService: AuthService) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  @Post('google')
  async googleAuth(@Body() body: { credential: string }) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: body.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid token payload');
      
      return this.authService.handleGoogleLogin({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture,
      });
    } catch (error) {
      throw new UnauthorizedException(`Invalid Google token: ${error.message}`);
    }
  }
}
```

**Install Dependency**:
```bash
npm install google-auth-library
```

**Verification**:
```bash
# Test with invalid token - should throw UnauthorizedException
curl -X POST http://localhost:4000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"invalid.token.here"}'
# Should return 401, not 200
```

---

## FIX #2: CORS RESTRICTION (CRITICAL SECURITY)
**File**: `apps/api/src/main.ts`  
**Current Code** (VULNERABLE):
```typescript
app.enableCors({
  origin: '*',  // ❌ ALLOWS ANYONE
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
```

**Fixed Code**:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',
  process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
].flat().filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
```

**.env Update**:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Verification**:
```bash
# Should succeed
curl -X GET http://localhost:4000/api/v1/events \
  -H "Origin: http://localhost:3000"
# Should show: Access-Control-Allow-Origin: http://localhost:3000

# Should fail
curl -X GET http://localhost:4000/api/v1/events \
  -H "Origin: http://malicious.com"
# Should show: 403 CORS policy violation
```

---

## FIX #3: RATE LIMITING (CRITICAL SECURITY)
**File**: `apps/api/src/main.ts`  
**Install Dependency**:
```bash
npm install @nestjs/throttler
```

**Updated Code**:
```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60000,  // 1 minute
      limit: 100,  // 100 requests per minute (default)
      // More specific limits per endpoint in decorators
    }),
    // ... other imports
  ],
})
export class AppModule {}

// In main.ts bootstrap:
app.useGlobalGuards(new ThrottlerGuard());
```

**Auth Controller**:
```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('api/v1/auth')
export class AuthController {
  
  @Post('login')
  @Throttle(5, 60)  // Max 5 attempts per 60 seconds
  async login(@Body() body: LoginDTO) {
    return this.authService.login(body);
  }

  @Post('register')
  @Throttle(3, 3600)  // Max 3 registrations per hour
  async register(@Body() body: RegisterDTO) {
    return this.authService.register(body);
  }

  @Post('google')
  @Throttle(10, 60)  // Max 10 OAuth attempts per minute
  async googleAuth(@Body() body: { credential: string }) {
    return this.authService.handleGoogleLogin(body);
  }
}
```

**Verification**:
```bash
# Run 6 logins in 60 seconds
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Attempt $i"
done
# 6th attempt should return 429 Too Many Requests
```

---

## FIX #4: DATA ISOLATION (CRITICAL DATA BREACH)
**Files to Fix**: 3 services

### File A: `apps/api/src/ranking/ranking.service.ts`
**Current Code** (VULNERABLE):
```typescript
async getResults(eventId: string, rankingRunId: string) {
  const run = await this.prisma.rankingRun.findUnique({
    where: { id: rankingRunId },
    include: {
      rankedProjects: {
        include: { project: { include: { ballots: true } } }
      }
    }
  });
  // ❌ No eventId filter - crosses events
}
```

**Fixed Code**:
```typescript
async getResults(eventId: string, rankingRunId: string) {
  // Verify rankingRun belongs to eventId
  const run = await this.prisma.rankingRun.findUnique({
    where: { id: rankingRunId },
    include: { event: true }
  });
  
  if (!run || run.eventId !== eventId) {
    throw new ForbiddenException('Ranking does not belong to this event');
  }
  
  // Now safe to fetch related data
  const rankedProjects = await this.prisma.rankedProject.findMany({
    where: { rankingRunId, project: { eventId } },  // ✅ FILTERED
    include: {
      project: {
        where: { eventId }  // ✅ DOUBLE FILTER
      }
    }
  });
}
```

### File B: `apps/api/src/judging/judging.service.ts`
**Current Code** (VULNERABLE):
```typescript
async getBallots(projectId: string) {
  return this.prisma.ballot.findMany({
    where: { projectId }  // ❌ No eventId check
  });
}
```

**Fixed Code**:
```typescript
async getBallots(eventId: string, projectId: string) {
  // Verify project exists in event
  const project = await this.prisma.project.findUnique({
    where: { id: projectId }
  });
  
  if (!project || project.eventId !== eventId) {
    throw new ForbiddenException('Project not found in this event');
  }
  
  return this.prisma.ballot.findMany({
    where: { 
      projectId,
      project: { eventId }  // ✅ FILTERED
    }
  });
}
```

### File C: `apps/api/src/intelligence/intelligence.service.ts`
**Same Pattern**: Add eventId verification to all queries

**Verification**:
```typescript
// Test 1: Create two events
const event1 = await createEvent('Event 1');
const event2 = await createEvent('Event 2');

// Test 2: Create project in event1
const proj1 = await createProject(event1.id, 'Project A');

// Test 3: Try to access project from event2 (should fail)
const result = await api.getProjectDetails(event2.id, proj1.id);
// Should throw 403 Forbidden, NOT return project data
```

---

## FIX #5: INPUT VALIDATION DTO (MEDIUM SECURITY)
**File**: `apps/api/src/events/events.controller.ts`  
**Create File**: `apps/api/src/events/dto/create-event.dto.ts`

```typescript
import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsISO8601,
  Length,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Type,
} from 'class-validator';
import { Transform } from 'class-transformer';

class TrackDTO {
  @IsString() @Length(1, 100) name: string;
  @IsString() @Length(1, 500) description: string;
}

class PrizeDTO {
  @IsString() @Length(1, 100) title: string;
  @IsString() @Length(1, 500) description: string;
  @IsString() @Length(1, 50) amount: string;
}

class CriteriaDTO {
  @IsString() @Length(1, 100) name: string;
  @IsString() @Length(1, 500) description: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1) weight: number;
  @IsNumber() @Min(1) @Max(10) minScore: number;
  @IsNumber() @Min(1) @Max(10) maxScore: number;
}

export class CreateEventDTO {
  @IsString()
  @Length(3, 200)
  name: string;

  @IsString()
  @Length(3, 100)
  @Transform(({ value }) => value.toLowerCase().replace(/\s+/g, '-'))
  slug: string;

  @IsString()
  @Length(10, 2000)
  description: string;

  @IsString()
  timezone: string = 'UTC';

  @IsISO8601()
  subDeadline: Date;

  @IsISO8601()
  freezeDeadline: Date;

  @IsISO8601()
  judgeDeadline: Date;

  @IsInt()
  @Min(1)
  @Max(10)
  minReviews: number = 3;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.5)
  @Max(5)
  disagreeThreshold: number = 1.5;

  @IsBoolean()
  blindReviewMode: boolean = false;

  @ValidateNested({ each: true })
  @Type(() => TrackDTO)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  tracks: TrackDTO[];

  @ValidateNested({ each: true })
  @Type(() => PrizeDTO)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  prizes: PrizeDTO[];

  @ValidateNested({ each: true })
  @Type(() => CriteriaDTO)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  criteria: CriteriaDTO[];
}
```

**Update Controller**:
```typescript
import { CreateEventDTO } from './dto/create-event.dto.ts';

@Post()
@Roles(Role.ORGANIZER, Role.ADMIN)
async createEvent(
  @Body() body: CreateEventDTO,  // ✅ DTO validates
  @Req() req: any
) {
  return this.eventsService.createEvent({
    ...body,
    creatorId: req.user.id,
  });
}
```

**Verification**:
```bash
# Valid request - succeeds
curl -X POST http://localhost:4000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "name": "Valid Event",
    "slug": "valid-event",
    "description": "This is a valid event description",
    "subDeadline": "2026-02-28T14:00:00Z",
    "freezeDeadline": "2026-03-01T14:00:00Z",
    "judgeDeadline": "2026-03-07T14:00:00Z",
    "minReviews": 3,
    "tracks": [{"name": "Open", "description": "Any project"}],
    "prizes": [{"title": "First", "description": "Winner", "amount": "$5000"}],
    "criteria": [{"name": "Tech", "description": "Code quality", "weight": 0.25, "minScore": 1, "maxScore": 10}]
  }'
# Returns 201 Created

# Invalid request - fails validation
curl -X POST http://localhost:4000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "name": "X",  # Too short
    "minReviews": 99,  # Too high
    "tracks": []  # Empty
  }'
# Returns 400 Bad Request with validation details
```

---

## FIX #6: TRANSACTION SAFETY (MEDIUM INTEGRITY)
**File**: `apps/api/src/events/events.service.ts`  
**Current Code** (NOT TRANSACTIONAL):
```typescript
async createEvent(data: CreateEventDTO & { creatorId: string }) {
  const event = await this.prisma.event.create({ data: { ... } });
  await this.prisma.membership.create({ data: { userId, eventId, role: ORGANIZER } });
  const rubric = await this.prisma.rubricVersion.create({ data: { ... } });
  await this.prisma.rubricCriteria.createMany({ data: criteria });
  // ❌ If criteria fails, orphaned event + rubric
}
```

**Fixed Code**:
```typescript
async createEvent(data: CreateEventDTO & { creatorId: string }) {
  return await this.prisma.$transaction(async (tx) => {
    // Step 1: Create event
    const event = await tx.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        timezone: data.timezone,
        subDeadline: data.subDeadline,
        freezeDeadline: data.freezeDeadline,
        judgeDeadline: data.judgeDeadline,
        minReviews: data.minReviews,
        disagreeThreshold: data.disagreeThreshold,
        blindReviewMode: data.blindReviewMode,
        status: EventStatus.DRAFT,
      },
    });

    // Step 2: Create membership
    await tx.membership.create({
      data: {
        userId: data.creatorId,
        eventId: event.id,
        role: Role.ORGANIZER,
      },
    });

    // Step 3: Create rubric version
    const rubric = await tx.rubricVersion.create({
      data: {
        eventId: event.id,
        version: 1,
        isLocked: false,
      },
    });

    // Step 4: Create tracks
    if (data.tracks.length > 0) {
      await tx.track.createMany({
        data: data.tracks.map((t) => ({
          eventId: event.id,
          name: t.name,
          description: t.description,
        })),
      });
    }

    // Step 5: Create prizes
    if (data.prizes.length > 0) {
      await tx.prize.createMany({
        data: data.prizes.map((p) => ({
          eventId: event.id,
          title: p.title,
          description: p.description,
          amount: p.amount,
        })),
      });
    }

    // Step 6: Create criteria
    if (data.criteria.length > 0) {
      await tx.rubricCriteria.createMany({
        data: data.criteria.map((c) => ({
          rubricVersionId: rubric.id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          minScore: c.minScore,
          maxScore: c.maxScore,
        })),
      });
    }

    // Step 7: Link rubric to event
    await tx.event.update({
      where: { id: event.id },
      data: { currentRubricId: rubric.id },
    });

    return event;
    // ✅ If any step fails, entire transaction rolls back
  });
}
```

**Verification**:
```bash
# Test 1: Valid creation - succeeds
curl -X POST http://localhost:4000/api/v1/events \
  -H "Authorization: Bearer token" \
  -d '{ valid event data }'
# Returns 201, event created with all relations

# Test 2: Invalid criteria weight - entire transaction rolls back
curl -X POST http://localhost:4000/api/v1/events \
  -H "Authorization: Bearer token" \
  -d '{
    ... valid event data,
    "criteria": [
      { "weight": 0.5, ...},
      { "weight": 0.3, ...},
      { "weight": 0.3, ...}  # Total = 1.1, invalid
    ]
  }'
# Returns 400, AND event not created (not orphaned)
```

---

## FIX #7: BLIND REVIEW FILTERING (HIGH DATA INTEGRITY)
**File**: `apps/api/src/judging/judging.service.ts`  
**Current Code** (LEAKS TEAM DATA):
```typescript
async getAssignment(eventId: string, assignmentId: string) {
  return this.prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      project: {
        include: {
          team: { include: { members: true } },  // ❌ TEAM LEAKED
          ballots: true,  // ❌ PREVIOUS SCORES LEAKED
        }
      }
    }
  });
}
```

**Fixed Code**:
```typescript
async getAssignment(eventId: string, assignmentId: string) {
  const event = await this.prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundException('Event not found');

  const assignment = await this.prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.eventId !== eventId) {
    throw new ForbiddenException('Assignment not found');
  }

  // Only return project data, not team info
  const project = await this.prisma.project.findUnique({
    where: { id: assignment.projectId },
    select: {
      id: true,
      title: true,
      tagline: true,
      description: true,
      repoUrl: true,
      demoUrl: true,
      techStack: true,
      featuresList: true,
      // ✅ DON'T SELECT:
      // teamId, team, createdBy, createdAt (might identify)
      // ✅ DON'T INCLUDE:
      // ballots (previous judges' scores), teamMembers
    },
  });

  return {
    id: assignment.id,
    projectId: assignment.projectId,
    project,
    targetReviewReason: assignment.targetReviewReason || null,
    // ✅ No team info
  };
}
```

**Verification**:
```bash
curl -X GET http://localhost:4000/api/v1/events/evt-123/judging/assignments/asn-456 \
  -H "Authorization: Bearer judge-token"

# Response should have:
# {
#   "id": "asn-456",
#   "projectId": "proj-789",
#   "project": {
#     "id": "proj-789",
#     "title": "SmartChat AI",
#     "description": "...",
#     // NO: teamId, team, createdBy, ballots
#   }
# }

# Check: If teamId is in response, blind review is broken
```

---

## FIX #8-12: REMAINING CRITICAL FIXES

### FIX #8: Token Refresh
**Estimated Effort**: 2 hours  
**Creates**:
- RefreshTokenDTO
- POST /api/v1/auth/refresh endpoint
- Session.refreshToken field in Prisma
- Token rotation logic

### FIX #9: Hash Chain Verification UI
**Estimated Effort**: 3 hours  
**Creates**:
- `/verify` page calling GET /api/v1/trust/verify/{eventId}
- Visual hash chain display
- Verification status indicator

### FIX #10: Ballot Locking
**Estimated Effort**: 1 hour  
**Changes**: Add status check before ballot update

### FIX #11: Migration Documentation
**Estimated Effort**: 1 hour  
**Creates**: docs/DATABASE.md with migration commands

### FIX #12: Error Interceptor
**Estimated Effort**: 2 hours  
**Creates**: Global exception filter

---

## IMPLEMENTATION SCHEDULE

**Day 1 (Priority Order)**:
1. ✅ JWT verification (1h)
2. ✅ CORS restriction (0.5h)
3. ✅ Data isolation fixes (3h)
4. ✅ Rate limiting (1.5h)

**Day 2**:
1. ✅ Input validation DTO (2h)
2. ✅ Transaction safety (3h)
3. ✅ Blind review filtering (2h)

**Day 3**:
1. ✅ Token refresh (2h)
2. ✅ Ballot locking (1h)
3. ✅ Hash chain verification (3h)

**Day 4**:
1. ✅ Migration docs (1h)
2. ✅ Error interceptor (2h)
3. ✅ Testing & validation (4h)

---

## TESTING COMMANDS

```bash
# Build and compile
npm run build

# Run unit tests
npm run test

# Run auth tests
npm run test -- auth.service.spec.ts

# Run security tests
npm run test -- security.spec.ts

# Type check
npx tsc --noEmit

# Lint
npx eslint apps/**/*.ts

# Check for vulnerabilities
npm audit

# Manual test of /verify endpoint
curl -X GET http://localhost:4000/api/v1/trust/verify/evt-123 \
  -H "Authorization: Bearer token"
```

---

## DEPLOYMENT VALIDATION

After all fixes:

```bash
✅ No TypeScript errors
✅ All tests passing
✅ Security audit passed
✅ Rate limiting active
✅ Data isolation verified
✅ JWT verification working
✅ CORS correctly configured
✅ Transactions tested
✅ Blind review filters working
✅ Token refresh implemented
✅ Ballot locking enforced
✅ Hash chain verifiable
```

**THEN**: Safe to deploy to production

---

**Next Step**: Start with FIX #1 (JWT verification) - takes 1 hour and addresses critical security vulnerability.
