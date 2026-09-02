'use client';

import { useMemo } from 'react';
import { DayRecord } from '@/types';

/**
 * A day drawn across 24 hours: when the focus blocks actually happened,
 * the way a time tracker shows them, plus the shape of the day in one line.
 */

const RUST = 'rgba(196,80,42,';

function clockLabel(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const ampm = h < 12 ? 'am' : 'pm';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}${ampm}`;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

export function DayTimeline({ record, dateKey }: { record: DayRecord | undefined; dateKey: string }) {
  const sessions = useMemo(
    () => [...(record?.sessions ?? [])].sort((a, b) => a.start - b.start),
    [record]
  );

  const blocks = useMemo(
    () =>
      sessions.map((s) => {
        const d = new Date(s.start);
        const startHour = d.getHours() + d.getMinutes() / 60;
        return {
          ...s,
          leftPct: (startHour / 24) * 100,
          widthPct: Math.max((s.min / 60 / 24) * 100, 0.7),
        };
      }),
    [sessions]
  );

  const summary = useMemo(() => {
    if (!sessions.length) return null;
    const first = sessions[0];
    const last = sessions[sessions.length - 1];
    // Hour of day carrying the most focus, as a "peak" readout.
    const byHour = new Array(24).fill(0);
    sessions.forEach((s) => {
      byHour[new Date(s.start).getHours()] += s.min;
    });
    const peakHour = byHour.indexOf(Math.max(...byHour));
    return {
      first: clockLabel(first.start),
      last: clockLabel(last.start + last.min * 60_000),
      count: sessions.length,
      peakHour,
    };
  }, [sessions]);

  const total = record?.min ?? 0;

  if (total <= 0) {
    return (
      <div className="mt-4 rounded-2xl bg-[rgba(27,26,23,0.04)] px-4 py-5 text-center">
        <p className="font-serif italic text-[13px] text-[var(--muted)] m-0">
          Nothing logged on this day.
        </p>
      </div>
    );
  }

  // Days recorded before session tracking existed have a total but no blocks.
  if (!sessions.length) {
    return (
      <div className="mt-4 rounded-2xl bg-[rgba(27,26,23,0.04)] px-4 py-4">
        <div className="font-mono text-[13px]">{fmt(total)} focused</div>
        <p className="font-serif italic text-[12px] text-[var(--muted)] m-0 mt-1">
          This day was logged before Dayzeros tracked session times, so there is no timeline for it.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="font-mono text-[11px] tracking-[3px] uppercase text-[var(--muted)]">
          When you focused
        </div>
        <div className="font-mono text-[11px] text-[var(--muted)]">
          {summary?.count} block{summary?.count === 1 ? '' : 's'} · {summary?.first} → {summary?.last}
        </div>
      </div>

      {/* 24-hour track */}
      <div className="relative mt-3 h-[54px] rounded-xl bg-[rgba(27,26,23,0.05)] overflow-hidden">
        {/* three-hour gridlines */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-[rgba(27,26,23,0.07)]"
            style={{ left: `${((i + 1) * 3 * 100) / 24}%` }}
          />
        ))}

        {blocks.map((b, i) => (
          <div
            key={`${b.start}-${i}`}
            title={`${clockLabel(b.start)} — ${fmt(b.min)}`}
            className="absolute top-[9px] bottom-[9px] rounded-[5px] transition-transform hover:scale-y-110"
            style={{
              left: `${b.leftPct}%`,
              width: `${b.widthPct}%`,
              background: `${RUST}0.92)`,
              boxShadow: `0 0 0 1px ${RUST}0.35)`,
            }}
          />
        ))}
      </div>

      {/* hour ruler */}
      <div className="relative h-4 mt-1">
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className="absolute font-mono text-[9px] text-[var(--muted)] -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 0 ? '12a' : h === 12 ? '12p' : h === 24 ? '12a' : h < 12 ? `${h}a` : `${h - 12}p`}
          </span>
        ))}
      </div>

      <div className="mt-3 font-mono text-[12px] text-[var(--muted)]">
        <span className="text-[var(--ink)]">{fmt(total)}</span> across the day
        {summary && (
          <>
            {' · '}peak around{' '}
            {summary.peakHour === 0
              ? '12am'
              : summary.peakHour < 12
                ? `${summary.peakHour}am`
                : summary.peakHour === 12
                  ? '12pm'
                  : `${summary.peakHour - 12}pm`}
          </>
        )}
      </div>
    </div>
  );
}
