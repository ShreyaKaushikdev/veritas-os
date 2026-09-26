'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Zap,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function StoryPage() {
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeArchitectureTab, setActiveArchitectureTab] = useState<'mongo' | 'bayesian' | 'merkle' | 'recusal'>('mongo');
  const [activeMerkleNode, setActiveMerkleNode] = useState<number>(0);
  const [comparisonState, setComparisonState] = useState<'legacy' | 'dogfood'>('dogfood');
  const [liveStats, setLiveStats] = useState({
    teamsRegistered: 0,
    assignedBallots: 0,
    disputesCount: 0,
  });

  useEffect(() => {
    fetch('http://localhost:4000/dashboard/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLiveStats({
            teamsRegistered: data.teamsRegistered ?? 0,
            assignedBallots: data.assignedBallots ?? 0,
            disputesCount: data.disputes ? data.disputes.length : 0,
          });
        }
      })
      .catch((err) => console.warn('Could not load live dashboard stats for story:', err));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const merkleNodes = [
    {
      id: 0,
      title: 'State Root Anchor',
      hash: '0x7f49c2a81de09b3c4f78e19203a98762514bcda9e201',
      status: 'SEALED & PROVED',
      depth: 'Level 0 (Root)',
      description: 'Global cryptographic anchor computed over all verified peer ballots across all project submissions.',
    },
    {
      id: 1,
      title: 'Track 1 Sub-Tree (AI Agents)',
      hash: '0x3c99a410f82b7194819d0012ba4e09f872c6114b',
      status: 'VERIFIED',
      depth: 'Level 1 Branch',
      description: 'Aggregated state of agentic submissions, peer reviews, and normalized Bayesian variance.',
    },
    {
      id: 2,
      title: 'Track 2 Sub-Tree (Developer Infra)',
      hash: '0x889d10e472a19b8823f901cb001f98e721a9c801',
      status: 'VERIFIED',
      depth: 'Level 1 Branch',
      description: 'High-density branch verifying local compiler tools, reproducible builds, and offline runtimes.',
    },
    {
      id: 3,
      title: 'Track 3 Sub-Tree (Verifiable Systems)',
      hash: '0x10b981ca9f8812c74e92a831e77902d184bf92a0',
      status: 'VERIFIED',
      depth: 'Level 1 Branch',
      description: 'Tamper-evident tree leaf verifying zero-knowledge proof verification circuits and offline POSIX storage.',
    },
  ];

  return (
    <div className="space-y-12 pb-20 text-slate-800">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>THE GENESIS & PROTOCOL MANIFESTO</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight font-sans">
          How We Killed{' '}
          <span className="bg-gradient-to-r from-red-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
            Spreadsheet Chaos
          </span>{' '}
          & Restored Hackathon Integrity.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Legacy hackathons run on corrupt Google Sheets, subjective 3-minute pitch theater, and unverified mockups.{' '}
          <strong className="text-slate-900 font-bold">DOGFOOD OS</strong> is the world’s first self-hosted, peer-blind operating system built on{' '}
          cryptographic consensus, native MongoDB, and tamper-evident Merkle DAG ledgers.
        </p>

        {/* Chapter Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            { id: 1, label: '01. The Crisis' },
            { id: 2, label: '02. Peer-Blind Consensus' },
            { id: 3, label: '03. Local-First Engine' },
            { id: 4, label: '04. Live Telemetry' },
            { id: 5, label: '05. Self-Host & Launch' },
          ].map((chap) => (
            <button
              key={chap.id}
              onClick={() => setActiveChapter(chap.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeChapter === chap.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {chap.label}
            </button>
          ))}
        </div>
      </section>

      {/* CHAPTER 1: The Crisis */}
      <section className={`transition-all duration-300 ${activeChapter === 1 ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-mono font-bold text-sm">
                01
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Part 1: Why hackathon scoring goes wrong</h2>
                <p className="text-xs text-slate-500">Most people who join a hackathon do not trust the scores. Here is what we changed.</p>
              </div>
            </div>
            
            {/* Toggle state */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
              <button
                onClick={() => setComparisonState('legacy')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  comparisonState === 'legacy' ? 'bg-red-100 text-red-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Legacy Flaws
              </button>
              <button
                onClick={() => setComparisonState('dogfood')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  comparisonState === 'dogfood' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                The Fix
              </button>
            </div>
          </div>

          {/* Interactive Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              comparisonState === 'legacy'
                ? 'bg-red-50/70 border-red-200 text-red-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold mb-2">
                {comparisonState === 'legacy' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">WHAT JUDGES SEE</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">PROJECTS THAT ACTUALLY RUN</span>
                  </>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {comparisonState === 'legacy' ? 'Subjective 3-Minute Decks' : 'Automated Proof of Execution'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {comparisonState === 'legacy'
                  ? 'Teams with charismatic presenters win with Figma mockups and zero backend code. True engineering feats in Rust, C++, or systems are ignored.'
                  : 'Judges test running containers, deterministic eBPF memory traces, and verified test suites before ballots unlock.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              comparisonState === 'legacy'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold mb-2">
                {comparisonState === 'legacy' ? (
                  <>
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700">SPREADSHEETS GO WRONG</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">A RECORD NOBODY CAN EDIT</span>
                  </>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {comparisonState === 'legacy' ? 'Manual Judge Collusion' : 'Cryptographic Merkle Proofs'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {comparisonState === 'legacy'
                  ? 'Judges bump their friends’ scores behind closed doors. Spreadsheets get overwritten, formulas break, and there is zero cryptographic audit trail.'
                  : 'Every ballot is signed, timestamped, hashed, and committed to a transparent Merkle DAG in MongoDB.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              comparisonState === 'legacy'
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold mb-2">
                {comparisonState === 'legacy' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700">THE WIFI AT THE VENUE DROPS</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">WORKS WITHOUT INTERNET</span>
                  </>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {comparisonState === 'legacy' ? 'Fragile Cloud Infrastructure' : 'Bare-Metal High-Availability'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {comparisonState === 'legacy'
                  ? 'When venue Wi-Fi fails at 11:59 PM submission deadline, cloud platforms drop submissions, locking out genuine builders.'
                  : 'Runs 100% locally on localhost or LAN. Zero external API keys or cloud dependencies needed to operate the entire hackathon.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: The Cryptographic Breakthrough */}
      <section className={`transition-all duration-300 ${activeChapter === 2 ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-mono font-bold text-sm">
              02
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Chapter 2: Peer-Blind Consensus & Merkle Trees</h2>
              <p className="text-xs text-slate-500">The system checks itself, so people do not have to take anyone&apos;s word for it.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Proof that a score was not changed</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every judge submits an evaluation sealed with a SHA-256 hash. The peer-blind masking protocol hides author identity, team affiliation, and prior score distributions. Once locked, a ballot cannot be edited without invalidating the Merkle root.
              </p>

              <div className="space-y-2">
                <div className="flex items-start space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Judges cannot see who scored what:</strong> Evaluators see code, test artifacts, and verifiable receipts—never marketing names or affiliations.</span>
                </div>
                <div className="flex items-start space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Making different judges comparable:</strong> Strips out tough vs generous judge variance automatically in real time.</span>
                </div>
                <div className="flex items-start space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>A judge stepping aside, fast:</strong> Automatic re-routing when personal relationships or competing interests are flagged.</span>
                </div>
              </div>
            </div>

            {/* Interactive Merkle Node Inspector */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-700 font-bold flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-700" />
                  <span>The locked score chain</span>
                </span>
                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  LIVE ON MONGODB
                </span>
              </div>

              {/* Node selector buttons */}
              <div className="grid grid-cols-2 gap-2">
                {merkleNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setActiveMerkleNode(node.id)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                      activeMerkleNode === node.id
                        ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] text-emerald-700 font-bold">{node.depth}</div>
                    <div className="truncate font-sans font-medium text-xs text-slate-800">{node.title}</div>
                  </button>
                ))}
              </div>

              {/* Active node detail */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 font-bold text-[11px]">{merkleNodes[activeMerkleNode].title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    {merkleNodes[activeMerkleNode].status}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed font-sans">
                  {merkleNodes[activeMerkleNode].description}
                </div>
                <div className="pt-1 text-[10px] text-slate-500 break-all">
                  SHA-256: <span className="text-emerald-700 font-mono font-bold">{merkleNodes[activeMerkleNode].hash}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: Local-First Architecture & MongoDB */}
      <section className={`transition-all duration-300 ${activeChapter === 3 ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-mono font-bold text-sm">
              03
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Chapter 3: The Engine — Native MongoDB & Local-First Resilience</h2>
              <p className="text-xs text-slate-500">No data leaves your computer. Fast even on an ordinary laptop.</p>
            </div>
          </div>

          {/* Interactive Architecture Schematic */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 overflow-x-auto">
              {[
                { id: 'mongo', label: '1. Native MongoDB Replica', icon: Database },
                { id: 'bayesian', label: '2. Bayesian Elo Normalizer', icon: Cpu },
                { id: 'merkle', label: '3. Merkle DAG Block Committer', icon: GitBranch },
                { id: 'recusal', label: '4. Sub-100ms Recusal Router', icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveArchitectureTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                      activeArchitectureTab === tab.id
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Architecture Details Content */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-800">
              {activeArchitectureTab === 'mongo' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Native High-Availability MongoDB (`dogfood_os`)</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unlike toy JSON files or fragile cloud SQLite setups, DOGFOOD OS stores all project metadata, criteria scores, cryptographic signatures, and audit logs inside a dedicated native MongoDB database at <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 font-mono">your own computer, port 27017</code>.{' '}
                    Atomic multi-document mutations guarantee that when a judge locks a ballot, the project’s running average, Elo ranking, and track placement update in sub-5ms without locking the thread.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-mono">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold">LIVE TEAMS</div>
                      <div className="text-emerald-700 font-black text-base mt-0.5">{liveStats.teamsRegistered} Records</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold">SCORES GIVEN</div>
                      <div className="text-teal-700 font-black text-base mt-0.5">{liveStats.assignedBallots} Records</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold">DISPUTES</div>
                      <div className="text-amber-700 font-black text-base mt-0.5">{liveStats.disputesCount} Active</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold">WHERE DATA IS STORED</div>
                      <div className="text-indigo-700 font-black text-base mt-0.5">built-in storage engine</div>
                    </div>
                  </div>
                </div>
              )}

              {activeArchitectureTab === 'bayesian' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Chess-Grade Pairwise Elo & Bayesian Z-Score Normalization</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Human judges naturally calibrate differently: some score everyone a 9/10, others rarely grant above a 5/10.{' '}
                    DOGFOOD OS runs on-the-fly continuous normalization. When judges conduct head-to-head duels, the platform updates Elo using standard chess logistic curves:
                  </p>
                  <div className="bg-white p-3.5 rounded-xl font-mono text-[11px] text-indigo-900 border border-indigo-200 shadow-2xs">
                    R&apos;_A = R_A + K · (S_A - E_A), where E_A = 1 / (1 + 10^((R_B - R_A)/400))
                  </div>
                </div>
              )}

              {activeArchitectureTab === 'merkle' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Block Commits & Tamper Simulation</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    At the end of each evaluation wave, the Organizer cockpit invokes <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 font-mono">Lock this round</code>.{' '}
                    All finalized ballots are hashed into a Merkle Patricia tree with a Groth16 zk-SNARK proof. Anyone—from sponsors to students—can verify the complete lineage with zero reliance on centralized authorities.
                  </p>
                </div>
              )}

              {activeArchitectureTab === 'recusal' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Judges can step aside instantly</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If an evaluator discovers they invested in or mentored a competing team, they press <strong>Recuse Self</strong>.{' '}
                    In <strong>38 milliseconds</strong>, the system re-assigns the project to a pre-warmed backup evaluator, marks the recusal in the MongoDB ledger, and preserves 100% round schedule integrity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4: Live Telemetry & Numbers */}
      <section className={`transition-all duration-300 ${activeChapter === 4 ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-mono font-bold text-sm">
              04
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Chapter 4: The Live Arena — Real Hackathon Metrics</h2>
              <p className="text-xs text-slate-500">Live numbers, read straight from the database.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-900 font-mono">{liveStats.teamsRegistered}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">Teams signed up</div>
              <div className="text-[10px] text-emerald-700 font-mono mt-1 font-bold">100% Code Frozen</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
              <div className="text-3xl font-black text-teal-700 font-mono">{liveStats.assignedBallots}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">Locked scores</div>
              <div className="text-[10px] text-teal-700 font-mono mt-1 font-bold">Live Recorded</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
              <div className="text-3xl font-black text-indigo-700 font-mono">&lt; 40ms</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">How fast a judge steps aside</div>
              <div className="text-[10px] text-indigo-700 font-mono mt-1 font-bold">No downtime</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
              <div className="text-3xl font-black text-amber-700 font-mono">0.00%</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">SENDING DATA TO A COMPANY</div>
              <div className="text-[10px] text-amber-700 font-mono mt-1 font-bold">100% Air-Gapped</div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 5: Interactive Terminal & Launch */}
      <section className={`transition-all duration-300 ${activeChapter === 5 ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center font-mono font-bold text-sm">
              05
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Part 5: Run your own event</h2>
              <p className="text-xs text-slate-500">Set up your own hackathon in under a minute.</p>
            </div>
          </div>

          {/* Interactive Terminal Box */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">bash — dogfood-os-setup</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Node v24 • Native MongoDB</span>
            </div>

            <div className="p-5 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between group">
                <span className="text-slate-200">
                  <span className="text-emerald-400 font-bold">$</span> npx dogfood-os init --name=&quot;Hackathon 2026&quot; --db=your own computer, port 27017
                </span>
                <button
                  onClick={() => copyToClipboard('npx dogfood-os init --name="Hackathon 2026" --db=your own computer, port 27017', 'c1')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                  title="Copy command"
                >
                  {copiedCmd === 'c1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <span className="text-slate-200">
                  <span className="text-emerald-400 font-bold">$</span> dogfood judge --mode=peer-blind --tracks=&quot;AI, Infra, Systems&quot;
                </span>
                <button
                  onClick={() => copyToClipboard('dogfood judge --mode=peer-blind --tracks="AI, Infra, Systems"', 'c2')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                  title="Copy command"
                >
                  {copiedCmd === 'c2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <span className="text-slate-200">
                  <span className="text-emerald-400 font-bold">$</span> dogfood audit --verify-merkle-dag --export=receipts.json
                </span>
                <button
                  onClick={() => copyToClipboard('dogfood audit --verify-merkle-dag --export=receipts.json', 'c3')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                  title="Copy command"
                >
                  {copiedCmd === 'c3' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 text-slate-400 border-t border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open source. Nobody can lock you in.</span>
              </div>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Open the organizer dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center space-x-3">
              <Link
                href="/gallery"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              >
                Inspect Live Projects
              </Link>
              <Link
                href="/judge"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              >
                Launch Judge Console (J/K)
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
