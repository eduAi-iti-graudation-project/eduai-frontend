# TASKS.md — Frontend Migration & Features

> Read `AGENTS.md`, `specs.md`, `frontend-specs.md`, and `DESIGN.md` first.
> Design system: "Chalkboard Playful" (`DESIGN.md`) — tokens live in
> `src/index.css` `@theme`. Never create a new design system (`deigns.md`).
> Icons stay **Material Symbols** (team decision — do not swap to lucide
> except where a shadcn component requires it internally).
> Every task: run `npm run lint` + `npm run test` + `npm run build` locally.
> Real logic gets vitest tests; UI-only work is marked "N/A".

---

## Phase 0 — shadcn foundation

### T0 — Token audit
- Add `--color-destructive` to `@theme` in `src/index.css` (currently only
  `--color-destructive-foreground` exists; `bg-destructive` renders nothing).
- Delete the stale legacy HSL block (`.light { --card: …; --destructive: …; }`
  — Tailwind-v3-era shadcn vars, unused under Tailwind v4).
- Verify every token referenced by shadcn components resolves in `@theme`
  (card, popover, muted, accent, destructive, ring, input, border, radius).
- Build a smoke page using `Dialog`, `Select`, and `Tabs` to prove tokens wire up.
- Tests: N/A (config-only).

### T1 — Install shadcn primitives
- `npx shadcn@latest add` (Tailwind v4, `components.json` already configured):
  `dialog`, `alert-dialog`, `dropdown-menu`, `select`, `tabs`, `table`, `badge`,
  `skeleton`, `progress`, `tooltip`, `popover`, `sheet`, `separator`, `avatar`,
  `switch`, `radio-group`, `scroll-area`, `accordion`, `alert`.
- Verify each new component compiles and resolves theme tokens.
- Tests: N/A.

### T2 — Shared patterns (extract once, shadcn-based)
- `PageHeader` (title + actions slot), `StatCard`, `LoadingState`,
  `ErrorState` (retry action) — currently copy-pasted into nearly every page.
- Reuse the existing `communication/DashboardStatCard` conventions; keep
  DESIGN.md styling (rounded-full CTAs, `tactile-card` borders, M3 tokens).
- Tests: N/A (layout only).

---

## Phase 1 — Replace custom `ui/` components (one PR each)

- **T3** — `ConfirmDialog` + `NotificationDetailDialog` → `Dialog`.
- **T4** — `StatusBadge` → `Badge` (preserve color semantics: SUBMITTED gray,
  GRADING_IN_PROGRESS blue, REVIEW_READY yellow, CONFIRMED green).
- **T5** — `ScoreBar` → `Progress`.
- **T6** — `EmptyState` → Card-based, keep the illustration.
- **T7** — `AlertCard` / `NotificationItem` / `UserMenu` →
  `Card` + `Badge` + `Avatar` + `DropdownMenu`.
- Each PR updates all call sites; keep exported names where cheap so pages
  don't churn twice. Tests: N/A (pure UI swap).

---

## Phase 2 — Migrate pages to shadcn (one PR per group; parallel pickup)

Each group: replace raw Tailwind markup with the installed primitives and the
T2 shared patterns. Preserve the DESIGN.md visual identity (cream/navy/coral,
Quicksand headlines, rounded-full CTAs). Verify visual parity before opening.

- **T8 — Auth + shared**: `LoginPage`, `SignupPage`, `NotFoundPage`.
- **T9 — Teacher core**: `TeacherDashboardPage`, `ClassesPage`, `ClassDetailPage`,
  `AlertsPage`, `SubmissionsPage`, `AssignmentDetailPage`.
- **T10 — Teacher grading**: `SubmissionDetailPage`, `StudentDetailPage`,
  `RubricsPage`, `RubricConfirmPage`.
- **T11 — Teacher extras**: `AssistantPage`, `SettingsPage`, `SupportPage`,
  `NotificationsListPage`, `ReportsPage`, `QuizzesPage`, `QuizEditorPage`,
  `QuizAttemptsListPage`, `QuizAttemptDetailPage`, `AttendanceImportPage`,
  `GradeListPage`, `ClassesInGradePage`, `AlertDetailPage`.
- **T12 — Student**: `StudentDashboardPage`, `StudentAssignmentsPage`,
  `MyGradesPage`, `MyAttendancePage`, `StudentQuizzesPage`, `QuizTakePage`,
  `StudentQuizResultPage`, `HomeworkHelpPage`, `HomeworkHelpHistoryPage`,
  `SubmissionStatusPage`, `AvailableClassesPage`, `StudentClassGradesPage`,
  `StudentAssignmentGradePage`.
- **T13 — Guardian**: `GuardianDashboardPage`, `ChildDetailPage`,
  `GuardianAlertDetailPage`.
- **T14 — Admin**: `AdminDashboardPage`, `AdminAlertsPage`, `AttendancePage`,
  `GradeManagementPage`, `StudentGradesPage`, `StudentManagementPage`.

Tests: N/A per group unless new logic is introduced (then vitest, required).

---

## Phase 3 — Dashboard Insights (contract: `dashboard-insights-frontend.md`)

Backend owner: Ahmed Selim (backend TASKS.md Task 4). The frontend only
renders what the backend declares — never compute trends/deltas/chart types
client-side.

### T15 — API types + client
- Blocked until `GET /dashboard/insights` is live, then run
  `npm run sync:api-types` (hard rule: never hand-guess an API shape) so
  `InsightsResponse` / `InsightSection` / `AgentInsight` land in
  `src/types/api-schema.ts`.
- Add `getDashboardInsights(interval)` and `getStudentInsights(studentId,
  interval)` to `src/lib/api.ts` typed from the schema.
- Query keys: `['dashboard-insights', { interval }]` and
  `['dashboard-insights', { studentId, interval }]`.

### T16 — Generic chart components (pure, chartType-driven)
- One component per chart type, driven only by `InsightSection`:
  `TrendLineChart` (line), `TrendAreaChart` (area), `ComparisonBarChart` (bar),
  `StrengthRadarChart` (radar — one series item per axis),
  `DonutChart` (donut — one series item per segment, `innerRadius={60}`).
- Recharts (already in `package.json`).
- Tests: chartType → component mapping function.

### T17 — Insight UI parts
- `DeltaBadge`: shown only when `delta` exists; `up` → green ↑, `down` → red ↓,
  `flat` → gray →, with signed percent (`+12.5%` / `-8%`).
- `InsightSectionCard`: backend `title` + optional badge + chart; when
  `series.length === 0` render title + "No data yet" placeholder (never an
  empty chart).
- `AgentInsightCard`: narrative list cards from `agentInsights`.
- Tests: DeltaBadge direction/color/format; empty-state branch.

### T18 — Insights pages per role
- New routes `/insights` for TEACHER / STUDENT / GUARDIAN / ADMIN, linked from
  the role sidebar; week/month toggle (`interval` param, default `week`).
- Guardian renders per-child sections (`child_<id>_*` keys) — render as
  declared, no per-child code paths.
- React Query data refresh; no polling loop for MVP.
- Tests: interval toggle wiring + query key shape.

### T19 — Student drill-down page
- `GET /dashboard/insights/students/:id` for teachers (own classes), guardians
  (own wards), admin; student self-only.
- `403` → route to an error state (per contract).
- Tests: N/A (page) unless access-handling logic is extracted.

---

## Conventions

- shadcn components keep DESIGN.md tokens — rounded-full primary CTAs,
  `tactile-card` borders, M3 surface palette.
- Icons: Material Symbols everywhere unless a component forces lucide.
- Branching: one feature branch per task group → PR into `dev` (1 review + CI).
- Tests are not optional: every task with real logic includes vitest tests;
  UI-only tasks state "N/A" explicitly.
