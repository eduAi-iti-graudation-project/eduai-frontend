import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GradeListPage } from "@/pages/teacher/GradeListPage"

const { getTeacherGrades } = vi.hoisted(() => ({
  getTeacherGrades: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
}))

const grade = (id: string, level: number, name: string, sections: number, courses: number, students: number) => ({
  id,
  level,
  name,
  createdAt: "2026-01-01T00:00:00Z",
  sections,
  courses,
  students,
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GradeListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("GradeListPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherGrades.mockResolvedValue([
      grade("g9", 9, "", 2, 4, 60),
      grade("g10", 10, "Sophomore", 1, 2, 25),
      grade("g-empty", 12, "", 0, 0, 0),
    ])
  })

  it("renders the stats strip and all grade cards", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("Grade 9")).toBeTruthy())
    expect(screen.getByText("Grade 10")).toBeTruthy()
    expect(screen.getByText("Grade 12")).toBeTruthy()
    expect(screen.getByText("Grade levels")).toBeTruthy()
    expect(screen.getByText("Sections")).toBeTruthy()
    expect(screen.getByText("Courses")).toBeTruthy()
    expect(screen.getByText("Students")).toBeTruthy()
    expect(screen.getByText("3 of 3 grades")).toBeTruthy()
  })

  it("filters grades by search query", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("Grade 9")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search grades"), { target: { value: "sophomore" } })
    expect(screen.getByText("Grade 10")).toBeTruthy()
    expect(screen.queryByText("Grade 9")).toBeNull()
    expect(screen.getByText("1 of 3 grades match the current filters")).toBeTruthy()
  })

  it("hides empty grades when the toggle is on", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("Grade 9")).toBeTruthy())
    fireEvent.click(screen.getByText("Hide empty grades"))
    expect(screen.queryByText("Grade 12")).toBeNull()
    expect(screen.getByText("2 of 3 grades match the current filters")).toBeTruthy()
  })

  it("sorts grades by student count", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("Grade 9")).toBeTruthy())
    fireEvent.click(screen.getByRole("combobox"))
    const option = await screen.findByText("Most students")
    fireEvent.click(option)
    const links = screen.getAllByRole("link")
    expect(links[0].textContent).toContain("Grade 9")
    expect(links[1].textContent).toContain("Grade 10")
  })

  it("shows a no-matches empty state", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("Grade 9")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search grades"), { target: { value: "zzz" } })
    expect(screen.getByText("No matching grades")).toBeTruthy()
  })

  it("shows an empty state when no grades are assigned", async () => {
    getTeacherGrades.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(screen.getByText("No grades assigned")).toBeTruthy())
  })
})