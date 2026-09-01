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

### Removed
- Deprecated legacy `index.html`, `build.py`, and root asset placeholders.
- Unreachable `AuthModal` instance in `SpaceView` (sign-in remains available from `LandingNavbar` and the `AppNavbar` profile menu).
