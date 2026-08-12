import { describe, expect, it } from "vitest"
import {
  parseCsv,
  parsePasted,
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