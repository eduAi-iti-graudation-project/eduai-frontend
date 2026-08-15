import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GradeDetailPage } from "@/pages/teacher/GradeDetailPage"

const { getTeacherGrade } = vi.hoisted(() => ({
  getTeacherGrade: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrade,
}))

const grade = {
  id: "grade-9",
  level: 9,
  name: "Freshman",
  students: 60,
  sections: [
    {
      id: "sec-a",
      name: "9-A",
      description: "Morning section",
      enrollments: 30,
      courses: [{ id: "course-physics", name: "Physics", description: null }],
    },
    {
      id: "sec-b",
      name: "9-B",
      description: "Afternoon section",
      enrollments: 30,
      courses: [{ id: "course-math", name: "Math", description: null }],
    },
  ],
  courses: [
    { id: "course-physics", name: "Physics", description: "Forces and motion" },
    { id: "course-math", name: "Math", description: null },
  ],
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/grades/grade-9"]}>
        <Routes>
          <Route path="/grades/:gradeId" element={<GradeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("GradeDetailPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherGrade.mockResolvedValue(grade)
  })

  it("renders the stats strip and section tab by default", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole("heading", { name: "Grade 9" })).toBeTruthy())
    expect(screen.getByText("Grade level")).toBeTruthy()
    expect(screen.getByText("Sections")).toBeTruthy()
    expect(screen.getByText("Courses")).toBeTruthy()
    expect(screen.getByText("Students")).toBeTruthy()
    expect(screen.getByText("Sections (2)")).toBeTruthy()
    expect(screen.getByText("9-A")).toBeTruthy()
    expect(screen.getByText("9-B")).toBeTruthy()
    expect(screen.getByText("2 of 2 sections")).toBeTruthy()
  })

  it("switches to the courses tab", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Courses (2)" }))
    await waitFor(() => expect(screen.getByText("Physics")).toBeTruthy())
    expect(screen.getByText("Forces and motion")).toBeTruthy()
    expect(screen.getByText("2 of 2 courses")).toBeTruthy()
    expect(screen.getAllByText("Offered in:").length).toBeGreaterThan(0)
  })

  it("filters sections by search", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "9-B" } })
    expect(screen.getByText("9-B")).toBeTruthy()
    expect(screen.queryByText("9-A")).toBeNull()
    expect(screen.getByText("1 of 2 sections")).toBeTruthy()
  })

  it("filters courses by search", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Courses (2)" }))
    await waitFor(() => expect(screen.getByText("Physics")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search courses"), { target: { value: "math" } })
    expect(screen.getByText("Math")).toBeTruthy()
    expect(screen.queryByText("Forces and motion")).toBeNull()
    expect(screen.getByText("1 of 2 courses")).toBeTruthy()
  })

  it("sorts sections by student count", async () => {
    getTeacherGrade.mockResolvedValue({
      ...grade,
      sections: [
        { ...grade.sections[0], enrollments: 20 },
        { ...grade.sections[1], enrollments: 40 },
      ],
    })
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.click(screen.getByRole("combobox"))
    const option = await screen.findByText("Most students")
    fireEvent.click(option)
    const names = screen.getAllByText(/9-[AB]/)
    expect(names[0]).toHaveTextContent("9-B")
    expect(names[1]).toHaveTextContent("9-A")
  })

  it("shows a no-matches empty state when search yields nothing", async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "zzz" } })
    expect(screen.getByText("No matching sections")).toBeTruthy()
  })

  it("shows an empty state for an empty grade", async () => {
    getTeacherGrade.mockResolvedValue({ ...grade, sections: [], courses: [] })
    renderPage()
    await waitFor(() => expect(screen.getByText("This grade is empty")).toBeTruthy())
  })
})