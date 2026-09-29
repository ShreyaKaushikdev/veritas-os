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
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  Rocket,
  PlusCircle
} from 'lucide-react';
import AuthModal from './AuthModal';
import CreateHackathonModal from './CreateHackathonModal';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveBallots, setLiveBallots] = useState<string>('Live');

  useEffect(() => {
    const syncUser = () => {
      try {
        const savedUserStr = localStorage.getItem('dogfood_user');
        if (savedUserStr) {
          setCurrentUser(JSON.parse(savedUserStr));
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
      }
    };

    syncUser();

    const handleUserUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        syncUser();
      }
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('dogfood_user_updated', handleUserUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('dogfood_user_updated', handleUserUpdate as EventListener);
    };
  }, []);

  const switchPersona = (u: { name: string; email: string; role: string }) => {
    setCurrentUser(u);
    localStorage.setItem('dogfood_user', JSON.stringify(u));
    window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: u }));
    window.dispatchEvent(new Event('storage'));
    setUserDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('dogfood_auth_token');
    localStorage.removeItem('dogfood_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: null }));
    window.dispatchEvent(new Event('storage'));
    // Force redirect to home page
    window.location.href = '/';
  };
  // Navigation links based on user role
  const getAllNavLinks = () => {
    const userRole = currentUser?.role || 'VISITOR';

    if (userRole === 'PARTICIPANT') {
      return [
        { href: '/', label: 'Overview' },
        { href: '/story', label: 'Story' },
        { href: '/participant', label: 'Mission Control' },
        { href: '/verify', label: 'Trust Ledger' },
      ];
    }

    if (userRole === 'JUDGE') {
      return [
        { href: '/', label: 'Overview' },
        { href: '/story', label: 'Story' },
        { href: '/gallery', label: 'Ballots', count: liveBallots },
        { href: '/judge', label: 'Judge Cockpit' },
        { href: '/verify', label: 'Trust Ledger' },
      ];
    }

    if (userRole === 'ORGANIZER' || userRole === 'ADMIN') {
      return [
        { href: '/', label: 'Overview' },
        { href: '/story', label: 'Story' },
        { href: '/organizer', label: 'Control Center' },
        { href: '/gallery', label: 'Ballots', count: liveBallots },
        { href: '/verify', label: 'Trust Ledger' },
      ];
    }

    // Default VISITOR
    return [
      { href: '/', label: 'Overview' },
      { href: '/story', label: 'Story' },
      { href: '/verify', label: 'Trust Ledger' },
    ];
  };

  const navLinks = getAllNavLinks();
  const userRole = currentUser?.role || 'VISITOR';

  const cleanFirstName = currentUser?.name
    ? currentUser.name.replace(/,/g, '').split(' ')[0]
    : '';

  return (
    <>
      {/* Floating Navbar */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl rounded-2xl z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-xl">
        <div className="flex items-center justify-between px-6 py-3">
          
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center shadow-md">
              <Terminal className="w-4 h-4 text-white font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                DOGFOOD <span className="text-emerald-600">OS</span>
              </span>
              <span className="text-xs font-mono px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hidden sm:inline-flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count && (
                    <span className={`px-2 py-1 rounded-full text-xs font-mono font-bold ${
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
          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* User Menu or Sign In */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition-all"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">{cleanFirstName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${
                    userRole === 'ORGANIZER' || userRole === 'ADMIN'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : userRole === 'JUDGE'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}>
                    {currentUser.role}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-2">
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-sm text-slate-500 truncate">{currentUser.email}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="px-3 py-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Switch Role (Demo)
                      </div>
                      
                      <button
                        onClick={() => switchPersona({ name: 'Elena Rodriguez', email: 'elena@dogfood.os', role: 'ORGANIZER' })}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          userRole === 'ORGANIZER' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        <span>Elena, Organizer</span>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">ORGANIZER</span>
                      </button>
                      
                      <button
                        onClick={() => switchPersona({ name: 'Sarah Lin', email: 'sarah.lin@dogfood.os', role: 'JUDGE' })}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          userRole === 'JUDGE' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-purple-50'
                        }`}
                      >
                        <span>Sarah, Judge</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">JUDGE</span>
                      </button>
                      
                      <button
                        onClick={() => switchPersona({ name: 'Alice Builder', email: 'alice@dogfood.os', role: 'PARTICIPANT' })}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          userRole === 'PARTICIPANT' ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-teal-50'
                        }`}
                      >
                        <span>Alice, Participant</span>
                        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">PARTICIPANT</span>
                      </button>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
            {/* Role-Based Action Button */}
            {(userRole === 'ORGANIZER' || userRole === 'ADMIN') && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}

            {userRole === 'JUDGE' && (
              <Link
                href="/judge"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Judge</span>
              </Link>
            )}

            {userRole === 'PARTICIPANT' && (
              <Link
                href="/participant"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Rocket className="w-4 h-4" />
                <span>Build</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 p-4">
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                    {link.count && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user, token) => {
          window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: user }));
          window.dispatchEvent(new Event('storage'));
          setAuthModalOpen(false);
        }}
      />
      
      <CreateHackathonModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
        }}
      />
    </>
  );
}