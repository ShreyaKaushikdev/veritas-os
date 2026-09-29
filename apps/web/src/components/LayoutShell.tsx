'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import SOSBeacon from './SOSBeacon';
import { getDefaultRoute, canAccessRoute, type Role } from '../lib/rbac';
import { API_BASE_URL } from '@/lib/api';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check authentication state on mount and listen for changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem('dogfood_user');
        const token = localStorage.getItem('dogfood_auth_token');
        
        if (userStr && token) {
          const user = JSON.parse(userStr);
          
          // ✅ SECURITY: Validate that parsed user has required fields
          if (user && user.role && user.email && user.id) {
            setIsAuthenticated(true);
            setUserRole(user.role);
          } else {
            // Corrupted user data — clear and treat as unauthenticated
            localStorage.removeItem('dogfood_user');
            localStorage.removeItem('dogfood_auth_token');
            setIsAuthenticated(false);
            setUserRole(null);
          }
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (e) {
        // JSON parse failed — clear corrupted data
        localStorage.removeItem('dogfood_user');
        localStorage.removeItem('dogfood_auth_token');
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Validate session with server on mount
    const validateSession = async () => {
      const token = localStorage.getItem('dogfood_auth_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          // Server rejected the token — clear local state
          localStorage.removeItem('dogfood_user');
          localStorage.removeItem('dogfood_auth_token');
          setIsAuthenticated(false);
          setUserRole(null);
        } else {
          // ✅ SECURITY: Update local user with server-verified data
          const serverUser = await res.json();
          if (serverUser && serverUser.role) {
            localStorage.setItem('dogfood_user', JSON.stringify(serverUser));
            setUserRole(serverUser.role);
          }
        }
      } catch {
        // Network error — keep local state but don't trust it for sensitive ops
      }
    };

    validateSession();

    // Listen for authentication state changes
    const handleStorageChange = () => checkAuth();
    const handleUserUpdate = () => checkAuth();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dogfood_user_updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dogfood_user_updated', handleUserUpdate);
    };
  }, []);

  // Redirect authenticated user on root to role-specific dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole && pathname === '/') {
      console.log('Redirecting authenticated user:', { userRole, pathname });
      const redirectPath = getDefaultRoute(userRole as Role);
      console.log('Redirect path:', redirectPath);
      router.push(redirectPath);
    }
  }, [isLoading, isAuthenticated, userRole, pathname, router]);

  // ✅ SECURITY: Strict role-based route protection (not just auth check)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Unauthenticated users can only access public routes
      const protectedRoutes = ['/participant', '/judge', '/judge-cockpit', '/organizer', '/admin', '/dashboard'];
      const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
      
      if (isProtectedRoute) {
        router.push('/');
      }
    } else if (userRole) {
      // ✅ SECURITY: Authenticated users must have the correct role for the route
      const role = userRole as Role;
      
      // Map route prefixes to required roles
      const routeRoleRequirements: Record<string, Role[]> = {
        '/participant': ['PARTICIPANT', 'ORGANIZER', 'ADMIN'],
        '/judge': ['JUDGE', 'ORGANIZER', 'ADMIN'],
        '/judge-cockpit': ['JUDGE', 'ORGANIZER', 'ADMIN'],
        '/organizer': ['ORGANIZER', 'ADMIN'],
        '/admin': ['ADMIN'],
        '/dashboard': ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'],
      };

      for (const [routePrefix, allowedRoles] of Object.entries(routeRoleRequirements)) {
        if (pathname?.startsWith(routePrefix) && !allowedRoles.includes(role)) {
          // User's role doesn't match this route — redirect to their default
          const defaultRoute = getDefaultRoute(role);
          router.push(defaultRoute);
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, userRole, pathname, router]);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/story', '/verify', '/gallery', '/auth', '/admin/test-data'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  // If loading, show nothing
  if (isLoading) {
    return null;
  }

  // Dashboard routes
  const isDashboard = pathname === '/dashboard' || 
                      pathname?.startsWith('/participant') ||
                      pathname?.startsWith('/judge') ||
                      pathname?.startsWith('/judge-cockpit') ||
                      pathname?.startsWith('/organizer') ||
                      (pathname?.startsWith('/admin') && pathname !== '/admin/test-data');

  if (isDashboard) {
    // Render full-bleed dashboard
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans antialiased">
        <Navbar />
        {children}
        <SOSBeacon />
      </div>
    );
  }

  // Public landing page (unauthenticated only)
  if (pathname === '/') {
    // If authenticated, redirect happens in useEffect above
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white font-sans antialiased overflow-x-hidden">
        <Navbar />
        {children}
        <SOSBeacon />
      </div>
    );
  }

  // Default layout for other pages
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F7F4] via-[#F8FAF8] to-[#EEF5F1] text-slate-800 flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {children}
      </main>
      <SOSBeacon />
      <footer className="border-t border-emerald-900/10 py-6 text-center text-xs font-mono text-slate-500 bg-white/60">
        DOGFOOD OS v1.0 • SHA-256 Tamper-Evident State Lineage • Zero Cloud Runtime Dependencies
      </footer>
    </div>
  );
}
