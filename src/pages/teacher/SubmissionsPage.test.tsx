import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SubmissionsPage } from "@/pages/teacher/SubmissionsPage"
import type { SubmissionDetail } from "@/lib/api"

const {
  useSubmissions,
  useTeacherOfferings,
  getTeacherGrades,
  getAssignments,
} = vi.hoisted(() => ({
  useSubmissions: vi.fn(),
  useTeacherOfferings: vi.fn(),
  getTeacherGrades: vi.fn(),
  getAssignments: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
  getAssignments,
}))

vi.mock("@/hooks/use-submissions", () => ({
  useSubmissions: (filters: unknown) => useSubmissions(filters),
}))

vi.mock("@/hooks/use-labs", () => ({
  useTeacherOfferings: () => useTeacherOfferings(),
}))

const offerings = [
  {
    id: "off-a",
    course: { id: "course-a", name: "Physics", colorTag: null },
    section: { id: "sec-a", name: "9-A", gradeLevelId: "grade-a" },
    teacher: { id: "teacher-1", name: "T" },
  },
  {
    id: "off-b",
    course: { id: "course-a", name: "Physics", colorTag: null },
    section: { id: "sec-b", name: "9-B", gradeLevelId: "grade-a" },
    teacher: { id: "teacher-1", name: "T" },
  },
  {
    id: "off-c",
    course: { id: "course-b", name: "Chemistry", colorTag: null },
    section: { id: "sec-c", name: "10-A", gradeLevelId: "grade-b" },
    teacher: { id: "teacher-1", name: "T" },
  },
]

const assignments = [
  { id: "assign-1", title: "Newton's Laws Essay", courseOfferingId: "off-a" },
  { id: "assign-2", title: "Lab Report: Reactions", courseOfferingId: "off-c" },
]

const submissions: SubmissionDetail[] = [
  {
    id: "sub-1",
    assignmentId: "assign-1",
    studentId: "stu-1",
    status: "SUBMITTED",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    student: {
      id: "stu-1",
      authId: "auth-1",
      email: "sara@example.com",
      name: "Sara Ahmed",
      role: "STUDENT",
      organizationId: "org-1",
      guardianId: null,
      gradeId: "grade-a",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    assignment: {
      id: "assign-1",
      title: "Newton's Laws Essay",
      description: null,
      dueDate: "2026-02-10T00:00:00Z",
      totalPoints: 10,
      courseOfferingId: "off-a",
      offering: { id: "off-a", course: { id: "course-a", name: "Physics" }, section: { id: "sec-a", name: "9-A" } },
    },
  },
  {
    id: "sub-2",
    assignmentId: "assign-1",
    studentId: "stu-2",
    status: "REVIEW_READY",
    createdAt: "2026-02-02T10:00:00Z",
    updatedAt: "2026-02-02T10:00:00Z",
    student: {
      id: "stu-2",
      authId: "auth-2",
      email: "ali@example.com",
      name: "Ali Hassan",
      role: "STUDENT",
      organizationId: "org-1",
      guardianId: null,
      gradeId: "grade-a",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    assignment: {
      id: "assign-1",
      title: "Newton's Laws Essay",
      description: null,
      dueDate: "2026-02-10T00:00:00Z",
      totalPoints: 10,
      courseOfferingId: "off-a",
      offering: { id: "off-a", course: { id: "course-a", name: "Physics" }, section: { id: "sec-a", name: "9-A" } },
    },
    scores: [{ id: "score-1", submissionId: "sub-2", criteriaId: "crit-1", pointsAwarded: 8, aiFeedback: null, teacherNotes: null, isConfirmed: false, createdAt: "2026-02-02T10:00:00Z" }],
  },
]

function submissionsResult(data: SubmissionDetail[] | null = submissions) {
  return {
    submissions: { data, refetch: vi.fn() },
    isLoading: false,
    isError: false,
    error: null,
    gradeSubmission: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    confirmGrade: { mutate: vi.fn(), isPending: false },
  }
}

function renderPage(initialEntry = "/submissions") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <SubmissionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("SubmissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherGrades.mockResolvedValue([
      { id: "grade-a", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
      { id: "grade-b", level: 10, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
    getAssignments.mockResolvedValue(assignments)
    useTeacherOfferings.mockReturnValue({ data: offerings })
    useSubmissions.mockReturnValue(submissionsResult())
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the submission context: student, assignment, course · section, status, and points", async () => {
    renderPage()

    expect(await screen.findByText("Sara Ahmed")).toBeInTheDocument()
    expect(screen.getAllByText("Newton's Laws Essay").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Physics").length).toBeGreaterThan(0)
    expect(screen.getAllByText("9-A").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Review Ready").length).toBeGreaterThan(0)
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("shows per-status counts that filter when clicked", async () => {
    renderPage()

    expect(await screen.findByText("All submissions")).toBeInTheDocument()

    // The stat card renders the status label inside a clickable button with the
    // headline count next to it — target that button, not the table badge.
    const reviewReadyStat = screen.getAllByText("Review Ready")[0].closest("button")
    expect(reviewReadyStat).not.toBeNull()

    useSubmissions.mockClear()
    fireEvent.click(reviewReadyStat!)
    expect(useSubmissions).toHaveBeenLastCalledWith({ status: "REVIEW_READY" })
  })

  it("includes the REVIEW_READY option in the status dropdown", async () => {
    renderPage()
    const triggers = await screen.findAllByRole("combobox")
    const statusTrigger = triggers[4]
    statusTrigger.click()

    const listbox = await screen.findByRole("listbox")
    expect(within(listbox).getByText("Review Ready")).toBeInTheDocument()
  })

  it("passes a student search query to the submissions hook", async () => {
    renderPage()

    const searchInput = (await screen.findByPlaceholderText("Search by student name or email…")) as HTMLInputElement
    useSubmissions.mockClear()
    fireEvent.change(searchInput, { target: { value: "sara" } })

    expect(useSubmissions).toHaveBeenLastCalledWith({ q: "sara" })
  })

  it("limits course and section options through the grade → course cascade", async () => {
    renderPage()
    const triggers = await screen.findAllByRole("combobox")

    // Grade → Grade 10 (Chemistry only)
    triggers[0].click()
    let listbox = await screen.findByRole("listbox")
    within(listbox).getByText("Grade 10").click()

    const [, courseTrigger] = await screen.findAllByRole("combobox")
    courseTrigger.click()
    listbox = await screen.findByRole("listbox")
    expect(within(listbox).getByText("Chemistry")).toBeInTheDocument()
    expect(within(listbox).queryByText("Physics")).not.toBeInTheDocument()
  })

  it("pre-selects an assignment from the URL and back-fills the cascade", async () => {
    renderPage("/submissions?assignmentId=assign-1")

    const triggers = await screen.findAllByRole("combobox")
    expect(await screen.findByText("Grade 9")).toBeInTheDocument()
    expect(triggers[1].textContent).toContain("Physics")
    expect(triggers[2].textContent).toContain("9-A")
    expect(triggers[3].textContent).toContain("Newton's Laws Essay")
  })

  it("renders the AI Review All button with the count of submitted submissions", async () => {
    renderPage()

    expect(await screen.findByText("AI Review All (1)")).toBeInTheDocument()
  })
})