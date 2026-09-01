# Authentication Guide

Dayzeros uses **Better Auth** with the **Drizzle ORM** adapter for authentication.

---

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Next.js Web App
    participant Backend as Fastify API
    participant DB as NeonDB (PostgreSQL)

    User->>Frontend: Opens /app (or clicks Sign In / Register)
    Frontend->>Backend: getSession() (/api/auth/get-session)
    alt Session Not Found / Unauthenticated
        Backend-->>Frontend: 401 / null
        Frontend->>User: Displays AuthModal / Login Gate
        User->>Frontend: Submits Email & Password
        Frontend->>Backend: signIn.email() or signUp.email() (/api/auth/sign-in/email)
        Backend->>DB: Verify / Insert user record via Drizzle
        Backend-->>Frontend: Set-Cookie (Session Token)
        Frontend->>Frontend: State updated, redirect to /app
    else Session Active
        Backend-->>Frontend: 200 { user, session }
        Frontend->>Backend: GET /api/tasks & GET /api/stats
        Frontend->>User: Renders Focus Workspace
    end
```

---

## Better Auth Server Configuration (`backend/src/auth.ts`)

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, schema } from './db/index.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
});
```

---

## Better Auth Client Usage (`frontend/src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

### In React Components:
```tsx
const { data: session, isPending } = useSession();

// Sign in:
await signIn.email({ email, password });

// Sign up:
await signUp.email({ name, email, password });

// Sign out:
await signOut();
```

---

## Route Access
- No route is gated. The focus workspace (`/app`, `/focus`, `/planner`) renders for every visitor, signed in or not.
- Authentication is an optional upgrade: a session enables cloud sync of tasks and stats via the backend. Without one, `DayzerosContext` swallows API failures and the workspace runs standalone.
- Signed-out visitors can start sign-in from the `AppNavbar` profile menu ("Sign In to Sync") or the `LandingNavbar`.
