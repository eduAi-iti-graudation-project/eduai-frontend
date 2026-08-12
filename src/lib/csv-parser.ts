/**
 * Quote-aware CSV / TSV parser shared by the import wizard. Mirrors the
 * backend parser (src/migration/csv-parser.ts) so that what the frontend
 * previews is exactly what the server imports.
 */

export function parseDelimited(text: string, delimiter: "," | "\t"): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

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
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === delimiter) {
      pushField()
      continue
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      pushRow()
      continue
    }
    field += char
  }
  if (field.length > 0 || row.length > 0) pushRow()

  return rows
    .map((r) => r.map((cell) => cell.trim()))
    .filter((r) => r.some((cell) => cell.length > 0))
}

export function parseCsv(text: string): string[][] {
  return parseDelimited(text, ",")
}

/** Paste from a spreadsheet: tab-separated by default, comma as fallback. */
export function parsePasted(text: string): string[][] {
  const firstLine =
    text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ""
  const delimiter = firstLine.includes("\t") ? "\t" : ","
  return parseDelimited(text, delimiter)
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