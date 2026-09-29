import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, accessible to all (including VISITOR)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if VISITOR role is explicitly permitted
    if (!user) {
      if (requiredRoles.includes(Role.VISITOR)) {
        return true;
      }
      throw new UnauthorizedException('Authentication required for this resource');
    }

    // Role hierarchy / event role override
    const userRole = user.role as Role;
    
    // ADMIN has root capability across all events
    if (userRole === Role.ADMIN) {
      return true;
    }

    // Check event-level role if eventId is present in params
    const eventId = request.params?.eventId || request.body?.eventId;
    let effectiveRole: Role = userRole;

    if (eventId && user) {
      try {
        const membership = await this.prisma.membership.findFirst({
          where: {
            userId: user.id,
            eventId: eventId,
          },
        });
        if (membership) {
          effectiveRole = membership.role as Role;
        }
      } catch (e) {
        // Keep base userRole
      }
    }

    const hasPermission = requiredRoles.includes(effectiveRole) || (effectiveRole === Role.ORGANIZER && requiredRoles.includes(Role.JUDGE));

    if (!hasPermission) {
      // Record Security Audit Event for Unauthorized Escalation / Access Attempt
      try {
        await this.prisma.auditEvent.create({
          data: {
            eventId: eventId || null,
            actorId: user.id,
            actorRole: userRole,
            action: 'UNAUTHORIZED_ACCESS_BLOCKED',
            resourceType: request.url,
            resourceId: request.method,
            reason: `Role ${effectiveRole} attempted access to route requiring [${requiredRoles.join(', ')}]`,
            requestId: request.headers['x-request-id'] || 'REQ-SEC-403',
          },
        });
      } catch (e) {
        // Continue to ensure 403 is thrown even if audit write fails
      }

      throw new ForbiddenException(`Access denied: role '${effectiveRole}' lacks permission for this action`);
    }

    return true;
  }
}
