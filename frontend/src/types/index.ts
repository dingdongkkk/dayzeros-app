export interface Task {
  t: string;
  done: boolean;
}

export type Scene = 'dusk' | 'night' | 'dawn';

export type TimerMode = 'focus' | 'break';

export type SoundType = 'rain' | 'crickets' | 'wind';

export interface SoundVolumes {
  rain: number;
  crickets: number;
  wind: number;
}

export interface DayRecord {
  min: number;
}

export interface DayRecords {
  [dateKey: string]: DayRecord;
}
