import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, within, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LabsPage } from "@/pages/teacher/LabsPage"

const {
  useTeacherOfferings,
  useLabs,
  useGenerateLab,
  useDeleteLab,
  useDeleteLabs,
  getTeacherGrades,
  useCourseMaterialChapters,
} = vi.hoisted(() => ({
  useTeacherOfferings: vi.fn(),
  useLabs: vi.fn(),
  useGenerateLab: vi.fn(),
  useDeleteLab: vi.fn(),
  useDeleteLabs: vi.fn(),
  getTeacherGrades: vi.fn(),
  useCourseMaterialChapters: vi.fn(),
}))

const mutateLab = vi.fn()
const deleteLab = vi.fn()
const deleteLabsMany = vi.fn()

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
  useDeleteLab: () => useDeleteLab(),
  useDeleteLabs: () => useDeleteLabs(),
}))

vi.mock("@/hooks/use-materials", () => ({
  useCourseMaterialChapters: () => useCourseMaterialChapters(),
}))

const UNITS = [
  { id: "unit-1", title: "Unit 1 — Kinematics", order: 1, materials: [{ id: "m1" }] },
  { id: "unit-2", title: "Unit 2 — Forces", order: 2, materials: [{ id: "m2" }] },
]

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
    deleteLab.mockReset()
    deleteLabsMany.mockReset()
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
    useGenerateLab.mockReturnValue({
      isPending: false,
      isLoading: false,
      step: null,
      lastToolStep: null,
      mutate: mutateLab,
    })
    useDeleteLab.mockReturnValue({ isPending: false, mutate: deleteLab })
    useDeleteLabs.mockReturnValue({ isPending: false, mutate: deleteLabsMany })
    useCourseMaterialChapters.mockReturnValue({ chapters: UNITS, isLoading: false })
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

  it("defaults the dialog to the top-bar section and submits every selected section with a unit and prompt", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()

    // Default selection: the section the top bar is filtered to (9-A).
    expect(await screen.findByText(/1 section selected/)).toBeInTheDocument()
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("9-A")).toBeInTheDocument()
    expect(within(dialog).getByText("9-B")).toBeInTheDocument()

    // Add a second section, pick a unit, type a prompt, and generate.
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "9-B" }))
    expect(screen.getByText(/2 sections selected/)).toBeInTheDocument()

    const dialogCombos = within(dialog).getAllByRole("combobox")
    dialogCombos[2].click()
    const unitListbox = await screen.findByRole("listbox")
    within(unitListbox).getByText(/Unit 1 — Kinematics/).click()

    const promptInput = screen.getByPlaceholderText(/Build a game where students construct a plant cell/)
    fireEvent.change(promptInput, { target: { value: "pendulum period" } })

    screen.getByRole("button", { name: "Generate lab" }).click()

    expect(mutateLab).toHaveBeenCalledWith(
      {
        courseOfferingIds: ["off-a", "off-b"],
        chapterId: "unit-1",
        prompt: "pendulum period",
        mode: "template",
      },
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

  it("keeps Generate disabled until a unit and prompt are chosen", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()
    await screen.findByText(/1 section selected/)

    expect(screen.getByRole("button", { name: "Generate lab" })).toBeDisabled()
  })

  it("deletes a lab from the list after confirmation", async () => {
    useLabs.mockReturnValue({
      labs: [
        {
          id: "lab-1",
          courseOfferingId: "off-a",
          courseOfferingIds: ["off-a"],
          topic: "Pendulum period",
          chapterId: "unit-1",
          status: "PENDING_TEACHER_REVIEW",
          generatedCode: "// x",
          template: null,
          gameSpec: null,
          reviewApproved: true,
          reviewFlags: null,
          teacherNotes: null,
          publishedAt: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
    })
    renderPage()

    screen.getByRole("button", { name: "Delete lab Pendulum period" }).click()
    const dialog = await screen.findByRole("dialog")
    within(dialog).getByRole("button", { name: "Delete lab" }).click()

    expect(deleteLab).toHaveBeenCalledWith("lab-1", expect.any(Object))
  })

  it("selects all labs with one click and deselects them with another", async () => {
    const labs = [
      {
        id: "lab-1",
        courseOfferingId: "off-a",
        courseOfferingIds: ["off-a"],
        topic: "Pendulum period",
        chapterId: "unit-1",
        status: "PENDING_TEACHER_REVIEW",
        generatedCode: "// x",
        template: null,
        gameSpec: null,
        reviewApproved: true,
        reviewFlags: null,
        teacherNotes: null,
        publishedAt: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "lab-2",
        courseOfferingId: "off-a",
        courseOfferingIds: ["off-a"],
        topic: "Projectile motion",
        chapterId: "unit-1",
        status: "PUBLISHED",
        generatedCode: "// y",
        template: null,
        gameSpec: null,
        reviewApproved: null,
        reviewFlags: null,
        teacherNotes: null,
        publishedAt: "2026-01-02T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]
    useLabs.mockReturnValue({ labs, isLoading: false })
    renderPage()
    await screen.findByText("Grade 9")

    const checkboxes = () => screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes()[0])
    expect(checkboxes()[1].getAttribute("aria-checked")).toBe("true")
    expect(checkboxes()[2].getAttribute("aria-checked")).toBe("true")

    fireEvent.click(checkboxes()[0])
    expect(checkboxes()[1].getAttribute("aria-checked")).toBe("false")
    expect(checkboxes()[2].getAttribute("aria-checked")).toBe("false")
    expect(screen.queryByRole("button", { name: "Delete selected (2)" })).not.toBeInTheDocument()
  })

  it("bulk-deletes every selected lab after confirmation", async () => {
    const labs = [
      {
        id: "lab-1",
        courseOfferingId: "off-a",
        courseOfferingIds: ["off-a"],
        topic: "Pendulum period",
        chapterId: "unit-1",
        status: "PENDING_TEACHER_REVIEW",
        generatedCode: "// x",
        template: null,
        gameSpec: null,
        reviewApproved: true,
        reviewFlags: null,
        teacherNotes: null,
        publishedAt: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "lab-2",
        courseOfferingId: "off-a",
        courseOfferingIds: ["off-a"],
        topic: "Projectile motion",
        chapterId: "unit-1",
        status: "PUBLISHED",
        generatedCode: "// y",
        template: null,
        gameSpec: null,
        reviewApproved: null,
        reviewFlags: null,
        teacherNotes: null,
        publishedAt: "2026-01-02T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]
    useLabs.mockReturnValue({ labs, isLoading: false })
    renderPage()
    await screen.findByText("Grade 9")

    // Select both labs via the checkboxes, then the toolbar button appears.
    screen.getByRole("checkbox", { name: "Select all" }).click()
    const deleteButton = await screen.findByRole("button", { name: "Delete selected (2)" })
    deleteButton.click()

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/currently published/)).toBeInTheDocument()
    within(dialog).getByRole("button", { name: "Delete 2 labs" }).click()

    expect(deleteLabsMany).toHaveBeenCalledWith(
      ["lab-1", "lab-2"],
      expect.any(Object),
    )
  })

  it("closes the dialog immediately and shows the inline agent card while generating", async () => {
    renderPage()
    await screen.findByText("Grade 9")

    screen.getByRole("button", { name: "New lab" }).click()
    await screen.findByText(/1 section selected/)

    const dialog = await screen.findByRole("dialog")
    const dialogCombos = within(dialog).getAllByRole("combobox")
    dialogCombos[2].click()
    const unitListbox = await screen.findByRole("listbox")
    within(unitListbox).getByText(/Unit 1 — Kinematics/).click()

    const promptInput = screen.getByPlaceholderText(/Build a game where students construct a plant cell/)
    fireEvent.change(promptInput, { target: { value: "pendulum period" } })

    // Generation is pending from the moment the dialog is submitted.
    useGenerateLab.mockReturnValue({
      isPending: true,
      isLoading: true,
      step: "search_curriculum",
      lastToolStep: "search_curriculum",
      mutate: mutateLab,
    })

    screen.getByRole("button", { name: "Generate lab" }).click()

    // Dialog closes immediately; the inline agent card appears instead.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Searching the unit material…")).toBeTruthy()
  })
})