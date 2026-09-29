'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Sliders, AlertTriangle, ShieldCheck, Activity, Send, CheckCircle2, ArrowUpDown, HelpCircle, Download, Mail, Users, FileSpreadsheet, Clock, Image as ImageIcon, Check, Pin, LayoutDashboard, Sparkles, Copy, RefreshCw, Zap, Rocket, Terminal, Layers, Cpu, PlusCircle, ArrowRight, Trash2, Lock } from 'lucide-react';
import CreateHackathonModal from '@/components/CreateHackathonModal';

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUPPORT_INBOX' | 'AUDIENCE' | 'PROMPT_ORCHESTRATOR'>('OVERVIEW');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [realStats, setRealStats] = useState<any>({
    event: { name: 'Live Hackathon Workspace', status: 'READY' },
    disputes: [],
    telemetry: {
      teamsRegistered: 0,
      assignedBallots: 0,
      ballotsSubmitted: 0,
      ballotsRemaining: 0,
      reviewCompletionPercentage: 0,
      calibratedMeanScore: 0,
      disputesFlagged: 0,
    }
  });
  const [liveProjects, setLiveProjects] = useState<any[]>([]);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState(
    'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.'
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedBlueprint, setSynthesizedBlueprint] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
  const [copiedToml, setCopiedToml] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState<'OFF' | 'ASSIST' | 'FULL'>('ASSIST');
  const [weights, setWeights] = useState({
    c1: 35, // Depth
    c2: 25, // Alignment
    c3: 20, // Novelty
    c4: 20, // Evidence
  });

  const [disagreementDispatched, setDisagreementDispatched] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(true);

  // Fetch active hackathons from the events API
  const fetchHackathons = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('dogfood_auth_token') || localStorage.getItem('dogfood_token');
      const res = await fetch(`${apiUrl}/api/v1/events`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHackathons(data);
        }
      }
    } catch (e) {
      console.warn('Events fetch error:', e);
    } finally {
      setHackathonsLoading(false);
    }
  };

  // Fetch real live stats & projects from backend
  const fetchLiveTelemetry = async () => {
    try {
      const res = await fetch('http://localhost:4000/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setRealStats(data);
      }
    } catch (e) {
      console.warn('Live stats fetch error:', e);
    }

    try {
      const projRes = await fetch('http://localhost:4000/submissions');
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) {
          setLiveProjects(projData);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchHackathons();
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 3000);

    const syncUser = () => {
      try {
        const savedUserStr = localStorage.getItem('dogfood_user');
        if (savedUserStr) {
          setCurrentUser(JSON.parse(savedUserStr));
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
      }
    };
    syncUser();

    const handleUserUpdate = (e: any) => {
      if (e.detail) setCurrentUser(e.detail);
      else syncUser();
    };

    const handleHackathonCreated = (e: any) => {
      fetchHackathons();
      fetchLiveTelemetry();
      setActiveTab('OVERVIEW');
      setClearSuccess(`🚀 "${e.detail?.event?.name || 'Hackathon'}" deployed! Showing real-time dashboard.`);
      setTimeout(() => setClearSuccess(null), 5000);
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('dogfood_user_updated', handleUserUpdate as EventListener);
    window.addEventListener('hackathon_created', handleHackathonCreated as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('dogfood_user_updated', handleUserUpdate as EventListener);
      window.removeEventListener('hackathon_created', handleHackathonCreated as EventListener);
    };
  }, []);

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all mock/seeded entries and run 100% on real live data?')) return;
    setClearing(true);
    try {
      const res = await fetch('http://localhost:4000/database/clear', {
        method: 'POST',
      });
      if (res.ok) {
        setClearSuccess('All mock entries wiped! Database is now 100% clean live slate.');
        setLiveProjects([]);
        setRealStats({
          event: { name: 'Clean Hackathon Workspace', status: 'READY' },
          disputes: [],
          telemetry: {
            teamsRegistered: 0,
            assignedBallots: 0,
            ballotsSubmitted: 0,
            ballotsRemaining: 0,
            reviewCompletionPercentage: 0,
            calibratedMeanScore: 0,
            disputesFlagged: 0,
          }
        });
        setTimeout(() => setClearSuccess(null), 4000);
      }
    } catch (e) {
      console.warn('Clear error:', e);
    } finally {
      setClearing(false);
    }
  };

  const handleReseedDatabase = async () => {
    setClearing(true);
    try {
      const res = await fetch('http://localhost:4000/database/reseed', {
        method: 'POST',
      });
      if (res.ok) {
        fetchLiveTelemetry();
        setClearSuccess('Sandbox demo entries seeded!');
        setTimeout(() => setClearSuccess(null), 4000);
      }
    } catch (e) {
      console.warn('Reseed error:', e);
    } finally {
      setClearing(false);
    }
  };

  // Simulated projects for weight sensitivity analysis
  const [simulatedMovements, setSimulatedMovements] = useState([
    { title: 'Substratum: Offline P2P Sync', baseRank: 1, simulatedRank: 1, delta: 0, isFragile: false },
    { title: 'Kestrel: WASM Agent Runtime', baseRank: 2, simulatedRank: 3, delta: -1, isFragile: false },
    { title: 'Ironclad: Verified Sandbox', baseRank: 3, simulatedRank: 2, delta: +1, isFragile: false },
    { title: 'Vectra: SIMD Vector Engine', baseRank: 4, simulatedRank: 7, delta: -3, isFragile: true },
    { title: 'Chronos: Event Sourced Ledger', baseRank: 5, simulatedRank: 4, delta: +1, isFragile: false },
  ]);

  // Support Inbox State
  const [supportTickets, setSupportTickets] = useState([
    {
      id: 't1',
      ref: '#SOS-A3F9',
      reporterRole: 'PARTICIPANT',
      reporterEmail: 'team1.leader@dogfood.local',
      page: '/submit',
      eventRound: 'SUBMISSION',
      message: "Cannot submit project: upload fails when attaching our architecture diagram. Deadline is in 3 hours!",
      priority: 'URGENT',
      deadlineBoost: true,
      openMinutes: 18,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0',
      hasScreenshot: true,
    },
    {
      id: 't2',
      ref: '#SOS-B8D2',
      reporterRole: 'JUDGE',
      reporterEmail: 'judge14@dogfood.local',
      page: '/judge',
      eventRound: 'JUDGING',
      message: "Score slider on criterion 3 'Novelty & Problem Insight' feels sticky when using keyboard shortcut '3'.",
      priority: 'HIGH',
      deadlineBoost: false,
      openMinutes: 34,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
      hasScreenshot: false,
    },
    {
      id: 't3',
      ref: '#SOS-C1E5',
      reporterRole: 'PARTICIPANT',
      reporterEmail: 'team22.leader@dogfood.local',
      page: '/participant',
      eventRound: 'SUBMISSION',
      message: "Idea Potential Coach report shows 48h budget, but we have a team of 4 (192 total hours). How to adjust?",
      priority: 'NORMAL',
      deadlineBoost: false,
      openMinutes: 52,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/125.0',
      hasScreenshot: false,
    },
    {
      id: 't4',
      ref: '#SOS-D4A1',
      reporterRole: 'PARTICIPANT',
      reporterEmail: 'team9.leader@dogfood.local',
      page: '/submit',
      eventRound: 'SUBMISSION',
      message: "Can't submit repo URL, validation says invalid GitHub protocol for git@github.com.",
      priority: 'URGENT',
      deadlineBoost: true,
      openMinutes: 12,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      hasScreenshot: true,
    },
    {
      id: 't5',
      ref: '#SOS-E9F3',
      reporterRole: 'PARTICIPANT',
      reporterEmail: 'team31.leader@dogfood.local',
      page: '/submit',
      eventRound: 'SUBMISSION',
      message: "Upload fail on demo video link MP4 streaming.",
      priority: 'URGENT',
      deadlineBoost: true,
      openMinutes: 6,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      hasScreenshot: false,
    },
    {
      id: 't6',
      ref: '#SOS-F2B8',
      reporterRole: 'PARTICIPANT',
      reporterEmail: 'team5.leader@dogfood.local',
      page: '/submit',
      eventRound: 'SUBMISSION',
      message: "Deadline freeze countdown showing 2 hours mismatch with our local timezone.",
      priority: 'URGENT',
      deadlineBoost: true,
      openMinutes: 2,
      status: 'OPEN',
      userAgent: 'Mozilla/5.0 (Macintosh)',
      hasScreenshot: true,
    },
  ]);

  // Audience State
  const [broadcastSubject, setBroadcastSubject] = useState('Final 3 Hours to Submission Freeze!');
  const [broadcastMessage, setBroadcastMessage] = useState('Reminder: All code repositories and demos must be frozen before 23:59 UTC. Late amends require manual organizer approval.');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleWeightChange = (key: 'c1' | 'c2' | 'c3' | 'c4', val: number) => {
    const newWeights = { ...weights, [key]: val };
    setWeights(newWeights);

    if (key === 'c4' && val > 30) {
      setSimulatedMovements([
        { title: 'Ironclad: Verified Sandbox', baseRank: 3, simulatedRank: 1, delta: +2, isFragile: true },
        { title: 'Substratum: Offline P2P Sync', baseRank: 1, simulatedRank: 2, delta: -1, isFragile: false },
        { title: 'Kestrel: WASM Agent Runtime', baseRank: 2, simulatedRank: 3, delta: -1, isFragile: false },
        { title: 'Chronos: Event Sourced Ledger', baseRank: 5, simulatedRank: 4, delta: +1, isFragile: false },
        { title: 'Vectra: SIMD Vector Engine', baseRank: 4, simulatedRank: 6, delta: -2, isFragile: true },
      ]);
    }
  };

  const handleTriggerDisagreement = () => {
    setDisagreementDispatched(true);
  };

  const handleResolveTicket = (id: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' } : t))
    );
  };

  const handleDownloadCsv = () => {
    const csvContent =
      `"Name","Email","Role","Team Name","Track","Email Opt-In Future","Registered At"\n` +
      `"Elena Rostova","organizer@dogfood.local","ORGANIZER","Operations","All","YES","2026-09-15T08:00:00Z"\n` +
      `"Developer 1","team1.leader@dogfood.local","PARTICIPANT","Team Substratum","Verifiable & Local-First Systems","YES","2026-09-16T10:12:00Z"\n` +
      `"Developer 2","team2.leader@dogfood.local","PARTICIPANT","Team Kestrel","Autonomous Agents & Local Tooling","YES","2026-09-16T11:45:00Z"\n` +
      `"Developer 3","team3.leader@dogfood.local","PARTICIPANT","Team Chronos","Verifiable & Local-First Systems","NO","2026-09-16T14:30:00Z"\n` +
      `"Judge Dr. Marcus Chen #1","judge1@dogfood.local","JUDGE","Panel","Autonomous Agents","YES","2026-09-15T09:00:00Z"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dogfood-attendees-google-sheets.csv';
    a.click();
  };

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const handleSynthesize = async (promptOverride?: string) => {
    const text = promptOverride || promptInput;
    setSynthesizing(true);
    setDeploySuccess(null);
    try {
      const res = await fetch('http://localhost:4000/autopilot/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setSynthesizedBlueprint(data);
      }
    } catch (e) {
      console.warn('Synthesize error:', e);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleApplyToCluster = async () => {
    if (!synthesizedBlueprint) return;
    setDeploying(true);
    try {
      const res = await fetch('http://localhost:4000/autopilot/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(synthesizedBlueprint),
      });
      if (res.ok) {
        const data = await res.json();
        setDeploySuccess(data.message || 'Hackathon successfully deployed to live cluster!');
        fetchLiveTelemetry();
        window.dispatchEvent(new CustomEvent('hackathon_created', { detail: synthesizedBlueprint }));
        setTimeout(() => {
          setActiveTab('OVERVIEW');
          setClearSuccess(`🚀 "${synthesizedBlueprint?.event?.name || 'Hackathon'}" deployed! Showing real-time dashboard.`);
          setTimeout(() => setClearSuccess(null), 5000);
        }, 1200);
      }
    } catch (e) {
      console.warn('Deploy error:', e);
    } finally {
      setDeploying(false);
    }
  };

  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN').length;
  const isSpike = openTicketsCount >= 5;

  // STRICT RBAC GUARD: Non-Organizers/Non-Admins cannot view the Organizer Control Center or Create Hackathon tools
  if (!currentUser || (currentUser.role !== 'ORGANIZER' && currentUser.role !== 'ADMIN')) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full rounded-3xl bg-slate-900/95 border border-slate-800 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6 text-center relative overflow-hidden">
          {/* Ambient Security Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Security Shield Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ORGANIZER PERMISSIONS REQUIRED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {currentUser ? 'Restricted to Event Organizers' : 'Sign In Required'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Event creation, prompt synthesis, rubric weights calibration, and live autopilot are strictly restricted to <strong className="text-white">Organizers</strong>.
            </p>
          </div>

          {/* Current Persona Card */}
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Signed in as</div>
                <div className="text-white font-bold text-sm mt-0.5">{currentUser.name}</div>
                <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                currentUser.role === 'JUDGE' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              }`}>
                {currentUser.role}
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-400">
              You are currently signed out (Visitor mode).
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                const u = { name: 'Dr. Elena Rostova', email: 'elena@dogfood.os', role: 'ORGANIZER' };
                localStorage.setItem('dogfood_user', JSON.stringify(u));
                setCurrentUser(u);
                window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: u }));
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch to Elena (Organizer Persona)</span>
            </button>

            <Link
              href={currentUser?.role === 'JUDGE' ? '/judge' : '/participant'}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono border border-slate-700 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Go to {currentUser?.role === 'JUDGE' ? 'Judge Cockpit' : 'Participant Hub'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ATMOSPHERIC CLOUD GESTURE HERO BANNER (Stitch Obsidian & Mobbin Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(16,185,129,0.12)]">
        {/* Luminous Mesh Cloud Orbs */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono border border-emerald-500/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="font-semibold uppercase tracking-wider">AUTONOMOUS HACKATHON OPERATING ENGINE</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Event Operations & Control Center
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Synthesize and deploy hackathons in seconds with prompt-to-rubric calibration, pairwise Elo ranking, and zero cloud runtime lock-in.
            </p>

            {/* Quick Template Presets Row */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-semibold mr-1">Quick Presets:</span>
              {[
                { label: '⚡ Solana & AI ($60k)', prompt: 'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.' },
                { label: '🛡️ ZK Cryptography ($40k)', prompt: 'Organize a 36-hour ZK Cryptography & Verifiable Systems hackathon for 300 participants, $40k prize pool, 3 tracks (Provable State Machines, Private Voting DAGs, Circom Compilers), strict blind evaluation, anti-collusion trimmed mean, and zero-knowledge receipts.' },
                { label: '🌍 ClimateTech DePIN ($100k)', prompt: 'Launch a 72-hour global ClimateTech and DePIN hackathon with 800 hackers, $100k quadratic funding pool, 4 tracks (Renewable Microgrids, Carbon Proofs, Edge Sensor Networks, Circular Supply Chain), anchor calibrated scoring, and automated tie-breaking.' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(p.prompt);
                    setActiveTab('PROMPT_ORCHESTRATOR');
                    handleSynthesize(p.prompt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-mono transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {/* Primary Eye-Catching Create Hackathon Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <span>+ Create Hackathon</span>
            </button>

            {/* Prompt-to-Hackathon Tab Shortcut */}
            <button
              onClick={() => {
                setActiveTab('PROMPT_ORCHESTRATOR');
                if (!synthesizedBlueprint) handleSynthesize();
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-emerald-400 hover:text-white border border-emerald-500/40 hover:border-emerald-500 text-xs font-mono font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>⚡ Prompt-to-Hackathon</span>
            </button>

            {/* Clear Database (Clean Slate) Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearDatabase}
                disabled={clearing}
                title="Wipe all mock/seeded records to run 100% on real live data"
                className="flex-1 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-mono font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{clearing ? 'Clearing...' : 'Clear All Entries 🧹'}</span>
              </button>
              
              <button
                onClick={handleReseedDatabase}
                disabled={clearing}
                title="Seed demo hackathon state"
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-[11px] font-mono transition-all cursor-pointer"
              >
                Seed Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Success Alert */}
      {clearSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-center justify-between text-xs font-mono shadow-md animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{clearSuccess}</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">LIVE REPLICA SYNCED</span>
        </div>
      )}

      {/* Tabs Bar & Autopilot Mode Dial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono shadow-sm">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Sandbox
          </button>
          <button
            onClick={() => setActiveTab('SUPPORT_INBOX')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'SUPPORT_INBOX'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help requests</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-bold">
                {openTicketsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('AUDIENCE')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'AUDIENCE'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Audience & Sheets</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('PROMPT_ORCHESTRATOR');
              if (!synthesizedBlueprint) handleSynthesize();
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'PROMPT_ORCHESTRATOR'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-white border border-emerald-500/30 bg-emerald-500/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Prompt-to-Hackathon ⚡</span>
          </button>
        </div>

        {/* Secondary Links & Autopilot Dial */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 text-xs font-mono transition-all shadow-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Executive Cake View ✨</span>
          </Link>

          {/* Autopilot Dial Selector */}
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-slate-400 px-2">AUTOPILOT:</span>
            {(['OFF', 'ASSIST', 'FULL'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAutopilotMode(mode)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  autopilotMode === mode
                    ? mode === 'FULL'
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SANDBOX (CONNECTED TO REAL LIVE BACKEND DATA) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ACTIVE HACKATHONS LIST                                         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Your Hackathons</h2>
                  <p className="text-[11px] font-mono text-slate-400">Active events created via the platform</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs font-mono shadow-md flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-98"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New Hackathon</span>
              </button>
            </div>

            {hackathonsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse">
                    <div className="h-5 w-2/3 bg-slate-800 rounded mb-3" />
                    <div className="h-3 w-full bg-slate-800/60 rounded mb-2" />
                    <div className="h-3 w-4/5 bg-slate-800/40 rounded" />
                  </div>
                ))}
              </div>
            ) : hackathons.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-dashed border-slate-700 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-300">No Hackathons Yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Create your first hackathon to see it listed here. Use the prompt orchestrator or the form to get started.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs font-mono shadow-lg cursor-pointer transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Hackathon</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hackathons.map((event: any) => {
                  const statusColors: Record<string, string> = {
                    'DRAFT': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                    'REGISTRATION_OPEN': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    'SUBMISSION_OPEN': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    'SUBMISSION_FROZEN': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                    'JUDGING_OPEN': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                    'RESULTS_FINALIZED': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    'RESULTS_PUBLISHED': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                    'ARCHIVED': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
                  };
                  const statusLabel = (event.status || 'DRAFT').replace(/_/g, ' ');
                  const statusClass = statusColors[event.status] || statusColors['DRAFT'];
                  const isActive = !['ARCHIVED', 'RESULTS_PUBLISHED'].includes(event.status);
                  const teamCount = event._count?.teams ?? 0;
                  const projectCount = event._count?.projects ?? 0;

                  return (
                    <div
                      key={event.id}
                      className={`group relative p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                        isActive
                          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border-emerald-500/25 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Active pulse dot */}
                      {isActive && (
                        <div className="absolute top-4 right-4">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-emerald-400" />
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusClass}`}>
                          {statusLabel}
                        </span>

                        {/* Event Name */}
                        <h3 className="text-base font-black text-white tracking-tight leading-snug pr-6">
                          {event.name}
                        </h3>

                        {/* Description */}
                        {event.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {/* Tracks */}
                        {event.tracks && event.tracks.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tracks.slice(0, 4).map((track: any, i: number) => (
                              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                {track.name || track}
                              </span>
                            ))}
                            {event.tracks.length > 4 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500">+{event.tracks.length - 4}</span>
                            )}
                          </div>
                        )}

                        {/* Metrics Row */}
                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span><strong className="text-white">{teamCount}</strong> teams</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            <span><strong className="text-white">{projectCount}</strong> projects</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <Link
                            href={`/organizer/command-center?eventId=${event.id}`}
                            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-[11px] font-mono font-bold text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Command Center</span>
                          </Link>
                          <Link
                            href={`/organizer/create-event?edit=${event.id}`}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono font-bold text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800/50" />
          {/* Active Hackathon Live Status Bar */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE WORKSPACE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Status: <strong className="text-white">{realStats?.event?.status || 'JUDGING_OPEN'}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {realStats?.event?.name || 'Live Autonomous Hackathon Workspace'}
                </h2>
                {realStats?.event?.tracks && realStats.event.tracks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {realStats.event.tracks.map((t: any, i: number) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {t.name || t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={`/organizer/command-center?eventId=${realStats?.event?.id || 'live'}`}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs font-mono shadow-md flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-950" />
                <span>Command Center ↗</span>
              </Link>
              <Link
                href="/gallery"
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Gallery</span>
              </Link>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs font-mono border border-emerald-500/30 flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Prompt ✨</span>
              </button>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-xl space-y-1.5 hover:border-emerald-500/40 transition-all">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">HOW THE EVENT IS GOING</span>
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {realStats?.telemetry?.teamsRegistered > 0
                  ? `${Math.min(100, Math.round((realStats.telemetry.teamsRegistered / (realStats?.event?.participants || 400)) * 100))}%`
                  : '0%'}
              </div>
              <p className="text-xs text-slate-300">
                {realStats?.telemetry?.teamsRegistered > 0
                  ? `${realStats.telemetry.teamsRegistered} / ${realStats?.event?.participants || 400} teams registered`
                  : '0 registered • Awaiting team submissions'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-xl space-y-1.5 hover:border-teal-500/40 transition-all">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">SCORING PROGRESS</span>
              <div className="text-3xl font-black text-teal-400 font-mono tracking-tight">
                {realStats?.telemetry?.assignedBallots > 0 ? `${realStats?.telemetry?.reviewCompletionPercentage ?? 0}%` : '0%'}
              </div>
              <p className="text-xs text-slate-300">
                {realStats?.telemetry?.assignedBallots > 0
                  ? `${realStats?.telemetry?.ballotsSubmitted || 0} / ${realStats.telemetry.assignedBallots} required ballots submitted`
                  : '0 ballots assigned • Build phase'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-xl space-y-1.5 hover:border-purple-500/40 transition-all">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">JUDGES ONLINE</span>
              <div className="text-3xl font-black text-purple-400 font-mono tracking-tight">
                {realStats?.telemetry?.judgesOnline ?? 0}
              </div>
              <p className="text-xs text-slate-300">
                {(realStats?.telemetry?.judgesOnline ?? 0) > 0
                  ? `${realStats.telemetry.judgesOnline} active judges registered`
                  : '0 judges online • Awaiting judge check-in'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-xl space-y-1.5 hover:border-amber-500/40 transition-all">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">SCORES THAT DISAGREE</span>
              <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                {realStats?.disputes?.length || 0} Cluster{realStats?.disputes?.length === 1 ? '' : 's'}
              </div>
              <p className="text-xs text-slate-300">
                {realStats?.disputes?.length > 0 ? `${realStats.disputes.length} active dispute(s) detected` : '0 disputes • Consensus achieved'}
              </p>
            </div>
          </div>

          {/* Main Grid: Disagreement Routing & Weight Sensitivity Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Disagreement & Targeted Review Dispatch (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base text-white">Where judges disagreed</h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                When primary ballots diverge significantly, the platform assigns a targeted 4th review instead of silently averaging disagreement.
              </p>

              {realStats?.disputes && realStats.disputes.length > 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white truncate">{realStats.disputes[0].projectTitle || 'Project Disagreement'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                      Δ = {realStats.disputes[0].delta || 1.8} (High Dispersion)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {realStats.disputes[0].judgeA} vs. {realStats.disputes[0].judgeB}
                  </p>

                  <button
                    onClick={handleTriggerDisagreement}
                    disabled={disagreementDispatched}
                    className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      disagreementDispatched
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                    }`}
                  >
                    {disagreementDispatched ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Asked calibrated judge for 4th opinion</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Ask for a 4th opinion</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2 text-center py-6">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white font-mono">0 Inter-Judge Disagreements</p>
                  <p className="text-[11px] text-slate-400">All live ballots are in mathematical consensus (σ &lt; 1.5) or no live disputes are currently open.</p>
                </div>
              )}

              <div className="text-xs font-mono text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
                <strong className="text-slate-300">Policy:</strong> "When score dispersion exceeds threshold (σ &gt; 1.5), DOGFOOD OS assigns calibrated neutral judge without corrupting raw ballots."
              </div>
            </div>

            {/* Weight Sensitivity Simulator (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  <h2 className="font-bold text-base text-white">Try different score weights</h2>
                </div>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/30 font-semibold">
                  NON-MUTATING SIMULATION
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Slide rubric criteria weights in this sandbox to preview rank movement and highlight fragile positions before locking publication.
              </p>

              {/* Sliders Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-300 mb-1 font-semibold">Depth: {weights.c1}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c1}
                    onChange={(e) => handleWeightChange('c1', Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-300 mb-1 font-semibold">Align: {weights.c2}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c2}
                    onChange={(e) => handleWeightChange('c2', Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-300 mb-1 font-semibold">Novel: {weights.c3}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c3}
                    onChange={(e) => handleWeightChange('c3', Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-slate-300 mb-1 font-semibold">Evidence: {weights.c4}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c4}
                    onChange={(e) => handleWeightChange('c4', Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic Rank Movement Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                {liveProjects.length > 0 ? (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Project title</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Starting place</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Predicted place</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Rank Delta (Δ)</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">How close it is</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                      {liveProjects.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">{item.title || item.name}</td>
                          <td className="py-3 px-3 text-slate-400">#{item.rank || (i + 1)}</td>
                          <td className="py-3 px-3 text-teal-400 font-bold">#{item.rank || (i + 1)}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              0
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] text-slate-400">Settled</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center bg-slate-950/60 rounded-xl space-y-2">
                    <Cpu className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-300 font-mono font-bold">0 Projects in Live Database</p>
                    <p className="text-[11px] text-slate-400">Database is running on clean live mode. Create a hackathon via <strong>Prompt-to-Hackathon ⚡</strong> or submit a project from <strong>/participant</strong>.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOS SUPPORT INBOX */}
      {activeTab === 'SUPPORT_INBOX' && (
        <div className="space-y-6">
          {/* Spike Alert Banner */}
          {isSpike && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 flex items-center justify-between font-mono animate-pulse shadow-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white">
                    SUPPORT SPIKE DETECTED — {openTicketsCount} TICKETS IN LAST 15 MINUTES
                  </h3>
                  <p className="text-xs text-red-200/90">
                    High volume of submission failures detected near deadline boundary. Organizers alerted via MailHog.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-red-500 text-white text-xs font-bold shrink-0">
                CRITICAL ALERT
              </span>
            </div>
          )}

          {/* Tickets Stream */}
          <div className="space-y-4 font-mono">
            {supportTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ticket.status === 'RESOLVED'
                    ? 'opacity-60 border-slate-800 bg-slate-900/50'
                    : ticket.priority === 'URGENT'
                    ? 'border-red-500/40 bg-slate-900/95 shadow-md shadow-red-950/30'
                    : ticket.priority === 'HIGH'
                    ? 'border-amber-500/40 bg-slate-900/95'
                    : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{ticket.ref}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.priority === 'URGENT'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : ticket.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {ticket.priority}
                    </span>

                    {ticket.deadlineBoost && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1 font-bold">
                        <Pin className="w-3 h-3" />
                        <span>DEADLINE</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">from {ticket.reporterRole} ({ticket.reporterEmail})</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400 flex items-center space-x-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Open {ticket.openMinutes}m</span>
                    </span>

                    {ticket.status === 'RESOLVED' ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RESOLVED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveTicket(ticket.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Resolve Ticket
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{ticket.message}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-400">
                    <span>Sent to: <strong className="text-teal-400 font-mono">{ticket.page}</strong></span>
                    <span>Round: <strong className="text-slate-200">{ticket.eventRound}</strong></span>
                    <span>UA: <span className="text-slate-500 truncate max-w-xs">{ticket.userAgent}</span></span>
                    {ticket.hasScreenshot && (
                      <span className="text-cyan-400 flex items-center space-x-1 font-semibold">
                        <ImageIcon className="w-3 h-3" />
                        <span>Screenshot attached</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIENCE & GOOGLE SHEETS */}
      {activeTab === 'AUDIENCE' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Participant Audience & Google Sheets Export</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  One-click export of verified attendees. Directly importable into Google Sheets for organizer ops.
                </p>
              </div>

              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono text-xs font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Download as a spreadsheet</span>
              </button>
            </div>

            {/* Audience Table Preview */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Name</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Email</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Role</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Team</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Track</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Opt-In Future</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">Elena Rostova</td>
                    <td className="py-3 px-3 text-slate-300">organizer@dogfood.local</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">ORGANIZER</td>
                    <td className="py-3 px-3 text-slate-300">Operations</td>
                    <td className="py-3 px-3 text-slate-400">All</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">Developer 1</td>
                    <td className="py-3 px-3 text-slate-300">team1.leader@dogfood.local</td>
                    <td className="py-3 px-3 text-purple-400 font-bold">PARTICIPANT</td>
                    <td className="py-3 px-3 text-slate-200">Team Substratum</td>
                    <td className="py-3 px-3 text-slate-400">Verifiable Systems</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">Developer 2</td>
                    <td className="py-3 px-3 text-slate-300">team2.leader@dogfood.local</td>
                    <td className="py-3 px-3 text-purple-400 font-bold">PARTICIPANT</td>
                    <td className="py-3 px-3 text-slate-200">Team Kestrel</td>
                    <td className="py-3 px-3 text-slate-400">Autonomous Agents</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">Developer 3</td>
                    <td className="py-3 px-3 text-slate-300">team3.leader@dogfood.local</td>
                    <td className="py-3 px-3 text-purple-400 font-bold">PARTICIPANT</td>
                    <td className="py-3 px-3 text-slate-200">Team Chronos</td>
                    <td className="py-3 px-3 text-slate-400">Verifiable Systems</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500">NO</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Broadcast Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm text-white">Send broadcast to opted-in attendees</h3>
              </div>
              <span className="text-slate-400 text-[11px]">
                Targeting: <strong className="text-teal-400">34 Opted-In Attendees</strong>
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-sans">
              Strict Privacy Enforcement: Announcements are only dispatched to attendees who explicitly opted in. Every email includes a one-click unsubscribe link.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Message</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <span className="text-[11px] text-slate-500">
                  Dispatches via MailHog locally (localhost:8025) or production SMTP.
                </span>

                <button
                  onClick={handleSendBroadcast}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    broadcastSent
                      ? 'bg-emerald-400 text-slate-950 shadow-md'
                      : 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-md'
                  }`}
                >
                  {broadcastSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Message sent!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>Send the message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTONOMOUS PROMPT-TO-HACKATHON ORCHESTRATOR */}
      {activeTab === 'PROMPT_ORCHESTRATOR' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 border border-emerald-500/30 p-6 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>WRITE MESSAGES FOR ME</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Natural Language Prompt-to-Hackathon
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Describe the hackathon you want to run in plain English. DOGFOOD OS autonomously formulates the mathematical rubric vectors, track schemas, anchor calibrations, prize brackets, and deploys it live into MongoDB.
                </p>
              </div>

              {synthesizedBlueprint && (
                <button
                  onClick={handleApplyToCluster}
                  disabled={deploying}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-dark-950 font-bold text-xs shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Rocket className={`w-4 h-4 ${deploying ? 'animate-bounce' : ''}`} />
                  <span>{deploying ? 'Deploying to Cluster...' : 'Deploy Blueprint Live 🚀'}</span>
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-2">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: '⚡ 48h Solana & Autonomous Agents ($60k)',
                    prompt: 'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.',
                  },
                  {
                    label: '🛡️ 36h Zero Knowledge & Verifiable Systems ($40k)',
                    prompt: 'Organize a 36-hour ZK Cryptography & Verifiable Systems hackathon for 300 participants, $40k prize pool, 3 tracks (Provable State Machines, Private Voting DAGs, Circom Compilers), strict blind evaluation, anti-collusion trimmed mean, and zero-knowledge receipts.',
                  },
                  {
                    label: '🌍 72h ClimateTech & DePIN Microgrids ($100k)',
                    prompt: 'Launch a 72-hour global ClimateTech and DePIN hackathon with 800 hackers, $100k quadratic funding pool, 4 tracks (Renewable Microgrids, Carbon Proofs, Edge Sensor Networks, Circular Supply Chain), anchor calibrated scoring, and automated tie-breaking.',
                  },
                  {
                    label: '⚙️ 48h High-Perf Developer Infra ($50k)',
                    prompt: 'Host a 48-hour high-performance Developer Infra sprint with 400 developers, $50,000 in prizes, 3 tracks (WASM & Kernel runtimes, Distributed Consensus, High-throughput Storage), peer-blind grading, and mathematical Git velocity audit.',
                  },
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPromptInput(preset.prompt);
                      handleSynthesize(preset.prompt);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-gray-300 hover:text-white border border-white/10 hover:border-emerald-500/40 text-xs font-mono transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="mt-4">
              <div className="relative">
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Host a 48-hour AI Agents & Robotics hackathon with $50k in prizes, 3 tracks..."
                  className="w-full p-3.5 bg-dark-950/80 border border-emerald-500/30 rounded-xl text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-inner"
                />
                <button
                  onClick={() => handleSynthesize()}
                  disabled={synthesizing}
                  className="absolute right-3 bottom-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-950 text-xs font-mono font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${synthesizing ? 'animate-spin' : ''}`} />
                  <span>{synthesizing ? 'Synthesizing...' : 'Synthesize Blueprint ⚡'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deployment Success Alert */}
          {deploySuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono text-emerald-200">{deploySuccess}</span>
              </div>
              <Link
                href="/gallery"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-dark-950 font-mono text-xs font-bold hover:bg-emerald-400 transition-all flex items-center space-x-1 shrink-0"
              >
                <span>See all projects</span>
                <span>↗</span>
              </Link>
            </div>
          )}

          {/* Synthesized Blueprint Visualizer */}
          {synthesizedBlueprint && (
            <div className="space-y-6 animate-fadeIn">
              {/* Event Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Event Title</span>
                  <p className="text-xs font-bold text-white mt-1 truncate">{synthesizedBlueprint.event.name}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Duration & Scale</span>
                  <p className="text-xs font-bold text-emerald-400 mt-1">
                    {synthesizedBlueprint.event.durationHours}h • {synthesizedBlueprint.event.participants} Hackers
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Prizes</span>
                  <p className="text-xs font-bold text-brand-amber mt-1">{synthesizedBlueprint.event.prizeTotal}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">How scoring works</span>
                  <p className="text-xs font-bold text-cyan-400 mt-1">Blind Peer Review (4x)</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">How the winner is picked</span>
                  <p className="text-xs font-bold text-purple-400 mt-1">Head-to-head results</p>
                </div>
              </div>

              {/* Synthesized Competitive Tracks */}
              <div>
                <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Synthesized Competitive Tracks ({synthesizedBlueprint.tracks.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {synthesizedBlueprint.tracks.map((t: any, idx: number) => (
                    <div
                      key={t.id || idx}
                      className="p-4 rounded-xl bg-dark-900 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                            style={{ backgroundColor: `${t.color || '#10b981'}20`, color: t.color || '#10b981' }}
                          >
                            Track #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">{t.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{t.name}</h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t.tagline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mathematically Normalized Rubric Matrix */}
              <div>
                <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  <span>Mathematically Normalized Rubric Vector (Σ Weight = 1.0)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {synthesizedBlueprint.rubric.criteria.map((c: any, i: number) => (
                    <div key={c.id || i} className="p-3.5 rounded-xl bg-dark-900 border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-200">{c.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                            {Math.round(c.weight * 100)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal">{c.description}</p>
                      </div>
                      <div className="mt-3 w-full bg-dark-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${c.weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calibration Anchors */}
              <div>
                <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-amber" />
                  <span>Practice projects for judges</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {synthesizedBlueprint.anchors.map((a: any, i: number) => (
                    <div key={a.id || i} className="p-3.5 rounded-xl bg-dark-900 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{a.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-amber/20 text-brand-amber">
                          Baseline: {a.baselineScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal">{a.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exportable .dogfood.toml Manifest */}
              <div className="p-4 rounded-xl bg-dark-950 border border-white/10 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Settings used: <strong>.dogfood.toml</strong></span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(synthesizedBlueprint.manifestToml);
                      setCopiedToml(true);
                      setTimeout(() => setCopiedToml(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white text-xs flex items-center space-x-1 cursor-pointer transition-all border border-white/10"
                  >
                    {copiedToml ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy settings</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] text-emerald-300 overflow-x-auto max-h-56 p-2 bg-dark-900 rounded-lg">
                  {synthesizedBlueprint.manifestToml}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Create Hackathon Modal */}
      <CreateHackathonModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(blueprint) => {
          setSynthesizedBlueprint(blueprint);
          setActiveTab('PROMPT_ORCHESTRATOR');
        }}
      />
    </div>
  );
}
