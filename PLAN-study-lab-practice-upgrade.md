# PLAN: Upgrade Study Lab practice questions (PracticeView)

## Context

Today, generating `STUDY_MATERIAL` / `PRACTICE_QUESTIONS` renders `PracticeView`
(`src/components/study-lab/PracticeView.tsx`) — a working single-question MCQ flow
with instant reveal + explanation. It has no shuffle, no results screen, no retry,
and the score is not persisted.

Payload: `PracticeSet { title, questions: [{ question, options[], answerIndex,
explanation }] }` (4–10 questions, 3–6 options each; backend `schemas.ts:102-105`).

## Phase 1 — Frontend UX (no backend changes)

### 1. Shuffle per session
- On mount, Fisher–Yates shuffle the **question order** and each question's
  **options** (remap `answerIndex` to the new option position).
- Practice again = fresh shuffle (helps memorization).

### 2. Results screen instead of auto-restart
- After the last question is revealed, show a results panel: final score,
  accuracy %, a per-question review list (your answer vs. correct answer +
  explanation), and actions:
  - "Retry wrong answers" → loop only the missed questions (shuffled)
  - "Restart set" → full set again (shuffled)
- The current "Restart" button auto-loop goes away.

### 3. Progress + state polish
- Progress bar ("Question 3 of 8") and score chip in the header.
- Track answered-correctly set so retry mode reuses the same scoring.
- Keep instant reveal + explanation behavior unchanged.

### Files
- `src/components/study-lab/PracticeView.tsx` — main rework.
- No api.ts changes (payload already contains everything needed).

## Phase 2 — Backend persistence (OPTIONAL, needs approval)

- New Prisma model `PracticeAttempt` (id, studentId, generationId, totalQuestions,
  correctCount, completedAt) + migration; backfill none.
- `POST /study-lab/generations/:id/attempts` (student-only) + `GET` history;
  wire into `study-lab.module.ts` / `study-lab.service.ts`.
- Frontend: report score at results screen; optionally show "Last attempt: X/Y"
  on the practice view and a practice-accuracy stat on the student dashboard.

## Verification
- Phase 1: `npx tsc -b` + `npx eslint src/components/study-lab/PracticeView.tsx`.
- Phase 2: backend typecheck + jest (affected specs) + frontend tsc/lint.