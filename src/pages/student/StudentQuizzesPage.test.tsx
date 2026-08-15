import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StudentQuizzesPage } from "@/pages/student/StudentQuizzesPage"

const { useStudentQuizList } = vi.hoisted(() => ({
  useStudentQuizList: vi.fn(),
}))

vi.mock("@/hooks/use-quizzes", () => ({
  useStudentQuizList: () => useStudentQuizList(),
}))

const baseQuiz = {
  id: "quiz-1",
  title: "Newton's Laws",
  description: "Quiz on Newton's laws",
  timeLimit: 15,
  points: 10,
  questionCount: 2,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  endsAt: null,
  status: "PUBLISHED",
  difficulty: "MEDIUM",
  teacherId: "teacher-1",
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudentQuizzesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("StudentQuizzesPage", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the section labels of all assignments", () => {
    useStudentQuizList.mockReturnValue({
      data: [
        {
          ...baseQuiz,
          assignments: [
            { id: "a1", courseOfferingId: "off-a", sectionName: "9-A" },
            { id: "a2", courseOfferingId: "off-b", sectionName: "9-B" },
          ],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("9-A, 9-B")).toBeTruthy()
  })

  it("hides quizzes that have passed their closing date", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    useStudentQuizList.mockReturnValue({
      data: [
        {
          ...baseQuiz,
          id: "open",
          title: "Open quiz",
          endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignments: [{ id: "a1", courseOfferingId: "off-a", sectionName: "9-A" }],
        },
        {
          ...baseQuiz,
          id: "closed",
          title: "Closed quiz",
          endsAt: past,
          assignments: [{ id: "a2", courseOfferingId: "off-b", sectionName: "9-B" }],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Open quiz")).toBeTruthy()
    expect(screen.queryByText("Closed quiz")).toBeNull()
  })

  it("shows a start/resume link based on attempt status", () => {
    useStudentQuizList.mockReturnValue({
      data: [
        {
          ...baseQuiz,
          attemptStatus: "IN_PROGRESS",
          assignments: [{ id: "a1", courseOfferingId: "off-a", sectionName: "9-A" }],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("Resume quiz")).toBeTruthy()
  })

  it("renders an empty state when there are no published quizzes", () => {
    useStudentQuizList.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText("No quizzes right now")).toBeTruthy()
  })
})