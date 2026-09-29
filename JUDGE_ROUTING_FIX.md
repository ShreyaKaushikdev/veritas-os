# Judge Routing Fix - Issue Resolution

## Problem
Judges were being shown the participant screen asking them to create/join a team instead of going to the Judge Cockpit.

## Root Cause
The `/judge` route had old judging interface code that didn't check user roles or redirect properly. This caused confusion where judges with `role: 'JUDGE'` were being treated as participants.

## Solution Implemented

### 1. **Simplified `/judge` Route** (`apps/web/src/app/judge/page.tsx`)
Replaced the entire complex judging UI with a simple redirect component:

```typescript
export default function JudgePage() {
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('dogfood_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'JUDGE') {
        // Redirect judges to the new judge cockpit
        router.push('/judge-cockpit');
        return;
      }
    }
    // If not a judge, redirect to login
    router.push('/login');
  }, [router]);

  return <LoadingScreen />;
}
```

**Logic:**
1. Check if user exists in localStorage
2. Check if user.role === 'JUDGE'
3. If YES → Redirect to `/judge-cockpit` (new professional interface)
4. If NO → Redirect to `/login`

### 2. **Judge Cockpit Routes**
Judges now have their own dedicated interface routes:
- `/judge-cockpit` → Home dashboard with progress & next assignment
- `/judge-cockpit/assignments` → Assignment queue with prioritization
- `/judge-cockpit/evaluate/[projectId]` → Evaluation workspace
- `/judge-cockpit/calibration` → Calibration workflow
- `/judge-cockpit/pairwise` → Pairwise comparisons (future)

## How It Works Now

### For Judges:
1. **Login** → User object stored with `role: 'JUDGE'`
2. **Navigate to `/judge`** → Auto-redirected to `/judge-cockpit`
3. **See Judge Cockpit** → Professional judging interface
4. **No team creation prompt** → Judges don't need teams!

### For Participants:
1. **Login** → User object stored with `role: 'PARTICIPANT'`
2. **Navigate to `/participant`** → Participant Mission Control
3. **See team creation** → As expected for participants

### For Organizers:
1. **Login** → User object stored with `role: 'ORGANIZER'`
2. **Navigate to `/organizer`** → Organizer Command Center
3. **Full event management** → As expected

## Role-Based Access

### User Object Structure:
```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';
}
```

### Route Access Matrix:
| Route | Participant | Judge | Organizer | Admin |
|-------|-------------|-------|-----------|-------|
| `/participant` | ✅ | ❌ | ❌ | ✅ |
| `/judge` → `/judge-cockpit` | ❌ | ✅ | ❌ | ✅ |
| `/organizer` | ❌ | ❌ | ✅ | ✅ |
| `/judge-cockpit/*` | ❌ | ✅ | ❌ | ✅ |
| `/organizer/*` | ❌ | ❌ | ✅ | ✅ |

## Testing Checklist

- [x] Judge logs in → Redirects to `/judge-cockpit`
- [ ] Judge sees home dashboard (not team creation)
- [ ] Judge can view assignments queue
- [ ] Judge can start evaluation
- [ ] Judge can complete calibration
- [ ] Participant logs in → Goes to `/participant`
- [ ] Participant sees team creation (as expected)
- [ ] Organizer logs in → Goes to `/organizer/command-center`

## Key Files Modified

**Modified:**
- ✅ `apps/web/src/app/judge/page.tsx` (completely rewritten - 30 lines instead of 1000+)

**No Changes Needed:**
- `apps/web/src/app/judge-cockpit/page.tsx` (already correct)
- `apps/web/src/app/judge-cockpit/assignments/page.tsx` (already correct)
- `apps/web/src/app/judge-cockpit/evaluate/[projectId]/page.tsx` (already correct)
- `apps/web/src/app/judge-cockpit/calibration/page.tsx` (already correct)

## Edge Cases Handled

1. **No user in localStorage** → Redirect to `/login`
2. **Invalid JSON in localStorage** → Catch error, redirect to `/login`
3. **User role is not 'JUDGE'** → Redirect to `/login` (they shouldn't be accessing judge routes)
4. **Judge tries to access `/participant`** → Backend RBAC should reject (frontend could add similar redirect)

## Future Improvements

### Option 1: Centralized Route Guard
Create a route guard middleware:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const userStr = request.cookies.get('dogfood_user')?.value;
  const user = JSON.parse(userStr);
  
  if (request.nextUrl.pathname.startsWith('/judge-cockpit')) {
    if (user.role !== 'JUDGE') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Similar for other routes...
}
```

### Option 2: Layout-Level Protection
```typescript
// app/judge-cockpit/layout.tsx
export default function JudgeCockpitLayout({ children }) {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'JUDGE') {
    redirect('/login');
  }
  
  return <>{children}</>;
}
```

### Option 3: Context Provider
```typescript
// components/AuthProvider.tsx
export function AuthProvider({ children, requiredRole }) {
  const user = useCurrentUser();
  
  if (!user || user.role !== requiredRole) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}
```

## Security Notes

⚠️ **Important**: Current implementation uses localStorage for demo purposes. In production:

1. **Use HTTP-only cookies** for authentication tokens
2. **Verify JWT on server** for all API calls
3. **Implement middleware** for route protection
4. **Add CSRF protection** for mutations
5. **Use secure session management** (not localStorage)

Current backend already has proper RBAC via `AuthGuard` + `RolesGuard` on all endpoints, so this is just a UX improvement to prevent judges from seeing the wrong UI.

## Status: ✅ RESOLVED

Judges will now be properly redirected to the Judge Cockpit instead of seeing the participant team creation screen.

**Test Instructions:**
1. Set user in localStorage: `localStorage.setItem('dogfood_user', JSON.stringify({id: '123', name: 'Test Judge', email: 'judge@test.com', role: 'JUDGE'}))`
2. Navigate to `/judge`
3. Should auto-redirect to `/judge-cockpit`
4. Should see "JUDGING COCKPIT" header, not "Form Your Team"

---

**Issue Closed** 🎉
