'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { AuthModal } from '@/components/AuthModal';

export function LandingNavbar() {
  const { data: session } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  return (
    <>
      <nav className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[min(76vw,920px)] max-[1080px]:w-[calc(100vw-28px)] max-[1080px]:fixed max-[1080px]:z-50 max-[1080px]:px-4 max-[1080px]:py-2.5 flex items-center justify-between bg-[var(--cream)] text-[var(--ink)] rounded-full py-[10px] pr-[10px] pl-[26px] shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] z-30 transition-all">
        {/* Brand Logo */}
        <Link
          href="/"
          className="font-mono font-bold text-[14px] max-[1080px]:text-[12px] tracking-[3.2px] max-[1080px]:tracking-[3px] flex items-center gap-[9px] whitespace-nowrap bg-transparent border-none text-inherit cursor-pointer p-0 shrink-0 hover:opacity-85 transition-opacity no-underline"
        >
          DAYZEROS
          <i className="w-[7px] h-[7px] rounded-full bg-[var(--rust)] block" />
        </Link>

        {/* Subtitle / Value prop */}
        <div className="flex items-center gap-6 max-[1080px]:hidden">
          <span className="font-sans text-[14px] text-[var(--ink-soft)] tracking-wide">
            Calm Focus & Synthesized Ambience
          </span>
        </div>

        {/* Auth CTAs */}
        <div className="flex items-center gap-2.5">
          {session?.user ? (
            <Link
              href="/app"
              className="font-mono text-[13px] font-bold tracking-[0.5px] bg-[var(--ink)] hover:bg-[var(--ink-soft)] text-[var(--cream)] cursor-pointer py-[9px] px-[20px] rounded-full whitespace-nowrap shrink-0 transition-all flex items-center gap-2 no-underline shadow-sm hover:scale-[1.02]"
            >
              <span>Go to Workspace</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                }}
                className="font-sans text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer py-[8px] px-[14px] rounded-full transition-colors bg-transparent border-none"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="font-mono text-[12.5px] font-bold tracking-[0.5px] bg-[var(--ink)] hover:bg-[var(--ink-soft)] text-[var(--cream)] cursor-pointer py-[9px] px-[18px] rounded-full whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
