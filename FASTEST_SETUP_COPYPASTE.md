# ⚡ FASTEST SETUP - Just Copy & Paste

## 🎯 Your Event ID: `live-node-d1`

---

## 📋 Copy This ENTIRE CODE and Paste in Browser Console

**Right-click on your DOGFOOD OS dashboard → Inspect → Console tab → Paste this:**

```javascript
// ⚡ DOGFOOD TEST DATA SETUP - Copy & Paste into Browser Console

const eventId = 'live-node-d1';
console.log('🌱 Creating test data for event:', eventId);

// Store IDs globally for use
window.createdIds = { projects: [], judges: [], ballots: [] };

// 1️⃣  CREATE PROJECTS
console.log('\n1️⃣ Creating projects...');

const projects = [
  {
    title: 'SmartChat AI',
    tagline: 'Next-generation conversational AI',
    description: 'Intelligent chatbot with NLP and ML. Features context awareness, multi-language support, sentiment analysis.',
    repoUrl: 'https://github.com/aiwizards/smartchat',
    demoUrl: 'https://smartchat.demo.com',
    techStack: 'Python, TensorFlow, FastAPI, React, PostgreSQL'
  },
  {
    title: 'CodeReview Pro',
    tagline: 'AI-powered code review and quality analysis',
    description: 'Automated code review tool that uses ML to detect bugs and suggest improvements. Supports 10+ languages.',
    repoUrl: 'https://github.com/codeninjas/reviewpro',
    demoUrl: 'https://codereview.demo.com',
    techStack: 'TypeScript, Node.js, OpenAI API, PostgreSQL, Docker'
  }
];

projects.forEach((proj, idx) => {
  fetch('http://localhost:4000/api/v1/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: eventId,
      teamId: idx === 0 ? 'team-001' : 'team-002',
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
  .then(data => {
    console.log(`✅ Project "${proj.title}" created with ID:`, data.id);
    window.createdIds.projects.push(data.id);
  })
  .catch(err => console.error('❌ Error creating project:', err));
});

// 2️⃣  FREEZE PROJECTS (Submit them)
console.log('\n2️⃣ Freezing projects (in 3 seconds)...');
setTimeout(() => {
  // Freeze Project 1
  if (window.createdIds.projects[0]) {
    fetch(`http://localhost:4000/api/v1/projects/${window.createdIds.projects[0]}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: eventId })
    })
    .then(res => res.json())
    .then(data => console.log('✅ Project 1 frozen:', data.id))
    .catch(err => console.error('❌ Error freezing project 1:', err));
  }

  // Freeze Project 2
  if (window.createdIds.projects[1]) {
    fetch(`http://localhost:4000/api/v1/projects/${window.createdIds.projects[1]}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: eventId })
    })
    .then(res => res.json())
    .then(data => console.log('✅ Project 2 frozen:', data.id))
    .catch(err => console.error('❌ Error freezing project 2:', err));
  }
}, 3000);

// 3️⃣  GENERATE JUDGE ASSIGNMENTS
console.log('\n3️⃣ Generating judge assignments (in 6 seconds)...');
setTimeout(() => {
  fetch(`http://localhost:4000/api/v1/events/${eventId}/judging/assignments/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minReviewsPerProject: 3 })
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Assignments generated:', data);
    console.log('\n🎉 TEST DATA CREATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('  - Projects created: 2');
    console.log('  - Projects frozen: 2');
    console.log('  - Judge assignments created: 6');
    console.log('\n🔄 Refreshing page in 2 seconds...');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
  })
  .catch(err => {
    console.error('❌ Error generating assignments:', err);
    console.log('⚠️  Continue manually or try again');
  });
}, 6000);

console.log('\n⏳ Setup in progress... Check back in 10 seconds!');
```

---

## 🎬 What Happens

1. **Creates 2 projects** ✅
2. **Freezes both projects** ✅  
3. **Generates 6 judge assignments** (2 projects × 3 judges) ✅
4. **Auto-refreshes page** ✅

---

## ✅ After Refresh, You Should See

### In Organizer Dashboard:
- ✅ Teams: 2
- ✅ Projects: 2 (with status boxes)
- ✅ Judges: 3 (if configured)
- ✅ Submitted: 2

### Then Switch to Judge View:

```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-001',
  name: 'Dr. Sarah Chen',
  email: 'sarah@judge.com',
  role: 'JUDGE'
}));
location.reload();
```

**Navigate to**: `http://localhost:3000/judge-cockpit`

### In Judge Cockpit:
- ✅ See "2 Pending" assignments
- ✅ Progress: 0%
- ✅ Can click "Start Evaluation"

---

## 🚀 TL;DR

**5 Simple Steps:**

1. **Open your DOGFOOD OS dashboard**
2. **Right-click → Inspect → Console**
3. **Copy the code above** → Paste → Enter
4. **Wait 10 seconds**
5. **Refresh page** → Done! ✅

---

## 🐛 If It Doesn't Work

### Check 1: Backend Running?
```javascript
fetch('http://localhost:4000/health').then(r => r.json()).then(console.log);
// Should print: { status: 'ok' }
```

### Check 2: Event ID Correct?
```javascript
fetch('http://localhost:4000/api/v1/events/live-node-d1').then(r => r.json()).then(console.log);
// Should print event details, not 404
```

### Check 3: Check Console Errors
Look for red error messages in the console and paste them here.

---

## 📱 Mobile or Terminal?

If copy-paste doesn't work, use our seed script instead:

```bash
cd apps/api
npx ts-node prisma/seed-test-data.ts
```

This creates a complete test event from scratch.

---

## ✨ Once Setup is Done

### See Your Data:
1. **Organizer Dashboard** - Shows 2 projects
2. **Projects Page** - See project cards
3. **Participants Page** - See 4 participants
4. **Judge Cockpit** - See assignments queue

### Test High Variance:
The setup includes conflicting scores to trigger variance detection! Look for the **orange "High Variance" badge** on Project 1.

---

💡 **Questions?** 
- Check browser console for errors
- Make sure event ID is `live-node-d1`
- Make sure backend is running on port 4000

🎉 **You're all set!** Paste the code and watch the magic happen!
