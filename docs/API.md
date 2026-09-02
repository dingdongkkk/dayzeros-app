# REST API Reference

The backend exposes a Fastify REST API running on `http://localhost:4000` (configurable via `PORT`).

---

## Authentication Endpoints (`/api/auth/*`)

Handled automatically by Better Auth.

- `POST /api/auth/sign-in/email`: Log in with email & password.
- `POST /api/auth/sign-up/email`: Create an account with name, email & password.
- `POST /api/auth/sign-out`: Invalidate active session and clear cookie.
- `GET /api/auth/get-session`: Retrieve current user profile and session token.

---

## Tasks API (`/api/tasks`)

All task endpoints require an authenticated session.

### 1. Get Tasks
- **Route**: `GET /api/tasks`
- **Response** `200 OK`:
  ```json
  [
    { "id": "uuid-1", "t": "Clear inbox to zero", "done": true },
    { "id": "uuid-2", "t": "Draft Q4 roadmap", "done": false }
  ]
  ```

### 2. Create Task
- **Route**: `POST /api/tasks`
- **Body**:
  ```json
  { "t": "Review design system specs" }
  ```
- **Response** `200 OK`:
  ```json
  { "id": "uuid-3", "t": "Review design system specs", "done": false }
  ```

### 3. Update Task
- **Route**: `PUT /api/tasks/:id`
- **Body**:
  ```json
  { "t": "Updated text", "done": true }
  ```
- **Response** `200 OK`: `{ "success": true }`

### 4. Delete Task
- **Route**: `DELETE /api/tasks/:id`
- **Response** `200 OK`: `{ "success": true }`

---

## Stats & Settings API (`/api/stats`)

All stats endpoints require an authenticated session.

### 1. Get Stats & Preferences
- **Route**: `GET /api/stats`
- **Response** `200 OK`:
  ```json
  {
    "todayMinutes": 192,
    "streak": 12,
    "scene": "dusk",
    "volumes": {
      "rain": 78,
      "crickets": 62,
      "wind": 0
    }
  }
  ```

### 2. Bank Focus Session
- **Route**: `POST /api/stats/session`
- **Body**:
  ```json
  { "minutes": 25 }
  ```
- **Response** `200 OK`: `{ "success": true }`

### 3. Get Focus History

`GET /api/stats/history?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns the full per-day focus log, used by the heatmap and calendar on `/stats`.
Both query parameters are optional; omitting them returns every logged day.

```json
{
  "days": {
    "2026-09-01": { "min": 192 },
    "2026-08-31": { "min": 150 }
  }
}
```

Because `date_key` is a zero-padded `YYYY-MM-DD` string, lexicographic comparison
matches chronological order, so range filtering needs no date parsing.

### 4. Update Settings
- **Route**: `PUT /api/stats/settings`
- **Body**:
  ```json
  {
    "scene": "night",
    "volRain": 85,
    "volCrickets": 50,
    "volWind": 10
  }
  ```
- **Response** `200 OK`: `{ "success": true }`
