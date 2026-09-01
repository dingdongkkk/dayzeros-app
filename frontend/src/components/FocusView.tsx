'use client';

import { useState, useEffect } from 'react';
import { Task, SoundVolumes, SoundType, TimerMode } from '@/types';
import { TasksCard } from './TasksCard';
import { SoundsCard } from './SoundsCard';

interface FocusViewProps {
  userName: string;
  formattedTime: string;
  mode: TimerMode;
  session: number;
  running: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onToggleBreak: () => void;
  tasks: Task[];
  onAddTask?: (text: string) => Promise<void> | void;
  onToggleTask?: (index: number) => Promise<void> | void;
  onDeleteTask?: (index: number) => Promise<void> | void;
  onUpdateTasks?: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  volumes: SoundVolumes;
  onVolumeChange: (sound: SoundType, val: number) => void;
  playingAudio: boolean;
  onToggleAudio: () => void;
  audioElapsed: number;
  todayMinutes: number;
  streak: number;
  highlightedCard: 'tasks' | 'sounds' | 'stats' | 'notes' | null;
  focusInputSignal: number;
}

export function FocusView({
  userName,
  formattedTime,
  mode,
  session,
  running,
  onToggleTimer,
  onResetTimer,
  onToggleBreak,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTasks,
  volumes,
  onVolumeChange,
  playingAudio,
  onToggleAudio,
  audioElapsed,
  todayMinutes,
  streak,
  highlightedCard,
  focusInputSignal,
}: FocusViewProps) {
  const [greeting, setGreeting] = useState(`Good evening, ${userName} —`);

  useEffect(() => {
    const h = new Date().getHours();
    const g =
      h < 5
        ? 'Still awake —'
        : h < 12
        ? 'Good morning —'
        : h < 18
        ? 'Good afternoon —'
        : 'Good evening —';
    setGreeting(g.replace(' —', `, ${userName} —`));
  }, [userName]);

  const activeTask = tasks.find((t) => !t.done);
  const taskLabel = activeTask ? activeTask.t.toUpperCase() : 'OPEN WORK';

  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const todayFormatted = `${todayHours ? `${todayHours}h ` : ''}${todayMins}m`;

  const syncTime = () => {
    const s = new Date();
    s.setHours(19, 30, 0, 0);
    return s.toTimeString().slice(0, 5);
  };

  return (
    <section className="fixed inset-0 z-10 p-[22px] max-[1080px]:relative max-[1080px]:inset-auto max-[1080px]:min-h-screen max-[1080px]:pt-24 max-[1080px]:px-4 max-[1080px]:pb-10">
      {/* Center Countdown and Controls */}
      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center w-[min(92vw,760px)] max-[1080px]:static max-[1080px]:transform-none max-[1080px]:w-auto max-[1080px]:items-start max-[1080px]:text-left max-[1080px]:mt-4">
        <p className="font-serif italic text-[clamp(20px,2.1vw,30px)] m-0 mb-1.5 self-center max-[1080px]:self-start text-[var(--cream)]">
          <span className="scrim">{greeting}</span>
        </p>

        <p className="font-serif font-normal text-[clamp(84px,12.4vw,178px)] leading-none oldstyle-nums m-0 tracking-[-0.01em] text-[var(--cream)] select-none">
          <span className="scrim">{formattedTime}</span>
        </p>

        <p className="font-mono text-[12px] tracking-[4.2px] uppercase mt-[30px] text-[var(--cream)]">
          <span className="scrim-deep">
            {mode === 'focus'
              ? `FOCUS SESSION ${session} OF 4 · ${taskLabel}`
              : 'BREAK · STEP AWAY FROM THE SCREEN'}
          </span>
        </p>

        <div className="flex gap-[13px] mt-[26px] max-[1080px]:flex-wrap">
          <button
            type="button"
            onClick={onToggleTimer}
            className="font-mono text-[14px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] border-none rounded-full py-[13px] px-[26px] cursor-pointer shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] whitespace-nowrap hover:-translate-y-0.5 transition-transform"
          >
            <span aria-hidden="true">{running ? '❙❙' : '▶'}</span>{' '}
            {running ? 'Pause' : 'Start'}
          </button>

          <button
            type="button"
            onClick={onResetTimer}
            className="font-mono text-[14px] inline-flex items-center gap-[9px] bg-[rgba(255,255,255,0.13)] text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-[9px] border-none rounded-full py-[13px] px-[26px] cursor-pointer whitespace-nowrap hover:-translate-y-0.5 transition-transform"
          >
            <span aria-hidden="true">↺</span> Reset
          </button>

          <button
            type="button"
            onClick={onToggleBreak}
            className="font-mono text-[14px] inline-flex items-center gap-[9px] bg-[rgba(255,255,255,0.13)] text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-[9px] border-none rounded-full py-[13px] px-[26px] cursor-pointer whitespace-nowrap hover:-translate-y-0.5 transition-transform"
          >
            <span aria-hidden="true">⏭</span> {mode === 'focus' ? 'Break' : 'Focus'}
          </button>
        </div>
      </div>

      {/* Left Tasks Card */}
      <TasksCard
        tasks={tasks}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onUpdateTasks={onUpdateTasks}
        isHighlighted={highlightedCard === 'tasks' || highlightedCard === 'notes'}
        focusInputSignal={focusInputSignal}
      />

      {/* Right Sounds Card */}
      <SoundsCard
        volumes={volumes}
        onVolumeChange={onVolumeChange}
        playing={playingAudio}
        onTogglePlay={onToggleAudio}
        elapsedSeconds={audioElapsed}
        isHighlighted={highlightedCard === 'sounds'}
      />

      {/* Bottom Stat Pills */}
      <div
        id="statPills"
        className={`absolute left-1/2 bottom-[44px] -translate-x-1/2 flex gap-3 max-[1080px]:static max-[1080px]:transform-none max-[1080px]:flex-wrap max-[1080px]:mt-6 z-10 transition-transform duration-300 ${
          highlightedCard === 'stats' ? 'scale-[1.035]' : 'scale-100'
        }`}
      >
        <span className="font-mono text-[12.5px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] py-[10px] px-[19px] rounded-full shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] cursor-default">
          ◔ {todayFormatted} / 4h
        </span>
        <span className="font-mono text-[12.5px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] py-[10px] px-[19px] rounded-full shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] cursor-default">
          ✦ streak {streak}
        </span>
        <span className="font-mono text-[12.5px] inline-flex items-center gap-[9px] bg-[var(--cream)] text-[var(--ink)] py-[10px] px-[19px] rounded-full shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] cursor-default">
          ▪ {syncTime()} sync
        </span>
      </div>
    </section>
  );
}
