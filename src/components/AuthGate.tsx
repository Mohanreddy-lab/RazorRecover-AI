import React, { useState } from 'react';

export type AuthRole = 'admin' | 'merchant';

interface AuthGateProps {
  role: AuthRole;
  onAuthenticated: (user: { email: string; role: AuthRole }) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ role, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      if (data.user.role !== role && role === 'admin') throw new Error('An administrator account is required for this view.');
      onAuthenticated(data.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="flex min-h-[calc(100vh-66px)] items-center justify-center bg-[#050505] px-4 text-white">
    <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">RazorRecover secure access</p>
      <h1 className="mt-3 text-2xl font-bold">Sign in to {role} console</h1>
      <p className="mt-2 text-sm text-slate-400">Your session is encrypted and expires after eight hours.</p>
      <label className="mt-6 block text-xs font-semibold text-slate-300">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-emerald-400" /></label>
      <label className="mt-4 block text-xs font-semibold text-slate-300">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-emerald-400" /></label>
      {error && <p className="mt-4 rounded border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</p>}
      <button disabled={isSubmitting} className="mt-6 w-full rounded bg-emerald-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-emerald-300 disabled:opacity-50">{isSubmitting ? 'Signing in...' : 'Sign in securely'}</button>
    </form>
  </main>;
};
