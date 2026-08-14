import { describe, expect, it } from "vitest"
import {
  parseCsv,
  parsePasted,
  parseCsvDetailed,
  parsePastedDetailed,
  toCsv,
  isTemplateHeader,
  TEMPLATE_HEADERS,
  previewColumns,
} from "./csv-parser"

describe("parseCsv", () => {
  it("parses headers and rows", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("handles quoted fields with commas", () => {
    expect(parseCsv('name,note\n"Smith, John","hello, world"')).toEqual([
      ["name", "note"],
      ["Smith, John", "hello, world"],
    ])
  })

  it("handles escaped quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']])
  })

  it("ignores blank rows and trims cells", () => {
    expect(parseCsv("a,b\n\n1,  2  \n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("handles a trailing delimiter", () => {
    expect(parseCsv("a,b\n1,")).toEqual([
      ["a", "b"],
      ["1", ""],
    ])
  })
})

describe("parsePasted", () => {
  it("detects tab-separated ranges", () => {
    const pasted = "Name\tEmail\tGrade\nAya\taya@example.com\tGrade 7"
    expect(parsePasted(pasted)).toEqual([
      ["Name", "Email", "Grade"],
      ["Aya", "aya@example.com", "Grade 7"],
    ])
  })

  it("falls back to comma-separated text", () => {
    expect(parsePasted("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })
})

describe("parseCsvDetailed", () => {
  it("reports no issues for well-formed CSV", () => {
    const { rows, issues } = parseCsvDetailed(
      "name,email,grade\nA,aa@x.com,Grade 10",
    )
    expect(rows).toEqual([
      ["name", "email", "grade"],
      ["A", "aa@x.com", "Grade 10"],
    ])
    expect(issues).toEqual([])
  })

  it("handles quoted fields, escaped quotes and commas inside quotes", () => {
    const { rows, issues } = parseCsvDetailed(
      'name,note\n"Smith, John","say ""hi"""',
    )
    expect(rows).toEqual([
      ["name", "note"],
      ["Smith, John", 'say "hi"'],
    ])
    expect(issues).toEqual([])
  })

  it("handles CRLF and LF line endings", () => {
    expect(parseCsvDetailed("a,b\r\n1,2\r\n").rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
    expect(parseCsvDetailed("a,b\n1,2\n").rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("strips a UTF-8 BOM from the first header cell", () => {
    const { rows, issues } = parseCsvDetailed("\uFEFFname,email\nA,B")
    expect(rows[0][0]).toBe("name")
    expect(issues).toEqual([])
  })

  it("parses Arabic (UTF-8) headers and values", () => {
    const { rows } = parseCsvDetailed(
      "اسم الطالب,email\nأحمد حسن,a@example.com",
    )
    expect(rows).toEqual([
      ["اسم الطالب", "email"],
      ["أحمد حسن", "a@example.com"],
    ])
  })

  it("keeps empty cells without shifting columns", () => {
    const { rows } = parseCsvDetailed("name,email,grade\nA,,Grade 10")
    expect(rows[1]).toEqual(["A", "", "Grade 10"])
  })

  it("flags an unterminated quoted value", () => {
    const { issues } = parseCsvDetailed('name,note\n"Smith, John')
    expect(issues.some((i) => i.includes("Unterminated"))).toBe(true)
  })

  it("flags a quote inside a value", () => {
    const { issues } = parseCsvDetailed('name,note\n5" tall,hello')
    expect(issues.some((i) => i.includes("unexpected quote inside"))).toBe(true)
  })

  it("flags text after a closing quote", () => {
    const { issues } = parseCsvDetailed('a,b\n"field"tail,2')
    expect(issues.some((i) => i.includes("after a closing quote"))).toBe(true)
  })

  it("does not flag leading whitespace before a quoted field", () => {
    const { issues } = parseCsvDetailed('a,b\n "Smith, John",2')
    expect(issues).toEqual([])
  })
})

describe("parsePastedDetailed", () => {
  it("detects tab-separated ranges", () => {
    const { rows, issues } = parsePastedDetailed(
      "Name\tEmail\tGrade\nAya\taya@example.com\tGrade 7",
    )
    expect(rows).toEqual([
      ["Name", "Email", "Grade"],
      ["Aya", "aya@example.com", "Grade 7"],
    ])
    expect(issues).toEqual([])
  })

  it("falls back to comma-separated text", () => {
    const { rows } = parsePastedDetailed("a,b\n1,2")
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })
})

describe("toCsv", () => {
  it("serializes a simple grid", () => {
    expect(toCsv([["name", "email"], ["A", "a@x.com"]])).toBe(
      "name,email\nA,a@x.com",
    )
  })

  it("quotes cells containing commas", () => {
    expect(toCsv([["name", "note"], ["A", "Smith, John"]])).toBe(
      'name,note\nA,"Smith, John"',
    )
  })

  it("quotes cells containing quotes and escapes them by doubling", () => {
    expect(toCsv([["note"], ['say "hi"']])).toBe('note\n"say ""hi"""')
  })

  it("quotes cells containing newlines", () => {
    expect(toCsv([["note"], ["line one\nline two"]])).toBe(
      'note\n"line one\nline two"',
    )
  })

  it("round-trips through parseCsv", () => {
    const grid = [
      ["name", "email", "note"],
      ['Ahmed "AJ" Hassan', "ahmed@example.com", "Science 301, Lab Reports"],
      ["Aya", "aya@example.com", "line one\nline two"],
      ["Omar", "", "plain"],
    ]
    expect(parseCsv(toCsv(grid))).toEqual(grid)
  })

  it("round-trips pasted tab-separated text into import-compatible comma CSV", () => {
    const pasted = "Name\tEmail\tGrade\nAya\taya@example.com\tGrade 7\nOmar\tomar@example.com\tGrade 8"
    const grid = parsePasted(pasted)
    // The backend import endpoint parses with comma-only CSV. Re-parsing the
    // normalized text must produce exactly the grid that was previewed.
    expect(parseCsv(toCsv(grid))).toEqual(grid)
    expect(parseCsv(toCsv(grid))[0]).toEqual(["Name", "Email", "Grade"])
  })
})

describe("isTemplateHeader", () => {
  it("matches the blank template header exactly", () => {
    expect(isTemplateHeader([...TEMPLATE_HEADERS])).toBe(true)
  })

  it("is case-insensitive and trims", () => {
    expect(isTemplateHeader(["firstName", "LastNAme", "EMAIL", "gradeLevelName", "sectionName", "dateOfBirth", "guardianName", "guardianEmail"])).toBe(true)
  })

  it("rejects any deviating header", () => {
    expect(isTemplateHeader(["first name", ...TEMPLATE_HEADERS.slice(1)])).toBe(false)
    expect(isTemplateHeader([...TEMPLATE_HEADERS.slice(0, -1)])).toBe(false)
  })
})

describe("previewColumns", () => {
  it("extracts up to 3 sample values per column", () => {
    const rows = [
      ["name", "email"],
      ["A", "a@example.com"],
      ["B", "b@example.com"],
      ["C", "c@example.com"],
      ["D", "d@example.com"],
    ]
    expect(previewColumns(rows)).toEqual([
      {
        sourceColumn: "name",
        sampleValues: ["A", "B", "C"],
      },
      {
        sourceColumn: "email",
        sampleValues: ["a@example.com", "b@example.com", "c@example.com"],
      },
    ])
  })
})