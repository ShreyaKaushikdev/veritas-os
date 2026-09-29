'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Clock, Award, Target, AlertCircle, ChevronRight,
  Eye, Shield, Lock, Play, Settings, HelpCircle, Bell, TrendingUp,
  FileCheck, Users, Zap, Activity
} from 'lucide-react';

interface JudgeCockpitData {
  judge: {
    id: string;
    name: string;
    calibrationStatus: 'pending' | 'complete' | 'not_required';
    calibrationBias: number;
    biasLabel: string;
  };
  event: {
    id: string;
    name: string;
    status: string;
    judgeDeadline: string | null;
  };
  progress: {
    assigned: number;
    completed: number;
    remaining: number;
    recused: number;
    percentage: number;
  };
  nextAssignment: {
    projectId: string;
    projectTitle: string;
    track: string;
    estimatedTime: string;
    isTargeted: boolean;
    triggerReason?: string;
  } | null;
  statistics: {
    avgEvaluationTime: string;
    totalEvaluationTime: string;
    completedReviews: number;
  };
  integrity: {
    ballotsCommitted: number;
    chainValid: boolean;
    receiptsAvailable: number;
  };
  deadlines: Array<{
    type: 'judging' | 'calibration' | 'assignment';
    label: string;
    deadline: string;
    remaining: string;
  }>;
}

export default function JudgeCockpit() {
  const [data, setData] = useState<JudgeCockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string>('demo-event');
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    fetchCockpitData();
    
    const interval = setInterval(() => {
      fetchCockpitData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [eventId]);

  const fetchCockpitData = async () => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      
      const response = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/assignments/me`,
        {
          headers: {
            'Authorization': `Bearer ${user.id}` // Simplified for demo
          }
        }
      );
      
      if (response.ok) {
        const assignments = await response.json();
        
        // Calculate progress
        const completed = assignments.filter((a: any) => 
          a.ballot && a.ballot.status === 'SUBMITTED'
        ).length;
        const remaining = assignments.filter((a: any) => 
          !a.ballot || a.ballot.status !== 'SUBMITTED'
        ).length;
        const recused = 0; // Would come from actual recusal data
        
        // Find next assignment
        const nextAssignment = assignments.find((a: any) => 
          !a.ballot || a.ballot.status !== 'SUBMITTED'
        );
        
        setData({
          judge: {
            id: user.id,
            name: user.name,
            calibrationStatus: 'complete',
            calibrationBias: 0.05,
            biasLabel: 'Neutral'
          },
          event: {
            id: eventId,
            name: 'AI Buildathon 2026',
            status: 'JUDGING_OPEN',
            judgeDeadline: new Date(Date.now() + 86400000 * 2).toISOString()
          },
          progress: {
            assigned: assignments.length,
            completed,
            remaining,
            recused: 0,
            percentage: Math.round((completed / assignments.length) * 100)
          },
          nextAssignment: nextAssignment ? {
            projectId: nextAssignment.project.id,
            projectTitle: nextAssignment.project.title,
            track: nextAssignment.project.track?.name || 'General',
            estimatedTime: '8–12 min',
            isTargeted: nextAssignment.isTargeted,
            triggerReason: nextAssignment.triggerReason
          } : null,
          statistics: {
            avgEvaluationTime: '9m 15s',
            totalEvaluationTime: `${Math.floor(completed * 9.25)} min`,
            completedReviews: completed
          },
          integrity: {
            ballotsCommitted: completed,
            chainValid: true,
            receiptsAvailable: completed
          },
          deadlines: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch cockpit data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading Judging Cockpit...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>Failed to load judging data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                JUDGING COCKPIT
              </h1>
              <p className="text-sm text-gray-400 mt-1">Professional Evaluation Workstation</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowGuidelines(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Guidelines
              </button>
              <Link 
                href="/judge"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Classic View
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Status Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 mb-8 border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
              <div>
                <h2 className="text-2xl font-bold">{data.event.name}</h2>
                <p className="text-sm text-gray-400 uppercase tracking-wide">Judging Phase • Live</p>
              </div>
            </div>
            {data.event.judgeDeadline && (
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

        {/* Judge Status Card */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Judge Status
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold border border-green-700">
                ✓ Verified
              </span>
              {data.judge.calibrationStatus === 'complete' && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-semibold border border-blue-700">
                  ✓ Calibrated
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Judge</p>
              <p className="text-lg font-semibold">{data.judge.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Calibration Bias</p>
              <p className="text-lg font-semibold">
                {data.judge.calibrationBias >= 0 ? '+' : ''}{data.judge.calibrationBias.toFixed(2)} 
                <span className="text-sm text-gray-400 ml-2">{data.judge.biasLabel}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Active
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Progress & Next Assignment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Card */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">YOUR JUDGING PROGRESS</h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold font-mono">{data.progress.percentage}%</span>
                  <span className="text-sm text-gray-400">
                    {data.progress.completed} / {data.progress.assigned} completed
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${data.progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-cyan-400">{data.progress.assigned}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Assigned</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-green-400">{data.progress.completed}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Completed</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-yellow-400">{data.progress.remaining}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Remaining</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-orange-400">{data.progress.recused}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Recused</p>
                </div>
              </div>
            </div>

            {/* Next Assignment Card */}
            {data.nextAssignment ? (
              <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-xl p-8 border-2 border-cyan-500/50">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-bold">NEXT ASSIGNMENT</h3>
                  {data.nextAssignment.isTargeted && (
                    <span className="px-2 py-1 bg-orange-900/50 text-orange-400 rounded text-xs font-semibold border border-orange-600">
                      TARGETED REVIEW
                    </span>
                  )}
                </div>
                
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-2">{data.nextAssignment.projectTitle}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {data.nextAssignment.track}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Est. {data.nextAssignment.estimatedTime}
                    </span>
                  </div>
                  
                  {data.nextAssignment.isTargeted && data.nextAssignment.triggerReason && (
                    <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
                      <p className="text-sm text-orange-200">
                        <strong>Note:</strong> {data.nextAssignment.triggerReason}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/judge-cockpit/evaluate/${data.nextAssignment.projectId}`}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  START EVALUATION
                </Link>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-bold mb-2">All Assignments Complete!</h3>
                <p className="text-gray-400">You have completed all assigned evaluations.</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats & Integrity */}
          <div className="space-y-8">
            {/* Statistics Card */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Avg Evaluation Time</p>
                  <p className="text-2xl font-bold font-mono">{data.statistics.avgEvaluationTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Time Invested</p>
                  <p className="text-2xl font-bold font-mono">{data.statistics.totalEvaluationTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completed Reviews</p>
                  <p className="text-2xl font-bold font-mono">{data.statistics.completedReviews}</p>
                </div>
              </div>
            </div>

            {/* Integrity Card */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-400" />
                Integrity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Ballots Committed</span>
                  <span className="text-lg font-bold">{data.integrity.ballotsCommitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Chain Status</span>
                  <span className="flex items-center gap-1 text-green-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Receipts Available</span>
                  <span className="text-lg font-bold">{data.integrity.receiptsAvailable}</span>
                </div>
              </div>
              <Link
                href="/verify"
                className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                View Trust Ledger
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/judge-cockpit/assignments"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    View All Assignments
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/judge-cockpit/calibration"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Calibration
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/judge-cockpit/pairwise"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Pairwise Comparisons
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Judging Guidelines</h3>
                <button
                  onClick={() => setShowGuidelines(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Do
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Evaluate against the published rubric</li>
                  <li>✓ Use evidence from the submission</li>
                  <li>✓ Apply criteria consistently</li>
                  <li>✓ Recuse yourself when a conflict exists</li>
                  <li>✓ Record specific evidence in notes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Don't
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>✗ Let personal preference override criteria</li>
                  <li>✗ Compare projects to external standards</li>
                  <li>✗ Discuss scores before submission</li>
                  <li>✗ Judge based on team affiliation</li>
                  <li>✗ Rush through evaluations</li>
                </ul>
              </div>
              <div className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Integrity Guarantee
                </h4>
                <p className="text-sm text-gray-300">
                  Every ballot you submit is cryptographically committed to a tamper-evident 
                  hash chain. You will receive a receipt that can be independently verified.
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6">
              <button
                onClick={() => setShowGuidelines(false)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
