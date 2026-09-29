# Event Creation - Visual Guide & Flowcharts

## User Journey Map

### 🚀 AI-Assisted Path (2-3 minutes)

```
┌─────────────────────────────────────────────────────────┐
│  Start: Go to /organizer/create-event                   │
└─────────────────────────────────────────────────────────┘
                         ↓
                    [See 2 Buttons]
                    AI / Manual
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Click "AI-Assisted" Button                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Prompt Screen                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ "Describe your hackathon..."                     │  │
│  │                                                  │  │
│  │ Example: "24-hour AI hackathon for students     │  │
│  │ Focus on practical AI. $10K prize pool."        │  │
│  │                                                  │  │
│  │ [Generate Event Details] Button                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
    (System processes prompt → 500ms)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Review Generated Event                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✓ Event Name: Generated from prompt             │  │
│  │ ✓ Tracks: Open + AI/ML (auto-detected)         │  │
│  │ ✓ Prizes: $5k, $3k, $2k (default)              │  │
│  │ ✓ Rubric: Tech, Innovation, Feasibility, Etc   │  │
│  │ ✓ Deadlines: Auto-set (7/14/15/21 days)       │  │
│  │ ✓ All fields editable                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
            [Can Customize Any Field]
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Click "Create Hackathon Event"                          │
└─────────────────────────────────────────────────────────┘
                         ↓
    (Backend: Create Event + Tracks + Prizes + Rubric)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ Success!                                            │
│  Redirect → /organizer/command-center?eventId=...     │
│                                                         │
│  Ready to: Add Judges | Create Teams | Start Event     │
└─────────────────────────────────────────────────────────┘
```

---

### ⚙️ Manual Path (10-15 minutes)

```
┌─────────────────────────────────────────────────────────┐
│  Start: Go to /organizer/create-event                   │
└─────────────────────────────────────────────────────────┘
                         ↓
                    [See 2 Buttons]
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Click "Manual Setup" Button                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ⓵ Event Information                                    │
│  ┌────────────────────────────────────────────────┐   │
│  │ Event Name*      [________________]             │   │
│  │ URL Slug*        [________________]             │   │
│  │ Description*     [________________]             │   │
│  │ Timezone         [UTC ▼]                       │   │
│  │ Min Reviews      [3]                           │   │
│  │ Disagreement     [1.5]                         │   │
│  │ Threshold                                       │   │
│  │ ☐ Blind Review   Mode                          │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ⓶ Deadlines (All Required)                             │
│  ┌────────────────────────────────────────────────┐   │
│  │ Registration*  [DatePicker] ○ 7 days          │   │
│  │ Submission*    [DatePicker] ○ 14 days         │   │
│  │ Freeze*        [DatePicker] ○ 15 days         │   │
│  │ Judge*         [DatePicker] ○ 21 days         │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ⓷ Competition Tracks (Min 1 Required)                  │
│  ┌────────────────────────────────────────────────┐   │
│  │ Track 1:                                        │   │
│  │   Name: [Open Track]                            │   │
│  │   Desc: [Any project ideas welcome]             │   │
│  │   [X] Remove                                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Track 2:                                        │   │
│  │   Name: [AI/ML]                                 │   │
│  │   Desc: [AI solutions]                          │   │
│  │   [X] Remove                                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ [+ Add Track]  (Add More)                      │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ⓸ Prizes                                               │
│  ┌────────────────────────────────────────────────┐   │
│  │ Prize 1:                                        │   │
│  │   Title: [🥇 First Place]  Amount: [$5,000]   │   │
│  │   Desc:  [Overall winner]                       │   │
│  │   [X] Remove                                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Prize 2:                                        │   │
│  │   Title: [🥈 Second Place] Amount: [$3,000]   │   │
│  │   Desc:  [Runner-up]                            │   │
│  │   [X] Remove                                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Prize 3:                                        │   │
│  │   Title: [🥉 Third Place]  Amount: [$2,000]   │   │
│  │   Desc:  [Third place]                          │   │
│  │   [X] Remove                                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │ [+ Add Prize]  (Add More)                      │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ⓹ Evaluation Criteria (Min 1 Required)                 │
│  ┌────────────────────────────────────────────────┐   │
│  │ Criteria 1: Technical Depth                    │   │
│  │   Weight: [25%] (auto)    Range: [1-10]       │   │
│  │   Desc: [Code quality, architecture...]        │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Criteria 2: Innovation                         │   │
│  │   Weight: [25%] (auto)    Range: [1-10]       │   │
│  │   Desc: [Novelty and creativity...]            │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Criteria 3: Feasibility                        │   │
│  │   Weight: [25%] (auto)    Range: [1-10]       │   │
│  │   Desc: [Realistic implementation...]          │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Criteria 4: Presentation                       │   │
│  │   Weight: [25%] (auto)    Range: [1-10]       │   │
│  │   Desc: [Clarity of demo, docs...]             │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Total Weight: 100% ✓                            │   │
│  │ [+ Add Criteria]                               │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ✓ Validate All Fields                                  │
│  - All required fields filled                           │
│  - Deadlines in order                                   │
│  - Criteria weights = 100%                              │
│  - Slug is unique                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Click "Create Hackathon Event"                          │
└─────────────────────────────────────────────────────────┘
                         ↓
    (Backend: Create Event + All Relations)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ Success!                                            │
│  Redirect → /organizer/command-center?eventId=...     │
│                                                         │
│  Ready to: Add Judges | Create Teams | Start Event     │
└─────────────────────────────────────────────────────────┘
```

---

## Decision Tree

```
                    ┌─────────────────────┐
                    │ Create Event Page   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  What's your style? │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
            ┌─────▼─────┐           ┌─────▼─────┐
            │ Quick &    │           │ Detailed  │
            │ Easy?      │           │ & Precise?│
            └─────┬─────┘           └─────┬─────┘
                  │                       │
            [AI-Assisted]         [Manual Setup]
                  │                       │
        ┌─────────┴──────┐      ┌────────┴────────┐
        │                │      │                 │
    [Type      [Generate] │    [Fill 5 Sections]
     Prompt]             │      │
        │                │      │
    [Review]         ✓Works    [Validate]
        │                │      │
    [Maybe            │      ✓All Fields
     Tweak]           │      Correct
        │              │      │
        └──────┬───────┘      │
               │              │
           [Create Event] ◄───┘
               │
          [Success! ✅]
               │
    [Redirect to Dashboard]
```

---

## State Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   METHOD SELECTION                       │
│  (Neither AI nor Manual chosen yet)                     │
│                                                         │
│  [AI-Assisted] ────────→ or ←──── [Manual Setup]      │
└─────────────────────────────────────────────────────────┘
                ↓                    ↓
        ┌───────────────┐    ┌───────────────┐
        │  PROMPT MODE  │    │ MANUAL MODE   │
        │               │    │               │
        │ Show textarea │    │ Show 5 forms  │
        │ + Examples    │    │               │
        │               │    │ Section 1-5   │
        │ [Generate]    │    │               │
        │ [Back]        │    │ [Create]      │
        │               │    │ [Back]        │
        └───────────────┘    └───────────────┘
                ↓                    ↓
        ┌───────────────┐    ┌───────────────┐
        │  GENERATED    │    │  FORM READY   │
        │  CONFIG       │    │               │
        │               │    │ (Ready to     │
        │ Can edit all  │    │  submit when  │
        │ fields        │    │  valid)       │
        │               │    │               │
        │ [Create] ────┐│    │ [Create] ────┐│
        │ [Back]   ┌──┘│    │ [Back]   ┌──┘│
        └───────────────┘    └───────────────┘
                │                    │
                └────────┬───────────┘
                         ↓
                ┌─────────────────────┐
                │  VALIDATING EVENT   │
                │                     │
                │ Check:              │
                │ - Slug unique       │
                │ - Deadlines order   │
                │ - Criteria valid    │
                └──────────┬──────────┘
                           ↓
                ┌─────────────────────┐
                │  ✓ VALIDATION PASS  │
                │                     │
                │ Create Event +      │
                │ Tracks + Prizes +   │
                │ Rubric Criteria     │
                └──────────┬──────────┘
                           ↓
                ┌─────────────────────┐
                │  ✅ SUCCESS!        │
                │                     │
                │ Redirect to         │
                │ Command Center      │
                │ with new event      │
                └─────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Method Selection Component                        │ │
│  │  - AI vs Manual choice                            │ │
│  └───────────────────┬────────────────────────────────┘ │
│                      │                                   │
│  ┌──────────────────┴──────────────────┐               │
│  │                                     │                │
│  ▼                                     ▼                │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │ Prompt Component │      │  Manual Form 5 Sects │    │
│  │                  │      │                      │    │
│  │ - Textarea       │      │ - Section 1: Info   │    │
│  │ - Generate Btn   │      │ - Section 2: Dead   │    │
│  └────────┬─────────┘      │ - Section 3: Track  │    │
│           │                │ - Section 4: Prize  │    │
│           │ API Call       │ - Section 5: Crit   │    │
│           │ /generate      │                      │    │
│           │                └────────┬─────────────┘    │
│           │                         │                  │
└───────────┼─────────────────────────┼──────────────────┘
            │                         │
            ▼                         ▼
┌──────────────────────────────────────────────────────────┐
│                       BACKEND API                         │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /events/generate-from-prompt                     │ │
│  │  ◆ Parse prompt                                   │ │
│  │  ◆ Detect keywords                                │ │
│  │  ◆ Generate tracks                                │ │
│  │  ◆ Set defaults                                   │ │
│  │  ◆ Return config                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /events (POST)                                   │ │
│  │  ◆ Validate input                                 │ │
│  │  ◆ Check slug unique                              │ │
│  │  ◆ Create Event                                   │ │
│  │  ◆ Create Tracks                                  │ │
│  │  ◆ Create Prizes                                  │ │
│  │  ◆ Create RubricVersion                           │ │
│  │  ◆ Create RubricCriteria                          │ │
│  │  ◆ Link relationships                             │ │
│  │  ◆ Return complete event                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma)                      │
│                                                           │
│  Event ─┬─→ Track[]                                      │
│         ├─→ Prize[]                                      │
│         ├─→ RubricVersion ──→ RubricCriteria[]          │
│         ├─→ Membership (Creator as ORGANIZER)           │
│         └─→ metadata...                                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## UI Layout

### Method Selection Screen
```
┌───────────────────────────────────────────────────────────┐
│  DOGFOOD OS  (logo)                          Dashboard ▼  │
├───────────────────────────────────────────────────────────┤
│                                                            │
│     Create a Hackathon                                   │
│     Choose how you'd like to set up your event           │
│                                                            │
│  ┌─────────────────────────  ─────────────────────────┐  │
│  │ 🪄 AI-ASSISTED            │  📋 MANUAL SETUP       │  │
│  │                           │                        │  │
│  │ Describe your idea and    │  Fill in all details   │  │
│  │ let AI generate details   │  manually for complete │  │
│  │                           │  control               │  │
│  │ • Generates event         │  • Complete control    │  │
│  │ • Creates tracks auto     │  • Add custom tracks   │  │
│  │ • Sets up rubric          │  • Design rubric       │  │
│  │ • Configures deadlines    │  • Configure deadlines │  │
│  │                           │                        │  │
│  │  [Continue →]             │  [Continue →]          │  │
│  └─────────────────────────  ─────────────────────────┘  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### AI Prompt Screen
```
┌───────────────────────────────────────────────────────────┐
│  DOGFOOD OS  (logo)                          Dashboard ▼  │
├───────────────────────────────────────────────────────────┤
│  ← Back to selection                                      │
│                                                            │
│     Describe Your Hackathon                              │
│     Tell us about your hackathon idea...                 │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Describe your hackathon...                          │ │
│  │                                                     │ │
│  │ Example: We're hosting an AI hackathon for         │ │
│  │ university students over 24 hours. Focus on        │ │
│  │ practical AI applications...                        │ │
│  │                                                     │ │
│  │                                                     │ │
│  │                         [Type your description]    │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  [Generate Event Details]            [Back]              │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### Manual Form Screen
```
┌───────────────────────────────────────────────────────────┐
│  DOGFOOD OS (logo)                          Dashboard ▼   │
├───────────────────────────────────────────────────────────┤
│  ← Back to selection                                      │
│                                                            │
│     Create Your Hackathon                                │
│     Fill in all details for your event                   │
│                                                            │
│  ① EVENT INFORMATION                                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Event Name *      [_____________________]           │ │
│  │ URL Slug *        [_____________________]           │ │
│  │ Description *     [_____________________]           │ │
│  │ Timezone          [UTC ▼]                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ② DEADLINES *                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Registration     [Date/Time Picker]                │ │
│  │ Submission *     [Date/Time Picker]                │ │
│  │ Freeze *         [Date/Time Picker]                │ │
│  │ Judge *          [Date/Time Picker]                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ③ TRACKS *                                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Track 1: Open Track | Description...  [X]          │ │
│  │ Track 2: AI/ML | Artificial Intelligence... [X]    │ │
│  │ [+ Add Track]                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ④ PRIZES                                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🥇 First Place | $5,000 | Overall winner  [X]      │ │
│  │ 🥈 Second Place | $3,000 | Runner-up [X]          │ │
│  │ [+ Add Prize]                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ⑤ CRITERIA *  (Total: 100%)                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Technical | 25% | Code quality... [1-10]            │ │
│  │ Innovation | 25% | Creativity... [1-10]             │ │
│  │ [+ Add Criteria]                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  [Create Hackathon Event]        [Back]                  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## Timeline

```
User Action              System Response            Time
─────────────────────────────────────────────────────────
Visit page          →   Show method selection      300ms
Click AI            →   Show prompt textarea       100ms
Type prompt         →   (no response)              -
Click Generate      →   Process prompt             500ms
                       Show generated form
                       
Edit fields (opt)   →   Update state               Real-time
Click Create        →   Validate all fields        200ms
                       Create Event + Relations    800ms
                       Redirect to dashboard       1000ms
                       ───────────────────────
Total Time: 2-3 min (mostly user typing/thinking)
```

---

## Screen States

### Success Flow
```
Method Selection
     ↓
AI/Manual Input
     ↓
Form Validation ✓
     ↓
Success Message
     ↓
Redirect ✓
```

### Error Flow
```
Method Selection
     ↓
AI/Manual Input
     ↓
Form Validation ✗
     ↓
Error Message (red)
     ↓
Allow Correction
     ↓
Re-validate ✓
     ↓
Create Event
```

---

## Component Hierarchy

```
CreateEventPage
├── MethodSelection
│   ├── AIButton
│   └── ManualButton
│
├── PromptMode
│   ├── PromptTextarea
│   ├── GenerateButton
│   └── SubmitBttons
│
├── ManualMode
│   ├── Section1Component (EventInfo)
│   ├── Section2Component (Deadlines)
│   ├── Section3Component (Tracks)
│   ├── Section4Component (Prizes)
│   ├── Section5Component (Criteria)
│   ├── FormValidation
│   └── SubmitButtons
│
├── StatusDisplay
│   ├── ErrorBanner
│   ├── SuccessBanner
│   ├── LoadingSpinner
│   └── ProgressBar
│
└── NavigationButtons
    ├── CreateButton
    ├── BackButton
    └── CancelButton
```

---

## Summary

This is a **professional, dual-method event creation system** with:

✅ **Quick Path** - Describe → Generate → Create (2-3 min)
✅ **Detailed Path** - 5-section form with full control (10-15 min)
✅ **Smart Defaults** - AI detects event type and suggests config
✅ **Flexible** - Both methods create same complete event
✅ **User-Friendly** - Clear instructions, examples, and validation

Ready to use at: `http://localhost:3000/organizer/create-event`
