/**
 * ============================================================================
 *  ONE FILE FOR EVERY API CALL THE WEBSITE MAKES.
 * ============================================================================
 *
 * WHY THIS FILE EXISTS
 * Pages used to hard-code `http://localhost:4000` in 10+ separate files, so
 * changing servers meant hunting through the whole project. Now every page
 * imports from here and the server address lives on line 1 of the config.
 *
 * THE BACKEND HAS TWO SETS OF ROUTES (this is the thing to understand)
 * ---------------------------------------------------------------------------
 *   LIVE  = `/api/v1/...`   -> real database (PostgreSQL). Needs a login token.
 *                              This is the one you should build against.
 *   DEMO  = everything else  -> demo database (MongoDB). No token needed.
 *                              Fine for trying things out, do not ship on it.
 *
 * Every function below is tagged [LIVE] or [DEMO] so you always know which
 * database you are talking to.
 *
 * HOW TO ADD A NEW API CALL
 * 1. Find the group it belongs to (auth, projects, judging, ...).
 * 2. Add a function with the request type and the response type.
 * 3. Call it from your page.
 * 4. Add a row to API-INTEGRATION.md so the list stays honest.
 *
 * IF THE BACKEND ROUTE DOES NOT EXIST YET
 * The function is listed under "NOT BUILT YET" at the bottom of this file with
 * the exact path you should add on the server.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

const TOKEN_KEY = 'dogfood_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('dogfood_token') || window.localStorage.getItem('dogfood_auth_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem('dogfood_token', token);
    window.localStorage.setItem('dogfood_auth_token', token);
  } else {
    window.localStorage.removeItem('dogfood_token');
    window.localStorage.removeItem('dogfood_auth_token');
  }
}

/** Thrown when something goes wrong. `.status` is the HTTP code (0 = no connection). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Send the saved login token. Required by every `/api/v1` route. */
  auth?: boolean;
};

/** Low-level call used by everything below. Pages should not call this directly. */
export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError('Please sign in first.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_BASE_URL}. Is the API running?`, 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const body = data as { message?: string | string[] } | null;
    const message =
      (Array.isArray(body?.message) ? body.message[0] : body?.message) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

/* ========================================================================== */
/* SHARED TYPES - match what the server sends back.                            */
/* ========================================================================== */

export type Role = 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthResult = { token: string; expiresAt: string; user: User };

export type Project = {
  id: string;
  title: string;
  tagline: string;
  track: string;
  rank: number;
  elo: number;
  eloShift?: string;
  meanScore: number;
  repoUrl?: string;
  commitSha?: string;
  teamMembers?: string[];
  criteriaScores?: Record<string, number>;
  createdAt?: string;
};

export type Ballot = {
  id: string;
  projectId: string;
  judgeId: string;
  score: number;
  status: 'LOCKED' | 'IN_PROGRESS' | 'DISPUTED' | 'VOIDED' | 'RECUSED' | 'SUBMITTED';
  criteria?: Record<string, number>;
  notes?: string;
  signatureSha256?: string;
  submittedAt?: string;
  createdAt?: string;
};

export type Dispute = {
  id: string;
  projectId?: string;
  status: string;
  reason?: string;
  resolution?: string;
  createdAt?: string;
};

export type TrustBlock = {
  blockHeight: number;
  previousHash?: string;
  stateRootSha256: string;
  ballotCount: number;
  timestamp: string;
  zkProof?: string;
};

export type TrackBreakdown = { name: string; ballots: number; percentage: number };

/* ========================================================================== */
/* SIGN IN AND ACCOUNTS                                                       */
/* Route file: apps/api/src/auth/auth.controller.ts                           */
/* Used by: components/AuthModal.tsx, components/Navbar.tsx                   */
/* ========================================================================== */

export const auth = {
  /** Create an account. `role` decides what the person can do. */
  register: (body: { email: string; password: string; name: string; role?: Role }) =>
    apiFetch<AuthResult>('/api/v1/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResult>('/api/v1/auth/login', { method: 'POST', body }),

  /** Sign in with Google. Send Google's credential token. */
  loginWithGoogle: (body: {
    credential?: string;
    token?: string;
    email?: string;
    name?: string;
    googleId?: string;
  }) => apiFetch<AuthResult>('/api/v1/auth/google', { method: 'POST', body }),

  logout: () => apiFetch<{ success: boolean }>('/api/v1/auth/logout', { method: 'POST', auth: true }),

  /** Who am I? Used to show the name in the top bar. */
  me: () => apiFetch<User>('/api/v1/auth/me', { auth: true }),
};

/* ========================================================================== */
/* EVENTS - "which hackathon are we in?"                                       |
| Route file: apps/api/src/events/events.controller.ts                         |
| NOTE: almost every LIVE call below needs an eventId. Get it from events.list()|
| ========================================================================== */

export type HackathonEvent = {
  id: string;
  name: string;
  slug?: string;
  status: string;
  currentRound?: number;
};

export const events = {
  /** All hackathons. Call this first to get an `eventId`. */
  list: async () => {
    const res = await apiFetch<any>('/api/v1/events');
    if (Array.isArray(res)) return { events: res };
    return res?.events ? res : { events: [] };
  },

  get: (eventId: string) => apiFetch<HackathonEvent>(`/api/v1/events/${eventId}`, { auth: true }),

  /** Create a new hackathon. Organizers only. */
  create: (body: Record<string, unknown>) =>
    apiFetch<HackathonEvent>('/api/v1/events', { method: 'POST', body, auth: true }),

  /** Move the hackathon between states: REGISTRATION -> SUBMISSION -> JUDGING -> RESULTS. */
  setStatus: (eventId: string, status: string, reason?: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/status`, {
      method: 'POST',
      body: { status, reason },
      auth: true,
    }),

  /** Turn autopilot on or off: OFF | SUGGEST | ASSIST | AUTONOMOUS. */
  setAutopilotMode: (eventId: string, mode: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/autopilot`, {
      method: 'POST',
      body: { mode },
      auth: true,
    }),

  /** Copy an event so you can run the same hackathon again. */
  clone: (eventId: string, newSlug: string, newName: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/clone`, {
      method: 'POST',
      body: { newSlug, newName },
      auth: true,
    }),

  /** Big overview for the organizer dashboard. */
  commandCenter: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/command-center`, { auth: true }),

  /** Everyone who signed up, as a downloadable file. */
  audienceCsv: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/audience/csv`, { auth: true }),

  /** Send a message to everyone who signed up. */
  broadcast: (eventId: string, body: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/audience/broadcast`, {
      method: 'POST',
      body,
      auth: true,
    }),
};

/* ========================================================================== */
/* TEAMS                                                                       */
/* Route file: apps/api/src/teams/teams.controller.ts                           */
/* Used by: app/participant/page.tsx                                            */
/* ========================================================================== */

export const teams = {
  create: (eventId: string, name: string) =>
    apiFetch<unknown>('/api/v1/teams', { method: 'POST', body: { eventId, name }, auth: true }),

  /** Join a friend's team using their invite code. */
  join: (inviteCode: string) =>
    apiFetch<unknown>('/api/v1/teams/join', { method: 'POST', body: { inviteCode }, auth: true }),

  get: (teamId: string) => apiFetch<unknown>(`/api/v1/teams/${teamId}`, { auth: true }),

  /** "My team" for this event. Shows on the participant page. */
  mine: (eventId: string) => apiFetch<unknown>(`/api/v1/teams/event/${eventId}/me`, { auth: true }),
};

/* ========================================================================== */
/* PROJECTS AND SUBMISSIONS                                                    */
/* Route files: submissions.controller.ts [LIVE], projects-mongo.controller.ts [DEMO]|
| Used by: app/gallery/page.tsx, app/participant/page.tsx                      |
| ========================================================================== */

export const submissions = {
  /** Save your work in progress. Keeps updating the same draft. */
  saveDraft: (body: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/submissions', { method: 'POST', body, auth: true }),

  /** "I'm finished - lock it in." After this you cannot edit. */
  freeze: (submissionId: string, body: Record<string, unknown> = {}) =>
    apiFetch<unknown>(`/api/v1/submissions/${submissionId}/freeze`, {
      method: 'POST',
      body,
      auth: true,
    }),

  get: (submissionId: string) => apiFetch<unknown>(`/api/v1/submissions/${submissionId}`, { auth: true }),

  /** The real project gallery. Supports search + track filter. */
  gallery: (eventId: string, params: { trackId?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.trackId) query.set('trackId', params.trackId);
    if (params.search) query.set('search', params.search);
    const suffix = query.toString() ? `?${query}` : '';
    return apiFetch<{ projects: Project[] }>(`/api/v1/submissions/event/${eventId}/gallery${suffix}`, {
      auth: true,
    });
  },

  /** Tells the team what is missing or broken before they submit. */
  healthCheck: (submissionId: string) =>
    apiFetch<{ status: string; issues: string[] }>(`/api/v1/submissions/${submissionId}/health-check`, {
      auth: true,
    }),
};

/* --- DEMO versions (MongoDB). Swap these out for the LIVE ones above. ------ */

export const projects = {
  list: (params: { track?: string; search?: string; sort?: 'rank' | 'elo' | 'title' } = {}) => {
    const query = new URLSearchParams();
    if (params.track && params.track !== 'ALL') query.set('track', params.track);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    const suffix = query.toString() ? `?${query}` : '';
    return apiFetch<{ count: number; trackFilter: string; data: Project[] }>(`/projects${suffix}`);
  },

  get: (id: string) => apiFetch<Project & { ballots: Ballot[] }>(`/projects/${id}`),

  create: (body: {
    title: string;
    tagline: string;
    track: string;
    repoUrl?: string;
    teamMembers: string[];
  }) => apiFetch<{ success: boolean; message: string; project: Project }>('/projects', {
    method: 'POST',
    body,
  }),

  /** Download everything as one file. */
  exportAll: () =>
    apiFetch<{
      exportedAt: string;
      counts: { projects: number; ballots: number; disputes: number; blocks: number };
      data: { projects: Project[]; ballots: Ballot[]; disputes: Dispute[]; trustLedger: TrustBlock[] };
    }>('/projects/export/json'),

  trackLeaderboard: () =>
    apiFetch<{
      success: boolean;
      tracks: {
        track: string;
        projectCount: number;
        avgElo: number;
        avgScore: number;
        leader: { id: string; title: string; elo: number } | null;
      }[];
    }>('/projects/leaderboard/tracks'),
};

/* ========================================================================== */
/* THE SCOREBOARD NUMBERS                                                      |
| Route file: database.controller.ts [DEMO]                                     |
| Used by: app/page.tsx, app/dashboard/page.tsx, app/story/page.tsx, Navbar     |
| ========================================================================== */

export type DashboardStats = {
  event: { id: string; name: string; currentRound: number; status: string };
  disputes: Dispute[];
  telemetry: {
    teamsRegistered: number;
    assignedBallots: number;
    ballotsSubmitted: number;
    ballotsRemaining: number;
    reviewCompletionPercentage: number;
    calibratedMeanScore: number;
    disputesFlagged: number;
    ballotsVoided: number;
    recusalsHandled: number;
    tiesBroken: number;
    scoresLocked: number;
    organizerBroadcasts: number;
    tracksBreakdown: TrackBreakdown[];
  };
  workerSync: { status: string; workersOnline: number; syncLatencyMs: number };
};

export const dashboard = {
  stats: () => apiFetch<DashboardStats>('/dashboard/stats'),
};

export const database = {
  /** The green or red "data connected" box on the Dashboard. */
  status: () =>
    apiFetch<{
      status: 'CONNECTED' | 'DISCONNECTED';
      message?: string;
      database?: string;
      collections?: { projects: number; ballots: number; disputes: number; trust_ledger: number };
      serverTime?: string;
    }>('/database/status'),

  /** "Clear demo data" - wipes the demo database. Keep it hard to click by accident. */
  clear: () => apiFetch<{ success: boolean; message: string }>('/database/clear', { method: 'POST' }),

  /** Put the demo data back. */
  reseed: () => apiFetch<{ success: boolean; message: string }>('/database/reseed', { method: 'POST' }),
};

/* ========================================================================== */
/* JUDGING                                                                      |
| Route files: judging.controller.ts [LIVE], projects-mongo.controller.ts [DEMO]|
| Used by: app/judge/page.tsx                                                  |
| ========================================================================== */

/** [LIVE] The real judging flow. Use these. */
export const judging = {
  /** The scoring questions and how much each one counts. */
  rubric: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/rubric`, { auth: true }),

  /** Stop judges changing the questions after this point. */
  lockRubric: (eventId: string, rubricVersionId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/rubric/lock`, {
      method: 'POST',
      body: { rubricVersionId },
      auth: true,
    }),

  /** Example projects that show what a 3, a 7 and a 9 look like. */
  anchors: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/anchors`, { auth: true }),

  /** Check the judges all agree before real judging starts. */
  recordCalibration: (eventId: string, scores: Record<string, number>) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/calibration`, {
      method: 'POST',
      body: { scores },
      auth: true,
    }),

  /** "Projects you have been asked to judge." */
  myAssignments: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/assignments/me`, { auth: true }),

  /** Give a project a score. The main Judge page button. */
  submitBallot: (eventId: string, body: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/ballots`, {
      method: 'POST',
      body,
      auth: true,
    }),

  /** Decide which projects each judge gets. Organizers only. */
  generateAssignments: (eventId: string, minReviews = 3) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/assignments/generate`, {
      method: 'POST',
      body: { minReviews },
      auth: true,
    }),

  /** "I know this team, I should not judge them." */
  recuse: (eventId: string, body: { projectId: string; reason: string; note?: string }) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/recuse`, {
      method: 'POST',
      body,
      auth: true,
    }),

  /** Head to head: "which of these two is better?" Used to settle close scores. */
  pairwise: (eventId: string, body: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/pairwise`, {
      method: 'POST',
      body,
      auth: true,
    }),

  /** The next head-to-head pair waiting for this judge. */
  pairwiseQueue: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/judging/pairwise/queue`, { auth: true }),
};

/** [DEMO] No sign-in needed. Fine for a demo, replace with `judging` above. */
export const judgingDemo = {
  listBallots: (status?: Ballot['status']) =>
    apiFetch<{ count: number; data: Ballot[] }>(
      status ? `/judging/ballots?status=${status}` : '/judging/ballots',
    ),

  submitBallot: (body: {
    projectId: string;
    judgeId: string;
    score: number;
    criteria: { technicalDepth: number; novelty: number; feasibility: number; impact: number };
    notes?: string;
  }) =>
    apiFetch<{ success: boolean; ballotId: string; signatureSha256: string; message: string }>(
      '/judging/ballots',
      { method: 'POST', body },
    ),

  pairwise: (body: {
    projectAId: string;
    projectBId: string;
    winnerId: string;
    judgeId: string;
    reason?: string;
  }) => apiFetch<{ success: boolean; duelResult: unknown; message: string }>('/judging/pairwise', {
    method: 'POST',
    body,
  }),

  recuse: (body: { judgeId: string; projectId: string; reason: string }) =>
    apiFetch<{
      success: boolean;
      latencyMs: number;
      previousJudge: string;
      assignedBackupJudge: string;
      message: string;
    }>('/judging/recuse', { method: 'POST', body }),
};

/* ========================================================================== */
/* DISPUTES - "I think this score is wrong"                                     */
/* Route file: projects-mongo.controller.ts [DEMO]                                */
/* Used by: app/judge/page.tsx, app/dashboard/page.tsx                          */
/* ========================================================================== */

export const disputes = {
  list: () => apiFetch<{ count: number; disputes: Dispute[] }>('/judging/disputes'),

  /** resolution is one of: SPLIT_DIFF | DISCARD_OUTLIER | ARBITRATION_OVERRIDE */
  resolve: (id: string, body: { resolution: string; arbitratorId: string; adjustment?: number }) =>
    apiFetch<{ success: boolean; disputeId: string; resolution: string; message: string }>(
      `/judging/disputes/${id}/resolve`,
      { method: 'POST', body },
    ),
};

/* ========================================================================== */
/* TRUST RECORD - the "proof nothing was changed" list                          |
| Route files: trust.controller.ts [LIVE], projects-mongo.controller.ts [DEMO]  |
| Used by: app/verify/page.tsx, app/dashboard/page.tsx, 3d/IntegrityChainScene  |
| ========================================================================== */

export const trust = {
  /** [LIVE] Check the whole chain for one event. */
  verifyChain: (eventId: string) => apiFetch<unknown>(`/api/v1/trust/verify/${eventId}`, { auth: true }),

  /** [LIVE] Every action that happened, in order. */
  auditTrail: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/audit-trail`, { auth: true }),

  /** [LIVE] Download the signed record. */
  exportBundle: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/export`, { auth: true }),

  /** [DEMO] The block list. */
  ledger: () => apiFetch<{ chainLength: number; blocks: TrustBlock[] }>('/trust/ledger'),

  /** [DEMO] "Lock this round" - freezes every score into one block. */
  commitBlock: () =>
    apiFetch<{ success: boolean; blockHeight: number; stateRoot: string; ballotCount: number; message: string }>(
      '/trust/commit',
      { method: 'POST' },
    ),

  /** [DEMO] Check one receipt. */
  verifyReceipt: (receiptId: string) =>
    apiFetch<{ verified: boolean; receiptId: string; ballotFound: boolean; stateRoot: string; message: string }>(
      `/trust/verify/${encodeURIComponent(receiptId)}`,
    ),
};

/* ========================================================================== */
/* RESULTS                                                                      |
| Route file: ranking.controller.ts [LIVE]                                      |
| Used by: app/dashboard/page.tsx, 3d/DefensiblePodiumScene                     |
| ========================================================================== */

export const ranking = {
  /** [LIVE] What the results would look like right now. Organizers only. */
  preview: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/preview`, { auth: true }),

  /** [LIVE] Try different score weights before you commit to them. */
  simulateWeights: (eventId: string, weights: Record<string, number>) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/simulate-weights`, {
      method: 'POST',
      body: { weights },
      auth: true,
    }),

  /** [LIVE] "Show the work" - explains how the final scores were worked out. */
  normalizationProof: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/normalization-proof`, { auth: true }),

  /** [LIVE] Make the results visible to everyone. */
  publish: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/publish`, { method: 'POST', auth: true }),

  /** [LIVE] The scoreboard everyone can see. */
  published: (eventId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/published`, { auth: true }),

  /** [LIVE] An organizer signs off on the results. */
  signOff: (eventId: string, runId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/${runId}/sign-off`, {
      method: 'POST',
      auth: true,
    }),

  /** [LIVE] "How did we do?" - only the team who made the project can see it. */
  projectFeedback: (eventId: string, projectId: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/ranking/projects/${projectId}/feedback`, { auth: true }),
};

/* ========================================================================== */
/* "IS MY IDEA REALISTIC?" - the participant helper                             |
| Route file: intelligence.controller.ts [LIVE]                                 |
| Used by: app/participant/page.tsx                                             |
| ========================================================================== */

export type IdeaReport = {
  id?: string;
  projectId?: string;
  scopePressure: 'ACHIEVABLE' | 'AT_RISK' | 'UNREALISTIC';
  scopeReason: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceReason: string;
  criteriaBands: Record<string, { band: string; reason: string }>;
};

export const intelligence = {
  /** The "Check my idea" button. Returns honest feedback, not a grade. */
  createReport: (eventId: string, body: {
    ideaTitle: string;
    ideaDescription: string;
    techStack: string;
    features: string[];
    teamHours: number;
    teamSkills?: string[];
    projectId?: string;
  }) => apiFetch<IdeaReport>(`/api/v1/events/${eventId}/idea-reports`, {
    method: 'POST',
    body,
    auth: true,
  }),

  getReport: (eventId: string, reportId: string) =>
    apiFetch<IdeaReport>(`/api/v1/events/${eventId}/idea-reports/${reportId}`, { auth: true }),

  deleteReport: (eventId: string, reportId: string) =>
    apiFetch<{ success: boolean }>(`/api/v1/events/${eventId}/idea-reports/${reportId}`, {
      method: 'DELETE',
      auth: true,
    }),
};

/* ========================================================================== */
/* ORGANIZER AUTOPILOT - "write the announcement for me"                       |
| Route file: database/autopilot.controller.ts [DEMO]                            |
| Used by: app/organizer/page.tsx                                               |
| ========================================================================== */

export const autopilot = {
  /** The ready-made message templates. */
  presets: () => apiFetch<{ presets: unknown[] }>('/autopilot/presets'),

  /** "Draft the announcement" - writes a first draft you can edit. */
  synthesize: (body: Record<string, unknown>) =>
    apiFetch<{ success: boolean; draft?: string; message?: string }>('/autopilot/synthesize', {
      method: 'POST',
      body,
    }),

  /** "Send it to everyone." */
  apply: (body: Record<string, unknown>) =>
    apiFetch<{ success: boolean; message?: string }>('/autopilot/apply', { method: 'POST', body }),
};

/* ========================================================================== */
/* HELP - the red "Need help?" button                                           |
| Route file: support.controller.ts [LIVE]                                      |
| Used by: components/SOSBeacon.tsx                                            */
/* ========================================================================== */

export const support = {
  /**
   * Red SOS button. Works out how urgent it is on its own, then emails the
   * organizers. Tell it which page the person was on so help can find them.
   */
  fileTicket: (body: {
    eventId: string;
    page: string;
    eventPhase?: string;
    message: string;
    screenshotKey?: string;
    context?: Record<string, unknown>;
  }) =>
    apiFetch<{
      success: boolean;
      ticketId: string;
      ticketRef: string;
      priority: 'URGENT' | 'HIGH' | 'NORMAL';
      status: string;
      ackMessage: string;
      isSpike: boolean;
      recentTicketsCount: number;
      emailDispatched: { subject: string; to: string; body: string };
    }>(`/api/v1/events/${body.eventId}/support`, { method: 'POST', body, auth: true }),

  /** Organizer view: every help request for the event. */
  inbox: (eventId: string) =>
    apiFetch<{
      total: number;
      spikeDetected: boolean;
      spikeCount: number;
      tickets: Record<string, unknown>[];
    }>(`/api/v1/events/${eventId}/support`, { auth: true }),

  /** "My requests." */
  mine: () => apiFetch<Record<string, unknown>[]>('/api/v1/support/mine', { auth: true }),

  /** Organizer marks a request as handled. */
  updateTicket: (eventId: string, ticketId: string, body: { status?: string; priority?: string; internalNote?: string }) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/support/${ticketId}`, {
      method: 'PATCH',
      body,
      auth: true,
    }),
};

/* ========================================================================== */
/* CHAT between judges and organizers                                           |
| Route file: chat.controller.ts [LIVE]                                         |
| Used by: app/judge/page.tsx                                                   |
| ========================================================================== */

export const chat = {
  list: (eventId: string, projectId?: string) =>
    apiFetch<{ messages: Record<string, unknown>[] }>(
      projectId
        ? `/api/v1/events/${eventId}/chat?projectId=${projectId}`
        : `/api/v1/events/${eventId}/chat`,
      { auth: true },
    ),

  send: (eventId: string, body: string, projectId?: string) =>
    apiFetch<unknown>(`/api/v1/events/${eventId}/chat`, {
      method: 'POST',
      body: { body, projectId },
      auth: true,
    }),
};

/* ========================================================================== */
/* NOT BUILT YET                                                               */
/*                                                                            */
/* These buttons show on screen but have no server route behind them.          */
/* Each line is the exact path to add. See API-INTEGRATION.md.                 */
/* ========================================================================== */

export const NOT_BUILT = {
  /** Verify page: upload a file and have it checked. */
  scanArtifact: 'Add POST /api/v1/verify/scan - accepts the file, returns pass/fail per check.',
  /** Verify page: "Download the signed record" button. */
  exportVerification: 'Add GET /api/v1/verify/export - returns a downloadable signed file.',
  /** Home page: the scrolling list of recent activity. */
  liveActivityFeed: 'Add GET /api/v1/activity - returns the last N things that happened.',
  /** Gallery: the speed comparison bar. */
  speedBenchmark: 'Add GET /api/v1/projects/benchmark - returns load-test numbers per project.',
  /** Story page: the animated numbers. */
  impactMetrics: 'Add GET /api/v1/impact - returns real totals for projects, judges and countries.',
} as const;
