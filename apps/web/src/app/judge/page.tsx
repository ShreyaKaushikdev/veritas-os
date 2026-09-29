'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Target,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock,
  Shield,
  BarChart3,
  MessageSquare,
  FileText,
  Award,
  Activity,
  Users,
  Brain,
  Zap,
  GitBranch,
  Calendar,
  Play,
  Pause,
  ArrowRight,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { getCurrentUser } from '@/lib/rbac';

/**
 * JUDGE COCKPIT
 * Professional evaluation workspace for judges
 * 
 * Design Philosophy:
 * - Answer "What do I need to evaluate next?" immediately  
 * - Provide focused, distraction-free evaluation environment
 * - Show progress and integrity status clearly
 * - Make calibration and rubric easily accessible
 * - Emphasize evidence-based evaluation
 */

type BallotStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'LOCKED';
type CalibrationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface Assignment {
  id: string;
  projectId: string;
  projectTitle: string;
  teamName: string;
  track: string;
  status: BallotStatus;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function JudgeCockpit() {
  const router = useRouter();
  const [user] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatus>('NOT_STARTED');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeView, setActiveView] = useState<'assignments' | 'calibration' | 'progress'>('assignments');

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role !== 'JUDGE' && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    loadJudgeData();
  }, [user, router]);

  const loadJudgeData = async () => {
    setLoading(true);
    try {
      // Load judge assignments and status
      // This would call actual APIs in production
      setCalibrationStatus('COMPLETED');
      setAssignments([
        {
          id: '1',
          projectId: 'proj_1',
          projectTitle: 'AI-Powered Code Review Tool',
          teamName: 'Code Wizards',
          track: 'Developer Tools',
          status: 'ASSIGNED',
          dueDate: '2024-12-25T18:00:00Z',
          priority: 'HIGH'
        },
        {
          id: '2', 
          projectId: 'proj_2',
          projectTitle: 'Blockchain Voting System',
          teamName: 'CryptoVote',
          track: 'Blockchain',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM'
        }
      ]);
    } catch (error) {
      console.error('Failed to load judge data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const nextAssignment = assignments.find(a => a.status === 'ASSIGNED');
  const inProgressCount = assignments.filter(a => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'LOCKED').length;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Judge Command Portal · Offline Consensus Engine</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Judge Cockpit
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono">
                {user?.role || 'JUDGE'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/judge-cockpit/calibration')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition"
            >
              <Scale className="w-4 h-4 text-purple-400" />
              Anchor Calibration
            </button>
            <button
              onClick={() => router.push('/gallery')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition"
            >
              <Eye className="w-4 h-4" />
              Public Ballots & Gallery
            </button>
          </div>
        </div>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>ASSIGNMENTS</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">{assignments.length}</div>
            <div className="text-xs text-zinc-500 mt-1">{assignments.length - completedCount} pending evaluation</div>
          </div>

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>IN PROGRESS</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-300">{inProgressCount}</div>
            <div className="text-xs text-zinc-500 mt-1">Draft ballots saved</div>
          </div>

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>SUBMITTED & SIGNED</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-300">{completedCount}</div>
            <div className="text-xs text-zinc-500 mt-1">Cryptographically hashed</div>
          </div>

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>CALIBRATION</span>
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-purple-300 capitalize">{calibrationStatus.toLowerCase().replace('_', ' ')}</div>
            <div className="text-xs text-zinc-500 mt-1">Bias delta: 0.00 (Calibrated)</div>
          </div>
        </div>

        {/* Next Up Urgent Action */}
        {nextAssignment && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-cyan-950/40 border border-emerald-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Next in Queue
                  </span>
                  <span className="text-xs font-mono text-zinc-400">{nextAssignment.track}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{nextAssignment.projectTitle}</h2>
                <p className="text-sm text-zinc-400">Team: {nextAssignment.teamName} · Blind peer consensus protocol active</p>
              </div>

              <button
                onClick={() => router.push(`/judge-cockpit/evaluate/${nextAssignment.projectId}`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20 transition self-start md:self-auto"
              >
                <span>Evaluate Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Assigned Projects Table */}
        <div className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Assigned Evaluation Queue
            </h3>
            <span className="text-xs font-mono text-zinc-400">{assignments.length} Total Projects</span>
          </div>

          <div className="divide-y divide-white/5">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{assignment.projectTitle}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                      {assignment.track}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">Team: {assignment.teamName}</div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                      assignment.status === 'SUBMITTED' || assignment.status === 'LOCKED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : assignment.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {assignment.status}
                  </span>

                  <button
                    onClick={() => router.push(`/judge-cockpit/evaluate/${assignment.projectId}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white border border-white/10 transition"
                  >
                    <span>{assignment.status === 'SUBMITTED' ? 'View Ballot' : 'Score'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}