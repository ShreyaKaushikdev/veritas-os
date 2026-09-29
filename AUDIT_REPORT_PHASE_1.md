# PHASE 1: AUDIT REPORT - DOGFOOD OS REDESIGN

## Executive Summary
The existing DOGFOOD OS application has solid foundations with proper RBAC implementation, role-specific dashboards, and backend integration. The main issue is **poor separation between public overview and authenticated dashboards at the routing level**.

---

## EXISTING ARCHITECTURE

### ✅ Strengths

#### 1. **RBAC System (Complete & Well-Implemented)**
- Location: `apps/web/src/lib/rbac.ts`
- Roles: VISITOR, PARTICIPANT, JUDGE, ORGANIZER, ADMIN
- Permission system with UI_PERMISSIONS matrix
- `canAccessRoute()`, `hasPermission()`, `hasRole()` utilities
- Role colors and descriptions defined
- Data visibility matrix for different roles

#### 2. **Authentication System (Functional)**
- localStorage with keys: `dogfood_user`, `dogfood_auth_token`
- User object: `{ id, name, email, role }`
- Auth flows in components: AuthModal, CreateHackathonModal, Navbar
- Logout functionality exists
- Token handling for API calls

#### 3. **Existing Role-Specific Dashboards**
- **Participant**: `/participant` - Team creation, project submission, idea coach
- **Judge**: `/judge-cockpit` - Assignment queue, evaluation, calibration
- **Organizer**: `/organizer` - Event management, create-event, participants, projects
- **Admin**: `/admin/test-data` - Test data generation

#### 4. **Story/Marketing Page**
- Location: `/story` - Good storytelling with 3D scenes
- Contains: IntegrityChainScene, DefensiblePodiumScene
- Uses scroll-triggered animations
- But: Accessible to all users (not just public)

#### 5. **3D Infrastructure**
- React Three Fiber + Drei already installed
- Existing scenes:
  - PotentialRadarScene (participant)
  - IntegrityChainScene (story)
  - DefensiblePodiumScene (story)
  - ChaosLines animations

#### 6. **Layout Shell (LayoutShell.tsx)**
- Handles different layouts based on pathname
- Dashboard, landing, default layouts
- Navbar and SOSBeacon integration

---

## CURRENT PROBLEMS

### ❌ Issue 1: No Clean Entry Point
- `/` (page.tsx) currently shows "PersonalizedDashboard" even for unauthenticated users
- Mixes public marketing with private dashboards
- No distinction between public exploration and authenticated experience

### ❌ Issue 2: Routing Confusion
- Routes exist but not organized by auth boundary
- No protected route layer
- `/participant`, `/judge`, `/organizer` all directly accessible
- `/story` shows to both public and authenticated users

### ❌ Issue 3: Navigation is Role-Agnostic
- Navbar shows same links for everyone
- No distinction between public and authenticated navigation
- Role-based nav items exist in RBAC but not used in LayoutShell

### ❌ Issue 4: Public vs Private Content Not Separated
- Story page mixes public storytelling with marketing
- No dedicated "public overview" page
- No "explore role experiences" section without logging in

---

## EXISTING ROUTES INVENTORY

```
/                          ← Current home (confusing mix)
/auth/login               ← Auth modal (basic)
/auth/callback            ← OAuth callback
/story                    ← Storytelling (public but no clear boundary)
/verify                   ← Public verification (correct usage)
/gallery                  ← Public gallery (correct usage)
/dashboard                ← Executive dashboard (admin?)

/participant              ← Mission Control ✅
/judge                    ← Judge redirect page
/judge-cockpit            ← Judge home ✅
/judge-cockpit/assignments
/judge-cockpit/calibration
/judge-cockpit/evaluate/[projectId]

/organizer                ← Organizer home ✅
/organizer/command-center
/organizer/participants
/organizer/projects
/organizer/create-event

/admin/test-data          ← Test data generation ✅
```

---

## EXISTING COMPONENTS TO REUSE

### Navigation
- Navbar.tsx - Role switching, logout, persona management
- LayoutShell.tsx - Layout routing logic

### Authentication
- AuthModal.tsx - Login/register (already handles judge referral codes!)
- RoleGuard.tsx - Permission-based rendering

### 3D Scenes
- IntegrityChainScene.tsx - Hash chain visualization
- DefensiblePodiumScene.tsx - Ranking results
- PotentialRadarScene.tsx - Participant potential

### Existing Dashboards (KEEP INTACT)
- ParticipantMissionControl (/participant)
- JudgeCockpit (/judge-cockpit)
- OrganizerControlTower (/organizer)
- AdminConsole (/admin)

### Utilities
- rbac.ts - Complete RBAC system
- API integration (teams, events, submissions, intelligence)

---

## EXISTING DATA STRUCTURE

### User Object
```typescript
{
  id: string;
  name: string;
  email: string;
  role: "VISITOR" | "PARTICIPANT" | "JUDGE" | "ORGANIZER" | "ADMIN";
}
```

### Event Data (from API)
```typescript
{
  id: string;
  name: string;
  slug: string;
  status: string;
  tracks: Array<{ id, name, description }>;
  prizes: Array<{ id, title, amount }>;
  submissionDeadline: string;
  judgeDeadline: string;
}
```

---

## BACKEND INTEGRATION POINTS

### Endpoints Already Being Used
- `GET /api/v1/events` - List events
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/teams` - List teams
- `POST /api/v1/submissions` - Create submission
- `GET /api/v1/ballots` - Get ballots (judge)
- `POST /api/v1/rankings` - Publish rankings

### Real Data Available
- Live projects from backend
- Judge assignments
- Submission status
- Ballots and scores
- Rankings

---

## DESIGN SYSTEM

### Colors
- **Participant**: Teal/Emerald
- **Judge**: Green/Emerald
- **Organizer**: Amber/Gold
- **Admin**: Red
- **Accent**: Slate/Dark

### Typography
- Base: Slate family
- Mono: `font-mono` for technical elements
- Large headings for hierarchy

### Spacing & Layout
- Max-width containers (7xl)
- Padding: 4-8 units standard
- Gap: 6 units between sections
- Border radius: lg/xl

---

## RECOMMENDED IMPLEMENTATION STRATEGY

### Phase 2: DESIGN NEW STRUCTURE

**New Route Hierarchy:**
```
/                              ← PUBLIC OVERVIEW (new)
├─ /explore/participant        ← Role preview (new)
├─ /explore/judge              ← Role preview (new)
├─ /explore/organizer          ← Role preview (new)
├─ /story                       ← Public storytelling (move here)
├─ /gallery                     ← Public projects (already correct)
└─ /verify                      ← Public verification (already correct)

/app                           ← AUTHENTICATED BOUNDARY
├─ /app/participant            ← Mission Control (existing /participant)
├─ /app/judge-cockpit          ← Judge home (existing /judge-cockpit)
├─ /app/organizer              ← Control Tower (existing /organizer)
└─ /app/admin                  ← Admin console (existing /admin)

/auth
├─ /auth/login                 ← Auth modal
└─ /auth/register              ← Register modal
```

### Phase 3: CREATE NEW PUBLIC OVERVIEW PAGE

**File**: `apps/web/src/app/page.tsx` (complete redesign)

Components:
1. Hero section
2. Problem/Solution storytelling
3. Three role cards (PARTICIPANT, JUDGE, ORGANIZER)
4. Interactive role switcher
5. Hackathon lifecycle timeline
6. Integrity story section
7. Product architecture section
8. Public project gallery
9. FAQ
10. Final CTA

### Phase 4: CREATE ROOT ROUTING LOGIC

**File**: `apps/web/src/app/layout.tsx` (enhance)

Add:
- Auth check at root level
- Redirect authenticated users away from public overview
- Route to role-specific dashboard

### Phase 5: REORGANIZE AUTHENTICATED ROUTES

**New Folder**: `apps/web/src/app/(authenticated)/`

Move:
- `/participant` → `/(authenticated)/participant`
- `/judge-cockpit` → `/(authenticated)/judge-cockpit`
- `/organizer` → `/(authenticated)/organizer`
- `/admin` → `/(authenticated)/admin`

### Phase 6: CREATE ROLE-SPECIFIC NAVIGATION

**File**: `apps/web/src/components/AuthenticatedNavbar.tsx` (new)

Features:
- RBAC-based menu items (participant, judge, organizer, admin)
- User profile dropdown
- Logout button
- Role-specific notifications

---

## COMPONENTS TO CREATE

| Component | Purpose | Status |
|-----------|---------|--------|
| PublicOverview | Main landing page | NEW |
| ParticipantPreview | Explore participant experience | NEW |
| JudgePreview | Explore judge experience | NEW |
| OrganizerPreview | Explore organizer experience | NEW |
| RoleExperienceSwitcher | Interactive tabs for previews | NEW |
| HackathonLifecycle | Timeline visualization | NEW |
| IntegrityStory | Cryptographic commitment storytelling | NEW |
| PublicProjectGallery | Projects with real data | REUSE (from /gallery) |
| AuthenticatedNavbar | Role-based navigation | NEW |
| AppLayout | Authenticated layout shell | NEW |

---

## TESTING CHECKLIST

### Before Redesign
- [ ] Test participant dashboard loads correctly
- [ ] Test judge cockpit loads correctly
- [ ] Test organizer control tower loads correctly
- [ ] Test admin console loads correctly
- [ ] Test auth modal works
- [ ] Test RBAC guards work

### After Redesign (Phase 2-6)
- [ ] Unauthenticated users see only public overview
- [ ] Authenticated users never see public overview as primary
- [ ] `/` routes authenticated user to role-specific dashboard
- [ ] Navigation is role-specific
- [ ] All existing dashboards still work
- [ ] 3D scenes load properly
- [ ] Real data from APIs displays
- [ ] RBAC permissions enforced

---

## DATA NO TO FABRICATE

❌ DO NOT CREATE:
- Fake project counts
- Fake judge scores
- Fake registration numbers
- Fake testimonials
- Fake performance metrics

✅ USE ONLY:
- Real API data
- Spec information from DOGFOOD OS brief
- Actual capabilities from the code

---

## FILES NOT TO MODIFY (YET)

- Backend API (no changes needed)
- Database models (schema already complete)
- Existing role dashboards (keep working as-is)
- RBAC utility (keep as foundation)
- 3D scenes (can enhance but don't break)

---

## FILES TO CREATE/MODIFY

### NEW FILES
1. `apps/web/src/app/page.tsx` - Public overview (complete rewrite)
2. `apps/web/src/app/(public)/layout.tsx` - Public layout
3. `apps/web/src/app/(public)/explore/[role]/page.tsx` - Role explore pages
4. `apps/web/src/app/(authenticated)/layout.tsx` - Auth layout
5. `apps/web/src/components/PublicOverview/Hero.tsx`
6. `apps/web/src/components/PublicOverview/ProblemStory.tsx`
7. `apps/web/src/components/PublicOverview/RoleCards.tsx`
8. `apps/web/src/components/PublicOverview/LifecycleStory.tsx`
9. `apps/web/src/components/PublicOverview/IntegrityStory.tsx`
10. `apps/web/src/components/PublicOverview/FAQ.tsx`
11. `apps/web/src/components/AuthenticatedNavbar.tsx`

### MODIFY FILES
1. `apps/web/src/app/layout.tsx` - Add root auth logic
2. `apps/web/src/components/LayoutShell.tsx` - Enhance layout routing

### MOVE FILES (Via File Operations)
1. `/participant` → `/(authenticated)/participant`
2. `/judge-cockpit` → `/(authenticated)/judge-cockpit`
3. `/organizer` → `/(authenticated)/organizer`
4. `/admin` → `/(authenticated)/admin`

---

## ESTIMATED EFFORT

- Public Overview Page: 4-6 hours
- Root Routing Logic: 1 hour
- Reorganize Routes: 30 minutes
- Role Navigation: 1-2 hours
- Testing: 1-2 hours
- **Total: 7-12 hours**

---

## NEXT STEPS

Proceed to **PHASE 2: DESIGN** when ready.

All audit findings are accurate and ready for implementation.

