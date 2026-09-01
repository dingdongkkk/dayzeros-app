'use client';

import { SoundVolumes, SoundType } from '@/types';

interface SoundsCardProps {
  volumes: SoundVolumes;
  onVolumeChange: (sound: SoundType, value: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  elapsedSeconds: number;
  isHighlighted?: boolean;
}

export function SoundsCard({
  volumes,
  onVolumeChange,
  playing,
  onTogglePlay,
  elapsedSeconds,
  isHighlighted = false,
}: SoundsCardProps) {
  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const soundList: { key: SoundType; label: string }[] = [
    { key: 'rain', label: 'rain' },
    { key: 'crickets', label: 'crickets' },
    { key: 'wind', label: 'wind' },
  ];

  return (
    <div
      id="soundsCard"
      className={`card-focus absolute bottom-[44px] right-[44px] w-[min(29vw,340px)] max-[1080px]:static max-[1080px]:w-auto max-[1080px]:mt-[22px] bg-[var(--cream)] text-[var(--ink)] rounded-[26px] p-[20px_22px] shadow-[0_18px_40px_-18px_rgba(8,10,26,0.6)] z-20 transition-transform duration-300 ${
        isHighlighted ? 'scale-[1.035]' : 'scale-100'
      }`}
    >
      <div className="flex justify-between items-center font-mono text-[11px] tracking-[3.2px] uppercase text-[var(--muted)] mb-[14px]">
        <span>Sounds</span>
      </div>

      <div className="flex flex-col gap-[11px]">
        {soundList.map(({ key, label }) => {
          const val = volumes[key];
          const isOff = val === 0;
          return (
            <div
              key={key}
              className={`flex items-center gap-[14px] ${isOff ? 'snd-off' : ''}`}
            >
              <label
                htmlFor={`s-${key}`}
                className={`font-mono text-[13.5px] w-[74px] shrink-0 transition-colors ${
                  isOff ? 'text-[#b3ac9e]' : 'text-[var(--ink)]'
                }`}
              >
                {label}
              </label>
              <input
                id={`s-${key}`}
                type="range"
                min="0"
                max="100"
                value={val}
                style={{ ['--fill' as string]: `${val}%` }}
                onChange={(e) => onVolumeChange(key, +e.target.value)}
                className="flex-1 sound-slider outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Lofi Radio Player Bar */}
      <div className="flex items-center gap-[13px] border-t border-[#e2dccf] mt-4 pt-[15px]">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? 'Pause ambience' : 'Play ambience'}
          className="w-[38px] h-[38px] rounded-full shrink-0 cursor-pointer bg-[var(--ink)] hover:opacity-90 text-[var(--cream)] border-none grid place-items-center text-[12px] transition-opacity"
        >
          {playing ? '❙❙' : '▶'}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis text-[var(--ink)]">
            lofi for rainy dusk
          </div>
          <div className="font-serif italic text-[12.5px] text-[var(--muted)]">
            dayzeros radio
          </div>
        </div>

        <div className="font-mono text-[12px] text-[var(--muted)]">
          {formatElapsed(elapsedSeconds)}
        </div>
      </div>
    </div>
  );
}
