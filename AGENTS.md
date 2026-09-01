# Agent & AI Assistant Guidelines

All AI coding assistants (including Antigravity, Gemini, Cursor, Copilot, etc.) working on this repository must strictly adhere to the following rules:

---

## 1. Strict Scope & Minimal Modifications
- **Do Only What Is Asked**: Strictly execute what the prompter requests. Do not introduce unsolicited refactors, add unrequested features, or alter untouched logic.
- **Touch Only Crucial Files**: Only modify files that are directly required to fulfill the user's prompt. 
  - If the user asks for *frontend tweaks*, **do not touch the backend** or unrelated configuration files.
  - If the user asks for *backend adjustments*, **do not modify frontend components** unless explicitly required for integration.

---

## 2. No Unilateral Architectural or Business Logic Decisions
- **Ask Before Architectural Changes**: Never make major architectural decisions (e.g. changing database drivers, swapping auth providers, adding heavy libraries, altering monorepo structure) on your own.
- **Clarify Ambiguous Requirements**: Always propose the plan and ask the user for approval before altering key business logic or data structures.

---

## 3. Conventional Commits Standard
All git commits made by agents or tools must strictly adhere to the [Conventional Commits specification](https://www.conventionalcommits.org/):

Format: `<type>(<optional scope>): <description>`

Allowed types:
- `feat`: A new feature for the user or system
- `fix`: A bug fix
- `docs`: Documentation updates only
- `style`: Code style / formatting changes (white-space, formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks, dependencies, workspace scripts

*Examples:*
- `feat(auth): integrate Better Auth with NeonDB and Drizzle ORM`
- `fix(timer): resolve session counter progression on break completion`
- `docs: add API and database architecture documentation`

---

## 4. Changelog Tracking
- Whenever any functional change, bug fix, or refactor is made to the codebase, **record the change in `CHANGELOG.md`** under the appropriate release or `[Unreleased]` section following the [Keep a Changelog](https://keepachangelog.com/) format.

---

## 5. Documentation Synchronization
- Whenever a new feature is added, modified, or an architectural adjustment is made:
  1. Update `README.md`.
  2. Update the relevant sub-document(s) in `docs/` (`docs/API.md`, `docs/DATABASE.md`, `docs/AUTHENTICATION.md`, `docs/FRONTEND.md`, `docs/ARCHITECTURE.md`).
  3. Ensure all environment variable changes are reflected in `.env.example`.
