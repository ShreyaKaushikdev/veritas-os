/**
 * RBAC Permission System
 * Defines fine-grained permissions for multi-tenant architecture
 */

export enum Permission {
  // User Management
  USER_READ_OWN = 'user:read:own',
  USER_UPDATE_OWN = 'user:update:own',
  USER_DELETE_OWN = 'user:delete:own',
  USER_READ_ALL = 'user:read:all',
  USER_UPDATE_ALL = 'user:update:all',
  USER_DELETE_ALL = 'user:delete:all',

  // Event Management
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_MANAGE_SETTINGS = 'event:manage:settings',
  EVENT_VIEW_ANALYTICS = 'event:view:analytics',

  // Team Management
  TEAM_CREATE = 'team:create',
  TEAM_READ_OWN = 'team:read:own',
  TEAM_UPDATE_OWN = 'team:update:own',
  TEAM_DELETE_OWN = 'team:delete:own',
  TEAM_READ_ALL = 'team:read:all',
  TEAM_MANAGE_MEMBERS = 'team:manage:members',

  // Project/Submission Management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ_OWN = 'project:read:own',
  PROJECT_UPDATE_OWN = 'project:update:own',
  PROJECT_DELETE_OWN = 'project:delete:own',
  PROJECT_READ_ASSIGNED = 'project:read:assigned', // For judges
  PROJECT_READ_ALL = 'project:read:all',
  PROJECT_UPDATE_ALL = 'project:update:all',
  PROJECT_FREEZE = 'project:freeze',

  // Judging
  BALLOT_CREATE = 'ballot:create',
  BALLOT_READ_OWN = 'ballot:read:own',
  BALLOT_UPDATE_OWN = 'ballot:update:own',
  BALLOT_SUBMIT = 'ballot:submit',
  BALLOT_READ_ALL = 'ballot:read:all',
  BALLOT_MANAGE = 'ballot:manage',

  // Assignment Management
  ASSIGNMENT_VIEW_OWN = 'assignment:view:own',
  ASSIGNMENT_CREATE = 'assignment:create',
  ASSIGNMENT_MANAGE = 'assignment:manage',

  // Rubric Management
  RUBRIC_READ = 'rubric:read',
  RUBRIC_CREATE = 'rubric:create',
  RUBRIC_UPDATE = 'rubric:update',
  RUBRIC_DELETE = 'rubric:delete',

  // Ranking & Results
  RANKING_VIEW_PUBLIC = 'ranking:view:public',
  RANKING_VIEW_FULL = 'ranking:view:full',
  RANKING_CREATE = 'ranking:create',
  RANKING_PUBLISH = 'ranking:publish',

  // Support & Tickets
  TICKET_CREATE = 'ticket:create',
  TICKET_READ_OWN = 'ticket:read:own',
  TICKET_READ_ALL = 'ticket:read:all',
  TICKET_MANAGE = 'ticket:manage',

  // Chat
  CHAT_READ_PUBLIC = 'chat:read:public',
  CHAT_READ_PROJECT = 'chat:read:project',
  CHAT_READ_ALL = 'chat:read:all',
  CHAT_SEND = 'chat:send',
  CHAT_MODERATE = 'chat:moderate',

  // Audit & Logs
  AUDIT_READ = 'audit:read',
  AUDIT_MANAGE = 'audit:manage',

  // System Admin
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIGURE = 'system:configure',
}

/**
 * Role-based Permission Matrix
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  VISITOR: [
    Permission.EVENT_READ,
    Permission.RANKING_VIEW_PUBLIC,
    Permission.CHAT_READ_PUBLIC,
  ],

  PARTICIPANT: [
    Permission.USER_READ_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.EVENT_READ,
    Permission.TEAM_CREATE,
    Permission.TEAM_READ_OWN,
    Permission.TEAM_UPDATE_OWN,
    Permission.TEAM_DELETE_OWN,
    Permission.TEAM_MANAGE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ_OWN,
    Permission.PROJECT_UPDATE_OWN,
    Permission.PROJECT_DELETE_OWN,
    Permission.RUBRIC_READ,
    Permission.RANKING_VIEW_PUBLIC,
    Permission.TICKET_CREATE,
    Permission.TICKET_READ_OWN,
    Permission.CHAT_READ_PUBLIC,
    Permission.CHAT_READ_PROJECT,
    Permission.CHAT_SEND,
  ],

  JUDGE: [
    Permission.USER_READ_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.EVENT_READ,
    Permission.PROJECT_READ_ASSIGNED, // Only assigned projects
    Permission.BALLOT_CREATE,
    Permission.BALLOT_READ_OWN,
    Permission.BALLOT_UPDATE_OWN,
    Permission.BALLOT_SUBMIT,
    Permission.ASSIGNMENT_VIEW_OWN,
    Permission.RUBRIC_READ,
    Permission.TICKET_CREATE,
    Permission.TICKET_READ_OWN,
    Permission.CHAT_READ_PUBLIC,
    // Note: Judges CANNOT see participant projects unless assigned
    // Judges CANNOT see organizer panel
  ],

  ORGANIZER: [
    Permission.USER_READ_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_MANAGE_SETTINGS,
    Permission.EVENT_VIEW_ANALYTICS,
    Permission.TEAM_READ_ALL,
    Permission.PROJECT_READ_ALL,
    Permission.PROJECT_UPDATE_ALL,
    Permission.PROJECT_FREEZE,
    Permission.BALLOT_READ_ALL,
    Permission.BALLOT_MANAGE,
    Permission.ASSIGNMENT_CREATE,
    Permission.ASSIGNMENT_MANAGE,
    Permission.RUBRIC_CREATE,
    Permission.RUBRIC_READ,
    Permission.RUBRIC_UPDATE,
    Permission.RUBRIC_DELETE,
    Permission.RANKING_VIEW_FULL,
    Permission.RANKING_CREATE,
    Permission.RANKING_PUBLISH,
    Permission.TICKET_READ_ALL,
    Permission.TICKET_MANAGE,
    Permission.CHAT_READ_ALL,
    Permission.CHAT_MODERATE,
    Permission.AUDIT_READ,
  ],

  ADMIN: [
    ...Object.values(Permission), // Admin has all permissions
  ],
};

/**
 * Data Isolation Rules
 * Defines what data each role can see
 */
export interface DataIsolationRule {
  role: string;
  canSee: {
    users: string[];
    projects: string[];
    ballots: string[];
    teams: string[];
    events: string[];
    tickets: string[];
    chat: string[];
  };
}

export const DATA_ISOLATION_RULES: Record<string, DataIsolationRule> = {
  VISITOR: {
    role: 'VISITOR',
    canSee: {
      users: [], // No user data
      projects: ['public-only'], // Only published projects
      ballots: [], // No ballot access
      teams: [], // No team data
      events: ['public-info-only'], // Basic event info only
      tickets: [], // No tickets
      chat: ['public-lounge'], // Public chat only
    },
  },

  PARTICIPANT: {
    role: 'PARTICIPANT',
    canSee: {
      users: ['own-profile'], // Only their profile
      projects: ['own-team-projects'], // Only their team's projects
      ballots: [], // Cannot see any ballots
      teams: ['own-teams'], // Only teams they're member of
      events: ['enrolled-events'], // Events they're enrolled in
      tickets: ['own-tickets'], // Only their tickets
      chat: ['public-lounge', 'own-team-channel'], // Public + team chat
    },
  },

  JUDGE: {
    role: 'JUDGE',
    canSee: {
      users: ['own-profile'], // Only their profile
      projects: ['assigned-projects-only'], // ONLY assigned projects
      ballots: ['own-ballots'], // Only their own ballots
      teams: [], // CANNOT see team information
      events: ['judging-events'], // Events they're judging
      tickets: ['own-tickets'], // Only their tickets
      chat: ['public-lounge'], // Only public chat, NO team chats
    },
  },

  ORGANIZER: {
    role: 'ORGANIZER',
    canSee: {
      users: ['event-participants', 'event-judges'], // All event users
      projects: ['all-event-projects'], // All projects in their events
      ballots: ['all-event-ballots'], // All ballots in their events
      teams: ['all-event-teams'], // All teams in their events
      events: ['organized-events'], // Events they organize
      tickets: ['all-event-tickets'], // All tickets for their events
      chat: ['all-event-channels'], // All chat in their events
    },
  },

  ADMIN: {
    role: 'ADMIN',
    canSee: {
      users: ['all'], // All users system-wide
      projects: ['all'], // All projects
      ballots: ['all'], // All ballots
      teams: ['all'], // All teams
      events: ['all'], // All events
      tickets: ['all'], // All tickets
      chat: ['all'], // All chat channels
    },
  },
};
