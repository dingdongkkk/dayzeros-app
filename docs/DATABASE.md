# Database Architecture & Schema

Dayzeros connects to **NeonDB Serverless PostgreSQL** using the `postgres` driver (postgres.js) and manages schemas with **Drizzle ORM**.

---

## Connection Setup (`backend/src/db/index.ts`)

```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? 'require' : undefined,
});

export const db = drizzle(queryClient, { schema });
```

---

## Database Tables

### 1. Better Auth Tables

| Table | Columns | Purpose |
|---|---|---|
| `user` | `id` (PK), `name`, `email` (Unique), `emailVerified`, `image`, `createdAt`, `updatedAt` | Stores user profiles |
| `session` | `id` (PK), `expiresAt`, `token` (Unique), `userId` (FK), `ipAddress`, `userAgent`, `createdAt`, `updatedAt` | Active login sessions |
| `account` | `id` (PK), `accountId`, `providerId`, `userId` (FK), `password`, `accessToken`, `refreshToken`, `createdAt`, `updatedAt` | Auth provider credentials |
| `verification` | `id` (PK), `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt` | Email verification & password reset tokens |

### 2. Dayzeros Domain Tables

#### `tasks`
Stores user Pomodoro task items.
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `focus_logs`
Logs completed focus minutes for streak and daily focus calculations.
```sql
CREATE TABLE focus_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date_key VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
  minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `user_settings`
Stores user UI preferences and sound mixer levels.
```sql
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  active_scene VARCHAR(20) NOT NULL DEFAULT 'dusk',
  vol_rain INTEGER NOT NULL DEFAULT 78,
  vol_crickets INTEGER NOT NULL DEFAULT 62,
  vol_wind INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Schema Migrations

To push schema changes directly to NeonDB:

```bash
bun run db:push --cwd backend
```

To generate migration files:

```bash
bun run db:generate --cwd backend
```
