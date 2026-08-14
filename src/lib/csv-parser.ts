/**
 * Quote-aware CSV / TSV parser shared by the import wizard. Mirrors the
 * backend parser (src/migration/csv-parser.ts) so that what the frontend
 * previews is exactly what the server imports.
 *
 * `parseDelimited` / `parseCsv` / `parsePasted` keep the original API. The
 * `*Detailed` variants additionally surface obvious malformed-input signals
 * (stray quotes, text after a closing quote, unterminated quoted values) so
 * the wizard can warn the admin instead of silently presenting corrupted rows
 * as valid.
 */

export interface CsvParseDiagnostics {
  /** Human-readable warnings about malformed input. Empty for well-formed CSV. */
  issues: string[]
}

function parseDelimitedDetailed(
  text: string,
  delimiter: "," | "\t",
): { rows: string[][]; issues: string[] } {
  const rows: string[][] = []
  const issues: string[] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let line = 1

  const pushField = () => {
    row.push(field)
    field = ""
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
          const next = text[i + 1]
          if (
            next &&
            next !== delimiter &&
            next !== "\n" &&
            next !== "\r" &&
            next.trim()
          ) {
            issues.push(`Line ${line}: unexpected text after a closing quote`)
          }
        }
      } else if (char === "\n" || char === "\r") {
        field += char
        if (!(char === "\r" && text[i + 1] === "\n")) line++
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      if (field.trim().length > 0) {
        issues.push(`Line ${line}: unexpected quote inside a value`)
      }
      inQuotes = true
      continue
    }
    if (char === delimiter) {
      pushField()
      continue
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      line++
      pushRow()
      continue
    }
    field += char
  }
  if (inQuotes) {
    issues.push("Unterminated quoted value at the end of the file")
  }
  if (field.length > 0 || row.length > 0) pushRow()

  const cleaned = rows
    .map((r) => r.map((cell) => cell.trim()))
    .filter((r) => r.some((cell) => cell.length > 0))
  return { rows: cleaned, issues }
}

export function parseDelimited(text: string, delimiter: "," | "\t"): string[][] {
  return parseDelimitedDetailed(text, delimiter).rows
}

export function parseCsv(text: string): string[][] {
  return parseDelimited(text, ",")
}

export function parseCsvDetailed(
  text: string,
): { rows: string[][]; issues: string[] } {
  return parseDelimitedDetailed(text, ",")
}

/** Paste from a spreadsheet: tab-separated by default, comma as fallback. */
export function parsePasted(text: string): string[][] {
  return parsePastedDetailed(text).rows
}

export function parsePastedDetailed(
  text: string,
): { rows: string[][]; issues: string[] } {
  const firstLine =
    text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ""
  const delimiter = firstLine.includes("\t") ? "\t" : ","
  return parseDelimitedDetailed(text, delimiter)
}

/**
 * Serialize a parsed grid back to RFC-4180-style comma CSV. Quotes cells
 * containing commas, quotes or newlines; escapes embedded quotes by doubling.
 * Used so the wizard sends the import endpoint exactly the text that matches
 * what was previewed (the backend import always parses comma CSV).
 */
export function toCsv(rows: string[][]): string {
  const needsQuoting = (cell: string) => /["\n\r,]/.test(cell)
  return rows
    .map((row) =>
      row
        .map((cell) =>
          needsQuoting(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(","),
    )
    .join("\n")
}

/**
 * The blank template (Path C): exact header + one example row.
 * When a file's header row matches TEMPLATE_HEADERS exactly, the backend
 * skips the AI mapping step and returns a deterministic 1:1 mapping —
 * this module lets the wizard show that path instantly.
 */
export const TEMPLATE_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "gradeLevelName",
  "sectionName",
  "dateOfBirth",
  "guardianName",
  "guardianEmail",
] as const

export const TEMPLATE_EXAMPLE = [
  "Jane",
  "Doe",
  "jane.doe@example.com",
  "Grade 7",
  "A",
  "2014-03-12",
  "Joan Doe",
  "joan.doe@example.com",
]

export const TEMPLATE_CSV = [
  TEMPLATE_HEADERS.join(","),
  TEMPLATE_EXAMPLE.join(","),
].join("\n")

export function isTemplateHeader(header: string[]): boolean {
  return (
    header.length === TEMPLATE_HEADERS.length &&
    header.every(
      (h, i) => h.trim().toLowerCase() === TEMPLATE_HEADERS[i].toLowerCase(),
    )
  )
}

export interface ColumnPreview {
  sourceColumn: string
  sampleValues: string[]
}

/** Header + up to 3 sample values, one entry per column. */
export function previewColumns(rows: string[][]): ColumnPreview[] {
  if (rows.length === 0) return []
  const header = rows[0]
  const dataRows = rows.slice(1)
  return header.map((sourceColumn, index) => ({
    sourceColumn,
    sampleValues: dataRows
      .map((row) => row[index] ?? "")
      .filter((v) => v.length > 0)
      .slice(0, 3),
  }))
}

/** The template file is blank+example by construction: never importable. */
export function isEmptyTemplatedFile(rows: string[][]): boolean {
  if (rows.length < 2) return false
  if (!isTemplateHeader(rows[0])) return false
  const dataRows = rows.slice(1)
  return dataRows.every((row) =>
    TEMPLATE_EXAMPLE.every(
      (value, i) => (row[i] ?? "").trim().toLowerCase() === value.toLowerCase(),
    ),
  )
}