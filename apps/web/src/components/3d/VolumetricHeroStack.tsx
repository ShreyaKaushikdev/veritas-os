'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, Terminal, ShieldCheck, Lock } from 'lucide-react';

export default function VolumetricHeroStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 400, y: 200, opacity: 0 });
  const [mounted, setMounted] = useState(false);

  // Target and current values for requestAnimationFrame lerp smoothing
  const animRef = useRef({
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    targetSpotX: 400,
    targetSpotY: 200,
    currentSpotX: 400,
    currentSpotY: 200,
  });

  useEffect(() => {
    setMounted(true);
    let animationFrameId: number;

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const renderLoop = () => {
      const state = animRef.current;
      state.currentRotX = lerp(state.currentRotX, state.targetRotX, 0.08);
      state.currentRotY = lerp(state.currentRotY, state.targetRotY, 0.08);
      state.currentSpotX = lerp(state.currentSpotX, state.targetSpotX, 0.12);
      state.currentSpotY = lerp(state.currentSpotY, state.targetSpotY, 0.12);

      setTilt({
        x: Math.round(state.currentRotX * 100) / 100,
        y: Math.round(state.currentRotY * 100) / 100,
      });

      setSpotlight((prev) => ({
        ...prev,
        x: Math.round(state.currentSpotX),
        y: Math.round(state.currentSpotY),
      }));

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    animRef.current.targetRotX = -normY * 5.5; // max 5.5 deg tilt
    animRef.current.targetRotY = normX * 6.5;  // max 6.5 deg tilt
    animRef.current.targetSpotX = x;
    animRef.current.targetSpotY = y;
    setSpotlight((prev) => ({ ...prev, opacity: 1 }));
  };

  const handleMouseLeave = () => {
    animRef.current.targetRotX = 0;
    animRef.current.targetRotY = 0;
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[460px] sm:min-h-[520px] rounded-3xl overflow-hidden cursor-crosshair select-none flex items-center justify-center p-6 sm:p-12 my-4 border border-white/10"
      style={{
        perspective: '1200px',
      }}
    >
      {/* 3D Transform-Style Preserve-3D Stage with Lerped Rotation & Dolly-in Entry */}
      <div
        className={`w-full max-w-4xl mx-auto text-center relative transition-transform duration-75 ease-out ${
          mounted ? 'animate-dolly-in' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* LAYER 0 (translateZ: 0px) - Base Holographic Grid & Depth Backing */}
        <div
          className="absolute inset-0 -inset-x-12 -inset-y-12 -z-20 rounded-3xl pointer-events-none opacity-40 overflow-hidden"
          style={{
            transform: 'translateZ(0px)',
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(13, 27, 42, 0.8) 0%, rgba(7, 9, 14, 0.95) 100%),
              linear-gradient(to right, rgba(0, 242, 254, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 242, 254, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 36px 36px, 36px 36px',
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-teal/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-violet/10 blur-3xl" />
        </div>

        {/* LAYER 1 (translateZ: 55px) - Spotlight Peel Layer & State Matrix */}
        <div
          className="absolute inset-0 -inset-x-8 -inset-y-8 -z-10 rounded-2xl pointer-events-none transition-opacity duration-500 overflow-hidden border border-brand-teal/20 bg-dark-900/40"
          style={{
            transform: 'translateZ(55px)',
            opacity: spotlight.opacity,
            WebkitMaskImage: `radial-gradient(340px circle at ${spotlight.x}px ${spotlight.y}px, black 25%, transparent 85%)`,
            maskImage: `radial-gradient(340px circle at ${spotlight.x}px ${spotlight.y}px, black 25%, transparent 85%)`,
          }}
        >
          <div className="absolute inset-0 p-8 flex flex-col justify-between text-left font-mono text-[11px] text-brand-teal/70 opacity-90">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-brand-teal" />
                <span>SHA-256 STATE INTEGRITY MESH REVEALED</span>
              </span>
              <span className="text-[10px] text-brand-cyan font-bold">AIR-GAP PEEL ACTIVE</span>
            </div>

            <div className="grid grid-cols-3 gap-4 my-auto opacity-75">
              <div className="p-2.5 rounded-lg bg-brand-teal/10 border border-brand-teal/30">
                <span className="text-[9px] block text-brand-teal font-bold">[NODE #161]</span>
                <span className="text-[10px] text-gray-200">Ballot Committed</span>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-violet/10 border border-brand-violet/30">
                <span className="text-[9px] block text-brand-violet font-bold">[BIAS CALIBRATED]</span>
                <span className="text-[10px] text-gray-200">Anchor Delta: +0.05</span>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-emerald/10 border border-brand-emerald/30">
                <span className="text-[9px] block text-brand-emerald font-bold">[TIE-BREAK CASCADE]</span>
                <span className="text-[10px] text-gray-200">Rubric Priority 1</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Merkle: 8b49911e8a49c49b934ca495991b7852b855ef12</span>
              <span>100% Deterministic</span>
            </div>
          </div>
        </div>

        {/* LAYER 2 (translateZ: 110px) - Elevated Headline, Badges & CTAs */}
        <div
          className="space-y-6 relative"
          style={{
            transform: 'translateZ(110px)',
          }}
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-dark-850/90 border border-brand-teal/40 text-xs font-mono text-brand-teal shadow-xl shadow-brand-teal/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span>Autonomous Systems & Edge Intelligence 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none drop-shadow-2xl">
            Every decision{' '}
            <span className="bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-violet bg-clip-text text-transparent">
              explainable & auditable
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-md">
            DOGFOOD OS is the self-hosted, offline-first operating system for hackathons.
            Calibrated judging, deterministic idea coaching, and cryptographic state verification runnable with one command.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/participant"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-dark-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-brand-cyan/25 flex items-center space-x-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Test Idea with Coach</span>
            </Link>

            <Link
              href="/judge"
              className="px-6 py-3 rounded-xl bg-dark-850/90 hover:bg-dark-800 border border-white/20 text-white font-semibold text-sm hover:scale-105 transition-all shadow-xl flex items-center space-x-2 backdrop-blur-md"
            >
              <Terminal className="w-4 h-4 text-brand-teal" />
              <span>Launch Judge Console</span>
            </Link>

            <Link
              href="/verify"
              className="px-6 py-3 rounded-xl bg-dark-850/90 hover:bg-dark-800 border border-brand-emerald/40 text-brand-emerald font-semibold text-sm hover:scale-105 transition-all shadow-xl flex items-center space-x-2 backdrop-blur-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Integrity Chain</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
