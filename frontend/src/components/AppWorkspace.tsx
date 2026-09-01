'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDayzeros } from '@/context/DayzerosContext';
import { FocusView } from '@/components/FocusView';
import { AuthModal } from '@/components/AuthModal';

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openParam = searchParams.get('open') as 'tasks' | 'sounds' | 'stats' | 'notes' | null;

  const {
    isAuthenticated,
    isAuthLoading,
    userName,
    formattedTime,
    timerMode,
    session,
    timerRunning,
    toggleStartPause,
    resetTimer,
    toggleBreak,
    tasks,
    addTask,
    toggleTaskDone,
    deleteTask,
    updateTasks,
    volumes,
    handleVolumeChange,
    playingAudio,
    toggleAudio,
    audioElapsed,
    todayMinutes,
    streak,
    highlightedCard,
    focusInputSignal,
    triggerCardAction,
  } = useDayzeros();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setAuthModalOpen(true);
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (openParam && isAuthenticated) {
      triggerCardAction(openParam);
    }
  }, [openParam, isAuthenticated, triggerCardAction]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#12132a]/80 backdrop-blur-sm">
        <div className="font-mono text-xs text-[var(--cream)] uppercase tracking-[2px] animate-pulse">
          Connecting to Meadow Cloud...
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--cream)] text-[var(--ink)] rounded-[28px] p-8 shadow-[0_24px_60px_-15px_rgba(8,10,26,0.8)] text-center border border-[rgba(255,255,255,0.3)]">
          <div className="font-mono text-[11px] tracking-[3.2px] text-[var(--muted)] uppercase mb-2">
            Dayzeros Workspace
          </div>
          <h2 className="font-serif font-normal text-3xl tracking-tight m-0">
            Account Required
          </h2>
          <p className="font-serif italic text-sm text-[var(--muted)] mt-2 mb-6">
            Please sign in or create an account to start focus sessions and persist tasks in the cloud.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full font-mono text-xs font-bold uppercase tracking-[1.5px] bg-[var(--ink)] hover:bg-[var(--ink-soft)] text-[var(--cream)] py-3.5 rounded-full transition-all shadow-md cursor-pointer border-none"
            >
              Sign In / Sign Up →
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full font-mono text-xs text-[var(--muted)] hover:text-[var(--ink)] py-2 bg-transparent border-none cursor-pointer"
            >
              ← Back to Landing Page
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode="signin"
        />
      </div>
    );
  }

  return (
    <FocusView
      userName={userName}
      formattedTime={formattedTime}
      mode={timerMode}
      session={session}
      running={timerRunning}
      onToggleTimer={toggleStartPause}
      onResetTimer={resetTimer}
      onToggleBreak={toggleBreak}
      tasks={tasks}
      onAddTask={addTask}
      onToggleTask={toggleTaskDone}
      onDeleteTask={deleteTask}
      onUpdateTasks={updateTasks}
      volumes={volumes}
      onVolumeChange={handleVolumeChange}
      playingAudio={playingAudio}
      onToggleAudio={toggleAudio}
      audioElapsed={audioElapsed}
      todayMinutes={todayMinutes}
      streak={streak}
      highlightedCard={highlightedCard}
      focusInputSignal={focusInputSignal}
    />
  );
}

export function AppWorkspace() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#12132a]" />}>
      <WorkspaceContent />
    </Suspense>
  );
}
