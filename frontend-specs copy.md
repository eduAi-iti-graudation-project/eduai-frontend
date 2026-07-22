# Frontend Specs (supplement to specs.md)

Read `specs.md` first — this file only covers what's local to this repo.

## Stack

React 18+ · Vite · TypeScript · Tailwind CSS · React Router v6 · TanStack
Query (React Query) · Axios.

No server-side rendering. This is an SPA that talks only to the backend REST
API at a single base URL (configurable via VITE_API_URL). Never talks to the
database, Supabase, or any LLM API directly.

## Roles & Navigation

The sidebar and available routes depend on `user.role` returned from
`GET /auth/me`. Four roles: `TEACHER`, `STUDENT`, `GUARDIAN`, `ADMIN`.

### Teacher sidebar
```
Dashboard         → /
My Classes        → /classes
Alerts            → /alerts
Notifications     → /notifications
Assistant         → /assistant?classId=X
```

### Student sidebar
```
Dashboard         → /
My Assignments    → /assignments
My Grades         → /grades
My Attendance     → /attendance
Notifications     → /notifications
```

### Guardian sidebar
```
Dashboard         → /
My Children       → /children
Reports           → /reports
Notifications     → /notifications
```

### Admin sidebar
```
Dashboard         → /
Alerts            → /alerts
Teachers          → /admin/teachers
Reports           → /reports
Notifications     → /notifications
```

## Screens / Page Inventory

### Shared layout components

| Component | File | Purpose |
|---|---|---|
| `Sidebar` | `components/layout/Sidebar.tsx` | Role-aware nav sidebar |
| `TopBar` | `components/layout/TopBar.tsx` | User name, role badge, unread notification count |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | Color-coded badge: SUBMITTED (gray), GRADING_IN_PROGRESS (blue), REVIEW_READY (yellow), CONFIRMED (green) |
| `ScoreBar` | `components/ui/ScoreBar.tsx` | Visual bar showing points earned / maxPoints |
| `CriteriaRow` | `components/ui/CriteriaRow.tsx` | Single rubric criterion: description, maxPoints, AI score + feedback, teacher input override, confirm checkbox |
| `AlertCard` | `components/ui/AlertCard.tsx` | Alert type icon, student name, reason text, status, resolve button |
| `NotificationItem` | `components/ui/NotificationItem.tsx` | Icon, title, body preview, timestamp, read/unread dot |
| `FileDropzone` | `components/ui/FileDropzone.tsx` | Drag-and-drop PDF upload with progress bar |
| `StudentSearchInput` | `components/ui/StudentSearchInput.tsx` | Autocomplete input for enrolling students |
| `EmptyState` | `components/ui/EmptyState.tsx` | Illustration + message for empty lists |
| `ConfirmDialog` | `components/ui/ConfirmDialog.tsx` | Modal confirmation for destructive actions |

---

### Teacher screens (14)

#### 1. Dashboard (`/`)
**Purpose**: Quick overview of teacher's classes, pending work, and recent alerts.

```
GET /dashboard/overview
```

The backend returns role-shaped data. For TEACHER the shape is:
```json
{
  "classCount": 5,
  "pendingConfirmations": 3,
  "recentAlerts": [ { "id", "studentName", "type", "reason", "createdAt" } ],
  "submissionsNeedingReview": [ { "id", "studentName", "assignmentTitle", "createdAt" } ],
  "unreadNotifications": 2
}
```

Cards: class count, pending confirmations, unread notifications.
Table: submissions needing review (click → submission detail).
Table: recent alerts (click → alert student detail).

---

#### 2. Classes List (`/classes`)
**Purpose**: CRUD classes, see enrollment counts.

```
GET /classes
POST /classes          { name, description? }
DELETE /classes/:id
```

List with name, student count, assignment count. Create button opens modal.

---

#### 3. Class Detail (`/classes/:id`) — Tabs

**Tab 1 — Students**
```
GET    /classes/:id                    (includes enrollments with students)
POST   /classes/:id/enrollments        { studentId }
DELETE /classes/:classId/enrollments/:studentId
```
Student list with remove button. "Add Student" opens search modal.

**Tab 2 — Assignments**
```
GET    /assignments?classId=:id
POST   /assignments          { title, description?, dueDate, totalPoints, classId }
```
List with due date, submission count. Create button → form. Click → assignment detail.

**Tab 3 — Materials**
```
GET    /materials/class/:classId
POST   /materials/upload     multipart: file + { title, classId }
DELETE /materials/:id
GET    /materials/class/:classId/search  ?q&?topK
```
Upload PDF, search bar for semantic search, list with delete.

**Tab 4 — Attendance**
```
GET    /classes/:id/attendance
POST   /attendance/import    { records: [{ studentId, classId, date, status }] }
```
Table grid (rows=students, cols=dates). Import button for bulk CSV upload.

---

#### 4. Assignment Detail (`/assignments/:id`)
**Purpose**: View assignment info, linked rubric, student submissions.

```
GET   /assignments/:id       (includes rubric)
GET   /submissions?assignmentId=:id
GET   /rubrics?assignmentId=:id
```

Header: title, dueDate, totalPoints, class name.
**Rubric section**: link to view/create rubric. If rubric exists and confirmed,
show criteria summary.
**Submissions table**: student name, status badge, score (if confirmed),
actions ("Review" if REVIEW_READY or CONFIRMED, or "Waiting" if SUBMITTED/GRADING_IN_PROGRESS).

---

#### 5. Rubric Builder (`/rubrics?assignmentId=X`)
**Purpose**: Create rubric manually or import from PDF.

```
GET    /rubrics?assignmentId=X
POST   /rubrics             { title, assignmentId, criteria: [{description, maxPoints}] }
POST   /rubrics/import-pdf  multipart: file
PATCH  /rubrics/:id/confirm
```

Two modes:
- **Manual**: "Add criterion" button appends rows. Each row: description input + maxPoints number. Submit creates
  rubric, adds criteria, then redirects to view.
- **Import PDF**: file upload → loading → criteria populated into the same editor for review/edit.
"Confirm" button → embeds criteria, locks editing.

---

#### 6. Submission Detail (`/submissions/:id`)
**Purpose**: View student submission content, AI scores, edit and confirm.

```
GET   /submissions/:id      (includes student, assignment, scores with criteria, chunks)
PATCH /grades/:id/confirm   { pointsAwarded, teacherNotes? }
PATCH /grades/confirm-all/:submissionId
```

**Layout**:
- Left panel: student name + submission content (if chunks, concatenate or
  show with chunk boundary indicators)
- Right panel: per-criterion scores table
  - Each row: criterion description, maxPoints, AI-suggested score + feedback,
    editable points input, optional teacher notes textarea
- "Confirm All" button (bottom) → `PATCH /grades/confirm-all/:submissionId`
  Atomically confirms all scores. Status goes to CONFIRMED.

If status is `SUBMITTED` or `GRADING_IN_PROGRESS`, show a loading indicator
("Grading in progress..."). If `REVIEW_READY`, show scores. If `CONFIRMED`,
show final scores in read-only mode.

---

#### 7. Student Detail (`/students/:id`)
**Purpose**: Teacher's view of a student's grade history, attendance, alerts.

```
GET  /students/:id/grades        (only isConfirmed grades)
GET  /students/:id/attendance
GET  /reports?studentId=:id
```

Grades table per assignment with per-criterion breakdown.
Attendance chart/table.
Alerts list for this student.
Reports list (three-tier).

---

#### 8. Alerts List (`/alerts`)
**Purpose**: View and manage active alerts.

```
GET    /alerts         ?status
PATCH  /alerts/:id     { status: "RESOLVED" }
```

Filter tabs: All / Active / Resolved. Each alert card shows student name,
alert type with color (FAILING=red, DOWNWARD_TREND=orange), reason text,
date. "Resolve" button marks as RESOLVED.

---

#### 9. Notifications (`/notifications`)
**Purpose**: View and manage your own notifications.

```
GET    /notifications?userId=:userId
PATCH  /notifications/:id/read
```

List sorted by newest first. Unread items have a dot/bold title. Click marks
as read. "GRADING_READY" notifications link to the submission detail page.

---

#### 10. Materials (`/materials/class/:classId`)
See Class Detail Tab 3.

---

#### 11. Assistant (`/assistant?classId=X`)
**Purpose**: Chat with AI to generate quizzes or search curriculum.

```
POST /assistant/chat   { classId, messages: [{role, content}], newMessage }
```

Standard chat UI. Messages bubble left (AI) / right (user). When AI responds
with a `quiz` object, render a structured quiz preview (title + questions)
instead of raw text. Conversation resets on page refresh (no persistence).

---

#### 12. Reports (`/reports?studentId=X`)
**Purpose**: View three-tier reports for a student.

```
GET  /reports?studentId=X
GET  /reports/:id
```

List of reports for the student. Click to expand and see all three sections
(parent / teacher / management) with section-labeled tabs or accordion.

---

#### 13. Attendance Import (`/attendance/import`)
**Purpose**: Batch import attendance records.

```
POST /attendance/import  { records: [{ studentId, classId, date, status }] }
```

Form with a date picker, class selector, and a grid of students with
presence/absence/late/excused radio buttons. Submit creates all records.

---

#### 14. Class Attendance (`/classes/:id/attendance`)
**Purpose**: View attendance for a class.

```
GET /classes/:id/attendance
```

Table with rows = students, columns = dates, cells = status badge.
Week/month view toggle.

---

### Student screens (5)

#### 1. Dashboard (`/`)
**Purpose**: Upcoming assignments, recent grades, attendance rate, active alerts.

```
GET /dashboard/overview
```

Student shape:
```json
{
  "upcomingAssignments": [ { "title", "dueDate", "className" } ],
  "recentGrades": [ { "assignmentTitle", "score", "totalPoints", "percentage" } ],
  "attendanceRate": 0.85,
  "activeAlerts": [ { "id", "type", "reason" } ],
  "unreadNotifications": 1
}
```

Cards: upcoming count, attendance %, unread notifications.

---

#### 2. Assignments (`/assignments`)
**Purpose**: View assignments for enrolled classes and submit work.

```
GET  /assignments?classId=:classId   (called per enrolled class)
GET  /submissions?assignmentId=:id   (to check if already submitted)
POST /submissions                    { assignmentId, content }
POST /submissions/import-pdf         multipart: file + assignmentId
```

List grouped by class. Each item: title, due date, status (Not Submitted,
Submitted, Graded). Click → detail.

**Submit modal**: text area (paste essay) OR file upload (PDF). Frontend picks
the endpoint (`POST /submissions` for text, `POST /submissions/import-pdf`
for file). After submit, show "Submitted — awaiting teacher review" message.

---

#### 3. Submission Status (`/submissions/:id`)
**Purpose**: Check submission status and view confirmed grade.

```
GET /submissions/:id    (includes scores only if CONFIRMED)
```

If `SUBMITTED` / `GRADING_IN_PROGRESS`: "Your submission is being reviewed."
If `REVIEW_READY`: "Awaiting teacher confirmation."
If `CONFIRMED`: per-criterion scores table, total score, teacher notes.

---

#### 4. My Grades (`/grades`)
**Purpose**: All confirmed grades across all assignments.

```
GET /students/:id/grades
```

List by assignment with total score / total possible. Click to expand
per-criterion breakdown (criteria description, points earned, AI feedback).

---

#### 5. Attendance (`/attendance`)
**Purpose**: View personal attendance record.

```
GET /students/:id/attendance
```

Calendar or table view: date, class name, status badge.

---

### Guardian screens (3)

#### 1. Dashboard (`/`)
**Purpose**: Overview of all linked children.

```
GET /dashboard/overview
```

Guardian shape:
```json
{
  "children": [
    {
      "id", "name", "className",
      "overallAverage": 82,
      "attendanceRate": 0.9,
      "activeAlertCount": 1,
      "unreadReportCount": 1
    }
  ],
  "unreadNotifications": 2
}
```

Cards per child with mini stats. Click → child detail.

---

#### 2. Child Detail (`/children/:id`)
**Purpose**: Read-only view of a child's progress.

```
GET  /students/:id/grades
GET  /students/:id/attendance
GET  /reports?studentId=:id
```

Same layout as teacher's student detail but read-only — no edit buttons,
no confirm controls. Tabs: Grades, Attendance, Reports.

---

#### 3. Reports (`/reports?studentId=:id`)
**Purpose**: View the parent-friendly section of each report.

```
GET  /reports?studentId=:id
```

List of reports. Each shows only the `parentSection` (the parent-friendly
plain-language explanation). Teacher and management sections are hidden.

---

### Admin screens (4)

#### 1. Dashboard (`/`)
**Purpose**: School-wide overview.

```
GET /dashboard/overview
```

Admin shape:
```json
{
  "teacherCount": 10,
  "studentCount": 250,
  "classCount": 30,
  "flaggedStudentCount": 5,
  "averagePassRate": 0.74,
  "pendingReportCount": 2,
  "teachers": [ { "id", "name", "classAverage", "studentCount" } ]
}
```

Cards: counts, pass rate, flagged students. Teacher list table.

---

#### 2. Alerts (`/alerts`)
Same as Teacher's alerts view. Can also resolve/dismiss.

---

#### 3. Reports (`/reports`)
**Purpose**: View all management-section reports.

```
GET  /reports
GET  /reports/:id
```

List all reports across the school. Click to see `managementSection`.

---

#### 4. Notifications (`/notifications`)
Same as Teacher/Student notifications view.

---

## React Router Config

```tsx
const teacherRoutes = [
  { path: '/', element: <TeacherDashboard /> },
  { path: '/classes', element: <ClassesList /> },
  { path: '/classes/:id', element: <ClassDetail /> },
  { path: '/assignments/:id', element: <AssignmentDetail /> },
  { path: '/rubrics', element: <RubricBuilder /> },
  { path: '/rubrics/:id', element: <RubricView /> },
  { path: '/submissions/:id', element: <SubmissionDetail /> },
  { path: '/students/:id', element: <StudentDetail /> },
  { path: '/alerts', element: <AlertsList /> },
  { path: '/notifications', element: <NotificationsList /> },
  { path: '/assistant', element: <Assistant /> },
  { path: '/reports', element: <ReportsList /> },
  { path: '/attendance/import', element: <AttendanceImport /> },
];

const studentRoutes = [
  { path: '/', element: <StudentDashboard /> },
  { path: '/assignments', element: <StudentAssignments /> },
  { path: '/submissions/:id', element: <SubmissionStatus /> },
  { path: '/grades', element: <MyGrades /> },
  { path: '/attendance', element: <MyAttendance /> },
  { path: '/notifications', element: <NotificationsList /> },
];

const guardianRoutes = [
  { path: '/', element: <GuardianDashboard /> },
  { path: '/children/:id', element: <ChildDetail /> },
  { path: '/reports', element: <ReportsList /> },
  { path: '/notifications', element: <NotificationsList /> },
];

const adminRoutes = [
  { path: '/', element: <AdminDashboard /> },
  { path: '/alerts', element: <AlertsList /> },
  { path: '/reports', element: <ReportsList /> },
  { path: '/notifications', element: <NotificationsList /> },
];
```

## API Client Conventions

- **Base URL**: `VITE_API_URL` env var, defaults to `http://localhost:3000`
- **Auth**: Send `Authorization: Bearer <token>` header from auth response
- **Query keys**: Use TanStack Query with structured keys:
  ```
  ['classes']
  ['class', id]
  ['assignments', { classId }]
  ['submissions', { assignmentId }]
  ['submission', id]
  ['scores', { submissionId }]
  ['alerts', { status }]
  ['notifications', { userId }]
  ['reports', { studentId }]
  ['dashboard']
  ```
- **Mutations**: Invalidate related queries on success:
  - Create submission → invalidate `['submissions']`
  - Confirm all → invalidate `['submission', id]`, `['scores', { submissionId }]`, `['dashboard']`
  - Resolve alert → invalidate `['alerts']`, `['dashboard']`

## File upload endpoints

Three endpoints accept file uploads. All use `multipart/form-data`:

| Endpoint | Field name | Extra fields |
|---|---|---|
| `POST /rubrics/import-pdf` | `file` | — |
| `POST /submissions/import-pdf` | `file` | `assignmentId` (string) |
| `POST /materials/upload` | `file` | `title` + `classId` |

Use `FormData` and `axios.post` with `Content-Type: multipart/form-data`.
Show a `FileDropzone` component with upload progress.

## End-to-end flows (user stories)

### Teacher grades a submission
```
1. Teacher logs in → Dashboard shows pending confirmations count
2. Teacher clicks a submission in "Needs Review" table
3. Submission detail page loads (GET /submissions/:id)
4. If status is GRADING_IN_PROGRESS, show spinner
5. If status is REVIEW_READY, show AI-suggested scores per criterion
6. Teacher edits any pointsAwarded + adds notes
7. Teacher clicks "Confirm All Grades" button
8. PATCH /grades/confirm-all/:submissionId fires
9. On success: status badges update to CONFIRMED, dashboard count refreshes
10. Analysis runs on server, alert may be created, report auto-generated
```

### Student submits work
```
1. Student logs in → Dashboard shows upcoming assignments
2. Student clicks an assignment → sees due date, submission form
3. Student pastes text OR uploads PDF → clicks Submit
4. POST /submissions or POST /submissions/import-pdf fires
5. Response returns immediately with { id, status: "SUBMITTED" }
6. Student sees "Submitted — awaiting teacher review"
7. In background: grading agent runs → teacher notified
8. Later: teacher confirms → student sees grades on /grades
```

### Teacher uses AI Assistant
```
1. Teacher navigates to /assistant?classId=X
2. Teacher types "Create a 5-question quiz about photosynthesis"
3. POST /assistant/chat sent with newMessage
4. AI responds with reply text + optionally a quiz object
5. If quiz exists, render as structured form (title + question cards)
6. Conversation continues in-memory (resets on page refresh)
```

### Alert + Report auto-flow
```
1. Teacher confirms grades → analysis evaluates student
2. If threshold tripped → Alert created (status: ACTIVE)
3. Report auto-generated (three sections)
4. Notifications created + emailed to teacher, guardian, admin
5. Teacher sees new alert on dashboard next refresh
6. Teacher opens /alerts, reviews, clicks "Resolve"
7. PATCH /alerts/:id { status: "RESOLVED" }
```

## Auth flow (placeholder until Supabase Auth is wired)

```
1. User visits app → not logged in → redirect to /login
2. Login form: email + password → POST /auth/login
3. Response: { id, email, name, role }
4. Store token (from response) in localStorage, user object in React context
5. On app load: GET /auth/me with stored token to validate session
6. On 401: clear localStorage, redirect to /login

Signup: POST /auth/signup { email, password, name, role }
Role selection on signup: TEACHER or STUDENT (GUARDIAN/ADMIN created by admins)
```

## Future work (post-MVP)

- **Push notifications** via FCM — requires `DeviceToken` registration from the
  frontend (`POST /device-tokens` — not yet implemented)
- **Pagination** on long lists (submissions, notifications, reports)
- **Real-time updates** — WebSocket or polling for grading status changes
- **Offline support** — cache recently viewed submissions
- **Student report visibility** — link from alert to generated report
