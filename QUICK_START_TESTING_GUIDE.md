# Quick Start Testing Guide

## 🎯 How to Test the New Features

### Prerequisites
1. Backend API running on `http://localhost:4000`
2. Frontend running on `http://localhost:3000`
3. PostgreSQL database with seed data

---

## 👤 Setting Up Test Users

### In Browser Console

#### Create a Judge User
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-001',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@judge.com',
  role: 'JUDGE'
}));
```

#### Create an Organizer User
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'org-001',
  name: 'Alex Martinez',
  email: 'alex@organizer.com',
  role: 'ORGANIZER'
}));
```

#### Create a Participant User
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'part-001',
  name: 'Jamie Smith',
  email: 'jamie@participant.com',
  role: 'PARTICIPANT'
}));
```

---

## 🧪 Test Scenarios

### Scenario 1: Judge Flow

**Setup:**
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-001',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@judge.com',
  role: 'JUDGE'
}));
```

**Test Steps:**
1. Navigate to `http://localhost:3000/judge`
2. ✅ Should auto-redirect to `/judge-cockpit`
3. ✅ Should see "JUDGING COCKPIT" header
4. ✅ Should see progress dashboard
5. ✅ Should see "NEXT ASSIGNMENT" card (if assignments exist)
6. Click "View All Assignments"
7. ✅ Should see assignments queue with progress bar
8. ✅ Targeted reviews should have orange borders
9. Click "Start Evaluation" on any assignment
10. ✅ Should see split-screen evaluation workspace
11. ✅ Project info on left, rubric on right
12. Adjust score sliders
13. ✅ Weighted score should update in real-time
14. Add feedback and notes
15. Click "Submit Ballot"
16. ✅ Confirmation modal should appear
17. Confirm submission
18. ✅ Should redirect back to cockpit
19. Click "Calibration" from cockpit
20. ✅ Should see calibration wizard
21. Score anchor projects
22. ✅ Progress bar should advance
23. Complete all anchors
24. ✅ Should see bias results screen

**Expected Results:**
- ✅ No team creation screen
- ✅ Professional judging interface only
- ✅ All data loads from backend
- ✅ Real-time calculations work
- ✅ Smooth navigation between pages

---

### Scenario 2: Organizer Flow

**Setup:**
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'org-001',
  name: 'Alex Martinez',
  email: 'alex@organizer.com',
  role: 'ORGANIZER'
}));
```

**Test Steps:**
1. Navigate to `http://localhost:3000/organizer/command-center`
2. ✅ Should see "HACKATHON COMMAND CENTER" header
3. ✅ Should see pulse metrics (participants, teams, projects, etc.)
4. ✅ Should see alerts if any issues detected
5. ✅ Should see event timeline with phase status
6. Click "Participants" quick action
7. ✅ Should see participants management page
8. ✅ Should see statistics cards (Total, In Teams, Solo, etc.)
9. Type in search box
10. ✅ Should filter participants in real-time
11. Change role filter
12. ✅ Should filter by role
13. Click "Export CSV"
14. ✅ Should download CSV file with participant data
15. Click "Back to Command Center"
16. Click "Projects" quick action
17. ✅ Should see projects grid with cards
18. ✅ Should see 6 statistics cards
19. ✅ High variance projects should have orange flag
20. Type in search box
21. ✅ Should filter projects in real-time
22. Change eligibility filter to "High Variance"
23. ✅ Should show only flagged projects
24. Click "View Details" on a project
25. ✅ Modal should open with full details
26. ✅ If high variance, should see alert with recommendation
27. Close modal
28. Click track filter
29. ✅ Should filter by selected track

**Expected Results:**
- ✅ All statistics accurate
- ✅ Filters work instantly
- ✅ High variance detection works
- ✅ No fake data anywhere
- ✅ CSV export contains real data

---

### Scenario 3: High Variance Detection

**Setup Requirements:**
- Event with at least 1 project
- At least 2 judges
- Judges have submitted conflicting scores (high std dev)

**Test Steps:**
1. As Organizer, go to `/organizer/projects`
2. Look for project with orange "Variance" badge
3. ✅ Should see at least one flagged project (if test data has variance)
4. Click "View Details" on flagged project
5. ✅ Should see orange alert: "High variance detected - Consider targeted review"
6. ✅ Should see standard deviation value
7. As Judge, go to `/judge-cockpit/assignments`
8. ✅ Targeted review should be at top with orange border
9. ✅ Should show trigger reason
10. Click "Start Targeted Review"
11. ✅ Should go to evaluation workspace
12. Complete evaluation carefully
13. ✅ Submission should work normally

**Expected Results:**
- ✅ Variance calculated correctly (stdDev >= threshold)
- ✅ Visual indicators consistent across UI
- ✅ Targeted review prioritized in queue
- ✅ Organizer sees flagged projects
- ✅ Judge sees priority assignment

---

### Scenario 4: Calibration Workflow

**Setup:**
```javascript
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-002',
  name: 'Prof. Michael Rodriguez',
  email: 'michael@judge.com',
  role: 'JUDGE'
}));
```

**Test Steps:**
1. Navigate to `/judge-cockpit/calibration`
2. ✅ Should see info banner explaining calibration
3. ✅ Should see progress bar (1 of N)
4. ✅ Left panel shows anchor project details
5. ✅ Right panel shows rubric for scoring
6. Score first anchor project (e.g., WEAK tier)
7. ✅ Weighted score updates in real-time
8. Click "Next"
9. ✅ Progress bar advances
10. ✅ New anchor project loads (e.g., TYPICAL tier)
11. Score second anchor
12. Click "Next"
13. ✅ Final anchor project loads (e.g., STRONG tier)
14. Score final anchor
15. Click "Complete Calibration"
16. ✅ Results screen appears
17. ✅ Shows bias number (e.g., "+0.15" or "-0.32")
18. ✅ Shows bias label (Well Calibrated, Lenient, or Harsh)
19. ✅ Shows guidance text explaining bias
20. Click "Continue to Assignments"
21. ✅ Redirects to cockpit home

**Expected Results:**
- ✅ Smooth wizard navigation
- ✅ All scores persist during navigation
- ✅ Bias calculation accurate
- ✅ Results clearly explained
- ✅ No confusion about next steps

---

## 🐛 Common Issues & Fixes

### Issue: "No assignments found"
**Cause:** Judge has no assignments in database
**Fix:** 
1. Seed database with assignments
2. Or use existing endpoint to create assignments
3. Or run: `POST /api/v1/events/:eventId/judging/assignments/generate`

### Issue: "No participants/projects showing"
**Cause:** No data in database for current event
**Fix:**
1. Check eventId matches (`demo-event` by default in code)
2. Seed database with test data
3. Or change eventId in page.tsx to match your data

### Issue: Judge still sees participant screen
**Cause:** localStorage not set or role incorrect
**Fix:**
```javascript
// Clear and reset
localStorage.clear();
localStorage.setItem('dogfood_user', JSON.stringify({
  id: 'judge-001',
  name: 'Test Judge',
  email: 'judge@test.com',
  role: 'JUDGE'  // Make sure this is uppercase
}));
// Reload page
location.reload();
```

### Issue: 404 on API calls
**Cause:** Backend not running or wrong port
**Fix:**
1. Start backend: `cd apps/api && npm run dev`
2. Check port is 4000
3. Check CORS is enabled

### Issue: Empty progress bars
**Cause:** No ballots or assignments in database
**Fix:**
1. Complete at least one evaluation as judge
2. Submit a ballot
3. Refresh assignments page

---

## 🎬 Quick Demo Script (5 minutes)

### Demo: Complete Judge Experience

**1. Judge Login (30 seconds)**
- Set judge user in console
- Navigate to `/judge`
- Show auto-redirect to cockpit

**2. Cockpit Overview (1 minute)**
- Show progress dashboard
- Point out calibration status
- Show next assignment card
- Click "View All Assignments"

**3. Calibration (1.5 minutes)**
- Navigate to calibration
- Quickly score one anchor
- Show real-time weighted score
- Click through to results screen
- Explain bias compensation

**4. Evaluation (2 minutes)**
- Start evaluation on assignment
- Show split-screen layout
- Adjust a few sliders
- Show weighted score updates
- Add quick feedback
- Submit ballot
- Show confirmation modal
- Show cryptographic commitment message

**Total: ~5 minutes for complete judge flow**

---

### Demo: Organizer Dashboard

**1. Command Center (1 minute)**
- Show pulse metrics
- Show alerts
- Show timeline

**2. Projects View (1.5 minutes)**
- Navigate to projects
- Show statistics
- Filter by "High Variance"
- Open detail modal
- Show variance alert

**3. Participants View (1.5 minutes)**
- Navigate to participants
- Show search
- Show filters
- Export CSV

**Total: ~4 minutes for key organizer features**

---

## 📋 Manual Testing Checklist

### Organizer Features
- [ ] Command center loads with real data
- [ ] Participants page loads
- [ ] Participant search works
- [ ] Participant filters work
- [ ] CSV export downloads
- [ ] Projects page loads
- [ ] Project search works
- [ ] Project filters work
- [ ] High variance detection works
- [ ] Project detail modal works
- [ ] Statistics are accurate

### Judge Features
- [ ] `/judge` redirects to `/judge-cockpit`
- [ ] Cockpit home shows progress
- [ ] Next assignment card displays
- [ ] Assignments queue loads
- [ ] Targeted reviews highlighted
- [ ] Search filters assignments
- [ ] Status filter works
- [ ] Start Evaluation works
- [ ] Evaluation workspace loads
- [ ] Sliders update weighted score
- [ ] Can add evidence notes
- [ ] Can flag project
- [ ] Submit ballot works
- [ ] Confirmation modal shows
- [ ] Recusal modal works
- [ ] Calibration wizard loads
- [ ] Can navigate anchors
- [ ] Progress bar updates
- [ ] Results screen shows
- [ ] Bias calculated correctly

### Backend Integration
- [ ] All API calls return 200
- [ ] Data matches database
- [ ] Statistics calculations accurate
- [ ] Filters work server-side
- [ ] RBAC enforced
- [ ] Error responses handled

---

## 🔧 Developer Tools

### Useful Console Commands

#### Check Current User
```javascript
JSON.parse(localStorage.getItem('dogfood_user'));
```

#### Switch Roles Quickly
```javascript
// Quick role switch function
function switchRole(role) {
  const user = JSON.parse(localStorage.getItem('dogfood_user'));
  user.role = role;
  localStorage.setItem('dogfood_user', JSON.stringify(user));
  location.reload();
}

// Usage:
switchRole('JUDGE');
switchRole('ORGANIZER');
switchRole('PARTICIPANT');
```

#### Clear All Data
```javascript
localStorage.clear();
location.reload();
```

#### Mock Multiple Users
```javascript
const users = {
  judge: { id: 'j1', name: 'Judge Sarah', email: 'sarah@j.com', role: 'JUDGE' },
  org: { id: 'o1', name: 'Organizer Alex', email: 'alex@o.com', role: 'ORGANIZER' },
  part: { id: 'p1', name: 'Participant Jamie', email: 'jamie@p.com', role: 'PARTICIPANT' }
};

// Switch users
function setUser(type) {
  localStorage.setItem('dogfood_user', JSON.stringify(users[type]));
  location.reload();
}

// Usage:
setUser('judge');
setUser('org');
setUser('part');
```

---

## 📊 Expected Data Scenarios

### Scenario A: Fresh Event (No Data)
- Command center shows all zeros
- No alerts generated
- Empty state messages appear
- Export CSV returns empty file

### Scenario B: Registration Phase
- Participants show in list
- No teams yet
- No projects
- "Form teams" alerts show

### Scenario C: Submission Phase
- Projects appear in grid
- Some submitted, some draft
- No judging stats yet
- Submission progress < 100%

### Scenario D: Judging Phase
- Assignments appear in queue
- Some completed, some pending
- Judging stats populate
- Variance detection active

### Scenario E: High Variance Detected
- Orange flags on projects
- Targeted reviews created
- Organizer sees alerts
- Judges see priority assignments

---

## ✅ Success Criteria

### For Judges
- ✅ Never see participant/team screens
- ✅ Can complete calibration smoothly
- ✅ Can evaluate projects efficiently
- ✅ Targeted reviews clearly marked
- ✅ Progress always visible
- ✅ Receipts/confirmations provided

### For Organizers
- ✅ Can see all participants and projects
- ✅ High variance automatically detected
- ✅ Statistics accurate and real-time
- ✅ Can filter/search easily
- ✅ Can export data
- ✅ Alerts guide actions

### For System
- ✅ No console errors
- ✅ All API calls succeed
- ✅ Fast page loads (< 2s)
- ✅ Responsive on mobile
- ✅ Accessible (keyboard nav works)

---

## 🎉 When Everything Works

You should be able to:

1. **As Judge**: Login → Auto-redirect to cockpit → See assignments → Complete calibration → Evaluate projects → Submit ballots → See progress → NO team creation screens

2. **As Organizer**: Login → View command center → Browse participants → Browse projects → See variance flags → Export data → Make decisions

3. **Cross-Role**: Judge assignments sync with organizer's project view → High variance triggers targeted reviews → Statistics update in real-time

---

## 📞 Need Help?

### Check These First
1. Is backend running? (`http://localhost:4000/health`)
2. Is database seeded? (Check pgAdmin or `psql`)
3. Is user role correct? (Check localStorage)
4. Are there assignments? (Check database or API)
5. Is eventId correct? (Default: `demo-event`)

### Common Questions

**Q: Why can't I see any assignments?**
A: You need to generate assignments first via the assignments endpoint or as organizer.

**Q: Why is high variance not showing?**
A: You need at least 2 judges with significantly different scores on the same project.

**Q: Can I test without backend?**
A: No - all features require real backend API calls. No mock data.

**Q: How do I reset everything?**
A: Clear localStorage + reset database to seed state.

---

🚀 **Ready to test! Start with the Judge Flow scenario above.**
