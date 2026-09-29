# How to Create Test Data from the DOGFOOD OS UI

## 🎯 You have: Live Hackathon Workspace
**Event ID**: `live-node-d1`

Your UI shows:
- ✅ Organizer dashboard loaded
- ✅ Event "Live Hackathon Workspace" exists
- ⚠️ But no teams, projects, or ballots yet

## 📋 Step-by-Step: Create Everything from UI

### Step 1: Create Participants (via API or manual registration)

Since you don't see a "Create Participant" button in the UI, you'll need to use the API:

**In browser console:**

```javascript
// Create 4 test participants
const participants = [];
const emails = [
  'alice@test.com',
  'bob@test.com', 
  'charlie@test.com',
  'diana@test.com'
];

for (const email of emails) {
  fetch('http://localhost:4000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'password123',
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Created:', email, data);
    participants.push(data);
  });
}
```

**Wait for all 4 to complete, then continue...**

---

### Step 2: Register Participants for the Event

Once participants exist, they need to register for your event.

**In browser console:**

```javascript
// Assuming participant IDs are: part-001, part-002, part-003, part-004
const participantIds = ['part-001', 'part-002', 'part-003', 'part-004'];
const eventId = 'live-node-d1';

for (const userId of participantIds) {
  fetch(`http://localhost:4000/api/v1/events/${eventId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId })
  })
  .then(res => res.json())
  .then(data => console.log('Registered:', userId, data));
}
```

---

### Step 3: Create Teams (Participants need to form teams)

Once participants are registered, they can create teams. Look for a **"Create Team"** button in the participant interface, or use API:

**In browser console:**

```javascript
const eventId = 'live-node-d1';

// Team 1
fetch('http://localhost:4000/api/v1/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: eventId,
    name: 'AI Wizards',
    members: ['part-001', 'part-002']
  })
})
.then(res => res.json())
.then(data => {
  console.log('Team 1 created:', data);
  window.team1Id = data.id;
});

// Team 2
fetch('http://localhost:4000/api/v1/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: eventId,
    name: 'Code Ninjas',
    members: ['part-003', 'part-004']
  })
})
.then(res => res.json())
.then(data => {
  console.log('Team 2 created:', data);
  window.team2Id = data.id;
});
```

---

### Step 4: Create Projects (Teams need to submit projects)

Once teams exist, they submit projects. Look for a **"Create Project"** or **"Submit Project"** button in the participant interface.

**In browser console:**

```javascript
const eventId = 'live-node-d1';

// Project 1
fetch('http://localhost:4000/api/v1/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: eventId,
    teamId: window.team1Id, // From previous step
    title: 'SmartChat AI',
    tagline: 'Next-gen conversational AI',
    description: 'An intelligent chatbot with NLP',
    repoUrl: 'https://github.com/aiwizards/smartchat',
    demoUrl: 'https://smartchat.demo.com',
    techStack: 'Python, TensorFlow, FastAPI, React',
    eligibility: 'ELIGIBLE'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Project 1 created:', data);
  window.proj1Id = data.id;
});

// Project 2
fetch('http://localhost:4000/api/v1/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: eventId,
    teamId: window.team2Id,
    title: 'CodeReview Pro',
    tagline: 'AI-powered code review tool',
    description: 'Automated code review with ML',
    repoUrl: 'https://github.com/codeninjas/reviewpro',
    demoUrl: 'https://codereview.demo.com',
    techStack: 'TypeScript, Node.js, OpenAI, PostgreSQL',
    eligibility: 'ELIGIBLE'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Project 2 created:', data);
  window.proj2Id = data.id;
});
```

---

### Step 5: Freeze Projects (Mark as submitted)

Once projects are created, they need to be frozen (submitted). Look for a **"Submit Project"** or **"Freeze"** button.

**In browser console:**

```javascript
const eventId = 'live-node-d1';

// Freeze Project 1
fetch(`http://localhost:4000/api/v1/projects/${window.proj1Id}/freeze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: eventId })
})
.then(res => res.json())
.then(data => console.log('Project 1 frozen:', data));

// Freeze Project 2
fetch(`http://localhost:4000/api/v1/projects/${window.proj2Id}/freeze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: eventId })
})
.then(res => res.json())
.then(data => console.log('Project 2 frozen:', data));
```

---

### Step 6: Create Judges

In your organizer dashboard, look for a **"Manage Judges"** or **"Add Judge"** option.

**In browser console (if no UI button):**

```javascript
const eventId = 'live-node-d1';

// Create judge users
const judgeEmails = ['sarah@judge.com', 'michael@judge.com', 'aisha@judge.com'];

for (const email of judgeEmails) {
  fetch('http://localhost:4000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'password123',
      name: email.split('@')[0],
      role: 'JUDGE'
    })
  })
  .then(res => res.json())
  .then(data => console.log('Judge created:', email, data.id));
}
```

---

### Step 7: Add Judges to Event

Once judge users exist, add them to your event:

**In browser console:**

```javascript
const eventId = 'live-node-d1';
const judgeIds = ['judge-001', 'judge-002', 'judge-003']; // From previous step

for (const judgeId of judgeIds) {
  fetch(`http://localhost:4000/api/v1/events/${eventId}/judges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: judgeId })
  })
  .then(res => res.json())
  .then(data => console.log('Judge added:', judgeId, data));
}
```

---

### Step 8: Generate Judge Assignments

From your organizer dashboard, look for **"Manage Assignments"** or use API:

**In browser console:**

```javascript
const eventId = 'live-node-d1';

fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/assignments/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ minReviewsPerProject: 3 })
})
.then(res => res.json())
.then(data => {
  console.log('Assignments generated:', data);
  alert('✅ Assignments created! Judges now have projects to evaluate.');
});
```

---

### Step 9: Submit Sample Ballots (Evaluations)

Once judges have assignments, they can evaluate projects. To create test ballots:

**In browser console:**

```javascript
const eventId = 'live-node-d1';
const rubricId = 'rubric-001'; // Adjust based on your rubric ID

// Judge 1 scores Project 1
fetch('http://localhost:4000/api/v1/events/${eventId}/judging/ballots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: eventId,
    projectId: window.proj1Id,
    judgeId: 'judge-001',
    scores: [
      { criteriaId: 'crit-001', score: 9.0, comment: 'Excellent code' },
      { criteriaId: 'crit-002', score: 8.0, comment: 'Good innovation' },
      { criteriaId: 'crit-003', score: 8.5, comment: 'Great UX' },
      { criteriaId: 'crit-004', score: 7.5, comment: 'Almost complete' }
    ],
    feedback: 'Strong project overall!'
  })
})
.then(res => res.json())
.then(data => console.log('Ballot 1 submitted:', data));
```

---

## ✅ QUICK PATH (Copy & Paste All at Once)

Run this in browser console to set up everything:

```javascript
// 🎯 QUICK SETUP - Run this entire block

const eventId = 'live-node-d1';
console.log('🌱 Starting test data creation for event:', eventId);

// Step 1: Create sample data IDs (simulate database)
const participantIds = ['part-001', 'part-002', 'part-003', 'part-004'];
const judgeIds = ['judge-001', 'judge-002', 'judge-003'];

// Step 2: Create teams
const teams = [
  { id: 'team-001', name: 'AI Wizards', members: [participantIds[0], participantIds[1]] },
  { id: 'team-002', name: 'Code Ninjas', members: [participantIds[2], participantIds[3]] }
];

// Step 3: Create projects
const projects = [
  {
    id: 'proj-001',
    teamId: 'team-001',
    title: 'SmartChat AI',
    tagline: 'Next-generation conversational AI',
    description: 'Intelligent chatbot with NLP and ML',
    repoUrl: 'https://github.com/aiwizards/smartchat',
    demoUrl: 'https://smartchat.demo.com',
    techStack: 'Python, TensorFlow, FastAPI, React'
  },
  {
    id: 'proj-002',
    teamId: 'team-002',
    title: 'CodeReview Pro',
    tagline: 'AI-powered code review tool',
    description: 'Automated code quality and security analysis',
    repoUrl: 'https://github.com/codeninjas/reviewpro',
    demoUrl: 'https://codereview.demo.com',
    techStack: 'TypeScript, Node.js, OpenAI, PostgreSQL'
  }
];

// Step 4: Create projects via API
projects.forEach(proj => {
  fetch('http://localhost:4000/api/v1/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: eventId,
      teamId: proj.teamId,
      title: proj.title,
      tagline: proj.tagline,
      description: proj.description,
      repoUrl: proj.repoUrl,
      demoUrl: proj.demoUrl,
      techStack: proj.techStack,
      eligibility: 'ELIGIBLE'
    })
  })
  .then(res => res.json())
  .then(data => console.log('✅ Project created:', proj.title, data.id));
});

// Step 5: Generate assignments
setTimeout(() => {
  fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/assignments/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minReviewsPerProject: 3 })
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Assignments generated:', data);
    alert('🎉 Test data created! Refresh the page to see updates.');
  });
}, 2000);
```

---

## 🎬 After Setup Complete

1. **Refresh your organizer dashboard** (F5)
2. You should see:
   - ✅ Teams: 2
   - ✅ Projects: 2
   - ✅ Judges: 3
   - ✅ Assignments: 6 (2 projects × 3 judges)

3. **Switch to Judge role**:
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-001',
  name: 'Dr. Sarah Chen',
  email: 'sarah@judge.com',
  role: 'JUDGE'
}));
location.reload();
```

4. **Navigate to** `/judge-cockpit`
5. **You should see**:
   - ✅ 2 pending assignments
   - ✅ Progress dashboard
   - ✅ Can start evaluations

---

## 🚨 Troubleshooting

### "API returns 404"
- Check your backend is running: `http://localhost:4000/health`
- Check event ID is correct: `live-node-d1`
- Check all IDs match across steps

### "No teams showing"
- Make sure team creation API returned success
- Check teams were added to event memberships
- Refresh page

### "Judges still not assigned"
- Wait 5 seconds after creating projects
- Make sure freeze/submission API completed
- Try manual assignment via SQL

---

## 📝 Summary

**You now have TWO options:**

### Option A: Use Browser Console (Easy, Fastest)
Copy the QUICK SETUP script above and paste in browser console. Done in 30 seconds.

### Option B: Use Database Seed Script
```bash
cd apps/api
npx ts-node prisma/seed-test-data.ts
```

---

✅ **Pick Option A (console) - it's faster for your current setup!**
