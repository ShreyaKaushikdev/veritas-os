# 🔐 Role-Based Access Control (RBAC) System

## Overview

This system implements **enterprise-grade RBAC with multi-tenant data isolation** to ensure complete separation of concerns between different user roles. Each role has strictly defined permissions and can only access data relevant to their function.

---

## 🎭 User Roles

### 1. **VISITOR** (Unauthenticated/Guest)
- **Purpose:** Public access to basic information
- **Access Level:** Minimal
- **Can See:**
  - Published event information
  - Public rankings (after publication)
  - Public chat lounge
- **Cannot See:**
  - User profiles
  - Project details
  - Team information
  - Ballots/scores
  - Admin panels

### 2. **PARTICIPANT** (Hackathon Participant)
- **Purpose:** Submit projects and collaborate with team
- **Access Level:** Limited to own data
- **Can See:**
  - ✅ Their own profile
  - ✅ Their team(s)
  - ✅ Their team's projects
  - ✅ Public chat + team channels
  - ✅ Event information
  - ✅ Their support tickets
  - ✅ Rubric criteria (for submission)
- **Cannot See:**
  - ❌ Other teams' projects (unless public)
  - ❌ Judge panel
  - ❌ Ballots/scores
  - ❌ Judge assignments
  - ❌ Other participants' profiles
  - ❌ Organizer dashboard
  - ❌ Analytics

### 3. **JUDGE** (Project Evaluator)
- **Purpose:** Evaluate assigned projects fairly
- **Access Level:** Limited to assigned projects only
- **Can See:**
  - ✅ Their own profile
  - ✅ **ONLY** projects assigned to them
  - ✅ Their own ballots
  - ✅ Their assignments
  - ✅ Rubric criteria
  - ✅ Public chat lounge
  - ✅ Their support tickets
- **Cannot See:**
  - ❌ Team information (blind judging)
  - ❌ Team member names (blind judging)
  - ❌ Participant panel
  - ❌ Team chat channels
  - ❌ Unassigned projects
  - ❌ Other judges' ballots
  - ❌ Organizer dashboard
  - ❌ Participant contact info

**Critical:** Judges operate in a **sandboxed environment** to prevent bias.

### 4. **ORGANIZER** (Event Manager)
- **Purpose:** Manage events, assignments, and results
- **Access Level:** Full access to their events
- **Can See:**
  - ✅ All projects in their events
  - ✅ All teams in their events
  - ✅ All ballots and scores
  - ✅ All participants and judges
  - ✅ Event analytics
  - ✅ All chat channels
  - ✅ All support tickets
  - ✅ Judge assignments
  - ✅ Audit logs
- **Cannot See:**
  - ❌ Events they don't organize
  - ❌ System-wide data (other events)
  - ❌ System configuration

### 5. **ADMIN** (System Administrator)
- **Purpose:** System-wide management
- **Access Level:** Unrestricted
- **Can See:** Everything across all events

---

## 🔒 Data Isolation Matrix

| Resource | VISITOR | PARTICIPANT | JUDGE | ORGANIZER | ADMIN |
|----------|---------|-------------|-------|-----------|-------|
| **Own Profile** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Other Profiles** | ❌ | ❌ | ❌ | ✅ (event) | ✅ (all) |
| **Own Team** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Other Teams** | ❌ | ❌ | ❌ | ✅ (event) | ✅ (all) |
| **Own Projects** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Assigned Projects** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **All Projects** | ❌ | ❌ | ❌ | ✅ (event) | ✅ (all) |
| **Own Ballots** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **All Ballots** | ❌ | ❌ | ❌ | ✅ (event) | ✅ (all) |
| **Judge Assignments** | ❌ | ❌ | ✅ (own) | ✅ | ✅ |
| **Public Chat** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Team Chat** | ❌ | ✅ (own) | ❌ | ✅ | ✅ |
| **Support Tickets** | ❌ | ✅ (own) | ✅ (own) | ✅ (all) | ✅ (all) |
| **Analytics** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Audit Logs** | ❌ | ❌ | ❌ | ✅ (event) | ✅ (all) |

---

## 📋 Permission System

### Permission Categories

The system uses **fine-grained permissions** instead of coarse role checks:

```typescript
// Example: Instead of checking role
if (user.role === 'ORGANIZER') { }

// Use permission check
@Permissions(Permission.EVENT_MANAGE_SETTINGS)
```

### Permission List

#### User Management
- `user:read:own` - View own profile
- `user:update:own` - Update own profile
- `user:read:all` - View all users (Organizer+)
- `user:update:all` - Update any user (Admin only)

#### Event Management
- `event:read` - View event details
- `event:create` - Create new events (Organizer+)
- `event:update` - Modify event settings (Organizer+)
- `event:manage:settings` - Advanced settings (Organizer+)
- `event:view:analytics` - View event analytics (Organizer+)

#### Project Management
- `project:create` - Create project (Participant)
- `project:read:own` - View own team's projects (Participant)
- `project:read:assigned` - View assigned projects (Judge)
- `project:read:all` - View all projects (Organizer+)
- `project:update:own` - Modify own project (Participant)
- `project:update:all` - Modify any project (Organizer+)

#### Judging
- `ballot:create` - Create ballot (Judge)
- `ballot:read:own` - View own ballots (Judge)
- `ballot:update:own` - Modify own ballot (Judge)
- `ballot:submit` - Submit ballot (Judge)
- `ballot:read:all` - View all ballots (Organizer+)

#### Chat
- `chat:read:public` - View public lounge (All)
- `chat:read:project` - View team channels (Participant)
- `chat:read:all` - View all channels (Organizer+)
- `chat:send` - Send messages (All authenticated)
- `chat:moderate` - Delete messages (Organizer+)

---

## 🛡️ Security Guards

### 1. **AuthGuard**
Validates session token and attaches user to request.

```typescript
@UseGuards(AuthGuard)
```

### 2. **PermissionsGuard**
Checks if user has required permissions.

```typescript
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.PROJECT_CREATE)
```

### 3. **ResourceOwnershipGuard**
Ensures user owns the resource they're accessing.

```typescript
@UseGuards(AuthGuard, ResourceOwnershipGuard)
@Put(':id')
async updateProject() { }
```

### Guard Execution Order
```
1. AuthGuard - Authenticate user
2. PermissionsGuard - Check permissions
3. ResourceOwnershipGuard - Verify ownership
4. Controller - Execute action
```

---

## 🔧 Implementation Guide

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './permissions/permissions.decorator';
import { Permission } from './permissions/permission.types';

@Controller('api/v1/projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectsController {
  
  // Only participants can create projects
  @Post()
  @Permissions(Permission.PROJECT_CREATE)
  async create(@Body() dto: any) {
    return { message: 'Project created' };
  }

  // Participants see own, judges see assigned, organizers see all
  @Get()
  @Permissions(
    Permission.PROJECT_READ_OWN,
    Permission.PROJECT_READ_ASSIGNED,
    Permission.PROJECT_READ_ALL
  )
  async list(@Req() req: any) {
    const filter = this.dataIsolation.getProjectFilter(
      req.user.id,
      req.user.role
    );
    // Use filter in query
    return projects;
  }
}
```

### Data Isolation Service

```typescript
import { DataIsolationService } from './services/data-isolation.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private dataIsolation: DataIsolationService
  ) {}

  async findAll(userId: string, userRole: Role, eventId: string) {
    // Get role-based filter
    const filter = this.dataIsolation.getProjectFilter(userId, userRole, eventId);
    
    // Query with filter
    const projects = await this.prisma.project.findMany({
      where: filter
    });

    // Sanitize data based on viewer
    return projects.map(p => 
      this.dataIsolation.sanitizeProjectData(p, userRole, userId)
    );
  }
}
```

---

## 🚫 What Each Role CANNOT See

### PARTICIPANT Cannot See:
```
❌ Judge Panel:
   - Judge assignments
   - Judge identities (in blind mode)
   - Ballots and scores
   - Judge discussions

❌ Other Participants:
   - Other teams' internal data
   - Other teams' chat channels
   - Other participants' contact info

❌ Organizer Panel:
   - Event analytics
   - Admin tools
   - Assignment management
   - Result publishing tools
```

### JUDGE Cannot See:
```
❌ Participant Panel:
   - Team compositions
   - Team member names (blind mode)
   - Team chat channels
   - Participant contact info

❌ Non-Assigned Projects:
   - Projects not assigned to them
   - Other teams' submissions

❌ Organizer Panel:
   - Event management tools
   - Assignment management
   - Analytics dashboard
   - Other judges' ballots
```

### ORGANIZER Cannot See:
```
❌ Other Events:
   - Events they don't organize
   - Data from other organizers' events

❌ System Admin:
   - System-wide configuration
   - User management (outside their events)
```

---

## 🔄 Event-Level Role Override

Users can have different roles in different events:

```typescript
// User's system role
user.role = Role.PARTICIPANT

// User's role in Event A
event_a_membership.role = Role.PARTICIPANT

// User's role in Event B
event_b_membership.role = Role.JUDGE
```

The system automatically uses the **event-specific role** when `eventId` is present:

```typescript
// GET /api/v1/events/event-a/projects
// User acts as PARTICIPANT

// GET /api/v1/events/event-b/projects
// User acts as JUDGE (sees only assigned projects)
```

---

## 📊 Audit Trail

All authorization failures are logged:

```typescript
{
  "action": "PERMISSION_DENIED",
  "actorId": "user-123",
  "actorRole": "JUDGE",
  "resourceType": "/api/v1/teams",
  "reason": "Role 'JUDGE' lacks permissions: [team:read:all]",
  "timestamp": "2026-09-27T12:00:00Z"
}
```

This helps:
- Detect unauthorized access attempts
- Audit security incidents
- Monitor role usage patterns
- Debug permission issues

---

## 🧪 Testing RBAC

### Test Participant Access
```bash
# Login as participant
TOKEN=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -d '{"email":"participant@test.com","password":"pass"}' | jq -r .token)

# Try to access own projects ✅
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/events/event-1/projects

# Try to access judge panel ❌ (Should fail with 403)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/events/event-1/ballots
```

### Test Judge Access
```bash
# Login as judge
TOKEN=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -d '{"email":"judge@test.com","password":"pass"}' | jq -r .token)

# Try to access assigned projects ✅
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/events/event-1/projects

# Try to access teams ❌ (Should fail with 403)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/events/event-1/teams
```

---

## 🔐 Security Best Practices

### 1. **Always Use Guards**
```typescript
// ❌ Bad - No guards
@Get()
async list() { }

// ✅ Good - Proper guards
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.PROJECT_READ_OWN)
@Get()
async list() { }
```

### 2. **Apply Data Filters**
```typescript
// ❌ Bad - No filtering
const projects = await this.prisma.project.findMany();

// ✅ Good - Role-based filtering
const filter = this.dataIsolation.getProjectFilter(userId, role);
const projects = await this.prisma.project.findMany({ where: filter });
```

### 3. **Sanitize Output**
```typescript
// ❌ Bad - Exposing sensitive data
return user;

// ✅ Good - Sanitized output
return this.dataIsolation.sanitizeUserData(user, viewerRole);
```

### 4. **Verify Ownership**
```typescript
// ❌ Bad - No ownership check
@Put(':id')
async update(@Param('id') id: string) { }

// ✅ Good - Ownership verified
@UseGuards(ResourceOwnershipGuard)
@Put(':id')
async update(@Param('id') id: string) { }
```

---

## 📖 Migration Guide

### Converting Existing Controllers

**Before (Coarse Role Check):**
```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PARTICIPANT, Role.ORGANIZER)
@Get()
async list(@Req() req: any) {
  const projects = await this.prisma.project.findMany();
  return projects;
}
```

**After (Fine-Grained Permissions):**
```typescript
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.PROJECT_READ_OWN, Permission.PROJECT_READ_ALL)
@Get()
async list(@Req() req: any) {
  const filter = this.dataIsolation.getProjectFilter(
    req.user.id,
    req.user.role
  );
  const projects = await this.prisma.project.findMany({ where: filter });
  return projects.map(p => 
    this.dataIsolation.sanitizeProjectData(p, req.user.role, req.user.id)
  );
}
```

---

## 🎯 Quick Reference

### Guard Combinations

| Use Case | Guards | Decorators |
|----------|--------|------------|
| Public endpoint | None | None |
| Authenticated only | `AuthGuard` | None |
| Role-specific | `AuthGuard`, `PermissionsGuard` | `@Permissions()` |
| Own resource only | `AuthGuard`, `PermissionsGuard`, `ResourceOwnershipGuard` | `@Permissions()` |

### Common Patterns

```typescript
// Pattern 1: List with filtering
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_READ_OWN, Permission.RESOURCE_READ_ALL)
async list() {
  const filter = this.dataIsolation.getFilter(user.id, user.role);
  return this.service.findMany(filter);
}

// Pattern 2: Create with ownership
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_CREATE)
async create(@Req() req: any, @Body() dto: any) {
  return this.service.create({ ...dto, ownerId: req.user.id });
}

// Pattern 3: Update with ownership check
@UseGuards(AuthGuard, PermissionsGuard, ResourceOwnershipGuard)
@Permissions(Permission.RESOURCE_UPDATE_OWN)
async update(@Param('id') id: string, @Body() dto: any) {
  return this.service.update(id, dto);
}
```

---

## 🚨 Common Pitfalls

1. **Forgetting Data Isolation**
   ```typescript
   // ❌ Wrong - Judge sees all projects
   await this.prisma.project.findMany();
   
   // ✅ Correct - Judge sees only assigned
   const filter = this.dataIsolation.getProjectFilter(userId, role);
   await this.prisma.project.findMany({ where: filter });
   ```

2. **Exposing Sensitive Data**
   ```typescript
   // ❌ Wrong - Exposes team info to judge
   return project;
   
   // ✅ Correct - Sanitized for judge
   return this.dataIsolation.sanitizeProjectData(project, role, userId);
   ```

3. **Bypassing Ownership Checks**
   ```typescript
   // ❌ Wrong - No ownership verification
   await this.prisma.project.update({ where: { id }, data });
   
   // ✅ Correct - Uses ResourceOwnershipGuard
   @UseGuards(ResourceOwnershipGuard)
   ```

---

Your system now has **enterprise-grade multi-tenant RBAC** with complete data isolation! 🎉
