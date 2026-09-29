# How to Clear All Database Entries

## 🎯 Quick Summary

To remove all the seeded/demo data (40 teams, 114 ballots, etc.) from your database, you have **3 easy options**:

---

## ✅ Option 1: Use the UI Button (Easiest)

### Steps:
1. **Login as Organizer or Admin**
   - Click one of the demo login buttons
   - Or use your organizer account

2. **Go to Organizer Dashboard**
   - Navigate to: `http://localhost:3000/organizer`
   - You should see the Event Control Tower

3. **Click "Clear All Entries 🧹"**
   - Look for the red button near the top
   - It says "Clear All Entries 🧹"
   - Click it

4. **Confirm the Action**
   - A browser confirm dialog will appear
   - Click "OK" to proceed

5. **Done!**
   - You'll see: "All mock entries wiped! Database is now 100% clean live slate."
   - All counters reset to 0
   - Database is now empty and ready for real data

---

## ✅ Option 2: Use API Directly (Using Browser Console)

### Steps:
1. **Open Browser Console**
   - Press `F12` or `Ctrl+Shift+J` (Windows/Linux)
   - Press `Cmd+Option+J` (Mac)

2. **Run this command:**
```javascript
fetch('http://localhost:4000/database/clear', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('✅ Database cleared:', data))
.catch(err => console.error('❌ Error:', err));
```

3. **Check the response:**
```json
{
  "success": true,
  "message": "All mock and seeded data wiped. MongoDB is in 100% clean live mode."
}
```

---

## ✅ Option 3: Use cURL (Command Line)

### Windows (CMD):
```cmd
curl -X POST http://localhost:4000/database/clear
```

### Windows (PowerShell):
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/database/clear" -Method POST
```

### Linux/Mac:
```bash
curl -X POST http://localhost:4000/database/clear
```

---

## 📊 What Gets Cleared?

When you clear the database, the following collections are wiped:

| Collection | Description | What Gets Removed |
|-----------|-------------|-------------------|
| `projects` | Project submissions | All 40 demo projects |
| `ballots` | Judge evaluations | All 120 ballots |
| `disputes` | Flagged reviews | All 2 disputes |
| `trust_ledger` | Cryptographic audit trail | All ledger blocks |
| `events` | Hackathon events | All event configs |

**Result:** Database is completely empty, ready for real live data.

---

## 🔄 How to Verify It Worked

### Check the UI:
1. Go to organizer dashboard
2. All metrics should show **0**:
   - Live Teams: **0**
   - Submissions: **0**  
   - Ballots Cast: **0**
   - Review Status: **0%**
   - Disputes: **0**

### Check via API:
```javascript
fetch('http://localhost:4000/database/status')
  .then(r => r.json())
  .then(data => console.log(data));
```

Expected response:
```json
{
  "status": "CONNECTED",
  "collections": {
    "projects": 0,
    "ballots": 0,
    "disputes": 0,
    "trust_ledger": 0
  }
}
```

---

## 🎭 How to Reseed Demo Data (If Needed)

If you want the demo data back for testing:

### Option 1: UI Button
- Click **"Seed Demo"** button (next to Clear button)

### Option 2: API Call
```javascript
fetch('http://localhost:4000/database/reseed', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Reseeded:', data));
```

This will restore:
- 40 demo projects
- 120 ballots
- 2 disputes
- Trust ledger blocks

---

## 🚨 Important Notes

### Before Clearing:
- ⚠️ **This action cannot be undone** (unless you reseed)
- ⚠️ Make sure you don't have real participant data you want to keep
- ✅ Demo/seeded data is safe to delete anytime

### After Clearing:
- ✅ Database is in "clean live mode"
- ✅ Ready to receive real hackathon submissions
- ✅ All dashboards will show 0 until real data comes in
- ✅ You can create new hackathons fresh

### Who Can Clear:
- ✅ **ADMIN** role
- ✅ **ORGANIZER** role
- ❌ Participants and Judges cannot clear

---

## 🐛 Troubleshooting

### "Unable to connect to server"
**Problem**: API is not running  
**Solution**:
```bash
cd apps/api
npm run dev
```

### Button doesn't work / No response
**Problem**: Not logged in as organizer  
**Solution**: Login with organizer or admin account

### "MongoDB not connected"
**Problem**: Database connection issue  
**Solution**: 
1. Check if MongoDB is running: `mongosh` or check services
2. Or app will use in-memory mode (data clears on restart anyway)

### Data still showing after clear
**Problem**: Browser cache  
**Solution**: 
1. Refresh the page (`Ctrl+R` or `F5`)
2. Or hard refresh (`Ctrl+Shift+R`)

---

## 📝 API Endpoint Reference

### Clear Database
```
POST http://localhost:4000/database/clear
```

**Headers**: None required (but auth may be needed)

**Response**:
```json
{
  "success": true,
  "message": "All mock and seeded data wiped. MongoDB is in 100% clean live mode."
}
```

### Check Database Status
```
GET http://localhost:4000/database/status
```

**Response**:
```json
{
  "status": "CONNECTED",
  "database": "dogfood_os",
  "uri": "mongodb://127.0.0.1:27017",
  "collections": {
    "projects": 0,
    "ballots": 0,
    "disputes": 0,
    "trust_ledger": 0
  },
  "serverTime": "2026-09-29T..."
}
```

### Reseed Database
```
POST http://localhost:4000/database/reseed
```

**Response**:
```json
{
  "success": true,
  "message": "Sandbox state seeded for demonstration."
}
```

---

## 💡 Pro Tips

### For Development:
1. **Clear before each test session** - Start with clean slate
2. **Reseed when you need demo data** - For UI testing
3. **Clear again before production** - No demo data in production

### For Production:
1. **Clear all demo data first** - Before real hackathon
2. **Don't reseed in production** - Only real data
3. **Backup real data** - Before clearing (if needed)

### For Testing:
1. **Use reseed liberally** - Great for UI testing
2. **Clear between tests** - Consistent test state
3. **Check status endpoint** - Verify state

---

## 📊 Quick Reference

| Action | UI Button | API Endpoint | Result |
|--------|-----------|--------------|--------|
| **Clear All** | "Clear All Entries 🧹" | `POST /database/clear` | All data removed |
| **Reseed Demo** | "Seed Demo" | `POST /database/reseed` | 40 projects, 120 ballots restored |
| **Check Status** | View dashboard | `GET /database/status` | See counts |
| **Create Fresh** | "⚡ Prompt-to-Hackathon" | `POST /autopilot/synthesize` | New hackathon |

---

## ✅ Success Checklist

After clearing, you should see:

- [ ] Live Teams: **0** (was 40)
- [ ] Submissions: **0** (was 1)
- [ ] Ballots Cast: **0** (was 114)
- [ ] Review Status: **0%** (was 95%)
- [ ] Disputes: **0** (was 2)
- [ ] Success message: "All mock entries wiped!"
- [ ] Dashboard shows clean state
- [ ] Ready for real hackathon data

---

## 🎉 You're Done!

Your database is now completely clean and ready for:
- ✅ Real participant registrations
- ✅ Actual project submissions  
- ✅ Live judge evaluations
- ✅ Production hackathon data

**No more demo data cluttering your dashboard!** 🎊

---

**Last Updated**: 2026-09-29  
**API Version**: v1.0  
**Status**: ✅ Working and tested
