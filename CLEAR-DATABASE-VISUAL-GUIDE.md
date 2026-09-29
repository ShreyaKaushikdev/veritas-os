# Clear Database - Visual Guide

## 🎯 Where is the Button?

### Step 1: Navigate to Organizer Dashboard
```
http://localhost:3000/organizer
```

### Step 2: Look at the Top Section

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 EVENT CONTROL TOWER                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Quick Actions                                           │  │
│  │                                                           │  │
│  │  [⚡ Prompt-to-Hackathon]  ← Create new hackathon       │  │
│  │                                                           │  │
│  │  [🗑️ Clear All Entries 🧹] [Seed Demo]  ← HERE!         │  │
│  │   ↑ CLICK THIS RED BUTTON                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📊 METRICS (showing demo data):                               │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐         │
│  │ Live    │ Submis- │ Ballots │ Review  │ Disputes│         │
│  │ Teams   │ sions   │ Cast    │ Status  │         │         │
│  │   40    │    1    │   114   │   95%   │    2    │         │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Click the Red Button

```
Button appearance:
┌──────────────────────────────────┐
│  🗑️  Clear All Entries 🧹        │
│  (Red background, hover effect) │
└──────────────────────────────────┘
```

### Step 4: Confirm in Dialog

```
Browser Alert:
┌─────────────────────────────────────────────────┐
│  Are you sure you want to clear all            │
│  mock/seeded entries and run 100% on           │
│  real live data?                               │
│                                                 │
│            [Cancel]      [OK]                   │
│                           ↑                     │
│                        CLICK OK                 │
└─────────────────────────────────────────────────┘
```

### Step 5: Success!

```
After clicking:
┌─────────────────────────────────────────────────────────────────┐
│  ✅ All mock entries wiped! Database is now 100% clean live     │
│     slate.                                                      │
└─────────────────────────────────────────────────────────────────┘

Metrics update to:
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Live    │ Submis- │ Ballots │ Review  │ Disputes│
│ Teams   │ sions   │ Cast    │ Status  │         │
│    0    │    0    │    0    │    0%   │    0    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 🎨 Button Visual Details

### Normal State:
```
╔════════════════════════════════╗
║  🗑️  Clear All Entries 🧹      ║
║                                ║
║  Red/dark background          ║
║  Hover: brightens             ║
║  Font: Mono, bold             ║
╚════════════════════════════════╝
```

### While Clearing:
```
╔════════════════════════════════╗
║  🗑️  Clearing...               ║
║                                ║
║  Button disabled              ║
║  Slightly dimmed              ║
╚════════════════════════════════╝
```

### After Success:
```
╔════════════════════════════════╗
║  🗑️  Clear All Entries 🧹      ║
║                                ║
║  Back to normal               ║
║  Ready to use again           ║
╚════════════════════════════════╝
```

---

## 📱 Mobile View

On smaller screens, the button may stack vertically:

```
┌────────────────────────────┐
│  [⚡ Prompt-to-Hackathon]  │
│                            │
│  [🗑️ Clear All Entries 🧹] │ ← Click here
│                            │
│  [Seed Demo]               │
└────────────────────────────┘
```

---

## 🎯 Exact Location in Code

**File**: `apps/web/src/app/organizer/page.tsx`

**Line**: ~540

```tsx
<button
  onClick={handleClearDatabase}
  disabled={clearing}
  title="Wipe all mock/seeded records to run 100% on real live data"
  className="flex-1 px-3 py-2 rounded-xl bg-red-950/40 
             hover:bg-red-900/60 text-red-300 hover:text-white 
             border border-red-500/30 text-[11px] font-mono 
             font-bold transition-all flex items-center 
             justify-center space-x-1.5 cursor-pointer"
>
  <Trash2 className="w-3.5 h-3.5 text-red-400" />
  <span>{clearing ? 'Clearing...' : 'Clear All Entries 🧹'}</span>
</button>
```

---

## 🔍 How to Find It

### Visual Cues:
1. **Red button** - Only red button in that section
2. **Trash icon** 🗑️ - Has a trash can icon
3. **"Clear All Entries 🧹"** text - Clear label
4. **Below "Prompt-to-Hackathon"** - Second row of buttons

### Section Heading:
- Look for **"Quick Actions"** section
- Usually near the top of the page
- Above the metrics tiles

---

## 🎬 Animation Sequence

1. **Click** → Button label changes to "Clearing..."
2. **1-2 seconds** → API call processes
3. **Success banner** → Green message appears
4. **Metrics update** → All numbers change to 0
5. **4 seconds** → Success message fades out
6. **Done** → Clean dashboard

---

## 📸 Screenshot Reference

Your dashboard should look like this:

**Before (with demo data):**
```
Quick Actions:
├── ⚡ Prompt-to-Hackathon
└── 🗑️ Clear All Entries 🧹 | Seed Demo

Metrics:
├── Live Teams: 40          ← Demo data
├── Submissions: 1
├── Ballots Cast: 114
├── Review Status: 95%
└── Disputes: 2
```

**After (clean):**
```
Quick Actions:
├── ⚡ Prompt-to-Hackathon
└── 🗑️ Clear All Entries 🧹 | Seed Demo

Metrics:
├── Live Teams: 0           ← All zeros!
├── Submissions: 0
├── Ballots Cast: 0
├── Review Status: 0%
└── Disputes: 0
```

---

## ⚡ Quick Reference Card

```
╔════════════════════════════════════════╗
║   CLEAR DATABASE - QUICK REFERENCE    ║
╠════════════════════════════════════════╣
║                                        ║
║  WHERE:  /organizer page               ║
║  BUTTON: Red "Clear All Entries 🧹"   ║
║  COLOR:  Red background                ║
║  ICON:   🗑️ Trash can                  ║
║  HOVER:  Brightens on hover            ║
║                                        ║
║  ACTION: Click → Confirm → Done!       ║
║  RESULT: All metrics → 0               ║
║  TIME:   1-2 seconds                   ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 🎨 Color Coding

| Element | Color | Purpose |
|---------|-------|---------|
| Button Background | Dark Red (#991b1b/40) | Indicates destructive action |
| Button Text | Light Red (#fca5a5) | Readable on dark bg |
| Button Hover | Brighter Red | Visual feedback |
| Icon | Red (#f87171) | Trash can icon |
| Success Message | Green | Confirms completion |

---

## 🚦 Status Indicators

### Ready to Clear:
```
🟢 Button is clickable
🟢 Shows "Clear All Entries 🧹"
🟢 Hover effect works
```

### Clearing in Progress:
```
🟡 Button disabled
🟡 Shows "Clearing..."
🟡 No hover effect
```

### Cleared Successfully:
```
🟢 Green success banner
🟢 Metrics show 0
🟢 Button returns to normal
```

---

## 📋 Checklist

Before clicking:
- [ ] You're on the /organizer page
- [ ] You can see the red button
- [ ] You're logged in as organizer/admin

While clearing:
- [ ] Button shows "Clearing..."
- [ ] Button is disabled

After clearing:
- [ ] Success message appears
- [ ] All metrics show 0
- [ ] Projects list is empty

---

## 💡 Pro Tip

**Keyboard shortcut (after selecting button):**
1. Tab to the button
2. Press Enter
3. Tab to OK in confirm dialog
4. Press Enter

---

**Can't find the button?** 
- Make sure you're logged in as Organizer or Admin
- Try refreshing the page
- Check you're at http://localhost:3000/organizer

**Still stuck?**
- Use the script: `clear-database.bat`
- Or API call: `curl -X POST http://localhost:4000/database/clear`

---

**Status**: ✅ Complete visual guide  
**Last Updated**: 2026-09-29
