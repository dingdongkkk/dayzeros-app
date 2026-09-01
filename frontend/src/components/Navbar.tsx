'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDayzeros } from '@/context/DayzerosContext';

interface NavbarProps {
  onOpenCard?: (card: 'tasks' | 'sounds' | 'stats' | 'notes') => void;
}

export function Navbar({ onOpenCard }: NavbarProps) {
  const pathname = usePathname();
  const isFocusPage = pathname.startsWith('/focus') || pathname.startsWith('/app') || pathname.startsWith('/planner');
  const { userName, cycleScene, triggerCardAction } = useDayzeros();
  const avatarLetter = userName ? userName[0].toUpperCase() : 'A';

  const handleCardClick = (card: 'tasks' | 'sounds' | 'stats' | 'notes') => {
    if (onOpenCard) {
      onOpenCard(card);
    } else {
      triggerCardAction(card);
    }
  };

  return (
    <nav
      className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[min(72vw,880px)] max-[1080px]:w-[calc(100vw-28px)] max-[1080px]:fixed max-[1080px]:z-50 max-[1080px]:px-3 max-[1080px]:py-2 max-[1080px]:gap-2.5 flex items-center gap-[18px] bg-[var(--cream)] text-[var(--ink)] rounded-full py-[9px] pr-[10px] pl-[26px] shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] z-30 transition-all"
    >
      <Link
        href="/"
        className="font-mono font-bold text-[14px] max-[1080px]:text-[12px] tracking-[3.2px] max-[1080px]:tracking-[3px] flex items-center gap-[9px] whitespace-nowrap bg-transparent border-none text-inherit cursor-pointer p-0 shrink-0 hover:opacity-85 transition-opacity no-underline"
      >
        DAYZEROS
        <i className="w-[7px] h-[7px] rounded-full bg-[var(--rust)] block" />
      </Link>

      <div className="flex items-center gap-1.5 mx-auto max-[1080px]:m-0 max-[1080px]:overflow-x-auto max-[1080px]:scrollbar-none">
        {!isFocusPage ? (
          <>
            <Link
              href="/"
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-[var(--ink)] text-[var(--cream)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
            >
              Space
            </Link>
            <Link
              href="/focus"
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
            >
              Planner
            </Link>
            <Link
              href="/focus?open=notes"
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
            >
              Journal
            </Link>
            <Link
              href="/focus?open=stats"
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
            >
              Stats
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/focus"
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-[var(--ink)] text-[var(--cream)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors no-underline"
            >
              Focus
            </Link>
            <button
              type="button"
              onClick={() => handleCardClick('tasks')}
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
            >
              Tasks
            </button>
            <button
              type="button"
              onClick={() => handleCardClick('sounds')}
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
            >
              Sounds
            </button>
            <button
              type="button"
              onClick={() => handleCardClick('stats')}
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
            >
              Stats
            </button>
            <button
              type="button"
              onClick={cycleScene}
              className="font-sans text-[15px] max-[1080px]:text-[14px] font-normal bg-transparent hover:bg-[rgba(27,26,23,0.07)] text-[var(--ink-soft)] cursor-pointer py-[9px] px-[17px] max-[1080px]:py-2 max-[1080px]:px-3 rounded-full whitespace-nowrap shrink-0 transition-colors"
            >
              Scenes
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-[9px] shrink-0">
        <button
          type="button"
          onClick={() => triggerCardAction('stats')}
          className="font-mono text-[11.5px] text-[var(--muted)] bg-[rgba(27,26,23,0.06)] hover:bg-[rgba(27,26,23,0.1)] rounded-full py-[7px] px-[13px] whitespace-nowrap border-none cursor-pointer max-[1080px]:hidden transition-colors"
        >
          ⌘ K
        </button>
        {isFocusPage && (
          <div className="w-[34px] h-[34px] rounded-full bg-[var(--ink)] text-[var(--cream)] font-sans text-[14px] grid place-items-center shrink-0">
            {avatarLetter}
          </div>
        )}
      </div>
    </nav>
  );
}
