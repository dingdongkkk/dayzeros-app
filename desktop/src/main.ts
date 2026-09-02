import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Dayzeros desktop overlay.
 *
 * Two surfaces sit on top of every other app:
 *   - a menu bar item showing the countdown, which is the primary surface
 *   - an optional meadow orb whose light level tracks the session
 *
 * The timer lives here in the main process so both surfaces, and any future
 * window, read the same authoritative clock.
 */

const FOCUS_MIN = 25;
const BREAK_MIN = 5;
const ORB_SIZE = 132;

type Mode = 'focus' | 'break';

interface TimerState {
  mode: Mode;
  remainingMs: number;
  totalMs: number;
  running: boolean;
  session: number;
  /** 0 at the start of a session, 1 at the end — drives the orb's light. */
  progress: number;
}

let tray: Tray | null = null;
let orbWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
let ticker: NodeJS.Timeout | null = null;

const state: TimerState = {
  mode: 'focus',
  remainingMs: FOCUS_MIN * 60_000,
  totalMs: FOCUS_MIN * 60_000,
  running: false,
  session: 1,
  progress: 0,
};

/** Wall-clock deadline, so the countdown survives sleep and throttling. */
let endAt = 0;

function meadowPath(): string {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'meadow.webp'),
    path.join(__dirname, '..', '..', 'frontend', 'public', 'assets', 'meadow.webp'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? '';
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function broadcast() {
  state.progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  const payload = { ...state, label: formatTime(state.remainingMs) };
  [orbWindow, panelWindow].forEach((w) => {
    if (w && !w.isDestroyed()) w.webContents.send('timer:state', payload);
  });
  if (tray) {
    // Only occupy the menu bar with digits while a session is actually running.
    tray.setTitle(state.running ? ` ${formatTime(state.remainingMs)}` : '');
    tray.setToolTip(`Dayzeros — ${state.mode} ${formatTime(state.remainingMs)}`);
  }
}

function setMode(mode: Mode) {
  state.mode = mode;
  state.totalMs = (mode === 'focus' ? FOCUS_MIN : BREAK_MIN) * 60_000;
  state.remainingMs = state.totalMs;
  state.running = false;
  stopTicker();
  broadcast();
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function completeSession() {
  stopTicker();
  state.running = false;
  if (state.mode === 'focus') {
    state.session = state.session < 4 ? state.session + 1 : 1;
    setMode('break');
  } else {
    setMode('focus');
  }
}

function start() {
  if (state.running) return;
  state.running = true;
  endAt = Date.now() + state.remainingMs;
  stopTicker();
  ticker = setInterval(() => {
    state.remainingMs = endAt - Date.now();
    if (state.remainingMs <= 0) {
      state.remainingMs = 0;
      completeSession();
    }
    broadcast();
  }, 250);
  broadcast();
}

function pause() {
  if (!state.running) return;
  state.running = false;
  state.remainingMs = Math.max(0, endAt - Date.now());
  stopTicker();
  broadcast();
}

function toggle() {
  state.running ? pause() : start();
}

function reset() {
  state.running = false;
  stopTicker();
  state.remainingMs = state.totalMs;
  broadcast();
}

// ---------------------------------------------------------------- windows

function createOrb() {
  if (orbWindow && !orbWindow.isDestroyed()) return;

  const { workArea } = screen.getPrimaryDisplay();
  orbWindow = new BrowserWindow({
    width: ORB_SIZE,
    height: ORB_SIZE,
    x: workArea.x + workArea.width - ORB_SIZE - 32,
    y: workArea.y + workArea.height - ORB_SIZE - 32,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  // Float above normal windows, including other apps in full screen.
  orbWindow.setAlwaysOnTop(true, 'screen-saver');
  orbWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const url = `file://${path.join(__dirname, '..', 'renderer', 'orb.html')}?img=${encodeURIComponent(meadowPath())}`;
  orbWindow.loadURL(url);
  orbWindow.on('closed', () => {
    orbWindow = null;
  });
}

function createPanel() {
  if (panelWindow && !panelWindow.isDestroyed()) return;

  panelWindow = new BrowserWindow({
    width: 300,
    height: 340,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: false,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  panelWindow.setAlwaysOnTop(true, 'screen-saver');
  panelWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  panelWindow.loadURL(`file://${path.join(__dirname, '..', 'renderer', 'panel.html')}`);

  // Dismiss like a popover.
  panelWindow.on('blur', () => panelWindow?.hide());
  panelWindow.on('closed', () => {
    panelWindow = null;
  });
}

/** Show the panel anchored to whatever opened it. */
function showPanelNear(anchor: { x: number; y: number }) {
  createPanel();
  if (!panelWindow) return;

  const { workArea } = screen.getDisplayNearestPoint(anchor);
  const [w, h] = panelWindow.getSize();
  const x = Math.min(Math.max(anchor.x - w / 2, workArea.x + 8), workArea.x + workArea.width - w - 8);
  const y = Math.min(Math.max(anchor.y, workArea.y + 8), workArea.y + workArea.height - h - 8);

  panelWindow.setPosition(Math.round(x), Math.round(y), false);
  panelWindow.show();
  panelWindow.focus();
  broadcast();
}

function togglePanelFromTray() {
  if (panelWindow && !panelWindow.isDestroyed() && panelWindow.isVisible()) {
    panelWindow.hide();
    return;
  }
  const bounds = tray?.getBounds();
  const point = bounds
    ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + 6 }
    : screen.getCursorScreenPoint();
  showPanelNear(point);
}

function createTray() {
  // An empty image keeps the slot; the countdown itself is the tray title.
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle(' ●');

  const menu = Menu.buildFromTemplate([
    { label: 'Start / Pause', click: () => toggle() },
    { label: 'Reset', click: () => reset() },
    { type: 'separator' },
    { label: 'Focus (25m)', click: () => setMode('focus') },
    { label: 'Break (5m)', click: () => setMode('break') },
    { type: 'separator' },
    {
      label: 'Show meadow orb',
      click: () => {
        createOrb();
        orbWindow?.show();
      },
    },
    { label: 'Hide meadow orb', click: () => orbWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit Dayzeros', click: () => app.quit() },
  ]);

  tray.on('click', () => togglePanelFromTray());
  tray.on('right-click', () => tray?.popUpContextMenu(menu));
}

// ---------------------------------------------------------------- ipc

ipcMain.handle('timer:get', () => ({ ...state, label: formatTime(state.remainingMs) }));
ipcMain.on('timer:toggle', () => toggle());
ipcMain.on('timer:reset', () => reset());
ipcMain.on('timer:mode', (_e, mode: Mode) => setMode(mode));
ipcMain.on('orb:clicked', () => {
  if (!orbWindow) return;
  const b = orbWindow.getBounds();
  showPanelNear({ x: b.x + b.width / 2, y: b.y + b.height + 8 });
});
ipcMain.on('panel:close', () => panelWindow?.hide());

// ---------------------------------------------------------------- lifecycle

app.whenReady().then(() => {
  // Menu bar app: no Dock icon, no window in the app switcher.
  if (process.platform === 'darwin') app.dock?.hide();
  createTray();
  createOrb();
  broadcast();
});

// Keep running with no windows open — the tray is the app, so this
// deliberately does not call app.quit().
app.on('window-all-closed', () => {});
