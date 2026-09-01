'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'signin',
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUp.email({
          name: name.trim() || 'Focus Wanderer',
          email: email.trim(),
          password: password,
        });

        if (res.error) {
          setError(res.error.message || 'Failed to create account');
          setLoading(false);
          return;
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password: password,
        });

        if (res.error) {
          setError(res.error.message || 'Invalid email or password');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/app');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[var(--cream)] text-[var(--ink)] rounded-[28px] p-8 shadow-[0_24px_60px_-15px_rgba(8,10,26,0.8)] border border-[rgba(255,255,255,0.3)]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-[#9a9386] hover:text-[var(--rust)] font-mono text-xl transition-colors p-1"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="font-mono text-[11px] tracking-[3.2px] text-[var(--muted)] uppercase mb-2">
            Dayzeros Cloud
          </div>
          <h2 className="font-serif font-normal text-3xl tracking-tight m-0 text-[var(--ink)]">
            {mode === 'signin' ? 'Enter the Meadow' : 'Begin Your Journey'}
          </h2>
          <p className="font-serif italic text-sm text-[var(--muted)] mt-1.5 mb-0">
            {mode === 'signin'
              ? 'Sign in to access your focus sessions and tasks'
              : 'Create an account to track deep work and streaks'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[rgba(27,26,23,0.06)] rounded-full p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 font-mono text-xs py-2 rounded-full transition-all ${
              mode === 'signin'
                ? 'bg-[var(--ink)] text-[var(--cream)] shadow-sm'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 font-mono text-xs py-2 rounded-full transition-all ${
              mode === 'signup'
                ? 'bg-[var(--ink)] text-[var(--cream)] shadow-sm'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-700 font-mono text-xs">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aditi"
                className="w-full font-mono text-sm bg-transparent border border-[#cdc6b8] focus:border-[var(--ink)] rounded-xl py-2.5 px-3.5 outline-none transition-colors"
              />
            </div>
          )}

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
              minLength={6}
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
            {loading ? 'Connecting...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}
