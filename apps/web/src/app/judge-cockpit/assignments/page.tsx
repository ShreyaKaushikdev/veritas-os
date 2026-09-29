'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Award, Filter,
  Play, Eye, FileCheck, XCircle, Search, TrendingUp
} from 'lucide-react';

interface Assignment {
  assignmentId: string;
  project: {
    id: string;
    title: string;
    tagline: string | null;
    track: {
      name: string;
    } | null;
  };
  isTargeted: boolean;
  triggerReason: string | null;
  ballot: {
    id: string;
    status: string;
    weightedScore: number;
    submittedAt: string;
  } | null;
}

export default function AssignmentsQueuePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId] = useState('demo-event');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'status'>('status');

  useEffect(() => {
    fetchAssignments();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAssignments, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchAssignments = async () => {
    try {
      const userStr = localStorage.getItem('dogfood_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const response = await fetch(
        `http://localhost:4000/api/v1/events/${eventId}/judging/assignments/me`,
        { headers: { 'Authorization': `Bearer ${user.id}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (assignment: Assignment) => {
    if (assignment.ballot && assignment.ballot.status === 'SUBMITTED') {
      return 'COMPLETED';
    }
    if (assignment.isTargeted) {
      return 'TARGETED';
    }
    return 'PENDING';
  };

  const filteredAssignments = assignments
    .filter((a) => {
      const status = getStatus(a);
      const matchesFilter = filterStatus === 'ALL' || status === filterStatus;
      const matchesSearch = 
        a.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.project.track?.name && a.project.track.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.project.title.localeCompare(b.project.title);
      } else {
        // Sort by status: TARGETED > PENDING > COMPLETED
        const statusA = getStatus(a);
        const statusB = getStatus(b);
        const statusOrder: Record<string, number> = {
          'TARGETED': 0,
          'PENDING': 1,
          'COMPLETED': 2
        };
        return statusOrder[statusA] - statusOrder[statusB];
      }
    });

  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.ballot && a.ballot.status === 'SUBMITTED').length,
    pending: assignments.filter(a => !a.ballot || a.ballot.status !== 'SUBMITTED').length,
    targeted: assignments.filter(a => a.isTargeted).length
  };

  const progress = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading assignments...</p>
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
                ASSIGNMENT QUEUE
              </h1>
              <p className="text-sm text-gray-400 mt-1">Manage your evaluation assignments</p>
            </div>
            <Link 
              href="/judge-cockpit"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cockpit
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Progress</h2>
            <span className="text-3xl font-bold font-mono text-cyan-400">{progress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-4 mb-6">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <FileCheck className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold font-mono">{stats.total}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold font-mono">{stats.completed}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Completed</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold font-mono">{stats.pending}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-400" />
              <p className="text-2xl font-bold font-mono">{stats.targeted}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Targeted</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project title or track..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
              >
                <option value="ALL">All Assignments</option>
                <option value="PENDING">Pending</option>
                <option value="TARGETED">Targeted Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
              <p className="text-gray-400">
                {filterStatus === 'ALL' 
                  ? 'You have no pending assignments.'
                  : `No assignments found with filter: ${filterStatus}`}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              const status = getStatus(assignment);
              const isCompleted = status === 'COMPLETED';
              const isTargeted = status === 'TARGETED';
              
              return (
                <div
                  key={assignment.assignmentId}
                  className={`bg-slate-800 rounded-xl border transition-all ${
                    isCompleted 
                      ? 'border-slate-700 opacity-75'
                      : isTargeted
                      ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                      : 'border-slate-700 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Project Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{assignment.project.title}</h3>
                          
                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold border border-green-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : isTargeted ? (
                            <span className="px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full text-xs font-semibold border border-orange-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Targeted Review
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>

                        {assignment.project.tagline && (
                          <p className="text-gray-400 mb-3">{assignment.project.tagline}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          {assignment.project.track && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Award className="w-4 h-4" />
                              {assignment.project.track.name}
                            </span>
                          )}
                          
                          {isCompleted && assignment.ballot && (
                            <span className="flex items-center gap-1 text-cyan-400">
                              <TrendingUp className="w-4 h-4" />
                              Score: {assignment.ballot.weightedScore.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Targeted Reason */}
                        {isTargeted && assignment.triggerReason && (
                          <div className="mt-3 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
                            <p className="text-sm text-orange-200">
                              <strong>Reason:</strong> {assignment.triggerReason}
                            </p>
                          </div>
                        )}

                        {/* Completion Info */}
                        {isCompleted && assignment.ballot && (
                          <div className="mt-3 text-sm text-gray-400">
                            Submitted on {new Date(assignment.ballot.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-6 flex gap-2">
                        {isCompleted ? (
                          <Link
                            href={`/judge-cockpit/review/${assignment.project.id}`}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        ) : (
                          <Link
                            href={`/judge-cockpit/evaluate/${assignment.project.id}`}
                            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-semibold ${
                              isTargeted
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                            }`}
                          >
                            <Play className="w-5 h-5" />
                            {isTargeted ? 'Start Targeted Review' : 'Start Evaluation'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Results Count */}
        {filteredAssignments.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </div>
        )}
      </div>
    </div>
  );
}
