# Database Management - Quick Guide

## 🎯 Problem

You see demo data in your dashboard (40 teams, 114 ballots, etc.) and want to clear it.

## ✅ Solutions (Pick One)

### 🖱️ **Option 1: Use UI (Easiest)**
1. Go to: http://localhost:3000/organizer
2. Click the red **"Clear All Entries 🧹"** button
3. Confirm the action
4. Done! ✅

---

### 💻 **Option 2: Run Script (Windows)**

**For CMD:**
```cmd
clear-database.bat
```

**For PowerShell:**
```powershell
.\clear-database.ps1
```

---

### 🌐 **Option 3: API Call**

**Browser Console (F12):**
```javascript
fetch('http://localhost:4000/database/clear', {method: 'POST'})
  .then(r => r.json())
  .then(d => console.log('✅ Cleared:', d));
```

**cURL:**
```bash
curl -X POST http://localhost:4000/database/clear
```

---

## 📊 What You'll See After Clearing

**Before:**
```
Live Teams: 40
Submissions: 1
Ballots Cast: 114
Review Status: 95%
Disputes: 2
```

**After:**
```
Live Teams: 0
Submissions: 0
Ballots Cast: 0
Review Status: 0%
Disputes: 0
```

✅ Clean slate, ready for real data!

---

## 🔄 To Restore Demo Data (For Testing)

### UI:
- Click **"Seed Demo"** button

### Script:
- Run `reseed-database.bat` or `.\reseed-database.ps1`

### API:
```javascript
fetch('http://localhost:4000/database/reseed', {method: 'POST'});
```

---

## 📁 Files Included

| File | Purpose | How to Use |
|------|---------|------------|
| `HOW-TO-CLEAR-DATABASE.md` | Detailed guide | Read for full instructions |
| `clear-database.bat` | Windows CMD script | Double-click or run in CMD |
| `clear-database.ps1` | PowerShell script | Run in PowerShell |
| `reseed-database.bat` | Restore demo (CMD) | Double-click or run in CMD |
| `reseed-database.ps1` | Restore demo (PS) | Run in PowerShell |
| `DATABASE-MANAGEMENT-README.md` | This file | Quick reference |

---

## 🚨 Important

- ⚠️ **Clearing cannot be undone** (unless you reseed)
- ✅ Demo data is safe to delete anytime
- ✅ Use reseed for testing
- ✅ Clear before production

---

## 🐛 Troubleshooting

### "Unable to connect"
→ Start the API: `cd apps/api && npm run dev`

### Button doesn't work
→ Login as Organizer or Admin

### Data still shows
→ Refresh the page (F5)

---

## 💡 Quick Commands

```bash
# Clear all data
curl -X POST http://localhost:4000/database/clear

# Restore demo data
curl -X POST http://localhost:4000/database/reseed

# Check status
curl http://localhost:4000/database/status
```

---

## ✅ Success Checklist

After clearing:
- [ ] All counters show 0
- [ ] No projects in list
- [ ] Dashboard shows "Clean Hackathon Workspace"
- [ ] Ready for real hackathon

---

**Need Help?** Read `HOW-TO-CLEAR-DATABASE.md` for detailed instructions.

**Status**: ✅ Working  
**Last Updated**: 2026-09-29
