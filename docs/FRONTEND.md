# Frontend Architecture & Guides

The frontend is a **Next.js 15 App Router** application built with React 19, TypeScript, and **Tailwind CSS v4**.

---

## Key Features

1. **Pixel-Art Aesthetic & Ambient Meadow**:
   - High-resolution dithered pixel-art meadow kept at crisp 1:1 pixel rendering (`image-rendering: pixelated`).
   - Dynamic soft-light color grading layers driven by active scene (`dusk`, `night`, `dawn`).
   - Scrim text shadows ensuring legibility on backdrop art.

2. **WebAudio Ambient Sound Generator (`useAudioAmbience.ts`)**:
   - Generates procedural pink/brown noise buffers live in the browser.
   - **Rain**: Highpass biquad filter (900Hz).
   - **Wind**: Lowpass biquad filter (380Hz).
   - **Crickets**: Bandpass biquad filter (4200Hz, Q 14) modulated by an 11Hz Low-Frequency Oscillator (LFO) gain node.
   - Volume sliders control gains smoothly using `AudioParam.setTargetAtTime`.

3. **Pomodoro Timer Engine (`usePomodoro.ts`)**:
   - 25-minute focus / 5-minute break Pomodoro cycles.
   - Automatic session transitions (1 through 4) with completion chimes.
   - Banks completed focus minutes directly into the database.

4. **Typography System**:
   - `Playfair Display`: Display serif for countdowns (with `oldstyle-nums`) and headers.
   - `Space Mono`: Labels, timestamps, tags, and task items.
   - `Space Grotesk`: UI navigation and interactive elements.

---

## App Routes

| Route | Accessibility | Purpose |
|---|---|---|
| `/` | Public | Visitor landing page showcasing the calm meadow, live clock, and sign-up CTAs |
| `/app` | Public | Focus workspace with Pomodoro clock, tasks, sounds, and stats. Signing in is optional and adds cloud sync |
| `/focus`, `/planner` | Public | Workspace aliases |
| `/login` | Public | Dedicated sign-in page |
| `/signup` | Public | Dedicated account creation page |

---

## State Management (`DayzerosContext.tsx`)

The `DayzerosProvider` wraps the application in `layout.tsx`:
- Synchronizes tasks with the Fastify backend via `api.getTasks()`, `api.createTask()`, `api.updateTask()`, and `api.deleteTask()`.
- Synchronizes focus statistics and user preferences with `api.getStats()`.
- Ensures ambient sound synthesis and timer state continue playing without interruption as users navigate between pages.
