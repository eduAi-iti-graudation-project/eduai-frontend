import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useState } from "react"
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QuizTargetPicker, type TargetOffering } from "@/components/quiz/QuizTargetPicker"

const { useTeacherOfferings, getTeacherGrades, getUsers } = vi.hoisted(() => ({
  useTeacherOfferings: vi.fn(),
  getTeacherGrades: vi.fn(),
  getUsers: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/hooks/use-labs", () => ({
  useTeacherOfferings: () => useTeacherOfferings(),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
  getUsers,
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

function renderPicker(initial: TargetOffering[] = []) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onChange = vi.fn()
  const Wrapper = () => {
    const [v, setV] = useState(initial)
    onChange.mockImplementation((next: TargetOffering[]) => setV(next))
    return <QuizTargetPicker value={v} onChange={onChange} />
  }
  render(
    <QueryClientProvider client={queryClient}>
      <Wrapper />
    </QueryClientProvider>,
  )
  return { onChange }
}

async function pickCombobox(label: string, optionLabel: string) {
  const combobox = await screen.findByRole("combobox", { name: label })
  fireEvent.click(combobox)
  const option = await screen.findByText(optionLabel)
  fireEvent.click(option)
}

function sectionButton(name: string): HTMLButtonElement {
  const span = screen.getByText(name, { selector: "span.font-label-md" })
  const button = span.closest("button")
  if (!button) throw new Error(`No section button for ${name}`)
  return button as HTMLButtonElement
}

describe("QuizTargetPicker", () => {
  afterEach(() => cleanup())
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherGrades.mockResolvedValue([
      { id: "grade-a", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
      { id: "grade-b", level: 10, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
    useTeacherOfferings.mockReturnValue({ data: offerings, isLoading: false })
    getUsers.mockResolvedValue([
      { id: "student-1", email: "ali@school.edu", name: "Ali", role: "STUDENT", gradeId: null },
      { id: "student-2", email: "sara@school.edu", name: "Sara", role: "STUDENT", gradeId: null },
    ])
  })

  it("cascades grade → course → section and assigns multiple sections", async () => {
    const { onChange } = renderPicker()

    await pickCombobox("Grade", "Grade 9")
    await pickCombobox("Course", "Physics")
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())
    await waitFor(() => expect(screen.getByText("9-B")).toBeTruthy())

    fireEvent.click(sectionButton("9-A"))
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        courseOfferingId: "off-a",
        courseId: "course-a",
        courseName: "Physics",
        sectionId: "sec-a",
        sectionName: "9-A",
        gradeLevelId: "grade-a",
        targetStudentIds: [],
      }),
    ])

    fireEvent.click(sectionButton("9-B"))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ courseOfferingId: "off-a" }),
        expect.objectContaining({ courseOfferingId: "off-b" }),
      ]),
    )
  })

  it("toggles a section off when clicked again", async () => {
    const { onChange } = renderPicker()

    await pickCombobox("Grade", "Grade 9")
    await pickCombobox("Course", "Physics")
    await waitFor(() => expect(screen.getByText("9-A")).toBeTruthy())

    fireEvent.click(sectionButton("9-A"))
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ courseOfferingId: "off-a" }),
    ])

    fireEvent.click(sectionButton("9-A"))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it("lets the teacher target specific students in a section", async () => {
    const { onChange } = renderPicker([
      {
        courseOfferingId: "off-a",
        targetStudentIds: [],
        gradeLevelId: "grade-a",
        gradeLevelName: "",
        courseId: "course-a",
        courseName: "Physics",
        sectionId: "sec-a",
        sectionName: "9-A",
      },
    ])

    // Navigate the cascade to the assigned section so the targeting UI renders.
    await pickCombobox("Grade", "Grade 9")
    await pickCombobox("Course", "Physics")
    await waitFor(() => expect(screen.getAllByText("9-A").length).toBeGreaterThan(0))

    const search = screen.getByPlaceholderText("Search students…")
    fireEvent.change(search, { target: { value: "ali" } })
    await waitFor(() => expect(getUsers).toHaveBeenCalledWith({ role: "STUDENT", q: "ali", take: 20 }))
    await waitFor(() => expect(screen.getByText("Ali")).toBeTruthy())

    fireEvent.click(screen.getByText("Ali"))
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        courseOfferingId: "off-a",
        targetStudentIds: ["student-1"],
      }),
    ])
  })

  it("shows targeted-student count on the selection chip", async () => {
    renderPicker([
      {
        courseOfferingId: "off-a",
        targetStudentIds: ["student-1"],
        gradeLevelId: "grade-a",
        gradeLevelName: "",
        courseId: "course-a",
        courseName: "Physics",
        sectionId: "sec-a",
        sectionName: "9-A",
      },
    ])
    const chip = await screen.findByText("1 targeted")
    expect(chip).toBeTruthy()
  })
})