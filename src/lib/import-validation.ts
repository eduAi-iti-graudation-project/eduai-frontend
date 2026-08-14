import type { MigrateField } from "@/lib/api"

export type StudentStatus = "ready" | "attention" | "invalid"

export interface StudentRecord {
  index: number
  name: string
  email: string
  grade: string
  section: string
  status: StudentStatus
  issues: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Build the review-preview student records from a parsed grid + field mapping.
 *
 * Deterministic and purely derived from the two inputs — there is no hidden
 * state, so a new file + fresh mapping can never leak rows from an earlier
 * file. Statuses:
 *
 * - invalid: cannot be imported as-is (missing name, invalid email format,
 *   duplicate email within the file — the backend rejects these)
 * - attention: importable but incomplete (missing email, grade or section,
 *   or a row that doesn't match the header's column count)
 * - ready: everything present and well-formed
 *
 * IMPORTANT: this is a frontend preview. It never guarantees that the backend
 * accepts a row (existing members, pending requests, guardian rules and
 * auto-approval outcomes are decided server-side).
 */
export function buildRecords(
  rows: string[][],
  mapping: Record<string, MigrateField>,
): StudentRecord[] {
  if (rows.length < 2) return []
  const header = rows[0]
  const dataRows = rows.slice(1)
  const headerLen = header.length

  const colIndex = (field: MigrateField) =>
    header.findIndex((h) => mapping[h] === field)
  const nameCol = colIndex("STUDENT_NAME")
  const firstCol = colIndex("FIRST_NAME")
  const lastCol = colIndex("LAST_NAME")
  const emailCol = colIndex("EMAIL")
  const gradeCol = colIndex("GRADE_LEVEL")
  const sectionCol = colIndex("SECTION")

  const cell = (row: string[], col: number) =>
    col >= 0 ? (row[col] ?? "").trim() : ""

  const raw = dataRows.map((row, i) => {
    let name = cell(row, nameCol)
    if (!name && firstCol >= 0 && lastCol >= 0) {
      const first = cell(row, firstCol)
      const last = cell(row, lastCol)
      name = [first, last].filter(Boolean).join(" ")
    }
    return {
      index: i + 1,
      name,
      email: cell(row, emailCol),
      grade: cell(row, gradeCol),
      section: cell(row, sectionCol),
      missingCells: Math.max(headerLen - row.length, 0),
      extraCells: Math.max(row.length - headerLen, 0),
    }
  })

  const emailCounts = new Map<string, number>()
  raw.forEach((r) => {
    if (!r.email) return
    const key = r.email.toLowerCase()
    emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1)
  })

  return raw.map((r) => {
    const issues: string[] = []
    let invalid = false

    if (r.missingCells > 0) {
      issues.push(
        r.missingCells === 1
          ? "CSV row has 1 fewer column than expected"
          : `CSV row has ${r.missingCells} fewer columns than expected`,
      )
    }
    if (r.extraCells > 0) {
      issues.push(
        r.extraCells === 1
          ? "CSV row has 1 extra column that will be ignored"
          : `CSV row has ${r.extraCells} extra columns that will be ignored`,
      )
    }

    if (!r.name) {
      invalid = true
      issues.push("Missing student name")
    }

    if (r.email) {
      if (!EMAIL_RE.test(r.email)) {
        invalid = true
        issues.push("Invalid email address")
      } else if ((emailCounts.get(r.email.toLowerCase()) ?? 0) > 1) {
        invalid = true
        issues.push(
          "Duplicate email address — another student in this file uses the same email",
        )
      }
    } else {
      issues.push("Missing email address")
    }

    if (!r.grade) issues.push("Missing grade")
    if (!r.section) issues.push("Missing section")

    const status: StudentStatus = invalid
      ? "invalid"
      : issues.length > 0
        ? "attention"
        : "ready"

    return {
      index: r.index,
      name: r.name,
      email: r.email,
      grade: r.grade,
      section: r.section,
      status,
      issues,
    }
  })
}