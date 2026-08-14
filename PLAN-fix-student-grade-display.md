# PLAN: Fix invalid grade display ("1/0 points", "Infinity%") on student submission page

## Root cause (verified against DB + code)

- DB data is VALID: all `grading_scores` rows have existing criteria with `maxPoints`
  10/15/10/5 etc. The rubric exists and is confirmed.
- Backend `submissions.service.findOne` already includes
  `scores: { include: { criteria: true } }` — the server sends the criterion with
  every score.
- BUT `getSubmission` (frontend `api.ts`) ignores that payload field and instead
  re-fetches the rubric via `getRubrics(assignmentId)`.
- `GET /rubrics` is `@Roles('TEACHER')` only → the student's call returns 403 →
  swallowed by the silent `catch {}` in `getSubmission` → `criterion` never attached.
- `SubmissionStatusPage` then renders `criterion?.maxPoints ?? 0` → "1/0 points" and
  `pointsAwarded / 0 * 100` = `Infinity%`.

## Changes (frontend-only)

### 1. `src/lib/api.ts`

- `CriterionFeedback`: add `criteria?: { id: string; description: string; maxPoints: number } | null`
  (the server-sent relation field).
- `getSubmission`: attach `criterion` from the server-provided `score.criteria`
  first; only fall back to the rubric fetch for scores still missing it.

### 2. `src/pages/student/SubmissionStatusPage.tsx`

- Per row: percent badge only when `maxPoints > 0`; when max is unknown (0), show
  "N pts" instead of "N/0 points" and omit the badge.
- Total: omit the "/0" suffix when the confirmed max sum is 0.

### 3. Verification

- `npx tsc -b` + `npm run lint` in `eduai-frontend`. Backend untouched.