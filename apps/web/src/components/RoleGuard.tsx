/**
 * Role Guard Component
 * Conditionally renders children based on user role
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Role, hasRole, hasPermission, getCurrentUser, UI_PERMISSIONS } from '../lib/rbac';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: keyof typeof UI_PERMISSIONS;
  fallback?: ReactNode;
  showUnauthorized?: boolean;
}

/**
 * RoleGuard Component
 * Only renders children if user has required role or permission
 * 
 * @example
 * <RoleGuard allowedRoles={['JUDGE', 'ORGANIZER']}>
 *   <JudgePanel />
 * </RoleGuard>
 * 
 * @example
 * <RoleGuard requiredPermission="VIEW_BALLOTS">
 *   <BallotsTable />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
  showUnauthorized = false,
}: RoleGuardProps) {
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const userRole = user?.role;

  // Check role-based access
  if (allowedRoles && !hasRole(userRole, allowedRoles)) {
    if (showUnauthorized) {
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <p className="font-semibold">Access Denied</p>
          <p className="text-xs mt-1">
            You need one of these roles: {allowedRoles.join(', ')}
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    if (showUnauthorized) {
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <p className="font-semibold">Insufficient Permissions</p>
          <p className="text-xs mt-1">Required permission: {requiredPermission}</p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ShowForRole Component
 * Simpler version that just shows/hides based on role
 */
export function ShowForRole({
  children,
  roles,
}: {
  children: ReactNode;
  roles: Role[];
}) {
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, []);

  if (!mounted) return null;

  const userRole = user?.role;
  if (!userRole || !roles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HideForRole Component
 * Hides content for specific roles
 */
export function HideForRole({
  children,
  roles,
}: {
  children: ReactNode;
  roles: Role[];
}) {
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, []);

  if (!mounted) return null;

  const userRole = user?.role;
  if (userRole && roles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ParticipantOnly Component
 */
export function ParticipantOnly({ children }: { children: ReactNode }) {
  return <ShowForRole roles={['PARTICIPANT', 'ORGANIZER', 'ADMIN']}>{children}</ShowForRole>;
}

/**
 * JudgeOnly Component
 */
export function JudgeOnly({ children }: { children: ReactNode }) {
  return <ShowForRole roles={['JUDGE', 'ORGANIZER', 'ADMIN']}>{children}</ShowForRole>;
}

/**
 * OrganizerOnly Component
 */
export function OrganizerOnly({ children }: { children: ReactNode }) {
  return <ShowForRole roles={['ORGANIZER', 'ADMIN']}>{children}</ShowForRole>;
}

/**
 * AdminOnly Component
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  return <ShowForRole roles={['ADMIN']}>{children}</ShowForRole>;
}
