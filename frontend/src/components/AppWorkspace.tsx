'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDayzeros } from '@/context/DayzerosContext';
import { FocusView } from '@/components/FocusView';

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const openParam = searchParams.get('open') as 'tasks' | 'sounds' | 'stats' | 'notes' | null;

  const {
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

  // Deep links such as /focus?open=tasks work whether or not a session exists.
  useEffect(() => {
    if (openParam) {
      triggerCardAction(openParam);
    }
  }, [openParam, triggerCardAction]);

  // The workspace is open to everyone. Signing in is optional and only adds
  // cloud sync; without it the context persists everything to localStorage.
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
