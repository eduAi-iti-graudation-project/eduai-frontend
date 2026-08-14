# PLAN — OAuth for admins only, on the joining screen, with onboarding form

Moves Google/Microsoft OAuth off the login screen onto the joining (signup)
screen only, and makes OAuth the admin-only joining path: a new OAuth user is
created as an org-less ADMIN and is directed to a form to complete the other
info (create a school by name or join one by a code) before landing in the
admin area.

Verified with user decision:

- UI-only change for existing users: existing non-admin users
  (teacher/student/guardian) are NOT blocked from OAuth sign-in. No backend
  role guard.

Repos: `eduai-backend` and `eduai-frontend`.

---

## 1. Backend — `eduai-backend/src/auth/auth.service.ts` — `resolveOrCreateLocalUser` (~1147)

Make new OAuth users **org-less admins** instead of auto-creating a school:

- Keep: existing user by `authId` → reuse; existing user by `email` → link
  `authId`, reuse (no role checks — UI-only decision).
- New user → `user.create({ authId, email, name, role: DEFAULT_OAUTH_ROLE })`
  with **no organization**, no `$transaction`, no `createOrganization` call.
  Keep the P2002 concurrent-create retry/re-link logic.
- `createOrganization` stays (still used by `signup` and `oauthOnboard`).

This makes the existing `POST /auth/oauth/onboard` endpoint (already
`@Roles('ADMIN')`, create school by name or join by code) actually reachable.

## 2. Backend — `eduai-backend/src/auth/auth.service.spec.ts`

Update the 2 specs that assert auto-org creation:

- "creates a new ADMIN user with a new organization" → asserts an org-less
  ADMIN `user.create`, no `organization.create` call.
- "falls back to user_metadata.name when full_name is absent" → same.
- Existing-user link specs stay green (no role guard).

## 3. Frontend — `eduai-frontend/src/lib/api.ts`

- `User` interface += `organizationId: string | null`.
- Add `OauthOnboardResult` + `oauthOnboard({ organizationName?, joinCode? })`
  → `POST /auth/oauth/onboard` (token attaches automatically via the axios
  interceptor).

## 4. Frontend — `eduai-frontend/src/components/auth/LoginForm.tsx`

- Remove `SocialLogin` import, the "OR CONTINUE WITH" divider, and the
  component usage. Login is email + password only.

## 5. Frontend — `eduai-frontend/src/components/auth/SignupForm.tsx` (the joining screen)

- Keep `SocialLogin`; add a one-line helper note: "School administrators can
  sign in with Google or Microsoft to create or join a school."

## 6. Frontend — `eduai-frontend/src/pages/AuthCallbackPage.tsx` — onboarding form

- Store token from the hash (as today), then fetch `me`:
  - Has `organizationId` → redirect (existing admin / non-admin, routed by
    role).
  - **No organizationId** → render an onboarding form styled like
    `SignupForm`: "Create a school" (school name) / "Join a school" (join
    code) toggle; submit → `oauthOnboard` → redirect to `/admin`.
- Keeps the existing "sign-in incomplete" state for missing tokens. This also
  handles a logged-in org-less admin re-visiting the page.

## 7. Verification

Backend (`eduai-backend`):

- `npm run typecheck`
- `npx jest src/auth/auth.service.spec.ts src/auth/auth.controller.spec.ts`

Frontend (`eduai-frontend`):

- `npx tsc -b`
- `npm run lint`

---

## Behavior after this

- Google/Microsoft appear only on the signup screen (no OAuth on /login).
- A new OAuth user becomes an org-less ADMIN and lands on the "complete your
  info" form (create a school with a name or join one with a code).
- Existing users are unaffected (UI-only decision).

## Notes / risks

- `oauth/onboard` endpoint + `OauthOnboardSchema` already exist and match
  this shape — no backend endpoint changes beyond `resolveOrCreateLocalUser`.
- Org-less ADMIN visiting `/admin` before onboarding would see pages without
  an organization; the AuthCallbackPage handles the normal flow, and this
  edge is accepted as out of scope.
- `createOrganization` (and its private helpers) remain used by `signup` and
  `oauthOnboard` — not dead code.