# 🎨 RBAC Visual Diagrams

## Data Isolation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ARCHITECTURE                │
│                                                             │
│  Each role operates in an isolated data sandbox             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    PARTICIPANT      │  │      JUDGE          │  │    ORGANIZER        │
│     SANDBOX         │  │     SANDBOX         │  │     SANDBOX         │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │  │                     │
│ ✅ Own Profile      │  │ ✅ Own Profile      │  │ ✅ Event Users      │
│ ✅ Own Team(s)      │  │ ❌ NO Teams         │  │ ✅ All Teams        │
│ ✅ Own Projects     │  │ ✅ Assigned Only    │  │ ✅ All Projects     │
│ ❌ NO Ballots       │  │ ✅ Own Ballots      │  │ ✅ All Ballots      │
│ ✅ Public Chat      │  │ ✅ Public Only      │  │ ✅ All Channels     │
│ ✅ Team Chat        │  │ ❌ NO Team Chat     │  │ ✅ Analytics        │
│                     │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         ⬇                         ⬇                         ⬇
    [Database]              [Database]                [Database]
    + Filter                + Filter                  + Filter
```

---

## Permission Hierarchy

```
                         ┌──────────┐
                         │  ADMIN   │  ← All Permissions
                         └────┬─────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        ┌──────────┐                    ┌──────────┐
        │ORGANIZER │                    │  JUDGE   │
        └────┬─────┘                    └────┬─────┘
             │                               │
             │                               │
    ┌────────┴────────┐              ┌──────┴──────┐
    ▼                 ▼              ▼             ▼
┌──────────┐    ┌──────────┐   ┌─────────┐   ┌─────────┐
│   Event  │    │  System  │   │Assigned │   │   Own   │
│   Data   │    │  Tools   │   │Projects │   │ Ballots │
└──────────┘    └──────────┘   └─────────┘   └─────────┘

        ┌────────────────┐
        │  PARTICIPANT   │
        └────────┬───────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌─────────┐
   │Own Team │      │   Own   │
   │  Data   │      │Projects │
   └─────────┘      └─────────┘
```

---

## Request Flow with RBAC

```
1. HTTP Request
   │
   ▼
┌────────────────────┐
│   AuthGuard        │ ← Validate session token
│   • Check token    │
│   • Load user      │
│   • Attach to req  │
└────────┬───────────┘
         │ user.role = JUDGE
         ▼
┌────────────────────┐
│ PermissionsGuard   │ ← Check permissions
│ • Get required     │
│   permissions      │
│ • Check user role  │
│ • ROLE_PERMISSIONS │
│   lookup           │
└────────┬───────────┘
         │ ✅ Has permission
         ▼
┌────────────────────┐
│ResourceOwnership   │ ← Verify ownership
│Guard (optional)    │
│ • Check resource   │
│   owner            │
│ • Validate access  │
└────────┬───────────┘
         │ ✅ Is owner
         ▼
┌────────────────────┐
│  Controller        │ ← Execute action
│  • Apply data      │
│    isolation       │
│  • Query with      │
│    filter          │
│  • Sanitize output │
└────────┬───────────┘
         │
         ▼
    Response
```

---

## Data Flow Example: Judge Accessing Projects

```
┌─────────────┐
│  Judge      │
│  Login      │
└──────┬──────┘
       │
       │ GET /events/event-1/projects
       ▼
┌─────────────────────────────┐
│  AuthGuard                  │
│  user.role = JUDGE ✅       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  PermissionsGuard           │
│  Check: PROJECT_READ_       │
│         ASSIGNED ✅         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  DataIsolationService       │
│  getProjectFilter()         │
│                             │
│  WHERE:                     │
│    eventId = 'event-1'      │
│    AND assignments = {      │
│      judgeId: 'judge-123'   │
│      status: 'ACTIVE'       │
│    }                        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Database Query             │
│  findMany({ where: filter })│
└──────┬──────────────────────┘
       │
       │ Results: 3 projects
       ▼
┌─────────────────────────────┐
│  Sanitize Data              │
│  • Remove team info         │
│  • Remove member names      │
│  • Hide contact details     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
│  3 projects │
│  (assigned  │
│   only)     │
└─────────────┘
```

---

## Multi-Tenant Isolation Layers

```
┌──────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  • Guards enforce authentication & authorization             │
│  • Decorators define required permissions                    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  • DataIsolationService generates role-based filters         │
│  • Services apply filters to all queries                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Data Layer (Prisma)                        │
│  WHERE filters ensure users only see permitted data          │
│                                                              │
│  Examples:                                                   │
│  • JUDGE:       WHERE assignments.judgeId = userId           │
│  • PARTICIPANT: WHERE team.members.userId = userId           │
│  • ORGANIZER:   WHERE eventId = organizerEventId             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Database                                   │
│  Physical data isolation through query filters               │
└──────────────────────────────────────────────────────────────┘
```

---

## Role Comparison Matrix

### Participant vs Judge vs Organizer

```
                  │ PARTICIPANT │  JUDGE  │ ORGANIZER │
──────────────────┼─────────────┼─────────┼───────────┤
Own Profile       │      ✅     │   ✅    │    ✅     │
Other Profiles    │      ❌     │   ❌    │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Own Team          │      ✅     │   ❌    │    ✅     │
Other Teams       │      ❌     │   ❌    │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Own Projects      │      ✅     │   ❌    │    ✅     │
Assigned Projects │      ❌     │   ✅    │    ✅     │
All Projects      │      ❌     │   ❌    │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Own Ballots       │      ❌     │   ✅    │    ✅     │
All Ballots       │      ❌     │   ❌    │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Judge Assignments │      ❌     │ ✅(own) │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Public Chat       │      ✅     │   ✅    │    ✅     │
Team Chat         │   ✅(own)   │   ❌    │    ✅     │
──────────────────┼─────────────┼─────────┼───────────┤
Analytics         │      ❌     │   ❌    │    ✅     │
Event Management  │      ❌     │   ❌    │    ✅     │
──────────────────┴─────────────┴─────────┴───────────┘
```

---

## Permission Check Flow

```
User makes request
       │
       ▼
   [AuthGuard]
       │
       ├─── No user ──────────────┐
       │                          ▼
       │                     401 Unauthorized
       │
       ├─── Has user ────────────┐
       │                         ▼
       │                  [PermissionsGuard]
       │                         │
       │                         ├─── Check Required Permissions
       │                         │
       │                         ├─── Get User's Role Permissions
       │                         │
       │                         ├─── Match?
       │                         │
       │         ┌───────────────┴───────────────┐
       │         │                               │
       │        NO                              YES
       │         │                               │
       │         ▼                               ▼
       │   403 Forbidden                  [ResourceOwnershipGuard]
       │   + Audit Log                            │
       │                                          ├─── Resource Specific?
       │                                          │
       │                         ┌────────────────┴────────────────┐
       │                         │                                 │
       │                        NO                                YES
       │                         │                                 │
       │                         ▼                                 │
       │                   [Controller]                            │
       │                         │                                 │
       │                         ▼                                 ├─── Check Ownership
       │                  Apply Filters                            │
       │                         │                    ┌────────────┴────────────┐
       │                         ▼                    │                         │
       │                   Query Data               Owner                   Not Owner
       │                         │                    │                         │
       │                         ▼                    ▼                         ▼
       │                  Sanitize Output      [Controller]              403 Forbidden
       │                         │                    │                   + Audit Log
       │                         ▼                    ▼
       │                   200 OK Response     Apply Filters
       │                                              │
       │                                              ▼
       │                                        Query Data
       │                                              │
       │                                              ▼
       │                                       Sanitize Output
       │                                              │
       │                                              ▼
       └──────────────────────────────────────> 200 OK Response
```

---

## Blind Judging Mode

```
┌─────────────────────────────────────────────────────────────┐
│                    BLIND JUDGING MODE                       │
│  Prevents bias by hiding team/participant information       │
└─────────────────────────────────────────────────────────────┘

WITHOUT BLIND MODE:                    WITH BLIND MODE:
┌──────────────────────┐               ┌──────────────────────┐
│ Project Details      │               │ Project Details      │
├──────────────────────┤               ├──────────────────────┤
│ Title: "AI Helper"   │               │ Title: "Project #a1b2│
│ Team: "Team Alpha"   │               │ Team: [HIDDEN]       │
│ Members:             │               │ Members: [HIDDEN]    │
│  - John Doe          │               │ Description: ...     │
│  - Jane Smith        │               │ Demo URL: ...        │
│ Description: ...     │               │ Tech Stack: ...      │
│ Demo URL: ...        │               │                      │
│ Tech Stack: ...      │               │ [Judge can only see  │
└──────────────────────┘               │  the work, not       │
                                       │  the creators]       │
                                       └──────────────────────┘

Implementation:
┌──────────────────────────────────────────────────────────────┐
│  sanitizeProjectData(project, Role.JUDGE) {                  │
│    if (event.blindReviewMode) {                              │
│      delete project.team;                                    │
│      delete project.teamId;                                  │
│      project.title = `Project #${project.id.slice(0, 8)}`;  │
│    }                                                         │
│    return project;                                           │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Audit Trail

```
Every Authorization Failure is Logged:

┌──────────────────────────────────────────────────────────────┐
│ Unauthorized Access Attempt                                  │
├──────────────────────────────────────────────────────────────┤
│ Timestamp:    2026-09-27T12:34:56Z                          │
│ Actor:        judge@example.com (Judge)                      │
│ Action:       PERMISSION_DENIED                              │
│ Resource:     /api/v1/events/event-1/teams                  │
│ Reason:       Role 'JUDGE' lacks permissions:                │
│               [team:read:all]                                │
│ Request ID:   REQ-PERM-403                                   │
│ IP Address:   192.168.1.100                                  │
└──────────────────────────────────────────────────────────────┘

Uses:
• Detect suspicious activity
• Compliance auditing
• Debug permission issues
• Monitor access patterns
```

---

## Event-Scoped Roles

```
User can have DIFFERENT roles in DIFFERENT events:

┌─────────────────────────────────────────────────────────────┐
│                         User: Alice                         │
├─────────────────────────────────────────────────────────────┤
│ System Role: PARTICIPANT                                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Event A                │    │   Event B                │
│   "Summer Hackathon"     │    │   "Winter Hackathon"     │
├──────────────────────────┤    ├──────────────────────────┤
│ Role: PARTICIPANT        │    │ Role: JUDGE              │
│                          │    │                          │
│ Can:                     │    │ Can:                     │
│ ✅ Create team           │    │ ✅ View assigned projects│
│ ✅ Submit project        │    │ ✅ Submit ballots        │
│ ✅ See team chat         │    │ ✅ View rubric           │
│                          │    │                          │
│ Cannot:                  │    │ Cannot:                  │
│ ❌ Judge projects        │    │ ❌ Create team           │
│ ❌ View ballots          │    │ ❌ See team chat         │
└──────────────────────────┘    └──────────────────────────┘

Implementation:
┌──────────────────────────────────────────────────────────────┐
│  // Check for event-level role                               │
│  const membership = await prisma.membership.findUnique({     │
│    where: {                                                  │
│      userId_eventId: { userId, eventId }                     │
│    }                                                         │
│  });                                                         │
│                                                              │
│  const effectiveRole = membership?.role || user.role;        │
└──────────────────────────────────────────────────────────────┘
```

---

## Cross-Role Communication Channels

```
┌─────────────────────────────────────────────────────────────┐
│                        CHAT CHANNELS                        │
└─────────────────────────────────────────────────────────────┘

Public Lounge (All Roles)
┌──────────────────────────────────────────────────────────────┐
│ 👤 Participant: "When is the deadline?"                      │
│ 👔 Organizer: "Submissions close Friday at 5 PM"             │
│ ⚖️  Judge: "Looking forward to reviewing projects!"          │
│ 👤 Participant: "Thanks!"                                    │
└──────────────────────────────────────────────────────────────┘
✅ VISITOR can read
✅ PARTICIPANT can read & send
✅ JUDGE can read & send
✅ ORGANIZER can read, send & moderate


Team Channels (Team Members Only)
┌──────────────────────────────────────────────────────────────┐
│ 👤 Alice: "I'll work on the frontend"                        │
│ 👤 Bob: "I'll handle the backend API"                        │
│ 👤 Carol: "I'll design the UI"                              │
└──────────────────────────────────────────────────────────────┘
✅ PARTICIPANT (team members) can read & send
✅ ORGANIZER can read & moderate
❌ JUDGE cannot access (isolation)
❌ Other teams cannot access


Organizer Channel (Organizers Only)
┌──────────────────────────────────────────────────────────────┐
│ 👔 Organizer 1: "Let's extend the deadline?"                 │
│ 👔 Organizer 2: "Agreed, announcement going out now"         │
└──────────────────────────────────────────────────────────────┘
✅ ORGANIZER can read & send
✅ ADMIN can read & moderate
❌ All other roles cannot access
```

---

This visual guide shows exactly how data isolation and RBAC work together! 🎨
