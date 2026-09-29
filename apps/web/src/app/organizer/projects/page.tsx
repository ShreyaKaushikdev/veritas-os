'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Folder, Search, Filter, Download, Eye, CheckCircle2, AlertCircle,
  Clock, Award, Users, ArrowUpDown, MoreVertical, Lock, Flag,
  ExternalLink, Github, Globe, TrendingUp, XCircle
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  tagline: string | null;
  description: string;
  teamName: string;
  teamSize: number;
  track: string | null;
  trackColor: string;
  eligibility: 'PENDING' | 'ELIGIBLE' | 'DISQUALIFIED';
  isFrozen: boolean;
  frozenAt: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  techStack: string | null;
  ballotCount: number;
  avgScore: number | null;
  scoreStdDev: number | null;
  hasHighVariance: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId] = useState('demo-event');
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'team' | 'score' | 'frozenAt'>('frozenAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, [eventId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/events/${eventId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        
        // Extract unique tracks
        const uniqueTracks = Array.from(new Set(data.map((p: Project) => p.track).filter(Boolean)));
        setTracks(uniqueTracks as string[]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/events/${eventId}/projects/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `projects-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tagline && p.tagline.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesEligibility = eligibilityFilter === 'ALL' || p.eligibility === eligibilityFilter;
      const matchesTrack = trackFilter === 'ALL' || p.track === trackFilter;
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'SUBMITTED' && p.isFrozen) ||
        (statusFilter === 'DRAFT' && !p.isFrozen) ||
        (statusFilter === 'HIGH_VARIANCE' && p.hasHighVariance);
      
      return matchesSearch && matchesEligibility && matchesTrack && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'team') {
        comparison = a.teamName.localeCompare(b.teamName);
      } else if (sortBy === 'score') {
        comparison = (a.avgScore || 0) - (b.avgScore || 0);
      } else if (sortBy === 'frozenAt') {
        comparison = new Date(a.frozenAt || 0).getTime() - new Date(b.frozenAt || 0).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    total: projects.length,
    submitted: projects.filter(p => p.isFrozen).length,
    draft: projects.filter(p => !p.isFrozen).length,
    eligible: projects.filter(p => p.eligibility === 'ELIGIBLE').length,
    disqualified: projects.filter(p => p.eligibility === 'DISQUALIFIED').length,
    highVariance: projects.filter(p => p.hasHighVariance).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PROJECTS
              </h1>
              <p className="text-sm text-gray-400 mt-1">Manage event submissions and eligibility</p>
            </div>
            <Link 
              href="/organizer/command-center"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← Back to Command Center
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-4 border border-purple-700/50">
            <Folder className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.total}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-lg p-4 border border-green-700/50">
            <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.submitted}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-lg p-4 border border-yellow-700/50">
            <Clock className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.draft}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Draft</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-4 border border-blue-700/50">
            <Award className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.eligible}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Eligible</p>
          </div>
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-lg p-4 border border-red-700/50">
            <XCircle className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.disqualified}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Disqualified</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 rounded-lg p-4 border border-orange-700/50">
            <Flag className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-2xl font-bold font-mono">{stats.highVariance}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">High Variance</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project or team name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                />
              </div>
            </div>

            {/* Eligibility Filter */}
            <div>
              <select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="ALL">All Eligibility</option>
                <option value="PENDING">Pending Review</option>
                <option value="ELIGIBLE">Eligible</option>
                <option value="DISQUALIFIED">Disqualified</option>
              </select>
            </div>

            {/* Track Filter */}
            <div>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="ALL">All Tracks</option>
                {tracks.map(track => (
                  <option key={track} value={track}>{track}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="ALL">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DRAFT">Draft</option>
                <option value="HIGH_VARIANCE">High Variance</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <Link
              href="/organizer/assignments"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Award className="w-4 h-4" />
              Manage Assignments
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-400">No projects found matching your filters</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 overflow-hidden"
              >
                {/* Project Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold flex-1 line-clamp-2">{project.title}</h3>
                    <button className="text-gray-400 hover:text-white ml-2">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {project.tagline && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.tagline}</p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.isFrozen ? (
                      <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold border border-green-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-700">
                        Draft
                      </span>
                    )}

                    {project.eligibility === 'ELIGIBLE' && (
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-semibold border border-blue-700">
                        ✓ Eligible
                      </span>
                    )}
                    {project.eligibility === 'DISQUALIFIED' && (
                      <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-semibold border border-red-700">
                        ✗ Disqualified
                      </span>
                    )}
                    {project.eligibility === 'PENDING' && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-semibold border border-gray-600">
                        Pending
                      </span>
                    )}

                    {project.hasHighVariance && (
                      <span className="px-2 py-1 bg-orange-900/30 text-orange-400 rounded-full text-xs font-semibold border border-orange-700 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Variance
                      </span>
                    )}
                  </div>

                  {/* Team & Track */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{project.teamName}</span>
                      <span className="text-gray-500">({project.teamSize})</span>
                    </div>
                    {project.track && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs font-semibold border border-purple-700">
                          {project.track}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Judging Stats */}
                  {project.isFrozen && (
                    <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Ballots</span>
                        <span className="text-sm font-mono font-semibold">{project.ballotCount}</span>
                      </div>
                      {project.avgScore !== null && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Avg Score</span>
                            <span className="text-sm font-mono font-semibold text-cyan-400">
                              {project.avgScore.toFixed(2)}
                            </span>
                          </div>
                          {project.scoreStdDev !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Std Dev</span>
                              <span className={`text-sm font-mono font-semibold ${
                                project.hasHighVariance ? 'text-orange-400' : 'text-gray-300'
                              }`}>
                                ±{project.scoreStdDev.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <Github className="w-4 h-4" />
                        Repo
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 px-6 py-3 bg-gray-900/50 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {project.frozenAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(project.frozenAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
                  {selectedProject.tagline && (
                    <p className="text-gray-400">{selectedProject.tagline}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-white ml-4"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedProject.isFrozen ? (
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-semibold border border-green-700">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Submitted
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-sm font-semibold border border-yellow-700">
                    Draft
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                  selectedProject.eligibility === 'ELIGIBLE'
                    ? 'bg-blue-900/30 text-blue-400 border-blue-700'
                    : selectedProject.eligibility === 'DISQUALIFIED'
                    ? 'bg-red-900/30 text-red-400 border-red-700'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}>
                  {selectedProject.eligibility}
                </span>
                {selectedProject.track && (
                  <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm font-semibold border border-purple-700">
                    {selectedProject.track}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              {/* Tech Stack */}
              {selectedProject.techStack && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tech Stack</h3>
                  <p className="text-gray-300">{selectedProject.techStack}</p>
                </div>
              )}

              {/* Team Info */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Team</h3>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="font-semibold">{selectedProject.teamName}</p>
                  <p className="text-sm text-gray-400 mt-1">{selectedProject.teamSize} member{selectedProject.teamSize !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Judging Stats */}
              {selectedProject.isFrozen && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Judging Statistics</h3>
                  <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ballots Received</span>
                      <span className="font-mono font-semibold">{selectedProject.ballotCount}</span>
                    </div>
                    {selectedProject.avgScore !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average Score</span>
                        <span className="font-mono font-semibold text-cyan-400">
                          {selectedProject.avgScore.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedProject.scoreStdDev !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Standard Deviation</span>
                        <span className={`font-mono font-semibold ${
                          selectedProject.hasHighVariance ? 'text-orange-400' : 'text-gray-300'
                        }`}>
                          ±{selectedProject.scoreStdDev.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedProject.hasHighVariance && (
                      <div className="mt-3 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
                        <p className="text-sm text-orange-200 flex items-center gap-2">
                          <Flag className="w-4 h-4" />
                          <strong>High variance detected</strong> - Consider targeted review
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3">
                {selectedProject.repoUrl && (
                  <a
                    href={selectedProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                    View Repository
                  </a>
                )}
                {selectedProject.demoUrl && (
                  <a
                    href={selectedProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
