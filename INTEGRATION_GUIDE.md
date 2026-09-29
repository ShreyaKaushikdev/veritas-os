# 🔧 RBAC Integration Guide

## Quick Integration Steps

Follow these steps to integrate the RBAC system into your existing controllers.

---

## Step 1: Register Services in App Module

Update your main application module:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DataIsolationService } from './common/services/data-isolation.service';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { ResourceOwnershipGuard } from './common/guards/resource-ownership.guard';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    // ... your existing imports
  ],
  providers: [
    PrismaService,
    DataIsolationService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    ResourceOwnershipGuard,
  ],
  exports: [
    DataIsolationService,
  ],
})
export class AppModule {}
```

---

## Step 2: Update Existing Controllers

### Example: Projects Controller

**BEFORE (Current Code):**
```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@Controller('api/v1/events/:eventId/projects')
@UseGuards(AuthGuard, RolesGuard)
export class ProjectsController {
  
  @Get()
  @Roles(Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER)
  async listProjects(@Param('eventId') eventId: string) {
    // This returns ALL projects - NO ISOLATION ❌
    const projects = await this.prisma.project.findMany({
      where: { eventId }
    });
    return projects;
  }

  @Post()
  @Roles(Role.PARTICIPANT)
  async createProject(@Body() dto: any) {
    return this.projectsService.create(dto);
  }
}
```

**AFTER (With RBAC):**
```typescript
import { Controller, Get, Post, UseGuards, Req, Param } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';
import { Permissions } from '../common/permissions/permissions.decorator';
import { Permission } from '../common/permissions/permission.types';
import { DataIsolationService } from '../common/services/data-isolation.service';

@Controller('api/v1/events/:eventId/projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private dataIsolation: DataIsolationService
  ) {}
  
  @Get()
  @Permissions(
    Permission.PROJECT_READ_OWN,      // Participant
    Permission.PROJECT_READ_ASSIGNED, // Judge
    Permission.PROJECT_READ_ALL       // Organizer/Admin
  )
  async listProjects(
    @Req() req: any,
    @Param('eventId') eventId: string
  ) {
    const user = req.user;
    
    // Apply role-based filter - AUTOMATIC ISOLATION ✅
    const filter = this.dataIsolation.getProjectFilter(
      user.id,
      user.role,
      eventId
    );
    
    const projects = await this.prisma.project.findMany({
      where: filter
    });

    // Sanitize data based on role
    return projects.map(p =>
      this.dataIsolation.sanitizeProjectData(p, user.role, user.id)
    );
  }

  @Post()
  @Permissions(Permission.PROJECT_CREATE)
  async createProject(@Req() req: any, @Body() dto: any) {
    // Verify team membership before creating
    const canAccess = await this.dataIsolation.canAccessTeam(
      req.user.id,
      req.user.role,
      dto.teamId
    );
    
    if (!canAccess) {
      throw new ForbiddenException('You are not a member of this team');
    }

    return this.projectsService.create(dto);
  }

  @Put(':id')
  @UseGuards(ResourceOwnershipGuard) // Automatic ownership check
  @Permissions(Permission.PROJECT_UPDATE_OWN, Permission.PROJECT_UPDATE_ALL)
  async updateProject(
    @Param('id') id: string,
    @Body() dto: any
  ) {
    // If we reach here, user owns the project or is Organizer
    return this.projectsService.update(id, dto);
  }
}
```

---

## Step 3: Update Services with Data Isolation

**BEFORE:**
```typescript
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(eventId: string) {
    // Returns ALL projects - no filtering
    return this.prisma.project.findMany({
      where: { eventId }
    });
  }
}
```

**AFTER:**
```typescript
import { DataIsolationService } from '../common/services/data-isolation.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private dataIsolation: DataIsolationService
  ) {}

  async findAll(userId: string, userRole: Role, eventId: string) {
    // Get role-based filter
    const filter = this.dataIsolation.getProjectFilter(
      userId,
      userRole,
      eventId
    );
    
    // Query with filter - automatic isolation
    const projects = await this.prisma.project.findMany({
      where: filter,
      include: {
        team: true,
        assignments: true,
      }
    });

    // Sanitize based on role
    return projects.map(p =>
      this.dataIsolation.sanitizeProjectData(p, userRole, userId)
    );
  }

  async findOne(userId: string, userRole: Role, projectId: string) {
    // Check access first
    const canAccess = await this.dataIsolation.canAccessProject(
      userId,
      userRole,
      projectId
    );

    if (!canAccess) {
      throw new ForbiddenException('You cannot access this project');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    // Sanitize
    return this.dataIsolation.sanitizeProjectData(project, userRole, userId);
  }
}
```

---

## Step 4: Common Controller Patterns

### Pattern 1: List with Filtering
```typescript
@Get()
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_READ_OWN, Permission.RESOURCE_READ_ALL)
async list(@Req() req: any, @Param('eventId') eventId: string) {
  const filter = this.dataIsolation.getResourceFilter(
    req.user.id,
    req.user.role,
    eventId
  );
  
  return this.service.findMany(filter);
}
```

### Pattern 2: Create with Validation
```typescript
@Post()
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_CREATE)
async create(@Req() req: any, @Body() dto: any) {
  // Attach owner
  dto.ownerId = req.user.id;
  
  // Validate access if needed
  if (dto.relatedResourceId) {
    const canAccess = await this.dataIsolation.canAccessResource(
      req.user.id,
      req.user.role,
      dto.relatedResourceId
    );
    
    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }
  }

  return this.service.create(dto);
}
```

### Pattern 3: Update with Ownership
```typescript
@Put(':id')
@UseGuards(AuthGuard, PermissionsGuard, ResourceOwnershipGuard)
@Permissions(Permission.RESOURCE_UPDATE_OWN, Permission.RESOURCE_UPDATE_ALL)
async update(@Param('id') id: string, @Body() dto: any) {
  // ResourceOwnershipGuard already verified ownership
  return this.service.update(id, dto);
}
```

### Pattern 4: Delete with Ownership
```typescript
@Delete(':id')
@UseGuards(AuthGuard, PermissionsGuard, ResourceOwnershipGuard)
@Permissions(Permission.RESOURCE_DELETE_OWN)
async delete(@Param('id') id: string) {
  return this.service.delete(id);
}
```

---

## Step 5: Specific Controller Examples

### Teams Controller
```typescript
@Controller('api/v1/events/:eventId/teams')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamsController {
  constructor(private dataIsolation: DataIsolationService) {}

  @Get()
  @Permissions(Permission.TEAM_READ_OWN, Permission.TEAM_READ_ALL)
  async listTeams(@Req() req: any, @Param('eventId') eventId: string) {
    const filter = this.dataIsolation.getTeamFilter(
      req.user.id,
      req.user.role,
      eventId
    );
    
    const teams = await this.prisma.team.findMany({ where: filter });
    
    // Judges will get empty array (isolation)
    return teams;
  }

  @Post()
  @Permissions(Permission.TEAM_CREATE)
  async createTeam(@Req() req: any, @Body() dto: any) {
    // Participants can create teams
    return this.teamsService.create(req.user.id, dto);
  }
}
```

### Ballots Controller
```typescript
@Controller('api/v1/events/:eventId/ballots')
@UseGuards(AuthGuard, PermissionsGuard)
export class BallotsController {
  constructor(private dataIsolation: DataIsolationService) {}

  @Get()
  @Permissions(Permission.BALLOT_READ_OWN, Permission.BALLOT_READ_ALL)
  async listBallots(@Req() req: any, @Param('eventId') eventId: string) {
    const filter = this.dataIsolation.getBallotFilter(
      req.user.id,
      req.user.role,
      eventId
    );
    
    const ballots = await this.prisma.ballot.findMany({ where: filter });
    
    // Judges see only their ballots
    // Organizers see all
    // Participants get 403 (no permission)
    return ballots;
  }

  @Post()
  @Permissions(Permission.BALLOT_CREATE)
  async createBallot(@Req() req: any, @Body() dto: any) {
    // Verify judge is assigned to this project
    const canAccess = await this.dataIsolation.canAccessProject(
      req.user.id,
      req.user.role,
      dto.projectId
    );

    if (!canAccess) {
      throw new ForbiddenException('You are not assigned to this project');
    }

    return this.ballotsService.create(req.user.id, dto);
  }
}
```

### Chat Controller
```typescript
@Controller('api/v1/events/:eventId/chat')
@UseGuards(AuthGuard, PermissionsGuard)
export class ChatController {
  constructor(private dataIsolation: DataIsolationService) {}

  @Get()
  @Permissions(
    Permission.CHAT_READ_PUBLIC,
    Permission.CHAT_READ_PROJECT,
    Permission.CHAT_READ_ALL
  )
  async getMessages(@Req() req: any, @Param('eventId') eventId: string) {
    const filter = this.dataIsolation.getChatFilter(
      req.user.id,
      req.user.role,
      eventId
    );
    
    const messages = await this.prisma.chatMessage.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });
    
    // Participants see public + team channels
    // Judges see ONLY public (isolation)
    // Organizers see all
    return messages;
  }

  @Post()
  @Permissions(Permission.CHAT_SEND)
  async sendMessage(@Req() req: any, @Body() dto: any) {
    // If team channel, verify access
    if (dto.projectId) {
      const canAccess = await this.dataIsolation.canAccessTeam(
        req.user.id,
        req.user.role,
        dto.projectId
      );
      
      if (!canAccess) {
        throw new ForbiddenException('You cannot send to this channel');
      }
    }

    return this.chatService.send(req.user.id, dto);
  }
}
```

---

## Step 6: Update Module Imports

Each module that uses RBAC needs to import the service:

```typescript
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { DataIsolationService } from '../common/services/data-isolation.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    DataIsolationService,
    PrismaService,
  ],
})
export class ProjectsModule {}
```

---

## Step 7: Testing Checklist

### Test Each Role

**Participant:**
- [ ] Can view own projects
- [ ] Can create team
- [ ] Can view own team
- [ ] Cannot view ballots (403)
- [ ] Cannot view judge assignments (403)
- [ ] Cannot access other teams' data (403 or empty)

**Judge:**
- [ ] Can view only assigned projects
- [ ] Can create ballots for assigned projects
- [ ] Cannot view teams (403 or empty)
- [ ] Cannot view team chat (403 or empty)
- [ ] Cannot view unassigned projects (empty list)

**Organizer:**
- [ ] Can view all projects in their event
- [ ] Can view all teams
- [ ] Can view all ballots
- [ ] Can manage assignments
- [ ] Cannot access other organizers' events

---

## Step 8: Common Integration Issues

### Issue 1: Guards Not Applied
```typescript
// ❌ Missing guards
@Get()
async list() { }

// ✅ Correct
@Get()
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_READ_OWN)
async list() { }
```

### Issue 2: No Data Isolation
```typescript
// ❌ No filter
const projects = await this.prisma.project.findMany();

// ✅ With filter
const filter = this.dataIsolation.getProjectFilter(userId, role);
const projects = await this.prisma.project.findMany({ where: filter });
```

### Issue 3: No Data Sanitization
```typescript
// ❌ Raw data
return project;

// ✅ Sanitized
return this.dataIsolation.sanitizeProjectData(project, role, userId);
```

### Issue 4: Circular Dependency
```typescript
// If you get circular dependency errors, use forwardRef:
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => OtherModule)],
})
```

---

## Step 9: Migration Priority

Migrate in this order for safety:

1. **Read-only endpoints first** (GET)
   - Lower risk
   - Test data isolation
   - Verify filters work

2. **Write endpoints** (POST, PUT, DELETE)
   - Higher risk
   - Verify ownership checks
   - Test permission denials

3. **Critical operations last**
   - Result publishing
   - Assignment management
   - System configuration

---

## Step 10: Deployment Checklist

Before deploying:

- [ ] All controllers have guards applied
- [ ] All data queries use isolation filters
- [ ] All responses are sanitized
- [ ] Permission decorators are correct
- [ ] Ownership guards on PUT/DELETE
- [ ] Tested all roles thoroughly
- [ ] Audit logs are working
- [ ] Documentation updated
- [ ] Team trained on new patterns

---

## Quick Copy-Paste Templates

### Template: Read-only Endpoint
```typescript
@Get()
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_READ_OWN, Permission.RESOURCE_READ_ALL)
async list(@Req() req: any, @Param('eventId') eventId: string) {
  const filter = this.dataIsolation.getResourceFilter(
    req.user.id,
    req.user.role,
    eventId
  );
  return this.service.findMany(filter);
}
```

### Template: Create Endpoint
```typescript
@Post()
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions(Permission.RESOURCE_CREATE)
async create(@Req() req: any, @Body() dto: any) {
  return this.service.create({
    ...dto,
    ownerId: req.user.id
  });
}
```

### Template: Update Endpoint
```typescript
@Put(':id')
@UseGuards(AuthGuard, PermissionsGuard, ResourceOwnershipGuard)
@Permissions(Permission.RESOURCE_UPDATE_OWN, Permission.RESOURCE_UPDATE_ALL)
async update(@Param('id') id: string, @Body() dto: any) {
  return this.service.update(id, dto);
}
```

---

Your integration is now complete! 🎉

Each role operates in complete isolation with no cross-contamination of data.
