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

/** One completed focus block, kept so the day can be drawn on a timeline. */
export interface FocusSession {
  /** Epoch ms at which the block started. */
  start: number;
  /** Length of the block in minutes. */
  min: number;
}

export interface DayRecord {
  min: number;
  /** Absent on days logged before session tracking existed. */
  sessions?: FocusSession[];
}

export interface DayRecords {
  [dateKey: string]: DayRecord;
}
