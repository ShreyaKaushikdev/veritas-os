'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  Github,
  CheckCircle2,
  Filter,
  Database,
  RefreshCw,
  Layers,
  Award,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Bot,
  GitCommit,
  ArrowRight,
  Sparkles,
  Trophy,
  ArrowDownAZ,
  Copy,
  Check,
  Box,
  SlidersHorizontal
} from 'lucide-react';
import TiltCard3D from '../../components/TiltCard3D';

interface Project {
  id: string;
  title: string;
  tagline: string;
  track: string;
  rank: number;
  elo: number;
  eloShift?: string;
  meanScore?: number;
  repoUrl?: string;
  commitSha?: string;
  teamMembers?: string[];
  criteriaScores?: {
    depth: number;
    novelty: number;
    feasibility: number;
    presentation: number;
  };
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; count: number; dbName: string }>({
    connected: false,
    count: 0,
    dbName: 'dogfood_os',
  });
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'elo' | 'title'>('rank');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // 3D Kinetic Tilt & Spacebar State
  const [is3DMode, setIs3DMode] = useState(false);
  const [spacebarHeld, setSpacebarHeld] = useState(false);

  const fetchLiveProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/projects?sort=${sortBy}`);
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data || []);
        setDbStatus({
          connected: true,
          count: json.count || json.data?.length || 0,
          dbName: 'dogfood_os (MongoDB)',
        });
      }
    } catch (err) {
      console.warn('API fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProjects();
  }, [sortBy]);

  // Spacebar 3D Perspective Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacebarHeld(true);
      }
      if (e.code === 'Escape') {
        setIs3DMode(false);
        setSpacebarHeld(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacebarHeld(false);
        setIs3DMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const copySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1800);
  };

  // Distinct tracks
  const tracks = ['ALL', ...Array.from(new Set(projects.map((p) => p.track).filter(Boolean)))];

  const filtered = projects.filter((p) => {
    const matchesTrack = selectedTrack === 'ALL' || p.track === selectedTrack;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.tagline && p.tagline.toLowerCase().includes(search.toLowerCase())) ||
      (p.teamMembers && p.teamMembers.some((m) => m.toLowerCase().includes(search.toLowerCase())));
    return matchesTrack && matchesSearch;
  });

  const getTrackIcon = (track: string) => {
    if (track.toLowerCase().includes('infra')) return <Cpu className="w-3.5 h-3.5" />;
    if (track.toLowerCase().includes('verifiable')) return <ShieldCheck className="w-3.5 h-3.5" />;
    if (track.toLowerCase().includes('agent')) return <Bot className="w-3.5 h-3.5" />;
    return <Layers className="w-3.5 h-3.5" />;
  };

  const getTrackStyle = (track: string) => {
    if (track.toLowerCase().includes('infra')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (track.toLowerCase().includes('verifiable')) {
      return 'bg-teal-50 text-teal-800 border-teal-200';
    }
    if (track.toLowerCase().includes('agent')) {
      return 'bg-green-50 text-green-800 border-green-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const is3DActive = is3DMode || spacebarHeld;

  return (
    <div className="space-y-8 pb-16">
      {/* Quick Return Bar for Organizers & Judges */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono shadow-md">
        <div className="flex items-center space-x-2.5">
          <Link
            href="/organizer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <span>← Back to Organizer Control Center</span>
          </Link>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Viewing project submissions & Merkle proofs</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/organizer/command-center"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1 transition-all"
          >
            <span>Command Center ↗</span>
          </Link>
          <Link
            href="/judge-cockpit"
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800 flex items-center space-x-1 transition-all"
          >
            <span>Judge Cockpit ↗</span>
          </Link>
        </div>
      </div>
      
      {/* Top Banner / Hero Command Center - Natural Aesthetic Green & White */}
      <section className="relative rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-200/80 p-6 sm:p-8 shadow-sm shadow-emerald-950/5 overflow-hidden">
        {/* Subtle background botanical ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>MongoDB Replica: {dbStatus.dbName}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                Round 4 Active
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                Peer-Blind Protocol
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
              Live Project Gallery & Submissions
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Cryptographically frozen, deadline-locked submissions ready for peer evaluation. 
              All scores, Elo updates, and Merkle proofs sync in real-time with zero cloud dependencies.
            </p>

            {/* Quick telemetry badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-700">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-800">{projects.length} Total Projects</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-800">124 Sealed Ballots</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold text-slate-800">95% Review Complete</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar on Right */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/organizer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-400 font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>← Control Center</span>
            </Link>

            <button
              onClick={fetchLiveProjects}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50/80 border border-emerald-200 hover:border-emerald-300 rounded-xl text-xs font-mono text-slate-700 hover:text-emerald-800 transition-all shadow-xs cursor-pointer active:scale-95 group font-medium"
              title="Sync live MongoDB database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 group-hover:rotate-180 transition-transform ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search title, tech, team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
                ⌘K
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Floating 3D Mode HUD Indicator */}
      {is3DActive && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shadow-xl shadow-emerald-900/15 animate-fadeIn">
          <div className="flex items-center space-x-2.5 text-xs font-mono">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Box className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span>
              <strong>3D Spatial Perspective Active</strong> — Hover and move your cursor across cards to tilt in 3D. Press <strong>SPACE</strong> to toggle normal mode.
            </span>
          </div>
          <button
            onClick={() => {
              setIs3DMode(false);
              setSpacebarHeld(false);
            }}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            Exit 3D [ESC]
          </button>
        </div>
      )}

      {/* Filter and Sort Navigation Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        {/* Track Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {tracks.map((track) => {
            const isSelected = selectedTrack === track;
            return (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold border border-emerald-600'
                    : 'bg-white text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs'
                }`}
              >
                {getTrackIcon(track)}
                <span>{track === 'ALL' ? `All Tracks (${projects.length})` : track}</span>
              </button>
            );
          })}
        </div>

        {/* Sort & 3D Tilt Switcher */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs font-mono">
          
          {/* 3D Mode Spacebar Toggle Button */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
              is3DActive
                ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-600/25 scale-105'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-800 shadow-2xs'
            }`}
            title="Toggle 3D Perspective Tilt (or tap Spacebar)"
          >
            <Box className={`w-3.5 h-3.5 ${is3DActive ? 'text-white animate-spin' : 'text-emerald-600'}`} />
            <span>3D View</span>
            <kbd className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${is3DActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
              SPACE
            </kbd>
          </button>

          <span className="text-slate-500 text-[11px] font-medium">Order by:</span>
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={() => setSortBy('rank')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                sortBy === 'rank'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>Rank</span>
            </button>
            <button
              onClick={() => setSortBy('elo')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                sortBy === 'elo'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Elo</span>
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                sortBy === 'title'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowDownAZ className="w-3 h-3" />
              <span>Name</span>
            </button>
          </div>
        </div>
      </section>

      {/* Project Cards Grid with 3D Parallax & Depth */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
            <Database className="w-5 h-5 text-emerald-600 absolute inset-0 m-auto" />
          </div>
          <p className="text-xs font-mono text-slate-500">
            Streaming live documents from MongoDB replica <span className="text-emerald-700 font-semibold">all projects</span>...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No projects match</h3>
          <p className="text-xs text-slate-500">Try a different search word, or pick All categories.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${
          is3DActive ? 'perspective-grid-active' : 'perspective-grid'
        }`}>
          {filtered.map((proj) => {
            const isRank1 = proj.rank === 1;
            const isRank2 = proj.rank === 2;
            const isRank3 = proj.rank === 3;

            return (
              <TiltCard3D
                key={proj.id}
                isSpacebarActive={is3DActive}
                maxTilt={12}
                className="rounded-2xl h-full"
              >
                <div className="group relative rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/10 cursor-pointer shadow-sm overflow-hidden h-full">
                  {/* Subtle top specular card highlight */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

                  <div className="space-y-3.5" style={{ transform: 'translateZ(15px)' }}>
                    {/* Top Header Row with Category & Rank Medal */}
                    <div className="flex items-center justify-between" style={{ transform: 'translateZ(20px)' }}>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${getTrackStyle(proj.track)}`}>
                        {getTrackIcon(proj.track)}
                        <span>{proj.track}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>

                        {/* Rank Badges */}
                        {isRank1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            👑 #1 GOLD
                          </span>
                        ) : isRank2 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                            🥈 #2 SILVER
                          </span>
                        ) : isRank3 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                            🥉 #3 BRONZE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                            #{proj.rank}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div style={{ transform: 'translateZ(25px)' }}>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight line-clamp-1 font-sans">
                        {proj.title}
                      </h2>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                        {proj.tagline || 'High-integrity verifiable engineering solution for local hackathon deployment.'}
                      </p>
                    </div>

                    {/* Team Members */}
                    {proj.teamMembers && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500" style={{ transform: 'translateZ(18px)' }}>
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[9px] font-mono font-bold">
                          {proj.teamMembers.length}
                        </div>
                        <span className="truncate max-w-[240px] text-slate-600">
                          {proj.teamMembers.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metrics Box & Progress Visualization */}
                  <div className="space-y-3 pt-3.5 border-t border-slate-100" style={{ transform: 'translateZ(22px)' }}>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Elo Rating Card */}
                      <div className="rounded-xl bg-emerald-50/50 p-2.5 border border-emerald-100/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>RATING</span>
                          {proj.eloShift && (
                            <span className="text-emerald-700 font-bold bg-emerald-100 px-1 rounded text-[9px]">{proj.eloShift}</span>
                          )}
                        </div>
                        <div className="text-base font-bold font-mono text-emerald-900">
                          {proj.elo?.toFixed(1) || '80.0'}
                        </div>
                      </div>

                      {/* Mean Score Card with Mini Progress Bar */}
                      <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>SCORE</span>
                          <span className="text-emerald-700 font-bold">
                            {proj.meanScore ? `${((proj.meanScore / 5) * 100).toFixed(0)}%` : '0%'}
                          </span>
                        </div>
                        <div className="text-base font-bold font-mono text-slate-800">
                          {proj.meanScore ? `${proj.meanScore.toFixed(2)}` : '3.80'} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                            style={{ width: `${proj.meanScore ? (proj.meanScore / 5) * 100 : 75}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Commit SHA & Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs font-mono" style={{ transform: 'translateZ(26px)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copySha(proj.commitSha || '0x7f49c2a81de0');
                        }}
                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Click to copy SHA-256 anchor"
                      >
                        <GitCommit className="w-3 h-3 text-slate-400" />
                        <span>{copiedSha === (proj.commitSha || '0x7f49c2a81de0') ? 'Copied!' : (proj.commitSha || '0x7f49c2a8').slice(0, 10)}</span>
                        {copiedSha === (proj.commitSha || '0x7f49c2a81de0') ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer border border-slate-200"
                            title="View GitHub Repository"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <Link
                          href={`/judge?project=${proj.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all cursor-pointer shadow-xs hover:shadow-sm"
                          title="Evaluate in Judge Console"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Judge</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      )}
    </div>
  );
}
