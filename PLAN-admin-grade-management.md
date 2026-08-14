# PLAN: Admin Academic Structure Console (Grades page redesign)

**Status:** Approved — frontend-only, master-detail layout.

## Goal

Rewrite the admin "Grades & Faculty" page (`src/pages/admin/GradeManagementPage.tsx`) from a flat
accordion into a full **grades → sections → courses** hierarchy console with richer stat cards.

No backend changes: all CRUD endpoints already exist (grades, sections via `/classes`, courses).

## Scope

1. **`src/lib/api.ts`** — add courses wrappers (only missing piece):
   - `getCourses()` → `GET /courses`
   - `createCourse({ gradeLevelId, name, description? })` → `POST /courses`
   - `updateCourse(id, { name?, description? })` → `PATCH /courses/:id`
   - `deleteCourse(id)` → `DELETE /courses/:id`
   - `CourseDto` type alias from swagger schema (pattern of `ClassDto`).
   - Sections/grades wrappers already exist (`createClass`/`updateClass`/`deleteClass`/`getClasses` = sections).

2. **`src/pages/admin/GradeManagementPage.tsx`** — full rewrite:
   - **Stat band**: 5 `PrecisionStatCard`s (reused from dashboard — sparkline + compact delta
     badge): Grade levels, Sections, Courses, Offerings, Students rostered.
   - **Master-detail layout** (StudentManagementPage pattern):
     - Left: grade cards (level chip, name, `sections · courses · students` counts), selected
       state, sorted by level, first selected by default; horizontal chips on mobile.
     - Right detail panel (selected grade):
       - Header with counts + **New Section** / **New Course** buttons.
       - **Sections panel**: student count, read-only course chips, teacher dropdown
         (`assignTeacherToClass`), inline rename, delete with confirm.
       - **Courses panel**: description, inline rename, delete with confirm.
       - Inline create forms; empty states; no-teachers helper note.
   - Data: single fetch each of grades / sections (`_count` decorated) / courses / teachers /
     students; filter client-side by selected grade.
   - Old "add/remove existing class" flow removed (sections created inside selected grade —
     same backend effect).
   - `MiniStat.tsx` untouched (still used on AdminAssistantPage).

3. **Verification**: `npx tsc -b` + `npm run lint` in `eduai-frontend`. Backend untouched.

## Data model reference

- `GradeLevel` (grade) → has `sections`, `courses`, `students`
- `Section` ("class" in UI terms) → grade, enrollments (students), offerings
- `Course` (subject) → grade, materials/chapters
- `CourseOffering` = course × section × teacher (created via `POST /classes/:id/teacher`,
  auto-picks first course of the grade — read-only chips on this page)

## API surface used

| Action | Endpoint | Wrapper |
|---|---|---|
| List grades | `GET /grades` | `getAllGrades` (exists) |
| Create grade | `POST /grades` | `createGrade` (exists) |
| List sections | `GET /classes` | `getClasses` (exists) |
| Create section | `POST /classes` | `createClass` (exists) |
| Rename section | `PATCH /classes/:id` | `updateClass` (exists) |
| Delete section | `DELETE /classes/:id` | `deleteClass` (exists) |
| List courses | `GET /courses` | `getCourses` (new) |
| Create course | `POST /courses` | `createCourse` (new) |
| Rename course | `PATCH /courses/:id` | `updateCourse` (new) |
| Delete course | `DELETE /courses/:id` | `deleteCourse` (new) |
| List students | `GET /users?role=STUDENT` | `getUsers` (exists) |
| List teachers | `GET /users?role=TEACHER` | `getUsers` (exists) |

---

## v2 — Section × Course teacher matrix (approved)

The original design collapsed teacher assignment to one per section via
`POST /classes/:id/teacher`, which auto-picks the FIRST course of the grade. Wrong:
an offering is **course × section × teacher** (Grade 10 → sections A/B × courses
English/Math/Science, each cell its own teacher). The backend `offerings` module
already provides the full CRUD; only the frontend was missing it.

### api.ts additions (v2)

- `getOfferings()` → `GET /offerings` (admin sees all; response includes course,
  section, teacher)
- `createOffering({ courseId, sectionId, teacherId })` → `POST /offerings`
- `updateOffering(id, { teacherId })` → `PATCH /offerings/:id`
- `deleteOffering(id)` → `DELETE /offerings/:id`
- Local `OfferingEnriched` type (offering + course + section + teacher)

### GradeManagementPage changes (v2)

- Remove the per-section teacher dropdown (and all `assignTeacherToClass` usage —
  endpoint stays for API compat).
- New **Assignment Matrix** panel for the selected grade, above sections/courses:
  - Rows = sections (with student counts), columns = courses, cells = teacher select.
  - Offering exists → select shows current teacher; change = `PATCH` (reassign,
    teacher history logged backend-side).
  - No offering → "Assign…" placeholder; picking a teacher = `POST` (create).
  - Trash icon on assigned cells → `DELETE` with `window.confirm` (removes the
    offering and its assignments/quizzes/materials).
  - Horizontal scroll on mobile; disabled cells + note when no teachers; hints when
    a grade lacks courses or sections.
- Sections/courses panels otherwise unchanged; course chips per section now reflect
  the section's actual offerings.
- Invalidation set += `["admin-offerings"]`.

### Verification (v2)

- `npx tsc -b` + `npm run lint` in `eduai-frontend`. Backend untouched.