# Create Event - Quick Start (2-3 minutes)

## Go to `/organizer/create-event`

### Choose Your Method

#### 🚀 Quick: AI-Assisted (Recommended for First Time)

1. **Click "AI-Assisted"** button
2. **Describe your event** (can be casual):
   ```
   24-hour AI hackathon for university students.
   Focus on practical AI and LLMs. $10,000 prize pool.
   We need tracks for Open, AI/ML, and Web3.
   3-4 judges needed.
   ```
3. **Click "Generate Event Details"** (2 seconds processing)
4. **Review** what was generated
5. **Customize** anything you want to change (titles, descriptions, dates)
6. **Click "Create Hackathon Event"** ✅

**Result:** Complete event with tracks, prizes, rubric, all deadlines configured!

---

#### ⚙️ Detailed: Manual Setup (Full Control)

1. **Click "Manual Setup"** button

2. **Section 1: Event Info**
   - Name: `AI Hackathon 2026`
   - Slug: `ai-hackathon-2026` (auto-filled)
   - Description: Your full event description
   - Keep timezone as UTC unless specific

3. **Section 2: Deadlines** (pick realistic dates)
   - Registration: 7 days from now
   - Submission: 14 days from now
   - Freeze: 15 days from now
   - Judge: 21 days from now

4. **Section 3: Tracks** (add at least 2)
   ```
   Track 1: Open Track | "Any project ideas welcome"
   Track 2: AI/ML | "Artificial intelligence solutions"
   ```

5. **Section 4: Prizes** (add at least 3)
   ```
   🥇 First Place | "Overall winner" | $5,000
   🥈 Second Place | "Runner-up" | $3,000
   🥉 Third Place | "Third place" | $2,000
   ```

6. **Section 5: Rubric Criteria** (use defaults or customize)
   ```
   ✓ Technical Depth (25%) | 1-10 scale
   ✓ Innovation (25%) | 1-10 scale
   ✓ Feasibility (25%) | 1-10 scale
   ✓ Presentation (25%) | 1-10 scale
   ```

7. **Click "Create Hackathon Event"** ✅

---

## What Happens Next?

✅ Event created in DRAFT status
✅ Redirected to `/organizer/command-center?eventId=<your-event>`
✅ See your event with 0 participants (add them next)

## Next Steps (Do These)

1. **Add Judges** → Go to Participants, add 3-4 judges
2. **Check Tracks** → Go to Projects, verify tracks appear
3. **Test It** → Use Test Data Generator at `/admin/test-data`
4. **Create Teams** → Start inviting participants

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "slug already taken" | Add `-2` or `-spring` to slug |
| "All deadlines required" | Set all 4 deadline dates |
| "At least one track" | Add at least 1 track |
| "weights don't sum to 100%" | Adjust criteria percentages (0.25 each for 4) |
| Redirects to login | Log in as ORGANIZER first |

---

## Pro Tips

💡 **Tip 1:** Use AI method first to get all fields filled
💡 **Tip 2:** Copy successful event configs for next event
💡 **Tip 3:** Set registration deadline 24-48 hours before coding starts
💡 **Tip 4:** Use 3+ judges minimum for better quality
💡 **Tip 5:** Test with sample projects before going live

---

## The Full Picture

```
Create Event
    ↓
Add Judges & Participants
    ↓
Create Test Data (optional, for testing)
    ↓
Judge Calibration (judges practice scoring)
    ↓
Open Registration
    ↓
Teams Submit Projects
    ↓
Freeze Submissions
    ↓
Judge Evaluations
    ↓
Publish Results
```

You're starting at step 1. Let's go! 🚀
