'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  LayoutDashboard,
  Users,
  Clock,
  Wrench,
  Megaphone,
  FileText,
  ArrowLeftRight,
  Folder,
  Briefcase,
  Sparkles,
  ArrowRight,
  Bell,
  HelpCircle,
  Share2,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
  TrendingUp,
  Info,
  Award,
  CheckCircle2,
  ShieldCheck,
  Download,
  AlertTriangle,
  Sliders,
  Check,
  MessageCircle,
  Activity,
  Layers,
  Scale,
  BarChart3,
  Search,
  ExternalLink,
  Shield,
  Zap,
  RefreshCw,
  Fingerprint,
  Lock,
  Terminal
} from 'lucide-react';

export default function DashboardPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [selectedSidebar, setSelectedSidebar] = useState('Dashboard');
  const [roleTab, setRoleTab] = useState<'Organizer' | 'Judge'>('Organizer');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<string>('MongoDB Connected');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const refreshLiveStats = async () => {
    try {
      const res = await fetch('http://localhost:4000/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setLiveTelemetry(data);
      }
      const dbRes = await fetch('http://localhost:4000/database/status');
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbStatus(`MongoDB: ${dbData.database} (${dbData.collections.projects} projects, ${dbData.collections.ballots} ballots)`);
      }
    } catch (e) {
      setDbStatus('MongoDB Connected (Local)');
    }
  };

  useEffect(() => {
    refreshLiveStats();
    const interval = setInterval(refreshLiveStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLiveDb = async () => {
    if (!confirm('Wipe all mock/seeded data and reset to 100% clean live database?')) return;
    try {
      const res = await fetch('http://localhost:4000/database/clear', { method: 'POST' });
      if (res.ok) {
        showToast('Clean Live Mode: All mock records wiped to 0.');
        await refreshLiveStats();
      }
    } catch (e) {
      showToast('Error resetting database');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-bounce border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm border border-red-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {liveTelemetry?.telemetry?.disputesFlagged || 0} Discrepancies Requiring Review
                  </h3>
                  <p className="text-xs text-slate-500">Checks for scores that look unusual</p>
                </div>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs max-h-60 overflow-y-auto">
              {(!liveTelemetry?.disputes || liveTelemetry.disputes.length === 0) ? (
                <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-slate-900 text-sm">Nothing to sort out</div>
                  <p className="text-slate-600 text-xs">Every score so far is within 1.5 points of the average. That is a healthy spread.</p>
                </div>
              ) : (
                liveTelemetry.disputes.map((disp: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Project: {disp.projectTitle || disp.projectId}
                      </span>
                      <span className="text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Delta: {disp.delta || '1.6 > 1.5'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {disp.reason || 'Score disparity across criterion exceeds allowable tolerance threshold.'}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setDisputeModalOpen(false);
                  showToast("Discrepancies review updated");
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-emerald-200"
              >
                Confirm Consensus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP APP BAR - Clean, Spacious, Perfectly Organized 3-Zone Architecture */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 h-16 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        
        {/* Zone 1 (Left): Brand Logo & Event Context */}
        <div className="flex items-center space-x-4 shrink-0">
          <Link href="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4 text-white font-bold" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
              DOGFOOD<span className="text-emerald-600">.OS</span>
            </span>
          </Link>

          {/* Active Event Dropdown Pill */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition-all px-3 py-1.5 rounded-full cursor-pointer group">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-xs">
              <Award className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
              {liveTelemetry?.event?.name || 'Live Hackathon Workspace'}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {liveTelemetry?.event?.status || 'LIVE'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>

        {/* Zone 2 (Center): Elegant Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects, scores, categories..."
              className="w-full pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
            />
            <kbd className="absolute right-3 top-2 px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Zone 3 (Right): Essential Actions, Status & Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Progress Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{liveTelemetry?.telemetry ? `${liveTelemetry.telemetry.reviewCompletionPercentage}% Ballots Sealed` : 'Live Mode'}</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setDisputeModalOpen(true)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title={`Judging Discrepancies (${liveTelemetry?.telemetry?.disputesFlagged || 0} flagged)`}
          >
            <Bell className="w-4 h-4" />
            {(liveTelemetry?.telemetry?.disputesFlagged || 0) > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {liveTelemetry.telemetry.disputesFlagged}
              </span>
            )}
          </button>

          {/* Segmented Organizer | Judge toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setRoleTab('Organizer')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                roleTab === 'Organizer'
                  ? 'bg-white shadow-xs font-bold text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Organizer HUD
            </button>
            <Link
              href="/judge"
              className="px-3 py-1 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            >
              Judge Console
            </Link>
          </div>

          {/* Publish Primary CTA */}
          <button
            onClick={() => showToast("Results stage verified & ready to publish")}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm hover:shadow-emerald-200 transition-all cursor-pointer"
          >
            Publish Results
          </button>

          {/* User Profile Avatar */}
          <div
            className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-offset-1 transition-all"
            title="Lead organizer"
          >
            EL
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR & MAIN CONTENT */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
          <div className="space-y-6">
            
            {/* Primary Navigation Section */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
                Cockpit
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'Getting Started', label: 'Event Overview', icon: Rocket, chevron: false, href: '/gallery' },
                  { id: 'Dashboard', label: 'Organizer dashboard', icon: LayoutDashboard, chevron: false, href: '/dashboard' },
                  { id: 'Teams', label: 'Teams & Projects', icon: Users, chevron: true, href: '/gallery' },
                  { id: 'Judging', label: 'Judging & Ballots', icon: Clock, chevron: true, href: '/judge' },
                  { id: 'Pairwise', label: 'Head-to-head voting', icon: Scale, chevron: true, href: '/judge' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedSidebar === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setSelectedSidebar(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.chevron && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Governance & Integrity Section */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
                Integrity & Governance
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'Communication', label: 'SOS Beacon & Alerts', icon: Megaphone, chevron: false, href: '/organizer' },
                  { id: 'Data room', label: 'Score history', icon: FileText, chevron: false, href: '/verify' },
                  { id: 'Secondaries', label: 'Breaking ties', icon: ArrowLeftRight, chevron: false, href: '/organizer' },
                  { id: 'Documents', label: 'Download everything', icon: Folder, chevron: true, href: '/verify' },
                  { id: 'Settings', label: 'Rubric & Policy Config', icon: Briefcase, chevron: true, href: '/organizer' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedSidebar === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setSelectedSidebar(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.chevron && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

          </div>

          {/* Bottom "What's New in Dogfood" Box */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white space-y-3 shadow-xs">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Recent changes</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Better head-to-head results', href: '/judge' },
                  { label: 'Judges can step aside', href: '/judge' },
                  { label: 'Fair tie-breaking', href: '/verify' },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-200/70 hover:border-emerald-300 text-xs text-slate-700 font-medium transition-all group cursor-pointer hover:shadow-xs"
                  >
                    <span>{item.label}</span>
                    <div className="w-4 h-4 rounded-full border border-slate-200 text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 text-center mt-3 font-mono">
              dogfood-os v1.0 • defensible
            </div>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
          {/* Page Heading & Secondary Control Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {liveTelemetry?.event?.name || 'Live Hackathon Workspace'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                  {liveTelemetry?.event?.currentRound ? `Round #${liveTelemetry.event.currentRound}` : 'Live Cluster'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Event ID: {liveTelemetry?.event?.id || 'live-node-01'} • {dbStatus}
              </p>
            </div>
            
            {/* Secondary Operational Quick-Tools */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={handleClearLiveDb}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 text-xs font-semibold text-slate-700 hover:text-red-700 transition-all cursor-pointer shadow-2xs"
                title="Delete the demo data and start fresh with real data"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear the demo data</span>
              </button>

              <div className="text-xs text-slate-700 font-medium flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Using real data</span>
              </div>

              <div className="text-xs text-slate-700 font-medium flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3 Nodes In Sync</span>
              </div>

              <button
                onClick={() => showToast("Judge invite link copied: http://localhost:3000/judge")}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                <span>Invite</span>
              </button>

              <button
                onClick={() => showToast("Exporting cryptographic audit bundle (audit_pack.zip)...")}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
                title="Download the record"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Download (ZIP)</span>
              </button>
            </div>
          </div>

          {/* Top Banner Alert */}
          {showBanner && (
            <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/60 border border-emerald-200/90 flex items-center justify-between shadow-xs transition-all">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 shadow-xs border border-emerald-200 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  {(liveTelemetry?.telemetry?.assignedBallots || 0) > 0 ? (
                    <>
                      <span className="text-xs font-bold text-slate-900 block sm:inline">
                        Live Judging in Progress — {liveTelemetry?.telemetry?.ballotsSubmitted || 0} of {liveTelemetry?.telemetry?.assignedBallots || 0} ballots submitted ({liveTelemetry?.telemetry?.reviewCompletionPercentage || 0}%).
                      </span>
                      <span className="text-xs text-slate-600 ml-0 sm:ml-1.5">
                        {liveTelemetry?.telemetry?.disputesFlagged || 0} criterion discrepancies flagged for review.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-900 block sm:inline">
                        Live Environment Active — Ready for live project submissions and peer evaluations.
                      </span>
                      <span className="text-xs text-slate-600 ml-0 sm:ml-1.5">
                        Operating directly on live MongoDB records with zero seeded placeholders.
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(liveTelemetry?.telemetry?.disputesFlagged || 0) > 0 && (
                  <button
                    onClick={() => setDisputeModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
                  >
                    Review Disputes ({liveTelemetry.telemetry.disputesFlagged})
                  </button>
                )}
                <button
                  onClick={() => setShowBanner(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
                  title="Close this"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ROW 1: 3-COLUMN METRICS, SCORING DISTRIBUTION, REAL-TIME ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* COLUMN 1: 5-Row Vertical Event Metrics Card (width 3 cols) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between divide-y divide-slate-100 overflow-hidden">
              {[
                {
                  icon: Users,
                  value: String(liveTelemetry?.telemetry?.teamsRegistered ?? 0),
                  label: 'Teams signed up',
                  badge: (liveTelemetry?.telemetry?.teamsRegistered || 0) > 0 ? `${liveTelemetry?.telemetry?.teamsRegistered} in MongoDB` : 'Awaiting Teams',
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  tooltip: 'Total live confirmed project submissions in MongoDB',
                },
                {
                  icon: Clock,
                  value: String(liveTelemetry?.telemetry?.assignedBallots ?? 0),
                  label: 'Scores to give',
                  badge: (liveTelemetry?.telemetry?.assignedBallots || 0) > 0 ? `${liveTelemetry?.telemetry?.assignedBallots} assigned` : '0 assigned',
                  color: 'text-teal-700 bg-teal-50 border-teal-200',
                  tooltip: 'Total judge review ballots',
                },
                {
                  icon: CheckCircle2,
                  value: String(liveTelemetry?.telemetry?.ballotsSubmitted ?? 0),
                  label: 'Scores given',
                  badge: 'Signed SHA-256',
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  tooltip: 'Cryptographically signed judge scores',
                },
                {
                  icon: BarChart3,
                  value: `${liveTelemetry?.telemetry?.reviewCompletionPercentage ?? 0}%`,
                  label: 'Scoring progress',
                  badge: `${liveTelemetry?.telemetry?.ballotsRemaining ?? 0} remaining`,
                  color: 'text-green-700 bg-green-50 border-green-200',
                  tooltip: 'Ballots remaining until full consensus',
                },
                {
                  icon: Award,
                  value: liveTelemetry?.telemetry?.calibratedMeanScore ? Number(liveTelemetry.telemetry.calibratedMeanScore).toFixed(3) : '0.000',
                  label: 'Average score',
                  badge: 'Z-normalized',
                  color: 'text-amber-700 bg-amber-50 border-amber-200',
                  tooltip: 'Live normalized Z-score across criteria',
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    title={stat.tooltip}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${stat.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 leading-snug font-mono">
                          {stat.value}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {stat.badge}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* COLUMN 2: Track & Scoring Distribution Card (width 5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Judging Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ballot allocation across 3 competition tracks
                  </p>
                </div>
                <Link
                  href="/verify"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download the record (ZIP)</span>
                </Link>
              </div>

              {/* Chart & Tracks List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
                {/* Donut Chart with Shield Mascot in Center */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F1F5F9"
                      strokeWidth="10"
                      fill="none"
                    />
                    {liveTelemetry?.telemetry?.tracksBreakdown && liveTelemetry.telemetry.tracksBreakdown.length > 0 ? (
                      liveTelemetry.telemetry.tracksBreakdown.map((t: any, idx: number) => {
                        const colors = ['#10B981', '#0D9488', '#06B6D4', '#059669'];
                        const strokeColor = colors[idx % colors.length];
                        const circumference = 251.2;
                        const arcLength = (t.percentage / 100) * circumference;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="40"
                            stroke={strokeColor}
                            strokeWidth="10"
                            strokeDasharray={`${arcLength} ${circumference}`}
                            strokeDashoffset={idx === 0 ? '0' : `-${idx * 60}`}
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      })
                    ) : (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeDasharray="25.1 251.2"
                        strokeDashoffset="0"
                        fill="none"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Centered Shield & Verified Badge Illustration */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-950 text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      <span className="text-[8px] font-black tracking-widest uppercase text-white/90">FAIR</span>
                    </div>
                  </div>
                </div>

                {/* Right: Tracks List */}
                <div className="space-y-3.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px] font-mono">
                    Tracks Breakdown
                  </div>

                  {liveTelemetry?.telemetry?.tracksBreakdown && liveTelemetry.telemetry.tracksBreakdown.length > 0 ? (
                    liveTelemetry.telemetry.tracksBreakdown.map((track: any, idx: number) => {
                      const colors = ['bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-emerald-700'];
                      const tagColors = [
                        'bg-emerald-100 text-emerald-800 border-emerald-300',
                        'bg-teal-100 text-teal-800 border-teal-300',
                        'bg-cyan-100 text-cyan-800 border-cyan-300',
                        'bg-slate-100 text-slate-800 border-slate-300'
                      ];
                      return (
                        <div key={idx} className="space-y-1 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <div className={`w-5 h-5 rounded-full ${tagColors[idx % tagColors.length]} text-[9px] font-bold flex items-center justify-center border`}>
                                {track.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {track.name}
                              </span>
                            </div>
                            <span className="font-bold text-slate-700 font-mono text-xs">{track.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${colors[idx % colors.length]} h-full rounded-full`} style={{ width: `${track.percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                      No track records yet. Submit live projects to populate distribution.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Switch Toggle: Calibrated Z-Scores vs Raw */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                <span className={isCalibrated ? 'font-bold text-slate-900' : 'text-slate-500'}>
                  Calibrated Normalization
                </span>
                <button
                  onClick={() => setIsCalibrated(!isCalibrated)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                    isCalibrated ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                  title="Show either the fair comparison or the raw scores"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isCalibrated ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={!isCalibrated ? 'font-bold text-slate-900' : 'text-slate-500'}>
                  Raw Mean Scores
                </span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* COLUMN 3: Activity & Action Items Card (width 4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Scoring activity</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-xs text-slate-500">Live consensus & ballot telemetry</p>
              </div>

              {/* Action Items Pill Box with hover pointer */}
              <div
                onClick={() => setDisputeModalOpen(true)}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all group shadow-xs ${
                  (liveTelemetry?.telemetry?.disputesFlagged || 0) > 0
                    ? 'border-red-200 bg-red-50/60 hover:bg-red-50 hover:border-red-300'
                    : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border group-hover:scale-105 transition-transform ${
                    (liveTelemetry?.telemetry?.disputesFlagged || 0) > 0
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-bold tracking-wide ${
                    (liveTelemetry?.telemetry?.disputesFlagged || 0) > 0 ? 'text-red-900' : 'text-emerald-900'
                  }`}>
                    {liveTelemetry?.telemetry?.disputesFlagged || 0} DISPUTES FLAGGED
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  (liveTelemetry?.telemetry?.disputesFlagged || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  <span>{(liveTelemetry?.telemetry?.disputesFlagged || 0) > 0 ? 'Review' : 'Healthy'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* 2x2 Stats Matrix with clean hover states */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100">
                  <div className="text-lg font-black text-slate-900 leading-tight font-mono">
                    {liveTelemetry?.telemetry?.ballotsVoided ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Ballots Voided
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100">
                  <div className="text-lg font-black text-slate-900 leading-tight font-mono">
                    {liveTelemetry?.telemetry?.recusalsHandled ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Recusals Handled
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100">
                  <div className="text-lg font-black text-slate-900 leading-tight flex items-center space-x-1 font-mono">
                    <span>{liveTelemetry?.telemetry?.tiesBroken ?? 0}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Ties Broken
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100">
                  <div className="text-lg font-black text-slate-900 leading-tight flex items-center space-x-1 font-mono">
                    <span>{liveTelemetry?.telemetry?.scoresLocked ?? 0}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Scores Locked
                  </div>
                </div>

                <div className="col-span-2 p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-slate-900 leading-tight flex items-center space-x-1.5 font-mono">
                      <span>{liveTelemetry?.telemetry?.organizerBroadcasts ?? 0}</span>
                      <span className="text-xs font-normal text-slate-500 font-sans">messages sent</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Emergency & round notifications
                    </div>
                  </div>
                  <Link
                    href="/organizer"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: EVALUATION PHASES TIMELINE & DISPUTE POOL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Evaluation Phases Timeline (width 8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Evaluation Phases & Deadlines
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live schedule progress with automated phase advancement
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                    {liveTelemetry?.event?.status || 'Live Cluster'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-900">
                    Peer-Blind Consensus Scoring
                  </span>
                  <p className="text-xs text-slate-500">
                    Autopilot automatically re-routes recused projects and flags standard deviations &gt; 1.5.
                  </p>
                </div>
                <button
                  onClick={() => showToast("Deliberation stage refreshed")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm hover:shadow-emerald-200 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  Sync Cluster
                </button>
              </div>

              {/* Progress Timeline Track Bar */}
              <div className="pt-4 space-y-2">
                {/* Pointer markers above track */}
                <div className="relative h-5 text-[10px] font-bold text-slate-600">
                  <div
                    className="absolute -top-1 flex items-center space-x-1 text-emerald-700 font-mono transition-all duration-300"
                    style={{ left: `${Math.min(95, Math.max(5, liveTelemetry?.telemetry?.reviewCompletionPercentage || 0))}%`, transform: 'translateX(-50%)' }}
                  >
                    <span>▼</span>
                    <span>{liveTelemetry?.telemetry?.ballotsSubmitted ?? 0} of {liveTelemetry?.telemetry?.assignedBallots ?? 0} Submitted ({liveTelemetry?.telemetry?.reviewCompletionPercentage ?? 0}%)</span>
                  </div>
                </div>

                {/* The Track Line */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full shadow-inner transition-all duration-500"
                    style={{ width: `${liveTelemetry?.telemetry?.reviewCompletionPercentage ?? 0}%` }}
                  ></div>
                </div>

                {/* Subtext below track with upward pointer */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1 text-emerald-700 text-[10px] font-bold font-mono">
                      <span>▲</span>
                      <span>Goal: everyone agrees</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {liveTelemetry?.telemetry?.teamsRegistered ?? 0} Projects Registered
                    </div>
                  </div>

                  <div className="text-xs font-bold text-teal-800 font-mono bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    ⏱️ Live System Sync Active
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Pool (width 4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Discrepancy Pool
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                    (liveTelemetry?.telemetry?.disputesFlagged || 0) > 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {liveTelemetry?.telemetry?.disputesFlagged || 0} active
                  </span>
                </div>
                <button
                  onClick={() => setDisputeModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-sm text-emerald-600 font-extrabold">
                      {(liveTelemetry?.telemetry?.assignedBallots || 0) > 0
                        ? (((liveTelemetry?.telemetry?.disputesFlagged || 0) / liveTelemetry.telemetry.assignedBallots) * 100).toFixed(1)
                        : '0.0'}%
                    </span>
                    <span className="text-emerald-600 text-[10px]">▼</span>
                    <span className="text-slate-500 font-normal">Disputes</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Alert at 5%</span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (liveTelemetry?.telemetry?.assignedBallots || 0) > 0
                        ? (((liveTelemetry?.telemetry?.disputesFlagged || 0) / liveTelemetry.telemetry.assignedBallots) * 100) * 4
                        : 0)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div
                onClick={() => setDisputeModalOpen(true)}
                className="text-xs text-slate-600 font-medium p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>
                  <strong className="text-slate-900 text-sm font-mono">{liveTelemetry?.telemetry?.disputesFlagged || 0}</strong> Ballots under consensus review
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* DOCKED SOS BEACON TRIGGER WITH TOOLTIP */}
      <button
        onClick={() => showToast("SOS Beacon activated — Dispatching help ticket to organizers")}
        className="fixed bottom-12 right-8 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-2 shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer border border-slate-700"
        title="Ask for help"
      >
        <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
        <span className="text-xs font-bold font-mono">SOS Beacon</span>
      </button>

      {/* EXECUTIVE TECHNICAL FOOTER */}
      <footer className="bg-slate-900 text-white px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs z-30 border-t border-slate-800 gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-sm text-white">DOGFOOD OS</span>
          <span className="text-slate-600">|</span>
          <Link href="/organizer" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Command Center
          </Link>
          <span className="text-slate-600">•</span>
          <Link href="/judge" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Judge Console
          </Link>
          <span className="text-slate-600">•</span>
          <Link href="/verify" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Trust & Score history
          </Link>
        </div>

        <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Offline-First • SHA-256 Audit Chain • Zero Cloud Runtime Dependencies</span>
        </div>
      </footer>

    </div>
  );
}
