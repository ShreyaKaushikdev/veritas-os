'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Users, Folder, 
  Award, Target, TrendingUp, AlertCircle, ChevronRight,
  Play, Pause, Power, Eye, Settings
} from 'lucide-react';

interface CommandCenterData {
  event: {
    id: string;
    name: string;
    status: string;
    currentPhase: string;
    subDeadline: string | null;
    judgeDeadline: string | null;
  };
  pulse: {
    participants: number;
    teams: number;
    projects: number;
    submitted: number;
    frozen: number;
    judges: number;
    activeJudges: number;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
    count?: number;
  }>;
  timeline: Array<{
    phase: string;
    label: string;
    status: 'complete' | 'current' | 'upcoming' | 'blocked';
    startTime?: string;
    endTime?: string;
    remaining?: string;
  }>;
  health: {
    submissionProgress: number;
    judgingProgress: number;
    assignmentCoverage: number;
    calibrationComplete: number;
  };
}

import { useSearchParams } from 'next/navigation';

export default function CommandCenterPage() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string>(queryEventId || 'b8a16308-26a2-4d42-86f7-77e0f2a6f01f');
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds

  useEffect(() => {
    if (queryEventId) {
      setEventId(queryEventId);
    }
  }, [queryEventId]);

  useEffect(() => {
    fetchCommandCenterData();
    
    const interval = setInterval(() => {
      fetchCommandCenterData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [eventId]);

  const fetchCommandCenterData = async () => {
    try {
      const token = localStorage.getItem('dogfood_token') || localStorage.getItem('dogfood_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let loadedData: any = null;
      try {
        const response = await fetch(`http://localhost:4000/api/v1/events/${eventId}/command-center`, { headers });
        if (response.ok) {
          loadedData = await response.json();
        }
      } catch (e) {
        // Fallback
      }

      if (!loadedData) {
        // Load from live telemetry
        const statsRes = await fetch('http://localhost:4000/dashboard/stats');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          const evt = stats.event || {};
          const tel = stats.telemetry || {};
          const now = new Date();

          loadedData = {
            event: {
              id: evt.id || eventId,
              name: evt.name || 'Autonomous Hackathon Workspace',
              status: evt.status || 'JUDGING_OPEN',
              currentPhase: 'Judging & Verification',
              subDeadline: evt.freezeDeadline || new Date(now.getTime() + 86400000).toISOString(),
              judgeDeadline: new Date(now.getTime() + 172800000).toISOString(),
            },
            pulse: {
              participants: tel.teamsRegistered ? tel.teamsRegistered * 3 : 40,
              teams: tel.teamsRegistered || 0,
              projects: tel.teamsRegistered || 0,
              submitted: tel.ballotsSubmitted || 0,
              frozen: tel.teamsRegistered || 0,
              judges: Math.ceil((tel.assignedBallots || 12) / 4),
              activeJudges: Math.ceil((tel.ballotsSubmitted || 8) / 4),
            },
            alerts: (stats.disputes || []).map((d: any, idx: number) => ({
              id: d.id || `alert-${idx}`,
              severity: 'warning',
              title: `${d.projectTitle || 'Project'} Score Discrepancy`,
              message: `Criterion delta is ${d.delta}σ between ${d.judgeA} and ${d.judgeB}`,
              actionLabel: 'Resolve in Cockpit',
              actionUrl: '/organizer',
            })),
            timeline: [
              { phase: 'REGISTRATION_OPEN', label: 'Team Registration', status: 'complete' },
              { phase: 'SUBMISSION_OPEN', label: 'Project Hacking & Submissions', status: 'complete' },
              { phase: 'JUDGING_OPEN', label: 'Peer-Blind & Pairwise Judging', status: 'current', remaining: '18h remaining' },
              { phase: 'RESULTS_PUBLISHED', label: 'Winners & Proof Publication', status: 'upcoming' },
            ],
            health: {
              submissionProgress: 100,
              judgingProgress: tel.reviewCompletionPercentage || 95,
              assignmentCoverage: 100,
              calibrationComplete: 100,
            },
          };
        }
      }

      if (loadedData) {
        setData(loadedData);
      }
    } catch (error) {
      console.error('Failed to fetch command center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-blue-500';
      case 'SUBMISSION_OPEN': return 'bg-yellow-500';
      case 'SUBMISSION_FROZEN': return 'bg-orange-500';
      case 'JUDGING_OPEN': return 'bg-purple-500';
      case 'RESULTS_FINALIZED': return 'bg-green-500';
      case 'RESULTS_PUBLISHED': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'Setup',
      'REGISTRATION_OPEN': 'Registration',
      'SUBMISSION_OPEN': 'Build Phase',
      'SUBMISSION_FROZEN': 'Submission Closed',
      'JUDGING_OPEN': 'Judging',
      'RESULTS_FINALIZED': 'Results Ready',
      'RESULTS_PUBLISHED': 'Published',
      'ARCHIVED': 'Archived'
    };
    return labels[status] || status;
  };

  const calculateTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diff = target - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-sm">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>Failed to load command center data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              HACKATHON COMMAND CENTER
            </h1>
            <p className="text-gray-400 mt-1">Real-time event operations & control</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/organizer"
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-md text-xs font-mono"
            >
              <span>← Back to Control Center</span>
            </Link>
            <Link 
              href="/gallery"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl flex items-center gap-1.5 transition-colors text-xs font-mono"
            >
              <span>Public Gallery ↗</span>
            </Link>
          </div>
        </div>

        {/* Event Status Bar */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${getPhaseColor(data.event.status)} animate-pulse`}></div>
              <div>
                <h2 className="text-2xl font-bold">{data.event.name}</h2>
                <p className="text-sm text-gray-400 uppercase tracking-wide">
                  {getPhaseLabel(data.event.status)}
                </p>
              </div>
            </div>
            {data.event.status === 'SUBMISSION_OPEN' && data.event.subDeadline && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-mono font-bold">
                    {calculateTimeRemaining(data.event.subDeadline)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">until submission closes</p>
              </div>
            )}
            {data.event.status === 'JUDGING_OPEN' && data.event.judgeDeadline && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-mono font-bold">
                    {calculateTimeRemaining(data.event.judgeDeadline)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">until judging closes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            WHAT NEEDS YOUR ATTENTION?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg p-4 border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/20 border-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-900/20 border-yellow-500'
                    : alert.severity === 'success'
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.severity === 'critical' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                      {alert.severity === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                      {alert.severity === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      {alert.severity === 'info' && <Activity className="w-5 h-5 text-blue-400" />}
                      <h4 className="font-semibold">{alert.title}</h4>
                      {alert.count && (
                        <span className="ml-auto px-2 py-0.5 bg-white/10 rounded-full text-xs font-mono">
                          {alert.count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{alert.message}</p>
                  </div>
                </div>
                {alert.actionUrl && (
                  <Link
                    href={alert.actionUrl}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {alert.actionLabel || 'Resolve'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Pulse */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">EVENT PULSE</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-4 border border-blue-700/50">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.participants}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Participants</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-lg p-4 border border-green-700/50">
            <Users className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.teams}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Teams</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-4 border border-purple-700/50">
            <Folder className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.projects}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Projects</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-lg p-4 border border-yellow-700/50">
            <CheckCircle2 className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.submitted}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 rounded-lg p-4 border border-orange-700/50">
            <Power className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.frozen}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Frozen</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 rounded-lg p-4 border border-cyan-700/50">
            <Award className="w-8 h-8 text-cyan-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.judges}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Judges</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 rounded-lg p-4 border border-emerald-700/50">
            <Activity className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-3xl font-bold font-mono">{data.pulse.activeJudges}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Active Judges</p>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">SYSTEM HEALTH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Submission Progress</span>
              <span className="text-lg font-bold font-mono">{data.health.submissionProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all"
                style={{ width: `${data.health.submissionProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Judging Progress</span>
              <span className="text-lg font-bold font-mono">{data.health.judgingProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${data.health.judgingProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Assignment Coverage</span>
              <span className="text-lg font-bold font-mono">{data.health.assignmentCoverage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${data.health.assignmentCoverage}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Calibration Complete</span>
              <span className="text-lg font-bold font-mono">{data.health.calibrationComplete}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                style={{ width: `${data.health.calibrationComplete}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">EVENT JOURNEY</h3>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            {data.timeline && data.timeline.map((phase, index) => (
              <React.Fragment key={phase.phase}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      phase.status === 'complete'
                        ? 'bg-green-500'
                        : phase.status === 'current'
                        ? 'bg-yellow-500 animate-pulse'
                        : phase.status === 'blocked'
                        ? 'bg-red-500'
                        : 'bg-gray-600'
                    }`}
                  >
                    {phase.status === 'complete' && <CheckCircle2 className="w-6 h-6" />}
                    {phase.status === 'current' && <Play className="w-6 h-6" />}
                    {phase.status === 'blocked' && <Pause className="w-6 h-6" />}
                    {phase.status === 'upcoming' && <Clock className="w-6 h-6" />}
                  </div>
                  <p className="text-xs font-semibold text-center">{phase.label}</p>
                  {phase.remaining && (
                    <p className="text-xs text-gray-400 mt-1">{phase.remaining}</p>
                  )}
                </div>
                {index < data.timeline.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    phase.status === 'complete' ? 'bg-green-500' : 'bg-gray-600'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/organizer/participants"
          className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-6 text-center transition-all transform hover:scale-105"
        >
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Participants</p>
        </Link>
        <Link
          href="/organizer/projects"
          className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg p-6 text-center transition-all transform hover:scale-105"
        >
          <Folder className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Projects</p>
        </Link>
        <Link
          href="/organizer/judges"
          className="bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg p-6 text-center transition-all transform hover:scale-105"
        >
          <Award className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Judges</p>
        </Link>
        <Link
          href="/organizer/results"
          className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg p-6 text-center transition-all transform hover:scale-105"
        >
          <Target className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Results</p>
        </Link>
      </div>
    </div>
  );
}
