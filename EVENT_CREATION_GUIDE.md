# Hackathon Event Creation - Complete Guide

## Overview

You can now create hackathon events in **two ways**:

1. **AI-Assisted (Prompt)** - Describe your event, AI generates all details
2. **Manual Setup** - Fill in every field with complete control

Both methods are available at: `http://localhost:3000/organizer/create-event`

---

## Method 1: AI-Assisted Creation (Prompt)

### How It Works

1. Navigate to `/organizer/create-event`
2. Click **"AI-Assisted"** button
3. Describe your hackathon in natural language
4. Click **"Generate Event Details"**
5. Review the generated details
6. Make customizations if needed
7. Click **"Create Hackathon Event"**

### Example Prompts

**Example 1: AI-Focused Event**
```
We're hosting an AI hackathon for university students over 24 hours. 
We want to focus on practical AI applications and LLM integration. 
Prize pool is $10,000. We need judges with expertise in ML/AI. 
We want an Open Track and AI/ML track.
```

**Example 2: Web3 Event**
```
Create a hackathon for developers interested in blockchain and web3. 
Focus on DApps, smart contracts, and decentralized finance. 
48-hour event with $15,000 prizes. 
Include multiple blockchain tracks (Ethereum, Solana, Polygon).
```

**Example 3: Sustainability**
```
Green tech hackathon for climate and environmental solutions. 
Target: students and professionals interested in sustainability. 
24-hour event. $5,000 prize pool. Focus on impact measurement.
```

### What Gets Generated

From your prompt, the system automatically creates:

- ✅ **Event Name & Slug** - Derived from your description
- ✅ **Deadlines** - Registration (7d), Submission (14d), Freeze (15d), Judge (21d)
- ✅ **Tracks** - Open + specialty tracks based on keywords detected
- ✅ **Prizes** - Default: $5k, $3k, $2k or customized
- ✅ **Rubric Criteria** - Technical Depth, Innovation, Feasibility, Presentation
- ✅ **Configuration** - Timezone, min reviews (3), disagreement threshold (1.5)

### Customization After Generation

After AI generates the event, you can:

- 📝 Edit event name, slug, description
- 📅 Adjust all deadlines
- 🎯 Add/remove/modify tracks
- 🏆 Add/remove/modify prizes  
- 📊 Add/remove/modify rubric criteria
- ⚙️ Adjust advanced settings (min reviews, threshold, blind review mode)

---

## Method 2: Manual Setup (Detailed)

### How It Works

1. Navigate to `/organizer/create-event`
2. Click **"Manual Setup"** button
3. Fill in each section completely
4. Click **"Create Hackathon Event"**

### Complete Form Sections

#### Section 1: Event Information

**Required Fields:**
- **Event Name** - Your hackathon title (e.g., "AI Hackathon 2026")
- **URL Slug** - URL-friendly identifier (auto-formatted, e.g., "ai-hackathon-2026")
- **Description** - What is your hackathon about? (full details)

**Optional Fields:**
- **Timezone** - UTC, EST, CST, PST, IST (affects all deadlines)
- **Min Reviews Per Project** - How many judges per project (default: 3)
- **Disagreement Threshold** - Std dev for flagging high variance (default: 1.5)
- **Blind Review Mode** - Hide team/project info from judges

#### Section 2: Deadlines

**All Required:**
- **Registration Deadline** - When can people register?
- **Submission Deadline** - When must projects be submitted?
- **Freeze Deadline** - When submissions are locked?
- **Judge Deadline** - When must judging be complete?

**Timeline Example (24-hour event):**
```
Today 9:00 AM       → Registration opens
Today 6:00 PM       → Registration closes (9 hours in)
Tomorrow 6:00 PM    → Submission deadline (21 hours after start)
Tomorrow 7:00 PM    → Submissions frozen
Tomorrow 8:00 PM    → Judging deadline
```

#### Section 3: Competition Tracks

**Minimum:** 1 track (usually "Open Track")

**Standard Tracks:**
- Open Track
- AI/ML
- Web3/Blockchain
- Sustainability
- Mobile
- Enterprise

**For Each Track, Provide:**
- Track name (e.g., "AI/ML")
- Track description (e.g., "Artificial intelligence and machine learning solutions")

**Add Tracks** - Click the "+" button to add more

#### Section 4: Prizes

**Suggested Prizes:**
- 🥇 First Place - $5,000
- 🥈 Second Place - $3,000  
- 🥉 Third Place - $2,000

**Optional Special Prizes:**
- Best Design
- Most Innovative
- Best Pitch
- People's Choice

**For Each Prize:**
- Title (can use emoji)
- Description (why this prize?)
- Amount (e.g., "$5,000")

#### Section 5: Evaluation Criteria

**Minimum:** 1 criteria (usually 4 equally weighted)

**Standard Criteria (Weighted):**
1. **Technical Depth** (25%)
   - Code quality, architecture, technical complexity
   - Range: 1-10

2. **Innovation** (25%)
   - Novelty and creativity of solution
   - Range: 1-10

3. **Feasibility** (25%)
   - Realistic implementation and scope
   - Range: 1-10

4. **Presentation** (25%)
   - Clarity of demo, documentation, delivery
   - Range: 1-10

**For Each Criteria:**
- Name
- Description/guidance for judges
- Weight (percentage, auto-calculated)
- Min Score (default: 1)
- Max Score (default: 10)

**Important:** Total weights should sum to 100%

---

## Comparing Both Methods

| Feature | AI-Assisted | Manual |
|---------|------------|--------|
| Speed | ⚡ 2-3 minutes | ⏱️ 10-15 minutes |
| Control | 🎯 Medium (can customize) | 🎛️ Complete |
| Defaults | ✨ Smart suggestions | 📝 You fill in all |
| Best For | Quick setup, familiar events | Custom events, specific needs |
| Learning Curve | 📚 Low | 📚 Medium |

---

## Creating Your First Event

### Quick Start (AI Method)

```
1. Go to /organizer/create-event
2. Click "AI-Assisted"
3. Type: "24-hour AI hackathon for university students. Focus on practical AI. $10,000 prize pool."
4. Click "Generate Event Details"
5. Review and click "Create Hackathon Event"
6. Done! You'll be redirected to your event dashboard
```

**Time:** ~2 minutes

### Detailed Start (Manual Method)

```
1. Go to /organizer/create-event
2. Click "Manual Setup"
3. Fill Section 1: Event name, slug, description
4. Fill Section 2: Set all 4 deadlines
5. Fill Section 3: Add tracks (Open + at least one more)
6. Fill Section 4: Add prizes (at least 3)
7. Fill Section 5: Rubric criteria (usually 4)
8. Click "Create Hackathon Event"
9. Done! You'll be redirected to your event dashboard
```

**Time:** ~10-15 minutes

---

## After Creating Your Event

Once your event is created, you can:

### ✅ Immediate Next Steps

1. **Add Participants** - Invite teams and judges
   - Go to `/organizer/participants`
   - Add judges and verify they have correct roles

2. **Configure Tracks** - Ensure tracks are set up correctly
   - Go to `/organizer/command-center`
   - Verify tracks in event settings

3. **Set Anchor Projects** - For judge calibration
   - Upload weak/typical/strong sample projects
   - Helps judges understand scoring expectations

4. **Add Judges** - Build your judging panel
   - Min recommended: 3 judges
   - Max realistic: 10-15 judges

### 🎯 Advanced Configuration

- **Blind Review Mode** - Hide identities from judges
- **Disagreement Threshold** - Adjust quality standards
- **Min Reviews** - Change number of reviews per project
- **Prize Details** - Customize prizes and sponsor names

---

## Troubleshooting

### Problem: "Event slug already taken"
**Solution:** Choose a different slug (e.g., add "-2026" or "-spring")

### Problem: AI prompt didn't generate good tracks
**Solution:** 
- Try being more specific (e.g., "include web3 track")
- Switch to manual mode and add custom tracks

### Problem: Deadline validation error
**Solution:**
- Ensure deadlines are in chronological order
- Registration < Submission < Freeze < Judge
- Use same date but different times if same day

### Problem: Rubric weights don't sum to 100%
**Solution:**
- Check the total percentage shown below criteria
- Adjust weights (usually 0.25 each for 4 criteria)
- Can also do 0.5 + 0.3 + 0.2 etc.

### Problem: Can't create event (no permission)
**Solution:**
- Ensure you're logged in as ORGANIZER or ADMIN
- Check your role in `/organizer/command-center`

---

## API Reference

### Generate Event from Prompt

```bash
POST /api/v1/events/generate-from-prompt
Content-Type: application/json

{
  "prompt": "Your event description here..."
}

Response:
{
  "name": "Generated Event Name",
  "slug": "generated-event-slug",
  "description": "Full description",
  "tracks": [...],
  "prizes": [...],
  "criteria": [...],
  "deadlines": {...},
  "_metadata": {...}
}
```

### Create Event

```bash
POST /api/v1/events
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Event Name",
  "slug": "event-slug",
  "description": "Description",
  "tracks": [
    { "name": "Track Name", "description": "Track description" }
  ],
  "prizes": [
    { "title": "Prize", "description": "Desc", "amount": "$5,000" }
  ],
  "criteria": [
    {
      "name": "Criteria",
      "description": "Desc",
      "weight": 0.25,
      "minScore": 1,
      "maxScore": 10
    }
  ]
}

Response:
{
  "id": "event-id",
  "name": "Event Name",
  "slug": "event-slug",
  "status": "DRAFT",
  "tracks": [...],
  "prizes": [...],
  "rubrics": {...},
  ...
}
```

---

## Best Practices

### ✅ DO:
- Use descriptive track and criteria names
- Set clear, achievable deadlines
- Include at least 3 prize tiers
- Test event with mock data first
- Create events in DRAFT mode (can edit)

### ❌ DON'T:
- Set overlapping deadlines
- Use vague criteria descriptions
- Create criteria with 0% weight
- Set freeze deadline before submission
- Use identical track names

---

## Examples

### Example 1: Simple 24-Hour Hackathon

**Event Name:** Code Sprint 2026
**Slots:**
- Registration: Today 8am - 4pm (8 hours)
- Submission: Today 4pm - Tomorrow 2pm (22 hours)
- Freeze: Tomorrow 2pm - 3pm
- Judge: Tomorrow 3pm - Tomorrow 5pm

**Tracks:**
- Open Track
- AI/ML
- Web Development

**Prizes:**
- $1,000 for 1st
- $500 for 2nd
- $250 for 3rd

**Criteria:**
- Technical: 30%
- Design: 30%
- Innovation: 25%
- Presentation: 15%

### Example 2: Student-Focused Weekend Hackathon

**Event Name:** University Hackathon Spring 2026
**Timeline:**
- Friday 6pm - Saturday 6am (12 hours registration)
- Saturday 6am - Sunday 6am (24 hours coding)
- Sunday 6am - 6pm (judging)

**Tracks:**
- Open
- Sustainability
- FinTech
- EdTech

**Special Prizes:**
- Best Social Impact
- Best Design
- Most Innovative Use of AI
- People's Choice

**Criteria:**
- Code Quality: 25%
- User Experience: 25%
- Impact: 25%
- Polish: 25%

---

## Support

For issues:

1. Check the Troubleshooting section above
2. Verify all required fields are filled
3. Ensure deadlines are in chronological order
4. Check browser console for detailed errors (F12)
5. Try the other creation method (AI vs Manual)

For complex customization, consider:
- Adding custom tracks after event creation
- Setting anchor projects for judge calibration
- Creating multiple prize tiers
- Designing custom rubric criteria
