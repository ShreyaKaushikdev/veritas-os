# TESTING GUIDE: Phase 2-3 Implementation
## Public Overview & Authentication Routing

**Date**: September 28, 2026  
**Scope**: Public overview page + authentication routing logic

---

## 🚀 Quick Start

### 1. Start the Development Server
```bash
cd apps/web
npm run dev
```

**Expected Output:**
```
> dogfood-web@0.0.1 dev
> next dev

  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1234ms
```

---

### 2. Access the Application

Open browser to: `http://localhost:3000`

---

## ✅ Test Scenarios

### SCENARIO 1: Unauthenticated User - Public Overview

**Test Steps:**
1. Open new browser tab / private window
2. Clear all cookies and localStorage
3. Navigate to `http://localhost:3000`

**Expected Behavior:**
- ✅ See dark gradient background (Slate 950 → Black)
- ✅ Navbar shows "Sign In" and "Register" buttons (NO user profile)
- ✅ Hero section visible: "Run a fair hackathon at any size"
- ✅ Feature pills visible (50ms, Merkle Chain, Offline Air-Gap, 90s)
- ✅ Tiers section: T1 (required), T2 (where it starts), T3 (locked), T4 (locked)
- ✅ Timeline section: Kickoff → Auth → Judging → Freeze
- ✅ Scoring section: 40/25/20/15% breakdown
- ✅ Prizes section: $800/$500/$350
- ✅ Footer with copyright visible

**How to Clear LocalStorage:**
```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Paste and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### SCENARIO 2: Register as Participant & Auto-Redirect

**Test Steps:**
1. From public overview, click "Register" button
2. Fill registration form:
   - Name: "Test Participant"
   - Email: "participant@example.com"
   - Password: "password123"
   - Role: Select "PARTICIPANT"
3. Click "Register"
4. Wait for form submission to complete

**Expected Behavior:**
- ✅ AuthModal closes
- ✅ Page redirects to `/participant`
- ✅ Participant dashboard (Mission Control) loads
- ✅ Navbar now shows user profile with name and role
- ✅ Logout button visible
- ✅ Layout is full-bleed (no footer)

**Verify in Console:**
```javascript
// Open DevTools Console
JSON.parse(localStorage.getItem('dogfood_user'))
// Should show: { id: "...", name: "Test Participant", email: "participant@example.com", role: "PARTICIPANT" }

localStorage.getItem('dogfood_auth_token')
// Should show: "eyJhbGc..." (JWT token)
```

---

### SCENARIO 3: Login as Existing Participant

**Test Steps:**
1. Navigate to `http://localhost:3000`
2. Click "Sign In"
3. Enter email: "participant@example.com"
4. Enter password: "password123"
5. Click "Sign In"

**Expected Behavior:**
- ✅ AuthModal closes
- ✅ Page automatically redirects to `/participant`
- ✅ Participant dashboard loads
- ✅ See user profile in navbar

**Note:** If you don't have an existing account, use Scenario 2 first

---

### SCENARIO 4: Reload Page While Authenticated

**Test Steps:**
1. Complete Scenario 2 or 3 (be logged in)
2. You should be on `/participant` dashboard
3. Press `F5` or `Cmd+R` to reload page
4. Wait for page to load

**Expected Behavior:**
- ✅ Page loads without errors
- ✅ User still logged in (token still in localStorage)
- ✅ Stays on `/participant` (no redirect loop)
- ✅ Dashboard renders correctly

**Note:** If page redirects, check browser console for errors

---

### SCENARIO 5: Logout & Redirect to Overview

**Test Steps:**
1. Be logged in to any dashboard
2. Click user profile area in navbar
3. Look for "Logout" option
4. Click "Logout"
5. Wait for redirect

**Expected Behavior:**
- ✅ localStorage cleared (token + user removed)
- ✅ Redirected to `/` (public overview)
- ✅ See public overview page again
- ✅ Navbar shows "Sign In" and "Register" again

**Verify in Console:**
```javascript
// After logout
localStorage.getItem('dogfood_user')
// Should show: null

localStorage.getItem('dogfood_auth_token')
// Should show: null
```

---

### SCENARIO 6: Register as Judge with Referral Code

**Test Steps:**
1. Get to public overview (logged out)
2. Click "Register"
3. Fill registration:
   - Name: "Test Judge"
   - Email: "judge@example.com"
   - Password: "password123"
   - Role: Select "JUDGE"
   - Judge Referral Code: Enter a valid code (get from organizer)
4. Click "Register"

**Expected Behavior:**
- ✅ If code is valid:
  - ✅ Registration succeeds
  - ✅ Redirects to `/judge-cockpit`
  - ✅ Navbar shows judge profile
  
- ⚠️ If code is invalid:
  - ✅ Shows error: "Invalid judge referral code"
  - ✅ Form doesn't submit
  - ✅ Stays on registration modal

**Verify in Console:**
```javascript
JSON.parse(localStorage.getItem('dogfood_user')).role
// Should show: "JUDGE"
```

---

### SCENARIO 7: Register as Organizer

**Test Steps:**
1. Get to public overview (logged out)
2. Click "Register"
3. Fill registration:
   - Name: "Test Organizer"
   - Email: "organizer@example.com"
   - Password: "password123"
   - Role: Select "ORGANIZER"
4. Click "Register"

**Expected Behavior:**
- ✅ Registration succeeds (no referral code needed)
- ✅ Redirects to `/organizer`
- ✅ Control Tower dashboard loads
- ✅ Navbar shows organizer profile

---

### SCENARIO 8: Register as Admin

**Test Steps:**
1. Get to public overview (logged out)
2. Click "Register"
3. Fill registration:
   - Name: "Test Admin"
   - Email: "admin@example.com"
   - Password: "password123"
   - Role: Select "ADMIN"
4. Click "Register"

**Expected Behavior:**
- ✅ Registration succeeds
- ✅ Redirects to `/dashboard`
- ✅ Admin console loads
- ✅ Navbar shows admin profile

---

### SCENARIO 9: Mobile Responsiveness - Public Overview

**Test Steps:**
1. Open public overview on desktop
2. Open DevTools (F12)
3. Click device toolbar icon
4. Select "iPhone 12" (or Mobile)
5. Scroll through page

**Expected Behavior:**
- ✅ Navbar is responsive (mobile menu works)
- ✅ Hero text is readable (not cut off)
- ✅ Feature pills stack vertically (1 column on mobile)
- ✅ Tier cards stack vertically
- ✅ Timeline cards stack vertically
- ✅ Buttons are touch-friendly (large tap targets)
- ✅ No horizontal scroll

**Viewport Sizes to Test:**
- iPhone 12: 390px
- Tablet: 768px
- Desktop: 1280px+

---

### SCENARIO 10: Test Different Public Routes

**Test Steps:**
1. Navigate to public override page (logged out)
2. Try each public route:
   - `http://localhost:3000/` ✅ Should load
   - `http://localhost:3000/story` ✅ Should load
   - `http://localhost:3000/verify` ✅ Should load
   - `http://localhost:3000/gallery` ✅ Should load
3. Verify each page loads correctly

**Expected Behavior:**
- ✅ All routes load successfully
- ✅ Navbar visible on all pages
- ✅ No error messages
- ✅ SOS beacon visible

---

### SCENARIO 11: Test Dashboard Routes (Authenticated Only)

**Test Steps:**
1. Be logged in as PARTICIPANT
2. Try to navigate to organizer route:
   - `http://localhost:3000/organizer`

**Expected Behavior:**
- ⚠️ Option A: Route loads (no backend check)
   - This is OK - backend enforces actual access
   - Frontend just handles visibility
   
- ✅ Option B: Route shows "Unauthorized" or redirects
   - This is better UX

**Note:** This is a frontend routing test. Backend MUST enforce actual RBAC.

---

## 🔍 Browser Console Checks

### Check Authentication State
```javascript
// Check user in localStorage
const user = JSON.parse(localStorage.getItem('dogfood_user'));
console.log('User:', user);
// Should show: { id: "...", name: "...", email: "...", role: "..." }

// Check token
const token = localStorage.getItem('dogfood_auth_token');
console.log('Token exists:', !!token);
// Should show: true or false
```

### Check Current Route
```javascript
console.log('Current route:', window.location.pathname);
// Should show: "/" or "/participant" or "/judge-cockpit", etc.
```

### Check for Errors
```javascript
// Open DevTools Console
// Should see NO red error messages
// Search for console errors: Type 'error' in filter
```

---

## 📊 Expected Behaviors By Route

| Route | Unauthenticated | Authenticated (PARTICIPANT) | Authenticated (JUDGE) |
|-------|-----------------|----------------------------|-----------------------|
| `/` | Show overview | Redirect to `/participant` | Redirect to `/judge-cockpit` |
| `/story` | Show story | Show story | Show story |
| `/verify` | Show verify | Show verify | Show verify |
| `/gallery` | Show gallery | Show gallery | Show gallery |
| `/participant` | ❌ Error/Redirect | ✅ Load dashboard | ✅ Load (but maybe not own) |
| `/judge-cockpit` | ❌ Error/Redirect | ❌ Error/Redirect | ✅ Load dashboard |
| `/organizer` | ❌ Error/Redirect | ❌ Error/Redirect | ❌ Error/Redirect |
| `/admin` | ❌ Error/Redirect | ❌ Error/Redirect | ❌ Error/Redirect |

---

## 🐛 Troubleshooting

### Issue: Page stuck on loading
**Solution:**
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify API server is running (`npm run dev` in `apps/api`)
4. Clear browser cache: `Cmd+Shift+Delete` (Chrome)

### Issue: Redirect loop (keeps redirecting)
**Solution:**
1. Check localStorage - look for infinite user/token state
2. Clear localStorage: `localStorage.clear(); location.reload();`
3. Check `getDefaultRoute()` function in `rbac.ts`
4. Check `LayoutShell.tsx` useEffect dependencies

### Issue: Navbar not showing user profile
**Solution:**
1. Verify token in localStorage exists
2. Verify user object in localStorage is valid JSON
3. Check browser console for parsing errors
4. Clear and re-login

### Issue: Can't register as JUDGE
**Solution:**
1. Verify you have a valid judge referral code
2. Check error message displayed
3. If code invalid - ask organizer to generate new one
4. Check browser console for API errors

### Issue: Mobile view doesn't work
**Solution:**
1. Close DevTools mobile emulator
2. Refresh page
3. Re-open DevTools and select mobile device
4. Check for CSS media query issues in page.tsx

---

## ✅ Sign-Off Checklist

Before considering Phase 2-3 complete, verify:

- [ ] Public overview loads on `/`
- [ ] Hero section, tiers, timeline, scoring visible
- [ ] Feature pills display correctly
- [ ] Prize section shows $800/$500/$350
- [ ] Register button opens AuthModal
- [ ] Can register as PARTICIPANT
- [ ] Can register as JUDGE with referral code
- [ ] Can register as ORGANIZER
- [ ] Can register as ADMIN
- [ ] Auto-redirect works for all roles
- [ ] Auto-redirect to correct dashboard
- [ ] Logout redirects back to `/`
- [ ] Public routes (`/story`, `/verify`, `/gallery`) load
- [ ] Mobile view is responsive
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Navbar shows/hides auth buttons correctly

---

## 📝 Test Report Template

Use this template to document your testing:

```markdown
## Test Session Report

**Date**: [Date]  
**Tester**: [Name]  
**Environment**: [Dev/Staging/Prod]  

### Scenarios Tested
- [ ] Scenario 1: Unauthenticated overview
- [ ] Scenario 2: Register as Participant
- [ ] Scenario 3: Login as Participant
- [ ] Scenario 4: Reload while authenticated
- [ ] Scenario 5: Logout
- [ ] Scenario 6: Register as Judge
- [ ] Scenario 7: Register as Organizer
- [ ] Scenario 8: Register as Admin
- [ ] Scenario 9: Mobile responsiveness
- [ ] Scenario 10: Public routes
- [ ] Scenario 11: Dashboard routes

### Issues Found
1. [Issue description]
   - Expected: [what should happen]
   - Actual: [what actually happened]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce: [steps]

### Browser & Device
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [version]
- OS: [Windows/Mac/Linux]
- Device: [Desktop/Mobile/Tablet]

### Notes
[Any additional notes or observations]
```

---

## 🎯 Performance Expectations

**Expected Load Times:**
- Public overview: < 2 seconds
- Dashboard redirect: < 1 second
- Modal open: < 500ms
- Page refresh: < 3 seconds

**If slower:**
1. Check network tab for slow API calls
2. Check DevTools Performance tab
3. Look for 3D component delays
4. Check for unoptimized images

---

## 📞 Support & Questions

If you encounter issues not covered here:

1. Check `PHASE_2_IMPLEMENTATION_COMPLETE.md`
2. Check `IMPLEMENTATION_STATUS.md`
3. Review code in `apps/web/src/app/page.tsx`
4. Review code in `apps/web/src/components/LayoutShell.tsx`
5. Check `apps/web/src/lib/rbac.ts` for RBAC logic

---

**Happy Testing! 🚀**

*Document prepared: September 28, 2026*
