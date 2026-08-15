import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QuizzesPage } from "@/pages/teacher/QuizzesPage"

const {
  useQuizList,
  useGenerateQuiz,
  useDeleteQuiz,
  usePublishQuiz,
  useUpdateQuiz,
  useAssignQuiz,
  useTeacherOfferings,
  getTeacherGrades,
  getUsers,
} = vi.hoisted(() => ({
  useQuizList: vi.fn(),
  useGenerateQuiz: vi.fn(),
  useDeleteQuiz: vi.fn(),
  usePublishQuiz: vi.fn(),
  useUpdateQuiz: vi.fn(),
  useAssignQuiz: vi.fn(),
  useTeacherOfferings: vi.fn(),
  getTeacherGrades: vi.fn(),
  getUsers: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/hooks/use-quizzes", () => ({
  useQuizList: (...a: unknown[]) => useQuizList(...a),
  useGenerateQuiz: () => useGenerateQuiz(),
  useDeleteQuiz: () => useDeleteQuiz(),
  usePublishQuiz: () => usePublishQuiz(),
  useUpdateQuiz: () => useUpdateQuiz(),
  useAssignQuiz: () => useAssignQuiz(),
}))

vi.mock("@/hooks/use-labs", () => ({
  useTeacherOfferings: () => useTeacherOfferings(),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
  getUsers,
}))

const assignment = (id: string, sectionName: string, gradeId: string, gradeName: string, courseId: string, courseName: string) => ({
  id,
  courseOfferingId: `off-${id}`,
  sectionId: `sec-${id}`,
  sectionName,
  gradeLevelId: gradeId,
  gradeLevelName: gradeName,
  courseId,
  courseName,
  teacherId: "teacher-1",
  targetStudentIds: [],
})

const quiz = {
  id: "quiz-1",
  title: "Newton's Laws",
  description: "Forces and motion",
  points: 10,
  questionCount: 2,
  timeLimit: 15,
  difficulty: "MEDIUM",
  endsAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  teacherId: "teacher-1",
  questions: [],
  assignments: [assignment("a1", "9-A", "grade-9", "", "course-physics", "Physics")],
}

const offerings = [
  {
    id: "off-a1",
    course: { id: "course-physics", name: "Physics", colorTag: null },
    section: { id: "sec-a1", name: "9-A", gradeLevelId: "grade-9" },
    teacher: { id: "teacher-1", name: "T" },
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <QuizzesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockUseGenerate() {
  const mutate = vi.fn()
  useGenerateQuiz.mockReturnValue({ mutate, isPending: false })
  return mutate
}

describe("QuizzesPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    useQuizList.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    useGenerateQuiz.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteQuiz.mockReturnValue({ mutate: vi.fn(), isPending: false })
    usePublishQuiz.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useUpdateQuiz.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useAssignQuiz.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useTeacherOfferings.mockReturnValue({ data: offerings, isLoading: false })
    getTeacherGrades.mockResolvedValue([
      { id: "grade-9", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
    getUsers.mockResolvedValue([])
  })

  it("renders quizzes and their assignment chips", () => {
    useQuizList.mockReturnValue({
      data: [
        {
          ...quiz,
          assignments: [
            assignment("a1", "9-A", "grade-9", "", "course-physics", "Physics"),
            assignment("a2", "9-B", "grade-9", "", "course-physics", "Physics"),
          ],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Newton's Laws")).toBeTruthy()
    expect(screen.getByText("9-A")).toBeTruthy()
    expect(screen.getByText("9-B")).toBeTruthy()
  })

  it("shows the difficulty badge on quiz cards", () => {
    useQuizList.mockReturnValue({
      data: [
        { ...quiz, id: "q1", title: "Easy quiz", difficulty: "EASY" },
        { ...quiz, id: "q2", title: "Hard quiz", difficulty: "HARD" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Easy")).toBeTruthy()
    expect(screen.getByText("Hard")).toBeTruthy()
  })

  it("passes a selected difficulty to the generate call", async () => {
    const mutate = mockUseGenerate()
    useQuizList.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    renderPage()

    fireEvent.click(screen.getByText("AI Generate"))
    await waitFor(() => expect(screen.getByText("Generate quiz with AI")).toBeTruthy())

    const gradeCombobox = screen.getByRole("combobox", { name: "Grade" })
    fireEvent.click(gradeCombobox)
    fireEvent.click(await screen.findByText("Grade 9"))

    const courseCombobox = screen.getByRole("combobox", { name: "Course" })
    fireEvent.click(courseCombobox)
    fireEvent.click(await screen.findByText("Physics"))

    await waitFor(() => expect(screen.getAllByText("9-A").length).toBeGreaterThan(0))
    fireEvent.click(screen.getByText("9-A", { selector: "span.font-label-md" }))

    const topic = screen.getByPlaceholderText(/Photosynthesis/)
    fireEvent.change(topic, { target: { value: "Photosynthesis" } })

    const difficultyCombobox = screen.getByRole("combobox", { name: "Difficulty" })
    fireEvent.click(difficultyCombobox)
    const options = screen.getAllByRole("option")
    fireEvent.click(options.find((o) => o.textContent === "Hard")!)

    fireEvent.click(screen.getByText("Generate"))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: "HARD" }),
        expect.any(Object),
      ),
    )
  })

  it("filters quizzes by search text", () => {
    useQuizList.mockReturnValue({
      data: [
        { ...quiz, id: "q1", title: "Algebra basics" },
        { ...quiz, id: "q2", title: "Photosynthesis" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Algebra basics")).toBeTruthy()
    expect(screen.getByText("Photosynthesis")).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText("Search quizzes…"), {
      target: { value: "photo" },
    })
    expect(screen.queryByText("Algebra basics")).toBeNull()
    expect(screen.getByText("Photosynthesis")).toBeTruthy()
  })

  it("filters quizzes by status", () => {
    useQuizList.mockReturnValue({
      data: [
        { ...quiz, id: "q1", title: "Draft quiz", status: "DRAFT" },
        { ...quiz, id: "q2", title: "Published quiz", status: "PUBLISHED" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Draft quiz")).toBeTruthy()

    const statusCombobox = screen.getAllByRole("combobox")[3]
    fireEvent.click(statusCombobox)
    const options = screen.getAllByRole("option")
    fireEvent.click(options.find((o) => o.textContent === "Published")!)
    expect(screen.queryByText("Draft quiz")).toBeNull()
    expect(screen.getByText("Published quiz")).toBeTruthy()
  })

  it("shows publish/delete actions for drafts and reassign/close for published", () => {
    useQuizList.mockReturnValue({
      data: [
        { ...quiz, id: "q1", title: "Draft quiz", status: "DRAFT" },
        { ...quiz, id: "q2", title: "Published quiz", status: "PUBLISHED" },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Publish")).toBeTruthy()
    expect(screen.getByText("Edit")).toBeTruthy()
    expect(screen.getByText("View attempts")).toBeTruthy()
    expect(screen.getByText("Reassign")).toBeTruthy()
    expect(screen.getByText("Close")).toBeTruthy()
  })

  it("submits the generate dialog with courseId and assignments", async () => {
    const mutate = mockUseGenerate()
    useQuizList.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    renderPage()

    fireEvent.click(screen.getByText("AI Generate"))
    await waitFor(() => expect(screen.getByText("Generate quiz with AI")).toBeTruthy())

    const gradeCombobox = screen.getByRole("combobox", { name: "Grade" })
    fireEvent.click(gradeCombobox)
    fireEvent.click(await screen.findByText("Grade 9"))

    const courseCombobox = screen.getByRole("combobox", { name: "Course" })
    fireEvent.click(courseCombobox)
    fireEvent.click(await screen.findByText("Physics"))

    await waitFor(() => expect(screen.getAllByText("9-A").length).toBeGreaterThan(0))
    fireEvent.click(screen.getByText("9-A", { selector: "span.font-label-md" }))

    const topic = screen.getByPlaceholderText(/Photosynthesis/)
    fireEvent.change(topic, { target: { value: "Photosynthesis" } })

    fireEvent.click(screen.getByText("Generate"))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: "course-physics",
          topic: "Photosynthesis",
          difficulty: "MEDIUM",
          assignments: [{ courseOfferingId: "off-a1", targetStudentIds: undefined }],
        }),
        expect.any(Object),
      ),
    )
  })

  it("shows an empty state when there are no quizzes", () => {
    renderPage()
    expect(screen.getByText("No quizzes yet")).toBeTruthy()
  })
})