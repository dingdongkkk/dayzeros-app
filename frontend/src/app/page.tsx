'use client';

import { useDayzeros } from '@/context/DayzerosContext';
import { SpaceView } from '@/components/SpaceView';

export default function LandingPage() {
  const {
    scene,
    streak,
    todayMinutes,
    formattedTime,
    session,
    tasks,
    cycleScene,
  } = useDayzeros();

  return (
    <SpaceView
      scene={scene}
      streak={streak}
      todayMinutes={todayMinutes}
      formattedTime={formattedTime}
      session={session}
      tasks={tasks}
      onCycleScene={cycleScene}
    />
  );
}
