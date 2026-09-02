'use client';

import { useEffect, useRef } from 'react';
import { DayRecords } from '@/types';
import { dayKey } from '@/hooks/useLocalStorage';

/**
 * One firefly per focus session completed in the last week, drifting over the
 * meadow. The scene fills with light the more you have worked and empties as
 * a streak lapses — a streak meter that is part of the artwork.
 */

const MAX_FLIES = 28;
const FRAME_MS = 66; // ~15fps is plenty for slow drift, and cheap on battery

interface Fly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  size: number;
}

/** Sessions banked over the trailing 7 days, one firefly each. */
function recentSessions(days: DayRecords): number {
  let mins = 0;
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    mins += days[dayKey(d)]?.min ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return Math.min(MAX_FLIES, Math.floor(mins / 25));
}

export function Fireflies({ days }: { days: DayRecords }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fliesRef = useRef<Fly[]>([]);
  const rafRef = useRef<number | null>(null);

  const target = recentSessions(days);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed the swarm. Fireflies favour the lower meadow, not the sky.
    const spawn = (): Fly => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight * (0.42 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
      speed: 0.55 + Math.random() * 0.75,
      size: 1.4 + Math.random() * 1.5,
    });

    fliesRef.current = Array.from({ length: target }, spawn);

    let last = 0;
    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < FRAME_MS) return;
      last = t;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const f of fliesRef.current) {
        if (!reduced) {
          f.x += f.vx;
          f.y += f.vy;
          // Gentle wander so paths never look like straight lines.
          f.vx += (Math.random() - 0.5) * 0.03;
          f.vy += (Math.random() - 0.5) * 0.02;
          f.vx = Math.max(-0.4, Math.min(0.4, f.vx));
          f.vy = Math.max(-0.25, Math.min(0.25, f.vy));
          f.phase += 0.028 * f.speed;

          if (f.x < -20) f.x = w + 20;
          if (f.x > w + 20) f.x = -20;
          if (f.y < h * 0.36) f.vy = Math.abs(f.vy);
          if (f.y > h - 10) f.vy = -Math.abs(f.vy);
        }

        // Slow breathing glow; never fully off, so they read as a swarm.
        const glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f.phase));
        const r = f.size;

        const halo = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 7);
        halo.addColorStop(0, `rgba(255, 226, 150, ${0.5 * glow})`);
        halo.addColorStop(1, 'rgba(255, 214, 130, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r * 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 245, 214, ${0.85 * glow})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [target]);

  if (target === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  );
}
