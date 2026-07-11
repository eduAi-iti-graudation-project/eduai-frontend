# AGENTS.md
> Canonical, cross-tool instruction file (read natively by OpenCode, Codex,
> Cursor, Copilot, etc). Claude Code reads this too, via the `@AGENTS.md`
> import in this repo's `CLAUDE.md`. Edit this file, not CLAUDE.md, for any
> rule that should apply regardless of which tool a teammate is using.


## Read first, every session
1. `specs.md` — product, architecture, data model, non-negotiable rules
2. `frontend-specs.md` — this repo's pages, structure and conventions
3. `.claude/skills/design-system/SKILL.md` — loads automatically for UI work

## Project
EduAI frontend. React + Vite SPA (desktop web app, not mobile) + TanStack
Query + Tailwind + shadcn/ui. Talks to the backend REST API only — never to
Supabase or any LLM API directly.

## Commands
- `npm install && npm run dev` — dev server (backend must already be running)
- `npm run lint` / `npm run test` / `npm run build` — same checks CI runs

## Branching
Feature branches → PR into `dev` (1 review + CI required) → `dev` → `main`
at stable checkpoints. Never push directly to `dev` or `main`.

## Hard rules (see specs.md §4 for why)
- Students never see an unconfirmed AI grade suggestion, anywhere
- Server state goes through TanStack Query, not manual fetch/useEffect
- Neubrutalist design system applies to every screen — no exceptions that
  make one page look more "Material Design" than the rest
- Never hand-guess an API shape — run `npm run sync:api-types` and import
  from `src/types/api-schema.ts` (see frontend-specs.md)

## Working from a GitHub issue
Issue numbers are NOT part of this repo's files — they live on GitHub, not
in git history. When asked to "implement issue #N," run
`gh issue view N` (or `gh issue view N --repo <owner>/<repo>` if not run
from inside the repo) first to pull the actual title/body/labels before
writing any code. Don't proceed on the issue number alone.

## Testing is not optional, ever
Every GitHub issue for a task states, explicitly, what tests it requires —
or an explicit reason testing doesn't apply (e.g. "N/A -- pure UI/layout, no
new logic"). Most frontend tasks are legitimately UI-only and will say N/A;
but any real logic — a validation function, a state-machine-like hook, a
calculation — needs an actual test, not a skipped one. If a task's issue has
no tests section at all, that's a bug in the issue — stop and add one before
writing code.

## Before finishing any task
Run lint + test + build locally, every time, no exceptions. Confirm the
tests listed on the task's issue actually exist and pass.
