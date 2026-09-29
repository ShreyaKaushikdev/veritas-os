'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Lock, Scale, Users,
  AlertTriangle, Fingerprint, ChevronDown, Terminal, Zap, Eye, Settings,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const IntegrityChainScene = dynamic(() => import('../../components/3d/IntegrityChainScene'), { ssr: false });
const DefensiblePodiumScene = dynamic(() => import('../../components/3d/DefensiblePodiumScene'), { ssr: false });

type Role = 'organiser' | 'participant' | 'judge' | null;

function useInView(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Chapter({ id, children, className = '', dark = false }: { id: string; children: React.ReactNode; className?: string; dark?: boolean }) {
  const { ref, visible } = useInView(0.04);
  return (
    <section id={id} ref={ref}
      className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'} ${className}`}
      style={dark ? { background: '#020617' } : {}}>
      {children}
    </section>
  );
}

function HashChain({ active }: { active: boolean }) {
  const blocks = [
    { label: 'BALLOT', hash: '0x7f49', color: '#10b981' },
    { label: 'SHA-256', hash: 'hash()', color: '#059669' },
    { label: 'NODE', hash: '#4892', color: '#0d9488' },
    { label: 'CHAIN', hash: 'prev', color: '#0f766e' },
    { label: 'ROOT', hash: '0x3c99', color: '#065f46' },
  ];
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 flex-wrap py-4">
      {blocks.map((b, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-700"
            style={{ transitionDelay: `${i * 150}ms`, borderColor: b.color + '60', backgroundColor: b.color + '12', opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.75)' }}>
            <span className="text-[10px] font-mono font-black tracking-widest mb-1" style={{ color: b.color }}>{b.label}</span>
            <span className="text-[9px] font-mono text-slate-500">{b.hash}</span>
          </div>
          {i < blocks.length - 1 && <div className="hidden sm:block w-6 h-px mx-1" style={{ backgroundColor: b.color, opacity: active ? 0.5 : 0, transition: 'opacity 0.5s', transitionDelay: `${i * 150 + 100}ms` }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ChaosLines() {
  return (
    <div className="relative w-full h-36 overflow-hidden opacity-20 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
        {[
          { d: 'M20,40 Q180,10 350,80', delay: '0s', c: '#ef4444' },
          { d: 'M0,100 Q200,150 400,60', delay: '0.4s', c: '#f97316' },
          { d: 'M50,140 Q150,70 380,120', delay: '0.7s', c: '#eab308' },
          { d: 'M10,150 Q230,20 390,110', delay: '1s', c: '#ef4444' },
          { d: 'M80,20 Q160,150 370,30', delay: '1.3s', c: '#f97316' },
        ].map((l, i) => (
          <path key={i} d={l.d} stroke={l.c} strokeWidth="2" fill="none" strokeDasharray="500" strokeDashoffset="500"
            style={{ animation: `sDraw 1.8s ease-out ${l.delay} forwards` }} />
        ))}
      </svg>
      <style>{`@keyframes sDraw{to{stroke-dashoffset:0}}`}</style>
    </div>
  );
}

function StatPill({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold ${dark ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      <span className="text-lg font-black">{value}</span><span className="opacity-70">{label}</span>
    </div>
  );
}

function RolePortal({ icon, label, tagline, journey, colorKey, href, selected, onSelect }: {
  icon: React.ReactNode; label: string; tagline: string; journey: string[];
  colorKey: 'emerald' | 'teal' | 'blue'; href: string; selected: boolean; onSelect: () => void;
}) {
  const c = {
    emerald: { border: 'border-emerald-300', ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    teal: { border: 'border-teal-300', ring: 'ring-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', btn: 'bg-teal-600 hover:bg-teal-700' },
    blue: { border: 'border-blue-300', ring: 'ring-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
  }[colorKey];
  return (
    <div onClick={onSelect} className={`relative rounded-3xl border-2 bg-white cursor-pointer p-6 sm:p-8 flex flex-col transition-all duration-300 ${selected ? `${c.border} ring-2 ${c.ring} shadow-xl` : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'}`}>
      <div className={`w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center mb-5 border ${c.border} transition-transform ${selected ? 'scale-110' : ''}`}>{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-1">{label}</h3>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">{tagline}</p>
      <div className="flex flex-col gap-1.5 mb-6 flex-1">
        {journey.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-black ${c.text} w-4 shrink-0`}>{String(i + 1).padStart(2, '0')}</span>
            <span className="w-px h-3 bg-slate-200 shrink-0" />
            <span className="text-xs font-mono text-slate-600">{step}</span>
          </div>
        ))}
      </div>
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl ${c.btn} text-white font-bold text-sm transition-all hover:scale-[1.02] shadow-md`}>
        Enter as {label} <ArrowRight className="w-4 h-4" />
      </Link>
      {selected && <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${c.btn} flex items-center justify-center`}><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>}
    </div>
  );
}

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => { const t = document.documentElement.scrollHeight - window.innerHeight; setPct((window.scrollY / t) * 100); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-200/30">
      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100" style={{ width: `${pct}%` }} />
    </div>
  );
}

const NAV = [
  { id: 'ch-hero', label: 'Intro' }, { id: 'ch-chaos', label: 'Chaos' }, { id: 'ch-os', label: 'One OS' },
  { id: 'ch-who', label: 'Who?' }, { id: 'ch-build', label: 'Build' }, { id: 'ch-freeze', label: 'Freeze' },
  { id: 'ch-judge', label: 'Judge' }, { id: 'ch-prove', label: 'Prove' }, { id: 'ch-result', label: 'Result' },
];

function ChapterDots() {
  const [active, setActive] = useState('ch-hero');
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }), { threshold: 0.3 });
    NAV.forEach((c) => { const el = document.getElementById(c.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
      {NAV.map((c) => (
        <button key={c.id} title={c.label} onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' })}
          className={`rounded-full transition-all duration-300 cursor-pointer ${active === c.id ? 'w-3 h-3 bg-emerald-500 scale-110' : 'w-2 h-2 bg-slate-400/60 hover:bg-emerald-400'}`} />
      ))}
    </nav>
  );
}

export default function StoryPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [chainActive, setChainActive] = useState(false);
  const chainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chainRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setChainActive(true); }, { threshold: 0.2 });
    obs.observe(chainRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative bg-white text-slate-900 font-sans overflow-x-hidden">
      <ScrollProgress />
      <ChapterDots />

      <section id="ch-hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #020617 0%, #0f172a 65%, #1e293b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.05) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[160px] bg-emerald-500/8 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full blur-[120px] bg-teal-500/6 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 text-[10px] font-mono font-black tracking-widest mb-10 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> THE HACKATHON OPERATING SYSTEM
          </div>
          <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-white leading-none mb-3">DOGFOOD</h1>
          <h1 className="text-7xl sm:text-9xl font-black tracking-tighter leading-none mb-10 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">OS</h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed mb-14">
            A cinematic journey through the hackathon lifecycle.<br /><span className="text-slate-200 font-semibold">From chaos to cryptographic proof.</span>
          </p>
          <div className="flex flex-col items-center gap-2 text-slate-600 text-xs font-mono animate-bounce">
            <span className="tracking-widest">SCROLL TO BEGIN</span><ChevronDown className="w-5 h-5" />
          </div>
        </div>
        <div className="absolute bottom-8 right-8 text-slate-700 text-[10px] font-mono tracking-widest">CH 00 / 07</div>
      </section>

      <Chapter id="ch-chaos" className="py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-600 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 01</span>
            <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-5">THE CHAOS</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Before DOGFOOD OS, every hackathon ended the same way.</p>
          </div>
          <ChaosLines />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            {[
              { icon: <AlertTriangle className="w-5 h-5" />, title: 'Incompatible scores', body: 'Judge A: 7/10. Judge B: 91/100. Nobody can combine them.', a: 'red', s: 'score_FINAL_v3.xlsx' },
              { icon: <Eye className="w-5 h-5" />, title: 'No audit trail', body: 'Results get overwritten. Someone asks why team X won. Silence.', a: 'amber', s: '"Trust us, we checked."' },
              { icon: <Users className="w-5 h-5" />, title: 'Zero useful feedback', body: '48 hours of building. "Great work!" in return.', a: 'orange', s: '"Great job everyone!" — every judge' },
            ].map((card, i) => (
              <div key={i} className={`rounded-2xl p-6 border hover:scale-[1.02] transition-transform cursor-default ${card.a === 'red' ? 'bg-red-50/60 border-red-200' : card.a === 'amber' ? 'bg-amber-50/60 border-amber-200' : 'bg-orange-50/60 border-orange-200'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${card.a === 'red' ? 'bg-red-100 text-red-600' : card.a === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'}`}>{card.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.body}</p>
                <div className={`text-[10px] font-mono px-2 py-1.5 rounded ${card.a === 'red' ? 'bg-red-100 text-red-700' : card.a === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'}`}>{card.s}</div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <blockquote className="text-3xl sm:text-4xl font-black text-slate-900 max-w-2xl mx-auto">"Hackathons should not work like this."</blockquote>
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-os" className="py-28 px-4" dark>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 02</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-5">ONE OPERATING<br /><span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">SYSTEM</span></h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-14">Every actor, every decision, every score — connected, verifiable, permanent.</p>
          <div className="relative max-w-md mx-auto mb-14">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"><Terminal className="w-10 h-10 text-white" /></div>
            <div className="text-sm font-mono font-black text-emerald-400 tracking-widest mb-10">HACKATHON OS</div>
            <div className="grid grid-cols-3 gap-4">
              {[{ icon: <Settings className="w-6 h-6" />, label: 'ORGANISER', sub: 'Command Center' }, { icon: <Users className="w-6 h-6" />, label: 'PARTICIPANT', sub: 'Build Lab' }, { icon: <Scale className="w-6 h-6" />, label: 'JUDGE', sub: 'Judge Arena' }].map((n, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-px h-8 bg-gradient-to-b from-emerald-500/0 to-emerald-500/50" />
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">{n.icon}</div>
                  <span className="text-[10px] font-mono font-black text-slate-300 tracking-wider">{n.label}</span>
                  <span className="text-[9px] font-mono text-slate-600">{n.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <StatPill value="90s" label="to deploy" dark /><StatPill value="50ms" label="sync" dark /><StatPill value="0" label="changes" dark /><StatPill value="100%" label="auditable" dark />
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-who" className="py-28 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-500 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Choose Your Role</span>
            <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-4">Who are you?</h2>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">The story follows your role. Click a portal to enter your world.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <RolePortal icon={<Settings className="w-6 h-6" />} label="Organiser" tagline="Run the entire event from one command centre." journey={['CREATE EVENT', 'CONFIGURE TRACKS', 'MANAGE JUDGES', 'ASSIGN PROJECTS', 'PUBLISH RESULTS']} colorKey="emerald" href="/dashboard" selected={selectedRole === 'organiser'} onSelect={() => setSelectedRole(selectedRole === 'organiser' ? null : 'organiser')} />
            <RolePortal icon={<Users className="w-6 h-6" />} label="Participant" tagline="Build, submit, and get real feedback while you still can." journey={['DISCOVER', 'JOIN TEAM', 'BUILD', 'SUBMIT', 'VERIFY']} colorKey="teal" href="/participant" selected={selectedRole === 'participant'} onSelect={() => setSelectedRole(selectedRole === 'participant' ? null : 'participant')} />
            <RolePortal icon={<Scale className="w-6 h-6" />} label="Judge" tagline="Score projects fairly. Pairwise, blind, conflict-free." journey={['ASSIGN', 'REVIEW', 'SCORE', 'COMMIT', 'VERIFY']} colorKey="blue" href="/judge" selected={selectedRole === 'judge'} onSelect={() => setSelectedRole(selectedRole === 'judge' ? null : 'judge')} />
          </div>
          {selectedRole && <p className="mt-8 text-center text-slate-500 text-sm font-mono">You selected <strong className="text-emerald-700 uppercase">{selectedRole}</strong> — continue scrolling</p>}
        </div>
      </Chapter>

      <Chapter id="ch-build" className="py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 03</span>
            <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-5">BUILD</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">AI validates feasibility. Mentors leave rubric-linked feedback. Everything timestamped.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-500 ml-2">BUILD LAB — HyperAgent Engine</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 font-bold mb-2 tracking-widest">YOUR PROJECT</div>
                  <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-emerald-500 border-r-teal-500 flex items-center justify-center text-2xl font-black font-mono text-emerald-700 mx-auto mb-3" style={{ animation: 'spin 4s linear infinite' }}>72%</div>
                  <style>{`.spin-anim{animation:spin 4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div className="text-sm font-bold text-slate-900">HyperAgent Engine</div>
                  <div className="text-xs text-slate-500 mt-1">72% complete · 14h remaining</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 font-bold mb-2 tracking-wider">AI FEASIBILITY CHECK</div>
                  {[{ label: 'Engineering depth', pct: 94 }, { label: 'Novelty score', pct: 91 }, { label: '48h feasibility', pct: 86 }].map((item) => (
                    <div key={item.label} className="mb-2">
                      <div className="flex justify-between text-xs font-mono mb-1"><span className="text-slate-600">{item.label}</span><span className="font-bold text-emerald-700">{item.pct}%</span></div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${item.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 font-bold mb-2 tracking-wider">VERSION HISTORY</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['v0.1', 'v0.2', 'v0.3', 'v1.0'].map((v, i) => (
                      <React.Fragment key={v}><span className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${i === 3 ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-500'}`}>{v}</span>{i < 3 && <span className="text-slate-300">→</span>}</React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">MENTOR FEEDBACK STREAM</div>
              {[
                { m: 'M-7A2C', t: '4h ago', msg: 'Strong architecture. Consider edge cases for async failure. Rubric: Technical Depth.', tag: 'TECHNICAL' },
                { m: 'M-B19F', t: '9h ago', msg: 'Great novelty. Simplify the demo — show core value clearly.', tag: 'UX' },
                { m: 'M-3E44', t: '18h ago', msg: 'Idea check passed. AI orchestration feasible within 48h.', tag: 'FEASIBILITY' },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700">#{f.m}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${f.tag === 'TECHNICAL' ? 'bg-blue-50 text-blue-700 border-blue-200' : f.tag === 'UX' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{f.tag}</span>
                      <span className="text-[10px] font-mono text-slate-400">{f.t}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.msg}</p>
                </div>
              ))}
              <p className="text-center text-xs font-mono text-emerald-700 font-bold flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Feedback tied to rubric criteria</p>
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-freeze" className="py-28 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-500 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 04</span>
          <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-5">FREEZE</h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed mb-14">The deadline arrives. Participant submits. Project becomes immutable. No edits. No do-overs.</p>
          <div className="flex flex-col items-center gap-2 mb-10">
            {['DRAFT', 'VERSION 2', 'VERSION 3', 'VERSION 4'].map((v) => (<div key={v} className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-300" /><span className="text-sm font-mono text-slate-400">{v}</span></div>))}
            <div className="w-px h-5 bg-gradient-to-b from-slate-300 to-emerald-400" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-600/30"><Lock className="w-7 h-7 text-white" /></div>
              <div className="px-6 py-2 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-800 font-black font-mono text-sm tracking-widest">FINAL — LOCKED</div>
              <div className="text-xs font-mono text-slate-400 mt-1">2026-09-27T23:59:58Z · Immutable</div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-left max-w-xs mx-auto">
            <div className="text-[10px] font-mono text-emerald-700 font-black tracking-wider mb-3">SUBMISSION RECEIPT</div>
            <div className="space-y-2 text-xs font-mono">
              {[['Team', 'HyperAgent Engine'], ['Time', '23:59:58 UTC'], ['Receipt', '#SUB-99214'], ['Status', 'IMMUTABLE']].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-900">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-judge" className="py-28 px-4" dark>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 05</span>
            <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-5">JUDGE<br /><span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ARENA</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">Blind pairwise scoring. Conflict resolution in 38ms.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] font-mono text-slate-400 ml-2">JUDGE ARENA — #A8F4 · Round 4</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">PAIR 142 / 160</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 text-[10px] font-mono font-bold border border-blue-800">BLIND MODE</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ name: 'OmniQuery', tag: 'A', sel: true }, { name: 'VaporSync', tag: 'B', sel: false }].map((p) => (
                    <div key={p.tag} className={`p-4 rounded-xl border font-mono ${p.sel ? 'bg-emerald-900/40 border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-800 border-slate-700'}`}>
                      <span className="text-[9px] font-bold text-slate-500 block mb-1">OPTION {p.tag}</span>
                      <span className="font-black text-white block text-sm">{p.name}</span>
                      {p.sel && <div className="mt-2 text-[9px] font-bold text-emerald-400">Selected</div>}
                    </div>
                  ))}
                </div>
                <div><div className="flex justify-between text-[10px] font-mono mb-1"><span className="text-slate-500">Progress</span><span className="font-bold text-emerald-400">6/8</span></div><div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '75%' }} /></div></div>
                <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-700/40 flex items-center gap-2 text-xs font-mono text-amber-400"><AlertTriangle className="w-4 h-4 shrink-0" />Conflict → moved to #99D2 in 38ms</div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                <div className="text-[10px] font-mono text-slate-500 font-bold tracking-wider mb-3">ASSIGNMENT ENGINE</div>
                <div className="space-y-3">
                  {[{ id: 'J-A8F4', done: '6/8', r: false }, { id: 'J-C31B', done: '7/7', r: true }, { id: 'J-99D2', done: '4/8', r: false }, { id: 'J-F07E', done: '8/8', r: false }].map((j) => (
                    <div key={j.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">{j.id}</span>
                      <div className="flex items-center gap-2">{j.r && <span className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 text-[9px] font-bold border border-amber-700/40">RECUSED</span>}<span className="font-bold text-emerald-400">{j.done}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3"><StatPill value="38ms" label="conflict" dark /><StatPill value="0" label="unresolved" dark /><StatPill value="114/120" label="ballots" dark /></div>
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-prove" className="py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 06</span>
          <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-5">PROVE IT</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">Every ballot hashed and chained. Merkle root published. Tampering breaks the fingerprint.</p>
          <div className="mb-10"><blockquote className="text-3xl font-black text-slate-900 mb-2">"Don't trust it."</blockquote><p className="text-2xl font-black text-emerald-600">Verify it.</p></div>
          <div ref={chainRef} className="mb-10"><HashChain active={chainActive} /></div>
          <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-10"><IntegrityChainScene isTampered={false} /></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 max-w-lg mx-auto">
            <div className="text-[10px] font-mono text-emerald-700 font-black tracking-wider mb-2">MERKLE ROOT — ROUND 4</div>
            <div className="font-mono text-sm text-emerald-800 break-all bg-white rounded-xl p-3 border border-emerald-200 mb-3">0x7f49c2a81de09b3c4f78e19203a98762514bcda9e201</div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/verify" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"><Fingerprint className="w-4 h-4" /> Verify a receipt</Link>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 cursor-pointer"><Eye className="w-4 h-4" /> Public audit</button>
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="ch-result" className="py-28 px-4" dark>
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-mono font-black tracking-widest mb-5 uppercase">Chapter 07 Final</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-5">THE RESULT<br /><span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">WITH PROOF</span></h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">Every decision has evidence. Every score has a receipt. Winners are real.</p>
          <div className="rounded-3xl border border-slate-700 overflow-hidden mb-10 bg-gradient-to-b from-slate-900 to-slate-950"><DefensiblePodiumScene /></div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 max-w-md mx-auto mb-12">
            <div className="text-[10px] font-mono text-slate-500 font-bold tracking-wider mb-4">VERIFIED LEADERBOARD</div>
            <div className="space-y-3">
              {[{ rank: '1st', emoji: 'gold', name: 'HyperAgent Engine', score: '98.4', r: '#BLT-00142' }, { rank: '2nd', emoji: 'silver', name: 'ZeroKernel V3', score: '96.1', r: '#BLT-00089' }, { rank: '3rd', emoji: 'bronze', name: 'MeshMesh', score: '94.8', r: '#BLT-00211' }].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div className="text-left"><div className="font-bold text-white text-sm">{item.name}</div><div className="text-[10px] font-mono text-emerald-500">{item.r}</div></div>
                  </div>
                  <div className="text-right"><div className="font-black text-emerald-400 font-mono text-xl">{item.score}</div><div className="text-[9px] font-mono text-slate-600">VERIFIED</div></div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 mb-2 text-lg">Every decision leaves evidence.</p>
          <p className="text-3xl font-black text-white mb-12">Now it is your turn.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20"><Settings className="w-4 h-4" /> Organiser</Link>
            <Link href="/participant" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-all"><Users className="w-4 h-4" /> Participant</Link>
            <Link href="/judge" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-all"><Scale className="w-4 h-4" /> Judge</Link>
          </div>
        </div>
      </Chapter>

      <footer className="border-t border-slate-800 py-12 px-4" style={{ background: '#020617' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center"><Terminal className="w-4 h-4 text-white" /></div>
            <div><div className="text-white font-black text-sm">DOGFOOD OS</div><div className="text-slate-500 text-xs font-mono">Fair hackathons, start to finish</div></div>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-mono text-slate-500">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Landing</Link>
            <Link href="/verify" className="hover:text-emerald-400 transition-colors">Verify</Link>
            <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
