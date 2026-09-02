'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Scene, TimerMode, Task, SoundVolumes, SoundType, DayRecords } from '@/types';
import { dayKey } from '@/hooks/useLocalStorage';
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
  days: DayRecords;
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
  const [days, setDays] = useState<DayRecords>({});
  const [scene, setSceneState] = useState<Scene>('dusk');
  const [volumes, setVolumes] = useState<SoundVolumes>({ rain: 78, crickets: 62, wind: 0 });

  const [highlightedCard, setHighlightedCard] = useState<'tasks' | 'sounds' | 'stats' | 'notes' | null>(null);
  const [focusInputSignal, setFocusInputSignal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const todayMinutes = useMemo(() => days[dayKey()]?.min ?? 0, [days]);

  const streak = useMemo(() => {
    const live = (k: string) => (days[k]?.min ?? 0) > 0;
    let n = 0;
    const d = new Date();
    if (!live(dayKey(d))) d.setDate(d.getDate() - 1);
    while (live(dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [days]);

  /** Record focus minutes against today, locally and (if signed in) in the cloud. */
  const addFocusMinutes = useCallback((mins: number) => {
    setDays((prev) => {
      const k = dayKey();
      const prior = prev[k];
      // Stamp when the block ran so the day can be drawn on a timeline.
      const session = { start: Date.now() - mins * 60_000, min: mins };
      const updated: DayRecords = {
        ...prev,
        [k]: {
          min: (prior?.min ?? 0) + mins,
          sessions: [...(prior?.sessions ?? []), session],
        },
      };
      try {
        localStorage.setItem('dayzeros:days', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isAuthenticated = !!sessionData?.user;
  const userName = sessionData?.user?.name || 'Focus Wanderer';
  const userEmail = sessionData?.user?.email || null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('dayzeros:tasks');
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedDays = localStorage.getItem('dayzeros:days');
      if (storedDays) {
        setDays(JSON.parse(storedDays));
      } else {
        // First run: seed a little history so the heatmap isn't a blank grid.
        const seeded: DayRecords = {};
        const d = new Date();
        for (let i = 0; i < 12; i++) {
          seeded[dayKey(d)] = { min: 192 };
          d.setDate(d.getDate() - 1);
        }
        setDays(seeded);
        localStorage.setItem('dayzeros:days', JSON.stringify(seeded));
      }

      const storedScene = localStorage.getItem('dayzeros:scene') as Scene | null;
      if (storedScene && SCENES.includes(storedScene)) setSceneState(storedScene);

      const vol = (k: SoundType, fallback: number) => {
        const v = localStorage.getItem('dayzeros:vol:' + k);
        return v !== null ? Number(v) : fallback;
      };
      setVolumes({ rain: vol('rain', 78), crickets: vol('crickets', 62), wind: vol('wind', 0) });
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('dayzeros:tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks, mounted]);

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
        const [cloudTasks, cloudStats, cloudHistory] = await Promise.all([
          api.getTasks().catch(() => null),
          api.getStats().catch(() => null),
          api.getHistory().catch(() => null),
        ]);

        if (!isSubscribed) return;

        if (cloudTasks && Array.isArray(cloudTasks)) {
          setTasks(cloudTasks.map((t: BackendTask) => ({ t: t.t, done: t.done })));
          setTaskIds(cloudTasks.map((t: BackendTask) => t.id));
        }

        if (cloudHistory?.days) {
          setDays(cloudHistory.days);
        } else if (cloudStats) {
          setDays((prev) => ({ ...prev, [dayKey()]: { min: cloudStats.todayMinutes } }));
        }

        if (cloudStats) {
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
    try {
      localStorage.setItem('dayzeros:vol:' + sound, String(val));
    } catch {}
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
    try {
      localStorage.setItem('dayzeros:scene', newScene);
    } catch {}
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
        addFocusMinutes(25);
        if (isAuthenticated) {
          api.bankSession(25).catch(() => {});
        }
        showToast('Session done — take five');
      } else {
        showToast('Break over — ready when you are');
      }
    },
    [playChime, showToast, isAuthenticated, addFocusMinutes]
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
      addFocusMinutes(mins);
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
        days,
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
