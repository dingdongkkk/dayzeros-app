'use client';

import { useState, useEffect } from 'react';
import { Task, DayRecords, Scene, SoundVolumes } from '@/types';

export const dayKey = (d: Date = new Date()): string => {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

const DEFAULT_TASKS: Task[] = [
  { t: 'Clear inbox to zero', done: true },
  { t: 'Draft Q4 roadmap', done: false },
  { t: "Review Maya's PR", done: false },
  { t: 'Book dentist', done: false },
];

const getInitialDays = (): DayRecords => {
  const seeded: DayRecords = {};
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    seeded[dayKey(d)] = { min: 192 };
    d.setDate(d.getDate() - 1);
  }
  return seeded;
};

const DEFAULT_VOLUMES: SoundVolumes = {
  rain: 78,
  crickets: 62,
  wind: 0,
};

export function useDayzerosStorage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [days, setDays] = useState<DayRecords>(getInitialDays);
  const [scene, setSceneState] = useState<Scene>('dusk');
  const [volumes, setVolumes] = useState<SoundVolumes>(DEFAULT_VOLUMES);
  const [userName, setUserName] = useState<string>('Aditi');

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('dayzeros:tasks');
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedDays = localStorage.getItem('dayzeros:days');
      if (storedDays) {
        setDays(JSON.parse(storedDays));
      } else {
        const initial = getInitialDays();
        setDays(initial);
        localStorage.setItem('dayzeros:days', JSON.stringify(initial));
      }

      const storedScene = localStorage.getItem('dayzeros:scene') as Scene | null;
      if (storedScene && ['dusk', 'night', 'dawn'].includes(storedScene)) {
        setSceneState(storedScene);
      }

      const storedVolRain = localStorage.getItem('dayzeros:vol:rain');
      const storedVolCrickets = localStorage.getItem('dayzeros:vol:crickets');
      const storedVolWind = localStorage.getItem('dayzeros:vol:wind');
      setVolumes({
        rain: storedVolRain !== null ? +storedVolRain : DEFAULT_VOLUMES.rain,
        crickets: storedVolCrickets !== null ? +storedVolCrickets : DEFAULT_VOLUMES.crickets,
        wind: storedVolWind !== null ? +storedVolWind : DEFAULT_VOLUMES.wind,
      });

      const storedName = localStorage.getItem('dayzeros:name');
      if (storedName) setUserName(storedName);
    } catch {
      // Ignore localStorage errors
    }
    setMounted(true);
  }, []);

  const updateTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prev) => {
      const updated = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      try {
        localStorage.setItem('dayzeros:tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const addFocusMinutes = (mins: number) => {
    setDays((prev) => {
      const k = dayKey();
      const current = prev[k]?.min || 0;
      const updated = {
        ...prev,
        [k]: { min: current + mins },
      };
      try {
        localStorage.setItem('dayzeros:days', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setScene = (newScene: Scene) => {
    setSceneState(newScene);
    try {
      localStorage.setItem('dayzeros:scene', newScene);
    } catch {}
  };

  const setVolume = (sound: keyof SoundVolumes, value: number) => {
    setVolumes((prev) => {
      const updated = { ...prev, [sound]: value };
      try {
        localStorage.setItem('dayzeros:vol:' + sound, String(value));
      } catch {}
      return updated;
    });
  };

  const calculateStreak = (): number => {
    const live = (k: string) => days[k] && days[k].min > 0;
    let n = 0;
    const d = new Date();
    if (!live(dayKey(d))) {
      d.setDate(d.getDate() - 1);
    }
    while (live(dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  const getTodayMinutes = (): number => {
    return days[dayKey()]?.min || 0;
  };

  return {
    mounted,
    tasks,
    updateTasks,
    days,
    addFocusMinutes,
    scene,
    setScene,
    volumes,
    setVolume,
    userName,
    calculateStreak,
    getTodayMinutes,
  };
}
