# PLAN: Restore guardian fields in CSV import column mapping

## Root cause

The CSV import wizard's mapping dropdown cannot offer guardian fields because the
frontend never declares them, while the backend fully supports them:

- Backend `IMPORTABLE_FIELDS` (`migration.service.ts:11-23`) includes
  GUARDIAN_NAME, GUARDIAN_EMAIL, GUARDIAN_SSN, GUARDIAN_PHONE,
  GUARDIAN_NATIONALITY. The AI mapping prompt instructs the LLM to map them
  (`migration.service.ts:286`), the import DTO validates them (`dto.ts:18`), and
  `importCsv` consumes them (guardian split-import, SSN validation, guardian
  provisioning on auto-approve).
- Frontend `MigrateField` + `IMPORTABLE_FIELDS` (`src/lib/api.ts:2692-2708`)
  only list the first 7 fields — guardian fields are absent, so the dropdown
  built from `api.IMPORTABLE_FIELDS` (`MigrationWizardPage.tsx:460`) cannot show
  them and `FIELD_LABELS` (`MigrationWizardPage.tsx:38-46`) has no labels.
- `AdminCsvImportPage.tsx` has the same omission (`Field` type line 26,
  `fieldLabels`/`fieldOptions` lines 28-36).

## Changes (frontend-only, 3 files)

### 1. `src/lib/api.ts`
Add to `MigrateField` union and `IMPORTABLE_FIELDS`:
`GUARDIAN_NAME`, `GUARDIAN_EMAIL`, `GUARDIAN_SSN`, `GUARDIAN_PHONE`,
`GUARDIAN_NATIONALITY` (values match the backend enum exactly).

### 2. `src/pages/admin/MigrationWizardPage.tsx`
Add the 5 labels to `FIELD_LABELS`:
Guardian name, Guardian email, Guardian SSN, Guardian phone, Guardian
nationality. Dropdown items now render with labels; AI suggestions for
guardian columns display correctly.

### 3. `src/pages/admin/AdminCsvImportPage.tsx`
Same: extend `Field`, `fieldLabels`, `fieldOptions` with the 5 guardian
fields.

## Verification

- `npx tsc -b` + `npx eslint` on the 3 files.
- No backend changes (AI prompt + DTO already support guardian fields).

## Expected behavior after fix

- Wizard dropdown offers the 5 guardian options; AI suggestions render.
- Mapping guardian columns → import attaches guardians (parent verify invite to
  guardian email); bad-SSN / guardian-without-email rows still follow the
  split-import flags (student imported without guardian + follow-up note).