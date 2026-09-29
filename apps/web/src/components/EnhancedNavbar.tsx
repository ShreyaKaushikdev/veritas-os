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
  Bell,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Lightbulb,
  MessageSquare,
  Settings,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';
import AuthModal from './AuthModal';
import { API_BASE_URL } from '@/lib/api';

export default function EnhancedNavbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('dogfood_user');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        setCurrentUser(user);
        fetchNotifications(user.id);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/participant-automation/users/${userId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dogfood_auth_token');
    localStorage.removeItem('dogfood_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  interface NavLink {
    href: string;
    label: string;
    icon: any;
    badge?: string;
  }

  // Enhanced navigation with role-based participant features
  const getParticipantLinks = (): NavLink[] => {
    return [
      { href: '/participant/dashboard', label: 'Dashboard', icon: TrendingUp },
      { href: '/participant/my-team', label: 'My Team', icon: Users },
      { href: '/participant/projects', label: 'Projects', icon: FileText },
      { href: '/participant/idea-coach', label: 'Idea Coach', icon: Lightbulb },
      { href: '/participant/collaborate', label: 'Collaborate', icon: MessageSquare },
      { href: '/participant/deadlines', label: 'Deadlines', icon: Calendar, badge: 'urgent' },
    ];
  };

  const getJudgeLinks = (): NavLink[] => {
    return [
      { href: '/judge', label: 'Judge Panel', icon: Award },
      { href: '/gallery', label: 'Projects', icon: FileText },
    ];
  };

  const getOrganizerLinks = (): NavLink[] => {
    return [
      { href: '/organizer', label: 'Command Center', icon: Zap },
      { href: '/organizer/events', label: 'Events', icon: Calendar },
      { href: '/organizer/analytics', label: 'Analytics', icon: TrendingUp },
    ];
  };

  const getAllNavLinks = (): NavLink[] => {
    const commonLinks: NavLink[] = [
      { href: '/', label: 'Overview', icon: null },
      { href: '/story', label: 'Story', icon: null },
    ];

    const userRole = currentUser?.role || 'VISITOR';

    if (userRole === 'PARTICIPANT') {
      return [...commonLinks, ...getParticipantLinks()];
    } else if (userRole === 'JUDGE') {
      return [...commonLinks, ...getJudgeLinks()];
    } else if (userRole === 'ORGANIZER') {
      return [...commonLinks, ...getOrganizerLinks()];
    }

    return commonLinks;
  };

  const navLinks = getAllNavLinks();

  const NotificationBell = () => (
    <div className="relative">
      <button
        onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {notificationDropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-slate-500">{unreadCount} unread</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getPriorityColor(notification.priority)}`}>
                      {notification.priority === 'urgent' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 bg-white px-4 py-2 border-t border-slate-100">
            <Link
              href="/participant/notifications"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              onClick={() => setNotificationDropdownOpen(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      {/* Enhanced Floating Navbar */}
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-7xl rounded-2xl lg:rounded-full z-50 bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_8px_32px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-emerald-500/5 transition-all">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 w-full">
          
          {/* Brand Logo */}
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
                <Sparkles className="w-2.5 h-2.5" />
                Auto
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              
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
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{link.label}</span>
                  {link.badge === 'urgent' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Trailing Controls */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Notification Bell */}
            {currentUser && <NotificationBell />}

            {/* User Session */}
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

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-2 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900 text-xs">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    </div>

                    <div className="py-1.5">
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-medium"
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

            {/* Dashboard CTA */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs border border-emerald-500/40 shadow-sm shadow-emerald-700/20 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* Mobile Menu Toggle */}
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
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
          fetchNotifications(user.id);
        }}
      />
    </>
  );
}
