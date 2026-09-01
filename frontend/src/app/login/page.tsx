'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
      <div className="w-full max-w-md bg-[var(--cream)] text-[var(--ink)] rounded-[28px] p-8 shadow-[0_24px_60px_-15px_rgba(8,10,26,0.8)] border border-[rgba(255,255,255,0.3)]">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="font-mono text-[11px] tracking-[3.2px] text-[var(--muted)] uppercase block mb-2 no-underline hover:text-[var(--ink)] transition-colors"
          >
            ← Back to Dayzeros
          </Link>
          <h1 className="font-serif font-normal text-3xl tracking-tight m-0 text-[var(--ink)]">
            Welcome Back
          </h1>
          <p className="font-serif italic text-sm text-[var(--muted)] mt-1.5 mb-0">
            Sign in to resume your focus sessions
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-700 font-mono text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full font-mono text-sm bg-transparent border border-[#cdc6b8] focus:border-[var(--ink)] rounded-xl py-2.5 px-3.5 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full font-mono text-sm bg-transparent border border-[#cdc6b8] focus:border-[var(--ink)] rounded-xl py-2.5 px-3.5 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-mono text-xs font-bold uppercase tracking-[1.5px] bg-[var(--ink)] hover:bg-[var(--ink-soft)] text-[var(--cream)] py-3.5 rounded-full transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="font-sans text-xs text-[var(--muted)]">Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="font-mono text-xs text-[var(--ink)] font-bold hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
