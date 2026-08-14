# PLAN — Replace password-reveal with set-password flow

Replaces the "verify link reveals the generated password once" flow with a
"user sets their own password" flow. Verified with user decisions (both
recommendations accepted):

- The 5th call site (`provisionGuardian`) gets the same treatment as the 4
  listed sites (mode `'set'` + drop credentialEncrypted persist).
- `emailVerifiedAt` is set whenever the verify token is consumed (preserves
  the gate for the legacy `resendCredentials` path).

Repos: `eduai-backend` and `eduai-frontend`.

---

## 1. Backend — `eduai-backend/src/join-requests/join-requests.service.ts`

`sendVerifyInvite` already accepts `mode: 'set' | 'confirm'` (uncommitted
working-tree change). Fix all 5 call sites:

| Site | Line | Drop credentialEncrypted | mode |
|---|---|---|---|
| ROSTER student | 836 / 842 | `credentialEncrypted = encryptCredential(password);` | `'set'` |
| SELF student | 883 / 887 | `credentialEncrypted = encryptCredential(password);` | `chosen ? 'confirm' : 'set'` |
| ROSTER guardian-CSV | 951 / 980 | `credentialEncrypted: encryptCredential(gPassword),` | `'set'` |
| approveGuardian | 1145 / 1163 | `credentialEncrypted: encryptCredential(password),` | `chosen ? 'confirm' : 'set'` |
| provisionGuardian | 532 / 556 | `credentialEncrypted: encryptCredential(gPassword),` | `'set'` |

- Keep generating the placeholder password for `createUser`/`updateUserById`
  — only stop persisting it.
- Remove the now-dead local `credentialEncrypted` var (~806) and its key in
  the `user.create` data object (~1000).
- Remove unused `encryptCredential` import (`decryptCredential` still used).

### New public method

```ts
async sendSetPasswordInvite(
  userId: string,
  organizationId: string,
): Promise<{ email: string }>
```

1. Look up user by `{ id: userId, organizationId }`; if none → throw
   `STUDENT_NOT_FOUND` (keeps old resetCredentials semantics). If no `authId`
   → throw `AUTH_USER_NOT_FOUND` / BAD_REQUEST ("no auth identity to reset").
2. Resolve the deliverable inbox:
   - GUARDIAN → `guardianProfile.personalEmail`
   - STUDENT → `joinRequest.email` where `{ userId, status: 'APPROVED' }`
   - fallback `??` joinRequest.email; throw if neither resolves.
3. `issueVerifyToken()`; persist `verifyToken` + `verifyTokenExpiresAt` on the
   user.
4. `sendVerifyInvite({ to: inbox, name, token, relationship, mode: 'set' })`.
5. Return `{ email: user.email }` (school email).

---

## 2. Backend — `eduai-backend/src/auth/auth.service.ts` — `verifyEmail`

Rewrite:

```ts
async verifyEmail(
  token: string,
  password?: string,
): Promise<{ email: string; schoolCode: string | null; needsPassword: boolean }>
```

- Keep token lookup + not-found/expired errors (`VERIFY_TOKEN_INVALID` /
  `VERIFY_TOKEN_EXPIRED`).
- **Remove** the `if (!user.credentialEncrypted) throw` guard (~563).
- Look up the user's linked join request
  (`joinRequest.findFirst({ where: { userId: user.id } })`).
- `needsPassword = !joinRequest || joinRequest.source === 'ROSTER' || !joinRequest.chosenPasswordEncrypted`
  (SELF with a chosen password → false).
- If `password` provided:
  - validate length ≥ 8
  - if no `authId` → throw `AUTH_USER_NOT_FOUND` / BAD_REQUEST
  - `supabaseService.updatePassword(authId, password)` (wraps
    `auth.admin.updateUserById(authId, { password })`)
  - consume token (clear `verifyToken`, `verifyTokenExpiresAt`) + set
    `emailVerifiedAt`
  - return `{ email, schoolCode, needsPassword: false }`
- Else if `needsPassword` → return `{ email, schoolCode, needsPassword: true }`
  **without consuming the token**.
- Else (confirm mode) → consume token + set `emailVerifiedAt`, return
  `{ email, schoolCode, needsPassword: false }`.
- `schoolCode` from organization `joinCode` lookup (unchanged).

Out of scope (unchanged): `resendCredentials` + `resetPassword` still use
`credentialEncrypted` (legacy recovery paths).

---

## 3. Backend — `dto.ts` + `auth.controller.ts`

- `VerifyEmailSchema` += `password: z.string().min(8).optional()`.
- Controller: `return this.authService.verifyEmail(dto.token, dto.password);`
- Refresh `ApiOperation` summary on `verify-email` (no longer "reveal
  credentials once").

---

## 4. Backend — `eduai-backend/src/students/students.service.ts` — `resetCredentials`

```ts
async resetCredentials(id: string, organizationId: string) {
  const { email } = await this.joinRequests.sendSetPasswordInvite(id, organizationId);
  return { invited: true, email };
}
```

- Drop old body (generatePassword, supabase update, credentialEncrypted
  write). Remove unused imports (`generatePassword`, `encryptCredential`) if
  no longer referenced.

---

## 5. Frontend

### `eduai-frontend/src/lib/api.ts`

- `VerifyEmailResult` → `{ email: string; schoolCode: string | null; needsPassword: boolean }`
- `verifyEmail(token: string, password?: string)` → posts `{ token, ...(password ? { password } : {}) }`
- `ResetStudentCredentialsResult` → `{ email: string; invited: boolean }`

### `eduai-frontend/src/pages/VerifyPage.tsx`

- `verify.mutate(token)` → result; if `needsPassword`, show password-creation
  form (Input + Label, min 8, Button) and call `verifyEmail(token, password)`
  on submit; on success show the school email (+ schoolCode) + "Go to sign in".
- If `!needsPassword`, reveal school email (+ schoolCode) + "Go to sign in"
  immediately.
- Remove the password reveal/copy block; update heading/copy accordingly.
- Keep loading / failed / resend phases as-is.

### `eduai-frontend/src/pages/admin/AdminStudentDetailPage.tsx`

Not in the original task list, but required so `tsc -b` passes (backend no
longer returns `password`):

- `CredentialsDialog` → "invite sent" state: show school email + note that a
  set-password invite was emailed; drop password display/copy.
- Update the reset toast copy.

`src/types/api-schema.ts` is generated (`npm run sync:api-types`) and not
imported by app code — skip regeneration.

---

## 6. Verification

Backend (`eduai-backend`):

- `npm run typecheck` (`tsc --noEmit -p tsconfig.json`)
- `npx jest src/join-requests/join-requests.service.spec.ts src/auth/auth.service.spec.ts src/auth/auth.controller.spec.ts src/students/students.service.spec.ts`
  — analysis shows no spec asserts the old reveal behavior (only comments);
  expect green unchanged. Fix only if something actually fails.

Frontend (`eduai-frontend`):

- `npx tsc -b`
- `npm run lint`

---

## Notes / risks

- `resendCredentials` (auth.service.ts:598) and the guardian resend
  (guardian.service.ts:404) decrypt `credentialEncrypted`; newly provisioned
  users will no longer have it, so those paths will answer the generic
  "If an account matches…" message. Accepted consequence; not in scope.
- `resetPassword` (self-service) still re-encrypts the new password — kept
  for the legacy resend path.