'use client';

import { useDayzeros } from '@/context/DayzerosContext';
import { HistoryPanel } from '@/components/HistoryPanel';

export default function StatsPage() {
  const { days } = useDayzeros();
  return <HistoryPanel days={days} />;
}
