'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SOSBeacon from './SOSBeacon';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
  const isLanding = pathname === '/';

  if (isDashboard) {
    // Render full-bleed executive dashboard
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans antialiased">
        {children}
      </div>
    );
  }

  if (isLanding) {
    // Render full-bleed landing page with floating pill navbar and custom footer
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2F7F4] via-[#F8FAF8] to-[#EEF5F1] text-slate-900 font-sans antialiased overflow-x-hidden">
        <Navbar />
        {children}
        <SOSBeacon />
      </div>
    );
  }

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
