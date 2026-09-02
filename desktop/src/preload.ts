import { contextBridge, ipcRenderer } from 'electron';

export interface TimerPayload {
  mode: 'focus' | 'break';
  remainingMs: number;
  totalMs: number;
  running: boolean;
  session: number;
  progress: number;
  label: string;
}

contextBridge.exposeInMainWorld('dayzeros', {
  get: (): Promise<TimerPayload> => ipcRenderer.invoke('timer:get'),
  onState: (cb: (s: TimerPayload) => void) => {
    ipcRenderer.on('timer:state', (_e, s: TimerPayload) => cb(s));
  },
  toggle: () => ipcRenderer.send('timer:toggle'),
  reset: () => ipcRenderer.send('timer:reset'),
  setMode: (mode: 'focus' | 'break') => ipcRenderer.send('timer:mode', mode),
  orbClicked: () => ipcRenderer.send('orb:clicked'),
  closePanel: () => ipcRenderer.send('panel:close'),
});
