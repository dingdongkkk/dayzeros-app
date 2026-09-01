# Dayzeros (Monorepo)

A calm focus app and cloud platform living on a single pixel-art meadow.
Built as a modern full-stack monorepo featuring **Next.js 15 (App Router)** on the frontend and **Fastify + Better Auth + Drizzle ORM + postgres.js + NeonDB** on the backend.

![Dayzeros](frontend/public/assets/meadow.webp)

---

## Documentation

- **[System Architecture](docs/ARCHITECTURE.md)**: Monorepo layout, data flow, and components.
- **[Authentication Guide](docs/AUTHENTICATION.md)**: Better Auth configuration, session handling, and route protection.
- **[Database & Schema](docs/DATABASE.md)**: NeonDB setup, Drizzle ORM models, and migration scripts.
- **[REST API Reference](docs/API.md)**: Complete specification for Fastify endpoints (`/api/tasks`, `/api/stats`, `/api/auth`).
- **[Frontend Guide](docs/FRONTEND.md)**: Next.js 15, Tailwind CSS v4, WebAudio ambience synthesizer, and Pomodoro engine.
- **[Agent Guidelines](AGENTS.md)**: Operating rules, scope boundaries, and Conventional Commits standard for AI assistants.
- **[Changelog](CHANGELOG.md)**: Version history and release notes.

---

## Monorepo Structure

```
dayzeros-monorepo/
├── backend/                   # Fastify API Server
│   ├── src/
│   │   ├── auth.ts            # Better Auth server configuration with Drizzle adapter
│   │   ├── db/
│   │   │   ├── index.ts       # postgres.js connection pool for NeonDB
│   │   │   └── schema.ts      # Drizzle schema (users, sessions, tasks, focus_logs, settings)
│   │   ├── routes/
│   │   │   ├── tasks.ts       # Authenticated task CRUD endpoints
│   │   │   └── stats.ts       # Authenticated focus session banking & streak endpoints
│   │   └── index.ts           # Fastify bootstrap with CORS & Better Auth handler
│   └── drizzle.config.ts      # Drizzle Kit migration config
│
└── frontend/                  # Next.js 15 Web Application
    ├── src/
    │   ├── app/               # Landing (/), App (/app), Login (/login), Signup (/signup)
    │   ├── components/        # AuthModal, SpaceView, FocusView, TasksCard, SoundsCard
    │   ├── context/           # DayzerosContext with cloud sync
    │   └── lib/
    │       ├── auth-client.ts # Better Auth React client
    │       └── api.ts         # Fastify API client
    └── public/assets/         # Meadow pixel-art artwork
```

---

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your **NeonDB** database connection string:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="a_secure_random_32_character_secret_key_here"
BETTER_AUTH_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 2. Push Schema to NeonDB

Push the Drizzle ORM schema to your NeonDB database:

```bash
bun run db:push
```

### 3. Run Development Servers

Run both backend (`http://localhost:4000`) and frontend (`http://localhost:3000`):

```bash
bun run dev:backend
bun run dev:frontend
```

Or run everything concurrently:

```bash
bun run dev
```

### 4. Production Build

To build both workspaces:

```bash
bun run build
```
