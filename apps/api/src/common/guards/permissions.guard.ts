import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { Permission, ROLE_PERMISSIONS } from '../permissions/permission.types';
import { PERMISSIONS_KEY } from '../permissions/permissions.decorator';
import { Role } from '../types';

/**
 * Permissions Guard - Fine-grained RBAC
 * Enforces permission-based access control
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user's role (system-level)
    let userRole: Role = user.role as Role;

    // Check event-level role override if eventId is present
    const eventId = request.params?.eventId || request.body?.eventId || request.query?.eventId;
    
    if (eventId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId,
          },
        },
      });
      
      if (membership) {
        userRole = membership.role as Role;
      }
    }

    // Get permissions for user's role
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Admin has all permissions
    if (userRole === Role.ADMIN) {
      return true;
    }

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );

      // Audit unauthorized access attempt
      try {
        await this.prisma.auditEvent.create({
          data: {
            eventId: eventId || null,
            actorId: user.id,
            actorRole: userRole,
            action: 'PERMISSION_DENIED',
            resourceType: request.url,
            resourceId: request.method,
            reason: `Role '${userRole}' lacks permissions: [${missingPermissions.join(', ')}]`,
            requestId: request.headers['x-request-id'] || 'REQ-PERM-403',
          },
        });
      } catch (e) {
        // Continue to ensure 403 is thrown
      }

      throw new ForbiddenException(
        `Access denied: insufficient permissions. Missing: [${missingPermissions.join(', ')}]`
      );
    }

    return true;
  }
}
