'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Scene, TimerMode, Task, SoundVolumes, SoundType } from '@/types';
import { useAudioAmbience } from '@/hooks/useAudioAmbience';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSession } from '@/lib/auth-client';
import { api, BackendTask } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

const SCENES: Scene[] = ['dusk', 'night', 'dawn'];
const SCENE_NAMES: Record<Scene, string> = {
  dusk: 'MEADOW AT DUSK',
  night: 'MEADOW AT NIGHT',
  dawn: 'MEADOW AT DAWN',
};

interface DayzerosContextType {
  mounted: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userName: string;
  userEmail: string | null;
  scene: Scene;
  setScene: (s: Scene) => void;
  cycleScene: () => void;
  tasks: Task[];
  updateTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  addTask: (text: string) => Promise<void>;
  toggleTaskDone: (index: number) => Promise<void>;
  deleteTask: (index: number) => Promise<void>;
  streak: number;
  todayMinutes: number;
  // Ambience
  volumes: SoundVolumes;
  handleVolumeChange: (sound: SoundType, val: number) => void;
  playingAudio: boolean;
  toggleAudio: () => void;
  audioElapsed: number;
  unlockAudio: () => void;
  playChime: () => void;
  // Timer
  timerMode: TimerMode;
  session: number;
  formattedTime: string;
  timerRunning: boolean;
  toggleStartPause: () => void;
  resetTimer: () => void;
  toggleBreak: () => void;
  // Toast
  toastMessage: string | null;
  toastVisible: boolean;
  showToast: (msg: string) => void;
  // Card Highlights
  highlightedCard: 'tasks' | 'sounds' | 'stats' | 'notes' | null;
  setHighlightedCard: (card: 'tasks' | 'sounds' | 'stats' | 'notes' | null) => void;
  focusInputSignal: number;
  triggerCardAction: (card: 'tasks' | 'sounds' | 'stats' | 'notes') => void;
}

const DayzerosContext = createContext<DayzerosContextType | null>(null);

export function DayzerosProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: sessionData, isPending: isAuthLoading } = useSession();

  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { t: 'Clear inbox to zero', done: true },
    { t: 'Draft Q4 roadmap', done: false },
    { t: "Review Maya's PR", done: false },
    { t: 'Book dentist', done: false },
  ]);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(192);
  const [streak, setStreak] = useState(12);
  const [scene, setSceneState] = useState<Scene>('dusk');
  const [volumes, setVolumes] = useState<SoundVolumes>({ rain: 78, crickets: 62, wind: 0 });

  const [highlightedCard, setHighlightedCard] = useState<'tasks' | 'sounds' | 'stats' | 'notes' | null>(null);
  const [focusInputSignal, setFocusInputSignal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const isAuthenticated = !!sessionData?.user;
  const userName = sessionData?.user?.name || 'Focus Wanderer';
  const userEmail = sessionData?.user?.email || null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [toastVisible, toastMessage]);

  // Load cloud data from Fastify backend when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isSubscribed = true;

    async function loadCloudData() {
      try {
        const [cloudTasks, cloudStats] = await Promise.all([
          api.getTasks().catch(() => null),
          api.getStats().catch(() => null),
        ]);

        if (!isSubscribed) return;

        if (cloudTasks && Array.isArray(cloudTasks)) {
          setTasks(cloudTasks.map((t: BackendTask) => ({ t: t.t, done: t.done })));
          setTaskIds(cloudTasks.map((t: BackendTask) => t.id));
        }

        if (cloudStats) {
          setTodayMinutes(cloudStats.todayMinutes);
          setStreak(cloudStats.streak);
          if (cloudStats.scene) setSceneState(cloudStats.scene);
          if (cloudStats.volumes) setVolumes(cloudStats.volumes);
        }
      } catch {
        // Fallback to initial state
      }
    }

    loadCloudData();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]);

  const updateTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prev) => {
      const updated = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      return updated;
    });
  };

  const addTask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistic local state update
    setTasks((prev) => [...prev, { t: trimmed, done: false }]);

    if (isAuthenticated) {
      try {
        const created = await api.createTask(trimmed);
        setTaskIds((prev) => [...prev, created.id]);
      } catch {
        showToast('Failed to sync task with cloud');
      }
    }
  };

  const toggleTaskDone = async (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    );

    const id = taskIds[index];
    if (isAuthenticated && id) {
      const task = tasks[index];
      try {
        await api.updateTask(id, { done: !task.done });
      } catch {}
    }
  };

  const deleteTask = async (index: number) => {
    const id = taskIds[index];
    setTasks((prev) => prev.filter((_, i) => i !== index));
    setTaskIds((prev) => prev.filter((_, i) => i !== index));

    if (isAuthenticated && id) {
      try {
        await api.deleteTask(id);
      } catch {}
    }
  };

  const handleSetVolume = (sound: SoundType, val: number) => {
    setVolumes((prev) => {
      const updated = { ...prev, [sound]: val };
      if (isAuthenticated) {
        api.saveSettings({
          [`vol${sound.charAt(0).toUpperCase() + sound.slice(1)}`]: val,
        }).catch(() => {});
      }
      return updated;
    });
  };

  const setScene = (newScene: Scene) => {
    setSceneState(newScene);
    if (isAuthenticated) {
      api.saveSettings({ scene: newScene }).catch(() => {});
    }
  };

  const {
    playing: playingAudio,
    elapsed: audioElapsed,
    togglePlay: toggleAudio,
    handleVolumeChange,
    unlockAudio,
    playChime,
  } = useAudioAmbience(volumes, handleSetVolume);

  const handleTimerDone = useCallback(
    async (finishedMode: TimerMode) => {
      playChime();
      if (finishedMode === 'focus') {
        setTodayMinutes((m) => m + 25);
        if (isAuthenticated) {
          api.bankSession(25).catch(() => {});
        }
        showToast('Session done — take five');
      } else {
        showToast('Break over — ready when you are');
      }
    },
    [playChime, showToast, isAuthenticated]
  );

  const {
    mode: timerMode,
    session,
    formattedTime,
    running: timerRunning,
    toggleStartPause,
    resetTimer,
    toggleBreak,
  } = usePomodoro({
    onSessionComplete: (mins) => {
      setTodayMinutes((m) => m + mins);
      if (isAuthenticated) {
        api.bankSession(mins).catch(() => {});
      }
    },
    onTimerDone: handleTimerDone,
    unlockAudio,
  });

  // Sync data-scene attribute on body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.scene = scene;
    }
  }, [scene]);

  // Update dynamic document title
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (pathname.includes('/app') || pathname.includes('/focus')) {
      document.title = (timerRunning ? `${formattedTime} · ` : '') + 'Dayzeros';
    } else {
      document.title = 'Dayzeros';
    }
  }, [pathname, timerRunning, formattedTime]);

  const cycleScene = useCallback(() => {
    const nextIdx = (SCENES.indexOf(scene) + 1) % SCENES.length;
    const nextScene = SCENES[nextIdx];
    setScene(nextScene);
    showToast(SCENE_NAMES[nextScene]);
  }, [scene, showToast]);

  const triggerCardAction = useCallback(
    (card: 'tasks' | 'sounds' | 'stats' | 'notes') => {
      setHighlightedCard(card);
      setTimeout(() => setHighlightedCard(null), 550);

      if (card === 'notes') {
        setFocusInputSignal((s) => s + 1);
        showToast('Jot it in tasks for now');
      } else if (card === 'stats') {
        showToast(`${todayMinutes} min focused today`);
      }
    },
    [todayMinutes, showToast]
  );

  const handleResetWithToast = useCallback(() => {
    resetTimer();
    showToast('Timer reset');
  }, [resetTimer, showToast]);

  const handleCommandPalette = useCallback(() => {
    showToast('Command palette — coming soon');
  }, [showToast]);

  const handleToggleView = useCallback(() => {
    if (pathname === '/') {
      router.push('/app');
    } else {
      router.push('/');
    }
  }, [pathname, router]);

  useKeyboardShortcuts({
    onToggleTimer: toggleStartPause,
    onResetTimer: handleResetWithToast,
    onCycleScene: cycleScene,
    onToggleView: handleToggleView,
    onCommandPalette: handleCommandPalette,
  });

  return (
    <DayzerosContext.Provider
      value={{
        mounted,
        isAuthenticated,
        isAuthLoading,
        userName,
        userEmail,
        scene,
        setScene,
        cycleScene,
        tasks,
        updateTasks,
        addTask,
        toggleTaskDone,
        deleteTask,
        streak,
        todayMinutes,
        volumes,
        handleVolumeChange,
        playingAudio,
        toggleAudio,
        audioElapsed,
        unlockAudio,
        playChime,
        timerMode,
        session,
        formattedTime,
        timerRunning,
        toggleStartPause,
        resetTimer: handleResetWithToast,
        toggleBreak,
        toastMessage,
        toastVisible,
        showToast,
        highlightedCard,
        setHighlightedCard,
        focusInputSignal,
        triggerCardAction,
      }}
    >
      {children}
    </DayzerosContext.Provider>
  );
}

export function useDayzeros() {
  const context = useContext(DayzerosContext);
  if (!context) {
    throw new Error('useDayzeros must be used within a DayzerosProvider');
  }
  return context;
}
