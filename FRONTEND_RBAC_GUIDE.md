# 🎨 Frontend RBAC Implementation Guide

## Overview

Frontend RBAC complements the backend security by hiding unauthorized UI elements. This provides a better user experience and prevents confusion.

**Important:** Frontend RBAC is for **UX only**. Never rely on it for security. Always enforce permissions on the backend API.

---

## ✅ What Was Fixed

### Problem
Your participant user was seeing the "Judge (J/K)" link in the navigation, even though they shouldn't have access to judge features.

### Solution
1. ✅ **Updated Navbar.tsx** - Added role-based navigation filtering
2. ✅ **Created rbac.ts** - Frontend RBAC utilities
3. ✅ **Created RoleGuard.tsx** - React components for role-based rendering

---

## 🔧 How It Works Now

### Navigation Filtering

**Before (WRONG):**
```typescript
const navLinks = [
  { href: '/judge', label: 'Judge (J/K)' }, // Shown to everyone ❌
];
```

**After (CORRECT):**
```typescript
const navLinks = [
  { href: '/judge', label: 'Judge (J/K)', roles: ['JUDGE', 'ORGANIZER', 'ADMIN'] },
].filter(link => link.roles.includes(userRole)); // Filtered by role ✅
```

Now:
- **PARTICIPANT** sees: Overview, Story, Idea Coach, Trust Ledger
- **JUDGE** sees: Overview, Story, Ballots, Judge (J/K), Trust Ledger
- **ORGANIZER** sees: All navigation items

---

## 📚 Usage Guide

### 1. Using RoleGuard Component

Wrap any component that should only be visible to certain roles:

```tsx
import { RoleGuard, JudgeOnly, ParticipantOnly } from '@/components/RoleGuard';

// Example 1: Show only to judges
<JudgeOnly>
  <BallotForm />
</JudgeOnly>

// Example 2: Show only to participants
<ParticipantOnly>
  <TeamCreationForm />
</ParticipantOnly>

// Example 3: Multiple roles
<RoleGuard allowedRoles={['JUDGE', 'ORGANIZER']}>
  <JudgingDashboard />
</RoleGuard>

// Example 4: Permission-based
<RoleGuard requiredPermission="VIEW_ANALYTICS">
  <AnalyticsDashboard />
</RoleGuard>

// Example 5: Show unauthorized message
<RoleGuard 
  allowedRoles={['ORGANIZER']} 
  showUnauthorized={true}
>
  <OrganizerPanel />
</RoleGuard>
```

### 2. Using RBAC Utilities

```typescript
import { hasPermission, hasRole, getCurrentUser, canAccessRoute } from '@/lib/rbac';

// Check permission
if (hasPermission(user.role, 'VIEW_BALLOTS')) {
  // Show ballots UI
}

// Check role
if (hasRole(user.role, ['JUDGE', 'ORGANIZER'])) {
  // Show judge-specific features
}

// Check route access
if (canAccessRoute('/judge', user.role)) {
  router.push('/judge');
} else {
  router.push('/'); // Redirect to home
}

// Get current user
const user = getCurrentUser();
if (user?.role === 'PARTICIPANT') {
  // Participant-specific logic
}
```

### 3. Conditional Rendering Examples

```tsx
import { ShowForRole, HideForRole } from '@/components/RoleGuard';

// Show button only for participants
<ShowForRole roles={['PARTICIPANT']}>
  <button>Create Team</button>
</ShowForRole>

// Hide team info from judges
<HideForRole roles={['JUDGE']}>
  <TeamMembersList />
</HideForRole>

// Conditional content
<div>
  <ShowForRole roles={['PARTICIPANT']}>
    <h2>Your Teams</h2>
  </ShowForRole>
  
  <ShowForRole roles={['JUDGE']}>
    <h2>Assigned Projects</h2>
  </ShowForRole>
  
  <ShowForRole roles={['ORGANIZER']}>
    <h2>All Projects</h2>
  </ShowForRole>
</div>
```

### 4. Navigation with Role Filtering

```tsx
import { getNavigationForRole } from '@/lib/rbac';

function MyNavbar() {
  const user = getCurrentUser();
  const navItems = getNavigationForRole(user?.role);

  return (
    <nav>
      {navItems.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 🎯 Role-Specific UI Patterns

### Participant Dashboard
```tsx
function ParticipantDashboard() {
  return (
    <div>
      <h1>Participant Dashboard</h1>
      
      {/* Participants CAN see */}
      <ParticipantOnly>
        <TeamSection />
        <ProjectSubmissionForm />
        <IdeaCoach />
      </ParticipantOnly>

      {/* Participants CANNOT see */}
      <JudgeOnly>
        <p>This is hidden from participants</p>
      </JudgeOnly>
    </div>
  );
}
```

### Judge Dashboard
```tsx
function JudgeDashboard() {
  return (
    <div>
      <h1>Judge Dashboard</h1>
      
      {/* Judges CAN see */}
      <JudgeOnly>
        <AssignedProjectsList />
        <BallotForm />
      </JudgeOnly>

      {/* Judges CANNOT see (team info hidden) */}
      <HideForRole roles={['JUDGE']}>
        <TeamMembersList />
        <TeamChatChannel />
      </HideForRole>
    </div>
  );
}
```

### Organizer Dashboard
```tsx
function OrganizerDashboard() {
  return (
    <div>
      <h1>Organizer Dashboard</h1>
      
      {/* Organizers CAN see everything */}
      <OrganizerOnly>
        <EventAnalytics />
        <AllProjects />
        <AllBallots />
        <JudgeAssignments />
        <ResultsPublisher />
      </OrganizerOnly>
    </div>
  );
}
```

---

## 🛡️ Security Best Practices

### ❌ DON'T: Rely on Frontend for Security

```tsx
// ❌ BAD - No backend verification
function DeleteButton() {
  return (
    <OrganizerOnly>
      <button onClick={() => deleteProject()}>Delete</button>
    </OrganizerOnly>
  );
}
```

### ✅ DO: Always Verify on Backend

```tsx
// ✅ GOOD - Frontend + Backend protection
function DeleteButton() {
  const handleDelete = async () => {
    try {
      // Backend will verify permissions
      await api.delete('/projects/123');
    } catch (error) {
      if (error.status === 403) {
        alert('Access denied');
      }
    }
  };

  return (
    <OrganizerOnly>
      <button onClick={handleDelete}>Delete</button>
    </OrganizerOnly>
  );
}
```

### Backend API Protection (Required)

```typescript
// Backend API endpoint MUST have guards
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.PROJECT_DELETE_OWN)
@Delete(':id')
async deleteProject(@Param('id') id: string) {
  // Permission verified on backend ✅
  return this.projectsService.delete(id);
}
```

---

## 📋 Common Patterns

### Pattern 1: Conditional Actions

```tsx
import { hasPermission, getCurrentUser } from '@/lib/rbac';

function ProjectCard({ project }) {
  const user = getCurrentUser();
  const canEdit = hasPermission(user?.role, 'VIEW_OWN_PROJECTS');
  const canDelete = user?.role === 'ORGANIZER';

  return (
    <div>
      <h3>{project.title}</h3>
      
      {canEdit && (
        <button>Edit</button>
      )}
      
      {canDelete && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

### Pattern 2: Dynamic Content Based on Role

```tsx
function DashboardHeader() {
  const user = getCurrentUser();

  const getTitleForRole = () => {
    switch (user?.role) {
      case 'PARTICIPANT':
        return 'Your Projects';
      case 'JUDGE':
        return 'Assigned Projects';
      case 'ORGANIZER':
        return 'All Projects';
      default:
        return 'Projects';
    }
  };

  return <h1>{getTitleForRole()}</h1>;
}
```

### Pattern 3: Feature Flags

```tsx
function FeatureSection() {
  const user = getCurrentUser();

  return (
    <div>
      <ShowForRole roles={['PARTICIPANT']}>
        <IdeaCoachFeature />
      </ShowForRole>

      <ShowForRole roles={['JUDGE']}>
        <PairwiseDuelsFeature />
      </ShowForRole>

      <ShowForRole roles={['ORGANIZER']}>
        <AnalyticsFeature />
        <AssignmentManagement />
      </ShowForRole>
    </div>
  );
}
```

### Pattern 4: Route Protection

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessRoute, getCurrentUser, getDefaultRoute } from '@/lib/rbac';

export default function JudgePage() {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    if (!canAccessRoute('/judge', user?.role)) {
      // Redirect to appropriate page
      const defaultRoute = user?.role ? getDefaultRoute(user.role) : '/';
      router.push(defaultRoute);
    }
  }, [user, router]);

  if (!canAccessRoute('/judge', user?.role)) {
    return <div>Redirecting...</div>;
  }

  return (
    <div>
      {/* Judge page content */}
    </div>
  );
}
```

---

## 🎨 Styling Role-Based Elements

```tsx
import { getRoleColor, getRoleBadge } from '@/lib/rbac';

function UserBadge({ user }) {
  const color = getRoleColor(user.role);
  const badge = getRoleBadge(user.role);

  return (
    <span className={`px-2 py-1 rounded-full bg-${color}-50 text-${color}-800 border border-${color}-200`}>
      {badge} - {user.role}
    </span>
  );
}
```

---

## 📊 Data Visibility Matrix

Use the `DATA_VISIBILITY` helpers to check what data can be shown:

```tsx
import { DATA_VISIBILITY, getCurrentUser } from '@/lib/rbac';

function ProjectDetails({ project }) {
  const user = getCurrentUser();
  const role = user?.role;

  return (
    <div>
      <h2>{project.title}</h2>
      
      {/* Show team info only if user's role allows it */}
      {DATA_VISIBILITY.canSeeTeamInfo(role) && (
        <div>
          <h3>Team: {project.team.name}</h3>
          <p>Members: {project.team.members.join(', ')}</p>
        </div>
      )}

      {/* Judges should NOT see team info (blind judging) */}
      {!DATA_VISIBILITY.canSeeTeamInfo(role) && (
        <p className="text-sm text-gray-500">
          Team information hidden for fair judging
        </p>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Frontend RBAC

### Manual Testing

1. **Test as Participant:**
   - Login as participant
   - Verify you CANNOT see: Judge link, Ballots, Organizer panel
   - Verify you CAN see: Idea Coach, Your teams, Your projects

2. **Test as Judge:**
   - Login as judge
   - Verify you CANNOT see: Team info, Team chat, Participant panel
   - Verify you CAN see: Ballots, Assigned projects only, Judge panel

3. **Test as Organizer:**
   - Login as organizer
   - Verify you CAN see: All panels, All data, Analytics

### Testing Checklist

```
PARTICIPANT:
- [ ] Cannot see Judge link in nav
- [ ] Cannot see Ballots link in nav
- [ ] Cannot see Organizer link in nav
- [ ] Can see Idea Coach link
- [ ] Can create teams
- [ ] Can view own projects
- [ ] Cannot see judge assignments

JUDGE:
- [ ] Cannot see Participant link in nav
- [ ] Cannot see team information
- [ ] Cannot see team chat
- [ ] Can see Ballots link
- [ ] Can see Judge link
- [ ] Can view assigned projects only
- [ ] Can create ballots

ORGANIZER:
- [ ] Can see all navigation links
- [ ] Can view all projects
- [ ] Can view all ballots
- [ ] Can view analytics
- [ ] Can manage assignments
- [ ] Can publish results
```

---

## 🔄 Migration Checklist

To add frontend RBAC to existing pages:

1. **Import RBAC utilities:**
   ```tsx
   import { RoleGuard, JudgeOnly, ParticipantOnly } from '@/components/RoleGuard';
   import { hasPermission, getCurrentUser } from '@/lib/rbac';
   ```

2. **Wrap role-specific sections:**
   ```tsx
   <ParticipantOnly>
     {/* Participant-only content */}
   </ParticipantOnly>
   ```

3. **Add route protection:**
   ```tsx
   useEffect(() => {
     if (!canAccessRoute(pathname, user?.role)) {
       router.push('/');
     }
   }, [pathname, user]);
   ```

4. **Filter data in lists:**
   ```tsx
   const visibleProjects = projects.filter(p => 
     canViewProject(p, user?.role)
   );
   ```

---

## 🚨 Common Mistakes

### Mistake 1: Forgetting Backend Protection
```tsx
// ❌ WRONG - Only frontend check
<OrganizerOnly>
  <button onClick={deleteProject}>Delete</button>
</OrganizerOnly>
```

```tsx
// ✅ CORRECT - Frontend + Backend
<OrganizerOnly>
  <button onClick={async () => {
    // Backend verifies permission
    await api.delete('/projects/123');
  }}>Delete</button>
</OrganizerOnly>
```

### Mistake 2: Not Handling Undefined User
```tsx
// ❌ WRONG - Can crash
if (user.role === 'JUDGE') { }

// ✅ CORRECT - Safe check
if (user?.role === 'JUDGE') { }
```

### Mistake 3: Hardcoding Role Checks
```tsx
// ❌ WRONG - Hard to maintain
if (user.role === 'JUDGE' || user.role === 'ORGANIZER') { }

// ✅ CORRECT - Use utility
if (hasRole(user?.role, ['JUDGE', 'ORGANIZER'])) { }
```

---

## ✅ Summary

Your frontend now has:

1. ✅ **Role-based navigation filtering** - Users only see links they can access
2. ✅ **RoleGuard components** - Easy conditional rendering
3. ✅ **RBAC utilities** - Permission and role checking functions
4. ✅ **Data visibility helpers** - Know what to show/hide

**Remember:** Frontend RBAC is for UX. Always enforce security on the backend!

---

## 📖 Quick Reference

### Components
- `<RoleGuard allowedRoles={['JUDGE']}>` - General guard
- `<ParticipantOnly>` - Participant content
- `<JudgeOnly>` - Judge content
- `<OrganizerOnly>` - Organizer content
- `<ShowForRole roles={[...]}>` - Show for roles
- `<HideForRole roles={[...]}>` - Hide for roles

### Functions
- `hasPermission(role, permission)` - Check permission
- `hasRole(role, allowedRoles)` - Check role
- `canAccessRoute(route, role)` - Check route access
- `getCurrentUser()` - Get logged-in user
- `getNavigationForRole(role)` - Get nav items

### Data Visibility
- `DATA_VISIBILITY.canSeeTeamInfo(role)`
- `DATA_VISIBILITY.canSeeBallots(role)`
- `DATA_VISIBILITY.canSeeAllProjects(role)`

Your navigation is now properly secured! 🎉
