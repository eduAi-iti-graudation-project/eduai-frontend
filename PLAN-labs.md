# Plan: Finish Lab Simulations (frontend) — remaining work

## Status summary (what's already done)

- **Frontend complete & green:** `matter-js` dep, 5 lab API functions in `src/lib/api.ts`, sandbox runner (`LabSimulationFrame.tsx` + `lab-harness.ts`), `use-labs.ts` hooks (polling while GENERATING), teacher `LabsPage` `/labs` (generate dialog, offering filter, status chips, flags), teacher `LabDetailPage` `/labs/:id` (sandbox preview, publish confirm, reject-with-notes), student `StudentLabsPage` `/student/labs` + `StudentLabDetailPage` `/student/labs/:id` (objective-complete toast/badge), router + Sidebar + StudentLayout wiring. **tsc, eslint, 96/96 vitest tests pass.**
- **Backend fixed (pre-existing bug):** `src/join-requests/join-requests.module.ts` was missing `NotificationsModule` import → Nest wouldn't boot. Added it; server now starts with `/labs` routes mapped.
- **API E2E verified:** material upload (English 101 · 10A, offering `...021`) → `generate` → `grounded:true`, AI-approved, zero flags → `publish` → student account sees PUBLISHED lab (3304-char Matter.js code). One gateway flake (empty `output_text`) on first attempt; retry succeeded.

## The one real gap

Published lab's code **never calls `reportLabObjectiveComplete()`** — the student would never get the "Objective complete" badge. Root cause: generator prompt mandates the hook, but the **reviewer only checks security, not contract compliance** (`REVIEWER_SYSTEM_PROMPT` in `lab-reviewer.agent.ts:12`). User approved hardening it.

## Remaining steps

### 1. Backend: harden reviewer prompt (~5 lines)
- File: `eduai-backend/src/labs/agents/lab-reviewer.agent.ts`
- Add to `REVIEWER_SYSTEM_PROMPT` hunt-list: flag `missing_objective_hook` when the code has no `reportLabObjectiveComplete()` call wired to real physics state (collision/angle/threshold — not a bare timer), and no render target `document.getElementById('sim')`.
- Add rule: missing hook ⇒ `approved` MUST be `false`.
- Update `lab-agents.spec.ts` with matching assertions (don't touch `GENERATOR_SYSTEM_PROMPT` — existing spec pins it).
- Run `npm run test src/labs` + boot check.

### 2. Regenerate end-to-end & clean demo data
- Re-run `POST /labs/generate` (teacher@eduai.test, topic "Projectile motion on an inclined plane", offering `...021`); retry once on gateway flake.
- Verify via API: `reviewApproved:true` AND code contains `reportLabObjectiveComplete`.
- Publish it; delete the stale `AI_REVIEW_FAILED` row for a clean demo list.

### 3. Sandbox proof (throwaway, uncommitted)
- Script in `/tmp/opencode` using `puppeteer-core` + `/usr/bin/chromium`:
  - Load real `buildLabHarnessHtml` output in an iframe with `sandbox="allow-scripts"`.
  - Assert the generated Matter.js code runs with zero page errors.
  - Call `reportLabObjectiveComplete()` inside the iframe → assert parent receives `eduai-lab` / `objective-complete` postMessage (the exact badge path).

### 4. Final gates
- Frontend `npm run build` (verifies `?raw` Matter.js inline works in prod), full vitest suite, backend labs specs.
- Leave backend running; boot Vite dev server; sanity-check `/labs` pages load.

## Demo checklist (tomorrow)
- Accounts: `teacher@eduai.test` / `student@eduai.test` / `password123`
- Teacher: sidebar **Lab Simulations** → **New lab** → pick "English 101 — Essay Writing · 10A" section → topic "Projectile motion on an inclined plane" → wait ~12–120s → play sim (restart/fullscreen) → **Publish to students**
- Student: sidebar **Lab Simulations** → open the lab → interact → **"Objective complete!"** badge + toast
- Known quirk: gateway sometimes returns empty output on first try — just retry Generate; reviewer can also be demoed by rejecting a lab with notes