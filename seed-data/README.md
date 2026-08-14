# Seed / Demo Data

Test data for the EduAI demo. Convert every `.md` file you need as an attachment
or upload to PDF (the app accepts **PDF only** for materials and rubrics). The
CSV is upload-ready as-is.

## 1. Student CSV import — `csv/students-import-demo.csv`

Upload in the **admin Migration wizard** (`/admin/migration`): choose "Upload a
CSV file", pick this file, let the AI map the unconventional headers, confirm
the mapping, and run the import.

- **15 rows, 11 columns** with non-template headers (e.g. `Student Full Name`,
  `E-mail Address`, `Section/Class`, `Guardian Contact (E-mail)`). One column
  (`Date of Birth`) should map to **UNMAPPED** — verify the AI gets it right.
- **Row 2 (Abdalla Ehab / `abdallahehab3710@gmail.com`)** is fully valid:
  imports and auto-approves into Grade 10 / Science 301 — Lab Reports. Because
  the email is your real mailbox, you can log into that student account with
  Google OAuth (email linking) and real emails (parent invites, notifications)
  will reach you.
- **Row 16 (Anwar Alaa / `anwaralaa286@gmail.com`)** is fully valid: imports
  and auto-approves into Grade 10 / Science 301 — Lab Reports, with guardian
  email `omaralaa7674@gmail.com` in the `Guardian Contact (E-mail)` column.
- Deliberate faults per row (expected wizard buckets):

| Row | Fault | Result |
| --- | --- | --- |
| 3 | Missing email | needsFollowUp (self-register) |
| 4 | Odd email domain, `10th Grade` | imported (grade matches numerically) |
| 5 | Mixed-case email, `Grad 10` | imported, normalized |
| 6 | `Section B` (doesn't exist) | unassigned grade/section |
| 7 | `Grade 11` (doesn't exist) | unassigned grade/section |
| 8 | Missing name | needsFollowUp |
| 9 | Guardian without email; `Science 301 - Lab Reports` (hyphens) | guardian dropped → follow-up; section still matches |
| 10 | Invalid SSN `ABC-DE-1234` | guardian dropped → follow-up |
| 12 | Padding spaces | trimmed, imported |
| 13 | Duplicate email of row 12 | needsFollowUp (duplicate row in file) |
| 14 | `Grade Ten` (word form) | unassigned grade/section |
| 15 | No grade, no section | unassigned grade/section |

All non-real emails use reserved/fictional domains (`@example.com`,
`@example.org`, `@democampus.edu`). SSNs are fake.

## 2. Class materials — `materials/` (md → PDF → chapter upload)

Teacher → Class Materials → create a chapter, then drop the PDFs.

- `science301-cell-biology.md` — Cell Biology: Structure & Function (Chapter 1)
- `science301-genetics.md` — Introduction to Genetics (Chapter 2)
- `english101-persuasive-essay.md` — The Persuasive Essay (Chapter 1)

Content-rich chapters (tables, examples, checkpoints) so AI chunking and
grounded generation (Study Lab, Labs, assignment drafts) have real material.

## 3. Assignments — `assignments/` (md → PDF, both briefs and handouts)

Assignments are created in the UI. Each brief lists the exact form values
(title, section, due date, total marks, description, instructor notes, rubric
criteria). **Attach the handout PDF** in the file step of the form to test that
students see the attachment on their assignment card (`a.materials`) and in
their materials list.

- `01-persuasive-essay-brief.md` + `01-persuasive-essay-handout.md` — English 101, due Sep 4, 50 pts
- `02-lab-report-brief.md` + `02-lab-report-handout.md` — Science 301, due Sep 11, 45 pts
- `03-genetics-problem-set-brief.md` + `03-genetics-problem-set-handout.md` — Science 301, due Aug 28, 30 pts

## 4. Rubrics — `rubrics/` (md → PDF → AI extraction)

Formatted as `Criterion — X points` lines, which the rubric PDF importer's LLM
extraction handles reliably (`rubrics.service.ts` `importPdf`). Upload via
**Rubrics page → Upload PDF**, review the extracted criteria, then confirm.
Alternatively, type the criteria straight into the assignment form's rubric step.

- `rubric-persuasive-essay.md` — 5 criteria, 50 pts
- `rubric-science-lab-report.md` — 5 criteria, 45 pts
- `rubric-genetics-problem-set.md` — 4 criteria, 30 pts

## Suggested demo flow

1. Import the CSV in the admin migration wizard.
2. Log into the imported student (Google OAuth, email linking) to see the
   student experience.
3. As a teacher: create chapters + upload the 3 material PDFs, then create the
   3 assignments with their handout PDFs attached and rubrics confirmed.
4. Submit the essay as the student, run AI grading, confirm scores, and check
   Submission Status (points + percentages).