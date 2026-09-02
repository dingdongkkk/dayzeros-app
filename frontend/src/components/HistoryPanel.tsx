'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DayRecords } from '@/types';
import { dayKey } from '@/hooks/useLocalStorage';
import { DayTimeline } from '@/components/DayTimeline';
import { ShareCard } from '@/components/ShareCard';

/**
 * Focus history: a year heatmap, a month calendar, and the totals that
 * fall out of them. Reads the same day log the workspace writes to, so it
 * works signed in (cloud) or signed out (localStorage).
 */

const WEEKDAYS = ['Mon', 'Wed', 'Fri'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Minutes → one of five steps, so a light day and a deep day look different. */
function level(min: number): 0 | 1 | 2 | 3 | 4 {
  if (min <= 0) return 0;
  if (min < 30) return 1;
  if (min < 75) return 2;
  if (min < 150) return 3;
  return 4;
}

// Empty is a faint wash; the rest climb toward the brand rust.
const STEP_BG = [
  'rgba(27,26,23,0.07)',
  'rgba(196,80,42,0.22)',
  'rgba(196,80,42,0.45)',
  'rgba(196,80,42,0.7)',
  'rgba(196,80,42,1)',
];

function fmtMinutes(min: number): string {
  if (min <= 0) return 'no focus';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function HistoryPanel({ days }: { days: DayRecords }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);

  const minutesOn = (key: string) => days[key]?.min ?? 0;

  // ---- totals -------------------------------------------------------
  const totals = useMemo(() => {
    const entries = Object.entries(days).filter(([, v]) => (v?.min ?? 0) > 0);
    const totalMin = entries.reduce((sum, [, v]) => sum + v.min, 0);
    const best = entries.reduce<{ key: string; min: number }>(
      (acc, [k, v]) => (v.min > acc.min ? { key: k, min: v.min } : acc),
      { key: '', min: 0 }
    );

    // Longest run of consecutive logged days, walking the sorted key list.
    const sorted = entries.map(([k]) => k).sort();
    let longest = 0;
    let run = 0;
    let prev: string | null = null;
    sorted.forEach((k) => {
      if (prev && dayKey(addDays(new Date(prev + 'T00:00:00'), 1)) === k) run += 1;
      else run = 1;
      if (run > longest) longest = run;
      prev = k;
    });

    let current = 0;
    const walker = new Date(today);
    if (minutesOn(dayKey(walker)) <= 0) walker.setDate(walker.getDate() - 1);
    while (minutesOn(dayKey(walker)) > 0) {
      current += 1;
      walker.setDate(walker.getDate() - 1);
    }

    return { totalMin, best, longest, current, activeDays: entries.length };
  }, [days, today]);

  // ---- heatmap: 53 weeks back from today, Monday-first columns -------
  const weeks = useMemo(() => {
    const end = new Date(today);
    // Walk back to the Monday on or before today, then back 52 more weeks.
    const endMonday = addDays(end, -((end.getDay() + 6) % 7));
    const start = addDays(endMonday, -52 * 7);

    const cols: { key: string; date: Date }[][] = [];
    for (let w = 0; w < 53; w++) {
      const col: { key: string; date: Date }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        col.push({ key: dayKey(date), date });
      }
      cols.push(col);
    }
    return cols;
  }, [today]);

  const monthLabels = useMemo(() => {
    const out: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((col, i) => {
      const m = col[0].date.getMonth();
      if (m !== lastMonth) {
        out.push({ col: i, label: MONTHS[m].slice(0, 3) });
        lastMonth = m;
      }
    });
    return out;
  }, [weeks]);

  // ---- month calendar ------------------------------------------------
  const calendar = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ key: string; day: number } | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: dayKey(new Date(year, month, d)), day: d });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthTotal = useMemo(
    () => calendar.reduce((sum, c) => sum + (c ? minutesOn(c.key) : 0), 0),
    [calendar, days]
  );

  const todayStr = dayKey(today);
  const canGoNext =
    cursor.getFullYear() < today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() < today.getMonth());

  const stat = (value: string, label: string, accent?: string) => (
    <div className="flex flex-col gap-1">
      <div className="font-serif text-[30px] leading-none" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="font-mono text-[10px] tracking-[2px] uppercase text-[var(--muted)]">{label}</div>
    </div>
  );

  return (
    <div className="relative z-10 mx-auto w-full max-w-[880px] px-5 pb-16 pt-[96px]">
      <div className="bg-[var(--cream)] text-[var(--ink)] rounded-[26px] p-7 max-[640px]:p-5 shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)]">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[11px] tracking-[3.2px] uppercase text-[var(--muted)]">
              Focus history
            </div>
            <h1 className="font-serif font-normal text-[34px] leading-tight m-0 mt-1">
              Every day you showed up.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {minutesOn(todayStr) > 0 && (
              <button
                type="button"
                onClick={() => setSharing(todayStr)}
                className="font-mono text-[11px] tracking-[1.5px] uppercase bg-[var(--rust)] text-[var(--cream)] border-none rounded-full py-2 px-4 cursor-pointer hover:brightness-110 transition-all"
              >
                Share today
              </button>
            )}
            <Link
              href="/app"
              className="font-mono text-[11px] tracking-[1.5px] uppercase text-[var(--muted)] hover:text-[var(--ink)] no-underline transition-colors"
            >
              ← Back to focus
            </Link>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-4 max-[640px]:grid-cols-2 gap-6 mt-7 pb-7 border-b border-[#e2dccf]">
          {stat(fmtMinutes(totals.totalMin), 'total focused', 'var(--rust)')}
          {stat(String(totals.current), 'day streak')}
          {stat(String(totals.longest), 'longest streak')}
          {stat(totals.best.min ? fmtMinutes(totals.best.min) : '—', 'best day')}
        </div>

        {/* Heatmap */}
        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] tracking-[3.2px] uppercase text-[var(--muted)] m-0">
              Last 12 months
            </h2>
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {totals.activeDays} active {totals.activeDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* month ruler */}
              <div className="relative h-4 ml-[30px]" style={{ width: 53 * 14 }}>
                {monthLabels.map(({ col, label }) => (
                  <span
                    key={`${label}-${col}`}
                    className="absolute font-mono text-[9px] tracking-[1px] uppercase text-[var(--muted)]"
                    style={{ left: col * 14 }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {/* weekday ruler */}
                <div className="flex flex-col gap-[3px] w-[27px] shrink-0">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-[11px] flex items-center">
                      {i % 2 === 1 && (
                        <span className="font-mono text-[9px] text-[var(--muted)] leading-none">
                          {WEEKDAYS[(i - 1) / 2]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {weeks.map((col, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {col.map(({ key, date }) => {
                      const future = key > todayStr;
                      const min = minutesOn(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={future}
                          onClick={() => {
                            setSelected(key);
                            setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
                          }}
                          title={`${date.toDateString()} — ${fmtMinutes(min)}`}
                          aria-label={`${date.toDateString()}, ${fmtMinutes(min)}`}
                          className={`w-[11px] h-[11px] rounded-[2px] border-none p-0 transition-transform ${
                            future ? 'opacity-0 cursor-default' : 'cursor-pointer hover:scale-125'
                          } ${selected === key ? 'ring-2 ring-[var(--ink)] ring-offset-1' : ''}`}
                          style={{ background: STEP_BG[level(min)] }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 justify-end font-mono text-[10px] text-[var(--muted)]">
            <span>less</span>
            {STEP_BG.map((bg, i) => (
              <span key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ background: bg }} />
            ))}
            <span>more</span>
          </div>
        </section>

        {/* Calendar */}
        <section className="mt-9 pt-7 border-t border-[#e2dccf]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-[22px] m-0">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--muted)] mr-2">
                {fmtMinutes(monthTotal)} this month
              </span>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                className="font-mono text-sm w-8 h-8 rounded-full border-none bg-[rgba(27,26,23,0.06)] hover:bg-[rgba(27,26,23,0.12)] cursor-pointer transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                disabled={!canGoNext}
                onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                className="font-mono text-sm w-8 h-8 rounded-full border-none bg-[rgba(27,26,23,0.06)] enabled:hover:bg-[rgba(27,26,23,0.12)] cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mt-4 max-w-[560px]">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div
                key={i}
                className="font-mono text-[10px] tracking-[1px] uppercase text-[var(--muted)] text-center pb-1"
              >
                {d}
              </div>
            ))}

            {calendar.map((cell, i) => {
              if (!cell) return <div key={`pad-${i}`} />;
              const min = minutesOn(cell.key);
              const lv = level(min);
              const isToday = cell.key === todayStr;
              const isFuture = cell.key > todayStr;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={isFuture}
                  onClick={() => setSelected(cell.key)}
                  aria-label={`${cell.day} ${MONTHS[cursor.getMonth()]}, ${fmtMinutes(min)}`}
                  className={`aspect-square max-h-[68px] rounded-xl border-none p-1 flex flex-col items-center justify-center gap-0.5 transition-transform ${
                    isFuture ? 'opacity-25 cursor-default' : 'cursor-pointer hover:scale-105'
                  } ${selected === cell.key ? 'ring-2 ring-[var(--ink)]' : ''} ${
                    isToday ? 'outline outline-1 outline-[var(--rust)]' : ''
                  }`}
                  style={{ background: STEP_BG[lv] }}
                >
                  <span
                    className={`font-mono text-[12px] leading-none ${
                      lv >= 3 ? 'text-[var(--cream)]' : 'text-[var(--ink)]'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {min > 0 && (
                    <span
                      className={`font-mono text-[9px] leading-none ${
                        lv >= 3 ? 'text-[rgba(247,245,241,0.85)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {Math.round(min / 60) >= 1 ? `${(min / 60).toFixed(1)}h` : `${min}m`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-[#e2dccf]">
            {selected ? (
              <>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-serif text-[20px] m-0">
                    {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  {minutesOn(selected) > 0 && (
                    <button
                      type="button"
                      onClick={() => setSharing(selected)}
                      className="font-mono text-[11px] tracking-[1.5px] uppercase bg-[var(--ink)] text-[var(--cream)] border-none rounded-full py-2 px-4 cursor-pointer hover:brightness-110 transition-all"
                    >
                      Share this day →
                    </button>
                  )}
                </div>
                <DayTimeline record={days[selected]} dateKey={selected} />
              </>
            ) : (
              <p className="italic font-serif text-[13px] text-[var(--muted)] m-0">
                Pick a day to see when you focused.
              </p>
            )}
          </div>
        </section>
      </div>

      {sharing && (
        <ShareCard
          dateKey={sharing}
          record={days[sharing]}
          streak={totals.current}
          onClose={() => setSharing(null)}
        />
      )}
    </div>
  );
}
