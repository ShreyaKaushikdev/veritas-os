# Test Data Generator - Updated Guide

## Overview

The Test Data Generator UI is now **fully functional** and located at `/admin/test-data`. It creates realistic test data directly from the frontend in just a few clicks.

## What Gets Created

When you click "Create Test Data", the system will:

1. **Teams** (2)
   - AI Wizards
   - Code Ninjas

2. **Projects** (2) - as frozen submissions
   - SmartChat AI
   - CodeReview Pro

3. **Judge Assignments** (up to 6)
   - Automatically distributed 3 reviews per project
   - From the judge pool in your event

## How to Use

### Quick Start (30 seconds)

1. Open your browser and go to: `http://localhost:3000/admin/test-data`
2. Verify the **Event ID** field has your event (default: `live-node-d1`)
3. Click the blue **"Create Test Data"** button
4. Watch the progress bar - should complete in 10-15 seconds
5. Once complete, click refresh (F5) or use the helper buttons

### What You'll See

**Progress Steps:**
- Step 1/5: Creating teams
- Step 2/5: Creating project submissions  
- Step 3/5: Freezing projects
- Step 4/5: Generating judge assignments
- Step 5/5: Finalizing

**Success State:**
- Green checkmark with "🎉 Test data created successfully!"
- List of what was created
- "Next Steps" guidance

## Important Notes

### Prerequisites

Before using the generator, make sure:

1. **Event exists** - The event ID must already exist in your database
   - Your current event: `live-node-d1`
   - Check in `/organizer/command-center` if unsure

2. **Backend is running** - The API must be running at `http://localhost:4000`
   - Start with: `npm run dev` from `/apps/api`

3. **Teams may already exist** - If teams are already created, you'll see warnings but the data generator continues

### Expected Behavior

| Scenario | What Happens |
|----------|-------------|
| First run | Creates all teams, projects, and assignments ✅ |
| Second run | May skip team creation (already exist) but creates new project assignments ⚠️ |
| Event doesn't exist | "Event not found" error - create event first in command center |
| Backend offline | Network error - start backend server |
| No judges in event | Assignments may be empty - add judges first in command center |

## API Endpoints Used

The generator calls:

```
POST /api/v1/teams                               → Create teams
POST /api/v1/submissions                         → Create projects
POST /api/v1/submissions/{id}/freeze             → Freeze submissions
POST /api/v1/events/{eventId}/judging/assignments/generate  → Generate assignments
```

## Next Steps After Creation

### 1. Verify Data Created
- Go to `/organizer/command-center` - should show pulse metrics
- Go to `/organizer/participants` - should show team members
- Go to `/organizer/projects` - should show 2 projects with high variance badge on Project 1

### 2. Test as Judge
- Click the purple button: **"👨‍⚖️ Switch to Judge Role & View Assignments"**
- You'll be redirected to `/judge-cockpit` with test judge role
- Should see assignment queue with projects ready to evaluate

### 3. Test as Organizer
- Click the green button: **"🎛️ Switch to Organizer & View Dashboard"**
- You'll see full organizer command center with:
  - Pulse metrics (participants, projects, judges, ballots)
  - Projects grid with high variance highlighting
  - Full evaluation workflow

## Troubleshooting

### Problem: "Event not found"
**Solution:** Your event ID doesn't exist yet. Create one from `/organizer/command-center` first.

### Problem: No teams created
**Solution:** This is normal if teams already exist from a previous run. The generator continues and creates projects anyway.

### Problem: Network error connecting to backend
**Solution:** Make sure the backend API is running:
```bash
cd apps/api
npm run dev
```

### Problem: No judge assignments generated
**Solution:** 
1. Make sure judges exist in the event (create them in command center)
2. Check that projects were actually created (look in projects page)
3. Try running the generator again

### Problem: Data doesn't show up after creation
**Solution:** 
1. Refresh your browser (F5)
2. Clear browser cache if needed (Ctrl+Shift+Delete)
3. Check that you're using correct event ID

## Advanced: Manual Data Inspection

To see the raw data created in the database:

```bash
# From your workspace root
npx prisma studio --schema apps/api/prisma/schema.prisma
```

This opens a visual database browser at `http://localhost:5555`

## Files Modified

- `apps/web/src/app/admin/test-data/page.tsx` - Test Data Generator UI (400+ lines)
- Uses correct API endpoints: `/api/v1/submissions` (not `/api/v1/projects`)
- Simplified 6-step process to 5 steps (no separate ballot creation)

## Architecture

The generator is a **client-side tool** that:

1. Makes HTTP requests to your backend API
2. Creates real Prisma database records
3. Uses localStorage to simulate user authentication
4. Does NOT use mock data - all data is real in the database

This means you can delete/inspect the data in Prisma Studio and it persists in the real database.
