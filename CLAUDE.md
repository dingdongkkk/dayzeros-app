# Claude Code Guidelines

> **IMPORTANT**: Before performing any task or modifying code in this repository, you **MUST read and strictly adhere to [AGENTS.md](AGENTS.md)**.

---

## Core Rules from `AGENTS.md`

1. **Strict Scope & Minimal Modifications**:
   - Only execute what is explicitly requested.
   - Touch only the crucial files directly related to the prompt.
   - If the user asks for *frontend tweaks*, **do not touch the backend**.
   - If the user asks for *backend adjustments*, **do not touch the frontend**.

2. **No Unilateral Architectural Decisions**:
   - Always ask the user for approval before changing architecture, libraries, database drivers, or key business logic.

3. **Conventional Commits Standard**:
   - All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
     `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`

4. **Changelog Tracking**:
   - Record all functional modifications, bug fixes, or refactors in `CHANGELOG.md` under `[Unreleased]`.

5. **Documentation Synchronization**:
   - Update `README.md` and relevant docs in `docs/` (`docs/API.md`, `docs/DATABASE.md`, `docs/AUTHENTICATION.md`, `docs/FRONTEND.md`, `docs/ARCHITECTURE.md`) when features are added or changed.

---

## Quick Reference Commands

```bash
# Start development servers
bun run dev             # Frontend & Backend concurrently
bun run dev:frontend    # Next.js frontend (http://localhost:3000)
bun run dev:backend     # Fastify backend (http://localhost:4000)

# Build
bun run build           # Build all workspaces
bun run build:frontend  # Build Next.js frontend
bun run build:backend   # Build Fastify backend

# Database (NeonDB & Drizzle ORM)
bun run db:push         # Push Drizzle schema to NeonDB
bun run db:generate     # Generate migration files
```

---

## Technical Stack Summary

- **Frontend** (`frontend/`): Next.js 15 (App Router, React 19), Tailwind CSS v4, WebAudio API sound synthesizer, Better Auth React client.
- **Backend** (`backend/`): Fastify (TypeScript), Better Auth with Drizzle ORM adapter, `postgres.js` driver, NeonDB PostgreSQL.
