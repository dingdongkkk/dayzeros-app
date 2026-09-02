'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DayRecord } from '@/types';

/**
 * The flex: a square image of one day's focus, drawn over the meadow, that
 * you can save or copy straight to the clipboard. Everything is rendered on
 * a canvas so what you share is exactly what you see here.
 */

const SIZE = 1080;
const CREAM = '#f7f5f1';
const RUST = '#c4502a';

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

function prettyDate(key: string): string {
  return new Date(key + 'T00:00:00')
    .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
}

interface Props {
  dateKey: string;
  record: DayRecord | undefined;
  streak: number;
  onClose: () => void;
}

export function ShareCard({ dateKey, record, streak, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const total = record?.min ?? 0;
  const sessions = record?.sessions ?? [];

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    // ---- background: the meadow, darkened so type reads over it
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        // cover-fit the landscape into a square
        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = '/assets/meadow.webp';
    });

    const veil = ctx.createLinearGradient(0, 0, 0, SIZE);
    veil.addColorStop(0, 'rgba(6,9,26,0.5)');
    veil.addColorStop(0.42, 'rgba(6,9,26,0.72)');
    veil.addColorStop(1, 'rgba(6,9,26,0.92)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Every glyph gets a soft dark halo, the same trick the web app uses to
    // keep white type legible over the bright clouds.
    ctx.shadowColor = 'rgba(4,8,24,0.9)';
    ctx.shadowBlur = 26;

    // ---- wordmark
    ctx.fillStyle = CREAM;
    ctx.font = '700 26px "Space Mono", ui-monospace, monospace';
    ctx.letterSpacing = '9px';
    ctx.fillText('DAYZEROS', 76, 104);
    ctx.beginPath();
    ctx.arc(76 + ctx.measureText('DAYZEROS').width + 26, 96, 7, 0, Math.PI * 2);
    ctx.fillStyle = RUST;
    ctx.fill();

    // ---- date
    ctx.fillStyle = 'rgba(247,245,241,0.88)';
    ctx.font = '400 22px "Space Mono", ui-monospace, monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText(prettyDate(dateKey), 76, 360);

    // ---- the number
    ctx.letterSpacing = '0px';
    ctx.fillStyle = CREAM;
    ctx.font = '400 210px "Playfair Display", Georgia, serif';
    ctx.fillText(fmt(total), 68, 530);

    ctx.fillStyle = 'rgba(247,245,241,0.8)';
    ctx.font = 'italic 400 40px "Playfair Display", Georgia, serif';
    ctx.fillText('of deep work.', 76, 596);

    // ---- timeline strip: when the blocks happened
    const stripY = 720;
    const stripH = 54;
    const stripX = 76;
    const stripW = SIZE - 152;

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(247,245,241,0.14)';
    ctx.beginPath();
    ctx.roundRect(stripX, stripY, stripW, stripH, 10);
    ctx.fill();

    sessions.forEach((s) => {
      const d = new Date(s.start);
      const startHour = d.getHours() + d.getMinutes() / 60;
      const x = stripX + (startHour / 24) * stripW;
      const w = Math.max((s.min / 60 / 24) * stripW, 5);
      ctx.fillStyle = RUST;
      ctx.beginPath();
      ctx.roundRect(x, stripY + 8, w, stripH - 16, 5);
      ctx.fill();
    });

    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(247,245,241,0.7)';
    ctx.font = '400 18px "Space Mono", ui-monospace, monospace';
    ['12a', '6a', '12p', '6p', '12a'].forEach((label, i) => {
      const x = stripX + (i / 4) * stripW;
      ctx.fillText(label, i === 4 ? x - 30 : x, stripY + stripH + 30);
    });

    // ---- footer stats
    const footY = 940;
    ctx.fillStyle = 'rgba(247,245,241,0.75)';
    ctx.font = '400 20px "Space Mono", ui-monospace, monospace';
    ctx.letterSpacing = '4px';
    ctx.fillText('SESSIONS', 76, footY - 34);
    ctx.fillText('STREAK', 340, footY - 34);
    ctx.fillText('PEAK', 604, footY - 34);

    ctx.letterSpacing = '0px';
    ctx.fillStyle = CREAM;
    ctx.font = '400 58px "Playfair Display", Georgia, serif';
    ctx.fillText(String(sessions.length || Math.round(total / 25)), 76, footY + 26);
    ctx.fillText(`${streak}d`, 340, footY + 26);

    let peak = '—';
    if (sessions.length) {
      const byHour = new Array(24).fill(0);
      sessions.forEach((s) => {
        byHour[new Date(s.start).getHours()] += s.min;
      });
      const h = byHour.indexOf(Math.max(...byHour));
      peak = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
    }
    ctx.fillText(peak, 604, footY + 26);

    ctx.shadowBlur = 0;
    setReady(true);
  }, [dateKey, total, sessions, streak]);

  useEffect(() => {
    // Wait for the webfonts so the canvas draws in Playfair, not a fallback.
    let cancelled = false;
    const run = async () => {
      try {
        await document.fonts.ready;
      } catch {}
      if (!cancelled) draw();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [draw]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dayzeros-${dateKey}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Saved');
    }, 'image/png');
  };

  const copy = () => {
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setStatus('Copied to clipboard');
      } catch {
        setStatus('Copy blocked — use Save instead');
      }
    }, 'image/png');
  };

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 2400);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(6,9,26,0.72)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--cream)] rounded-[26px] p-5 max-w-[min(92vw,460px)] w-full shadow-[0_30px_70px_-20px_rgba(6,9,26,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-mono text-[11px] tracking-[3px] uppercase text-[var(--muted)]">
            Share this day
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-[16px] leading-none text-[var(--muted)] hover:text-[var(--ink)] bg-transparent border-none cursor-pointer p-1"
          >
            ×
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-2xl block bg-[#12132a]"
          style={{ aspectRatio: '1 / 1' }}
        />

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={download}
            disabled={!ready}
            className="flex-1 font-mono text-[12px] tracking-[1px] uppercase bg-[var(--ink)] text-[var(--cream)] border-none rounded-full py-3 cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all"
          >
            Save image
          </button>
          <button
            type="button"
            onClick={copy}
            disabled={!ready}
            className="flex-1 font-mono text-[12px] tracking-[1px] uppercase bg-[rgba(27,26,23,0.07)] text-[var(--ink)] border-none rounded-full py-3 cursor-pointer disabled:opacity-40 hover:bg-[rgba(27,26,23,0.12)] transition-colors"
          >
            Copy
          </button>
        </div>

        <div className="h-5 mt-2 text-center font-mono text-[11px] text-[var(--muted)]">
          {status}
        </div>
      </div>
    </div>
  );
}
