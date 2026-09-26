'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  LockKeyhole,
  Scale,
  Brain,
  Sparkles,
  ExternalLink,
  CheckCheck,
  Fingerprint,
  Zap,
  Activity,
  ShieldAlert,
  Layers,
  ChevronRight,
} from 'lucide-react';
import DefensiblePodiumScene from '../components/3d/DefensiblePodiumScene';
import { dashboard } from '@/lib/api';

export default function HomePage() {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedRootHash, setCopiedRootHash] = useState(false);
  const [activeIdeaTrack, setActiveIdeaTrack] = useState<'ai' | 'zk' | 'infra'>('ai');
  const [simulatedDuelVote, setSimulatedDuelVote] = useState<'alpha' | 'beta' | null>(null);
  const [recusalSimulated, setRecusalSimulated] = useState(false);
  const [recusalTimer, setRecusalTimer] = useState<number | null>(null);
  const [liveStats, setLiveStats] = useState({
    teams: 0,
    ballots: 0,
    health: 'HEALTHY',
    latency: 38,
  });

  // Live numbers at the top of the page. Fails quietly so the page still shows.
  useEffect(() => {
    dashboard
      .stats()
      .then((data) => {
        if (data?.telemetry) {
          setLiveStats({
            teams: data.telemetry.teamsRegistered ?? 0,
            ballots: data.telemetry.assignedBallots ?? 0,
            health: data.workerSync?.status || 'HEALTHY',
            latency: data.workerSync?.syncLatencyMs || 38,
          });
        }
      })
      .catch((err) => console.warn('Could not load live numbers:', err));
  }, []);

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx create-dogfood-event@latest');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2200);
  };

  const handleCopyRootHash = () => {
    navigator.clipboard.writeText('0x7f49c2a81de09b3c4f78e19203a98762514bcda9e201');
    setCopiedRootHash(true);
    setTimeout(() => setCopiedRootHash(false), 2000);
  };

  const triggerRecusalSimulation = () => {
    setRecusalSimulated(true);
    setRecusalTimer(38);
    setTimeout(() => {
      setRecusalSimulated(false);
    }, 4500);
  };

  const trackMetrics = {
    ai: { depth: 94, novelty: 91, feasibility: 86, tag: 'Team of AI agents that work on their own' },
    zk: { depth: 98, novelty: 89, feasibility: 78, tag: 'Maths checks that prove a score is real' },
    infra: { depth: 92, novelty: 85, feasibility: 95, tag: 'Keeps working when the internet does not' },
  };

  return (
    <div className="relative min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 text-slate-800">
      
      {/* Ambient Decorative Natural Green Lighting Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-emerald-500/8 rounded-full blur-[140px]"></div>
        <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] bg-teal-500/6 rounded-full blur-[150px]"></div>
        <div className="absolute top-[70%] -left-32 w-[550px] h-[550px] bg-emerald-600/6 rounded-full blur-[130px]"></div>
      </div>

      <main className="relative z-10 pt-28 sm:pt-36 pb-24">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION                                                          */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
          
          {/* Announcement Pill Badge */}
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 text-xs text-slate-700 mb-8 border border-slate-200/90 hover:border-emerald-400 hover:text-emerald-800 transition-all duration-200 cursor-pointer group shadow-2xs hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-700">DOGFOOD OS v1.0</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 group-hover:text-slate-900 transition-colors font-medium">
              Run a hackathon without arguing about scores
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Hero Headline with Natural Forest Emerald & Cyan Gradient */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mb-6 leading-[1.12]">
            Run a fair hackathon at{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent font-black drop-shadow-2xs">
              any size
            </span>
          </h1>

          {/* High Contrast Body Paragraph */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed font-normal">
            Judges score on the same scale, teams get honest feedback while they build, and every score
            is locked so it cannot be changed later. Works with or without internet.
          </p>

          {/* Live System Capability Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 text-xs font-mono text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-800 font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Scores agree within 50ms</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scores cannot be changed</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>Works with no internet</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Ready in minutes</span>
            </span>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Open the organizer dashboard</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>

            <Link
              href="/judge"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm border border-slate-200 shadow-2xs hover:border-emerald-300 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Try scoring a project</span>
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 group-hover:border-emerald-300">
                ⌘K
              </span>
            </Link>
          </div>

          {/* Trust Bar & Recognized Venues */}
          <div className="w-full max-w-4xl pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="tracking-wide uppercase font-bold text-slate-700">Built for big events:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-mono font-semibold tracking-wider text-slate-600">
              <span className="hover:text-emerald-700 transition-colors cursor-pointer">MIT MEDIA LAB</span>
              <span className="hover:text-emerald-700 transition-colors cursor-pointer">STANFORD TREEHACKS</span>
              <span className="hover:text-emerald-700 transition-colors cursor-pointer">ETHGLOBAL TOKYO</span>
              <span className="hover:text-emerald-700 transition-colors cursor-pointer">HACK THE NORTH</span>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 2. FLAGSHIP CENTERPIECE APP WINDOW MOCKUP (Mac Studio Command Window)      */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 md:mt-24" id="cockpit">
          <div className="rounded-3xl p-1 bg-gradient-to-b from-emerald-500/15 via-slate-100 to-white shadow-2xl border border-slate-200/80">
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
              
              {/* Window Header / Title Bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-200">
                {/* Mac Traffic Lights & Domain breadcrumb */}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-red-300 inline-block shadow-xs"></span>
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-amber-300 inline-block shadow-xs"></span>
                  <span className="w-3 h-3 rounded-full bg-[#10B981] border border-emerald-300 inline-block shadow-xs"></span>
                  <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Live workspace</span>
                  </span>
                </div>

                {/* Event Round Breadcrumb */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono hover:border-emerald-300 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-emerald-700 font-bold">Autonomous Systems 2026</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-600 font-medium">Round 4: judging</span>
                </Link>

                {/* Window Right Telemetry */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="hidden md:inline">Updates every {liveStats.latency}ms</span>
                  </span>
                  <Link
                    href="/dashboard"
                    className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    title="Open the organizer dashboard"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Three-column overview: scores, leaders, checks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">

                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: Scores coming in (4 cols)                          */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-4 p-5 flex flex-col gap-4 bg-slate-50/50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <Scale className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 font-sans">Scores coming in</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      JUDGES BLIND
                    </span>
                  </div>

                  {/* Counter Card */}
                  <Link
                    href="/gallery"
                    className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between hover:border-emerald-300 hover:scale-[1.02] transition-all cursor-pointer group shadow-2xs"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1 tracking-wider uppercase font-bold group-hover:text-emerald-700 transition-colors">
                        PROJECTS SUBMITTED
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {liveStats.teams > 0 ? liveStats.teams : 38}
                        </span>
                        <span className="text-xs font-mono text-slate-500">of 40 checked</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 mt-1.5 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> 95% of scores in
                      </span>
                    </div>

                    <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-emerald-600 border-r-teal-500 flex items-center justify-center text-xs font-mono font-black text-emerald-700 shadow-inner group-hover:border-t-emerald-500 transition-colors">
                      95%
                    </div>
                  </Link>

                  {/* Alert Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-sans text-amber-900 leading-tight font-medium">
                      2 scores look very different from the rest. An organizer will check them.
                    </span>
                  </div>

                  {/* Live Submission Feed */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase font-bold">
                      JUST NOW
                    </span>

                    {/* Feed Item 1 */}
                    <div className="p-2.5 rounded-xl bg-white hover:border-emerald-300 transition-all flex items-center justify-between border border-slate-200 cursor-pointer shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-xs font-bold">
                          J1
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900">Judge #A8F4</div>
                          <div className="text-[11px] font-mono text-slate-500">12s ago · Gave 9.6 · Track 1</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        LOCKED
                      </span>
                    </div>

                    {/* Feed Item 2 */}
                    <div className="p-2.5 rounded-xl bg-white hover:border-cyan-300 transition-all flex items-center justify-between border border-slate-200 cursor-pointer shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-mono text-xs font-bold">
                          J4
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900">Judge #C31B</div>
                          <div className="text-[11px] font-mono text-slate-500">48s ago · Gave 8.9 · Track 1</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        LOCKED
                      </span>
                    </div>

                    {/* Feed Item 3 */}
                    <div className="p-2.5 rounded-xl bg-white hover:border-amber-300 transition-all flex items-center justify-between border border-amber-200 cursor-pointer shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-mono text-xs font-bold">
                          J2
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900">Judge #99D2</div>
                          <div className="text-[11px] font-mono text-amber-800">2m ago · Gave 4.2 · Being checked</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        CHECKING
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* CENTER COLUMN: Who's winning right now (5 cols)                 */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 p-5 flex flex-col gap-4 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 font-sans">Leading right now</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                      <span>Still counting</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                  </div>

                  {/* Top 3 Podium Ranks */}
                  <div className="space-y-3">
                    
                    {/* Rank 1 Card */}
                    <Link
                      href="/gallery"
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-emerald-600 flex items-center justify-between hover:border-emerald-400 hover:bg-emerald-50/50 hover:scale-[1.02] transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shadow-xs">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 font-sans group-hover:text-emerald-800 transition-colors">
                              HyperAgent Engine
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                              DevInfra
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Runs tasks on its own, no supervision needed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-mono font-black text-emerald-700">98.4</div>
                        <span className="text-xs font-mono text-emerald-700 font-bold">rating +34</span>
                      </div>
                    </Link>

                    {/* Rank 2 Card */}
                    <Link
                      href="/gallery"
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-teal-600 flex items-center justify-between hover:border-teal-400 hover:bg-teal-50/50 hover:scale-[1.02] transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-mono font-bold flex items-center justify-center shadow-xs">
                          2
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 font-sans group-hover:text-teal-800 transition-colors">
                              ZeroKernel V3
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                              ZK Circuits
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Makes code compile faster, with proof it is safe</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-mono font-black text-teal-700">96.1</div>
                        <span className="text-xs font-mono text-teal-700 font-bold">rating +18</span>
                      </div>
                    </Link>

                    {/* Rank 3 Card */}
                    <Link
                      href="/gallery"
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-amber-500 flex items-center justify-between hover:border-amber-400 hover:bg-amber-50/50 hover:scale-[1.02] transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-mono font-bold flex items-center justify-center shadow-xs">
                          3
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 font-sans group-hover:text-amber-800 transition-colors">
                              MeshMesh Topology
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                              P2P
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Finds other devices nearby in under 10ms</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-mono font-black text-amber-700">94.8</div>
                        <span className="text-xs font-mono text-emerald-700 font-bold">rating +22</span>
                      </div>
                    </Link>
                  </div>

                  {/* Track Distribution Progress Bars */}
                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider block uppercase font-bold">
                      HOW EACH TRACK IS DOING
                    </span>
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                        <span>AI agents</span>
                        <span className="font-bold text-emerald-700">84% submitted</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '84%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                        <span>Trust and safety</span>
                        <span className="font-bold text-teal-700">78% submitted</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                        <span>Developer tools</span>
                        <span className="font-bold text-emerald-800">62% submitted</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-700 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: Is everything OK? (3 cols)                       */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-3 p-5 flex flex-col gap-4 bg-slate-50/50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 font-sans">Checks</span>
                    </div>
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* How closely judges agree Card */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-2 shadow-2xs">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      HOW CLOSE THE JUDGES AGREE
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black font-mono text-emerald-700">Very close</span>
                      <span className="text-xs font-mono text-slate-500 font-medium">no real difference</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Scores look fair</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>

                  {/* Locked scores proof Card */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                        SCORES LOCKED
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Checked</span>
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-800 bg-slate-50 p-2 rounded-lg border border-slate-200 break-all select-all font-bold">
                      fingerprint#block-4892104
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
                      <span>Round number:</span>
                      <span className="text-slate-900 font-bold">4,892,104</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>History:</span>
                      <span className="text-emerald-700 font-bold">Cannot be changed</span>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <Link
                    href="/verify"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-2xs font-bold"
                  >
                    <LockKeyhole className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Check a score receipt</span>
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 3. BENTO GRID (4 Interactive Feature Cards with Live Sandboxes)          */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-28">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-block mb-3 font-bold">
              WHY IT IS FAIR
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Four things that stop arguments
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Instead of averaging scores in a spreadsheet, we compare projects head to head, keep a
              record nobody can edit, and move a project to a different judge the moment there is a conflict.
            </p>
          </div>

          {/* Bento Cards Layout 2x2 with Interactive Live Micro-Sandboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CARD 1: Head-to-Head Comparing */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-300 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans group-hover:text-emerald-800 transition-colors">
                  Compare two projects side by side
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Asking "which is better, A or B?" is far more reliable than asking for a number out of ten.
                  It also stops judges who always give 8s and 9s from skewing the result.
                </p>
              </div>

              {/* Interactive Micro-UI: A/B Matchup Card with Live Voting */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-bold">
                  <span>PAIR 142</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CLICK ONE TO VOTE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Project A */}
                  <button
                    onClick={() => setSimulatedDuelVote('alpha')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      simulatedDuelVote === 'alpha'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block mb-1">OPTION A</span>
                    <span className="text-sm font-bold text-slate-900 block">OmniQuery</span>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                      <span>Speed</span>
                      <span className="text-emerald-700 font-bold">12ms</span>
                    </div>
                    {simulatedDuelVote === 'alpha' && (
                      <div className="mt-2 text-[10px] font-mono text-emerald-700 font-bold">
                        ✓ Picked (rating +32)
                      </div>
                    )}
                  </button>

                  {/* Project B */}
                  <button
                    onClick={() => setSimulatedDuelVote('beta')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      simulatedDuelVote === 'beta'
                        ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-300 shadow-2xs'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-teal-700 font-bold block mb-1">OPTION B</span>
                    <span className="text-sm font-bold text-slate-900 block">VaporSync</span>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                      <span>Speed</span>
                      <span className="text-teal-700 font-bold">48ms</span>
                    </div>
                    {simulatedDuelVote === 'beta' && (
                      <div className="mt-2 text-[10px] font-mono text-teal-700 font-bold">
                        ✓ Picked (rating +28)
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  <span>
                    Status:{' '}
                    <strong className="text-emerald-700">
                      {simulatedDuelVote ? 'Vote counted (this is a demo)' : 'Waiting for the judge to choose'}
                    </strong>
                  </span>
                  <span className="text-slate-400 font-semibold">Demo data</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Idea Checker */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex flex-col justify-between hover:border-teal-300 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans group-hover:text-teal-800 transition-colors">
                  Check the idea is realistic
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Describe the plan and get honest feedback while you still have time to change it. The same
                  check every time, so two teams never get different advice.
                </p>
              </div>

              {/* Micro-UI: Interactive Track Selector & Rubric Progress */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-bold">PICK A CATEGORY:</span>
                  <div className="flex items-center space-x-1">
                    {(['ai', 'zk', 'infra'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveIdeaTrack(t)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          activeIdeaTrack === t
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                      <span>How hard the engineering is</span>
                      <span className="font-bold text-emerald-700">{trackMetrics[activeIdeaTrack].depth}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${trackMetrics[activeIdeaTrack].depth}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                      <span>How different it is</span>
                      <span className="font-bold text-teal-700">{trackMetrics[activeIdeaTrack].novelty}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${trackMetrics[activeIdeaTrack].novelty}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1 text-slate-700">
                      <span>Can it be finished in 48 hours</span>
                      <span className="font-bold text-emerald-800">{trackMetrics[activeIdeaTrack].feasibility}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                        style={{ width: `${trackMetrics[activeIdeaTrack].feasibility}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="truncate max-w-[200px]">{trackMetrics[activeIdeaTrack].tag}</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Good size for the time
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Locked Record */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex flex-col justify-between hover:border-amber-300 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans group-hover:text-amber-800 transition-colors">
                  A record nobody can quietly edit
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Every locked score is added to a chain, and each new link is tied to the one before it. Change
                  a single score anywhere and the whole check fails loudly.
                </p>
              </div>

              {/* Micro-UI: fingerprint Card */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-bold">
                  <span>FINGERPRINT FOR THIS ROUND</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    CANNOT BE FAKED
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white font-mono text-xs text-emerald-800 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <span className="truncate mr-2 font-bold select-all">0x7f49c2a81de09b3c4f78e19203a98762514bcda9e201</span>
                  <button
                    onClick={handleCopyRootHash}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
                    title="Copy the fingerprint"
                  >
                    {copiedRootHash ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Sample receipt: #BLT-99214</span>
                  <Link
                    href="/verify"
                    className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer font-bold shadow-2xs"
                  >
                    <span>Check it</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 4: Stepping Aside */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex flex-col justify-between hover:border-red-300 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans group-hover:text-red-700 transition-colors">
                  Judges can step aside instantly
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  If a judge knows a team, one click moves that project to a different judge straight away.
                  Nobody waits, and the schedule does not slip.
                </p>
              </div>

              {/* Micro-UI: Interactive Conflict Simulation Badge */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-bold">CONFLICT CHECK</span>
                  <button
                    onClick={triggerRecusalSimulation}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    {recusalSimulated ? 'Moving project...' : 'Try the demo'}
                  </button>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${
                  recusalSimulated
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      J3
                    </div>
                    <div className="text-xs font-mono">
                      <span className="text-slate-900 font-bold block">
                        {recusalSimulated ? 'Conflict found: this judge knows the team' : 'Ready if a conflict comes up'}
                      </span>
                      <span className="text-slate-500">
                        {recusalSimulated
                          ? `Moved to Judge #99A in ${recusalTimer}ms`
                          : 'One click swaps in another judge with no waiting'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-emerald-700 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> The schedule carries on
                  </span>
                  <span className="text-slate-500 font-normal">Takes under 40ms</span>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ========================================================================= */}
        {/* 4. METRICS STRIP                                                         */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-28">
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-8 sm:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 text-center">
              <div className="pt-4 sm:pt-0 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight mb-2">
                  {liveStats.teams > 0 ? liveStats.teams : 40}+
                </div>
                <div className="text-xs font-mono text-emerald-700 font-bold mb-1 uppercase tracking-wider">
                  Projects checked
                </div>
                <div className="text-xs text-slate-500">Across 3 categories</div>
              </div>

              <div className="pt-4 sm:pt-0 lg:pl-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-4xl sm:text-5xl font-black text-teal-700 font-mono tracking-tight mb-2">
                  {liveStats.ballots > 0 ? liveStats.ballots : 120}
                </div>
                <div className="text-xs font-mono text-teal-700 font-bold mb-1 uppercase tracking-wider">
                  Scores locked in
                </div>
                <div className="text-xs text-slate-500">Each one saved with proof</div>
              </div>

              <div className="pt-4 sm:pt-0 lg:pl-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono tracking-tight mb-2">
                  0
                </div>
                <div className="text-xs font-mono text-emerald-700 font-bold mb-1 uppercase tracking-wider">
                  Scores changed later
                </div>
                <div className="text-xs text-slate-500">Judges cannot see each other</div>
              </div>

              <div className="pt-4 sm:pt-0 lg:pl-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight mb-2">
                  100%
                </div>
                <div className="text-xs font-mono text-emerald-800 font-bold mb-1 uppercase tracking-wider">
                  Can be checked later
                </div>
                <div className="text-xs text-slate-500">Works online or fully offline</div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. INTERACTIVE 3D PODIUM STAGE                                           */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-28">
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-700 font-bold tracking-wider block mb-1">
                  MOVE THE MOUSE TO EXPLORE
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-sans">
                  The winners as a 3D stage
                </h3>
              </div>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs font-mono text-emerald-800 border border-emerald-200 transition-all cursor-pointer hover:scale-105 font-bold shadow-2xs"
              >
                <span>See every project</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </Link>
            </div>

            <div className="mt-6">
              <DefensiblePodiumScene />
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 6. PRE-FOOTER CLI DEPLOYMENT CARD                                        */}
        {/* ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-28 text-center">
          <div className="rounded-3xl p-8 sm:p-12 bg-emerald-50/80 border border-emerald-200 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xs font-mono uppercase text-emerald-800 font-bold tracking-wider mb-3">
                RUN YOUR OWN EVENT
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 max-w-xl mb-4 leading-tight">
                Set up your hackathon without arguing about scores afterwards
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mb-8 leading-relaxed">
                Start it on your own laptop in a few minutes, or put it online if you want people joining
                from different places.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Open the dashboard
                </Link>

                <div className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white border border-slate-200 font-mono text-xs text-slate-800 shadow-2xs hover:border-emerald-300 transition-colors cursor-pointer">
                  <span className="text-emerald-700 font-bold">$</span>
                  <span className="select-all">npx create-dogfood-event@latest</span>
                  <button
                    onClick={handleCopyCli}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-700 transition-colors ml-1 cursor-pointer"
                    title="Copy the command"
                  >
                    {copiedCli ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* 7. MINIMALIST TECHNICAL FOOTER                                            */}
      {/* ========================================================================= */}
      <footer className="w-full bg-white border-t border-slate-200 relative z-10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Copyright */}
          <Link href="/" className="flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:opacity-90">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">DOGFOOD OS</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-xs font-mono text-slate-500 text-center sm:text-left">
              © 2026 DOGFOOD OS. Fair hackathons, start to finish.
            </p>
          </Link>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-600">
            <Link href="/verify" className="hover:text-emerald-700 transition-colors cursor-pointer">
              How the checks work
            </Link>
            <Link href="/verify" className="hover:text-emerald-700 transition-colors cursor-pointer">
              Check a score
            </Link>
            <Link href="/dashboard" className="hover:text-emerald-700 transition-colors cursor-pointer">
              Organizer dashboard
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              GitHub
            </a>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Everything is running</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
