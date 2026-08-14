import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { MigrationWizardPage } from "./MigrationWizardPage"
import { parseCsv } from "@/lib/csv-parser"

afterEach(() => cleanup())

const { analyzeMock, analyzePastedMock } = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
  analyzePastedMock: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    analyzeMigrationCsv: analyzeMock,
    analyzeMigrationPasted: analyzePastedMock,
    importStudentsCsv: vi.fn(async () => ({
      imported: 1,
      unassignedGradeOrSection: [],
      needsFollowUp: [],
      unmatchedSectionsOrGrades: [],
    })),
    fetchImportTemplate: vi.fn(async () => "firstName,lastName,email\nJane,Doe,j@e.com"),
  }
})

function buildAnalyze(text: string) {
  const rows = parseCsv(text)
  const header = rows[0] ?? []
  const columns = header.map((sourceColumn) => {
    const h = sourceColumn.toLowerCase()
    let suggestedField = "UNMAPPED"
    if (h.includes("email") || h.includes("e-mail")) suggestedField = "EMAIL"
    else if (h.includes("grade")) suggestedField = "GRADE_LEVEL"
    else if (h.includes("section")) suggestedField = "SECTION"
    else if (h.includes("first")) suggestedField = "FIRST_NAME"
    else if (h.includes("last")) suggestedField = "LAST_NAME"
    else if (h.includes("name")) suggestedField = "STUDENT_NAME"
    return { sourceColumn, sampleValues: [], suggestedField, confidence: 1, masked: false }
  })
  return { columns, totalRows: Math.max(rows.length - 1, 0), maskedColumns: [] }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MigrationWizardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: "text/csv" })
}

async function selectFile(content: string, name = "students.csv") {
  const input = document.querySelector('input[type="file"]')
  if (!input) throw new Error("file input not found")
  fireEvent.change(input, { target: { files: [makeFile(name, content)] } })
}

async function goToReview() {
  fireEvent.click(screen.getByRole("button", { name: "Continue" }))
}

beforeEach(() => {
  analyzeMock.mockReset()
  analyzePastedMock.mockReset()
  analyzeMock.mockImplementation(async (text: string) => buildAnalyze(text))
  analyzePastedMock.mockImplementation(async (text: string) => buildAnalyze(text))
})

describe("MigrationWizardPage file lifecycle", () => {
  it("loading CSV B then CSV A again shows only the latest file's data", async () => {
    renderPage()

    const csvA =
      "Student Name,Email,Grade,Section\nAlice,alice@example.com,Grade 10,Math\nBob,bob@example.com,Grade 10,Math"
    const csvB =
      "Student Name,Email,Grade,Section\nCarol,carol@example.com,Grade 11,History\nDave,dave@example.com,Grade 11,History\nEve,eve@example.com,Grade 11,History"

    await selectFile(csvA, "a.csv")
    expect(await screen.findByText(/2 students detected/)).toBeTruthy()

    await goToReview()
    expect(await screen.findByText("Alice")).toBeTruthy()
    expect(screen.getByText("Bob")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /Back to upload/ }))

    await selectFile(csvB, "b.csv")
    expect(await screen.findByText(/3 students detected/)).toBeTruthy()

    await goToReview()
    expect(await screen.findByText("Carol")).toBeTruthy()
    expect(screen.getByText("Dave")).toBeTruthy()
    expect(screen.getByText("Eve")).toBeTruthy()
    expect(screen.queryByText("Alice")).toBeNull()
    expect(screen.queryByText("Bob")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Back to upload/ }))

    // Re-select CSV A — it must reload A cleanly, not keep B.
    await selectFile(csvA, "a.csv")
    expect(await screen.findByText(/2 students detected/)).toBeTruthy()
    await goToReview()
    expect(await screen.findByText("Alice")).toBeTruthy()
    expect(screen.queryByText("Carol")).toBeNull()
  })

  it("selecting the same file again reloads it correctly", async () => {
    renderPage()
    const csv =
      "Student Name,Email,Grade,Section\nAya,aya@example.com,Grade 10,Math"
    await selectFile(csv)
    expect(await screen.findByText(/1 student detected/)).toBeTruthy()
    await selectFile(csv)
    expect(await screen.findByText(/1 student detected/)).toBeTruthy()
    await goToReview()
    expect(await screen.findByText("Aya")).toBeTruthy()
  })

  it("does not leak a previous file's mapping into a new file with different headers", async () => {
    renderPage()

    const csvA =
      "Student Name,Email,Grade,Section\nAlice,alice@example.com,Grade 10,Math"
    const csvB =
      "Full Name,E-mail,Grade,Section\nCarol,carol@example.com,Grade 11,History"

    await selectFile(csvA, "a.csv")
    expect(await screen.findByText(/1 student detected/)).toBeTruthy()
    await goToReview()
    expect(await screen.findByText("Alice")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /Back to upload/ }))

    await selectFile(csvB, "b.csv")
    expect(await screen.findByText(/1 student detected/)).toBeTruthy()
    await goToReview()
    // If A's mapping had leaked, B's "Full Name"/"E-mail" columns would not
    // resolve and the student would render with an empty name.
    expect(await screen.findByText("Carol")).toBeTruthy()
    expect(screen.queryByText("Alice")).toBeNull()
  })
})