'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Terminal,
  ChevronDown,
  LogIn,
  LogOut,
  Sparkles,
  Zap,
  Menu,
  X,
  Activity,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveBallots, setLiveBallots] = useState<string>('Live');

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('dogfood_user');
      if (savedUserStr) {
        setCurrentUser(JSON.parse(savedUserStr));
      } else {
        const defaultUser = {
          name: 'Judge Sarah Lin #2',
          email: 'sarah.lin@dogfood.os',
          role: 'JUDGE',
        };
        setCurrentUser(defaultUser);
        localStorage.setItem('dogfood_user', JSON.stringify(defaultUser));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dogfood_auth_token');
    localStorage.removeItem('dogfood_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:4000/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          if (data && data.telemetry && data.telemetry.assignedBallots > 0) {
            setLiveBallots(`${data.telemetry.ballotsSubmitted}/${data.telemetry.assignedBallots}`);
          } else {
            setLiveBallots('Live');
          }
        }
      } catch (e) {
        setLiveBallots('Live');
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/story', label: 'Story' },
    { href: '/gallery', label: 'Ballots', count: liveBallots },
    { href: '/participant', label: 'Idea Coach' },
    { href: '/judge', label: 'Judge (J/K)' },
    { href: '/verify', label: 'Trust Ledger' },
  ];

  return (
    <>
      {/* Floating Ultra-Premium Frosted Glass Navbar */}
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-7xl rounded-2xl lg:rounded-full z-50 bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_8px_32px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-emerald-500/5 transition-all">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 w-full">
          
          {/* Brand Logo & Protocol Version */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center border border-emerald-400/40 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-all">
              <Terminal className="w-4 h-4 text-white font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                DOGFOOD <span className="text-emerald-600">OS</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 hidden sm:inline-flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}>
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Trailing Controls & Persona Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Live System Node Pill Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/70 text-[11px] font-mono text-emerald-800 shadow-xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-medium">Local & Cloud</span>
            </div>

            {/* User Session Pill or Sign in Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-emerald-300 text-xs font-mono transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap text-slate-700"
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                    {currentUser.role === 'JUDGE' ? 'J' : currentUser.role === 'ORGANIZER' ? 'O' : 'P'}
                  </div>
                  <span className="text-slate-800 text-xs hidden md:inline font-medium">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {currentUser.role}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-2 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900 text-xs">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    </div>

                    <div className="py-1.5">
                      <div className="px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Switch Persona
                      </div>
                      <button
                        onClick={() => {
                          const u = { name: 'Judge Sarah Lin #2', email: 'sarah.lin@dogfood.os', role: 'JUDGE' };
                          setCurrentUser(u);
                          localStorage.setItem('dogfood_user', JSON.stringify(u));
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-slate-700 hover:text-emerald-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="font-medium">Sarah Lin</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200 font-bold">JUDGE</span>
                      </button>
                      <button
                        onClick={() => {
                          const u = { name: 'Elena, organizer', email: 'elena@dogfood.os', role: 'ORGANIZER' };
                          setCurrentUser(u);
                          localStorage.setItem('dogfood_user', JSON.stringify(u));
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 rounded-lg text-slate-700 hover:text-amber-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="font-medium">Elena, organizer</span>
                        <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold">ORGANIZER</span>
                      </button>
                      <button
                        onClick={() => {
                          const u = { name: 'Alice (Team Lead)', email: 'alice@dogfood.os', role: 'PARTICIPANT' };
                          setCurrentUser(u);
                          localStorage.setItem('dogfood_user', JSON.stringify(u));
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-teal-50 rounded-lg text-slate-700 hover:text-teal-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="font-medium">Alice, participant</span>
                        <span className="text-[9px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-full border border-teal-200 font-bold">PARTICIPANT</span>
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-mono text-emerald-800 transition-all cursor-pointer font-medium"
              >
                <LogIn className="w-3 h-3 text-emerald-600" />
                <span>Sign in</span>
              </button>
            )}

            {/* Launch Dashboard CTA Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs border border-emerald-500/40 shadow-sm shadow-emerald-700/20 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pb-4 pt-2 border-t border-slate-100 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500 px-3">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Node Connected
              </span>
              <span>Scores checked</span>
            </div>
          </div>
        )}
      </header>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
      />
    </>
  );
}
