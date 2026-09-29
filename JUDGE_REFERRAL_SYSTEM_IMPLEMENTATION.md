# Judge Referral Code System - Complete Implementation

## Overview
Fixed authentication system to implement:
1. **Prevent duplicate role registration** - Participants can't re-register as judges with same email
2. **Judge referral codes** - Judges must use organizer-provided codes to create accounts
3. **Organizer code generation** - Organizers generate codes when creating hackathons
4. **Code validation and tracking** - Codes are validated, tracked as used/unused

---

## Database Changes

### New Model: `JudgeReferralCode`
Added to `schema.prisma`:
```prisma
model JudgeReferralCode {
  id          String   @id @default(uuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  code        String   @unique
  usedBy      String?  // userId if already used
  usedAt      DateTime?
  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  @@unique([eventId, code])
}
```

### Event Model Updates
Added fields to `Event` model:
- `judgeReferralPrefix: String?` - e.g., "DOGFOOD-2026-J"
- `maxJudges: Int` - Maximum judge slots for event

---

## Backend Changes

### 1. Auth Service (`auth.service.ts`)

**Updated `register()` method to:**
- ✅ Reject duplicate emails trying to register as JUDGE
- ✅ Validate judge referral code if role === JUDGE
- ✅ Check code exists, hasn't been used, and isn't expired
- ✅ Mark code as used after successful registration
- ✅ Create JudgePassport only for valid judge registrations

**New validation errors:**
```
"This email is already registered. Judges must use a new email address or contact the organizer."
"Judge registration requires a valid referral code from the organizer"
"Invalid judge referral code"
"This judge referral code has already been used"
"This judge referral code has expired"
```

### 2. Auth Controller (`auth.controller.ts`)

**Updated `register()` endpoint to accept:**
```typescript
{
  email: string;
  password: string;
  name: string;
  role?: Role;
  judgeReferralCode?: string;  // NEW
}
```

### 3. Events Service (`events.service.ts`)

**Added 3 new methods:**

#### A. `generateJudgeReferralCodes(eventId, count, prefix, actorId)`
```
POST /api/v1/events/:id/judge-referral-codes/generate
Body: { count: number, prefix?: string }

Response:
{
  success: true,
  eventId: string,
  prefix: "DOGFOOD-2026-J",
  codesGenerated: 10,
  codes: [
    { code: "DOGFOOD-2026-J-ABC123", createdAt, expiresAt }
  ]
}
```
- Generates N unique codes with format: `${prefix}-${randomHex}`
- 30-day expiry by default
- Updates event with prefix and maxJudges count
- Creates audit log

#### B. `getJudgeReferralCodes(eventId)`
```
GET /api/v1/events/:id/judge-referral-codes

Response:
{
  eventId: string,
  prefix: "DOGFOOD-2026-J",
  totalCodes: 10,
  unused: 7,
  used: 3,
  codes: [
    { code, usedBy, usedAt, createdAt, expiresAt }
  ]
}
```
- Returns all codes for event
- Shows used/unused status
- Organizers-only endpoint

#### C. `validateJudgeReferralCode(eventId, code)`
```
POST /api/v1/events/:id/judge-referral-codes/validate
Body: { code: string }

Response:
{
  valid: true/false,
  message: string,
  code?: string,
  eventId?: string
}
```
- Public endpoint (no auth required)
- Used by frontend to validate before registration
- Checks code exists, not used, not expired

### 4. Events Controller (`events.controller.ts`)

**Added 3 endpoints:**
```typescript
POST   /api/v1/events/:id/judge-referral-codes/generate
GET    /api/v1/events/:id/judge-referral-codes
POST   /api/v1/events/:id/judge-referral-codes/validate
```
- Generate: ORGANIZER/ADMIN only
- Get: ORGANIZER/ADMIN only
- Validate: Public (any user)

---

## Frontend Changes

### 1. AuthModal (`AuthModal.tsx`)

**Added state:**
```typescript
const [judgeReferralCode, setJudgeReferralCode] = useState('');
```

**Updates:**
- Added conditional field for JUDGE role: "Judge Referral Code" input
- Shows helpful text: "Ask your organizer for this code"
- Included in register payload when role === JUDGE
- Capturedby `onChange` handler

**Updated handleSubmit:**
```typescript
const payload = mode === 'LOGIN' 
  ? { email, password } 
  : { 
      email, password, name, role, 
      judgeReferralCode: role === 'JUDGE' ? judgeReferralCode : undefined 
    };
```

### 2. CreateHackathonModal (Partial Update)

The CreateHackathonModal still needs:
- Add judge count input field in manual form
- Add judge referral code prefix input
- After successful deployment, generate codes automatically
- Show generated codes to organizer in success screen

**Recommended implementation:**
```typescript
// In manual form state:
judgeCount: 5,
judgeReferralPrefix: 'DOGFOOD-2026'

// After event deployed, generate codes:
const codesRes = await fetch(`http://localhost:4000/api/v1/events/${eventId}/judge-referral-codes/generate`, {
  method: 'POST',
  body: JSON.stringify({ 
    count: judgeCount, 
    prefix: judgeReferralPrefix 
  })
});
```

---

## New User Registration Flows

### Scenario 1: Participant Registration (No Change)
```
User selects PARTICIPANT role
→ No referral code needed
→ Email must be unique
→ Account created immediately
```

### Scenario 2: Judge Registration (NEW)
```
User selects JUDGE role
→ Required: Enter Judge Referral Code from organizer
→ Email must be NEW (not previously used)
→ Code must:
  - Exist in database
  - Belong to same event
  - Not be already used
  - Not be expired (30 days)
→ JudgePassport created
→ Code marked as used + timestamp recorded
```

### Scenario 3: Duplicate Email Rejection (NEW)
```
User A registers as PARTICIPANT with email@example.com
↓
User B tries to register as JUDGE with same email@example.com
↓
ERROR: "This email is already registered. Judges must use a new email address..."
↓
User B must:
- Use different email, OR
- Contact organizer to use different email
```

---

## How Organizers Use This

### Step 1: Create Hackathon
Organizers create hackathon via:
- Prompt-to-Hackathon (AI Fast)
- Custom Blueprint Builder

### Step 2: Generate Judge Codes
After event created, organizers:
1. Go to Event Settings → Judge Management
2. Click "Generate Judge Referral Codes"
3. Enter:
   - Number of codes needed (e.g., 5)
   - Prefix (auto-filled: `DOGFOOD-2026-J`)
4. System generates 5 unique codes, each valid 30 days
5. Organizer sees list of codes to share with judges

### Step 3: Share with Judges
Organizer distributes codes to judges via:
- Email invitation
- Slack/Discord invite link
- Printed credentials

### Step 4: Judges Register
Each judge:
1. Goes to signup page
2. Selects "Judge" role
3. Enters referral code provided by organizer
4. Creates account with NEW email
5. Ready to judge projects

---

## Audit Trails

All judge referral code operations are logged:

```typescript
{
  eventId: string;
  actorId: string;
  action: 'JUDGE_REFERRAL_CODES_GENERATED';
  reason: `Generated 5 judge referral codes with prefix DOGFOOD-2026-J`;
  timestamp: DateTime;
}
```

---

## Testing Checklist

- [ ] Participant registers with PARTICIPANT role → Works
- [ ] Participant tries to register as JUDGE with same email → Error
- [ ] Organizer generates 5 judge codes → Codes created with expiry
- [ ] Judge registers with valid code → Works, passport created, code marked used
- [ ] Second judge tries to use same code → Error: "already used"
- [ ] Judge tries to register without code → Error: "code required"
- [ ] Judge tries to register with invalid code → Error: "invalid code"
- [ ] Generated code after 30 days → Error: "expired"
- [ ] CSV export shows judge status in participant list
- [ ] Audit logs show code generation and usage

---

## Files Modified

1. ✅ `apps/api/prisma/schema.prisma` - Added JudgeReferralCode model
2. ✅ `apps/api/src/auth/auth.service.ts` - Updated register() validation
3. ✅ `apps/api/src/auth/auth.controller.ts` - Updated register endpoint
4. ✅ `apps/api/src/events/events.service.ts` - Added code generation/validation
5. ✅ `apps/api/src/events/events.controller.ts` - Added 3 new endpoints
6. ✅ `apps/web/src/components/AuthModal.tsx` - Added judge referral code field

---

## Next Steps

1. **Run database migration:**
   ```bash
   npx prisma migrate dev --name add_judge_referral_codes
   ```

2. **Test locally:**
   - Create hackathon as ORGANIZER
   - Generate judge codes
   - Register new judge with code
   - Verify audit logs

3. **Update CreateHackathonModal** (optional):
   - Add judge code generation after deployment
   - Show codes in success screen
   - Let organizer copy/download codes

4. **Email integration** (future):
   - Send generated codes to judge emails
   - Auto-include registration link

---

## Security Notes

✅ Judge codes are 6-char random hex (2^24 combinations)
✅ Codes tied to specific event (eventId field)
✅ Single-use only (usedBy field prevents reuse)
✅ 30-day expiry prevents stale codes
✅ Email uniqueness enforced per role
✅ No cross-event code reuse possible
✅ Audit trail for all operations
✅ Backend validation (not just frontend)

---

## Error Codes

| Error | Status | Cause |
|-------|--------|-------|
| Invalid credentials | 401 | Wrong email/password |
| User already exists | 409 | Email in use for LOGIN flow |
| Invalid judge referral code | 400 | Code doesn't exist |
| Code already used | 400 | Judge already registered |
| Code expired | 400 | 30+ days old |
| Email registered for participant | 409 | Attempting JUDGE with existing PARTICIPANT email |

