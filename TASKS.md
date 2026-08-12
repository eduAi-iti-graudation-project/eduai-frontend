# EduAI Tasks

## Completed (local, no PR): 3D scroll-story landing page (2026-08-11)

- Replaced the static `LandingPage` with a scroll-driven 3D story at `/` (guests only):
  ONE fixed full-viewport `<Canvas>`, a 700vh invisible DOM wrapper owns the wheel,
  Lenis + GSAP ScrollTrigger (scrub: 1) write one module-level `scrollState.value`
  (0..1) that drives the camera curve, character clips/positions, and every DOM overlay.
- Architecture: `src/landing/` — `config.ts` (env-driven model paths + clip names,
  defaults per spec), `progress.ts` (singleton + band math), `scroll-driver.ts`
  (Lenis/ScrollTrigger + rAF subscriber loop), `CameraRig.tsx` (two centripetal
  CatmullRom curves: camera position + aim), `characters/` (one AnimationMixer per
  rig at useFrame priority 1; scrubbed actions paused + `action.time` set at
  priority 0, so pose ⇄ scroll is exact both directions; once-clips via
  `setLoop(LoopOnce) + clampWhenFinished + crossFade`), `effects/Portal.tsx`
  (emissive torus + custom swirl ShaderMaterial + Bloom), `world/` (low-poly
  street + classroom interior), `SectionOverlays.tsx` (plain-DOM text driven by
  the shared timeline via refs — zero re-renders), `LoadingGate.tsx` (useProgress
  % + "missing model" error panel), `LandingErrorBoundary.tsx`.
- Story (7 bands): intro → walk to school (scrubbed Walk, pose time + world
  position share one parameter) → data portal → attendance check-in card →
  teacher drafting (Write scrubbed) + robot → flagged-student feedback card →
  student runs BACK along the path to the square, parents clap, robot swoops in.
- Route-level code-split: `LandingPage` Suspense-lazy imports `LandingExperience`;
  build output verified — `WebGLRenderer` only in the `LandingExperience` chunk,
  absent from the main `index` bundle.
- Config: copy `.env.example` → `.env.local` to point at real model paths/clip
  names (5 GLBs: `public/models/{student,teacher,parent-a,parent-b,robot}.glb`).
  Until those exist, the page shows a precise "asset failed to load" panel
  instead of crashing. Clip names must match the export (defaults: Idle/Wave/
  Walk/Sit/Think/Celebrate, teacher Idle/Write/Sit, parents Idle/Clap; the
  student model is cloned per-rig via SkeletonUtils.clone).
- NOTE on lint: repo has React 19's new react-hooks rules (immutability, purity,
  set-state-in-effect, refs) — three.js objects from hooks are mutated only
  through refs (`sceneRef` etc.), particle layout uses a seeded PRNG, and the
  scene background/fog are declarative (`<color attach="background">`).
- Verified: `eslint .` clean, `tsc -b` clean, `vite build` clean.
  Manual browser verification (scroll speeds, backwards scroll, band feel) is
  still the user's pass.

## Completed: models wired in + compressed (2026-08-11)

- `.env.local` created from `.env.example` — maps the code's clip roles to the
  actual GLB clip names (`idle/waving/walking/sitting/thinking/victory`,
  teacher `writing/sitting`, parents `clapping`). Without it `findClip` threw
  and the error boundary showed instead of the story.
- Runtime verified headlessly (Chromium `--headless=new` + virtual time budget
  against the dev server): all 5 GLBs return 200, loading gate clears, all 7
  chapter overlays + CTA render, zero error panels, no console crashes.
- Asset size: 191MB → ~20MB total. `teacher.glb` 64→4.2MB, `parent-a.glb`
  57→2.9MB, `parent-b.glb` 61→3.3MB via `@gltf-transform/cli optimize`
  (`--compress draco --texture-compress webp`). Clips + skins intact
  (verified in the GLB JSON). drei's `useGLTF` ships its own DRACOLoader, so
  no decoder files were needed. Student (7.4MB) and robot (2.5MB) untouched.
  Originals backed up at `/tmp/eduai-models-orig/`.


## Completed: Demo8.5 — LobbyPanel overflow + meetings join (2026-08-09)

- `LobbyPanel` pre-join screen no longer clips on short windows: `min-h-dvh` + `overflow-y-auto` shell, card widened `max-w-md → max-w-xl` with `my-auto`, video capped `max-h-[42vh]` + `object-contain`, `min-w-0` guards on field stack. Verified at 768px/900px viewport heights.
- `POST /meetings/:id/join` 500 fix was backend-side (placeholder LiveKit creds) — backend now issues tokens against the real `wss://eduai-dczlzhyd.livekit.cloud` URL; join verified 201 with token + room; existing `call.error` panel shows a graceful message if LiveKit is unreachable.

## Completed: Demo8 — grades/classes console + migration wizard (2026-08-09)

- Root cause: the admin/teacher grade & class console called `/grades` and `/classes` endpoints that did not exist in the backend (only `/grade-levels` and `/sections` did) → "no added grades" + "This item could not be found. It may have been removed." on every write.
- Backend: new `classes` module (`GET/POST/PATCH/DELETE /classes`, `POST /classes/:id/teacher`, enrollments) — thin adapter over `SectionsService` that also computes `teacherId` from the section's first offering (sections carry no teacher; teachers attach at the offering level).
- Backend: new `grades` console module (`GET/POST /grades`, `GET/POST /grades/:gradeId/classes`, `DELETE /grades/:gradeId/classes/:classId`) — reuses `GradeLevelsService`/`ClassesService`; classes under the legacy `grade-levels`/`sections` prefixes untouched.
- Backend: migration wizard endpoints that existed in the frontend but not the server — `POST /migration/csv/analyze-pasted` (TSV sniffing) and `GET /migration/csv/template` (blank CSV matching `TEMPLATE_HEADERS` for the deterministic mapping path).
- Frontend: `ClassDto` now maps to the generated `ClassDto` schema (adds `teacherId`); `assignTeacherToClass()`; `GradeManagementPage` "change teacher" select now actually assigns (was `updateClass(id, {})` — a no-op) and "New Class" assigns the chosen teacher; dead `assignGradeToTeacher`/`removeGradeFromTeacher` helpers removed.
- Frontend: migration wizard routed at `/admin/migration` + "Import Students" nav item (page existed but was unreachable).
- Verified live: grade 10 lists its 3 classes with teachers, grade creation 201, TSV paste maps columns, template download + deterministic analyze, 689 backend tests / 89 frontend tests.

## Completed: Demo7 — communication agent + remediation UI (2026-08-09)

- Study Lab student page: recommended-practice items are highlighted (primary border + "Recommended practice" label + spark icon) in History.
- Teacher alert detail: new "Recommended practice" card listing generations linked to the alert's analysis with status chips and a hint that the student sees the set in Study Lab.
- `GET /notifications` changed from a `userId` query param to the authenticated user; `getNotifications()` in `lib/api.ts` and `useNotifications()` no longer take/deserialize `userId` (NotificationBell + NotificationsListPage updated). Same page as before otherwise.
- Types synced via `sync:api-types` (`recommendedForAnalysisId` on study generations, `recommendations` in alert teacher-detail response).
- Verified live: teacher confirms Sam's poetry submission → guardian/student/teacher bell notifications, alert detail shows the READY practice set, student Study Lab shows "Recommended practice".

## Active: W1 — Fix attachments end-to-end

The teacher-uploaded attachment is broken today:

1. Frontend `getMaterials()` calls `/materials/class/{id}`, backend serves `/materials/offering/{courseOfferingId}` → 404
2. `GET /materials/:id/file` (signed URL) exists but is never called; teacher "View" button links the raw storage path
3. Students have zero access to materials — no assignment↔material link, nothing in the student UI

### Steps

- [x] Backend: add optional `assignmentId` to `Material` (prisma schema + migration)
- [x] Backend: `uploadMaterial` associates the file with the assignment (controller/service/DTO)
- [x] Backend: list materials by assignment (`GET /materials/assignment/:assignmentId`) with enrollment-scoped access check
- [x] Frontend: fix `getMaterials()` route drift `/materials/class` → `/materials/offering` (`lib/api.ts` vs `materials.controller.ts`)
- [x] Frontend: add `getMaterialFileUrl(id)` wrapper for the signed-URL endpoint
- [x] Frontend: student assignment list shows attachments with working download (signed URL)
- [x] Frontend: fix teacher `ClassDetailPage` "View" button to use the signed URL
- [x] Build + tests green (backend `npm run build`, `npm test` 630/630; frontend `tsc`, `npm run build`)

## Active: W2 — Chapter-based material organization (C: hybrid auto + manual)

Materials were a flat, unchunked file list. Chapters give structure: auto-detected from uploaded documents, then teacher-managed.

- [x] Schema: `MaterialChapter` (courseOfferingId, title, order) + `Material.chapterId` (nullable) + migration `materials_chapters`
- [x] Chapter detector (`chapter-detector.ts`): heading heuristics (`Chapter|Unit|Lesson|Module|Part|Section|Topic N`, roman/word numerals), TOC skip via dot-leader + dense-cluster rules, repeat-heading dedupe — no LLM pass
- [x] `upload` auto-creates chapters when ≥2 headings detected (order from max), links file to first chapter, returns `detectedChapterCount`; explicit `chapterId` upload skips detection
- [x] Chapter CRUD: `POST /materials/chapters`, `PATCH /materials/chapters/:id` (title/order), `DELETE /materials/chapters/:id` (files → ungrouped via `SetNull`)
- [x] Move file: `POST/DELETE /materials/chapters/:id/materials/:materialId` (link/unlink, same-class validation)
- [x] Grouped listing `GET /materials/chapters/offering/:courseOfferingId` → `{ chapters: [{..., materials}], unassigned }`
- [x] `searchChunks` / `searchChunksByCourse` gain optional `chapterId` filter + `chapterTitle` via LEFT JOIN; homework-helper & quiz search-curriculum tools spell the chapter in results
- [x] Teacher UI (`ClassMaterialsTab`): chapters accordion, create/rename/delete, reorder (arrows + drag), drop PDFs onto a chapter (queued upload with chapterId), bulk multi-file upload, drag material chips between chapters; DB/confirmation toasts
- [x] Student UI: `StudentMaterialsPage` at `/student/classes/:classId/materials` (linked from class page) — chapters, per-file signed-URL downloads, unassigned "General" section
- [x] Tests: detector spec (4), upload-with-chapters spec, chapters CRUD spec, controller route spec — 655/655 green; frontend `tsc` + `eslint` + `build` clean

## Active: W3 — Grade-based auto-enrollment (remove join request flow)

Students are auto-enrolled in ALL offerings of their grade — no join button, no teacher approval. Teachers keep remove/re-add with a persistent exclusion (REJECTED marker).

- [x] Removed `joinClass` / `getClassRequests` / `approveEnrollment` / `rejectEnrollment` / `getAvailableClasses` from `lib/api.ts`
- [x] `AvailableClassesPage` → read-only auto-enrollment list (no Join button / Pending state / available toggle)
- [x] `ClassDetailPage`: Requests tab + pending badge removed, unused imports cleaned
- [x] Frontend `tsc` + `eslint` + `build` clean (backend: 662/662 tests green)

## Planned: W2.5 — Per-chunk chapter mapping (true intra-document split)

v1 links a whole file to one chapter (book → first chapter, rest are scaffolds). For per-chapter *content* of a single big file:

- [ ] `MaterialChunk.chapterId?` from detected header offsets (`startLine`) at upload time
- [ ] `searchChunks(..., chapterId)` filters via chunk chapter; student chapter views list materials whose *chunks* live there
- [ ] Optional: split-into-parts signed URLs (byte-range) per chapter for "read chapter 3 of the book"

## Planned: W4 — Assignment types (subject-aware creation)

Per-assignment type picker in the creation form:

- [ ] `Assignment.type` enum: `ESSAY` | `PROBLEM_SET` | `PROGRAMMING` | `PRACTICAL` (default `ESSAY`) + migration
- [ ] Creation form step 1: type picker cards with icons
- [ ] Step 2 rubric adapts per type with criterion template presets:
  - `PROBLEM_SET`: Method / Calculations shown / Final answer / Units-precision
  - `PROGRAMMING`: Correctness / Edge cases / Code quality / Requirements met
  - `PRACTICAL`: Procedure / Results / Analysis / Conclusion
  - `ESSAY`: current free-form
- [ ] Rubrics stay mandatory for every type (differentiator vs MCQ; quizzes stay separate)

## Planned: W5 — File-capable submissions

- [ ] `Submission` gains `fileUrl?`, `fileName?`, `contentType?` (keeps `content` for essays/code)
- [ ] Student submission UI per type:
  - ESSAY — text (current)
  - PROBLEM_SET / PRACTICAL — file upload (PDF, DOCX, scan images) + optional typed solution text
  - PROGRAMMING — monospace code textarea or code file upload
- [ ] Student uploads → existing Supabase storage bucket; teacher download via signed URL
- [ ] Keep one-submission-per-student constraint (existing unique index)

## Planned: W6 — Grading adapts to type

- [ ] `submission-text-extractor` service: PDF → text (`pdf-parse`), DOCX → text (`mammoth`), images → OCR attempt
- [ ] Insufficient extracted text → no AI grade, wait for teacher rubric review (`REVIEW_READY`)
- [ ] `grading.agent.ts` type-aware system prompts (programming correctness/edge cases; problem-set step tracing + partial credit; practical process/report review)

Note: current chat model (`openai.gpt-oss-20b-1:0`) is text-only — no vision/OCR-by-model today.

## Order

W1 (attachments) → W2 (chapters) → W3 (auto-enrollment) → W4 (types UI) → W5 (file submissions) → W6 (grading). Each phase builds and tests green independently.
## Landing — 8-scene dream rebuild (Aug 11)
- Replaced the continuous street with pocket worlds: sky / square / portal / tunnel / classroom / sky, each swapped behind a WarpFlash (dream dissolves).
- Camera is now character-centered: scene offsets relative to the student; the student can never leave center frame.
- Student: waves in the hello, t-pose float for the fall + both portal scenes (t-pose clip wired via VITE_LANDING_CLIP_STUDENT_FLOAT), sits in the classroom, thinks, celebrates; faces the camera per scene.
- Vertical story height: falls −14 into the square, drops −10 into the classroom, rises +14 back to the sky.
- Portal rebuilt: bigger ring (r=2.2) that grows as the student approaches + new tunnel streak pocket for the interior scene.
- Parents clap on the landing and the finale (previously idle while standing).
- Robot visibly works in scene 6 (stronger bob, ring, core pulse) and leans toward the teacher; the teacher turns to face the robot (AI suggests / teachers decide) — plus the assignment paper flies teacher→robot.
- Text: hero slogan fully visible at scroll 0 (startVisible) and rises with scroll; headlines up to clamp(48px,7vw,96px); solid #a78bfa brand highlight.
- BandOverlay gained startVisible + rise props; 8 bands = 800vh; PAGE_HEIGHT updated.
- Verified: tsc ✓ eslint ✓ vite build ✓ headless Chromium (8 chapters render, hero opaque at scroll 0, no error panels). Screenshot: landing-hello.png.

### Landing polish round 2 (Aug 11)
- Cut the village-square scene (parents clapping on landing read as applause-at-nothing). The fall now lands at a **school gate**: new `world/SchoolGatePocket.tsx` (path, arch with violet cap, picket fences, trees); student walks in (walk clip + 2.5-unit drift) from a behind-shot camera; chapter copy → "Through the gate".
- Parents appear ONLY in the finale (skyB), clapping the celebration.
- **All env swaps now smooth**: `warpStrength` reworked to a global-space triangular pulse centered exactly on each boundary (±0.25 bands, eased) so the flash peaks at the swap moment instead of arriving late; `CameraRig` eases camera position + look-target from the previous scene's shot over the first 30% of each band (no more framing snap); subtle decaying dip on the gate band reads as the landing settle.
- Deleted `world/SquarePocket.tsx`; env key `square` → `gate` throughout.
- Verified: tsc ✓ eslint ✓ vite build ✓ headless DOM (8 chapters + gate copy, 0 error panels) ✓ screenshot `landing-gate.png`.

### Landing round 3 — school-story rebuild, 9 bands (Aug 11)
- Scroll is now **9 bands / 900vh** (`SECTION_COUNT=9`, `PAGE_HEIGHT=900`): Hello → Fall → Gate walk → Portal ring → Tunnel → School assembly → Test 1 (red X) → Robot talk → Celebration.
- **The school builds itself**: new `world/AssemblyPiece.tsx` (scroll-window eased slide from far offset to final) drives `ClassroomPocket` — floor rises, left/right walls slide in (±20), back wall rolls in, board drops, 3 desks pop up staggered (0.06–0.78 windows) while the student falls −14→−24 in a t-pose float.
- **Test 1** (band 6): `world/TestPaper.tsx` — floating paper between camera and student; red X (two crossed bars) draws itself on scroll. **Test 2** (band 8): fresh paper, green ✓ draws itself in two staggered strokes. Module-scope materials (purity rules forbid mutating useMemo values in useFrame).
- **Robot talk** (band 7): robot slides in from off-frame, hovers beside the student, core pulses; 3 DOM speech bubbles ("Tough one — I saw it happen in real time." etc.) staggered on scroll. Teacher + AssignmentPaper deleted; sit/think student states removed.
- **Celebration** (band 8): rise to skyB, `effects/Confetti.tsx` — 220-piece instanced cloud (deterministic rand, module-scope mesh, dynamic usage), parents clap, victory pose, EmailToast, CTA.
- Portals re-centered: camera offsets now dead-center behind the student in both scenes.
- Teacher model removed from `ALL_LANDING_MODELS` preload (~17MB saved on landing load); `teacherClips`/`modelTeacher` config entries cleaned.
- Verified: tsc ✓ eslint ✓ vite build ✓ headless DOM (all 7 chapters + 3 bubbles + hero, 0 error panels) ✓ screenshot `landing-9scenes.png`.
