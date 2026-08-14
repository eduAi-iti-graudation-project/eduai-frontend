import { describe, expect, it } from "vitest"
import { buildRecords } from "./import-validation"
import type { MigrateField } from "./api"

const MAPPING: Record<string, MigrateField> = {
  "Student Name": "STUDENT_NAME",
  Email: "EMAIL",
  Grade: "GRADE_LEVEL",
  Section: "SECTION",
}

describe("buildRecords", () => {
  it("marks a complete row as ready", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["Aya Hassan", "aya@example.com", "Grade 10", "Math"],
    ]
    const records = buildRecords(rows, MAPPING)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      name: "Aya Hassan",
      email: "aya@example.com",
      grade: "Grade 10",
      section: "Math",
      status: "ready",
      issues: [],
    })
  })

  it("flags a missing student name as invalid", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["", "aya@example.com", "Grade 10", "Math"],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("invalid")
    expect(record.issues).toContain("Missing student name")
  })

  it("flags an invalid email address as invalid", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["Omar Khaled", "omar.khaled@nodomain", "Grade 10", "Math"],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("invalid")
    expect(record.issues).toContain("Invalid email address")
  })

  it("flags a duplicate email as invalid", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["Aya Hamed", "mostafa.nabil@example.com", "Grade 10", "Math"],
      ["Mostafa Nabil", "MOSTAFA.NABIL@example.com", "Grade 10", "Science"],
    ]
    const records = buildRecords(rows, MAPPING)
    expect(records[0].status).toBe("invalid")
    expect(records[1].status).toBe("invalid")
    expect(records[1].issues[0]).toContain("Duplicate email address")
  })

  it("flags a missing email as needing attention", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["Yara Mansour", "", "Grade 10", "English"],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("attention")
    expect(record.issues).toContain("Missing email address")
  })

  it("flags missing grade and section as needing attention", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["Hoda Wael", "hoda@example.com", "", ""],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("attention")
    expect(record.issues).toContain("Missing grade")
    expect(record.issues).toContain("Missing section")
  })

  it("flags a row with fewer columns than the header", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["OnlyName", "only@example.com"],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("attention")
    expect(record.issues.some((i) => i.includes("fewer columns"))).toBe(true)
    expect(record.issues.some((i) => i.includes("2"))).toBe(true)
  })

  it("flags a row with more columns than the header", () => {
    const rows = [
      ["Student Name", "Email", "Grade", "Section"],
      ["A", "a@example.com", "Grade 10", "Math", "EXTRA"],
    ]
    const record = buildRecords(rows, MAPPING)[0]
    expect(record.status).toBe("attention")
    expect(record.issues.some((i) => i.includes("extra column"))).toBe(true)
  })

  it("composes a name from first + last name columns", () => {
    const mapping: Record<string, MigrateField> = {
      First: "FIRST_NAME",
      Last: "LAST_NAME",
      Email: "EMAIL",
    }
    const rows = [
      ["First", "Last", "Email"],
      ["Aya", "Hassan", "aya@example.com"],
    ]
    const record = buildRecords(rows, mapping)[0]
    expect(record.name).toBe("Aya Hassan")
    expect(record.status).toBe("attention") // grade/section not mapped → missing
  })

  it("returns empty when there is no header row", () => {
    expect(buildRecords([], MAPPING)).toEqual([])
    expect(buildRecords([["Student Name"]], MAPPING)).toEqual([])
  })

  it("is deterministic and never leaks state between calls", () => {
    const rowsA = [
      ["Student Name", "Email"],
      ["Alice", "alice@example.com"],
    ]
    const rowsB = [
      ["Student Name", "Email"],
      ["Bob", "bob@example.com"],
    ]
    const a1 = buildRecords(rowsA, MAPPING)
    const a2 = buildRecords(rowsA, MAPPING)
    expect(a1).toEqual(a2)
    // Records for B contain ONLY B's data — no rows from A.
    const b = buildRecords(rowsB, MAPPING)
    expect(b.map((r) => r.name)).toEqual(["Bob"])
    expect(a1.map((r) => r.name)).toEqual(["Alice"])
  })
})