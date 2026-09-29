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
  ArrowRight,
  Plus,
  Trash2,
  Palette
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (blueprint: any) => void;
  initialMode?: 'PROMPT' | 'MANUAL';
}

export default function CreateHackathonModal({ isOpen, onClose, onCreated, initialMode = 'PROMPT' }: CreateHackathonModalProps) {
  const router = useRouter();
  const [creationMode, setCreationMode] = useState<'PROMPT' | 'MANUAL'>(initialMode);
  const prevIsOpenRef = React.useRef(isOpen);

  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setCreationMode(initialMode);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialMode]);
  
  // Dynamic tracks state for manual blueprint builder
  const [manualTracks, setManualTracks] = useState<Array<{ id: string; name: string; tagline: string; color: string }>>([
    { id: 'track-1', name: 'Multi-Agent Consensus & Swarms', tagline: 'Decentralized agent coordination and peer-to-peer memory topologies.', color: '#10b981' },
    { id: 'track-2', name: 'Deterministic Guardrails & Audit', tagline: 'Verifiable execution sandboxes and tamper-evident trace logging.', color: '#06b6d4' },
    { id: 'track-3', name: 'Sub-50ms Edge Models & WASM', tagline: 'Local neural inference pipelines and lightweight compiled tools.', color: '#8b5cf6' },
  ]);

  const handleAddTrack = () => {
    const palette = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'];
    const nextColor = palette[manualTracks.length % palette.length];
    setManualTracks((prev) => [
      ...prev,
      {
        id: `track-${Date.now()}`,
        name: `Track #${prev.length + 1}`,
        tagline: 'Scope and objective for this competitive track.',
        color: nextColor,
      }
    ]);
  };

  const handleRemoveTrack = (index: number) => {
    if (manualTracks.length <= 1) return;
    setManualTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: 'name' | 'tagline' | 'color', val: string) => {
    setManualTracks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

    // Prompt mode state
  const [promptInput, setPromptInput] = useState(
    'Run a 48-hour Solana & Autonomous Agents Hackathon with 500 hackers, $60,000 prize pool, 3 tracks (DeFi Execution Agents, ZK Proof Verification, DePIN Mesh), 4 judges per project with blind peer evaluation, anchor calibration, and pairwise Elo ranking.'
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedBlueprint, setSynthesizedBlueprint] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual mode state
  const [manualForm, setManualForm] = useState({
    name: 'Autonomous Agent Mesh Hackathon 2026',
    slug: 'agent-mesh-2026',
    durationHours: 48,
    participants: 450,
    prizeTotal: '$50,000',
    domain: 'Autonomous Agents & Distributed Tooling',
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
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/autopilot/synthesize`, {
        method: 'POST',
        headers: (() => {
          const t = typeof window !== 'undefined' ? (localStorage.getItem('dogfood_auth_token') || localStorage.getItem('dogfood_token') || 'demo-organizer-token') : 'demo-organizer-token';
          return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` };
        })(),
        body: JSON.stringify({ prompt: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setSynthesizedBlueprint(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || `Failed to synthesize: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.warn('Synthesize error:', e);
      setErrorMessage(`Unable to reach the API at ${API_BASE_URL || window.location.origin}. Check that the server is running.`);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleApplyBlueprint = async () => {
    if (!synthesizedBlueprint) return;
    setDeploying(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/autopilot/apply`, {
        method: 'POST',
        headers: (() => {
          const t = typeof window !== 'undefined' ? (localStorage.getItem('dogfood_auth_token') || localStorage.getItem('dogfood_token') || 'demo-organizer-token') : 'demo-organizer-token';
          return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` };
        })(),
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
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || `Deployment failed: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.warn('Deploy error:', e);
      setErrorMessage(`Unable to reach the API at ${API_BASE_URL || window.location.origin}. Check that the server is running.`);
    } finally {
      setDeploying(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setErrorMessage(null);
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
        tracks: manualTracks.map((t, idx) => ({
          id: t.id || `track-${idx + 1}`,
          name: t.name,
          tagline: t.tagline,
          color: t.color || '#10b981',
        })),
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
        seedProjects: manualTracks.map((t, idx) => ({
          title: `${t.name.split(' ')[0]} Benchmark Core`,
          tagline: t.tagline,
          track: t.name,
          rank: idx + 1,
          elo: Number((108.0 - idx * 5.0).toFixed(1)),
          meanScore: Number((4.9 - idx * 0.2).toFixed(1)),
        }))
      };

      const res = await fetch(`${API_BASE_URL}/autopilot/apply`, {
        method: 'POST',
        headers: (() => {
          const t = typeof window !== 'undefined' ? (localStorage.getItem('dogfood_auth_token') || localStorage.getItem('dogfood_token') || 'demo-organizer-token') : 'demo-organizer-token';
          return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` };
        })(),
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
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || `Failed to create hackathon: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.warn('Manual create error:', err);
      setErrorMessage(`Unable to reach the API at ${API_BASE_URL || window.location.origin}. Check that the server is running.`);
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
          <div className="relative z-10 flex flex-wrap items-center gap-2 mt-5 p-1.5 bg-slate-950/90 border border-emerald-500/30 rounded-2xl w-fit text-xs font-mono shadow-inner">
            <button
              type="button"
              onClick={() => setCreationMode('PROMPT')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                creationMode === 'PROMPT'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
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
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
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

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 flex items-center space-x-3 text-xs font-mono shadow-lg animate-in fade-in">
              <X className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block text-red-300">Error</span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
                    disabled={synthesizing}
                    className="w-full p-4 pr-40 bg-slate-950 border border-emerald-500/30 rounded-2xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-inner disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                  />
                  <button
                    type="button"
                    onClick={() => handleSynthesize()}
                    disabled={synthesizing}
                    className={`absolute right-3 bottom-3.5 px-3.5 py-1.5 rounded-xl font-mono font-bold shadow-md transition-all flex items-center space-x-1.5 ${
                      synthesizing
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/50 shadow-lg animate-pulse cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer hover:shadow-emerald-500/40 hover:scale-105 active:scale-95'
                    } text-xs`}
                  >
                    {synthesizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span className="animate-pulse">Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Synthesize ⚡</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Loading Splash Indicator */}
                {synthesizing && (
                  <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-500/30 animate-pulse">
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 animate-ping absolute" />
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 relative" />
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-bold">
                      AI Engine Processing Your Hackathon Blueprint...
                    </span>
                  </div>
                )}
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
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={handleApplyBlueprint}
                      disabled={deploying}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center space-x-2 relative overflow-hidden ${
                        deploying
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/50 cursor-not-allowed animate-pulse'
                          : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-98 cursor-pointer'
                      }`}
                    >
                      {deploying && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" 
                             style={{ animation: 'shimmer 2s infinite linear' }} />
                      )}
                      <Rocket className={`w-4 h-4 relative z-10 ${deploying ? 'animate-bounce' : ''}`} />
                      <span className="relative z-10">{deploying ? 'Deploying to Live Cluster...' : 'Deploy Blueprint Live to Cluster 🚀'}</span>
                    </button>
                    
                    {/* 3D Loading Splash Effect */}
                    {deploying && (
                      <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-500/30">
                        <div className="relative flex items-center justify-center">
                          {/* Outer pulsing ring */}
                          <div className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 animate-ping opacity-75" />
                          {/* Middle ring */}
                          <div className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 animate-pulse" />
                          {/* Inner core */}
                          <div className="relative w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/50" />
                        </div>
                        <div className="text-xs font-mono space-y-0.5">
                          <div className="text-amber-300 font-bold animate-pulse">Deploying Hackathon Architecture...</div>
                          <div className="text-amber-400/70 text-[10px]">Writing to MongoDB • Initializing Rubrics • Setting Up Tracks</div>
                        </div>
                      </div>
                    )}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-xs">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white text-sm block">Custom Blueprint Builder Mode</span>
                    <span className="text-[11px] text-slate-400 font-normal">Manually configure event parameters, duration, prize pool, and tracks</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCreationMode('PROMPT')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>⚡ Switch to AI Fast Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/organizer/create-event');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <span>Full Multi-Step Creator ↗</span>
                  </button>
                </div>
              </div>
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

              {/* Dynamic Tracks Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200 font-bold uppercase tracking-wider">
                      Define Competition Tracks ({manualTracks.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Track</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {manualTracks.map((track, idx) => (
                    <div key={track.id || idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-xs transition-all hover:border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: track.color }}
                          />
                          <span className="text-xs font-bold text-white font-mono">Track #{idx + 1}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Color Selector Badges */}
                          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                            {['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleTrackChange(idx, 'color', c)}
                                style={{ backgroundColor: c }}
                                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                                  track.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Delete Track Button */}
                          {manualTracks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTrack(idx)}
                              className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="Delete Track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Track Name (e.g. Autonomous AI Swarms)"
                        value={track.name}
                        onChange={(e) => handleTrackChange(idx, 'name', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Track Tagline & Scope (e.g. Decentralized agent coordination protocols)"
                        value={track.tagline}
                        onChange={(e) => handleTrackChange(idx, 'tagline', e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={deploying}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center space-x-2 relative overflow-hidden ${
                    deploying
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/50 cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-98 cursor-pointer'
                  }`}
                >
                  {deploying && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  )}
                  <Rocket className={`w-4 h-4 relative z-10 ${deploying ? 'animate-bounce' : ''}`} />
                  <span className="relative z-10">{deploying ? 'Deploying Event...' : 'Launch Custom Hackathon 🚀'}</span>
                </button>
                
                {/* 3D Loading Splash Effect */}
                {deploying && (
                  <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-500/30">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 animate-ping opacity-75" />
                      <div className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 animate-pulse" />
                      <div className="relative w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/50" />
                    </div>
                    <div className="text-xs font-mono space-y-0.5">
                      <div className="text-amber-300 font-bold animate-pulse">Creating Custom Hackathon...</div>
                      <div className="text-amber-400/70 text-[10px]">Configuring tracks • Setting up rubrics • Initializing database</div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
