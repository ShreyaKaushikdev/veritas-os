# Judge Referral Codes - Quick Start Guide

## 🚀 For Organizers: Creating Hackathon with Judges

### Step 1: Create Hackathon Event
```bash
POST http://localhost:4000/api/v1/events
{
  "name": "My Awesome Hackathon",
  "slug": "awesome-2026",
  "description": "...",
  "timezone": "UTC"
}
→ Event created ✓
→ You are assigned ORGANIZER role ✓
```

### Step 2: Generate Judge Codes
```bash
POST http://localhost:4000/api/v1/events/{eventId}/judge-referral-codes/generate
Authorization: Bearer {YOUR_TOKEN}

{
  "count": 5,
  "prefix": "AWESOME-2026"
}

Response: 5 unique codes generated!
- AWESOME-2026-XYZ123
- AWESOME-2026-ABC456
- AWESOME-2026-DEF789
- AWESOME-2026-GHI012
- AWESOME-2026-JKL345
```

### Step 3: Share Codes with Judges
Send email to each judge:
```
Subject: You're invited to judge AWESOME 2026!

Hi Judge,

You're invited to judge our hackathon! 

Your judge registration code: AWESOME-2026-XYZ123
Sign up here: https://app.com/signup?role=judge

Questions? Contact us at organizers@awesome.com
```

### Step 4: Track Code Usage
```bash
GET http://localhost:4000/api/v1/events/{eventId}/judge-referral-codes
Authorization: Bearer {YOUR_TOKEN}

Response:
- Total codes: 5
- Used: 3
- Unused: 2
- Details: Show each code status, who used it, when
```

---

## 👨‍⚖️ For Judges: Registering for Hackathon

### Step 1: Visit Signup Page
```
URL: https://app.com/signup
```

### Step 2: Select Judge Role
```
Role dropdown: [Select JUDGE ▼]
→ Judge Referral Code field appears
```

### Step 3: Enter Referral Code
```
Code field: AWESOME-2026-XYZ123
```

### Step 4: Fill Details
```
Email:     judge@university.edu
Password:  SecurePassword123!
Name:      Dr. Jane Smith
Code:      AWESOME-2026-XYZ123
```

### Step 5: Register
```
Click: "Create Account"
→ Code validated ✓
→ Account created as JUDGE ✓
→ Ready to judge projects! ✓
```

---

## ❌ Common Errors & Solutions

### Error: "Invalid judge referral code"
**Cause:** Code doesn't exist or misspelled
**Solution:** 
- Check code spelling (case-sensitive)
- Ask organizer to verify code
- Request new code if lost

### Error: "This code has already been used"
**Cause:** Another judge already used this code
**Solution:**
- Code is single-use only
- Ask organizer for NEW code
- Each judge gets unique code

### Error: "This code has expired"
**Cause:** Code is older than 30 days
**Solution:**
- Codes valid for 30 days only
- Ask organizer to generate new code

### Error: "Email already registered"
**Cause:** Email used for participant account
**Solution:**
- Use DIFFERENT email address
- Or contact organizer for exceptions
- Judges must have unique emails

### Error: "Judge registration requires valid code"
**Cause:** Judge Referral Code field is empty
**Solution:**
- Code is REQUIRED for judges
- Ask organizer for your code
- Enter code before registering

### Error: "You don't have permission"
**Cause:** Trying to access organizer endpoints as judge/participant
**Solution:**
- Organizer endpoints need ORGANIZER token
- Use correct authentication

---

## 🔍 For Organizers: Checking Code Status

```bash
# Get all codes for your event
curl -X GET \
  http://localhost:4000/api/v1/events/{eventId}/judge-referral-codes \
  -H "Authorization: Bearer {TOKEN}"

# View the response:
{
  "totalCodes": 5,
  "unused": 2,
  "used": 3,
  "codes": [
    {
      "code": "AWESOME-2026-XYZ123",
      "usedBy": "judge-user-id",
      "usedAt": "2026-09-28T10:15:00Z",
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    },
    {
      "code": "AWESOME-2026-ABC456",
      "usedBy": null,
      "usedAt": null,
      "createdAt": "2026-09-28T10:00:00Z",
      "expiresAt": "2026-10-28T10:00:00Z"
    }
    // ... more codes
  ]
}
```

---

## 📊 Code Lifecycle

```
Created (now)
    ↓
    Unused for 1-30 days
    ↓
Judge registers with code
    ↓
    Marked as USED
    usedBy = judge-id
    usedAt = timestamp
    ↓
    Can never be used again
    ↓
OR
    ↓
30 days pass
    ↓
Code EXPIRES
    ↓
Can't register with expired code
    ↓
Generate new code
```

---

## 🛠️ Manual Code Validation (For Judges)

Before registering, judges can validate their code:

```bash
# Check if code is valid
curl -X POST \
  http://localhost:4000/api/v1/events/{eventId}/judge-referral-codes/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "AWESOME-2026-XYZ123"}'

# Response if valid:
{
  "valid": true,
  "message": "Judge referral code is valid",
  "code": "AWESOME-2026-XYZ123",
  "eventId": "event-123"
}

# Response if invalid:
{
  "valid": false,
  "message": "Invalid judge referral code"
}
```

---

## 📝 Troubleshooting Checklist

### For Judges:

- [ ] Do you have a referral code from organizer?
- [ ] Is the code spelled correctly (case-sensitive)?
- [ ] Is the code still within 30-day window?
- [ ] Has the code already been used by someone else?
- [ ] Are you using a NEW email (not your participant account)?
- [ ] Are you selecting "Judge" role (not "Participant")?

### For Organizers:

- [ ] Have you authenticated with ORGANIZER token?
- [ ] Did you provide correct eventId?
- [ ] Did you specify count > 0?
- [ ] Are codes showing in the GET response?
- [ ] Have you shared codes with judges?
- [ ] Are usage stats updating when judges register?

---

## 🔐 Security Facts

✅ Codes are 6-digit random hex (not sequential)
✅ Codes are unique per event
✅ Codes are single-use (can't be reused)
✅ Codes expire after 30 days
✅ Email uniqueness enforced
✅ All operations logged in audit trail
✅ Backend validation (not just frontend)
✅ No hardcoded codes anywhere

---

## 📞 Support

### Judge Issues:
1. Check code spelling
2. Verify code with organizer
3. Request new code if expired/used
4. Use different email if error

### Organizer Issues:
1. Verify you're using ORGANIZER token
2. Check event ID is correct
3. View codes with GET endpoint
4. Generate more codes anytime

---

## Complete Example

### Scenario: Organizing a 3-judge hackathon

```bash
#!/bin/bash

# 1. Create event
EVENT_ID="awesome-2026"
ORGANIZER_TOKEN="org-token-..."

# 2. Generate codes for 3 judges
curl -X POST \
  http://localhost:4000/api/v1/events/$EVENT_ID/judge-referral-codes/generate \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3,
    "prefix": "AWESOME-2026"
  }'

# Response:
# AWESOME-2026-ABC123
# AWESOME-2026-DEF456
# AWESOME-2026-GHI789

# 3. Send codes to judges (manually via email)
# Judge 1: AWESOME-2026-ABC123 → john@university.edu
# Judge 2: AWESOME-2026-DEF456 → jane@university.edu
# Judge 3: AWESOME-2026-GHI789 → bob@university.edu

# 4. Judge 1 registers (in browser)
# - Go to signup page
# - Select "Judge" role
# - Email: john@university.edu
# - Password: secret
# - Name: Prof. John Smith
# - Code: AWESOME-2026-ABC123
# - Submit → ✓ Account created

# 5. Judge 2 registers
# - Same flow with different email/name/code
# - Code: AWESOME-2026-DEF456

# 6. Judge 3 registers
# - Same flow
# - Code: AWESOME-2026-GHI789

# 7. Verify all codes were used
curl -X GET \
  http://localhost:4000/api/v1/events/$EVENT_ID/judge-referral-codes \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  | jq '.codes'

# Response shows:
# - AWESOME-2026-ABC123: usedBy=john-id, usedAt=timestamp ✓
# - AWESOME-2026-DEF456: usedBy=jane-id, usedAt=timestamp ✓
# - AWESOME-2026-GHI789: usedBy=bob-id, usedAt=timestamp ✓
# - unused: 0
# - All judges ready to judge! ✓
```

---

## Key Takeaways

1. **Organizers** → Generate codes (1 per judge)
2. **Judges** → Use codes to register
3. **Codes** → Single-use, 30-day validity, event-specific
4. **Security** → Backend validated, fully tracked
5. **Support** → Clear error messages for both roles

🎯 Result: Only approved judges can create accounts, organizers have full control.

