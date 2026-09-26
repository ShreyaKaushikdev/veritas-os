'use client';

import React, { useState } from 'react';
import { Cpu, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Activity, ShieldAlert, ArrowUpRight, Award, MessageSquare, BarChart3, Scale, Clock } from 'lucide-react';
import PotentialRadarScene from '../../components/3d/PotentialRadarScene';

export default function ParticipantPage() {
  const [activeTab, setActiveTab] = useState<'COACH' | 'FEEDBACK'>('COACH');
  const [title, setTitle] = useState('Aether: Decentralized Deterministic Sync Engine');
  const [techStack, setTechStack] = useState('Rust, SQLite, WebAssembly, libp2p');
  const [hours, setHours] = useState(48);
  const [description, setDescription] = useState(
    'A verifiable local-first sync engine running with zero network connectivity. Uses an append-only hash chain and modular CRDT architecture to guarantee conflict-free convergence and reproducible test proofs.'
  );

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>({
    overallPotential: '76 - 86 / 100',
    confidence: 'HIGH',
    confidenceReason: 'Concrete modular architecture, bounded memory guarantees, and test verification suite specified.',
    scopePressure: 'ACHIEVABLE',
    scopeReason: '4 core features mapped within realistic 48 engineer-hours budget.',
    criteriaBands: {
      'Technical Depth & Architecture': { band: '8.5 - 9.5 / 10', reason: 'Modular interfaces and local WASM execution runtime.' },
      'Rubric Alignment & Feasibility': { band: '8.0 - 9.0 / 10', reason: 'Execution realism verified for 48-hour timeline.' },
      'Novelty & Problem Insight': { band: '7.5 - 8.5 / 10', reason: 'Solves air-gapped consistency without centralized cloud sync.' },
      'Evidence & Reproducibility': { band: '8.0 - 9.0 / 10', reason: 'Self-contained automated tests and single-command local demo.' },
    },
    blindSpots: [
      'Edge recovery under abrupt power interruption',
      'Disk quota saturation behavior on constrained devices',
    ],
    improvementActions: [
      'Lock core consensus vertical slice before polishing WebAssembly bridge.',
      'Add deterministic state machine property tests using QuickCheck.',
      'Ensure zero external URL fetches in startup script.',
    ],
  });

  const [feedbackReport] = useState({
    title: 'Aether: Decentralized Deterministic Sync Engine',
    track: 'Verifiable & Local-First Systems',
    rank: 2,
    totalTeamsInTrack: 14,
    normalizedScore: 88.45,
    rawScore: 87.25,
    eventBenchmarkMedian: 74.30,
    tieBreakApplied: true,
    tieBreakReason: 'Rule 1 (Rubric Priority): Higher score in Technical Depth & Architecture (9.20 vs 8.60)',
    criteriaBreakdown: [
      { name: 'Technical Depth & Architecture', weight: 0.35, projectScore: 9.20, eventBenchmarkScore: 7.45, delta: 1.75 },
      { name: 'Rubric Alignment & Feasibility', weight: 0.25, projectScore: 8.80, eventBenchmarkScore: 7.60, delta: 1.20 },
      { name: 'Novelty & Problem Insight', weight: 0.20, projectScore: 8.50, eventBenchmarkScore: 7.10, delta: 1.40 },
      { name: 'Evidence & Reproducibility', weight: 0.20, projectScore: 8.60, eventBenchmarkScore: 7.20, delta: 1.40 },
    ],
    anonymizedReviews: [
      {
        judgePseudonym: 'Judge #1',
        overallFeedback: 'Exceptional system boundaries. Zero-network sync verified cleanly through automated receipts. Code comments and modular crates demonstrated senior-level systems craftsmanship.',
        criteriaFeedback: [
          { criteriaName: 'Technical Depth & Architecture', score: 9, comment: 'Clean separation between CRDT state and storage adapter.' },
          { criteriaName: 'Evidence & Reproducibility', score: 9, comment: 'One command make test produced clean passes in 14ms.' },
        ],
      },
      {
        judgePseudonym: 'Judge #2',
        overallFeedback: 'Very strong novelty. Solving local-first consistency without heavy cloud coordinators aligns directly with the event thesis.',
        criteriaFeedback: [
          { criteriaName: 'Novelty & Problem Insight', score: 9, comment: 'Avoids typical token/centralized server traps.' },
          { criteriaName: 'Rubric Alignment & Feasibility', score: 8, comment: 'Realistic delivery within 48-hour hackathon constraints.' },
        ],
      },
      {
        judgePseudonym: 'Judge #3',
        overallFeedback: 'Good presentation and clear receipts. Minor point: document power outage disk recovery guarantees more prominently in README.',
        criteriaFeedback: [
          { criteriaName: 'Evidence & Reproducibility', score: 8, comment: 'Reproduction script worked seamlessly.' },
        ],
      },
    ],
  });

  const handleRunCoach = () => {
    setLoading(true);
    setTimeout(() => {
      // Deterministic evaluation based on text heuristics
      const hasArch = /architecture|modular|interface|crdt|engine/i.test(description);
      const isHighScope = hours < 36;
      
      setReport({
        overallPotential: hasArch ? '78 - 88 / 100' : '62 - 72 / 100',
        confidence: description.length > 150 ? 'HIGH' : 'MEDIUM',
        confidenceReason: 'Grounded directly in declared architecture, component boundaries, and event rubric weights.',
        scopePressure: isHighScope ? 'AT_RISK' : 'ACHIEVABLE',
        scopeReason: isHighScope
          ? 'Short timeline (under 36h) poses risk to test verification.'
          : '48 engineer-hours provides sufficient margin for core implementation and tests.',
        criteriaBands: {
          'Technical Depth & Architecture': {
            band: hasArch ? '8.5 - 9.5 / 10' : '6.0 - 7.0 / 10',
            reason: hasArch ? 'Explicit modular boundaries identified.' : 'Missing architecture diagram and memory bounds.',
          },
          'Rubric Alignment & Feasibility': {
            band: '8.0 - 9.0 / 10',
            reason: 'Directly addresses hackathon offline-first mandate.',
          },
          'Novelty & Problem Insight': {
            band: '7.5 - 8.5 / 10',
            reason: 'Non-obvious approach to local data convergence.',
          },
          'Evidence & Reproducibility': {
            band: '8.0 - 9.0 / 10',
            reason: 'Zero-network local setup script planned.',
          },
        },
        blindSpots: [
          'Edge recovery under abrupt power interruption',
          'Disk quota saturation behavior on constrained devices',
        ],
        improvementActions: [
          'Lock core consensus vertical slice before polishing WebAssembly bridge.',
          'Add deterministic state machine property tests using QuickCheck.',
          'Ensure zero external URL fetches in startup script.',
        ],
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>PARTICIPANT INTELLIGENCE & EVALUATION HUB</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            {activeTab === 'COACH' ? 'Idea Potential Coach & Health Check' : 'Official Entrant Feedback & Scorecard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {activeTab === 'COACH'
              ? 'Test your idea against the locked event rubric before committing. Returns grounded score bands and actionable improvements.'
              : 'Official post-event evaluation breakdown. Review criterion scores against event medians and anonymized judge feedback.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/90 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('COACH')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'COACH'
                ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check your plan before you lock it in</span>
          </button>
          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'FEEDBACK'
                ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span>The real scorecard</span>
          </button>
        </div>
      </div>

      {activeTab === 'COACH' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Idea Input Form (5 cols) */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span>Your project</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                Live Draft
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-mono text-[11px] font-semibold mb-1">Project name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 font-sans focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] font-semibold mb-1">Tools you plan to use</label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 font-sans focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] font-semibold mb-1">Hours your team has</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 font-sans focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] font-semibold mb-1">Architecture & Implementation Plan</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 font-sans focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 leading-relaxed transition-all shadow-xs"
                />
              </div>

              <button
                onClick={handleRunCoach}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-mono text-xs font-bold hover:shadow-lg hover:shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/15 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Evaluating Alignment Rules...' : 'Run Potential Simulation'}</span>
              </button>
            </div>
          </div>

          {/* Right: Potential Report & 3D Radar (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {report && (
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-mono font-bold text-slate-800">YOUR REPORT</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    AIR-GAP RUNNER (ZERO CLOUD)
                  </span>
                </div>

                {/* Score & Risk Banners */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">HOW STRONG THE IDEA IS</span>
                    <div className="text-xl font-extrabold text-emerald-700 font-mono">{report.overallPotential}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">HOW SURE ARE WE?</span>
                    <div className="text-base font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{report.confidence}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">IS IT REALISTIC IN THE TIME?</span>
                    <div className={`text-base font-bold ${report.scopePressure === 'ACHIEVABLE' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {report.scopePressure}
                    </div>
                  </div>
                </div>

                {/* 3D Radar Visualizer */}
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50 relative shadow-inner">
                  <div className="absolute top-3 left-3 z-10 text-[11px] font-mono font-semibold text-slate-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs">
                    3D Potential Radar Mesh (4 Rubric Axes)
                  </div>
                  <PotentialRadarScene />
                </div>

                {/* Criteria Score Bands */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-mono text-slate-600 font-bold uppercase tracking-wider">HOW IT LINES UP WITH THE SCORING GUIDE:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(report.criteriaBands).map(([crit, data]: any) => (
                      <div key={crit} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">{crit}</span>
                          <span className="text-xs font-mono font-bold text-emerald-700">{data.band}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{data.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blindspots & Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                    <div className="flex items-center space-x-1.5 text-amber-900 text-xs font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Things to double-check</span>
                    </div>
                    <ul className="text-[11px] text-amber-900/80 space-y-1 list-disc list-inside leading-relaxed">
                      {report.blindSpots.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-900 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>The 3 things to fix first</span>
                    </div>
                    <ul className="text-[11px] text-emerald-900/80 space-y-1 list-disc list-inside leading-relaxed">
                      {report.improvementActions.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <strong className="text-slate-700">One thing you will not compromise on:</strong> Coach uses only locked rubric rules and declared input provenance. It will never hallucinate fake past competitor data or promise an exact rank position.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Entrant Feedback Report View */
        <div className="space-y-6">
          {/* Top Performance Banner */}
          <div className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
                    PUBLISHED SCORECARD
                  </span>
                  <span className="text-xs font-mono text-slate-500">{feedbackReport.track}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-sans">{feedbackReport.title}</h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Congratulations on completing the event! Below is your team&apos;s defensible evaluation receipt compiled from 
                  calibrated judge ballots, normalized for judge bias, and benchmarked against your track median.
                </p>
              </div>

              {/* Score Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-5 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center min-w-[120px] shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Final Rank</span>
                  <div className="text-2xl font-extrabold text-emerald-700 font-mono">
                    #{feedbackReport.rank} <span className="text-xs font-normal text-slate-500">/ {feedbackReport.totalTeamsInTrack}</span>
                  </div>
                </div>

                <div className="px-5 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center min-w-[120px] shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Fair score</span>
                  <div className="text-2xl font-extrabold text-teal-700 font-mono">
                    {feedbackReport.normalizedScore}
                  </div>
                </div>

                <div className="px-5 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center min-w-[120px] shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Compared to others in your category</span>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                    +{((feedbackReport.normalizedScore - feedbackReport.eventBenchmarkMedian)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tie-Break Outcome Receipt (if applied) */}
            {feedbackReport.tieBreakApplied && (
              <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-3 text-xs">
                <Scale className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-emerald-900">HOW THE TIE WAS BROKEN:</div>
                  <p className="text-emerald-800 font-mono text-[11px]">{feedbackReport.tieBreakReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Criteria Breakdown Table (7 cols) */}
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-mono font-bold text-slate-800">YOUR SCORE VS EVERYONE ELSE</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">Fairly compared</span>
              </div>

              <div className="space-y-3.5">
                {feedbackReport.criteriaBreakdown.map((crit, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{crit.name}</span>
                        <span className="text-slate-500 text-[11px] ml-2 font-mono">Weight: {Math.round(crit.weight * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-emerald-700 font-bold">{crit.projectScore.toFixed(2)} / 10</span>
                        <span className="text-slate-400 text-[11px]">(Median: {crit.eventBenchmarkScore.toFixed(2)})</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          +{crit.delta.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Comparative Score Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                          style={{ width: `${(crit.projectScore / 10) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Lowest: 1.0</span>
                        <span>Track Baseline: {crit.eventBenchmarkScore.toFixed(2)}</span>
                        <span>Highest: 10.0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Radar & Anonymity Note (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-700">3D RUBRIC RADAR PROFILE</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">OVERALL</span>
                </div>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50">
                  <PotentialRadarScene />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm text-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved at</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every score is anchored to an immutable cryptographic ballot submitted before results were frozen. 
                  Audit commitments can be verified on the public trust scanner.
                </p>
              </div>
            </div>
          </div>

          {/* Anonymized Qualitative Judge Feedback */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-mono font-bold text-slate-800">FEEDBACK FROM JUDGES (NAMES HIDDEN)</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                JUDGE IDENTITIES REDACTED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feedbackReport.anonymizedReviews.map((rev, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="font-mono text-xs font-bold text-emerald-800">{rev.judgePseudonym}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">Locked score</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.overallFeedback}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-[11px]">
                    {rev.criteriaFeedback.map((cf, cIdx) => (
                      <div key={cIdx} className="text-slate-600">
                        <span className="text-slate-800 font-semibold">{cf.criteriaName} ({cf.score}/10):</span>{' '}
                        <span>{cf.comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
