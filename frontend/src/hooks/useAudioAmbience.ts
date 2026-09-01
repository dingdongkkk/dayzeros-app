'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundVolumes, SoundType } from '@/types';

interface AudioNodes {
  rain?: { g: GainNode };
  crickets?: { g: GainNode };
  wind?: { g: GainNode };
}

export function useAudioAmbience(volumes: SoundVolumes, setVolume: (s: SoundType, v: number) => void) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNodes>({});
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const unlockAudio = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 3-second looped brown/pink noise buffer
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const dat = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < dat.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        dat[i] = last * 3.2;
      }

      const layer = (type: SoundType) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        g.gain.value = 0;

        if (type === 'rain') {
          f.type = 'highpass';
          f.frequency.value = 900;
        } else if (type === 'wind') {
          f.type = 'lowpass';
          f.frequency.value = 380;
        } else if (type === 'crickets') {
          f.type = 'bandpass';
          f.frequency.value = 4200;
          f.Q.value = 14;
          const lfo = ctx.createOscillator();
          const la = ctx.createGain();
          lfo.frequency.value = 11;
          la.gain.value = 0.55;
          lfo.connect(la);
          la.connect(g.gain);
          lfo.start();
        }

        src.connect(f);
        f.connect(g);
        g.connect(ctx.destination);
        src.start();
        return { g };
      };

      nodesRef.current = {
        rain: layer('rain'),
        crickets: layer('crickets'),
        wind: layer('wind'),
      };

      return ctx;
    } catch {
      return null;
    }
  }, []);

  const applyVol = useCallback((name: SoundType, val: number, isPlay: boolean = playingRef.current) => {
    const ctx = audioCtxRef.current;
    const node = nodesRef.current[name];
    if (!ctx || !node) return;

    const peaks: Record<SoundType, number> = {
      rain: 0.13,
      crickets: 0.05,
      wind: 0.16,
    };
    const targetGain = isPlay ? (val / 100) * peaks[name] : 0;
    try {
      node.g.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.25);
    } catch {}
  }, []);

  const togglePlay = useCallback(() => {
    const ctx = unlockAudio();
    if (!ctx) return;

    setPlaying((prev) => {
      const next = !prev;
      playingRef.current = next;
      (['rain', 'crickets', 'wind'] as SoundType[]).forEach((n) => {
        applyVol(n, volumesRef.current[n], next);
      });
      return next;
    });
  }, [unlockAudio, applyVol]);

  const handleVolumeChange = useCallback(
    (name: SoundType, val: number) => {
      if (!audioCtxRef.current && val > 0) {
        unlockAudio();
        if (!playingRef.current) {
          setPlaying(true);
          playingRef.current = true;
        }
      }
      setVolume(name, val);
      applyVol(name, val, playingRef.current);
    },
    [unlockAudio, setVolume, applyVol]
  );

  // Play chime for completed session
  const playChime = useCallback(() => {
    const ctx = unlockAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  }, [unlockAudio]);

  // Elapsed timer tick
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, [playing]);

  // Update gains if volumes change externally
  useEffect(() => {
    if (playing) {
      (['rain', 'crickets', 'wind'] as SoundType[]).forEach((n) => {
        applyVol(n, volumes[n], true);
      });
    }
  }, [volumes, playing, applyVol]);

  return {
    playing,
    elapsed,
    togglePlay,
    handleVolumeChange,
    unlockAudio,
    playChime,
  };
}
