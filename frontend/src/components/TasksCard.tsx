'use client';

import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types';

interface TasksCardProps {
  tasks: Task[];
  onAddTask?: (text: string) => Promise<void> | void;
  onToggleTask?: (index: number) => Promise<void> | void;
  onDeleteTask?: (index: number) => Promise<void> | void;
  onUpdateTasks?: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  isHighlighted?: boolean;
  focusInputSignal?: number;
}

export function TasksCard({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTasks,
  isHighlighted = false,
  focusInputSignal = 0,
}: TasksCardProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusInputSignal > 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusInputSignal]);

  const handleToggle = (index: number) => {
    if (onToggleTask) {
      onToggleTask(index);
    } else if (onUpdateTasks) {
      onUpdateTasks((prev) =>
        prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
      );
    }
  };

  const handleDelete = (index: number) => {
    if (onDeleteTask) {
      onDeleteTask(index);
    } else if (onUpdateTasks) {
      onUpdateTasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (onAddTask) {
      onAddTask(trimmed);
    } else if (onUpdateTasks) {
      onUpdateTasks((prev) => [...prev, { t: trimmed, done: false }]);
    }
    setInputValue('');
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const totalCount = Math.max(tasks.length, 5);
  const firstOpenIndex = tasks.findIndex((t) => !t.done);

  return (
    <div
      ref={cardRef}
      id="tasksCard"
      className={`card-focus absolute bottom-[44px] left-[44px] w-[min(29vw,340px)] max-[1080px]:static max-[1080px]:w-auto max-[1080px]:mt-[22px] bg-[var(--cream)] text-[var(--ink)] rounded-[26px] p-[20px_22px] shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] z-20 transition-transform duration-300 ${
        isHighlighted ? 'scale-[1.035]' : 'scale-100'
      }`}
    >
      <div className="flex justify-between items-center font-mono text-[11px] tracking-[3.2px] uppercase text-[var(--muted)] mb-[14px]">
        <span>Tasks</span>
        <span>
          {completedCount}/{totalCount}
        </span>
      </div>

      <ul className="list-none m-0 p-0 flex flex-col gap-[2px]">
        {tasks.map((task, idx) => {
          const isActive = idx === firstOpenIndex;
          return (
            <li
              key={`${task.t}-${idx}`}
              className={`flex items-center gap-3 p-[9px_11px] rounded-[14px] font-mono text-[14px] group transition-colors ${
                task.done
                  ? 'text-[#a9a294]'
                  : isActive
                  ? 'bg-[var(--cream-2)] text-[var(--ink)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                aria-label={`${task.done ? 'Mark undone: ' : 'Mark done: '}${task.t}`}
                className={`w-[19px] h-[19px] shrink-0 rounded-full cursor-pointer border-[1.6px] grid place-items-center p-0 text-[11px] text-[var(--cream)] leading-none transition-colors ${
                  task.done
                    ? 'bg-[var(--ink)] border-[var(--ink)]'
                    : 'border-[#c3bcae] bg-transparent hover:border-[var(--ink)]'
                }`}
              >
                {task.done ? '✓' : ''}
              </button>

              <span
                className={`flex-1 text-left break-words ${
                  task.done ? 'line-through' : ''
                }`}
              >
                {task.t}
              </span>

              {isActive && (
                <span className="font-serif italic text-[13px] text-[var(--muted)]">
                  now
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                aria-label={`Delete: ${task.t}`}
                className="bg-transparent border-none cursor-pointer text-[#bdb6a8] hover:text-[var(--rust)] text-[16px] px-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleAdd} className="mt-3">
        <input
          ref={inputRef}
          id="addTask"
          type="text"
          maxLength={90}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="+ add a task"
          aria-label="Add a task"
          className="w-full font-mono text-[13px] text-[var(--ink)] placeholder-[#b3ac9e] bg-transparent border-[1.4px] border-dashed border-[#cdc6b8] focus:border-[var(--muted)] focus:border-solid rounded-full py-[11px] px-4 outline-none transition-all"
        />
      </form>
    </div>
  );
}
