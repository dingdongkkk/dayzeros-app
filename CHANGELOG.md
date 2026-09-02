# Changelog

All notable changes to the Dayzeros project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### Added
- **Monorepo Architecture**: Split codebase into `frontend/` (Next.js 15) and `backend/` (Fastify).
- **Backend API**: Fastify REST server listening on port 4000 with CORS support.
- **Drizzle ORM & postgres.js**: Configured with NeonDB PostgreSQL for cloud data persistence.
- **Better Auth Integration**: Email and password authentication with Drizzle ORM adapter.
- **Optional Authentication**: Signing in adds cloud sync; it is not required to use the workspace.
- **Auth UI**: Glassmorphic `AuthModal` matching Dayzeros meadow aesthetic and dedicated `/login` and `/signup` routes.
- **Task & Stats Cloud Sync**: Real-time synchronization of tasks, streak counts, daily focus minutes, sound volume preferences, and meadow scenes.
- **Documentation Suite**: Added `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/AUTHENTICATION.md`, `docs/FRONTEND.md`, `AGENTS.md`, and `CLAUDE.md`.

### Changed
- **Open Focus Workspace**: Removed the mandatory authentication gate from `/app`, `/focus`, and `/planner`. The workspace now renders for every visitor, and signing in is an optional upgrade that enables cloud sync.
- `AppNavbar` profile menu reports sync state honestly, showing "Saved on this device only" with a "Sign In to Sync" action for signed-out visitors instead of an unconditional "NeonDB Cloud Synced" badge.
- Landing dock CTA links straight into the workspace ("Start Focusing") rather than prompting for account creation.
- Converted single-file static HTML application into Next.js 15 App Router application with Tailwind CSS v4.
- Separated public landing page (`/`) from authenticated focus workspace (`/app`).
- Updated workspace build and dev scripts to support Bun and npm concurrently.

### Added
- **Desktop Overlay (`desktop/` workspace)**: An Electron menu bar app that floats the timer above every other application, including full-screen ones. The countdown lives in the main process and is broadcast over IPC, so the tray title, the meadow orb, and the popover panel share one authoritative clock. Includes a 132px transparent meadow orb whose brightness tracks session progress from dusk to night.
- **Focus History (`/stats`)**: A 12-month contribution-style heatmap and a month calendar backed by the per-day focus log, with lifetime total, current streak, longest streak, and best day.
- **`GET /api/stats/history`**: Returns the full per-day focus log, with optional `from`/`to` range filtering, for the heatmap and calendar.
- **Fireflies**: One firefly per session banked in the trailing week drifts over the landing page, so the meadow fills with light as the streak grows and empties as it lapses.
- **Local Persistence**: `DayzerosContext` now hydrates tasks, the day log, scene, and volumes from `localStorage` and writes them back, so signed-out work survives a refresh. Today's minutes and the streak are derived from the day log instead of being tracked separately.

- **Session Timestamps**: Each completed focus block is now recorded with the time it ran, not just added to a daily total, so a day can be drawn on a timeline.
- **Day Timeline (`DayTimeline.tsx`)**: Selecting a day on the calendar shows when the focus blocks actually happened across a 24-hour track, with block count, first and last block, total, and peak hour — the view a time tracker gives.
- **Share Card (`ShareCard.tsx`)**: A 1080×1080 image of a day's focus rendered on canvas over the meadow — total, session count, streak, peak hour, and the day's timeline strip — which can be saved as a PNG or copied straight to the clipboard. Reachable from any selected day and from a "Share today" action in the history header.

### Fixed
- **Inaudible Ambience**: All three sound layers were filtered from a single brown-noise buffer, so rain (highpass 900Hz) and crickets (bandpass 4200Hz) discarded nearly all their source energy and rendered at roughly -42 dBFS and -49 dBFS. Rain and wind are now synthesized from sources appropriate to their spectrum, raising rain by about 20 dB to a usable level.
- **Crickets Sounded Like a Drone**: An 11Hz LFO wrote ±0.55 directly onto the cricket gain, swamping and inverting a signal whose target was around 0.03. Replaced with a scheduler that emits discrete chirp trills.
- **Stop Button Did Not Stop**: Pausing ambience faded over a 0.25s time constant and left up to a second of cricket chirps already queued, so audio remained audible for roughly a second after the click. Stopping now ramps out over 80ms, cancels pending chirps, and suspends the audio context, reaching silence within ~200ms.
- **Stats Page Could Not Scroll**: `html, body` are `overflow: hidden` above 1080px, so the history page's content was clipped rather than scrollable. `/stats` now renders inside a full-height scroll container, and `AppNavbar` is fixed so it stays put instead of scrolling away with the content.
- **Sliders Overrode An Explicit Stop**: Moving a volume slider after pressing stop restarted playback. Sliders now only start ambience on the first interaction.

### Removed
- Deprecated legacy `index.html`, `build.py`, and root asset placeholders.
- Unreachable `AuthModal` instance in `SpaceView` (sign-in remains available from `LandingNavbar` and the `AppNavbar` profile menu).
