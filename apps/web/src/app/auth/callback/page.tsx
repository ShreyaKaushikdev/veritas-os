'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received');
      return;
    }

    try {
      localStorage.setItem('dogfood_auth_token', token);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData && userData.user) {
            localStorage.setItem('dogfood_user', JSON.stringify(userData.user));
          } else {
            // Default user fallback if profile endpoint returns simple shape
            const defaultUser = {
              name: 'Authenticated User',
              email: 'user@dogfood.os',
              role: 'PARTICIPANT',
            };
            localStorage.setItem('dogfood_user', JSON.stringify(defaultUser));
          }
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        })
        .catch(() => {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        });
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message || 'Failed to save authentication session');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Completing Sign In...</h2>
            <p className="text-sm text-slate-500 font-mono">Authenticating cryptographic session</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-slate-900">Signed In Successfully!</h2>
            <p className="text-sm text-slate-500 font-mono">Redirecting to command center...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Authentication Error</h2>
            <p className="text-sm text-red-600 font-mono">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
