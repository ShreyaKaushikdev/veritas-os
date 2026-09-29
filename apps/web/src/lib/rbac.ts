/**
 * Frontend RBAC Utilities
 * Role-based access control for UI elements
 */

export type Role = 'VISITOR' | 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Permission definitions for frontend UI
 */
export const UI_PERMISSIONS = {
  // Navigation
  VIEW_OVERVIEW: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_STORY: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_BALLOTS: ['JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_PARTICIPANT_PANEL: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  VIEW_JUDGE_PANEL: ['JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_ORGANIZER_PANEL: ['ORGANIZER', 'ADMIN'],
  VIEW_TRUST_LEDGER: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_DASHBOARD: ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],

  // Actions
  CREATE_TEAM: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  SUBMIT_PROJECT: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  JUDGE_PROJECT: ['JUDGE', 'ORGANIZER', 'ADMIN'],
  CREATE_BALLOT: ['JUDGE', 'ORGANIZER', 'ADMIN'],
  MANAGE_EVENT: ['ORGANIZER', 'ADMIN'],
  PUBLISH_RESULTS: ['ORGANIZER', 'ADMIN'],
  VIEW_ANALYTICS: ['ORGANIZER', 'ADMIN'],
  
  // Chat
  VIEW_PUBLIC_CHAT: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_TEAM_CHAT: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  MODERATE_CHAT: ['ORGANIZER', 'ADMIN'],

  // Data Access
  VIEW_OWN_PROFILE: ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_ALL_PROFILES: ['ORGANIZER', 'ADMIN'],
  VIEW_OWN_TEAM: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  VIEW_ALL_TEAMS: ['ORGANIZER', 'ADMIN'],
  VIEW_OWN_PROJECTS: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
  VIEW_ASSIGNED_PROJECTS: ['JUDGE', 'ORGANIZER', 'ADMIN'],
  VIEW_ALL_PROJECTS: ['ORGANIZER', 'ADMIN'],
} as const;

/**
 * Check if user has permission
 */
export function hasPermission(userRole: Role | undefined, permission: keyof typeof UI_PERMISSIONS): boolean {
  if (!userRole) return false;
  return (UI_PERMISSIONS[permission] as readonly string[]).includes(userRole);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: Role | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Get current user from localStorage (client-side only)
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('dogfood_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error reading user from localStorage:', e);
  }
  
  return null;
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(route: string, role: Role = 'VISITOR'): boolean {
  const routePermissions: Record<string, Role[]> = {
    '/': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/participant': ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
    '/judge': ['JUDGE', 'ORGANIZER', 'ADMIN'],
    '/organizer': ['ORGANIZER', 'ADMIN'],
    '/admin': ['ADMIN'],
    '/dashboard': ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/overview': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/story': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/gallery': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/ballots': ['JUDGE', 'ORGANIZER', 'ADMIN'],
    '/trust-ledger': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/auth': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/login': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/register': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
    '/verify': ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
  };

  const allowedRoles = routePermissions[route];
  if (!allowedRoles) return true; // Unknown routes are accessible

  return allowedRoles.includes(role);
}

/**
 * Get the default route for authenticated users based on role
 */
export function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'PARTICIPANT':
      return '/participant';
    case 'JUDGE':
      return '/judge';
    case 'ORGANIZER':
      return '/organizer';
    case 'ADMIN':
      return '/dashboard';
    default:
      return '/';
  }
}

/**
 * Role-specific navigation items
 */
export function getNavigationForRole(userRole: Role | undefined): Array<{
  href: string;
  label: string;
  roles: Role[];
  count?: string;
}> {
  const role = userRole || 'VISITOR';

  const allNavItems: Array<{ href: string; label: string; roles: Role[]; count?: string }> = [
    { href: '/', label: 'Overview', roles: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'] },
    { href: '/story', label: 'Story', roles: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'] },
    { href: '/gallery', label: 'Ballots', roles: ['JUDGE', 'ORGANIZER', 'ADMIN'] },
    { href: '/participant', label: 'Idea Coach', roles: ['PARTICIPANT', 'ORGANIZER', 'ADMIN'] },
    { href: '/judge', label: 'Judge (J/K)', roles: ['JUDGE', 'ORGANIZER', 'ADMIN'] },
    { href: '/organizer', label: 'Organizer', roles: ['ORGANIZER', 'ADMIN'] },
    { href: '/verify', label: 'Trust Ledger', roles: ['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'] },
  ];

  return allNavItems.filter(item => item.roles.includes(role));
}

/**
 * Data visibility matrix
 */
export const DATA_VISIBILITY = {
  canSeeOwnProfile: (role: Role) => ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeOtherProfiles: (role: Role) => ['ORGANIZER', 'ADMIN'].includes(role),
  canSeeOwnTeam: (role: Role) => ['PARTICIPANT', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeAllTeams: (role: Role) => ['ORGANIZER', 'ADMIN'].includes(role),
  canSeeTeamInfo: (role: Role) => role !== 'JUDGE', // Judges CANNOT see team info
  canSeeOwnProjects: (role: Role) => ['PARTICIPANT', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeAssignedProjects: (role: Role) => ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeAllProjects: (role: Role) => ['ORGANIZER', 'ADMIN'].includes(role),
  canSeeBallots: (role: Role) => ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeOwnBallots: (role: Role) => ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeAllBallots: (role: Role) => ['ORGANIZER', 'ADMIN'].includes(role),
  canSeePublicChat: (role: Role) => true, // Everyone
  canSeeTeamChat: (role: Role) => ['PARTICIPANT', 'ORGANIZER', 'ADMIN'].includes(role),
  canSeeAnalytics: (role: Role) => ['ORGANIZER', 'ADMIN'].includes(role),
  canSeeJudgeAssignments: (role: Role) => ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(role),
};

/**
 * Role display utilities
 */
export function getRoleColor(role: Role): string {
  switch (role) {
    case 'PARTICIPANT':
      return 'teal';
    case 'JUDGE':
      return 'emerald';
    case 'ORGANIZER':
      return 'amber';
    case 'ADMIN':
      return 'red';
    default:
      return 'gray';
  }
}

export function getRoleBadge(role: Role): string {
  switch (role) {
    case 'PARTICIPANT':
      return 'P';
    case 'JUDGE':
      return 'J';
    case 'ORGANIZER':
      return 'O';
    case 'ADMIN':
      return 'A';
    default:
      return 'V';
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case 'PARTICIPANT':
      return 'Submit projects and collaborate with team';
    case 'JUDGE':
      return 'Evaluate assigned projects';
    case 'ORGANIZER':
      return 'Manage events and results';
    case 'ADMIN':
      return 'System administration';
    default:
      return 'Public access';
  }
}
