'use client';

import { Scene } from '@/types';
import Image from 'next/image';

interface BackgroundSceneProps {
  scene: Scene;
  currentView: 'landing' | 'focus';
}

export function BackgroundScene({ scene, currentView }: BackgroundSceneProps) {
  const getGradeStyle = () => {
    switch (scene) {
      case 'dusk':
        return 'rgba(255, 168, 110, 0.14)';
      case 'night':
        return 'rgba(28, 42, 120, 0.55)';
      case 'dawn':
        return 'rgba(255, 214, 170, 0.3)';
    }
  };

  const getImageFilterClass = () => {
    switch (scene) {
      case 'night':
        return 'brightness-[0.62] saturate-[0.82]';
      case 'dawn':
        return 'brightness-[1.06] saturate-[0.95]';
      default:
        return 'brightness-100 saturate-100';
    }
  };

  return (
    <>
      {/* Background artwork */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[var(--night)] pointer-events-none">
        <Image
          src="/assets/meadow.webp"
          alt="Pixel-art meadow at dusk: a still lake below pink cumulus clouds, a mountain, rolling green hills and a large tree."
          fill
          priority
          sizes="100vw"
          className={`object-cover pixelated scene-img transition-all duration-[1100ms] ease-out ${getImageFilterClass()}`}
        />
        {/* Soft-light color grade overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-[1100ms] ease-out mix-blend-soft-light"
          style={{ backgroundColor: getGradeStyle() }}
        />
      </div>

      {/* Atmospheric vignette overlays */}
      <div
        className="fixed inset-0 z-1 pointer-events-none transition-all duration-500 ease-out"
        style={{
          background:
            currentView === 'focus'
              ? 'radial-gradient(ellipse 46% 40% at 50% 40%, rgba(6,9,26,0.5), rgba(6,9,26,0) 72%), radial-gradient(ellipse 92% 82% at 50% 45%, rgba(6,8,22,0) 38%, rgba(6,8,22,0.58) 100%)'
              : 'linear-gradient(100deg, rgba(6,9,26,0.5) 0%, rgba(6,9,26,0) 42%), linear-gradient(0deg, rgba(6,9,26,0.5) 0%, rgba(6,9,26,0) 34%), radial-gradient(ellipse 92% 82% at 50% 45%, rgba(6,8,22,0) 38%, rgba(6,8,22,0.58) 100%)',
        }}
      />
    </>
  );
}
