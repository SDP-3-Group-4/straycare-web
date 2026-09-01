import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { toFirebaseError } from '../../contexts/AuthContext';

function VerifyEmailGate() {
  const { user, sendVerificationEmail, reloadAuthUser, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Re-check verification status every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      reloadAuthUser().catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [reloadAuthUser]);

  const resend = async () => {
    setSending(true);
    setError('');
    setMessage('');
    try {
      await sendVerificationEmail();
      setMessage('Verification email sent. Check your inbox (and spam folder).');
    } catch (e: any) {
      setError(toFirebaseError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--sc-bg)]">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <MailCheck className="text-green-600" size={28} />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Verify your email</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Before you can use StrayCare, please confirm your email address{' '}
          <span className="font-semibold text-gray-800">{user?.email}</span>. We sent you a
          verification link — this page will update automatically once you click it.
        </p>

        {message && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sc-brand-500)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--sc-brand-600)] disabled:opacity-60"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Resend verification email
        </button>
        <button
          type="button"
          onClick={() => logout()}
          className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

import BrandedLoader from '../common/BrandedLoader';

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <BrandedLoader fullScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.emailVerified === false) {
    return <VerifyEmailGate />;
  }

  return children;
}
