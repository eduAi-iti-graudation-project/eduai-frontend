# PLAN: Per-section timetable editor + configurable week start

**Status:** approved — frontend-only, no backend changes.
**Decisions:** (1) grid shows ONLY the selected section's week; (2) week start configurable via a browser setting (localStorage), no backend.

## Context
- Backend is already course-offering-based: `TimetableSlot.courseOfferingId` → offering = course × section × teacher. A slot IS "a course for a section on a day/time". No backend work needed.
- Gap is purely the admin editor: `AdminTimetablePage` shows ALL slots from ALL sections in one grid, and the CreatePopover lists every offering in the school flat.

## Changes

### 1. NEW `src/lib/timetable-settings.ts`
- `type WeekStart = "MONDAY" | "SUNDAY"`
- `getWeekStart()` / `setWeekStart()` — localStorage key `eduai.timetable.weekStart`, default `MONDAY`.
- `orderedDays(): DayOfWeek[]` — `DAY_ORDER` rotated so SUNDAY comes first when configured.

### 2. `src/pages/admin/AdminTimetablePage.tsx`
- Queries: `getAllGrades()` (grades), `getClasses()` (sections, filtered by `gradeLevelId`), `getOfferings()` (for the filtered picker).
- State: `selectedGradeId`, `selectedSectionId`; default = first grade with sections + its first section; fallback if selection disappears.
- Slots query: `getSectionTimetable(selectedSectionId)` (query key `["timetable","section",id]`) — replaces `getAllTimetableSlots()`.
- Header: Grade dropdown → Section dropdown + small Settings control ("Week starts: Monday | Sunday").
- Grid receives `sectionId` (picker filter) + `days={orderedDays()}`.
- Empty state when no section exists / none selected.

### 3. `src/components/timetable/WeeklyTimetableGrid.tsx`
- New prop `sectionId?: string` — CreatePopover filters `offerings` to `o.section.id === sectionId` (subtitle keeps teacher name).
- Popover empty state: "No course offerings for this section — create them in Grade Management".
- Default `days = orderedDays()` so the browser setting applies to ALL timetable views (student/guardian/teacher).
- Mobile day-switcher init: derive today's index from the effective `days` list (works under both orders).

## Unchanged
- Slot model, drag/move/resize/delete, live conflict checks (server-side, global), backend, student/guardian/teacher views' data.

## Verify
- `npx tsc -b` + eslint clean.