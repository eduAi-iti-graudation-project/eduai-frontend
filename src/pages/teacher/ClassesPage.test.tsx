import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClassesPage } from "@/pages/teacher/ClassesPage"

const { useClasses, getTeacherGrades } = vi.hoisted(() => ({
  useClasses: vi.fn(),
  getTeacherGrades: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/hooks/use-classes", () => ({
  useClasses: () => useClasses(),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
}))

const section = (id: string, name: string, gradeLevelId: string, courses: string[], students: number, colorTags: (string | null)[] = []) => ({
  id,
  name,
  section: `Description of ${name}`,
  gradeLevelId,
  courses,
  students,
  colorTags,
})

function mockUseClasses(cards: ReturnType<typeof section>[], colors = false) {
  useClasses.mockReturnValue({
    isLoading: false,
    isError: false,
    error: null,
    classCards: cards,
    sectionCourseColors: colors
      ? new Map(cards.map((c) => [c.id, c.courses.map((name, i) => ({ name, colorTag: c.colorTags[i] ?? null }))]))
      : new Map(),
    taughtSectionCount: cards.length,
  })
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClassesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const cards = [
  section("sec-a", "9-A", "grade-9", ["Physics", "Math"], 30, ["#3B82F6", "#0D9488"]),
  section("sec-b", "9-B", "grade-9", ["Physics"], 25),
  section("sec-c", "10-A", "grade-10", ["Chemistry", "Physics"], 28),
]

// The filter bar has three selects in a fixed order: grade, course, sort.
// Radix triggers are only reliable while the dropdown is closed.
async function filterTriggers(): Promise<HTMLButtonElement[]> {
  return (await screen.findAllByRole("combobox")) as HTMLButtonElement[]
}

describe("ClassesPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherGrades.mockResolvedValue([
      { id: "grade-9", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
      { id: "grade-10", level: 10, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
  })

  it("renders stats strip and section cards with grade chips", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getAllByText("Grade 9").length).toBeGreaterThan(0))
    expect(screen.getByText("9-A")).toBeTruthy()
    expect(screen.getByText("9-B")).toBeTruthy()
    expect(screen.getByText("10-A")).toBeTruthy()
    expect(screen.getAllByText("Grade 10").length).toBeGreaterThan(0)
    // Stats strip
    expect(screen.getByText("83")).toBeTruthy() // students
    expect(screen.getByText("3 of 3 sections")).toBeTruthy()
  })

  it("renders colored course chips from sectionCourseColors", async () => {
    mockUseClasses(cards, true)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    const chips = screen.getAllByText("Physics")
    expect(chips.length).toBeGreaterThanOrEqual(3)
    expect(chips[0].className).toContain("rounded")
  })

  it("filters by grade level", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    const triggers = await filterTriggers()
    fireEvent.click(triggers[0])
    const option = await screen.findByRole("option", { name: "Grade 10" })
    fireEvent.click(option)
    expect(screen.getByText("10-A")).toBeTruthy()
    expect(screen.queryByText("9-A")).toBeNull()
  })

  it("filters by course", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    const triggers = await filterTriggers()
    fireEvent.click(triggers[1])
    const option = await screen.findByRole("option", { name: "Chemistry" })
    fireEvent.click(option)
    expect(screen.getByText("10-A")).toBeTruthy()
    expect(screen.queryByText("9-A")).toBeNull()
  })

  it("searches sections by name", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "10-A" } })
    expect(screen.getByText("10-A")).toBeTruthy()
    expect(screen.queryByText("9-A")).toBeNull()
  })

  it("clears filters when Clear filters is clicked", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "10-A" } })
    fireEvent.click(screen.getByRole("button", { name: "Clear filters (1)" }))
    expect(screen.getByText("9-A")).toBeTruthy()
  })

  it("shows an empty state when no sections are taught", async () => {
    mockUseClasses([])
    renderPage()
    await waitFor(() => expect(screen.getByText("No sections yet")).toBeTruthy())
  })

  it("shows a no-matches empty state", async () => {
    mockUseClasses(cards)
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "zzz" } })
    expect(screen.getByText("No matching sections")).toBeTruthy()
  })
})