'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode } from '@/types';

const LEN: Record<TimerMode, number> = {
  focus: 25,
  break: 5,
};

export const formatTimer = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
};

interface UsePomodoroProps {
  onSessionComplete: (minutes: number) => void;
  onTimerDone: (mode: TimerMode) => void;
  unlockAudio?: () => void;
}

export function usePomodoro({ onSessionComplete, onTimerDone, unlockAudio }: UsePomodoroProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [session, setSession] = useState(1);
  const [left, setLeft] = useState(25 * 60 * 1000 - 1000); // 24:59 initial
  const [running, setRunning] = useState(false);

  const endAtRef = useRef<number>(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;
  const onTimerDoneRef = useRef(onTimerDone);
  onTimerDoneRef.current = onTimerDone;

  const setTimerMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setLeft(LEN[newMode] * 60 * 1000);
    setRunning(false);
  }, []);

  const handleFinish = useCallback(() => {
    setRunning(false);
    const currentMode = modeRef.current;
    if (currentMode === 'focus') {
      onSessionCompleteRef.current(LEN.focus);
      setSession((s) => (s < 4 ? s + 1 : 1));
      setTimerMode('break');
      onTimerDoneRef.current('focus');
    } else {
      setTimerMode('focus');
      onTimerDoneRef.current('break');
    }
  }, [setTimerMode]);

  const toggleStartPause = useCallback(() => {
    setRunning((prev) => {
      if (prev) {
        // Pausing
        setLeft(Math.max(0, endAtRef.current - Date.now()));
        return false;
      } else {
        // Starting
        unlockAudio?.();
        endAtRef.current = Date.now() + left;
        return true;
      }
    });
  }, [left, unlockAudio]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setLeft(LEN[mode] * 60 * 1000);
  }, [mode]);

  const toggleBreak = useCallback(() => {
    setTimerMode(mode === 'focus' ? 'break' : 'focus');
  }, [mode, setTimerMode]);

  // Interval ticker
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const remaining = endAtRef.current - Date.now();
      if (remaining <= 0) {
        setLeft(0);
        clearInterval(interval);
        handleFinish();
      } else {
        setLeft(remaining);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [running, handleFinish]);

  return {
    mode,
    session,
    left,
    formattedTime: formatTimer(left),
    running,
    toggleStartPause,
    resetTimer,
    toggleBreak,
    setTimerMode,
  };
}
