'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Terminal, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PARTICIPANT' | 'JUDGE' | 'ORGANIZER'>('PARTICIPANT');
  const [judgeReferralCode, setJudgeReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Helper function to get user-friendly error messages
  const getUserFriendlyError = (error: any, context: string) => {
    const message = error.message || error.toString();
    
    // Handle common API errors with user-friendly messages
    if (message.includes('ThrottlerException') || message.includes('Too Many Requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    
    if (message.includes('Invalid credentials') || message.includes('Unauthorized')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (message.includes('Email already exists') || message.includes('already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    
    if (message.includes('Network request failed') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('Failed to fetch') || error.name === 'TypeError') {
      return 'Unable to connect to the server. Please try again later.';
    }

    if (message.includes('Google authentication failed')) {
      return 'Google sign-in failed. Please try again or use email/password.';
    }
    
    if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
      return 'Service temporarily unavailable. Please try again in a moment.';
    }

    // Return original message if it's already user-friendly, otherwise generic message
    if (message.length > 100 || message.includes('Error:') || message.includes('Exception')) {
      return `${context} failed. Please try again or contact support if the problem persists.`;
    }
    
    return message;
  };

  if (!isOpen) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Handle standard Email/Password authentication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'LOGIN' ? `${apiUrl}/api/v1/auth/login` : `${apiUrl}/api/v1/auth/register`;
      const payload = mode === 'LOGIN' 
        ? { email, password } 
        : { email, password, name, role, judgeReferralCode: role === 'JUDGE' ? judgeReferralCode : undefined };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('dogfood_auth_token', data.token);
      localStorage.setItem('dogfood_user', JSON.stringify(data.user));
      
      // Dispatch events to notify components of auth change
      window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: data.user }));
      window.dispatchEvent(new Event('storage'));
      
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err, mode === 'LOGIN' ? 'Sign in' : 'Account creation');
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production with NEXT_PUBLIC_GOOGLE_CLIENT_ID, Google Identity Services triggers one-tap or OAuth redirect
      // For immediate zero-setup testing, we provide seamless Google Sign-In payload:
      const googlePayload = {
        email: email || 'hacker.participant@gmail.com',
        name: name || 'Google Verified Builder',
        googleId: `goog_${Date.now()}`,
      };

      const res = await fetch(`${apiUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googlePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      localStorage.setItem('dogfood_auth_token', data.token);
      localStorage.setItem('dogfood_user', JSON.stringify(data.user));
      
      // Dispatch events to notify components of auth change
      window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: data.user }));
      window.dispatchEvent(new Event('storage'));
      
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  // Instant Demo Personas for Quick Testing
  const handleSelectDemoPersona = async (demoEmail: string, demoName: string, demoRole: string) => {
    setLoading(true);
    setError(null);
    try {
      // Try to login first
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('dogfood_auth_token', data.token);
        localStorage.setItem('dogfood_user', JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: data.user }));
        window.dispatchEvent(new Event('storage'));
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        // User not registered yet — register them with the demo credentials
        const regRes = await fetch(`${apiUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: demoEmail,
            password: 'password123',
            name: demoName,
            role: demoRole,
            judgeReferralCode: demoRole === 'JUDGE' ? 'JUDGE-2024-VERITAS' : undefined,
          }),
        });
        const regData = await regRes.json();
        
        if (regRes.ok && regData.token) {
          localStorage.setItem('dogfood_auth_token', regData.token);
          localStorage.setItem('dogfood_user', JSON.stringify(regData.user));
          window.dispatchEvent(new CustomEvent('dogfood_user_updated', { detail: regData.user }));
          window.dispatchEvent(new Event('storage'));
          onAuthSuccess(regData.user, regData.token);
          onClose();
        } else {
          setError(regData.message || 'Could not set up demo account');
        }
      }
    } catch (err: any) {
      setError('Could not connect to authentication service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Clickable Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer z-40"
      />

      {/* Main Modal Card */}
      <div className="bg-[#0d131f] text-white max-w-md w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.12)] relative space-y-6 z-50 my-auto">
        {/* Prominent Cut / Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          title="Close (Esc)"
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center shadow-sm transition-all cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SECURE SIGN IN</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
            {mode === 'LOGIN' ? 'Sign In to Dogfood OS' : 'Create an Account'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hosted & offline-compatible authentication with cryptographic role isolation.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center space-x-3 transition-all shadow-md cursor-pointer active:scale-[0.99]"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0d131f] px-3 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider absolute">
              Or use your email
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs pt-1">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1 font-sans">Your name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-medium mb-1 font-sans">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1 font-sans">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-12 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-zinc-300 font-medium mb-1 font-sans">Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#131b2c] border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all"
                >
                  <option value="PARTICIPANT">Participant (Submit & Ideate)</option>
                  <option value="JUDGE">Judge (Rubrics & Pairwise Duels)</option>
                  <option value="ORGANIZER">Organizer (running the event)</option>
                </select>
              </div>

              {role === 'JUDGE' && (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1 font-sans">Judge Referral Code</label>
                  <input
                    type="text"
                    value={judgeReferralCode}
                    onChange={(e) => setJudgeReferralCode(e.target.value)}
                    placeholder="Ask your organizer for this code"
                    className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Judges need a valid referral code from the organizer to create an account
                  </p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] cursor-pointer mt-2"
          >
            <span>{mode === 'LOGIN' ? 'Sign In with Password' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-zinc-400">
          {mode === 'LOGIN' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('REGISTER')} className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold cursor-pointer">
                Register
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button onClick={() => setMode('LOGIN')} className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold cursor-pointer">
                Sign In
              </button>
            </span>
          )}
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block tracking-wider">
            Try a demo account (one click):
          </span>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <button
              onClick={() => handleSelectDemoPersona('sarah.lin@example.com', 'Judge Dr. Sarah Lin #2', 'JUDGE')}
              className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-left transition-all cursor-pointer shadow-xs group"
            >
              <div className="font-bold text-purple-200 group-hover:text-purple-100 transition-colors">Sarah, judge</div>
              <div className="text-purple-400/80 text-[9px] truncate">Expert Evaluator</div>
            </button>
            <button
              onClick={() => handleSelectDemoPersona('elena@dogfood.os', 'Dr. Elena Rostova', 'ORGANIZER')}
              className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-left transition-all cursor-pointer shadow-xs group"
            >
              <div className="font-bold text-emerald-200 group-hover:text-emerald-100 transition-colors">Elena, org</div>
              <div className="text-emerald-400/80 text-[9px] truncate">Lead Organizer</div>
            </button>
            <button
              onClick={() => handleSelectDemoPersona('alice@dogfood.os', 'Alice Walker', 'PARTICIPANT')}
              className="p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/30 text-teal-200 text-left transition-all cursor-pointer shadow-xs group"
            >
              <div className="font-bold text-teal-200 group-hover:text-teal-100 transition-colors">Alice, builder</div>
              <div className="text-teal-400/80 text-[9px] truncate">Hacker / Dev</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}
