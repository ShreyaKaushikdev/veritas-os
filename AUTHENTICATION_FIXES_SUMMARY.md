# Authentication System Fixes - Executive Summary

## Problems Fixed

### ❌ PROBLEM 1: Participants Re-registering as Judges
**Before:** A participant could register with email@example.com as PARTICIPANT, then register again with the same email as JUDGE
```
User A: email@example.com → PARTICIPANT role ✓
User A: email@example.com → JUDGE role ✓ (BUG!)
```

**After:** Email uniqueness is enforced across all roles
```
User A: email@example.com → PARTICIPANT role ✓
User A: email@example.com → JUDGE role ✗ 
ERROR: "This email is already registered. Judges must use a new email..."
```

---

### ❌ PROBLEM 2: No Judge Registration Validation
**Before:** Anyone could register as JUDGE without any credentials or invitation
```
Signup Form → Select "JUDGE" role → Create account ✓
(No verification, no code, no organizer permission)
```

**After:** Judges MUST provide valid referral code from organizer
```
Signup Form → Select "JUDGE" role → Enter Referral Code → Create account ✓
(Code must be valid, not used, not expired)
```

---

### ❌ PROBLEM 3: No Referral Code System
**Before:** Organizers had no way to control who becomes judges
- Any email could register as JUDGE
- No way to limit judge count
- No tracking of judge assignments

**After:** Complete referral code system
- Organizers generate unique codes per hackathon
- Each code valid for 30 days
- Single-use only (prevents sharing)
- Full audit trail of code usage

---

## What Now Happens

### Step 1️⃣ Organizer Creates Hackathon
```
Organizer clicks "Create Hackathon"
→ Event created
→ Organizer becomes ORGANIZER role
```

### Step 2️⃣ Organizer Generates Judge Codes
```
In Event Settings → Judge Management
Organizer clicks "Generate Judge Codes"
Enters:
  - Number of judges needed (e.g., 5)
  - Prefix (auto: DOGFOOD-2026-J)
Organizer sees:
  DOGFOOD-2026-J-ABC123
  DOGFOOD-2026-J-DEF456
  DOGFOOD-2026-J-GHI789
  ... (5 codes)
```

### Step 3️⃣ Organizer Shares Codes with Judges
```
Email to judge@example.com:
"You're invited to judge! 
Register with code: DOGFOOD-2026-J-ABC123
Link: https://app.com/signup?role=JUDGE"
```

### Step 4️⃣ Judge Registers
```
Signup Page:
  Email: judge@example.com ✓
  Password: secret123 ✓
  Role: [JUDGE ▼] ✓
  Judge Code: DOGFOOD-2026-J-ABC123 ✓
  
✓ Account created as JUDGE
✓ JudgePassport created
✓ Code marked as "used"
```

### Step 5️⃣ System Prevents Code Reuse
```
Second judge tries: DOGFOOD-2026-J-ABC123
ERROR: "This code has already been used"

Each judge MUST have unique code
```

---

## Technical Implementation

### Database
- ✅ New `JudgeReferralCode` model
- ✅ Tracks: code, eventId, usedBy, usedAt, expiresAt
- ✅ 30-day expiry
- ✅ Unique constraint per event

### Backend APIs
- ✅ `POST /api/v1/events/:id/judge-referral-codes/generate` - Create codes
- ✅ `GET /api/v1/events/:id/judge-referral-codes` - View codes
- ✅ `POST /api/v1/events/:id/judge-referral-codes/validate` - Validate code

### Auth Updates
- ✅ Register endpoint accepts `judgeReferralCode` parameter
- ✅ Validates code before creating judge account
- ✅ Rejects duplicate emails trying to be JUDGE
- ✅ Creates JudgePassport only after code validation

### Frontend
- ✅ AuthModal shows "Judge Referral Code" field when JUDGE role selected
- ✅ Sends code with registration request
- ✅ Shows error if code invalid/expired/used

---

## User Flows

### ✅ FLOW 1: New Participant
```
Homepage → Click "Register" 
→ Select "Participant" 
→ Email, Password, Name 
→ Account created ✓
```

### ✅ FLOW 2: New Judge (With Code)
```
Homepage → Click "Register" 
→ Select "Judge" 
→ Email, Password, Name, Judge Code 
→ System validates code 
→ Account created ✓
```

### ❌ FLOW 3: Duplicate Email (Rejected)
```
User A registers as PARTICIPANT: alice@email.com ✓
User A tries to register as JUDGE: alice@email.com 
ERROR: Email already registered
Must use: bob@email.com
```

### ❌ FLOW 4: Invalid Code (Rejected)
```
User clicks Register → Selects JUDGE 
Enters code: INVALID-CODE-123
ERROR: Invalid judge referral code
Must ask organizer for code
```

### ❌ FLOW 5: Code Already Used (Rejected)
```
First judge: code DOGFOOD-J-ABC123 ✓
Second judge: code DOGFOOD-J-ABC123 
ERROR: This code has already been used
Organizer must generate new code
```

---

## Security Benefits

✅ **Prevents unauthorized judges**
   - Can't self-assign judge role
   - Must have organizer permission

✅ **Prevents judge impersonation**
   - Each email unique per event
   - Can't hijack existing accounts

✅ **Prevents code reuse**
   - Single-use codes only
   - Tracks who used what code

✅ **Automatic expiry**
   - Codes expire after 30 days
   - Prevents old compromised codes

✅ **Audit trail**
   - All code generation logged
   - All code usage logged
   - Who generated codes, when
   - Who used codes, when

---

## Files Changed

| File | Changes |
|------|---------|
| `schema.prisma` | Added JudgeReferralCode model |
| `auth.service.ts` | Added judge code validation |
| `auth.controller.ts` | Added judgeReferralCode param |
| `events.service.ts` | Added 3 code management methods |
| `events.controller.ts` | Added 3 new endpoints |
| `AuthModal.tsx` | Added Judge Code input field |

---

## Testing the System

### Test 1: Generate Codes
```bash
POST http://localhost:4000/api/v1/events/live-node-d1/judge-referral-codes/generate
{
  "count": 5,
  "prefix": "DOGFOOD-2026"
}

Response: 5 unique codes generated
```

### Test 2: View Codes
```bash
GET http://localhost:4000/api/v1/events/live-node-d1/judge-referral-codes

Response:
{
  "totalCodes": 5,
  "unused": 5,
  "used": 0,
  "codes": [...]
}
```

### Test 3: Validate Code
```bash
POST http://localhost:4000/api/v1/events/live-node-d1/judge-referral-codes/validate
{
  "code": "DOGFOOD-2026-ABC123"
}

Response: { "valid": true, "message": "Judge referral code is valid" }
```

### Test 4: Register Judge
```bash
POST http://localhost:4000/api/v1/auth/register
{
  "email": "judge@example.com",
  "password": "secret123",
  "name": "Dr. Sarah Chen",
  "role": "JUDGE",
  "judgeReferralCode": "DOGFOOD-2026-ABC123"
}

Response: Account created, JudgePassport created ✓
```

### Test 5: Prevent Duplicate Email
```bash
// First register as PARTICIPANT
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "role": "PARTICIPANT"
}
✓ Success

// Try to register as JUDGE with same email
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "role": "JUDGE",
  "judgeReferralCode": "VALID-CODE"
}
✗ Error: "Email already registered. Judges must use new email..."
```

---

## What's Next?

### Optional: CreateHackathonModal Enhancement
When organizer creates hackathon:
1. Ask: "How many judges needed?"
2. After deployment: Auto-generate codes
3. Show generated codes in success screen
4. Let organizer copy/download codes
5. Offer to email codes to judges

### Optional: Judge Management Dashboard
Organizers can:
- View all generated codes
- See which judges used which codes
- Revoke codes (if needed)
- Generate more codes anytime
- Download codes as CSV

### Optional: Email Integration
Auto-send emails with:
- Unique registration link with code pre-filled
- Invitation from organizer
- Event details
- Judging guidelines

---

## One-Line Summary

🔐 **Judges now require valid referral codes from organizers, preventing unauthorized judge registration and ensuring organizer control over judging panel.**
