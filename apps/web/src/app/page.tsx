'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Clock, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Award, 
  GitBranch,
  Lock,
  Eye,
  Sparkles,
  Terminal,
  Play,
  ChevronRight,
  Layers,
  Target,
  Brain,
  Code2,
  ExternalLink
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AuthModal from '@/components/AuthModal';

const PotentialRadarScene = dynamic(() => import('@/components/3d/PotentialRadarScene'), { ssr: false });

/**
 * DOGFOOD OS PUBLIC OVERVIEW PAGE
 * 
 * This page is shown ONLY to unauthenticated visitors.
 * Explains what DOGFOOD OS is, why it exists, and how it works.
 * Authenticated users are automatically redirected to role-specific dashboards.
 */

export default function PublicOverviewPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeRole, setActiveRole] = useState<'PARTICIPANT' | 'JUDGE' | 'ORGANIZER'>('PARTICIPANT');
  const [currentStep, setCurrentStep] = useState(1);

  // Immediate redirect check for authenticated users
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      try {
        const userStr = localStorage.getItem('dogfood_user');
        const token = localStorage.getItem('dogfood_auth_token');
        
        if (userStr && token) {
          const user = JSON.parse(userStr);
          if (user && user.role) {
            console.log('Found authenticated user on public page:', user.role);
            const redirectPath = user.role === 'PARTICIPANT' ? '/participant' :
                               user.role === 'JUDGE' ? '/judge' :
                               user.role === 'ORGANIZER' ? '/organizer' :
                               user.role === 'ADMIN' ? '/admin' : '/';
            
            if (redirectPath !== '/') {
              console.log('Redirecting to:', redirectPath);
              window.location.href = redirectPath; // Force redirect
            }
          }
        }
      } catch (e) {
        console.error('Auth check error:', e);
      }
    };

    checkAuthAndRedirect();

    // Also listen for auth changes
    const handleAuthChange = () => {
      setTimeout(checkAuthAndRedirect, 100);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('dogfood_user_updated', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('dogfood_user_updated', handleAuthChange);
    };
  }, [router]);

  // Scroll-triggered animation for lifecycle steps
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.lifecycle-step').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white overflow-x-hidden">
      
      {/* HERO SECTION - "THE HACKATHON OPERATING SYSTEM" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
        
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[160px] bg-emerald-500/8 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px] bg-teal-500/6 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left: Hero Content */}
          <div className="space-y-8">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-emerald-400">THE HACKATHON OPERATING SYSTEM</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  DOGFOOD OS
                </span>
              </h1>
              <h2 className="text-2xl md:text-3xl text-white font-bold">
                Run the hackathon.<br />
                Verify the outcome.
              </h2>
            </div>

            {/* Supporting Description */}
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              A hackathon operating system for organizing events, coordinating teams, evaluating projects, and producing independently verifiable results.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-semibold transition-all transform hover:scale-105 cursor-pointer"
              >
                <span>Explore DOGFOOD OS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-emerald-500/50 rounded-xl font-medium transition-all hover:bg-slate-800/50 cursor-pointer"
              >
                <span>Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right: AI-Generated Consensus Engine Visual */}
          <div className="relative group max-w-lg mx-auto w-full">
            {/* Ambient Aurora Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-purple-600/25 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition duration-700" />

            <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-slate-950/90 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-xl">
              <img
                src="/hero-consensus.jpg"
                alt="DOGFOOD OS Consensus Engine"
                className="w-full h-auto object-cover aspect-square transition-transform duration-700 group-hover:scale-105"
              />

              {/* Live Hologram Status Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-[11px] font-mono text-emerald-400 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CONSENSUS PROTOCOL · ACTIVE</span>
              </div>

              {/* Cryptographic Lineage Footer Badge */}
              <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono shadow-2xl">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline text-zinc-400">Ledger Root:</span>
                  <span className="text-emerald-400 font-bold">0x8f4b...3d9a</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tamper-Evident</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* WHY DOGFOOD OS? - Problem/Solution Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-6 text-white">Why DOGFOOD OS?</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Current hackathons often rely on broken processes that undermine fairness and transparency
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Current Problem */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-red-400 mb-6">Current Reality</h3>
            <div className="space-y-4">
              {[
                { step: 'Forms', desc: 'Manual registration', icon: '📝' },
                { step: 'Spreadsheets', desc: 'Team tracking chaos', icon: '📊' },
                { step: 'Group Chats', desc: 'Scattered communication', icon: '💬' },
                { step: 'Manual Assignments', desc: 'Judge allocation guesswork', icon: '👤' },
                { step: 'Scattered Scores', desc: 'Inconsistent evaluation', icon: '📈' },
                { step: 'Manual Result Compilation', desc: 'Error-prone ranking', icon: '🏆' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-red-900/20 border border-red-800/30">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-red-300">{item.step}</div>
                    <div className="text-sm text-red-400/80">{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400/60 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: DOGFOOD OS Solution */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-emerald-400 mb-6">DOGFOOD OS</h3>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30">
              <Terminal className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-emerald-300 mb-4">ONE OPERATING SYSTEM</h4>
              <div className="space-y-3 text-sm">
                {[
                  'Event Management',
                  'Team Formation',
                  'Project Tracking',
                  'Submission System',
                  'Judging Workflow',
                  'Ranking Engine',
                  'Verified Results'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* THREE ROLE EXPERIENCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-6 text-white">ONE PLATFORM.<br />THREE WORKSPACES.</h2>
          <p className="text-xl text-slate-400">Each role gets a specialized environment designed for their workflow</p>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-col sm:flex-row justify-center mb-12 gap-2">
          {[
            { key: 'PARTICIPANT', label: 'Participant', color: 'blue' },
            { key: 'JUDGE', label: 'Judge', color: 'purple' },
            { key: 'ORGANIZER', label: 'Organizer', color: 'emerald' }
          ].map((role) => (
            <button
              key={role.key}
              onClick={() => setActiveRole(role.key as any)}
              className={`px-6 py-3 rounded-full font-semibold transition-all cursor-pointer ${
                activeRole === role.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Role Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Role Details */}
          <div className="space-y-6">
            {activeRole === 'PARTICIPANT' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-blue-400 mb-3">PARTICIPANT</h3>
                  <p className="text-lg text-blue-300 mb-6">Build. Submit. Prove your work.</p>
                </div>
                <div className="space-y-4">
                  {[
                    'Join Hackathon',
                    'Create / Join Team',
                    'Develop Project',
                    'Get Idea Feedback',
                    'Prepare Submission',
                    'Run Preflight Checks',
                    'Submit',
                    'Freeze Version',
                    'Track Judging',
                    'View Results'
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300">
                        {index + 1}
                      </div>
                      <span className="text-blue-200">{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  <span>Explore Participant Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {activeRole === 'JUDGE' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-purple-400 mb-3">JUDGE</h3>
                  <p className="text-lg text-purple-300 mb-6">Evaluate with structure. Commit with integrity.</p>
                </div>
                <div className="space-y-4">
                  {[
                    'Receive Assignment',
                    'Calibration',
                    'Review Project',
                    'Apply Rubric',
                    'Record Evidence',
                    'Submit Ballot',
                    'Cryptographic Commitment',
                    'Verification Receipt'
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-300">
                        {index + 1}
                      </div>
                      <span className="text-purple-200">{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  <span>Explore Judge Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeRole === 'ORGANIZER' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-3">ORGANIZER</h3>
                  <p className="text-lg text-emerald-300 mb-6">Run the entire event from one control tower.</p>
                </div>
                <div className="space-y-4">
                  {[
                    'Create Event',
                    'Configure Tracks',
                    'Configure Rubric',
                    'Manage Participants',
                    'Assign Judges',
                    'Monitor Judging',
                    'Review Rankings',
                    'Sign Off',
                    'Publish Results'
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300">
                        {index + 1}
                      </div>
                      <span className="text-emerald-200">{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  <span>Explore Organizer Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Right: Mock UI Preview */}
          <div className="relative">
            <div className="aspect-video bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-xs font-mono text-slate-400">
                    {activeRole === 'PARTICIPANT' ? 'participant.dogfood.dev' : 
                     activeRole === 'JUDGE' ? 'judge.dogfood.dev' : 
                     'organizer.dogfood.dev'}
                  </div>
                </div>
                
                {/* Mock UI Content */}
                <div className="space-y-3">
                  <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-slate-800/50 rounded"></div>
                    <div className="h-16 bg-slate-800/50 rounded"></div>
                    <div className="h-16 bg-slate-800/50 rounded"></div>
                  </div>
                  <div className="h-4 bg-slate-700/30 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900/90 flex items-center justify-end pr-8">
              <div className="text-right">
                <div className={`text-sm font-mono ${
                  activeRole === 'PARTICIPANT' ? 'text-blue-400' :
                  activeRole === 'JUDGE' ? 'text-purple-400' :
                  'text-emerald-400'
                }`}>
                  {activeRole} DASHBOARD
                </div>
                <div className="text-xs text-slate-500">Role-Specific Interface</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* THE HACKATHON LIFECYCLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-6 text-white">FROM IDEA TO VERIFIED RESULT</h2>
          <p className="text-xl text-slate-400">Follow the complete hackathon journey inside DOGFOOD OS</p>
        </div>

        <div className="space-y-8">
          {[
            { num: '01', title: 'DISCOVER', desc: 'Browse events and find your hackathon', role: 'VISITOR', feature: 'Event Gallery' },
            { num: '02', title: 'REGISTER', desc: 'Join as participant, judge, or organizer', role: 'USER', feature: 'Role Selection' },
            { num: '03', title: 'FORM TEAM', desc: 'Create or join teams with invite codes', role: 'PARTICIPANT', feature: 'Team Management' },
            { num: '04', title: 'BUILD', desc: 'Develop your project with versioning', role: 'PARTICIPANT', feature: 'Project Tracking' },
            { num: '05', title: 'SUBMIT', desc: 'Upload final submission with metadata', role: 'PARTICIPANT', feature: 'Submission Portal' },
            { num: '06', title: 'FREEZE', desc: 'Lock submission with cryptographic hash', role: 'SYSTEM', feature: 'Version Control' },
            { num: '07', title: 'ASSIGN', desc: 'Distribute projects to calibrated judges', role: 'ORGANIZER', feature: 'Judge Assignment' },
            { num: '08', title: 'EVALUATE', desc: 'Score projects using structured rubric', role: 'JUDGE', feature: 'Evaluation Workspace' },
            { num: '09', title: 'RANK', desc: 'Generate rankings with Bradley-Terry model', role: 'SYSTEM', feature: 'Ranking Engine' },
            { num: '10', title: 'VERIFY', desc: 'Create public proof of integrity', role: 'SYSTEM', feature: 'Integrity Chain' },
            { num: '11', title: 'ANNOUNCE', desc: 'Publish verifiable results', role: 'ORGANIZER', feature: 'Results Publication' }
          ].map((step, index) => (
            <div 
              key={index}
              className="lifecycle-step opacity-0 transition-all duration-700 transform translate-y-8"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-8 p-6 rounded-2xl bg-slate-900/30 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-slate-500">{step.role}</div>
                  <div className="text-xs text-emerald-400">{step.feature}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* INTEGRITY STORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Integrity Explanation */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black mb-6 text-white">
                Don't just publish the result.<br />
                <span className="text-emerald-400">Make it verifiable.</span>
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                DOGFOOD OS creates a cryptographic chain of custody for every score, 
                ensuring results cannot be tampered with after submission.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { step: 'Judge Ballots', desc: 'Structured evaluation with rubric scoring', icon: <Users className="w-5 h-5" /> },
                { step: 'Hash Commitment', desc: 'Cryptographic fingerprint of each ballot', icon: <Lock className="w-5 h-5" /> },
                { step: 'Chain Linking', desc: 'Ballots linked in tamper-evident sequence', icon: <GitBranch className="w-5 h-5" /> },
                { step: 'Ranking Synthesis', desc: 'Bradley-Terry model generates rankings', icon: <BarChart3 className="w-5 h-5" /> },
                { step: 'Public Verification', desc: 'Anyone can audit the complete chain', icon: <Shield className="w-5 h-5" /> }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-300">{item.step}</h4>
                    <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual Integrity Chain */}
          <div className="relative">
            <div className="space-y-4">
              {/* Judge Evaluation */}
              <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30 text-center">
                <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-purple-300">JUDGE EVALUATION</div>
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-6 h-6 text-slate-500 rotate-90" />
              </div>
              
              {/* Ballot */}
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 text-center">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-blue-300">BALLOT</div>
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-6 h-6 text-slate-500 rotate-90" />
              </div>
              
              {/* Hash/Commitment */}
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30 text-center">
                <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-yellow-300">HASH / COMMITMENT</div>
                <div className="text-xs font-mono text-yellow-400/80 mt-1">0x4a7b9c...</div>
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-6 h-6 text-slate-500 rotate-90" />
              </div>
              
              {/* Chain */}
              <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-center">
                <GitBranch className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-emerald-300">CHAIN</div>
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-6 h-6 text-slate-500 rotate-90" />
              </div>
              
              {/* Public Verification */}
              <div className="p-4 rounded-lg bg-teal-900/20 border border-teal-500/30 text-center">
                <Shield className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-teal-300">PUBLIC VERIFICATION</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* WHAT EACH ROLE GETS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-6 text-white">What Each Role Gets</h2>
          <p className="text-xl text-slate-400">Specialized tools and interfaces for every participant</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Participant */}
          <div className="space-y-6 p-8 rounded-2xl bg-blue-900/10 border border-blue-500/20">
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-blue-300 mb-2">PARTICIPANT</h3>
            </div>
            <div className="space-y-3">
              {[
                'Team Management',
                'Project Management', 
                'Versioned Submissions',
                'Idea Feedback',
                'Submission Readiness',
                'Gallery',
                'Notifications',
                'Support',
                'Results'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Judge */}
          <div className="space-y-6 p-8 rounded-2xl bg-purple-900/10 border border-purple-500/20">
            <div className="text-center">
              <Eye className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-purple-300 mb-2">JUDGE</h3>
            </div>
            <div className="space-y-3">
              {[
                'Judge Profile/Passport',
                'Assignments',
                'Calibration',
                'Rubric',
                'Evaluation Workspace',
                'Notes',
                'Pairwise Comparison',
                'Recusal',
                'Ballot Commitment',
                'Verification Receipt',
                'Progress'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Organizer */}
          <div className="space-y-6 p-8 rounded-2xl bg-emerald-900/10 border border-emerald-500/20">
            <div className="text-center">
              <Terminal className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-300 mb-2">ORGANIZER</h3>
            </div>
            <div className="space-y-3">
              {[
                'Event Management',
                'Participants',
                'Teams',
                'Projects',
                'Tracks & Prizes',
                'Rubrics',
                'Judges',
                'Assignments',
                'Judging Monitor',
                'Rankings',
                'Results',
                'Announcements',
                'Audit & Integrity',
                'Analytics'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center space-y-8">
          <div>
            <h2 className="text-4xl font-black mb-6 text-white">
              Ready to Enter the Hackathon?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose your path into the DOGFOOD OS ecosystem
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all transform hover:scale-105 cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span>I'm Participating</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-semibold transition-all transform hover:scale-105 cursor-pointer"
            >
              <Terminal className="w-5 h-5" />
              <span>I'm Organizing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-purple-500/50 rounded-xl font-medium transition-all hover:bg-slate-800/50 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>I'm Judging</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user, token) => {
          // Dispatch events to update auth state
          window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: user }));
          window.dispatchEvent(new Event('storage'));
          setShowAuthModal(false);
          // LayoutShell will handle the redirect
        }}
      />
    </div>
  );
}