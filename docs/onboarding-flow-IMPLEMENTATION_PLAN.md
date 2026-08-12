# Implementation Plan — Complete Student/Parent Onboarding Flow

**Status:** In progress — Backend (B1–B4) ✅ complete, Frontend (F1–F6) pending
**Repos:** backend `~/Desktop/eduai/eduai-backend`, frontend `~/Desktop/eduai/eduai-frontend`

**Reality check up front:** ~80% already existed in the backend (`docs/backend-IMPLEMENTATION_PLAN.md` WP1–WP4, mostly done). This plan closes the remaining gaps against the user's 5 requirements.

## User flow → current state

| # | Requirement | Status |
|---|---|---|
| 1 | CSV with student+parent → verify emails → get school email/password/code | ✅ Built (verify links go to `/verify?token=…` — page was missing) |
| 2 | Student normal signup → admin approves → validation email → school email | ⚠️→✅ Approval now keeps chosen password + gives school email |
| 3 | Admin access to emails/passwords | ⚠️ API exists; admin UI button pending (F5) |
| 4 | Self-service forgot password (no admin) | ✅ Built: reset routed via verified real inbox |
| 5 | Parent validation email + parent self-signup with school code | ⚠️ Provision built; self-signup endpoint built; UI pending (F2) |

## Decisions (confirmed by user)

1. **Student signup form:** include optional parent section (name + real email). ✅ Recommended.
2. **Parent self-signup linking:** parent enters **child's school email** → pending request → admin approves. ✅ Recommended.
3. **Admin credential access:** **reset-only** (admin resets → gets fresh password once; never views live plaintext). ✅ Recommended.
4. **Self-service forgot password:** **reset via verified real (personal) email** — self-issued token link, no admin needed. ✅ Recommended.

---

## Backend work (✅ DONE)

### B1. SELF students get a school email on approval (keeps chosen password)
- Migration `20260812060000_onboarding_school_email_flow`:
  - `JoinRequest`: `+chosenPasswordEncrypted String?`
  - `User`: `+resetToken String? @unique`, `+resetTokenExpiresAt DateTime?`
  - New enum `JoinRequestKind { STUDENT | GUARDIAN }`, `JoinRequest.kind @default(STUDENT)`, `JoinRequest.targetStudentEmail String?`
- `applyAsStudent` (`join-requests.service.ts`): stores chosen password encrypted (`chosenPasswordEncrypted`).
- `approveOne` SELF branch: instead of keeping real email login:
  - Allocates school email (`schoolEmailCandidate` + `uniqueEmail` over `takenLocals` = used gmails + existing users).
  - `supabase.admin.updateUserById(authId, { email: schoolEmail, email_confirm: true [, password] })` — **reuses the chosen password**, no duplicate identity; generated password fallback for legacy requests.
  - Sets `credentialEncrypted` (chosen or generated), issues verify token, **sends verify invite to the real email** (replaces the old plain confirmation).

### B2. Guardian self-signup with school code
- New public `POST /auth/signup/guardian` (`join-requests.controller.ts`) → `applyAsGuardian` in `join-requests.service.ts`:
  - DTO `SignupGuardianSchema`: `{ schoolCode, name, personalEmail, password, childSchoolEmail, phone?, nationality? }`.
  - Creates `kind=GUARDIAN, source=SELF` request with `targetStudentEmail`, `chosenPasswordEncrypted`, `guardianEmail/phone/nationality`.
  - Validates: school code, personal email not already a guardian in org, no pending dup, child resolvable (provisioned STUDENT **or** pending/rejected ROSTER row) → else `STUDENT_NOT_FOUND`.
- `approveOne` branches early on `kind === 'GUARDIAN'` → `approveGuardian`:
  - Resolves child by `targetStudentEmail` (fail → keep PENDING with reason, including "already has a linked parent").
  - Provisions guardian like the roster guardian path (school email + chosen/generated password, verify invite to `personalEmail`, `guardianProfile.personalEmail`, `profileComplete: false` → first-login completion prompt).
  - Links `student.guardianId`, marks request APPROVED with `userId`.
- `list()` exposes `kind` + `targetStudentEmail`; `JoinRequestItem` DTO + `join-requests.types.ts` (`JOIN_REQUEST_KINDS`) updated.

### B3. Self-service forgot password for school accounts
- `forgotPassword` (`auth.service.ts`): `resolveRealInbox(email)`:
  - Guardian personal email → direct.
  - Student real email (APPROVED ROSTER/SELF row) → maps to user.
  - **School login entered** → maps back via role: guardian `personalEmail`, student ROSTER row email.
  - Resolved → self-issued `resetToken` (randomBytes 32, 30-min TTL) emailed to the **real inbox** as `${FRONTEND_URL}/forgot-password?resetToken=…`. Unresolved → normal Supabase magic link (teachers/admins).
- `resetPassword`: tries self-issued `resetToken` first → validates TTL (`RESET_TOKEN_EXPIRED` 410) → `updatePassword(authId)` + re-encrypt `credentialEncrypted` + clear token → sign-in → `{ accessToken, user }`. Falls back to Supabase token path.
- New error codes: `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED`.

### B4. Tests / build (✅ green)
- `npm run typecheck` ✅, `npx eslint src --max-warnings=0` ✅ (auto-fixed whitespace), 749 tests ✅ —
  - `join-requests.service.spec.ts`: SELF school-email move (keeps/generates password), GUARDIAN approve+link, child-unknown failure, `applyAsGuardian` (create / pending-child / dup email / unknown child). Mocks gained `user.update`, `guardianProfile`, `admin.updateUserById`.
  - `auth.service.spec.ts`: forgot via student real email, school-login→real inbox, guardian personal email, Supabase fallback, self-issued reset, expired-token 410. Mocks gained `guardianProfile`, `joinRequest`, `resetPasswordForEmail`, `getUserByToken`, `updatePassword`, `admin.updateUserById`.
- Migration applied to dev DB (`prisma migrate deploy`; hand-written SQL due to non-interactive shell).

---

## Frontend work (TODO)

### F1. `/verify` page (critical — emails currently 404)
- New route `router.tsx` + `pages/VerifyPage.tsx`: reads `?token` → `POST /auth/verify-email` (new `verifyEmail()` in `lib/api.ts`).
- States: loading → **success**: show school **email + password + school code** (copy buttons, "Go to sign in" → `/login`, auto-fill login) → **invalid/expired**: message + "Didn't get it?" resend form → `POST /auth/credentials/resend` (new `resendCredentials()`).
- One page serves students and parents (uniform credentials reveal).

### F2. Parent sign-up UI
- `RoleToggle.tsx`: add **Parent** option (Student | Teacher | Parent).
- `SignupForm.tsx`: parent branch — school code (reuse `fetchSchoolByCode`), name, **personal email**, password, **child's school email** (hint "e.g. ahmed.ali@school.org — ask the school"), optional phone/nationality. Submits to `signupGuardian()`; success → "request submitted for review".

### F3. Student form: optional parent section
- `SignupForm.tsx` student branch: collapsible "Add a parent (optional)" → name + email. Wired to existing guardian fields in `SignupStudentDto`. On approval the parent gets the verify email automatically.

### F4. Forgot-password for school accounts
- `ForgotPasswordPage.tsx`: email field hint ("your school email"), plus route support for `?resetToken=` (self-issued); `lib/api.ts` `forgotPassword`/`resetPassword` unchanged signatures (backend routes).

### F5. Admin UI
- `AdminStudentDetailPage.tsx`: "Reset password" action → `POST /students/:id/credentials/reset` → dialog showing new email+password once (copy).
- `AdminJoinApprovalsPage.tsx`: show parent-kind requests (target child school email badge) and approve/reject through existing endpoints; show `kind` on results.
- `MigrationWizardPage.tsx`: already reports auto-approve + follow-up reasons — verify guardian-led rows appear in follow-up.

### F6. API wrappers + types
- `lib/api.ts`: `verifyEmail`, `resendCredentials`, `signupGuardian`, `resetStudentCredentials`. Update `JoinRequestItem` type (`kind`, `targetStudentEmail`) — run `npm run sync:api-types` if backend is running, else hand-edit `api-schema.ts` following existing patterns. Verify `tsc`, `eslint`, `vite build`.

---

## Open follow-ups (after build)
- Student "invite parent" banner already gets `guardianLinked`/`invitePending` from `/auth/me` (built) — wire the banner's "Parent sign-up" CTA to F2 if not already.
- `FRONTEND_URL` must be set in real backend `.env` for the verify/reset links (already required by OAuth).

## Sequence
B1 → B2 → B3 → B4 (backend green) → `sync:api-types` → F1 → F2 → F3 → F4 → F5 → F6 (frontend green). Each stage builds and tests independently.