# Judge Referral Code API Reference

## Base URL
```
http://localhost:4000
```

---

## Authentication Endpoints

### Register as Participant
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123",
  "name": "Alice Chen",
  "role": "PARTICIPANT"
}
```

**Response (201 Created):**
```json
{
  "token": "abc123def456...",
  "user": {
    "id": "user-001",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "role": "PARTICIPANT",
    "createdAt": "2026-09-28T10:00:00Z"
  }
}
```

---

### Register as Judge (NEW)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "judge@example.com",
  "password": "password123",
  "name": "Dr. Sarah Chen",
  "role": "JUDGE",
  "judgeReferralCode": "DOGFOOD-2026-J-ABC123"
}
```

**Response (201 Created):**
```json
{
  "token": "xyz789...",
  "user": {
    "id": "user-002",
    "email": "judge@example.com",
    "name": "Dr. Sarah Chen",
    "role": "JUDGE",
    "createdAt": "2026-09-28T10:01:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid judge referral code"
}
```

**Other Errors:**
```json
{
  "message": "Judge registration requires a valid referral code from the organizer"
}
```
```json
{
  "message": "This judge referral code has already been used"
}
```
```json
{
  "message": "This judge referral code has expired"
}
```
```json
{
  "message": "This email is already registered. Judges must use a new email address or contact the organizer."
}
```

---

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "judge@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "xyz789...",
  "user": {
    "id": "user-002",
    "email": "judge@example.com",
    "name": "Dr. Sarah Chen",
    "role": "JUDGE"
  }
}
```

---

## Judge Referral Code Management Endpoints

### Generate Judge Referral Codes
**Organizers only**

```http
POST /api/v1/events/:eventId/judge-referral-codes/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "count": 5,
  "prefix": "DOGFOOD-2026"
}
```

**Parameters:**
- `count` (required): Number of codes to generate (1-100)
- `prefix` (optional): Code prefix. Default: `{event.slug}-J`

**Response (201 Created):**
```json
{
  "success": true,
  "eventId": "event-001",
  "prefix": "DOGFOOD-2026",
  "codesGenerated": 5,
  "codes": [
    {
      "code": "DOGFOOD-2026-ABC123",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-DEF456",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-GHI789",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-JKL012",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-MNO345",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    }
  ]
}
```

**Errors:**
```json
{
  "message": "Cannot generate more than 100 codes at once"
}
```

---

### Get All Judge Referral Codes for Event
**Organizers only**

```http
GET /api/v1/events/:eventId/judge-referral-codes
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "eventId": "event-001",
  "prefix": "DOGFOOD-2026",
  "totalCodes": 5,
  "unused": 3,
  "used": 2,
  "codes": [
    {
      "code": "DOGFOOD-2026-ABC123",
      "usedBy": null,
      "usedAt": null,
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-DEF456",
      "usedBy": "user-002",
      "usedAt": "2026-09-28T10:15:30Z",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-GHI789",
      "usedBy": "user-003",
      "usedAt": "2026-09-28T10:16:45Z",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-JKL012",
      "usedBy": null,
      "usedAt": null,
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "DOGFOOD-2026-MNO345",
      "usedBy": null,
      "usedAt": null,
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    }
  ]
}
```

---

### Validate Judge Referral Code
**Public endpoint - no authentication required**

```http
POST /api/v1/events/:eventId/judge-referral-codes/validate
Content-Type: application/json

{
  "code": "DOGFOOD-2026-ABC123"
}
```

**Response (200 OK - Valid Code):**
```json
{
  "valid": true,
  "message": "Judge referral code is valid",
  "code": "DOGFOOD-2026-ABC123",
  "eventId": "event-001"
}
```

**Response (200 OK - Invalid Code):**
```json
{
  "valid": false,
  "message": "Invalid judge referral code"
}
```

**Response (200 OK - Already Used):**
```json
{
  "valid": false,
  "message": "This judge referral code has already been used"
}
```

**Response (200 OK - Expired):**
```json
{
  "valid": false,
  "message": "This judge referral code has expired"
}
```

---

## Complete Judge Registration Flow

### Step 1: Organizer Generates Codes
```bash
curl -X POST http://localhost:4000/api/v1/events/live-node-d1/judge-referral-codes/generate \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3,
    "prefix": "MYEVENT-2026"
  }'
```

**Output:**
```
MYEVENT-2026-XYZ789
MYEVENT-2026-ABC123
MYEVENT-2026-DEF456
```

### Step 2: Organizer Shares Code with Judge
```
Email to judge:
Subject: You're invited to judge!
Body: 
  Your judge referral code: MYEVENT-2026-XYZ789
  Register here: https://app.com/signup?role=judge
```

### Step 3: Judge Registers with Code
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "judge@university.edu",
    "password": "SecurePassword123!",
    "name": "Dr. Jane Smith",
    "role": "JUDGE",
    "judgeReferralCode": "MYEVENT-2026-XYZ789"
  }'
```

**Output:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user-999",
    "email": "judge@university.edu",
    "name": "Dr. Jane Smith",
    "role": "JUDGE",
    "createdAt": "2026-09-28T12:00:00Z"
  }
}
```

### Step 4: Organizer Verifies Code Usage
```bash
curl -X GET http://localhost:4000/api/v1/events/live-node-d1/judge-referral-codes \
  -H "Authorization: Bearer $ORGANIZER_TOKEN"
```

**Output shows:**
- MYEVENT-2026-XYZ789 ✓ `usedBy: user-999, usedAt: 2026-09-28T12:00:00Z`
- MYEVENT-2026-ABC123 ✗ `usedBy: null, usedAt: null`
- MYEVENT-2026-DEF456 ✗ `usedBy: null, usedAt: null`

---

## Error Handling

### 400 Bad Request
- Invalid judge referral code format
- Code doesn't exist
- Code already used
- Code expired
- Missing required parameters

### 401 Unauthorized
- Invalid token
- Organizer-only endpoints accessed by non-organizer

### 409 Conflict
- Email already registered (when trying to register as JUDGE)

### 500 Internal Server Error
- Database errors
- Unexpected server issues

---

## Code Format & Expiry

### Format
```
[PREFIX]-[6-CHAR-HEX]
Example: DOGFOOD-2026-J-ABC123
```

- Prefix: `{event.slug}` + `-J` (customizable)
- Suffix: 6 random hexadecimal characters (2^24 combinations)
- Total length: 15-25 characters

### Expiry
- Default: 30 days from creation
- Can be customized when generated
- After expiry, registration fails with "code expired"

### Security
- Single-use only (one judge per code)
- Event-specific (can't use code from different event)
- Tracked in audit logs
- All operations logged

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, validation) |
| 201 | Created (registration, code generation) |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 409 | Conflict (duplicate email) |
| 500 | Server error |

---

## Example: Complete Test Scenario

```bash
#!/bin/bash
set -e

API="http://localhost:4000"
EVENT_ID="live-node-d1"

# 1. Get organizer token (assuming already logged in)
ORGANIZER_TOKEN="org-token-xyz..."

# 2. Generate 3 judge codes
echo "📋 Generating judge codes..."
CODES=$(curl -s -X POST $API/api/v1/events/$EVENT_ID/judge-referral-codes/generate \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3,
    "prefix": "TESTCON"
  }' | jq -r '.codes[].code')

CODE1=$(echo "$CODES" | head -1)
echo "✓ Generated codes: $CODES"

# 3. Validate first code
echo "🔍 Validating code: $CODE1"
VALID=$(curl -s -X POST $API/api/v1/events/$EVENT_ID/judge-referral-codes/validate \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE1\"}" | jq '.valid')
echo "✓ Code valid: $VALID"

# 4. Register judge with code
echo "👨‍⚖️ Registering judge..."
RESPONSE=$(curl -s -X POST $API/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testjudge@example.com\",
    \"password\": \"Test123456\",
    \"name\": \"Test Judge\",
    \"role\": \"JUDGE\",
    \"judgeReferralCode\": \"$CODE1\"
  }")

JUDGE_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
JUDGE_ROLE=$(echo "$RESPONSE" | jq -r '.user.role')
echo "✓ Judge registered. Role: $JUDGE_ROLE"

# 5. View all codes (organizer)
echo "📊 Viewing all codes..."
curl -s -X GET $API/api/v1/events/$EVENT_ID/judge-referral-codes \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" | jq '.'

# 6. Try to reuse code (should fail)
echo "❌ Attempting to reuse code (should fail)..."
curl -s -X POST $API/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"another@example.com\",
    \"password\": \"Test123456\",
    \"name\": \"Another Judge\",
    \"role\": \"JUDGE\",
    \"judgeReferralCode\": \"$CODE1\"
  }" | jq '.message'

echo "✅ All tests passed!"
```

---

## Troubleshooting

### "Invalid judge referral code"
- Check code spelling (case-sensitive)
- Verify code belongs to correct event
- Confirm code hasn't been deleted

### "Code already used"
- Code was already consumed by another judge
- Request new code from organizer

### "Code expired"
- Code is older than 30 days
- Request new code from organizer

### "Email already registered"
- Email used for different role
- Use different email address
- Or register as existing role

### "Judge registration requires valid code"
- Missing judge referral code parameter
- Code is optional for PARTICIPANT role only

