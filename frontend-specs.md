# Frontend Specs (supplement to specs.md)

Read `specs.md` first — this file only covers what's local to this repo.

## Stack
React + Vite (SPA, no SSR) · TanStack Query · React Hook Form + Zod ·
react-router-dom · Tailwind + shadcn/ui · Recharts.

## The 8 pages (build in this order — matches specs.md §3 priority)

1. Login / Signup
2. Teacher Dashboard
3. Rubric Builder (manual form + PDF import)
4. Submissions Queue
5. Grading Review Screen
6. Student Performance & Alerts
7. Assistant Chat Panel (no persisted history — component state only)
8. Student Portal

## Design system

Neubrutalist: solid black borders (~2-3px) on every card/button/input, hard
non-blurred offset shadows (no soft box-shadow anywhere), flat saturated
icon-chip colors, rectangular status tags. Full token reference and
component patterns are in `.claude/skills/design-system/SKILL.md` — the
agent should load that automatically when writing any component; don't
restate the palette here, keep this file pointing at the skill instead of
duplicating it.

## Knowing what the backend API actually looks like

Never hand-guess an endpoint's request/response shape, and never ask the
backend team to describe it in prose. The backend publishes a live OpenAPI
document at `<backend-url>/api-json`. Generate real TypeScript types from
it:

```bash
npx openapi-typescript <backend-url>/api-json -o src/types/api-schema.ts
```

Run this whenever the backend's API surface has changed (a new endpoint, a
changed DTO) — it's a good habit to run at the start of any task that adds
or touches an API call, before writing the call, not after debugging a
mismatch. Add it as an npm script (`npm run sync:api-types`) so it's one
command, not something to remember the exact syntax for.

`<backend-url>` is `http://localhost:3000` for now — **there is no deployed
backend yet**, so this is the only option until the team sets up Render.
Whoever is doing frontend work in a given session needs the backend running
on their own machine at the same time (`docker compose up -d && npm run
start:dev` in the backend repo, left running in a second terminal) — not a
separate permanent role, just true for that session. Once a Render
deployment exists, swap in that URL and nothing else about this workflow
changes.

**One API client module** (`src/lib/api.ts`) should import types from the
generated `api-schema.ts` and expose typed functions per resource
(`getSubmissions()`, `confirmGrade(id, body)`, etc.) — components call
these, never raw `fetch()` with hand-typed response shapes.

## Conventions

- **Server state through TanStack Query only** — no `useEffect` +
  `fetch` + manual loading/error state. Every API call is a
  `useQuery`/`useMutation` hook.
- **Forms through React Hook Form + the same Zod schemas the backend uses**
  where the shape overlaps (e.g. the rubric form) — copy the schema, don't
  redefine field-by-field validation by hand.
- **Never call Supabase or any LLM API directly from the frontend.**
  Everything goes through the backend's REST API. If a component seems to
  need a Supabase client, that's a sign the backend is missing an endpoint —
  add the endpoint, don't reach around it.
- **Students never see an unconfirmed AI suggestion, anywhere in the UI** —
  this is a hard rule from specs.md §4; the Student Portal only ever
  fetches confirmed grades from the backend, so this should be enforced by
  the API response shape, not by frontend filtering of a bigger payload.

## Local dev

Backend must be running first (`docker compose up -d` + `npm run start:dev`
in the backend repo) — this repo's `.env` points `VITE_API_URL` at it.
`npm install && npm run dev`.
