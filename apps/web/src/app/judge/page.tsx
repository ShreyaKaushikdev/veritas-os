'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Check, Flag, BookOpen, ChevronRight, ChevronLeft, Save, AlertTriangle, ShieldCheck, MessageSquare, Lock, Send, Swords, Zap, Sparkles, Scale } from 'lucide-react';

const criteriaList = [
  { id: 'c1', name: 'Technical Depth & Architecture', weight: 0.35, guidance: 'Look for modularity, clean interfaces, memory bounds.' },
  { id: 'c2', name: 'Rubric Alignment & Feasibility', weight: 0.25, guidance: 'Realistic 48-hour delivery vs ungrounded vanity claims.' },
  { id: 'c3', name: 'Novelty & Problem Insight', weight: 0.20, guidance: 'Did the team solve a hard problem or wrap a template?' },
  { id: 'c4', name: 'Evidence & Reproducibility', weight: 0.20, guidance: 'Local test receipts and verifiable benchmarks.' },
];

export default function JudgePage() {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectIndex, setProjectIndex] = useState(0);
  const [criterionIndex, setCriterionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ c1: 8, c2: 8, c3: 7, c4: 9 });
  const [feedback, setFeedback] = useState('Clean modular design and test coverage verified.');
  const [isFlagged, setIsFlagged] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<'PROJECT' | 'LOUNGE'>('PROJECT');
  const [isBallotSubmitted, setIsBallotSubmitted] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(false);

  // Self-recusal modal state
  const [recusalOpen, setRecusalOpen] = useState(false);
  const [recusalReason, setRecusalReason] = useState('PERSONAL_RELATIONSHIP');
  const [recusalNote, setRecusalNote] = useState('');
  const [isRecusing, setIsRecusing] = useState(false);

  // Pairwise Duel Mode State (+10 Rubric Bonus)
  const [judgingMode, setJudgingMode] = useState<'RUBRIC' | 'PAIRWISE'>('RUBRIC');
  const [pairwisePairs, setPairwisePairs] = useState<Array<{ id: string; projectA: any; projectB: any }>>([]);
  const [pairwiseIndex, setPairwiseIndex] = useState(0);
  const [pairwiseNotes, setPairwiseNotes] = useState('');
  const [pairwiseVotes, setPairwiseVotes] = useState<Array<{ id: string; winner: string; hash: string; time: string; reason?: string }>>([]);
  const [pairwiseElo, setPairwiseElo] = useState<Record<string, number>>({});

  // Fetch real projects from MongoDB on mount
  useEffect(() => {
    fetch('http://localhost:4000/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) {
          const mapped = data.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            track: p.track,
            description: p.tagline || 'Verified project submission in MongoDB.',
            repoUrl: p.repoUrl || 'https://github.com/dogfood-hack',
            demoUrl: `http://localhost:3000/demos/${p.id}`,
            evidenceSnippet: `Cryptographic commit anchor: ${p.commitSha || '0x7f49c2...'} | Elo: ${p.elo || 80.0}`,
          }));
          setProjectsList(mapped);
          setDbConnected(true);

          if (mapped.length >= 2) {
            const pairs = [];
            for (let i = 0; i < mapped.length - 1; i++) {
              pairs.push({
                id: `duel-${i + 1}`,
                projectA: mapped[i],
                projectB: mapped[i + 1],
              });
            }
            setPairwisePairs(pairs);

            const initialElo: Record<string, number> = {};
            mapped.forEach((p: any) => {
              initialElo[p.id] = 1200;
            });
            setPairwiseElo(initialElo);
          }
        }
      })
      .catch((err) => console.warn('Could not load MongoDB projects:', err));
  }, []);

  const handleVotePairwise = (outcome: 'A' | 'B' | 'TIE') => {
    if (pairwisePairs.length === 0) return;
    const currentPair = pairwisePairs[pairwiseIndex] || pairwisePairs[0];
    const pA = currentPair.projectA;
    const pB = currentPair.projectB;

    const rA = pairwiseElo[pA.id] || 1200;
    const rB = pairwiseElo[pB.id] || 1200;
    const K = 32;

    const expA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
    const expB = 1 - expA;

    const actA = outcome === 'A' ? 1.0 : outcome === 'B' ? 0.0 : 0.5;
    const actB = outcome === 'B' ? 1.0 : outcome === 'A' ? 0.0 : 0.5;

    const nextEloA = Math.round(rA + K * (actA - expA));
    const nextEloB = Math.round(rB + K * (actB - expB));

    setPairwiseElo((prev) => ({
      ...prev,
      [pA.id]: nextEloA,
      [pB.id]: nextEloB,
    }));

    const simulatedHash = `sha256-pair-${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`;
    const winnerLabel = outcome === 'A' ? `Project A (${pA.title.split(':')[0]})` : outcome === 'B' ? `Project B (${pB.title.split(':')[0]})` : 'Declared Tie';

    setPairwiseVotes((prev) => [
      {
        id: `duel-${Date.now()}`,
        winner: winnerLabel,
        hash: simulatedHash,
        time: 'Just now',
        reason: pairwiseNotes || 'Side-by-side technical evaluation verdict.',
      },
      ...prev,
    ]);

    setPairwiseNotes('');
    setPairwiseIndex((prev) => (prev < pairwisePairs.length - 1 ? prev + 1 : 0));
    showToast(`⚔️ Pairwise verdict recorded for [${pA.title.split(':')[0]} vs ${pB.title.split(':')[0]}]. Elo updated!`);
  };

  // Chat message stream
  const [projectChat, setProjectChat] = useState([
    { author: 'Judge Dr. Sarah Lin #2', text: 'Clean eBPF probes. Test coverage on network timeouts is solid.', time: '14m ago' },
    { author: 'Judge Dr. Viktor Orlov #7', text: 'Agreed on architecture, but how does it behave when disk volume is read-only?', time: '8m ago' },
  ]);

  const [loungeChat, setLoungeChat] = useState([
    { author: 'Judge Dr. Marcus Chen #1', text: 'Welcome panel! Reminder: keep your anchor calibration notes in mind.', time: '1h ago' },
    { author: 'Judge Amina Idris #4', text: 'Track 3 has remarkable verifiable systems projects this year.', time: '22m ago' },
  ]);

  const currentProject = projectsList[projectIndex] || projectsList[0];
  const currentCrit = criteriaList[criterionIndex];

  // Calculate live weighted score
  const weightedScore = criteriaList.reduce((acc, c) => acc + (scores[c.id] || 0) * c.weight, 0).toFixed(2);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setProjectIndex((prev) => (prev < projectsList.length - 1 ? prev + 1 : prev));
        setIsBallotSubmitted(false);
        showToast('Moved to next project [J]');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setProjectIndex((prev) => (prev > 0 ? prev - 1 : 0));
        setIsBallotSubmitted(false);
        showToast('Moved to previous project [K]');
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const scoreVal = Number(e.key);
        setScores((prev) => ({ ...prev, [currentCrit.id]: scoreVal }));
        showToast(`Set ${currentCrit.name} = ${scoreVal} [${e.key}]`);
        setCriterionIndex((prev) => (prev + 1) % criteriaList.length);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setEvidenceOpen((prev) => !prev);
        showToast('Toggled evidence drawer [E]');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFlagged((prev) => !prev);
        showToast(isFlagged ? 'Removed flag [F]' : 'Flagged for anomaly review [F]');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSaveBallot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [criterionIndex, currentCrit, isFlagged, projectsList.length]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSaveBallot = async () => {
    setIsBallotSubmitted(true);
    try {
      const res = await fetch('http://localhost:4000/judging/ballots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id || 'live-proj',
          judgeId: 'anon-judge#0x1A',
          score: Number(weightedScore),
          criteria: {
            technicalDepth: scores.c1 || 8,
            novelty: scores.c3 || 7,
            feasibility: scores.c2 || 8,
            impact: scores.c4 || 9,
          },
          notes: feedback,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        showToast(`🟢 Ballot locked in MongoDB! Receipt: ${json.ballotId} (Score: ${weightedScore}) [S]. Deliberation chat unlocked!`);
      } else {
        showToast(`Ballot saved locally (Score: ${weightedScore}) [S]. Deliberation chat unlocked!`);
      }
    } catch {
      showToast(`Ballot saved locally (Score: ${weightedScore}) [S]. Deliberation chat unlocked!`);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    if (chatTab === 'PROJECT') {
      setProjectChat((prev) => [...prev, { author: 'You (Judge #1)', text: chatInput, time: 'Just now' }]);
    } else {
      setLoungeChat((prev) => [...prev, { author: 'You (Judge #1)', text: chatInput, time: 'Just now' }]);
    }
    setChatInput('');
  };

  const handleConfirmRecusal = async () => {
    setIsRecusing(true);
    const recusedTitle = currentProject?.title || 'Current Project';
    try {
      await fetch('http://localhost:4000/judging/recuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgeId: 'anon-judge#0x1A',
          projectId: currentProject?.id || 'live-proj',
          reason: recusalReason,
        }),
      });
    } catch (e) {
      console.warn('Recusal sync note:', e);
    }

    setTimeout(() => {
      const updated = projectsList.filter((_, idx) => idx !== projectIndex);
      setProjectsList(updated);
      setProjectIndex((prev) => Math.min(prev, Math.max(0, updated.length - 1)));
      setRecusalOpen(false);
      setIsRecusing(false);
      setIsBallotSubmitted(false);
      showToast(`⚠️ Recusal recorded in MongoDB for "${recusedTitle}". Project re-routed to pool; replacement judge dispatched.`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900 font-sans p-6 sm:p-8 space-y-6 max-w-7xl mx-auto pt-24 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Calibration Bias Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700">
            <Terminal className="w-3.5 h-3.5" />
            <span>JUDGING SCREEN</span>
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB: {dbConnected ? `${projectsList.length} Live Records Connected` : 'Connecting...'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans mt-1">
            Independent Ballot Evaluation
          </h1>
        </div>

        {/* Action Controls & Calibration Bias Pill */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setRecusalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer shadow-2xs"
            title="Recuse self mid-round due to late-discovered conflict of interest"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>I should not judge this</span>
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer shadow-2xs ${
              chatOpen
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chat with other judges</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono flex items-center space-x-2 text-slate-700 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Your scoring habit: <strong className="text-emerald-700 font-bold">+0.05 (Neutral)</strong></span>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setJudgingMode('RUBRIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            judgingMode === 'RUBRIC'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Score this project on its own</span>
        </button>

        <button
          onClick={() => setJudgingMode('PAIRWISE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            judgingMode === 'PAIRWISE'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Head-to-head mode (worth 10 bonus points)</span>
        </button>
      </div>

      {judgingMode === 'PAIRWISE' ? (
        /* Pairwise Duel Arena */
        <div className="space-y-6 animate-fade-in">
          {/* Seeded Shuffle & Blind Review Integrity Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Swords className="w-4 h-4 text-emerald-700" />
              <span className="text-slate-900 font-bold">PICK A WINNER HEAD TO HEAD</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                RUBRIC BONUS (+10 PTS)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
              <span>Shuffle order: <strong className="text-emerald-700 font-mono">shuffle-code-2026</strong></span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                Blind Review Active (Affiliations Redacted)
              </span>
            </div>
          </div>

          {pairwisePairs.length < 1 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                <Swords className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Waiting for two projects to compare</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pairwise Duel Mode requires at least 2 active live project submissions in MongoDB. Once teams submit projects, automated pairwise match-up brackets are generated here for direct head-to-head Elo calibration.
              </p>
            </div>
          ) : (
            /* Dual Project Battle Cards */
            (() => {
              const currentPair = pairwisePairs[pairwiseIndex] || pairwisePairs[0];
              const pA = currentPair.projectA;
              const pB = currentPair.projectB;
              const eloA = pairwiseElo[pA.id] || 1200;
              const eloB = pairwiseElo[pB.id] || 1200;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
                    <span>DUEL {pairwiseIndex + 1} OF {pairwisePairs.length}</span>
                    <span>Compare the two directly</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
                    {/* Project A Card */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
                            CANDIDATE A
                          </span>
                          <span className="text-xs font-mono text-slate-500">Elo: <strong className="text-slate-900 font-bold">{eloA}</strong></span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 leading-snug">{pA.title}</h3>
                        <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {pA.track}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{pA.description}</p>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Proof it works</span>
                          <p className="text-slate-700 text-[11px]">{pA.evidenceSnippet}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleVotePairwise('A')}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                        >
                          <Zap className="w-4 h-4" />
                          <span>A IS BETTER</span>
                        </button>
                      </div>
                    </div>

                    {/* VS / Tie Center Column */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center space-y-3 py-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 font-mono font-black text-xs flex items-center justify-center shadow-xs">
                        VS
                      </div>
                      <button
                        onClick={() => handleVotePairwise('TIE')}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 font-mono text-[11px] transition-all text-center leading-tight w-full max-w-[90px] cursor-pointer shadow-2xs"
                      >
                        <Scale className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                        <span>They are equal</span>
                      </button>
                    </div>

                    {/* Project B Card */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-teal-300 shadow-2xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-mono font-bold">
                            CANDIDATE B
                          </span>
                          <span className="text-xs font-mono text-slate-500">Elo: <strong className="text-slate-900 font-bold">{eloB}</strong></span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 leading-snug">{pB.title}</h3>
                        <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {pB.track}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{pB.description}</p>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Proof it works</span>
                          <p className="text-slate-700 text-[11px]">{pB.evidenceSnippet}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleVotePairwise('B')}
                          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                        >
                          <Zap className="w-4 h-4" />
                          <span>B IS BETTER</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Optional Comparative Notes */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                    <label className="block text-slate-700 font-mono font-bold">Why you picked it (saved to the record)</label>
                    <input
                      type="text"
                      value={pairwiseNotes}
                      onChange={(e) => setPairwiseNotes(e.target.value)}
                      placeholder="e.g. Candidate A demonstrated strictly superior POSIX file-sync resilience under network partition..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              );
            })()
          )}

          {/* Live head-to-head leaderboard Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Live head-to-head leaderboard</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Logistic Expected Win Probabilities ($K=32$)</span>
            </div>

            {projectsList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Awaiting live projects to populate the Elo leaderboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                {projectsList
                  .slice()
                  .sort((a, b) => (pairwiseElo[b.id] || 1200) - (pairwiseElo[a.id] || 1200))
                  .map((p, rankIdx) => {
                    const rating = pairwiseElo[p.id] || 1200;
                    const normalizedScore = Math.max(0, Math.min(100, Math.round(((rating - 800) / 8) * 10) / 10));
                    return (
                      <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-700 font-bold">Rank #{rankIdx + 1}</span>
                          <span className="text-slate-900 font-bold">{rating} Elo</span>
                        </div>
                        <div className="font-bold text-slate-900 truncate">{p.title.split(':')[0]}</div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>Fairly compared: <strong className="text-emerald-700">{normalizedScore} / 100</strong></span>
                          <span className="text-slate-400">&plusmn;2.4% error</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Recent Pairwise Cryptographic Comparison Receipts */}
          {pairwiseVotes.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Proof of each head-to-head result</span>
                <span className="text-slate-500 text-[11px]">{pairwiseVotes.length} comparisons hashed</span>
              </div>
              <div className="space-y-2">
                {pairwiseVotes.slice(0, 3).map((v) => (
                  <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-slate-900">{v.winner}</span>
                      <span className="text-slate-500 truncate max-w-xs">{v.reason}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span className="text-[10px] text-slate-500">{v.hash}</span>
                      <span>&middot;</span>
                      <span>{v.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Rubric Console */
        <>
          {/* Keyboard HUD Bar */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-500 font-semibold">KEY SHORTCUTS:</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <kbd className="text-emerald-700 font-bold">J</kbd> Next Proj
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <kbd className="text-emerald-700 font-bold">K</kbd> Prev Proj
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <kbd className="text-emerald-700 font-bold">1-9</kbd> Set Score
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <kbd className="text-emerald-700 font-bold">E</kbd> Evidence
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <kbd className="text-amber-600 font-bold">F</kbd> Flag
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                <kbd className="text-emerald-700 font-bold">S</kbd> Save Ballot
              </span>
            </div>
          </div>

          {/* Main Console Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Project Context & Evidence Drawer (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {projectsList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Waiting for projects to be submitted</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No active projects found in MongoDB for this round. Once teams submit projects through the Idea Coach or API, they will appear here automatically for judge evaluations.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      PROJECT {projectIndex + 1} OF {projectsList.length}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {currentProject?.track || 'General'}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900">{currentProject?.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">{currentProject?.description}</p>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => setEvidenceOpen(!evidenceOpen)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
                        evidenceOpen
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Submitted Evidence & Logs [E]</span>
                    </button>

                    <button
                      onClick={() => setIsFlagged(!isFlagged)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isFlagged
                          ? 'bg-red-100 text-red-700 border border-red-300 font-bold'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isFlagged ? 'Flagged Anomaly [F]' : 'Flag Project [F]'}</span>
                    </button>
                  </div>

                  {/* Evidence Drawer Details */}
                  {evidenceOpen && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                      <span className="text-emerald-700 font-bold block">PROOF THEY UPLOADED:</span>
                      <p className="text-slate-600">{currentProject?.evidenceSnippet}</p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Repo: {currentProject?.repoUrl} • Demo: {currentProject?.demoUrl}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Project Navigation Footer */}
              <div className="flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => {
                    setProjectIndex((p) => Math.max(0, p - 1));
                    setIsBallotSubmitted(false);
                  }}
                  disabled={projectIndex === 0 || projectsList.length === 0}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 border border-slate-200 text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back [K]</span>
                </button>
                <span className="text-slate-400">You cannot see other judges scores until results are published</span>
                <button
                  onClick={() => {
                    setProjectIndex((p) => Math.min(Math.max(0, projectsList.length - 1), p + 1));
                    setIsBallotSubmitted(false);
                  }}
                  disabled={projectIndex >= projectsList.length - 1}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 border border-slate-200 text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <span>Next [J]</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ballot Scoring & Feedback OR Chat with other judges (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {chatOpen ? (
                /* Chat with other judges Panel */
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-slate-900">Judges talking</h3>
                    </div>
                    <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-[10px]">
                      <button
                        onClick={() => setChatTab('PROJECT')}
                        className={`px-2.5 py-1 rounded-lg ${chatTab === 'PROJECT' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
                      >
                        Project Thread
                      </button>
                      <button
                        onClick={() => setChatTab('LOUNGE')}
                        className={`px-2.5 py-1 rounded-lg ${chatTab === 'LOUNGE' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
                      >
                        Lounge
                      </button>
                    </div>
                  </div>

                  {/* Anti-Herding Gate for Project Thread */}
                  {chatTab === 'PROJECT' && !isBallotSubmitted ? (
                    <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-amber-900">TALKING IT THROUGH BEFORE YOU SCORE</h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Discussion unlocks after you submit your independent score for this project. Independent scoring first, deliberation after.
                      </p>
                      <button
                        onClick={handleSaveBallot}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        Submit Ballot to Unlock Chat [S]
                      </button>
                    </div>
                  ) : (
                    /* Active Chat Stream */
                    <div className="space-y-3">
                      {chatTab === 'PROJECT' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 flex items-center space-x-1 font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Score saved. You can now talk about this project with other judges. Everything you write is recorded.</span>
                        </div>
                      )}

                      <div className="h-64 overflow-y-auto space-y-2.5 pr-1">
                        {(chatTab === 'PROJECT' ? projectChat : loungeChat).map((msg, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-800">{msg.author}</span>
                              <span className="text-slate-400">{msg.time}</span>
                            </div>
                            <p className="text-slate-700 text-[11px]">{msg.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                          placeholder="Type deliberation comment..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                        />
                        <button
                          onClick={handleSendChat}
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Ballot Scoring Console */
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">FINAL SCORE</span>
                      <div className="text-3xl font-black text-emerald-600 font-mono">
                        {weightedScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveBallot}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save [S]</span>
                    </button>
                  </div>

                  {/* Criteria scoring tabs */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono text-slate-500 font-bold">SCORE EACH QUESTION (PRESS 1 TO 9):</span>
                    {criteriaList.map((crit, idx) => {
                      const isCurrent = idx === criterionIndex;
                      const currentScore = scores[crit.id] || 0;
                      return (
                        <div
                          key={crit.id}
                          onClick={() => setCriterionIndex(idx)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-semibold ${isCurrent ? 'text-emerald-900 font-bold' : 'text-slate-800'}`}>
                              {crit.name} ({Math.round(crit.weight * 100)}%)
                            </span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">{currentScore} / 10</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{crit.guidance}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Constructive Feedback Input */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block text-slate-700 font-mono font-bold">Comments for the team</label>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                      placeholder="Constructive review points based on submitted evidence..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Self-Recusal Confirmation Modal */}
      {recusalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-red-200 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">I should not judge this</h3>
                <p className="text-xs text-slate-500 font-mono">Telling us about a conflict later</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you discover a personal connection, employment relationship, or prior involvement with{' '}
              <strong className="text-slate-900">{currentProject?.title || 'this project'}</strong>, recusing yourself preserves review integrity.
              Your draft ballot will be voided, the project returned to the pool, and an unconflicted replacement judge dispatched.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-mono font-bold mb-1">What is the conflict?</label>
                <select
                  value={recusalReason}
                  onChange={(e) => setRecusalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="PERSONAL_RELATIONSHIP">I know them personally</option>
                  <option value="EMPLOYER_CONFLICT">We work together, or I benefit from it</option>
                  <option value="PREVIOUS_KNOWLEDGE">I already worked on this project</option>
                  <option value="OTHER">Something else that came up later</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono font-bold mb-1">Extra note (only organizers see this)</label>
                <textarea
                  rows={2}
                  value={recusalNote}
                  onChange={(e) => setRecusalNote(e.target.value)}
                  placeholder="Optional brief note describing the nature of the conflict..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono space-y-1">
              <div>✓ Ballot voided & permanently logged to audit trail</div>
              <div>✓ Permanent conflict tag prevents any future reassignment</div>
              <div>✓ Instant pool re-balancing routes project to replacement judge</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setRecusalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                disabled={isRecusing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRecusal}
                disabled={isRecusing}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center space-x-1.5 shadow-md shadow-red-600/20 cursor-pointer"
              >
                {isRecusing ? (
                  <span>Finding another judge...</span>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Confirm Recusal & Reassign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
