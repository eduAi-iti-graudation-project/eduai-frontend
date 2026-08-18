# EduAI — Complete Application Explanation

> This document explains **everything** about the EduAI platform as it exists in
> the `eduai-frontend` repository: what the app is, its business logic module by
> module, the **agents** it uses, and the **RAG** (retrieval-augmented
> generation) design. It was produced by reading the full frontend codebase,
> its specs (`specs.md`, `frontend-specs.md`, `docs/*`, `PLAN-*.md`) and the
> backend API contract the frontend is built against (`src/lib/api.ts` +
> generated `src/types/api-schema.ts`).

---

## 1. What EduAI is (product summary)

EduAI is a **school management + AI-assisted learning platform** for the web.
Its original core (per `specs.md`) was: a teacher grades student work faster
using an **AI grading pipeline that suggests scores with citations to the
exact rubric criterion**, the teacher always reviews and confirms, and a
**deterministic rule engine + AI explanation** flags struggling students early.

In its current form the app is far bigger than the MVP. It is a multi-school
SaaS with four roles and many AI features:

| Role | What they do in the app |
|---|---|
| **Teacher** | Build rubrics, trigger AI grading, review/confirm grades, run classes, quizzes, AI labs, meetings, assistant chat, homework-help monitoring, alerts, attendance |
| **Student** | Submit assignments, view confirmed grades only, take quizzes (anti-cheat), homework help, study lab (AI study materials), lab simulations, meetings, insights |
| **Guardian (Parent)** | Dashboard per child, alerts, AI-written parent messages, reports, insights, chat |
| **Admin** | Whole-school console: roster CSV import, join approvals, teachers/students/documents/fees/salaries, grades→sections→courses structure, timetable, billing (Stripe), school groups, broadcasts, migration wizard |

### Architecture (important)

- **This repo is a pure React + Vite SPA** (`src/`). It contains **no server,
  no database, no LLM calls**.
- All business logic + AI + RAG live in the **`eduai-backend`** (NestJS +
  Prisma + Supabase Auth + PostgreSQL/pgvector + OpenAI). The frontend only
  talks to it over a typed REST API (`src/lib/api.ts`).
- Real-time channels: **SSE streams** (agent progress during generation) and
  **Socket.IO** (chat + meeting transcript).
- Auth is **Supabase Auth**; JWTs are stored in `localStorage` and attached by
  an axios interceptor. Files are stored in Supabase Storage.

---

## 2. Tech stack (frontend)

| Layer | Tech |
|---|---|
| UI | React 19, TypeScript, Vite 8, Tailwind v4 (+ neubrutalist design tokens, shaded border/shadow system), shadcn/ui (Radix), Lucide icons |
| Data | TanStack Query v5 (server state — **every** API call), axios, zod validation, react-hook-form |
| Charts | Recharts, sparklines |
| Realtime | Socket.IO client (chat, meetings), SSE via `fetch` + `ReadableStream` parsing (agent steps) |
| 3D landing | Three.js, react-three-fiber, drei, postprocessing, GSAP, Lenis, Matter.js (lab sandbox) |
| Other | react-router v7, sonner toasts, react-markdown + remark-gfm, livekit-client (video meetings) |

Bootstrap order (`src/main.tsx`):
`QueryClientProvider → AuthProvider → BillingProvider → OperationsProvider → TooltipProvider → App`.

- `AuthProvider` — reads the stored token, loads `GET /auth/me` into the query
  cache, exposes `signup/login/logout`, listens for the
  `eduai:session-expired` custom event (fired by the axios interceptor on any
  401) and wipes all cached state.
- `BillingProvider` — listens for `eduai:subscription-required` events
  (dispatched by the axios interceptor when the backend returns 402
  `SUBSCRIPTION_REQUIRED` or 403 "requires the X plan or higher") and opens a
  global `UpgradeDialog`.
- `OperationsProvider` — global registry of in-flight agent operations
  (id, kind, step, lastToolStep, status). SSE steppers (`streamHomeworkHelp`,
  `streamGenerateQuiz`, `streamGenerateLab`, …) register/update here so agent
  progress visualizations survive navigation.
- Global chrome: `GlobalActivityIndicator` (top progress bar while agent ops
  run), `GlobalMutationBar`, `UpgradeDialogBridge`, sonner `Toaster`.

---

## 3. Routing & access control

`src/router.tsx` defines all routes under role layouts. Guards
(`src/components/auth/RouteGuards.tsx`):

| Guard | Allows |
|---|---|
| `GuestRoute` | unauthenticated; if authenticated redirects ADMIN→`/admin`, TEACHER→`/dashboard`, GUARDIAN→`/guardian`, STUDENT→`/student` |
| `TeacherRoute` | role `TEACHER` only |
| `StudentRoute` | role `STUDENT` **and** `GUARDIAN` (guardians can browse some student views) |
| `GuardianRoute` | role `GUARDIAN` only |
| `AdminRoute` | role `ADMIN` only |

Public pages: `/` (3D landing), `/login`, `/signup`, `/auth/callback` (OAuth),
`/forgot-password`, `/verify` (email verification + set-password),
`/privacy`, `/terms`, `/pricing`, `/design-preview`.

Teacher routes (`/dashboard` … `/support`) — ~40 routes; student routes
(`/student/...`) — ~20; guardian `/guardian/*`; admin `/admin/*` — 17 routes.

Layouts (`src/components/layout/`): `TeacherLayout`, `StudentLayout`,
`GuardianLayout`, `AdminLayout` + `TopNavBar`/`MobileNav`; `Sidebar` has the
role-specific nav sections (Overview / Teaching / Communication).

---

## 4. Auth & onboarding business logic

### 4.1 Login / signup (`src/pages/LoginPage.tsx`, `SignupPage.tsx`)
- Login: email + password only (zod-validated). On success routes
  TEACHER/ADMIN → `/dashboard`, others → `/student`.
- Signup role toggle: **Teacher | Student | Parent (Guardian)**.
  - **Teacher**: long form with school code OR "create a school"
    (`organizationName`), SSN `^\d{3}[- ]?\d{2}[- ]?\d{4}$`, phone, address,
    personal email, DOB, emergency contact (`teacherSignupSchema`) → pending
    request → admin approves.
  - **Student**: school code → `fetchSchoolByCode` shows the school name +
    grade levels; optional parent section, guardian SSN/phone/nationality →
    `signStudentUp` → **pending join request** (`matchedFromRoster` if the CSV
    roster already contained them).
  - **Guardian**: school code + **child's school email** + personal email →
    `signupGuardian` → pending request, admin approval links them to the child
    (server validates the child is provisioned or in the roster).
- **Google/Microsoft OAuth** exists only on the signup screen (for admins):
  a new OAuth user is created as an **org-less ADMIN** and must complete
  onboarding — create a school by name or join one by join code
  (`POST /auth/oauth/onboard`) before entering `/admin`
  (`AuthCallbackPage.tsx`).

### 4.2 Verification & credentials flow (`VerifyPage.tsx`)
School accounts are `firstname.lastname@<school-domain>` — **not real
mailboxes**. So:
- On approval, the student/guardian gets a **verify link in their real
  (personal) email** (`/verify?token=...`, 72h token).
- `POST /auth/verify-email` with the token returns
  `{ email, schoolCode, needsPassword }`. If `needsPassword` the page shows a
  **set-password form** (min 8 chars); otherwise it just reveals the school
  email + school code. Password is never revealed anymore (replaced the old
  one-time reveal — see `PLAN-verify-set-password.md`).
- "Resend" → `POST /auth/credentials/resend` (public, by personal email).

### 4.3 Forgot password (`ForgotPasswordPage.tsx`)
Two modes: request (email → real inbox; **school logins map back to the real
email**; teachers/admins fall back to Supabase magic link) and reset
(`?resetToken=` or OAuth hash token, 30-min TTL, new password ≥ 8, then
auto sign-in).

### 4.4 Session & gatekeeping
- Any 401 (except login/signup URLs) → token cleared + cache wiped +
  redirect to `/login` (`SESSION_EXPIRED_EVENT`).
- Subscription gating: 402 `SUBSCRIPTION_REQUIRED` / 403 "...requires the
  **X** plan or higher" → global `UpgradeDialog` with the required tier.
- `getErrorMessage` turns HTTP statuses into friendly copy (410 "no longer
  available", 429 "too many requests", etc.).

---

## 5. The academic structure (grades → sections → courses → offerings)

The school model used everywhere:

```
GradeLevel (Grade 1..12)
├── Section ("class" in the UI)   ← enrollments of students
└── Course (subject)
     └── CourseOffering = Course × Section × Teacher   ← the actual teaching unit
          ├── Assignments + Rubrics + Submissions
          ├── Quizzes, Labs, Materials, Timetable slots
          └── ClassMaterial (RAG source)
```

- Admin `GradeManagementPage` is a console over this: grade rail, per-cell
  **teacher-assignment matrix** (rows=sections, columns=courses) using
  `createOffering`/`updateOffering`/`deleteOffering`, inline rename of
  sections/courses, create grade `{level 1-12, name}`.
- Teacher pages (`GradesPage`, `GradeDetailPage`, `CoursePage`,
  `ClassesPage`, `ClassDetailPage`) mirror the same hierarchy with
  grade→course→section cascades and per-section counts.
- `ClassDetailPage` tabs: Students (enroll/unenroll + "Message" → chat
  thread), Assignments, Materials (per-offering), Attendance (grid +
  import), AI Assistant deep-link, delete class (irreversible cascade).

---

## 6. Business logic, module by module

### 6.1 Materials & chapters (the curriculum RAG source)
- Upload (`POST /materials/upload`): attaches to a section/offering/course/
  assignment/chapter; **backend chunked + embedded at upload** into
  `MaterialChunk` (with `chunkCount`, `detectedChapterCount` in responses).
- **Chapters**: auto-detected from PDF headings (needs ≥1 heading, title
  cleanup strips trailing dashes/colons — `PLAN-material-chapters-fix.md`),
  plus manual CRUD (`createMaterialChapter`, rename, delete, move file
  between chapters, "Ungrouped" bucket).
- **AI search**: `GET /materials/offering/:id/search?q=&topK=&chapterId=`
  and `/materials/course/:id/search` return `MaterialChunk[]` with
  `similarity` scores. Used by teacher pages (browse) and by the **AI
  generators' grounding** (assignments, quizzes, labs, study lab).
- `useCourseMaterialChapters` powers the "scope to a unit" pickers
  everywhere (assignments/quizzes/labs).

### 6.2 Assignments & rubric builder
- Teacher creates assignments per section (`createAssignment`), or uses
  **AI Generate** (`/assignments/generate-course`):
  - Input: courses/target sections, optional chapter scope, type
    (essay | short_answer | project), due date.
  - Backend searches curriculum material; if nothing matches →
    `status: "not_grounded"` → the UI **blocks** saving ("No matching
    curriculum material"). If grounded, a full **draft with rubric** comes
    back and is stored in `sessionStorage` (`use-assignment-draft.ts`).
  - `AssignmentReviewPage` lets the teacher edit title/description/due
    date/rubric criteria (total points computed live, ≥1 valid criterion
    required) and **approves the rubric once for all target sections** via
    `saveGeneratedAssignments` — students see it immediately.
- **Rubric builder** (`RubricsPage`, `RubricConfirmPage`):
  - Manual rows (criterion + maxPoints) **or PDF import**
    (`/rubrics/import-pdf`) → AI-extracted criteria appear as "AI Suggested"
    rows (accept/dismiss).
  - Statuses: draft → **saved template** → **confirmed**
    (`confirmRubric`: "Confirming will generate embeddings for each
    criterion" — irreversible). A confirmed rubric is required before
    grading; assignments/pdfs can be copied across assignments.
- `AssignmentDetailPage`: submitted vs graded counts, average = confirmed
  points / (graded count × total points), links into the submission queue.

### 6.3 Submissions & the AI grading pipeline
Submission state machine (shown in `SubmissionDetail`/`SubmissionStatusPage`):

```
SUBMITTED ──(teacher clicks "Grade")──▶ GRADING_IN_PROGRESS
   ▼                                            │ (AI agent runs)
   └────(student upload)────────┐               ▼
                                └──▶ REVIEW_READY ──(Confirm All)──▶ CONFIRMED (immutable)
```

- Students submit by **text or PDF upload** (`/submissions`,
  `/submissions/import-pdf`); **one submission per assignment** (resubmit
  blocked).
- `SubmissionsPage` = filterable queue (status, assignment, course, section,
  search) with **per-row and bulk "AI Review All (N)"** — sequential grading
  calls with a progress counter.
- `gradeSubmission` → the backend **Grading Agent** embeds/runs retrieval and
  scores each criterion, citing the exact `RubricCriterion.id`; feedback is
  written to `CriterionFeedback` rows (`aiFeedback`, suggested
  `pointsAwarded`, `isConfirmed = false`).
- `SubmissionDetailPage` = review screen: read-only `aiFeedback`, editable
  `pointsAwarded` + `teacherNotes`, then **"Confirm All Grades"**
  (PATCH each score + `confirm-all`) → CONFIRMED, visible to the student.
  Confirmed rows are locked (`isReadOnly`).
- **Students only ever see `isConfirmed` grades** (enforced by the API shape
  and mirrored in every student page: `StudentAssignmentGradePage`,
  `StudentClassGradesPage`, `SubmissionStatusPage`, `MyGradesPage`).
  `SubmissionStatusPage` polls every 10s while a confirmed grade is missing
  `aiFeedback` ("Generating feedback…"). A historical bug (1/0 points,
  Infinity%) was fixed by using the server-sent `score.criteria` relation
  instead of the teacher-only rubric fetch (`PLAN-fix-student-grade-display`).

### 6.4 Alerts — Analysis Agent + communication content
- **Flagging is deterministic, never an LLM decision** (`specs.md` §3.4):
  - `FAILING`: average of last 3 confirmed grades < 60%
  - `DOWNWARD_TREND`: 2 consecutive confirmed grades each dropping
  - `CONSISTENT_STRUGGLE`: repeatedly flagged over time
  - The LLM is only used to write the **plain-language `reason`**.
- The backend additionally enriches each alert with **communication
  deliverables** (the "communication agent" pipeline) which the frontend
  renders on `AlertDetailPage`:
  - **Diagnosis** (`DiagnosisPayload`: issueType STUDENT_ISSUE/CLASS_ISSUE/
    BOTH, severity LOW/MEDIUM/HIGH, summary) — legacy
  - **Teacher content**: analysis, skill gaps, interventions, resource
    suggestions (`TeacherAnalysisSection`)
  - **Guardian content**: parent-directed message + home support strategies
    (`GuardianMessagePreview`, `HomeStrategiesList`)
  - **Teacher feedback**: feedback, pattern analysis, strategies
  - **Management summary**: summary, class trend, recommendation
  - **Practice recommendations**: linked `PracticeRecommendation` rows
    (READY/FAILED/PROCESSING + stage) — the student sees these in Study Lab
    ("Recommended practice" badge when `recommendedForAnalysisId` matches).
- `AlertsPage`: filter by status (NEW/ACKNOWLEDGED/RESOLVED), resolve/dismiss
  (`PATCH /alerts/:id`). Guardian has its own scoped endpoints
  (`/alerts/guardian`, `/alerts/:id/guardian-detail`) — server-enforced ward
  ownership.
- Admin dashboard + admin alerts page aggregate per status/severity/type/
  class.

### 6.5 Teacher dashboards & insights
- `TeacherDashboardPage`: four parallel queries (classes, assignments,
  submissions, alerts); stats = active alerts, resolved, pending review
  (total − confirmed), average per-section score (confirmed only) with
  letter grades (≥90 A, ≥80 B+, ≥70 B−, ≥60 C, else D); "Needs Attention"
  feed with severity badges.
- **Insights** (`GET /dashboard/insights?interval=week|month`): role-specific
  chart sections (line/area/bar/radar/donut) with backend-written titles and
  deltas, plus "agent insights" narrative cards (breakdown with strengths/
  concerns/recommendation). Per-role chart keys: `submissions_volume`,
  `confirmed_grades`, `pending_confirmations`, `alerts_created`,
  `attendance_rate`, `class_average`, `criterion_average`,
  `struggling_students` (teacher); `grade_trend`, `attendance_trend`,
  `criterion_strengths`, `help_action_split` (student); `pass_rate_trend`,
  `user_growth`, `teacher_workload`, `alert_status_split` (admin);
  `child_{id}_{grades|attendance|alerts}` (guardian). Clicking a data point
  drills into `GET .../sections/:key/detail?bucket=` with real records.
  Explanations for every chart are **deterministic local copy**
  (`insight-explanations.ts`) — no LLM on the frontend.

### 6.6 Reports
`GET /reports` → each report has three sections (Teacher / Parent /
Management) rendered with `RichText` (`report-sections.ts`). Teacher
`StudentDetailPage` and guardian `ChildDetailPage` show them, consistently
gated to confirmed grades.

### 6.7 Attendance
- Batch import per class/date with per-student PRESENT/ABSENT/LATE/EXCUSED
  toggles (`AttendanceImportPage`, `POST /attendance/import`).
- Viewing: class matrix (`ClassDetailPage`), per-student
  (`getStudentAttendance`), heatmap + charts for students (`AttendanceCharts`).
- Local deterministic stats (`attendance-stats.ts`): per-day aggregation,
  attendance rate %, **current/best streak**, month buckets, week grid —
  used on `MyAttendancePage`, guardian overview, `computeChildSummary`.

### 6.8 Quizzes
- **Lifecycle**: `DRAFT → PUBLISHED → CLOSED`. Publish locks content
  ("can't edit after publishing"); closing stops new attempts; delete removes
  attempts too; **reassign only while PUBLISHED** (add sections; AI-generated
  quizzes come pre-assigned and locked).
- Question types: MCQ, TRUE_FALSE, SHORT_ANSWER, ESSAY; open-ended answers
  are **AI-graded after submission and need teacher confirmation**.
- **AI generation** (`/quizzes/generate`, SSE): teacher picks target
  sections, chapter scope, count (1–30), types, difficulty, time limit →
  `QuizAgentGraph` shows steps `thinking → search_curriculum →
  generate_questions → review_questions → save_quiz`; on success navigates
  to the editor.
- **Attempts** (`QuizTakePage` + `use-quiz-session.ts`):
  - Session persisted in `sessionStorage` (answers saved as you go, refresh
    resumes); phases `pre|active|expired|submitted`.
  - Timer = `min(attempt expiresAt − serverNow, quiz endsAt)`; at 0 →
    **auto-submit**.
  - **Anti-cheat**: fullscreen requested; `TAB_SWITCH` + `FULLSCREEN_EXIT`
    violations reported (throttled ≥1s, best-effort, never blocks);
    contextmenu/copy/paste/cut blocked while active; `beforeunload` guard +
    leave-quiz blocker; submit-with-unanswered → danger confirm
    ("Unanswered questions score zero"); 410 → expired phase, 404 → attempt
    removed.
- Attempt review (`QuizAttemptDetailPage`): per-answer points edit, accepted
  AI suggestions, `isConfirmed` reveal gating, violations list, "Confirm N
  answers" (submit final scores). Students see partial/results with "being
  reviewed… score may change" note and violation warnings.

### 6.9 Homework Help agent (student)
`POST /assistant/homework-help` (**SSE streamed agent**):
- Steps: `thinking → search_material → search_assignment → search_web →
  teacher`; outcomes `HINT | EXPLANATION | REDIRECT_TEACHER`.
- `REDIRECT_TEACHER` answers carry `teacherNotified: true` — the teacher is
  notified and this feeds the teacher insight `struggling_students`.
- `sources` (retrieved chunks) are surfaced in the UI with auto-linked URLs.
- History (`GET /assistant/homework-help/history`) + 👍/👎 feedback
  (`HELPFUL/NOT_HELPFUL`).
- The student must be enrolled in the course; the helper is paused during a
  quiz. The **Homework agent's own UI** includes `HomeworkAgentGraph`
  (search_material ≈16s, search_assignment ≈21s, search_web ≈26s visual
  pacing) and a Typewriter streaming renderer.

### 6.10 AI Assistant (course chat) + rule-based copilots
- **Teacher `/assistant` — Course tab**: real backend chat
  (`POST /assistant/chat` with full message history in the payload; no
  persisted history — resets on refresh, an intentional MVP scope cut) scoped
  to an offering; SSE-less but shows `AssistantAgentGraph` while loading.
  The backend Assistant Agent is the **one true tool-using agent**
  (`search_curriculum`, `create_quiz` tools, max 5 iterations) and can return
  a ready-made quiz draft.
- **Teacher Students tab / Admin assistant / Guardian assistant**: **fully
  client-side rule engines** — keyword-intent regex matching over live query
  data (attendance counts, confirmed-only grade averages, roster counts,
  alerts by severity, review queue from dashboard overview, per-student
  insights scoped via `ScopeSearch`). Chat never leaves the client; a fake
  420ms typing delay. Guardian scope must come from the dashboard's children
  list (ward ownership even in the local copilot).

### 6.11 Study Lab (student AI study materials)
`POST /assistant/study-lab/generate` (async job, **polled every 3s**; status
`PROCESSING → READY | FAILED`, stages `QUEUED → GROUNDING → GENERATING →
BUILDING`):
- Kinds: **PODCAST** (host/guest script + optional audio, presets
  OVERVIEW/DEEP_DIVE/EXAM_CRAM/CASUAL/BREAKDOWN), **SLIDES** (structured deck
  with rich block types + data visuals: bar/line/pie/area charts, flow,
  timeline, comparison, concept map; themes modern/classic/dark/colorful/
  minimal with accent/background/motion), **STUDY_MATERIAL**
  (STUDY_GUIDE | FLASHCARDS | PRACTICE_QUESTIONS | CHEAT_SHEET).
- Local deck normalization (`deck.ts`) + PDF download via `studyLabFileUrl`.
- `PracticeView` implements **Fisher–Yates shuffle** per session (questions
  and options) with instant reveal + explanation + results screen with
  "Retry wrong answers" (see `PLAN-study-lab-practice-upgrade.md`).
- Practice questions generated after an alert carry
  `recommendedForAnalysisId` → "Recommended practice" badge.

### 6.12 Lab Simulations (AI-generated interactive games)
Teacher asks for a lab on a topic (+ optional chapter scope); the backend
**Lab Generator agent** searches curriculum and produces either a
**template game** (drag-to-regions, sort-categories, match-pairs, flashcards)
or **advanced free-form Matter.js code**; a **Lab Reviewer agent** (same SSE
pipeline, separate `AI_REVIEW_FAILED` verdict) checks security + contract
compliance (e.g. the `reportLabObjectiveComplete()` hook wired to real
physics state — `PLAN-labs.md`).

- **Lifecycle**: `GENERATING → (AI review) → PENDING_TEACHER_REVIEW
  (reviewApproved) or AI_REVIEW_FAILED (flags+reasoning) → PUBLISHED |
  REJECTED`. Teachers can **publish over a failed review** (explicit warning),
  **refine** in place (`/labs/:id/refine` — "modifies in place, never
  regenerates"), **regenerate** (fresh build, same unit), or **reject with
  notes**. Flagged code is never shown to students.
- Streaming: `streamGenerateLab | streamRefineLab | streamRegenerateLab`
  with a 10-minute watchdog; `LabAgentGraph` steps `thinking →
  search_curriculum → design_game → generate_code → load_lab → modify_lab`.
- **Sandbox**: `lab-harness.ts` builds an opaque-origin iframe document with
  a strict CSP (no network/storage), Matter.js inlined via `?raw`, and a
  `postMessage` bridge (`eduai-lab` events: `objective-complete`,
  `runtime-error`). Students get an "Objective complete!" toast/badge.

### 6.13 Meetings (LiveKit video)
- Types CLASS/AD_HOC; status SCHEDULED/LIVE/ENDED/CANCELED; `recordingEnabled`
  → MP4 + auto-transcribed (transcript status PENDING/PROCESSING/READY/
  FAILED, live socket updates + 15s polling).
- `canJoin` is **server-computed** and gates the Join action. Host controls
  recording + end. `use-livekit.ts` manages one shared `Room` per
  (url|token|roomName), camera/mic toggles with preferred devices, and a
  data-channel protocol (`emoji`, `hand`, `hand-cancel`).
- `MeetingDetailPage`: attendance derived from join/leave times; teacher-only
  follow-up tab; **struggle signals** — AI-spoken-question and homework-help
  signals surfaced during the meeting (`PENDING/SENT/DISMISSED`, class-wide
  clusters) that the teacher can send/pin to a quiz or dismiss; recordings
  are "never sent without review".

### 6.14 Chat (teacher↔student, teacher↔guardian, admin↔anyone)
- Threads: `CLASS` (per offering/student) and `ADMIN` (admin↔teacher or
  admin↔guardian); list shows peer name, class, last message, unread count.
- Realtime: Socket.IO singleton (`/chat`) with `thread:join/leave`,
  `thread:message`, `thread:joined` bulk snapshot; REST fallback when
  disconnected; **read receipts** (`markThreadRead` on open/focus/incoming);
  dedup by message id; ≤4000 chars.
- Notifications: `NotificationBell` + list, mark-read, detail dialog.

### 6.15 Billing, plans & school groups
- **Plans** (mirror of backend catalog, `plans.ts`): Trial (14 days, free,
  unlimited seats) → **Basic $50/mo** (30 seats) → **Pro $120/mo** (100
  seats) → **Enterprise $300/mo** (500 seats). Feature ladder: core = AI
  grading/materials/attendance/alerts; Pro adds assistant+chat+homework help,
  quiz gen+anti-cheat, three-tier reports, labs & study lab; Enterprise adds
  advanced insights + dedicated support.
- Checkout rules (`useStartCheckout`, `AdminBillingPage`, `docs/billing-plans.md`):
  - Guest → `/signup`; non-admin → toast "Only an organization admin can
    purchase a plan."
  - Trial/no-sub admin → **Stripe Checkout** (`/billing/checkout`).
  - Active-sub admin → `changePlan(planId, atPeriodEnd)` (immediate prorated
    vs next cycle switch).
  - **Grouped orgs** (`org.groupId`) → Enterprise-only, unlimited seats,
    `GROUP_REQUIRES_ENTERPRISE` 403 backend enforcement.
  - CANCELED/PAST_DUE → checkout again; seat limit meter `userCount/seats`;
    `INVITE_SEATS_FULL` errors surface as seat-limit banners everywhere.
- **SchoolGroup** (`GroupManagementPage`): create a group, join by join code,
    per-school seat usage/insights matrix; billing moves to the group.
- `UpgradeDialog` (feature-gated UX): global modal opened by any 402/403
  subscription error; `SubscriptionBanner` in app shells.
- **Membership requests** (legacy invites): admin approve/reject with role
  override, regenerate join code; **Join approvals** (roster + self):
  batch approve/reject/reopen with source filter, `generatedPassword` flags,
  guardian-kind badge (`targetStudentEmail`).

### 6.16 Admin console
- **CSV roster import** (migration wizard + simple import page):
  - Quote-aware CSV/TSV parser mirroring backend (`csv-parser.ts`), template
    download, paste, file; per-column **AI-suggested field mapping** with
    confidence (≥0.9 High, ≥0.7 Medium) — admin confirms, never auto-guesses.
  - Importable fields incl. guardian name/email/SSN/phone/nationality
    (`PLAN-csv-import-guardian-fields.md`).
  - Results: `imported`, `autoApproved` (complete rows provisioned instantly:
    student + guardian + verify emails), `queued` (failed provision → fix in
    Join Approvals), `needsFollowUp` (missing email → "can join later with the
    school code", invalid 9-digit SSN, duplicates, already member/pending),
    `unassignedGradeOrSection`, `unmatchedSectionsOrGrades` (never guessed).
  - Per-student validation statuses `ready|attention|invalid`,
    `UnassignedStudents` list.
- **Students**: master-detail list, guardian search-and-link
  (`POST /students/:id/guardian`), expulsion with exact-name confirmation,
  admin profile: quiz grades, history by year (warnings + scores),
  documents (categories BIRTH_CERTIFICATE/IMMUNIZATION_RECORD/
  PREVIOUS_TRANSCRIPT/PAYMENT_RECEIPT/ID_DOCUMENT/OTHER; **AI-categorized** at
  upload with suggested student + confidence; ≤20MB; confirm before filing),
  fees (TUITION/REGISTRATION/EXAM/MATERIALS/OTHER × PAID/PARTIAL/POSTPONED/
  UNPAID, CRUD), **credential reset** → sends a 72h set-password invite
  (never reveals a password), `withoutGuardian` filters.
- **Teachers**: admin profile (SSN masked, reveal-on-demand, edit), classes
  history (active flags), documents (SOCIAL_SECURITY/NATIONAL_ID/PASSPORT/
  LICENSE/DEGREE/CONTRACT/OTHER), salaries per period
  (PAID/PARTIAL/POSTPONED/UNPAID), avatar.
- **Bulk documents**: multi-file upload → AI category + student matching
  (≥0.95 "Very confident", ≥0.75 "Confident"), manual confirm table.
- **Broadcasts**: announcements targeted by role (STUDENT/TEACHER/GUARDIAN/
  ADMIN) + optional grade; delivered as in-app notification + email;
  title ≤200, body ≤5000.
- **Timetable editor** (`AdminTimetablePage` + `WeeklyTimetableGrid`):
  per-section weekly grid, drag add/move/resize with **live server conflict
  checks** (teacher/section conflicts), week start configurable
  (MONDAY/SUNDAY in localStorage — `timetable-settings.ts`), offering picker
  filtered per section.
- **Admin dashboard**: org stats, pass-rate trend, membership request queue,
  flagged students (top 6 by severity), seat-limit banners.

### 6.17 Guardian app
- Dashboard: child cards (overall average from **confirmed** grades,
  attendance rate, active alerts) powered by `GET /dashboard/overview` +
  `/alerts/guardian`.
- Child detail: grades/attendance/reports/schedule tabs; `computeChildSummary`
  derives all stats client-side from confirmed grades + attendance.
- Alerts: severity stats, per-child filter pills, guardian-detail page
  (parent message + home strategies + recent confirmed grades + links).
- Assistant: **client-side rule copilot** for "How is my child doing?"
  queries; ward ownership enforced by using only the dashboard children list.
- First-login: profile completion prompt (`profileComplete`) — enforced
  server-side via `GET/PATCH /guardian/me/profile`.

---

## 7. The Agents (what the platform actually uses)

The agents themselves execute **in the backend**; the frontend consumes their
progress via SSE `step` events and renders them as orbiting tool-node graphs
(`AgentGraph`, `AssistantAgentGraph`, `QuizAgentGraph`, `LabAgentGraph`,
`HomeworkAgentGraph`). The complete roster:
# AI Agents — complete reference

The canonical product/architecture spec is `specs.md`; the honest-but-short
agent table lives in `specs.md` §7 and `README.md` §Agent Architecture. This
document is the detailed, always-current inventory of every AI agent in the
project: what it is, what it does, how it's triggered, what tools it uses, and
where the code lives.

## Two categories, one hard rule

There are two kinds of "agent" in this codebase, and the distinction is
intentional:

| Category | What it is | Examples |
|---|---|---|
| **Mastra agents** | Real `new Agent(...)` instances executed with `agent.generate()` | Struggle Signal Extractor, Lab Architect, Lab Generator |
| **Agent-class services** | NestJS injectables that run a structured tool-calling loop (or a single structured LLM call) through `LlmService` | Assistant, Quiz Generation, Homework Helper, Grading Agent, Guardian Chat, Communication Agent |

Hard rule that applies to both: **every LLM call goes through
`common/llm/LlmService`** (PII redaction → Zod-validate-and-retry), with the
one deliberate exception of the Mastra agents that drive the ITI gateway
through a `LanguageModelV2` adapter (`struggle-signals/gateway-language-model.ts`)
so Mastra can run `generate()` with `structuredOutput`.

Deterministic non-LLM pieces (Orchestrator, Analysis trigger, Criterion
Detector, Notification Dispatcher) are **not AI** and are listed at the bottom
so nobody re-adds "autonomy" to them.

---

## 1. Communication Agent

Diagnoses a student's (or a whole class's) performance after grades are
confirmed and produces audience-aware communications, alerts, reports, and
notifications.

| | |
|---|---|
| **Module** | `src/communication-agent/` |
| **Definition** | `communication-agent.agent.ts` — `createCommunicationAgent()` (Mastra `Agent`, `id: communication-agent`, model `openai/gpt-5.5`, no tools registered) |
| **Execution** | `CommunicationAgentService.analyze(submissionId)` — the service performs the tool loop itself using `LlmService.generateStructured` + deterministic `tools/` (`createGetStudentProfileTool`, `createCreateAlertTool`). The Mastra agent wrapper exists but the running path is the service. |
| **Trigger** | Fire-and-forget after `confirmAll()` bulk-confirms a submission (and on the seed). Skips orgs not on Trial/Enterprise, skips submissions already analyzed, skips students with < 2 confirmed submissions. |
| **Decision** | **Plain code, never a prompt** — `verdict()` in `trends.ts` flags a student on: last-3 confirmed average < 60%, ≥ 3 consecutive drops, weak criterion (single criterion avg < 60% becomes a `WEAK_CRITERION` / `CONSISTENT_STRUGGLE`), or class-wide attribution (`STUDENT` / `CLASS` / `BOTH`). |
| **Outputs** | Creates `StudentAnalysis` + `Alert`; generates `Explanation` (headline/reason/highlights/strengths/concerns/recommendation), teacher + guardian content via separate LLM calls, and class-level `TeacherFeedback` + `ManagementSummary`. Notifies teacher/guardian/admin, auto-triggers `ReportsService.generate()` (three-tier report), and calls `StudyLabService.recommend()` to launch a practice set for the weak criterion. |
| **Failure safety** | `safeStructured()` wraps every LLM call with a deterministic fallback, so alerts + notifications always fire even if the LLM is down. |
| **Persistence** | `StudentAnalysis` rows carry the diagnosis + all generated content; `StudentReport` rows are created for alerts. |

---

## 2. Feedback Writer

Writes natural-language, per-criterion feedback for confirmed grades —
explaining *why* a student got that score and how to improve.

| | |
| | |
|---|---|
| **Module** | `src/feedback-writer/` |
| **Definition** | `feedback-writer.agent.ts` — `createFeedbackWriterAgent(writeFeedbackTool)` (Mastra `Agent`, `id: feedback-writer`, model `openai/gpt-5.5`, tool `write-feedback`). The running path is `FeedbackWriterService.write()` which executes `createWriteFeedbackTool` directly; the Mastra wrapper is the declared shape. |
| **Trigger** | Fire-and-forget after `confirmAll()`, plus a backfill endpoint for historically confirmed scores without feedback. |
| **Work** | For each `GradingScore`, one structured LLM call (criterion description + maxPoints + pointsAwarded + full submission content) → writes `GradingScore.aiFeedback`. Notifies the student (`FEEDBACK_READY`) when ≥ 1 criterion got feedback. |
| **Tool** | `tools/write-feedback.tool.ts` wraps `LlmService.generateStructured` with the `FeedbackSchema`. |

---

## 3. Assistant Agent (teacher chat)

The teacher-facing conversational assistant. The one genuinely multi-action
tool-using loop in the product.

| | |
|---|---|
| **Module** | `src/assistant/` |
| **Definition** | `assistant.service.ts` — `AssistantService.chat()`, a hand-rolled loop (`MAX_ITERATIONS = 5`) over `LlmService.generateStructured` with a `ToolCallSchema`. Not a Mastra agent. |
| **Actions** | `search_curriculum`, `create_quiz`, `draft_rubric`, `summarize_lesson`, `plan_lesson`, `class_analytics`, `draft_assignment`, `respond`. Each generator action is a dedicated structured call (quiz, rubric, lesson summary, lesson plan, assignment draft, class analytics). |
| **Grounding** | All generated content is grounded in the class's curriculum via pgvector search; a weak/generic query falls back to the class's raw chunks (same guard quizzes and labs use). Never answers from its own knowledge. |
| **Class analytics** | `class_analytics` computes real numbers from **confirmed** grades only (per-student last-3 avg, consecutive drops, flagged list) and turns them into a summary — the numbers are code, the prose is LLM. |
| **Persistence** | Chat history survives refresh via `ai-chat/` (`AiChatConversation` / `AiChatMessage`), ChatGPT-style threads with auto-titles. Chat-generated quizzes are persisted as draft quizzes via the shared `save-quiz.tool`. |
| **Endpoint** | `POST /assistant/chat` (+ conversation list/get/delete). |

---

## 4. Quiz Generation Agent

Generates a balanced, curriculum-grounded quiz and assigns it to sections
(optionally targeting specific students).

| | |
|---|---|
| **Module** | `src/quizzes/agents/` |
| **Definition** | `quiz-generation.agent.ts` — `QuizGenerationAgent.generate()`, a hand-rolled loop (`MAX_ITERATIONS = 5`) over `LlmService.generateStructured` with a `QuizGenerationToolSchema`. Not a Mastra agent. |
| **Tools** | `search_curriculum` (scoped to the selected unit/chapter), `generate_questions` (LLM via `tools/generate-questions.tool.ts`), `review_questions` (coverage-gap check via `tools/review-questions.tool.ts`), `save_quiz` (persists via `tools/save-quiz.tool.ts`). |
| **Rules** | Always searches first; questions come only from search results (never own knowledge); a unit with no material is a clear "can't generate" reply; gap-filling regenerates with `avoidTopics`. |
| **Difficulty** | EASY/MEDIUM/HARD (default MEDIUM) calibrates question depth. |
| **Reuse** | The same quiz can be assigned to many sections and reused across courses/grades; optional `endsAt` close deadline. Also reused by `generateForConcept()` from struggle-signals. |

---

## 5. Homework Helper Agent (student)

Student-facing homework help that gives hints/explanations — never the answer.

| | |
|---|---|
| **Module** | `src/homework-helper/` |
| **Definition** | `homework-helper.agent.ts` — `HomeworkHelperAgent.help()`, a hand-rolled loop (`MAX_ITERATIONS = 5`) over `LlmService.generateStructured` with a `HomeworkToolSchema`. Not a Mastra agent. |
| **Tools** | `search_curriculum` (`tools/search-curriculum.tool.ts`), `lookup_assignment` (resolves assignment + rubric criteria, `tools/lookup-assignment.tool.ts`), `search_web` (Tavily, `tools/search-web.tool.ts` — general reference only), `log_interaction` (persists `HomeworkHelpInteraction` so the teacher sees who's struggling). |
| **Response modes** | `HINT` / `EXPLANATION` / `REDIRECT_TEACHER` (grade disputes, personal feedback, sensitive topics, or the student's own work). |
| **Grounding** | Answers come from curriculum search results; falls back to web only for general-knowledge/factual questions, never for graded assignments; never answers from its own knowledge. |
| **Endpoint** | `POST /assistant/homework-help` (+ interaction history). Also invoked by struggle-signals to produce the grounded re-explanation. |

---

## 6. Grading Agent

Grades a submission against the confirmed rubric criteria with a single
structured LLM call — no tool use, deliberately.

| | |
|---|---|
| **Module** | `src/grading/` |
| **Definition** | `grading.agent.ts` — `GradingAgent.grade(submissionId)` → `LlmService.generateStructured` with `GradingOutputSchema`. Not a Mastra agent. |
| **Retrieval** | Plain code (`collectCriteria`, `selectSubmissionChunks`) feeds the LLM: confirmed rubric criteria + the submission chunks most relevant to the criteria (keyword-scored chunk selection, ≤ 12k chars). |
| **Constraints** | Scores every criterion exactly once, using real `RubricCriterion.id`s the retrieval actually returned; points clamped to `[0, maxPoints]`; missing criteria default to 0 with an explicit note. |
| **Trigger** | Fire-and-forget from `SubmissionsService.create()` — student gets an instant response, grading runs in the background, teacher is notified on completion. |
| **Visibility** | A grade is real only after teacher confirmation (`isConfirmed = true`); students never see AI suggestions. |

---

## 7. Guardian Chat Agent

A guardian-facing copilot that answers questions about a child's school data.

| | |
|---|---|
| **Module** | `src/guardian-chat/` |
| **Definition** | `guardian-chat.agent.ts` — `GuardianChatAgent.respond()` → `LlmService.generateStructured` with `GuardianReplySchema`. Not a Mastra agent. |
| **Grounding** | Answered strictly from the ward data provided in the conversation (grades, attendance, quizzes, fees, open alerts). Never invents numbers; says plainly when data isn't visible; never reveals another student's info. |
| **Sources** | Each reply lists the ward-data sections it actually used. |
| **Persistence** | Conversations live in `ai-chat/` (kind `GUARDIAN`), with a graceful fallback reply if generation fails. |
| **Endpoint** | `POST /guardian-chat` (+ conversation list/get/delete). |

---

## 8. Struggle Signal Extractor (Mastra)

Reads recorded class-meeting transcripts and extracts per-student "confusion
signals" — concepts a student seemed unsure about during the lesson.

| | |
|---|---|
| **Module** | `src/struggle-signals/` |
| **Definition** | `struggle-signals.agent.ts` — `createStruggleSignalExtractor(chat)`, a **real executed Mastra agent** (`id: struggle-signal-extractor`, no tools, model = in-house `LanguageModelV2` adapter over `ProviderService.chat`). |
| **Trigger** | After a recorded CLASS meeting's per-participant transcripts drain (LiveKit webhooks), or teacher-gated `POST .../trigger`. Idempotent via `struggleSignalsProcessed`. |
| **PII** | Student identity is replaced with per-meeting placeholders (`Student_A`, ...) before anything reaches the model; real identity is re-attached only after the call, in the service. |
| **Structured output** | `SignalExtractionOutputSchema` — `{ signals: [{ concept, explanation }] }`, empty list is valid; bounded retry (3 attempts) on malformed output. |
| **Post-processing** | Deterministic class-wide roll-up (`similarConcepts` Jaccard ≥ 0.6; 3+ students ⇒ `classWide`). |
| **Dispatch** | Auto-dispatch (no teacher approval): for every signal, generate a scoped quiz for that student (via Quiz Engine `generateForConcept`) + a grounded re-explanation (via Homework Helper). Failures mark the signal `FAILED`; teacher can retry/dismiss. |
| **Status lifecycle** | `PENDING` → `SENT` (quiz + re-explanation) | `DISMISSED` | `FAILED`. |

---

## 9. Lab Architect (Mastra)

Designs "template" science lab games — picks a fixed, pre-tested game template
and fills it with curriculum-grounded content. No AI code is produced.

| | |
|---|---|
| **Module** | `src/labs/agents/` |
| **Definition** | `lab-architect.agent.ts` — `createLabArchitect(chat)`, a **real executed Mastra agent** (`id: lab-architect`, no tools, gateway `LanguageModelV2` adapter). |
| **Templates** | `drag-to-regions`, `sort-categories`, `match-pairs`, `flashcards` — chosen via `LabGameSpecSchema` (discriminated union). The frontend renders the chosen template with hand-written React, so interaction + win condition are guaranteed. |
| **Grounding** | Content filled strictly from the selected unit's curriculum chunks (top-k semantic search, unit-chunk fallback); never invents facts. |
| **Refine/regenerate** | In-place spec modification (never from scratch) on teacher refine; full regenerate for a fresh spec. Bounded retry on schema validation only (provider failures are not retried). |

---

## 10. Lab Generator (Mastra)

Writes free-form, self-contained interactive HTML5 game/simulation code for
the opt-in "advanced" lab mode.

| | |
|---|---|
| **Module** | `src/labs/agents/` |
| **Definition** | `lab-generator.agent.ts` — `createLabGenerator(chat)`, a **real executed Mastra agent** (`id: lab-generator`, no tools, gateway `LanguageModelV2` adapter). |
| **Output** | `LabGeneratorOutputSchema` — a single self-contained JS `code` string that runs in a sandboxed iframe. |
| **Sandbox contract** | No imports/CDN/network, no `eval`/`Function`, no parent/storage access, no busy loops; must render into `#sim`, expose interactive controls (drag/click via Pointer Events or Matter.js), and call `reportLabObjectiveComplete()` exactly once when a real win condition is met. |
| **Safety** | Deterministic plain-code guards (`guardGeneratedCode` — empty output, missing `#sim` render target) replace any LLM reviewer; the sandbox CSP + teacher manual review handle the rest. |
| **Refine/regenerate** | In-place code modification preserving existing interaction; regenerate from scratch; single pass with guards. |
| **Lifecycle** | `GENERATING` → `PENDING_TEACHER_REVIEW` (or `AI_REVIEW_FAILED` on guard failure / pipeline failure) → teacher `PUBLISH` / `REJECT`. Students only ever see PUBLISHED labs. |

---

## 11. Study Lab generators

Not agents per se, but the same family: grounded, structured LLM generators
for student study materials. Handled by `StudyLabGenerators` in
`src/study-lab/study-lab.generators.ts` (all via `LlmService.generateStructured`).

| Generator | Output | Notes |
|---|---|---|
| `podcastScript` | 2-host episode script (HOST/GUEST, 4–20 segments) → optional TTS audio via Kokoro/`STUDY_AUDIO_MODEL` | Presets: OVERVIEW, DEEP_DIVE, EXAM_CRAM, CASUAL, BREAKDOWN |
| `deck` | 8–14-slide deck JSON → `.pptx` built with PptxGenJS | Strict theme (background/accent/motion), rich blocks, optional visuals (chart/flow/timeline/comparison/concept_map) grounded in chunks |
| `studyGuide` | 3–10 prose sections + summary | Grounded only |
| `flashcards` | 5–30 spaced-repetition cards | Grounded only |
| `practiceSet` | 4–10 MCQ with explanations | Grounded when possible, general-knowledge fallback otherwise |
| `cheatSheet` | 3–12 telegraphic sections | Grounded only |

Background pipeline (`StudyLabService`): `QUEUED → GROUNDING → GENERATING →
BUILDING → READY` (or `FAILED`); rate-limited (10/hour); also drives
`recommend()` practice sets triggered by the Communication Agent. Quiz-in-progress
blocked while generating.

---

## 12. Non-AI pieces that people call "agents"

These exist so nobody is tempted to make them LLM-driven. They are plain,
testable code.

| Piece | File | What it is |
|---|---|---|
| Orchestrator | submissions state machine (`src/submissions/`) | Deterministic status transitions `SUBMITTED → GRADING_IN_PROGRESS → REVIEW_READY → CONFIRMED` — never an AI decision |
| Analysis trigger | `verdict()` in `src/communication-agent/trends.ts` | Plain threshold logic decides who's flagged; LLM only writes the explanation |
| Criterion Detector | `weakCriterion()` / `criterionStatsFromSeries()` in `trends.ts` | Plain code identifies weak criteria from confirmed-score series; LLM only explains |
| Notification Dispatcher | `src/notifications/` | Plain code calls `NotificationService` after reports/events |
| Class-wide roll-up | `similarConcepts()` in `src/struggle-signals/` | Deterministic Jaccard clustering of signals |

---

## Shared infrastructure

| Piece | File | Purpose |
|---|---|---|
| `LlmService` | `src/common/llm/llm.service.ts` | The single entry point for every LLM call — PII redaction (`common/pii/`), Zod-validate-and-retry (`common/validation/`), `generateStructured` for all structured outputs |
| `ProviderService` | `src/common/ai/provider.service.ts` | Wraps the ITI API gateway (chat + embeddings) |
| Gateway `LanguageModelV2` adapter | `src/struggle-signals/gateway-language-model.ts` | Lets Mastra agents drive the non-OpenAI-compatible ITI gateway via `agent.generate(..., { structuredOutput })`; reports `supportsStructuredOutputs: false` so the runtime injects JSON-shape instructions and validates the text response |
| `AiChatService` | `src/ai-chat/` | Shared ChatGPT-style conversation persistence for Assistant + Guardian chat (kinds `ASSISTANT`, `GUARDIAN`) |
| `MaterialsService` | `src/materials/` | pgvector curriculum search (`searchChunks`, `getChunksByOffering`, `getChunksByChapter`) used by Assistant, Quiz Gen, Homework Helper, Labs, Study Lab |

---

## Cross-agent workflows

- **Auto-grade**: submit → Grading Agent (background) → teacher review → `confirmAll()` → Feedback Writer + Communication Agent fire-and-forget.
- **Communication → practice**: Communication Agent flags a student → `StudyLabService.recommend()` launches a practice set → student notified.
- **Meeting → follow-up**: LiveKit transcripts drain → Struggle Signal Extractor → auto-dispatch → Quiz Engine (`generateForConcept`) + Homework Helper re-explanation, scoped to that student.
| Agent | Type | What it does | Frontend evidence |
|---|---|---|---|
| **Grading Agent** | One hardened LLM call + retrieval, **no tool use** | Scores each rubric criterion of a submission, citing real `RubricCriterion.id`s; runs on `GRADING_IN_PROGRESS` | `gradeSubmission` → `POST /grades/submissions/:id/grade`; review screen with `aiFeedback` + citations |
| **Analysis Agent** | **Plain code decides, LLM only explains** | Deterministic rule flags students (avg of last 3 confirmed <60%, or 2 consecutive drops) → `FAILING`/`DOWNWARD_TREND`/`CONSISTENT_STRUGGLE`; LLM writes `Alert.reason` | `AlertsPage`/`AlertDetailPage`, dashboard alert feeds |
| **Communication Agent(s)** | Pipeline of structured LLM calls (writing enhancement) | From an alert/scores, produce diagnosis, teacher analysis, guardian message + home strategies, teacher feedback, management summary | `AlertDetailPage` sections; `DiagnosisPayload`, `TeacherContentPayload`, `GuardianContentPayload`, `TeacherFeedbackPayload`, `ManagementSummaryPayload` |
| **Assistant Agent** | **The only real tool-calling agent** (max 5 iterations) | Teacher chat: decides what to search (`search_curriculum`), generates drafts, can `create_quiz`; no persisted history | `sendChatMessage` → `POST /assistant/chat`; `AssistantAgentGraph` |
| **Homework Help Agent** | Tool-use loop streamed over SSE | `search_material → search_assignment → search_web`; returns `HINT`/`EXPLANATION` or `REDIRECT_TEACHER` (notifies teacher), with `sources` | `streamHomeworkHelp`; `HomeworkAgentGraph` |
| **Quiz Generator Agent** | Streaming agent | `search_curriculum → generate_questions → review_questions → save_quiz`; grounded in course material | `streamGenerateQuiz`; `QuizAgentGraph`; `GenerateQuizResult` |
| **Lab Generator Agent** | Streaming agent | `search_curriculum → design_game → generate_code`; builds template games or free-form Matter.js code; grounding check (`grounded: false` aborts save) | `streamGenerateLab`; `LabAgentGraph`; `GenerateLabResponse.grounded` |
| **Lab Reviewer Agent** | Separate LLM pass (safety/contract review) | Flags security & contract violations (`reviewFlags` + reasoning); missing objective hook ⇒ rejected | `AI_REVIEW_FAILED` status, `ReviewFlagsPanel` |
| **Study Lab Agent** | Async job pipeline | `QUEUED → GROUNDING → GENERATING → BUILDING`; generates podcasts/slides/study guides/flashcards/practice/cheat sheets from curriculum chunks | `StudyGeneration.stage` polling, stage chips, retry |
| **CSV Mapper Agent** | LLM suggestion (admin confirms) | Maps CSV columns to known fields w/ confidence; never guesses on import | `analyzeCsv`/`analyzeMigrationCsv` responses, mapping tables |
| **Document Categorizer Agent** | LLM classification | `aiSuggestedCategory` + `aiSuggestedStudentId` + `aiMatchConfidence` on uploaded docs; admin confirms | `AdminBulkDocumentsPage`, `StudentDocument` type |
| **Frontend "copilots"** | **Not agents — deterministic local rule engines** | Teacher students-tab, admin, and guardian assistants answer from live query data with regex intents | `teacherStudentsAnswer`, `guardianChildAnswer` (client-side, 420ms fake delay) |

Golden rules (from `specs.md` §3–4, enforced by UX): the AI never has the
final word on grades (`isConfirmed` gates visibility), alert triggers are
code not prompts, every grading citation points to a real retrieved
`RubricCriterion.id`, PII is redacted before any LLM call, and every
structured LLM output is Zod-validated with retry.

---

## 8. The RAG design

**Two independent retrieval paths**, both **pgvector cosine similarity** with
**OpenAI 1536-dim embeddings** (locked decision) and HNSW indexes:

```
RubricCriterion(embedding)          MaterialChunk(embedding)          SubmissionChunk(embedding)
       ▲ (grading path)                     ▲ (curriculum path)                ▲ (long submissions)
       │                                     │                                   │
  gradeSubmission                     search_curriculum /                 grading of long texts
  (retrieves criteria                  /materials/*/search
   for the assignment)
```

### Path 1 — Grading retrieval
- Input: the submission (or, for long submissions, relevant chunks —
  `SubmissionChunk`, ~300–500 tokens, paragraph-boundary aware, ~50-token
  overlap).
- Search space: **all** `RubricCriterion` rows of the assignment — rubrics
  are small (4–8 criteria) so retrieval is intentionally not aggressive
  top-k; nothing like "grammar" is silently skipped because it isn't topically
  similar to the essay.
- Output feeds the Grading Agent; every citation must be one of the actually
  returned criteria.

### Path 2 — Curriculum retrieval (generation + assistant)
- `ClassMaterial` is chunked + embedded **at upload time** into
  `MaterialChunk`; chapters organize it; `MaterialChunk.similarity` returned
  from `/materials/*/search`.
- Consumers:
  - **Assignment generation** (`/assignments/generate-course`) — grounding
    check: no match → `not_grounded` → UI blocks saving.
  - **Quiz generation** (`/quizzes/generate`) — grounded MCQs etc.
  - **Lab generation** (`/labs/generate`) — grounding + the `chapterId`
    scope lever.
  - **Study Lab** — grounding stage, `recommendedForAnalysisId` ties alert
    recommendations to practice sets.
  - **Homework Help** — `search_material`/`search_assignment` steps, and
    `sources` are returned for display.
  - **Assistant Agent** — `search_curriculum` tool.
- **Scope levers in the UI**: chapter (unit) selectors (`__all__` = entire
  course), `topK` params, per-section vs per-course search endpoints.
- Migration SQL (backend): HNSW indexes on all three embedding columns
  (`vector_cosine_ops`).

---

## 9. Client-side deterministic logic worth knowing

| File | Logic |
|---|---|
| `src/lib/attendance-stats.ts` | Day aggregation, rate %, current/best streak, month buckets |
| `src/lib/child-stats.ts` | Guardian summary (confirmed-grades average, attendance rate, one-line summary for the copilot) |
| `src/lib/grade-label.ts` | "Grade N" / name fallback |
| `src/lib/plans.ts` | Plan catalog mirror + checkout routing rules |
| `src/lib/report-sections.ts` | Three-tier report rendering |
| `src/lib/insight-explanations.ts` | Static per-chart explanations + point interpretation sentences |
| `src/lib/deck.ts` | Deck normalization/hydration for study-lab slides |
| `src/lib/csv-parser.ts` | Quote-aware CSV/TSV parser + malformed-input diagnostics |
| `src/lib/import-validation.ts` | Per-row import validation states `ready|attention|invalid` |
| `src/lib/timetable-settings.ts` | Week start (localStorage) + ordered days |
| `src/lib/validations.ts` | zod schemas (login, signup, teacher, guardian, join) |
| `src/lib/join-code.ts` | Join code normalization (trim + uppercase) |
| `src/hooks/use-quiz-session.ts` | Quiz timer/anti-cheat/auto-submit/resume state machine |
| `src/components/labs/lab-harness.ts` | Lab sandbox iframe builder (CSP + postMessage bridge) |

---

## 10. The 3D landing page (marketing)

`/` is a cinematic scroll-driven 3D experience (Three.js + r3f) telling the
EduAI story: a student glb hero walks/falls through 10 scenes —
hello → "the fall" → school gate → portal ring → tunnel → **the school builds
itself** → test paper → robot talk → celebration → pricing finale — with
environment pockets (sky/gate/portal/tunnel/school), warp-flash transitions,
sakura petals, confetti, post-processing, model clips (wave, walk, sit,
celebrate, clap…), all driven by scroll progress (`scroll-driver.ts`,
`progress.ts`, `scenes.ts`, `use-scrubbed-animation.ts`). Overlays (`SectionOverlays`)
carry the actual marketing copy; a `NavBar` links to `/login` and `/pricing`.
It's guarded by `LandingErrorBoundary` (graceful fallback).

---

## 11. Testing & quality gates

- Vitest + Testing Library (~96+ tests): `LabGame`/harness/sandbox frames,
  quiz pages, billing dialogs, CSV parser, import validation, attendance
  stats, insights charts/deltas, chat hooks, membership requests,
  organization, RHF + zod paths.
- `npm run sync:api-types` regenerates `src/types/api-schema.ts` from the live
  backend OpenAPI doc (single source of truth for DTOs).
- Gates: `tsc -b`, `eslint`, `vitest run`, `vite build`.

---

## 12. Glossary of state machines

| Entity | States / transitions |
|---|---|
| Submission | `SUBMITTED → GRADING_IN_PROGRESS → REVIEW_READY → CONFIRMED` |
| Rubric criterion grade | `isConfirmed: false → true` (confirm-all) |
| Rubric | draft → saved → **confirmed** (embeddings generated, irreversible) |
| Quiz | `DRAFT → PUBLISHED → CLOSED`; attempts `IN_PROGRESS → COMPLETED`; answers `isConfirmed` |
| Lab | `GENERATING → PENDING_TEACHER_REVIEW \| AI_REVIEW_FAILED → PUBLISHED \| REJECTED` |
| Study lab generation | `PROCESSING → READY \| FAILED` with `QUEUED/GROUNDING/GENERATING/BUILDING` |
| Meeting | `SCHEDULED → LIVE → ENDED \| CANCELED`; transcript `PENDING/PROCESSING/READY/FAILED` |
| Alert | `NEW/ACKNOWLEDGED → RESOLVED \| DISMISSED` |
| Struggle signal | `PENDING → SENT \| DISMISSED` |
| Join request | `PENDING → APPROVED \| REJECTED` (reopen returns to PENDING) |
| Subscription | `TRIALING → ACTIVE → PAST_DUE \| CANCELED` |
| User verify | token issued → `emailVerifiedAt` set → set-password (needsPassword) |

---

*Document generated from source-reading of `eduai-frontend` (2026-08-17). The
backend repo holds the actual agent/LLM/embedding implementations; this file
describes them as contracted by the API and documented in `specs.md`,
`frontend-specs.md`, `docs/*` and `PLAN-*.md`.*