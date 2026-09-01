'use client';

import { useEffect } from 'react';

interface KeyboardShortcutProps {
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onCycleScene: () => void;
  onToggleView: () => void;
  onCommandPalette: () => void;
}

export function useKeyboardShortcuts({
  onToggleTimer,
  onResetTimer,
  onCycleScene,
  onToggleView,
  onCommandPalette,
}: KeyboardShortcutProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs, textareas, or elements with contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        onToggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onResetTimer();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onCycleScene();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onToggleView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTimer, onResetTimer, onCycleScene, onToggleView, onCommandPalette]);
}
