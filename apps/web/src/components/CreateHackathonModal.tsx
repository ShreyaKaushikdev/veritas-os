'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Rocket,
  RefreshCw,
  Layers,
  Cpu,
  Award,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Shield,
  Zap,
  Clock,
  Sliders,
  FileCode2,
  ArrowRight
} from 'lucide-react';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (blueprint: any) => void;
}

export default function CreateHackathonModal({ isOpen, onClose, onCreated }: CreateHackathonModalProps) {
  const router = useRouter();
  const [creationMode, setCreationMode] = useState<'PROMPT' | 'MANUAL'>('PROMPT');
  
  // Prompt mode state
  const [promptInput, setPromptInput] = useState(
    'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.'
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedBlueprint, setSynthesizedBlueprint] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);

  // Manual mode state
  const [manualForm, setManualForm] = useState({
    name: 'Autonomous Agent Mesh Hackathon 2026',
    slug: 'agent-mesh-2026',
    durationHours: 48,
    participants: 450,
    prizeTotal: '$50,000',
    domain: 'Autonomous Agents & Distributed Tooling',
    track1Name: 'Multi-Agent Consensus & Swarms',
    track1Tagline: 'Decentralized agent coordination and peer-to-peer memory topologies.',
    track2Name: 'Deterministic Guardrails & Audit',
    track2Tagline: 'Verifiable execution sandboxes and tamper-evident trace logging.',
    track3Name: 'Sub-50ms Edge Models & WASM',
    track3Tagline: 'Local neural inference pipelines and lightweight compiled tools.',
  });

  if (!isOpen) return null;

  const presets = [
    {
      id: 'solana-ai',
      badge: '⚡ Web3 & AI',
      title: '48h Solana & Autonomous Agents ($60k)',
      prompt: 'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.',
    },
    {
      id: 'zk-systems',
      badge: '🛡️ Cryptography',
      title: '36h Zero Knowledge & Verifiable Systems ($40k)',
      prompt: 'Organize a 36-hour ZK Cryptography & Verifiable Systems hackathon for 300 participants, $40k prize pool, 3 tracks (Provable State Machines, Private Voting DAGs, Circom Compilers), strict blind evaluation, anti-collusion trimmed mean, and zero-knowledge receipts.',
    },
    {
      id: 'climate-depin',
      badge: '🌍 ClimateTech',
      title: '72h Climate & DePIN Microgrids ($100k)',
      prompt: 'Launch a 72-hour global ClimateTech and DePIN hackathon with 800 hackers, $100k quadratic funding pool, 4 tracks (Renewable Microgrids, Carbon Proofs, Edge Sensor Networks, Circular Supply Chain), anchor calibrated scoring, and automated tie-breaking.',
    },
    {
      id: 'infra-sys',
      badge: '⚙️ Systems',
      title: '48h High-Perf Developer Infra ($50k)',
      prompt: 'Host a 48-hour high-performance Developer Infra sprint with 400 developers, $50,000 in prizes, 3 tracks (WASM & Kernel runtimes, Distributed Consensus, High-throughput Storage), peer-blind grading, and mathematical Git velocity audit.',
    },
  ];

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

  const handleApplyBlueprint = async () => {
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
        setDeploySuccess(data.message || 'Hackathon successfully deployed live to MongoDB replica!');
        
        // Ensure user is Organizer role so they can immediately see the dashboard
        const currentStored = localStorage.getItem('dogfood_user');
        const userObj = currentStored ? JSON.parse(currentStored) : {};
        if (!userObj || userObj.role !== 'ORGANIZER' && userObj.role !== 'ADMIN') {
          const orgUser = { id: userObj.id || 'org-1', name: userObj.name || 'Elena Rostova', email: userObj.email || 'organizer@dogfood.local', role: 'ORGANIZER' };
          localStorage.setItem('dogfood_user', JSON.stringify(orgUser));
          window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: orgUser }));
        }

        window.dispatchEvent(new CustomEvent('hackathon_created', { detail: synthesizedBlueprint }));
        window.dispatchEvent(new Event('storage'));

        if (onCreated) onCreated(synthesizedBlueprint);
        setTimeout(() => {
          onClose();
          window.location.href = '/organizer';
        }, 1000);
      }
    } catch (e) {
      console.warn('Deploy error:', e);
    } finally {
      setDeploying(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    try {
      const manualBlueprint = {
        event: {
          name: manualForm.name,
          slug: manualForm.slug,
          domain: manualForm.domain,
          durationHours: Number(manualForm.durationHours),
          participants: Number(manualForm.participants),
          prizeTotal: manualForm.prizeTotal,
          blindReviewMode: true,
          pairwiseEloEnabled: true,
          autopilotMode: 'ASSIST',
        },
        tracks: [
          { id: 'track-1', name: manualForm.track1Name, tagline: manualForm.track1Tagline, color: '#10b981' },
          { id: 'track-2', name: manualForm.track2Name, tagline: manualForm.track2Tagline, color: '#06b6d4' },
          { id: 'track-3', name: manualForm.track3Name, tagline: manualForm.track3Tagline, color: '#8b5cf6' },
        ],
        rubric: {
          version: '1.0.0',
          isLocked: true,
          criteria: [
            { id: 'c1', name: 'Technical Depth & Architecture', weight: 0.35, minScore: 1, maxScore: 5, description: 'Engineering complexity and robustness.' },
            { id: 'c2', name: 'Algorithmic Novelty', weight: 0.25, minScore: 1, maxScore: 5, description: 'Originality and design insight.' },
            { id: 'c3', name: 'Working Implementation', weight: 0.20, minScore: 1, maxScore: 5, description: 'End-to-end reproducible demo.' },
            { id: 'c4', name: 'Domain Viability', weight: 0.20, minScore: 1, maxScore: 5, description: 'Deployment readiness and API ergonomics.' },
          ],
        },
        seedProjects: [
          { title: `${manualForm.name.split(' ')[0]} Core`, tagline: manualForm.track1Tagline, track: manualForm.track1Name, rank: 1, elo: 108.0, meanScore: 4.9 },
          { title: 'Verifiable Protocol Alpha', tagline: manualForm.track2Tagline, track: manualForm.track2Name, rank: 2, elo: 98.4, meanScore: 4.7 },
          { title: 'Edge Runtime Mesh', tagline: manualForm.track3Tagline, track: manualForm.track3Name, rank: 3, elo: 92.1, meanScore: 4.5 },
        ]
      };

      const res = await fetch('http://localhost:4000/autopilot/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualBlueprint),
      });

      if (res.ok) {
        setDeploySuccess(`Successfully created and deployed "${manualForm.name}"!`);
        
        // Ensure user is Organizer role
        const currentStored = localStorage.getItem('dogfood_user');
        const userObj = currentStored ? JSON.parse(currentStored) : {};
        if (!userObj || (userObj.role !== 'ORGANIZER' && userObj.role !== 'ADMIN')) {
          const orgUser = { id: userObj.id || 'org-1', name: userObj.name || 'Elena Rostova', email: userObj.email || 'organizer@dogfood.local', role: 'ORGANIZER' };
          localStorage.setItem('dogfood_user', JSON.stringify(orgUser));
          window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: orgUser }));
        }

        window.dispatchEvent(new CustomEvent('hackathon_created', { detail: manualBlueprint }));
        window.dispatchEvent(new Event('storage'));

        if (onCreated) onCreated(manualBlueprint);
        setTimeout(() => {
          onClose();
          window.location.href = '/organizer';
        }, 1000);
      }
    } catch (err) {
      console.warn('Manual create error:', err);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dark frosted backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Main Modal Card with Cloud Mesh Aurora Aura */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(16,185,129,0.15)] text-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Atmospheric Cloud / Aurora Ambient Glow Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 px-6 pt-6 pb-5 border-b border-emerald-500/20">
          
          {/* Radiant Mesh Orbs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar with Title and Close Button */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono border border-emerald-500/30 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-semibold uppercase tracking-wide">ORGANIZER HACKATHON SYNTHESIZER</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 mt-1">
                Create & Launch Hackathon
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Deploy an offline-first, peer-blind hackathon with normalized rubric vectors, automated anchor tiers, and zero cloud lock-in.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="relative z-10 flex items-center space-x-2 mt-5 p-1 bg-slate-950/70 border border-emerald-500/20 rounded-2xl w-fit text-xs font-mono">
            <button
              type="button"
              onClick={() => setCreationMode('PROMPT')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                creationMode === 'PROMPT'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Prompt-to-Hackathon (AI Fast) ⚡</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('MANUAL')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                creationMode === 'MANUAL'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Custom Blueprint Builder 🛠️</span>
            </button>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Success Banner */}
          {deploySuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-center space-x-3 text-xs font-mono shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block text-emerald-300">Deployment Complete</span>
                <span>{deploySuccess}</span>
              </div>
            </div>
          )}

          {/* MODE 1: PROMPT-TO-HACKATHON */}
          {creationMode === 'PROMPT' && (
            <div className="space-y-6">
              {/* Presets Header */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    1-Click High-Impact Templates:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Click to auto-synthesize
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPromptInput(preset.prompt);
                        handleSynthesize(preset.prompt);
                      }}
                      className="text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                          {preset.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                          Apply ⚡
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {preset.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Natural Language Prompt Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                  <span>Describe the Event in Plain English:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Specify duration, tracks, prize pool, or evaluation rules</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="e.g. Host a 48-hour Autonomous AI Agents & Robotics Hackathon with $60k in prizes, 3 tracks, 4 blind judges per team..."
                    className="w-full p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => handleSynthesize()}
                    disabled={synthesizing}
                    className="absolute right-3 bottom-3.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${synthesizing ? 'animate-spin' : ''}`} />
                    <span>{synthesizing ? 'Synthesizing...' : 'Synthesize ⚡'}</span>
                  </button>
                </div>
              </div>

              {/* Synthesized Blueprint Live Preview */}
              {synthesizedBlueprint ? (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-inner animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Synthesized Event Architecture
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      READY TO DEPLOY
                    </span>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">NAME</span>
                      <span className="font-bold text-white truncate block">{synthesizedBlueprint.event.name}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SCALE</span>
                      <span className="font-bold text-emerald-400">
                        {synthesizedBlueprint.event.durationHours}h • {synthesizedBlueprint.event.participants} Devs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">PRIZE POOL</span>
                      <span className="font-bold text-amber-400">{synthesizedBlueprint.event.prizeTotal}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">JUDGING ENGINE</span>
                      <span className="font-bold text-teal-400">Pairwise Elo (4x)</span>
                    </div>
                  </div>

                  {/* Tracks Preview */}
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-2">
                      Competitive Tracks ({synthesizedBlueprint.tracks.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {synthesizedBlueprint.tracks.map((t: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: t.color || '#10b981' }}
                            />
                            <span className="text-xs font-bold text-white truncate">{t.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{t.tagline}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rubric Criteria */}
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-2">
                      Normalized Rubric Criteria (Sum = 100%):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {synthesizedBlueprint.rubric.criteria.map((c: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-300 font-medium truncate">{c.name.split(' ')[0]}</span>
                            <span className="font-mono text-emerald-400 font-bold">{Math.round(c.weight * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.round(c.weight * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deploy Action Bar */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApplyBlueprint}
                      disabled={deploying}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Rocket className={`w-4 h-4 ${deploying ? 'animate-bounce' : ''}`} />
                      <span>{deploying ? 'Applying to Live Cluster...' : 'Deploy Blueprint Live to Cluster 🚀'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-mono text-slate-400">
                    Click <strong>"Synthesize ⚡"</strong> or pick any template preset above to generate the full architecture in 1 click.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: MANUAL FORM */}
          {creationMode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Hackathon Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={manualForm.slug}
                    onChange={(e) => setManualForm({ ...manualForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Duration (Hours)</label>
                  <input
                    type="number"
                    required
                    min={12}
                    max={336}
                    value={manualForm.durationHours}
                    onChange={(e) => setManualForm({ ...manualForm, durationHours: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Max Participants</label>
                  <input
                    type="number"
                    required
                    min={20}
                    value={manualForm.participants}
                    onChange={(e) => setManualForm({ ...manualForm, participants: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Prize Pool ($)</label>
                  <input
                    type="text"
                    required
                    value={manualForm.prizeTotal}
                    onChange={(e) => setManualForm({ ...manualForm, prizeTotal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tracks Section */}
              <div className="space-y-3 pt-2">
                <span className="text-slate-300 font-bold uppercase tracking-wider block">
                  Define Competition Tracks
                </span>

                {/* Track 1 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">Track #1</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Track Title"
                    value={manualForm.track1Name}
                    onChange={(e) => setManualForm({ ...manualForm, track1Name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Track Tagline & Scope"
                    value={manualForm.track1Tagline}
                    onChange={(e) => setManualForm({ ...manualForm, track1Tagline: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
                  />
                </div>

                {/* Track 2 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">Track #2</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Track Title"
                    value={manualForm.track2Name}
                    onChange={(e) => setManualForm({ ...manualForm, track2Name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Track Tagline & Scope"
                    value={manualForm.track2Tagline}
                    onChange={(e) => setManualForm({ ...manualForm, track2Tagline: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
                  />
                </div>

                {/* Track 3 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">Track #3</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Track Title"
                    value={manualForm.track3Name}
                    onChange={(e) => setManualForm({ ...manualForm, track3Name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Track Tagline & Scope"
                    value={manualForm.track3Tagline}
                    onChange={(e) => setManualForm({ ...manualForm, track3Tagline: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={deploying}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>{deploying ? 'Deploying Event...' : 'Launch Custom Hackathon 🚀'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
