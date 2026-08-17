import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AssignmentsPage } from "@/pages/teacher/AssignmentsPage"

const {
  useAssignments,
  useGenerateCourseAssignmentDraft,
  useDeleteAssignment,
  useAssignmentDraft,
  useTeacherOfferings,
  useCourseMaterialChapters,
  getTeacherGrades,
  getUsers,
} = vi.hoisted(() => ({
  useAssignments: vi.fn(),
  useGenerateCourseAssignmentDraft: vi.fn(),
  useDeleteAssignment: vi.fn(),
  useAssignmentDraft: vi.fn(),
  useTeacherOfferings: vi.fn(),
  useCourseMaterialChapters: vi.fn(),
  getTeacherGrades: vi.fn(),
  getUsers: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/hooks/use-assignments", () => ({
  useAssignments: (...a: unknown[]) => useAssignments(...a),
  useGenerateCourseAssignmentDraft: () => useGenerateCourseAssignmentDraft(),
  useDeleteAssignment: () => useDeleteAssignment(),
}))

vi.mock("@/hooks/use-assignment-draft", () => ({
  useAssignmentDraft: () => useAssignmentDraft(),
}))

vi.mock("@/hooks/use-labs", () => ({
  useTeacherOfferings: () => useTeacherOfferings(),
  useTeacherOfferingNameMap: () => new Map(),
}))

vi.mock("@/hooks/use-materials", () => ({
  useCourseMaterialChapters: () => useCourseMaterialChapters(),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
  getUsers,
}))

const offerings = [
  {
    id: "off-a1",
    course: { id: "course-physics", name: "Physics", colorTag: null },
    section: { id: "sec-a1", name: "9-A", gradeLevelId: "grade-9" },
    teacher: { id: "teacher-1", name: "T" },
  },
]

const unit = {
  id: "unit-1",
  title: "Unit 1 — Forces",
  order: 0,
  materials: [{ id: "m-1" }, { id: "m-2" }],
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AssignmentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockUnits(chapters: unknown[] = [unit]) {
  useCourseMaterialChapters.mockReturnValue({
    chapters,
    unassigned: [],
    isLoading: false,
    refetch: vi.fn(),
  })
}

async function selectScope(label: string) {
  const scopeCombobox = screen.getByRole("combobox", { name: "Scope" })
  fireEvent.click(scopeCombobox)
  const options = await screen.findAllByRole("option")
  const option = options.find((o) => o.textContent?.includes(label))
  expect(option).toBeTruthy()
  fireEvent.click(option!)
}

describe("AssignmentsPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    useAssignments.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    useDeleteAssignment.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useGenerateCourseAssignmentDraft.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      data: null,
      error: null,
    })
    useAssignmentDraft.mockReturnValue({ session: null, store: vi.fn(), clear: vi.fn() })
    useTeacherOfferings.mockReturnValue({ data: offerings, isLoading: false })
    mockUnits([])
    getTeacherGrades.mockResolvedValue([
      { id: "grade-9", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
    getUsers.mockResolvedValue([])
  })

  it("renders assignments with due date and points", () => {
    useAssignments.mockReturnValue({
      data: [
        {
          id: "a1",
          title: "Photosynthesis Essay",
          description: "Explain photosynthesis",
          dueDate: "2026-08-01T23:59:00.000Z",
          totalPoints: 100,
          courseOfferingId: "off-a1",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Photosynthesis Essay")).toBeTruthy()
    expect(screen.getByText(/100 pts/)).toBeTruthy()
    expect(screen.getAllByText(/Due /).length).toBeGreaterThan(0)
  })

  it("shows an empty state when there are no assignments", () => {
    renderPage()
    expect(screen.getByText("No assignments yet")).toBeTruthy()
  })

  it("generates a course assignment draft, stores it, and routes to review", async () => {
    const mutate = vi.fn()
    const store = vi.fn()
    useGenerateCourseAssignmentDraft.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      data: null,
      error: null,
    })
    useAssignmentDraft.mockReturnValue({ session: null, store, clear: vi.fn() })
    mockUnits()
    renderPage()

    fireEvent.click(screen.getByText("AI Generate"))
    await waitFor(() => expect(screen.getByText("Generate assignment with AI")).toBeTruthy())

    const gradeCombobox = screen.getByRole("combobox", { name: "Grade" })
    fireEvent.click(gradeCombobox)
    fireEvent.click(await screen.findByText("Grade 9"))

    const courseCombobox = screen.getByRole("combobox", { name: "Course" })
    fireEvent.click(courseCombobox)
    fireEvent.click(await screen.findByText("Physics"))

    await waitFor(() => expect(screen.getAllByText("9-A").length).toBeGreaterThan(0))
    fireEvent.click(screen.getByText("9-A", { selector: "span.font-label-md" }))

    await selectScope("Unit 1 — Forces")

    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-08-01T23:59" },
    })

    mutate.mockImplementation((_data, handlers) => {
      handlers?.onSuccess?.({ status: "grounded", draft: { assignment: { title: "Forces Essay", description: "Write an essay." }, rubric: { title: "Forces Rubric", criteria: [{ description: "Clarity", maxPoints: 100 }] } } })
    })

    fireEvent.click(screen.getByText("Generate draft"))

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: "course-physics",
          chapterId: "unit-1",
          assignmentType: "essay",
          dueDate: expect.any(String),
          assignments: [{ courseOfferingId: "off-a1" }],
        }),
        expect.any(Object),
      ),
    )
    await waitFor(() =>
      expect(store).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: "course-physics",
          scopeTitle: "Unit 1 — Forces",
          assignmentType: "essay",
          draft: expect.objectContaining({
            assignment: expect.objectContaining({ title: "Forces Essay" }),
          }),
        }),
      ),
    )
  })

  it("disables Generate draft until a scope and due date are picked", async () => {
    renderPage()

    fireEvent.click(screen.getByText("AI Generate"))
    await waitFor(() => expect(screen.getByText("Generate assignment with AI")).toBeTruthy())

    const gradeCombobox = screen.getByRole("combobox", { name: "Grade" })
    fireEvent.click(gradeCombobox)
    fireEvent.click(await screen.findByText("Grade 9"))

    const courseCombobox = screen.getByRole("combobox", { name: "Course" })
    fireEvent.click(courseCombobox)
    fireEvent.click(await screen.findByText("Physics"))

    await waitFor(() => expect(screen.getAllByText("9-A").length).toBeGreaterThan(0))
    fireEvent.click(screen.getByText("9-A", { selector: "span.font-label-md" }))

    const generateButton = screen.getByText("Generate draft") as HTMLButtonElement
    expect(generateButton.closest("button")?.disabled).toBe(true)

    await selectScope("Entire course")
    expect(generateButton.closest("button")?.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-08-01T23:59" },
    })
    await waitFor(() => expect(generateButton.closest("button")?.disabled).toBe(false))
  })
})