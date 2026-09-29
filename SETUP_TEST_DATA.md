# Setup Test Data - Quick Start Guide

## 🎯 Why You're Not Seeing Data

The system shows **REAL DATA ONLY** - no fake/mock data. You need to:

1. Create a hackathon event
2. Add participants
3. Create teams and projects
4. Generate judge assignments
5. Submit evaluations (ballots)

Let me guide you through each step!

---

## 📋 Step-by-Step Setup

### Step 1: Create a Hackathon Event

**As Organizer**, create an event via API:

```bash
# Using curl
curl -X POST http://localhost:4000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Buildathon 2026",
    "slug": "ai-buildathon-2026",
    "description": "Build the future of AI applications",
    "timezone": "America/New_York",
    "subDeadline": "2026-12-31T23:59:59Z",
    "judgeDeadline": "2027-01-05T23:59:59Z",
    "creatorId": "org-001"
  }'
```

**Or using JavaScript in browser console:**

```javascript
fetch('http://localhost:4000/api/v1/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "AI Buildathon 2026",
    slug: "ai-buildathon-2026",
    description: "Build the future of AI applications",
    timezone: "America/New_York",
    subDeadline: "2026-12-31T23:59:59Z",
    judgeDeadline: "2027-01-05T23:59:59Z",
    creatorId: "org-001"
  })
})
.then(res => res.json())
.then(data => {
  console.log('Event created:', data);
  localStorage.setItem('currentEventId', data.id);
});
```

**Save the event ID** - you'll need it for next steps!

---

### Step 2: Create Users (Participants & Judges)

You need to create users in your database. If you have a seed script, run it. Otherwise, create users via your auth endpoint.

**Quick user setup via Prisma Studio or SQL:**

```sql
-- Create participants
INSERT INTO "User" (id, email, name, "passwordHash", role, "isVerified") VALUES
('part-001', 'alice@test.com', 'Alice Johnson', 'hash', 'PARTICIPANT', true),
('part-002', 'bob@test.com', 'Bob Smith', 'hash', 'PARTICIPANT', true),
('part-003', 'charlie@test.com', 'Charlie Brown', 'hash', 'PARTICIPANT', true),
('part-004', 'diana@test.com', 'Diana Prince', 'hash', 'PARTICIPANT', true);

-- Create judges
INSERT INTO "User" (id, email, name, "passwordHash", role, "isVerified") VALUES
('judge-001', 'sarah@judge.com', 'Dr. Sarah Chen', 'hash', 'JUDGE', true),
('judge-002', 'michael@judge.com', 'Prof. Michael Rodriguez', 'hash', 'JUDGE', true),
('judge-003', 'aisha@judge.com', 'Dr. Aisha Patel', 'hash', 'JUDGE', true);

-- Create organizer
INSERT INTO "User" (id, email, name, "passwordHash", role, "isVerified") VALUES
('org-001', 'alex@org.com', 'Alex Martinez', 'hash', 'ORGANIZER', true);
```

---

### Step 3: Register Users for Event (Create Memberships)

```sql
-- Register participants
INSERT INTO "Membership" (id, "userId", "eventId", role, "createdAt") VALUES
('m-001', 'part-001', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-002', 'part-002', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-003', 'part-003', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-004', 'part-004', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW());

-- Register judges
INSERT INTO "Membership" (id, "userId", "eventId", role, "createdAt") VALUES
('m-j01', 'judge-001', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW()),
('m-j02', 'judge-002', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW()),
('m-j03', 'judge-003', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW());

-- Register organizer
INSERT INTO "Membership" (id, "userId", "eventId", role, "createdAt") VALUES
('m-org', 'org-001', 'YOUR_EVENT_ID_HERE', 'ORGANIZER', NOW());
```

---

### Step 4: Create Teams

```sql
-- Create teams
INSERT INTO "Team" (id, "eventId", name, "inviteCode", "createdAt") VALUES
('team-001', 'YOUR_EVENT_ID_HERE', 'AI Wizards', 'WIZARD123', NOW()),
('team-002', 'YOUR_EVENT_ID_HERE', 'Code Ninjas', 'NINJA456', NOW());

-- Add team members
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt") VALUES
('tm-001', 'team-001', 'part-001', 'LEADER', NOW()),
('tm-002', 'team-001', 'part-002', 'MEMBER', NOW()),
('tm-003', 'team-002', 'part-003', 'LEADER', NOW()),
('tm-004', 'team-002', 'part-004', 'MEMBER', NOW());
```

---

### Step 5: Create Projects

```sql
-- Create projects
INSERT INTO "Project" (
  id, "eventId", "teamId", title, tagline, description, 
  "repoUrl", "demoUrl", "techStack", eligibility, "isFrozen", 
  "createdAt", "updatedAt"
) VALUES
(
  'proj-001', 
  'YOUR_EVENT_ID_HERE', 
  'team-001',
  'SmartChat AI',
  'Next-generation conversational AI assistant',
  'An intelligent chatbot powered by advanced NLP and machine learning algorithms. Features context awareness, multi-language support, and sentiment analysis.',
  'https://github.com/aiwizards/smartchat',
  'https://smartchat.demo.com',
  'Python, TensorFlow, FastAPI, React, PostgreSQL',
  'ELIGIBLE',
  true,
  NOW(),
  NOW()
),
(
  'proj-002',
  'YOUR_EVENT_ID_HERE',
  'team-002',
  'CodeReview Pro',
  'AI-powered code review and quality analysis',
  'Automated code review tool that uses ML to detect bugs, security vulnerabilities, and suggest improvements. Supports 10+ programming languages.',
  'https://github.com/codeninjas/reviewpro',
  'https://codereview.demo.com',
  'TypeScript, OpenAI API, Node.js, PostgreSQL, Docker',
  'ELIGIBLE',
  true,
  NOW(),
  NOW()
);
```

---

### Step 6: Create Rubric for Event

```sql
-- Create rubric version
INSERT INTO "RubricVersion" (id, "eventId", version, "isLocked", "createdAt") VALUES
('rubric-001', 'YOUR_EVENT_ID_HERE', 1, true, NOW());

-- Update event to reference rubric
UPDATE "Event" SET "currentRubricId" = 'rubric-001' WHERE id = 'YOUR_EVENT_ID_HERE';

-- Create rubric criteria
INSERT INTO "RubricCriteria" (
  id, "rubricVersionId", name, description, weight, "minScore", "maxScore", guidance
) VALUES
(
  'crit-001',
  'rubric-001',
  'Technical Implementation',
  'Quality of code, architecture, and technical execution',
  0.35,
  1.0,
  10.0,
  'Look for clean code, proper error handling, scalability'
),
(
  'crit-002',
  'rubric-001',
  'Innovation & Creativity',
  'Originality of the idea and creative approach to problem-solving',
  0.25,
  1.0,
  10.0,
  'Does this solve a real problem in a novel way?'
),
(
  'crit-003',
  'rubric-001',
  'User Experience',
  'Ease of use, design quality, and overall user experience',
  0.20,
  1.0,
  10.0,
  'Is it intuitive? Does it delight users?'
),
(
  'crit-004',
  'rubric-001',
  'Completeness & Polish',
  'How finished is the project? Is it production-ready?',
  0.20,
  1.0,
  10.0,
  'Can it be deployed and used today?'
);
```

---

### Step 7: Generate Judge Assignments

**Via API:**

```javascript
// In browser console
fetch('http://localhost:4000/api/v1/events/YOUR_EVENT_ID_HERE/judging/assignments/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ minReviewsPerProject: 3 })
})
.then(res => res.json())
.then(data => console.log('Assignments created:', data));
```

**Or manually via SQL:**

```sql
-- Assign judges to projects (3 judges per project)
INSERT INTO "Assignment" (id, "eventId", "projectId", "judgeId", "isTargeted", status, "createdAt") VALUES
-- Project 1 assignments
('assign-001', 'YOUR_EVENT_ID_HERE', 'proj-001', 'judge-001', false, 'ACTIVE', NOW()),
('assign-002', 'YOUR_EVENT_ID_HERE', 'proj-001', 'judge-002', false, 'ACTIVE', NOW()),
('assign-003', 'YOUR_EVENT_ID_HERE', 'proj-001', 'judge-003', false, 'ACTIVE', NOW()),
-- Project 2 assignments
('assign-004', 'YOUR_EVENT_ID_HERE', 'proj-002', 'judge-001', false, 'ACTIVE', NOW()),
('assign-005', 'YOUR_EVENT_ID_HERE', 'proj-002', 'judge-002', false, 'ACTIVE', NOW()),
('assign-006', 'YOUR_EVENT_ID_HERE', 'proj-002', 'judge-003', false, 'ACTIVE', NOW());
```

---

### Step 8: Create Sample Ballots (Evaluations)

```sql
-- Judge 1 evaluates Project 1
INSERT INTO "Ballot" (
  id, "eventId", "projectId", "judgeId", "rubricVersionId",
  status, "weightedScore", feedback, "submittedAt", "ballotHash", "createdAt", "updatedAt"
) VALUES
(
  'ballot-001',
  'YOUR_EVENT_ID_HERE',
  'proj-001',
  'judge-001',
  'rubric-001',
  'SUBMITTED',
  8.35,
  'Excellent technical implementation with clean architecture. Great use of modern frameworks.',
  NOW(),
  'sha256-abc123...',
  NOW(),
  NOW()
);

-- Scores for ballot-001
INSERT INTO "BallotScore" (id, "ballotId", "criteriaId", score, comment) VALUES
('score-001', 'ballot-001', 'crit-001', 9.0, 'Very clean code structure'),
('score-002', 'ballot-001', 'crit-002', 8.0, 'Good innovation in NLP approach'),
('score-003', 'ballot-001', 'crit-003', 8.5, 'Intuitive UI design'),
('score-004', 'ballot-001', 'crit-004', 7.5, 'Mostly complete, needs more testing');

-- Judge 2 evaluates Project 1 (with different score - creates variance)
INSERT INTO "Ballot" (
  id, "eventId", "projectId", "judgeId", "rubricVersionId",
  status, "weightedScore", feedback, "submittedAt", "ballotHash", "createdAt", "updatedAt"
) VALUES
(
  'ballot-002',
  'YOUR_EVENT_ID_HERE',
  'proj-001',
  'judge-002',
  'rubric-001',
  'SUBMITTED',
  6.15,
  'Good effort but lacks some key features. Architecture could be more scalable.',
  NOW(),
  'sha256-def456...',
  NOW(),
  NOW()
);

-- Scores for ballot-002 (lower scores to create variance)
INSERT INTO "BallotScore" (id, "ballotId", "criteriaId", score, comment) VALUES
('score-005', 'ballot-002', 'crit-001', 6.0, 'Some architectural concerns'),
('score-006', 'ballot-002', 'crit-002', 7.0, 'Decent innovation'),
('score-007', 'ballot-002', 'crit-003', 6.5, 'UI needs polish'),
('score-008', 'ballot-002', 'crit-004', 5.5, 'Not production-ready yet');

-- Judge 1 evaluates Project 2
INSERT INTO "Ballot" (
  id, "eventId", "projectId", "judgeId", "rubricVersionId",
  status, "weightedScore", feedback, "submittedAt", "ballotHash", "createdAt", "updatedAt"
) VALUES
(
  'ballot-003',
  'YOUR_EVENT_ID_HERE',
  'proj-002',
  'judge-001',
  'rubric-001',
  'SUBMITTED',
  9.10,
  'Outstanding project! Professional-grade code review tool with real commercial potential.',
  NOW(),
  'sha256-ghi789...',
  NOW(),
  NOW()
);

-- Scores for ballot-003
INSERT INTO "BallotScore" (id, "ballotId", "criteriaId", score, comment) VALUES
('score-009', 'ballot-003', 'crit-001', 9.5, 'Exceptional technical quality'),
('score-010', 'ballot-003', 'crit-002', 9.0, 'Highly innovative approach'),
('score-011', 'ballot-003', 'crit-003', 9.0, 'Excellent UX'),
('score-012', 'ballot-003', 'crit-004', 9.0, 'Production-ready');
```

**Note**: Project 1 now has high variance (8.35 vs 6.15 = 2.2 point difference) and should trigger variance detection!

---

### Step 9: Create Judge Passports (for calibration)

```sql
-- Create judge profiles
INSERT INTO "JudgePassport" (id, "userId", "completedReviews", "calibrationBias", "reliabilityScore", "updatedAt") VALUES
('jp-001', 'judge-001', 2, 0.05, 1.0, NOW()),
('jp-002', 'judge-002', 1, -0.12, 1.0, NOW()),
('jp-003', 'judge-003', 0, 0.0, 1.0, NOW());
```

---

### Step 10: Update Event Status

```sql
-- Move event to judging phase
UPDATE "Event" SET status = 'JUDGING_OPEN' WHERE id = 'YOUR_EVENT_ID_HERE';
```

---

## 🎯 Quick Test After Setup

### 1. Test as Judge

```javascript
// Set judge user
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-003',
  name: 'Dr. Aisha Patel',
  email: 'aisha@judge.com',
  role: 'JUDGE'
}));

// Update eventId in pages (if needed)
// Navigate to /judge-cockpit
```

**You should now see:**
- ✅ Progress: 0 of 2 completed (0%)
- ✅ 2 pending assignments
- ✅ "Next Assignment" card with project details

### 2. Test as Organizer

```javascript
// Set organizer user
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'org-001',
  name: 'Alex Martinez',
  email: 'alex@org.com',
  role: 'ORGANIZER'
}));

// Navigate to /organizer/command-center
```

**You should now see:**
- ✅ 4 participants
- ✅ 2 teams
- ✅ 2 projects
- ✅ 2 submitted
- ✅ 3 judges

**Navigate to /organizer/projects:**
- ✅ 2 project cards
- ✅ Project 1 should have HIGH VARIANCE flag (orange)
- ✅ Statistics show ballot counts and avg scores

---

## 🚀 All-in-One SQL Script

Here's everything in one script (replace `YOUR_EVENT_ID_HERE` with actual ID):

```sql
-- Run this after creating your event via API

-- 1. Create users
INSERT INTO "User" (id, email, name, "passwordHash", role, "isVerified") VALUES
('part-001', 'alice@test.com', 'Alice Johnson', 'hash', 'PARTICIPANT', true),
('part-002', 'bob@test.com', 'Bob Smith', 'hash', 'PARTICIPANT', true),
('part-003', 'charlie@test.com', 'Charlie Brown', 'hash', 'PARTICIPANT', true),
('part-004', 'diana@test.com', 'Diana Prince', 'hash', 'PARTICIPANT', true),
('judge-001', 'sarah@judge.com', 'Dr. Sarah Chen', 'hash', 'JUDGE', true),
('judge-002', 'michael@judge.com', 'Prof. Michael Rodriguez', 'hash', 'JUDGE', true),
('judge-003', 'aisha@judge.com', 'Dr. Aisha Patel', 'hash', 'JUDGE', true),
('org-001', 'alex@org.com', 'Alex Martinez', 'hash', 'ORGANIZER', true)
ON CONFLICT (email) DO NOTHING;

-- 2. Create memberships (replace YOUR_EVENT_ID_HERE)
INSERT INTO "Membership" (id, "userId", "eventId", role, "createdAt") VALUES
('m-001', 'part-001', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-002', 'part-002', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-003', 'part-003', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-004', 'part-004', 'YOUR_EVENT_ID_HERE', 'PARTICIPANT', NOW()),
('m-j01', 'judge-001', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW()),
('m-j02', 'judge-002', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW()),
('m-j03', 'judge-003', 'YOUR_EVENT_ID_HERE', 'JUDGE', NOW()),
('m-org', 'org-001', 'YOUR_EVENT_ID_HERE', 'ORGANIZER', NOW());

-- Continue with teams, projects, rubric, assignments, ballots...
-- (See sections above)
```

---

## 💡 Alternative: Use Existing Data

If you already have data in your database:

1. **Check your event ID:**
```sql
SELECT id, slug, name, status FROM "Event";
```

2. **Update the `eventId` in frontend code:**

In each page file, change:
```typescript
const [eventId] = useState('demo-event');
```

To your actual event ID:
```typescript
const [eventId] = useState('YOUR_ACTUAL_EVENT_ID');
```

Files to update:
- `apps/web/src/app/judge-cockpit/page.tsx`
- `apps/web/src/app/judge-cockpit/assignments/page.tsx`
- `apps/web/src/app/judge-cockpit/evaluate/[projectId]/page.tsx`
- `apps/web/src/app/judge-cockpit/calibration/page.tsx`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Event exists in database
- [ ] Users exist with correct roles
- [ ] Memberships link users to event
- [ ] Teams exist with members
- [ ] Projects exist and are frozen
- [ ] Rubric exists and is locked
- [ ] Assignments link judges to projects
- [ ] At least 1 ballot exists
- [ ] Judge passports exist
- [ ] Event status is JUDGING_OPEN

---

## 🎉 Success!

Once you complete these steps, you should see:

**Judge Cockpit:**
- ✅ Real assignments in queue
- ✅ Progress percentage
- ✅ Can start evaluations
- ✅ Ballots display after submission

**Organizer:**
- ✅ Real participant counts
- ✅ Real project cards
- ✅ High variance detection (if scores vary)
- ✅ Real statistics

**No more empty screens!** 🚀

---

Need help? Check:
1. Database connections working?
2. Event ID matches in code?
3. All foreign keys correct?
4. Status set to JUDGING_OPEN?
