'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDayzeros } from '@/context/DayzerosContext';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';

export function AppNavbar() {
  const { userName, userEmail, isAuthenticated, cycleScene, triggerCardAction } = useDayzeros();
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const avatarLetter = userName ? userName[0].toUpperCase() : 'A';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[min(72vw,880px)] max-[1080px]:w-[calc(100vw-28px)] max-[1080px]:fixed max-[1080px]:z-50 max-[1080px]:px-3 max-[1080px]:py-2 max-[1080px]:gap-2.5 flex items-center gap-[18px] bg-[var(--cream)] text-[var(--ink)] rounded-full py-[9px] pr-[10px] pl-[26px] shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] z-30 transition-all">
      {/* Brand */}
      <Link
        href="/"
        title="Go to landing page"
        className="font-mono font-bold text-[14px] max-[1080px]:text-[12px] tracking-[3.2px] max-[1080px]:tracking-[3px] flex items-center gap-[9px] whitespace-nowrap bg-transparent border-none text-inherit cursor-pointer p-0 shrink-0 hover:opacity-85 transition-opacity no-underline"
      >
        DAYZEROS
        <i className="w-[7px] h-[7px] rounded-full bg-[var(--rust)] block" />
      </Link>

      {/* App Workspace Navigation Tabs */}
      <div className="flex items-center gap-1.5 mx-auto max-[1080px]:m-0 max-[1080px]:overflow-x-auto max-[1080px]:scrollbar-none">
        <Link
          href="/app"
          className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-[var(--ink)] text-[var(--cream)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
        >
          Focus
        </Link>
        <button
          type="button"
          onClick={() => triggerCardAction('tasks')}
          className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => triggerCardAction('sounds')}
          className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
        >
          Sounds
        </button>
        <Link
          href="/stats"
          className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
        >
          Stats
        </Link>
        <button
          type="button"
          onClick={cycleScene}
          className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
        >
          Scenes
        </button>
      </div>

      {/* Right User Profile Dropdown */}
      <div ref={profileRef} className="relative flex items-center gap-[9px] shrink-0">
        <button
          type="button"
          onClick={() => triggerCardAction('stats')}
          className="font-mono text-[11.5px] text-[var(--muted)] bg-[rgba(27,26,23,0.06)] hover:bg-[rgba(27,26,23,0.1)] rounded-full py-[7px] px-[13px] whitespace-nowrap border-none cursor-pointer max-[1080px]:hidden transition-colors"
        >
          ⌘ K
        </button>

        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          title={isAuthenticated ? `Signed in as ${userName}` : 'Working locally — sign in to sync'}
          className="w-[34px] h-[34px] rounded-full bg-[var(--ink)] text-[var(--cream)] font-sans text-[14px] grid place-items-center shrink-0 cursor-pointer border-none hover:scale-105 transition-transform"
        >
          {avatarLetter}
        </button>

        {/* Profile Popover */}
        {profileOpen && (
          <div className="absolute right-0 top-12 w-56 bg-[var(--cream)] text-[var(--ink)] rounded-2xl p-3 shadow-2xl border border-[#cdc6b8] z-50 animate-fade-in">
            <div className="px-3 py-2 border-b border-[#e2dccf] mb-2">
              <div className="font-mono font-bold text-xs text-[var(--ink)] truncate">
                {isAuthenticated ? userName : 'Working locally'}
              </div>
              {isAuthenticated && userEmail && (
                <div className="font-mono text-[11px] text-[var(--muted)] truncate">
                  {userEmail}
                </div>
              )}
              {isAuthenticated ? (
                <div className="font-mono text-[10px] text-green-700 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                  NeonDB Cloud Synced
                </div>
              ) : (
                <div className="font-mono text-[10px] text-[var(--muted)] mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] block" />
                  Saved on this device only
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left font-mono text-xs text-red-600 hover:bg-red-50 py-2 px-3 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-left font-mono text-xs text-[var(--ink)] hover:bg-[rgba(27,26,23,0.06)] py-2 px-3 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
              >
                Sign In to Sync →
              </button>
            )}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="signin"
      />
    </nav>
  );
}
