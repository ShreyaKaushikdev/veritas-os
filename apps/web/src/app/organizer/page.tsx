'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Sliders, AlertTriangle, ShieldCheck, Activity, Send, CheckCircle2, ArrowUpDown, HelpCircle, Download, Mail, Users, FileSpreadsheet, Clock, Image as ImageIcon, Check, Pin, LayoutDashboard, Sparkles, Copy, RefreshCw, Zap, Rocket, Terminal, Layers, Cpu } from 'lucide-react';

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUPPORT_INBOX' | 'AUDIENCE' | 'PROMPT_ORCHESTRATOR'>('OVERVIEW');
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
      }
    } catch (e) {
      console.warn('Deploy error:', e);
    } finally {
      setDeploying(false);
    }
  };

  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN').length;
  const isSpike = openTicketsCount >= 5;

  return (
    <div className="space-y-8">
      {/* Header & Autopilot Dial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-amber">
            <Award className="w-3.5 h-3.5" />
            <span>ORGANIZER OPERATIONS & POLICY ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Event overview</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-dark-900 border border-white/10 rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-brand-amber text-dark-950 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview & Sandbox
            </button>
            <button
              onClick={() => setActiveTab('SUPPORT_INBOX')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'SUPPORT_INBOX'
                  ? 'bg-brand-amber text-dark-950 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help requests</span>
              {openTicketsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-brand-crimson text-white font-bold">
                  {openTicketsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('AUDIENCE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'AUDIENCE'
                  ? 'bg-brand-amber text-dark-950 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'PROMPT_ORCHESTRATOR'
                  ? 'bg-gradient-to-r from-brand-emerald to-brand-teal text-dark-950 font-bold shadow-md'
                  : 'text-emerald-400 hover:text-white border border-emerald-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Prompt-to-Hackathon ⚡</span>
            </button>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 text-xs font-mono transition-all shadow-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Executive Cake View ✨</span>
          </Link>

          {/* Autopilot Dial Selector */}
          <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs font-mono">
            <span className="text-gray-400">AUTOPILOT:</span>
            {(['OFF', 'ASSIST', 'FULL'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAutopilotMode(mode)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  autopilotMode === mode
                    ? mode === 'FULL'
                      ? 'bg-brand-emerald text-dark-950 shadow-sm'
                      : 'bg-brand-amber text-dark-950 shadow-sm'
                    : 'text-gray-400 hover:text-white bg-dark-850'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SANDBOX */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400">HOW THE EVENT IS GOING</span>
              <div className="text-2xl font-black text-brand-emerald font-mono">94%</div>
              <p className="text-[11px] text-gray-400">All submissions frozen & verified</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400">SCORING PROGRESS</span>
              <div className="text-2xl font-black text-brand-teal font-mono">100%</div>
              <p className="text-[11px] text-gray-400">120 / 120 required ballots submitted</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400">JUDGES ONLINE</span>
              <div className="text-2xl font-black text-brand-violet font-mono">30 / 30</div>
              <p className="text-[11px] text-gray-400">Judges agreed on 3 practice sets</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400">SCORES THAT DISAGREE</span>
              <div className="text-2xl font-black text-brand-amber font-mono">1 Cluster</div>
              <p className="text-[11px] text-gray-400">σ = 2.4 exceeds 1.5 threshold</p>
            </div>
          </div>

          {/* Main Grid: Disagreement Routing & Weight Sensitivity Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Disagreement & Targeted Review Dispatch (5 cols) */}
            <div className="lg:col-span-5 glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-brand-amber" />
                <h2 className="font-bold text-sm text-gray-200">Where judges disagreed</h2>
              </div>

              <p className="text-xs text-gray-400">
                When primary ballots diverge significantly, the platform assigns a targeted 4th review instead of silently averaging disagreement.
              </p>

              <div className="p-3.5 rounded-lg bg-dark-900/80 border border-brand-amber/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">Project #1: Substratum Sync</span>
                  <span className="text-brand-amber font-bold">σ = 2.4 (High Dispersion)</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Judge #1 scored 9.2 (High Depth), Judge #3 scored 4.4 (Skeptical on WASM bridge).
                </p>

                <button
                  onClick={handleTriggerDisagreement}
                  disabled={disagreementDispatched}
                  className={`w-full py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    disagreementDispatched
                      ? 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30'
                      : 'bg-brand-amber text-dark-950 hover:opacity-90 shadow-sm'
                  }`}
                >
                  {disagreementDispatched ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Asked Dr. Becker for a 4th opinion</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask for a 4th opinion</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] font-mono text-gray-500 bg-dark-900/50 p-2.5 rounded border border-white/5">
                <strong>Reason given:</strong> "High score dispersion (σ = 2.4 &gt; 1.5). Assigning calibrated neutral judge to resolve uncertainty without corrupting raw ballots."
              </div>
            </div>

            {/* Weight Sensitivity Simulator (7 cols) */}
            <div className="lg:col-span-7 glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-brand-teal" />
                  <h2 className="font-bold text-sm text-gray-200">Try different score weights</h2>
                </div>
                <span className="text-[10px] font-mono text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/20">
                  NON-MUTATING SIMULATION
                </span>
              </div>

              <p className="text-xs text-gray-400">
                Slide rubric criteria weights in this sandbox to preview rank movement and highlight fragile positions before locking publication.
              </p>

              {/* Sliders Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-gray-400 mb-1">Depth: {weights.c1}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c1}
                    onChange={(e) => handleWeightChange('c1', Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Align: {weights.c2}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c2}
                    onChange={(e) => handleWeightChange('c2', Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Novel: {weights.c3}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c3}
                    onChange={(e) => handleWeightChange('c3', Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Evidence: {weights.c4}%</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={weights.c4}
                    onChange={(e) => handleWeightChange('c4', Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />
                </div>
              </div>

              {/* Dynamic Rank Movement Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-dark-900 text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="py-2 px-3">Event name</th>
                      <th className="py-2 px-3">Starting place</th>
                      <th className="py-2 px-3">Predicted place</th>
                      <th className="py-2 px-3">Rank Delta (Δ)</th>
                      <th className="py-2 px-3">How close it is</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {simulatedMovements.map((item, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="py-2.5 px-3 font-medium text-white">{item.title}</td>
                        <td className="py-2.5 px-3 text-gray-400">#{item.baseRank}</td>
                        <td className="py-2.5 px-3 text-brand-teal font-bold">#{item.simulatedRank}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.delta > 0
                              ? 'bg-brand-emerald/10 text-brand-emerald'
                              : item.delta < 0
                              ? 'bg-brand-crimson/10 text-brand-crimson'
                              : 'text-gray-500'
                          }`}>
                            {item.delta > 0 ? `+${item.delta}` : item.delta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.isFragile ? (
                            <span className="text-[10px] text-brand-amber font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Uncertain place</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            <div className="p-4 rounded-xl bg-brand-crimson/15 border border-brand-crimson/40 text-brand-crimson flex items-center justify-between font-mono animate-pulse shadow-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 shrink-0 text-brand-crimson" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    SUPPORT SPIKE DETECTED — {openTicketsCount} TICKETS IN LAST 15 MINUTES
                  </h3>
                  <p className="text-xs opacity-90">
                    High volume of submission failures detected near deadline boundary. Organizers alerted via MailHog.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-brand-crimson text-white text-xs font-bold shrink-0">
                CRITICAL ALERT
              </span>
            </div>
          )}

          {/* Tickets Stream */}
          <div className="space-y-4 font-mono">
            {supportTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`glass-card p-5 rounded-xl border transition-all ${
                  ticket.status === 'RESOLVED'
                    ? 'opacity-60 border-white/5'
                    : ticket.priority === 'URGENT'
                    ? 'border-brand-crimson/40 bg-dark-900/90 shadow-md'
                    : ticket.priority === 'HIGH'
                    ? 'border-brand-amber/30 bg-dark-900/80'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{ticket.ref}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.priority === 'URGENT'
                          ? 'bg-brand-crimson/20 text-brand-crimson border border-brand-crimson/40'
                          : ticket.priority === 'HIGH'
                          ? 'bg-brand-amber/20 text-brand-amber border border-brand-amber/40'
                          : 'bg-dark-850 text-gray-400 border border-white/10'
                      }`}
                    >
                      {ticket.priority}
                    </span>

                    {ticket.deadlineBoost && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-brand-violet/20 text-brand-violet border border-brand-violet/30 flex items-center space-x-1">
                        <Pin className="w-3 h-3" />
                        <span>DEADLINE</span>
                      </span>
                    )}

                    <span className="text-[10px] text-gray-400">from {ticket.reporterRole} ({ticket.reporterEmail})</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-400 flex items-center space-x-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Open {ticket.openMinutes}m</span>
                    </span>

                    {ticket.status === 'RESOLVED' ? (
                      <span className="px-2 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald text-xs font-bold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>RESOLVED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveTicket(ticket.id)}
                        className="px-3 py-1 rounded bg-brand-emerald text-dark-950 text-xs font-bold hover:opacity-90 shadow-sm"
                      >
                        Resolve Ticket
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <p className="text-xs text-gray-200 leading-relaxed">{ticket.message}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-gray-400">
                    <span>Sent to: <strong className="text-brand-teal">{ticket.page}</strong></span>
                    <span>Round: <strong className="text-gray-200">{ticket.eventRound}</strong></span>
                    <span>UA: <span className="text-gray-500 truncate max-w-xs">{ticket.userAgent}</span></span>
                    {ticket.hasScreenshot && (
                      <span className="text-brand-cyan flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Screenshot added</span>
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
          <div className="glass-card p-6 rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand-emerald" />
                  <span>Participant Audience & Google Sheets Export</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  One-click export of verified attendees. Directly importable into Google Sheets for organizer ops.
                </p>
              </div>

              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-emerald to-brand-teal text-dark-950 font-mono text-xs font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center space-x-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download as a spreadsheet</span>
              </button>
            </div>

            {/* Audience Table Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-dark-900 text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Track</th>
                    <th className="py-2.5 px-3">Also send me future event invites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">Elena Rostova</td>
                    <td className="py-2.5 px-3 text-gray-300">organizer@dogfood.local</td>
                    <td className="py-2.5 px-3 text-brand-amber">ORGANIZER</td>
                    <td className="py-2.5 px-3 text-gray-400">Operations</td>
                    <td className="py-2.5 px-3 text-gray-400">All</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">Developer 1</td>
                    <td className="py-2.5 px-3 text-gray-300">team1.leader@dogfood.local</td>
                    <td className="py-2.5 px-3 text-brand-violet">PARTICIPANT</td>
                    <td className="py-2.5 px-3 text-gray-200">Team Substratum</td>
                    <td className="py-2.5 px-3 text-gray-400">Verifiable Systems</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">Developer 2</td>
                    <td className="py-2.5 px-3 text-gray-300">team2.leader@dogfood.local</td>
                    <td className="py-2.5 px-3 text-brand-violet">PARTICIPANT</td>
                    <td className="py-2.5 px-3 text-gray-200">Team Kestrel</td>
                    <td className="py-2.5 px-3 text-gray-400">Autonomous Agents</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-bold">YES</span></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">Developer 3</td>
                    <td className="py-2.5 px-3 text-gray-300">team3.leader@dogfood.local</td>
                    <td className="py-2.5 px-3 text-brand-violet">PARTICIPANT</td>
                    <td className="py-2.5 px-3 text-gray-200">Team Chronos</td>
                    <td className="py-2.5 px-3 text-gray-400">Verifiable Systems</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-dark-850 text-gray-500">NO</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Broadcast Card */}
          <div className="glass-card p-6 rounded-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-teal" />
                <h3 className="font-bold text-sm text-white">Send to everyone who opted in</h3>
              </div>
              <span className="text-gray-400 text-[11px]">
                Targeting: <strong className="text-brand-teal">34 Opted-In Attendees</strong>
              </span>
            </div>

            <p className="text-gray-400 text-[11px]">
              Strict Privacy Enforcement: Announcements are only dispatched to attendees who explicitly opted in. Every email includes a one-click unsubscribe link.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Message</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-gray-500">
                  Dispatches via MailHog locally (localhost:8025) or production SMTP.
                </span>

                <button
                  onClick={handleSendBroadcast}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center space-x-2 ${
                    broadcastSent
                      ? 'bg-brand-emerald text-dark-950'
                      : 'bg-brand-teal text-dark-950 hover:opacity-90 shadow-md'
                  }`}
                >
                  {broadcastSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Message sent!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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
    </div>
  );
}
