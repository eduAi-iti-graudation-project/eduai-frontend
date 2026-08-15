import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LabsPage } from "@/pages/teacher/LabsPage"

const { useTeacherOfferings, useLabs, useGenerateLab, getTeacherGrades } =
  vi.hoisted(() => ({
    useTeacherOfferings: vi.fn(),
    useLabs: vi.fn(),
    useGenerateLab: vi.fn(),
    getTeacherGrades: vi.fn(),
  }))

const mutateLab = vi.fn()

vi.mock("@/providers/use-auth", () => ({
  useAuth: () => ({ user: { id: "teacher-1" } }),
}))

vi.mock("@/lib/api", () => ({
  getTeacherGrades,
}))

vi.mock("@/hooks/use-labs", () => ({
  useTeacherOfferings: () => useTeacherOfferings(),
  useLabs: () => useLabs(),
  useGenerateLab: () => useGenerateLab(),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LabsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// The dialog also renders grade/course/section selects once opened, so the top
// bar triggers are only reliable while the dialog is closed.
async function topBarTriggers(): Promise<HTMLButtonElement[]> {
  return (await screen.findAllByRole("combobox")) as HTMLButtonElement[]
}

describe("LabsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateLab.mockReset()
    getTeacherGrades.mockResolvedValue([
      { id: "grade-a", level: 9, name: "", createdAt: "2026-01-01T00:00:00Z" },
      { id: "grade-b", level: 10, name: "", createdAt: "2026-01-01T00:00:00Z" },
    ])
    useTeacherOfferings.mockReturnValue({
      data: [
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
      ],
    })
    useLabs.mockReturnValue({ labs: [], isLoading: false })
    useGenerateLab.mockReturnValue({ isPending: false, mutate: mutateLab })
  })

  afterEach(() => {
    cleanup()
  })

  it("pre-selects the first teaching offering across grade, course, and section", async () => {
    renderPage()

    const [, courseTrigger, sectionTrigger] = await topBarTriggers()
    // The async grade query must resolve before the grade value renders.
    expect(await screen.findByText("Grade 9")).toBeInTheDocument()
    expect(courseTrigger.textContent).toContain("Physics")
    expect(sectionTrigger.textContent).toContain("9-A")
  })

  it("renders grade options as a cascade filtered to the teacher's offerings", async () => {
    renderPage()

    const [gradeTrigger] = await topBarTriggers()
    gradeTrigger.click()

    const listbox = await screen.findByRole("listbox")
    expect(within(listbox).getByText("Grade 9")).toBeInTheDocument()
    expect(within(listbox).getByText("Grade 10")).toBeInTheDocument()
  })

  it("limits course options to the selected grade", async () => {
    renderPage()

    const [gradeTrigger] = await topBarTriggers()
    gradeTrigger.click()
    const listbox = await screen.findByRole("listbox")
    within(listbox).getByText("Grade 10").click()

    const [, courseTrigger] = await topBarTriggers()
    courseTrigger.click()
    const courseListbox = await screen.findByRole("listbox")

    expect(within(courseListbox).getByText("Chemistry")).toBeInTheDocument()
    expect(within(courseListbox).queryByText("Physics")).not.toBeInTheDocument()
  })

  it("limits section options to the selected grade and course", async () => {
    renderPage()

    // Grade 9 (default) + Physics → both 9-A and 9-B in the section dropdown.
    const [, courseTrigger] = await topBarTriggers()
    courseTrigger.click()
    const courseListbox = await screen.findByRole("listbox")
    within(courseListbox).getByText("Physics").click()

    const [, , sectionTrigger] = await topBarTriggers()
    sectionTrigger.click()
    const sectionListbox = await screen.findByRole("listbox")

    expect(within(sectionListbox).getByText("9-A")).toBeInTheDocument()
    expect(within(sectionListbox).getByText("9-B")).toBeInTheDocument()
    expect(within(sectionListbox).queryByText("10-A")).not.toBeInTheDocument()
  })

  it("defaults the dialog to the top-bar section and submits every selected section", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()

    // Default selection: the section the top bar is filtered to (9-A).
    expect(await screen.findByText(/1 section selected/)).toBeInTheDocument()
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("9-A")).toBeInTheDocument()
    expect(within(dialog).getByText("9-B")).toBeInTheDocument()

    // Add a second section, type a topic, and generate.
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "9-B" }))
    expect(screen.getByText(/2 sections selected/)).toBeInTheDocument()

    const topicInput = screen.getByPlaceholderText(
      "e.g. Projectile motion on an inclined plane",
    )
    fireEvent.change(topicInput, { target: { value: "pendulum period" } })

    screen.getByRole("button", { name: "Generate lab" }).click()

    expect(mutateLab).toHaveBeenCalledWith(
      { courseOfferingIds: ["off-a", "off-b"], topic: "pendulum period" },
      expect.any(Object),
    )
  })

  it("pre-selects every section of a newly chosen course in the dialog", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()
    await screen.findByText(/1 section selected/)

    // Switch to grade 10 → Chemistry in the dialog.
    const dialog = await screen.findByRole("dialog")
    within(dialog).getAllByRole("combobox")[0].click()
    const gradeListbox = await screen.findByRole("listbox")
    within(gradeListbox).getByText("Grade 10").click()

    // Re-query the dialog after the grade re-render, then open the course
    // select via its placeholder text.
    const dialogAfterGrade = await screen.findByRole("dialog")
    within(dialogAfterGrade).getByText("Choose a course…").click()
    const courseListbox = await screen.findByRole("listbox")
    within(courseListbox).getByText("Chemistry").click()

    // Only 10-A exists for Chemistry → exactly one section, pre-selected.
    expect(await screen.findByText(/1 section selected/)).toBeInTheDocument()
    expect(screen.getByText("10-A")).toBeInTheDocument()
    expect(screen.queryByText("9-B")).not.toBeInTheDocument()
  })

  it("keeps Generate disabled until a topic is typed", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()
    await screen.findByText(/1 section selected/)

    expect(screen.getByRole("button", { name: "Generate lab" })).toBeDisabled()
  })
})