'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scene, Task } from '@/types';
import { useSession } from '@/lib/auth-client';

const SCENE_NAMES: Record<Scene, string> = {
  dusk: 'MEADOW AT DUSK',
  night: 'MEADOW AT NIGHT',
  dawn: 'MEADOW AT DAWN',
};

interface SpaceViewProps {
  scene: Scene;
  streak: number;
  todayMinutes: number;
  formattedTime: string;
  session: number;
  tasks: Task[];
  onCycleScene: () => void;
}

export function SpaceView({
  scene,
  streak,
  todayMinutes,
  formattedTime,
  session,
  tasks,
  onCycleScene,
}: SpaceViewProps) {
  const { data: authSession } = useSession();
  const [stampText, setStampText] = useState('');
  const [wallClock, setWallClock] = useState({ time: '6:42', ampm: 'pm' });

  const isAuthenticated = !!authSession?.user;

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const dateStr = d
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
        .toUpperCase()
        .replace(/,/g, '');
      setStampText(`${dateStr} · ${SCENE_NAMES[scene]}`);

      let h = d.getHours();
      const ap = h < 12 ? 'am' : 'pm';
      h = h % 12 || 12;
      setWallClock({
        time: `${h}:${String(d.getMinutes()).padStart(2, '0')}`,
        ampm: ap,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 10);
    return () => clearInterval(interval);
  }, [scene]);

  const activeTask = tasks.find((t) => !t.done);
  const taskLabel = activeTask ? activeTask.t.toUpperCase() : 'OPEN WORK';
  const openTaskCount = tasks.filter((t) => !t.done).length;

  const todayHours = Math.floor(todayMinutes / 60);
  const todayMinsRemainder = todayMinutes % 60;
  const todayLabel = `${todayHours ? `${todayHours}H ` : ''}${todayMinsRemainder}M TODAY`;

  return (
    <>
      <section className="fixed inset-0 z-10 p-[22px] max-[1080px]:relative max-[1080px]:inset-auto max-[1080px]:min-h-screen max-[1080px]:pt-28 max-[1080px]:px-4 max-[1080px]:pb-12 flex flex-col justify-between pointer-events-none">
        {/* Top / Left Stamp & Live Clock */}
        <div className="absolute left-[52px] top-[26vh] max-[1080px]:static max-[1080px]:m-0 flex flex-col items-start gap-[14px] [text-shadow:0_2px_18px_rgba(6,10,28,0.75)] pointer-events-auto">
          <div className="font-mono text-[11.5px] tracking-[3.4px] text-[rgba(247,245,241,0.9)] uppercase">
            <span className="scrim">{stampText}</span>
          </div>
          <div className="font-serif text-[clamp(44px,5.6vw,74px)] leading-none text-[var(--cream)] m-0">
            <span className="scrim">
              {wallClock.time}
              <em className="text-[0.46em] italic ml-[0.14em] font-serif not-italic-nums">{wallClock.ampm}</em>
            </span>
          </div>
          <div className="flex gap-[10px] [text-shadow:none] max-[1080px]:flex-wrap max-[1080px]:mt-4">
            <span className="font-mono text-[11.5px] tracking-[1.6px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] py-[9px] px-4 rounded-full shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] cursor-default">
              🔥 {streak} DAYS
            </span>
            <span className="font-mono text-[11.5px] tracking-[1.6px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] py-[9px] px-4 rounded-full shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] cursor-default">
              {todayLabel}
            </span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="absolute right-[52px] top-[19vh] max-w-[min(46vw,620px)] text-right max-[1080px]:static max-[1080px]:max-w-none max-[1080px]:text-left max-[1080px]:my-8 pointer-events-auto">
          <p className="font-serif italic text-[clamp(17px,1.55vw,23px)] leading-[1.62] text-[rgba(247,245,241,0.95)] mb-[0.5em]">
            <span className="scrim">One task at a time.</span>
            <br />
            <span className="scrim">The meadow will wait.</span>
          </p>
          <h1 className="font-serif font-normal text-[clamp(66px,10.4vw,158px)] leading-[0.9] m-0 tracking-[-0.012em]">
            <span className="scrim">Deep</span>
            <em className="block italic font-serif">
              <span className="scrim">work.</span>
            </em>
          </h1>
        </div>

        {/* Live Session Caption Preview */}
        <div className="absolute right-[52px] bottom-[132px] max-[1080px]:static max-[1080px]:mt-4 max-[1080px]:block font-mono text-[11.5px] tracking-[3.2px] text-[rgba(247,245,241,0.9)] uppercase pointer-events-auto">
          <span className="scrim">
            SESSION {session}/4 · {formattedTime} REMAINING · {taskLabel}
          </span>
        </div>

        {/* Landing CTA Dock */}
        <div className="absolute left-1/2 bottom-[44px] -translate-x-1/2 flex gap-3 items-center max-[1080px]:static max-[1080px]:transform-none max-[1080px]:flex-wrap max-[1080px]:mt-6 z-20 pointer-events-auto">
          <Link
            href="/app"
            className="font-mono text-[13px] font-bold tracking-[0.5px] inline-flex items-center gap-[10px] bg-[var(--cream)] text-[var(--ink)] border-none rounded-full py-[12px] px-[24px] cursor-pointer shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] whitespace-nowrap hover:-translate-y-0.5 hover:shadow-xl transition-all no-underline"
          >
            <span aria-hidden="true">▶</span>
            <span>{isAuthenticated ? 'Open Workspace' : 'Start Focusing'} ({formattedTime})</span>
          </Link>

          <Link
            href="/app?open=tasks"
            className="font-mono text-[13px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] border-none rounded-full py-[11px] px-[21px] cursor-pointer shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] whitespace-nowrap hover:-translate-y-0.5 transition-transform no-underline"
          >
            ✓ Tasks <span className="bg-[var(--ink)] text-[var(--cream)] rounded-full min-w-[22px] h-[22px] grid place-items-center text-[11.5px] px-1">{openTaskCount}</span>
          </Link>

          <Link
            href="/app?open=sounds"
            className="font-mono text-[13px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] border-none rounded-full py-[11px] px-[21px] cursor-pointer shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] whitespace-nowrap hover:-translate-y-0.5 transition-transform no-underline"
          >
            ♪ Sounds
          </Link>

          <button
            type="button"
            onClick={onCycleScene}
            className="font-mono text-[13px] inline-flex items-center gap-[9px] bg-[rgba(255,255,255,0.13)] text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-[9px] border-none rounded-full py-[11px] px-[21px] cursor-pointer whitespace-nowrap hover:-translate-y-0.5 transition-transform"
          >
            🖼 Scenes
          </button>
        </div>
      </section>
    </>
  );
}
