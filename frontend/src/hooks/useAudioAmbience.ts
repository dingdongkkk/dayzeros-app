'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundVolumes, SoundType } from '@/types';

/**
 * Procedural ambience for the meadow.
 *
 * Each layer is synthesized from a noise source shaped to its own character:
 *   rain     — white noise, band-shaped into hiss over a low rumble
 *   wind     — brown noise through a lowpass whose cutoff drifts, so it gusts
 *   crickets — scheduled chirp trills from short tone bursts, not tremolo
 *
 * Layers meet at a master bus with a limiter so nothing clips when all three
 * run at once.
 */

interface Layer {
  gain: GainNode;
  stop: () => void;
}

type Layers = Partial<Record<SoundType, Layer>>;

// Level of each layer at 100%, calibrated so all three together sit
// comfortably under full scale.
const PEAKS: Record<SoundType, number> = {
  rain: 0.5,
  crickets: 0.34,
  wind: 0.44,
};

const SOUND_TYPES: SoundType[] = ['rain', 'crickets', 'wind'];

/** Fill a buffer with white noise. */
function whiteNoise(ctx: BaseAudioContext, seconds = 4): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Fill a buffer with brown noise, normalized to roughly unity peak. */
function brownNoise(ctx: BaseAudioContext, seconds = 4): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  let max = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last;
    const a = Math.abs(last);
    if (a > max) max = a;
  }
  const norm = max > 0 ? 1 / max : 1;
  for (let i = 0; i < d.length; i++) d[i] *= norm;
  return buf;
}

function looper(ctx: BaseAudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/** A slow sine LFO driving `target`, offset so it never goes negative. */
function drift(
  ctx: BaseAudioContext,
  target: AudioParam,
  rateHz: number,
  depth: number,
  startAt: number
): OscillatorNode {
  const lfo = ctx.createOscillator();
  const amp = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = rateHz;
  amp.gain.value = depth;
  lfo.connect(amp);
  amp.connect(target);
  lfo.start(startAt);
  return lfo;
}

export function useAudioAmbience(volumes: SoundVolumes, setVolume: (s: SoundType, v: number) => void) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const layersRef = useRef<Layers>({});
  const cricketBusRef = useRef<GainNode | null>(null);
  const chirpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextChirpRef = useRef(0);
  const pendingChirpsRef = useRef<Set<OscillatorNode>>(new Set());
  const suspendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  /** Schedule one trill: a burst of short tone pulses, as a cricket makes. */
  const scheduleTrill = useCallback((ctx: AudioContext, at: number) => {
    const bus = cricketBusRef.current;
    if (!bus) return;

    const pulses = 3 + Math.floor(Math.random() * 3);
    const base = 4250 + Math.random() * 550;
    const spacing = 0.028 + Math.random() * 0.012;

    for (let i = 0; i < pulses; i++) {
      const t0 = at + i * spacing;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t0);
      osc.frequency.linearRampToValueAtTime(base * 0.97, t0 + 0.018);

      // Sharp attack, quick decay — the click-and-ring of a chirp.
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(1, t0 + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.019);

      osc.connect(env);
      env.connect(bus);
      osc.start(t0);
      osc.stop(t0 + 0.03);

      // Remember it so a stop can cut chirps already queued ahead of the clock.
      pendingChirpsRef.current.add(osc);
      osc.onended = () => pendingChirpsRef.current.delete(osc);
    }
  }, []);

  /** Keep roughly a second of chirps queued ahead of the clock. */
  const pumpChirps = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current || volumesRef.current.crickets <= 0) return;

    const horizon = ctx.currentTime + 1;
    if (nextChirpRef.current < ctx.currentTime) nextChirpRef.current = ctx.currentTime + 0.1;

    while (nextChirpRef.current < horizon) {
      scheduleTrill(ctx, nextChirpRef.current);
      nextChirpRef.current += 0.5 + Math.random() * 1.1;
    }
  }, [scheduleTrill]);

  const build = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (ctxRef.current) {
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
      return ctxRef.current;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      // Master bus: limiter then output, so stacked layers never clip.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.005;
      limiter.release.value = 0.2;

      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(limiter);
      limiter.connect(ctx.destination);
      masterRef.current = master;

      const white = whiteNoise(ctx);
      const brown = brownNoise(ctx);
      const t0 = ctx.currentTime;

      // ---- rain: hiss over rumble -------------------------------------
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0;
      rainGain.connect(master);

      const hissSrc = looper(ctx, white);
      const hissHi = ctx.createBiquadFilter();
      hissHi.type = 'highpass';
      hissHi.frequency.value = 700;
      const hissLo = ctx.createBiquadFilter();
      hissLo.type = 'lowpass';
      hissLo.frequency.value = 6500;
      const hissLevel = ctx.createGain();
      hissLevel.gain.value = 0.5;
      hissSrc.connect(hissHi);
      hissHi.connect(hissLo);
      hissLo.connect(hissLevel);
      hissLevel.connect(rainGain);

      const bodySrc = looper(ctx, white);
      const bodyLo = ctx.createBiquadFilter();
      bodyLo.type = 'lowpass';
      bodyLo.frequency.value = 500;
      const bodyLevel = ctx.createGain();
      bodyLevel.gain.value = 0.7;
      bodySrc.connect(bodyLo);
      bodyLo.connect(bodyLevel);
      bodyLevel.connect(rainGain);

      // Shower intensity breathes rather than sitting perfectly flat.
      const rainDrift = drift(ctx, hissLevel.gain, 0.07, 0.12, t0);
      hissSrc.start(t0);
      bodySrc.start(t0);

      layersRef.current.rain = {
        gain: rainGain,
        stop: () => {
          hissSrc.stop();
          bodySrc.stop();
          rainDrift.stop();
        },
      };

      // ---- wind: gusting lowpass on brown noise ------------------------
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      windGain.connect(master);

      const windSrc = looper(ctx, brown);
      const windLo = ctx.createBiquadFilter();
      windLo.type = 'lowpass';
      windLo.frequency.value = 420;
      windLo.Q.value = 3;
      const windBody = ctx.createGain();
      windBody.gain.value = 0.8;
      windSrc.connect(windLo);
      windLo.connect(windBody);
      windBody.connect(windGain);

      // Two incommensurate LFOs so gusts never fall into an obvious loop.
      const gustA = drift(ctx, windLo.frequency, 0.05, 220, t0);
      const gustB = drift(ctx, windLo.frequency, 0.13, 90, t0);
      const swell = drift(ctx, windBody.gain, 0.09, 0.35, t0);
      windSrc.start(t0);

      layersRef.current.wind = {
        gain: windGain,
        stop: () => {
          windSrc.stop();
          gustA.stop();
          gustB.stop();
          swell.stop();
        },
      };

      // ---- crickets: chirp bus fed by the scheduler --------------------
      const cricketGain = ctx.createGain();
      cricketGain.gain.value = 0;
      cricketGain.connect(master);

      const cricketTone = ctx.createBiquadFilter();
      cricketTone.type = 'bandpass';
      cricketTone.frequency.value = 4600;
      cricketTone.Q.value = 1.6;
      cricketTone.connect(cricketGain);
      cricketBusRef.current = cricketTone;

      layersRef.current.crickets = {
        gain: cricketGain,
        stop: () => {},
      };

      return ctx;
    } catch {
      return null;
    }
  }, []);

  const applyVol = useCallback(
    (name: SoundType, val: number, isPlaying: boolean = playingRef.current, immediate = false) => {
      const ctx = ctxRef.current;
      const layer = layersRef.current[name];
      if (!ctx || !layer) return;
      const target = isPlaying ? (val / 100) * PEAKS[name] : 0;
      const param = layer.gain.gain;
      try {
        if (immediate) {
          // Stopping should sound like stopping: a short ramp that only
          // exists to avoid a click, not an audible tail.
          param.cancelScheduledValues(ctx.currentTime);
          param.setValueAtTime(param.value, ctx.currentTime);
          param.linearRampToValueAtTime(target, ctx.currentTime + 0.08);
        } else {
          param.setTargetAtTime(target, ctx.currentTime, 0.25);
        }
      } catch {}
    },
    []
  );

  const applyAll = useCallback(
    (isPlaying: boolean, immediate = false) => {
      SOUND_TYPES.forEach((n) => applyVol(n, volumesRef.current[n], isPlaying, immediate));
    },
    [applyVol]
  );

  /** Silence everything now: cut queued chirps, ramp out, then idle the context. */
  const haltAudio = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    pendingChirpsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    pendingChirpsRef.current.clear();

    if (chirpTimerRef.current) {
      clearInterval(chirpTimerRef.current);
      chirpTimerRef.current = null;
    }

    applyAll(false, true);

    // Park the context once the ramp has finished, so nothing lingers.
    if (suspendTimerRef.current) clearTimeout(suspendTimerRef.current);
    suspendTimerRef.current = setTimeout(() => {
      if (!playingRef.current && ctxRef.current && ctxRef.current.state === 'running') {
        void ctxRef.current.suspend();
      }
    }, 140);
  }, [applyAll]);

  const togglePlay = useCallback(() => {
    const ctx = build();
    if (!ctx) return;
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);

    if (next) {
      if (suspendTimerRef.current) clearTimeout(suspendTimerRef.current);
      void ctx.resume();
      applyAll(true);
      nextChirpRef.current = ctx.currentTime + 0.2;
      pumpChirps();
    } else {
      haltAudio();
    }
  }, [build, applyAll, pumpChirps, haltAudio]);

  const handleVolumeChange = useCallback(
    (name: SoundType, val: number) => {
      // A slider only starts the ambience on the very first interaction.
      // Once the user has pressed stop, stop stays stopped until they press play.
      if (!ctxRef.current && val > 0) {
        const ctx = build();
        if (ctx) {
          playingRef.current = true;
          setPlaying(true);
          nextChirpRef.current = ctx.currentTime + 0.2;
        }
      }
      setVolume(name, val);
      applyVol(name, val, playingRef.current);
    },
    [build, setVolume, applyVol]
  );

  const playChime = useCallback(() => {
    const ctx = build();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // A soft two-note figure rather than a single beep.
      [587.33, 880].forEach((freq, i) => {
        const at = now + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
        osc.connect(gain);
        gain.connect(masterRef.current ?? ctx.destination);
        osc.start(at);
        osc.stop(at + 1.15);
      });
    } catch {}
  }, [build]);

  // Chirp scheduler: only runs while crickets are actually audible.
  useEffect(() => {
    if (!playing || volumes.crickets <= 0) return;
    pumpChirps();
    chirpTimerRef.current = setInterval(pumpChirps, 250);
    return () => {
      if (chirpTimerRef.current) clearInterval(chirpTimerRef.current);
      chirpTimerRef.current = null;
    };
  }, [playing, volumes.crickets, pumpChirps]);

  // Elapsed readout for the player row.
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(tick);
  }, [playing]);

  // Track volume changes made elsewhere (e.g. restored settings).
  useEffect(() => {
    if (playing) applyAll(true);
  }, [volumes, playing, applyAll]);

  // Release audio hardware when the workspace unmounts.
  useEffect(() => {
    return () => {
      if (chirpTimerRef.current) clearInterval(chirpTimerRef.current);
      if (suspendTimerRef.current) clearTimeout(suspendTimerRef.current);
      Object.values(layersRef.current).forEach((l) => {
        try {
          l?.stop();
        } catch {}
      });
      layersRef.current = {};
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx && ctx.state !== 'closed') void ctx.close();
    };
  }, []);

  return {
    playing,
    elapsed,
    togglePlay,
    handleVolumeChange,
    unlockAudio: build,
    playChime,
  };
}
