# PLAN: Material chapters auto-detection fix

**Status:** approved.
**Context:** Uploaded `science301-cell-biology` PDF showed "No chapters yet" though upload succeeded. Root cause: the PDF has exactly **1** detectable chapter heading (`Chapter 1: Cell Biology —`), but auto-creation requires `>= 2` (`materials.service.ts:125`). File sits in "Ungrouped"; `material_chapters` is empty.

**Not in scope:** the download URL issue — verified working end-to-end (signed URL → 200, real PDF). It was a stale artifact of earlier storage misconfiguration.

## Changes

### 1. Backend `src/materials/materials.service.ts`
- Auto-chapter threshold: `detected.length >= 2` → `>= 1`. TOC filtering already guards against false positives.

### 2. Backend `src/materials/chapter-detector.ts`
- Title cleanup: strip **1+** trailing separator chars (currently only 2+) and include en/em dashes, so `"Chapter 1: Cell Biology —"` → `"Chapter 1: Cell Biology"`.

### 3. Frontend `CourseMaterialsTab.tsx` + `ClassMaterialsTab.tsx`
- After upload with `detectedChapterCount === 0`: toast "No chapter headings found — file added to Ungrouped".
- Empty state when `sortedChapters.length === 0 && unassigned.length > 0`: "No chapters yet — N file(s) are ungrouped below. Create a chapter, then drop the file onto it."

### 4. Tests / verification
- Update `materials.service.spec.ts` if it asserts the `>= 2` threshold; run backend materials jest suite.
- Frontend: `npx tsc -b` + eslint.

### 5. Backfill
- User re-uploads the PDF via the UI after the fix (no script needed).
