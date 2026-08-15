import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClassMaterialsTab } from "@/pages/teacher/ClassMaterialsTab"
import type { SectionCourse } from "@/pages/teacher/ClassMaterialsTab"

const { useSectionMaterialChapters } = vi.hoisted(() => ({
  useSectionMaterialChapters: vi.fn(),
}))

vi.mock("@/hooks/use-materials", () => ({
  useSectionMaterialChapters: (...a: unknown[]) => useSectionMaterialChapters(...a),
}))

vi.mock("@/lib/api", () => ({
  uploadMaterial: vi.fn().mockResolvedValue({ id: "mat-1" }),
  deleteMaterial: vi.fn().mockResolvedValue(undefined),
  getMaterialFileUrl: vi.fn().mockResolvedValue("https://example.com/file.pdf"),
  getErrorMessage: (err: unknown) => (err instanceof Error ? err.message : "Something went wrong"),
}))

const chapter = {
  id: "ch-1",
  title: "Chapter 1 — Intro to Cells",
  order: 0,
  materials: [],
  createdAt: "2026-01-01T00:00:00Z",
}

const course: SectionCourse = {
  offeringId: "off-1",
  courseId: "course-1",
  courseName: "Biology",
  taughtByMe: true,
}

function baseMutations() {
  return {
    create: { mutateAsync: vi.fn().mockResolvedValue({ id: "ch-new" }), isPending: false },
    update: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    remove: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    move: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  }
}

function renderTab(
  courses: SectionCourse[] = [course],
  overrides: Partial<ReturnType<typeof baseMutations>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  useSectionMaterialChapters.mockReturnValue({
    chapters: [chapter],
    unassigned: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...baseMutations(),
    ...overrides,
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClassMaterialsTab classId="sec-1" courses={courses} />
    </QueryClientProvider>,
  )
}

async function createChapterAndUploadFile() {
  fireEvent.click(screen.getByRole("button", { name: /New Chapter/ }))
  const titleInput = await screen.findByLabelText("Chapter title")
  fireEvent.change(titleInput, { target: { value: "Genetics" } })
  const file = new File(["pdf"], "genetics.pdf", { type: "application/pdf" })
  const dialog = await screen.findByRole("dialog")
  const input = within(dialog)
    .getByRole("button", { name: /browse/i })
    .querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
  fireEvent.click(screen.getByRole("button", { name: "Create & upload 1 file" }))
}

describe("ClassMaterialsTab", () => {
  afterEach(() => cleanup())
  beforeEach(() => vi.clearAllMocks())

  it("shows an empty state when the section has no courses", () => {
    renderTab([])
    expect(screen.getByText("No courses assigned")).toBeTruthy()
  })

  it("uses the section-only scope by default and uploads with sectionId", async () => {
    const { uploadMaterial } = await import("@/lib/api")
    renderTab()

    expect(screen.getByRole("button", { name: "This section only" })).toBeTruthy()
    await createChapterAndUploadFile()

    await waitFor(() =>
      expect(uploadMaterial).toHaveBeenCalledWith(
        "genetics",
        expect.any(File),
        { sectionId: "sec-1", courseId: "course-1", chapterId: "ch-new" },
      ),
    )
  })

  it("uploads with courseId only in all-sections scope", async () => {
    const { uploadMaterial } = await import("@/lib/api")
    renderTab()

    fireEvent.click(screen.getByRole("button", { name: "All sections of this course" }))
    await createChapterAndUploadFile()

    await waitFor(() =>
      expect(uploadMaterial).toHaveBeenCalledWith(
        "genetics",
        expect.any(File),
        { courseId: "course-1", chapterId: "ch-new" },
      ),
    )
  })

  it("renders a course picker even with a single course", () => {
    renderTab()
    expect(screen.getByRole("combobox")).toBeTruthy()
    expect(screen.getAllByRole("option").length).toBe(1)
    expect(screen.getByRole("option", { name: "Biology" })).toBeTruthy()
  })

  it("renders a course picker when the section has multiple courses", () => {
    renderTab([
      course,
      { offeringId: "off-2", courseId: "course-2", courseName: "Chemistry", taughtByMe: true },
    ])
    expect(screen.getByText("Biology")).toBeTruthy()
    expect(screen.getByRole("combobox")).toBeTruthy()
    expect(screen.getAllByRole("option").length).toBe(2)
  })

  it("disables uploads when the selected course is not taught by the teacher", () => {
    renderTab([{ ...course, taughtByMe: false }])
    expect(screen.getByRole("button", { name: /New Chapter/ }).hasAttribute("disabled")).toBe(true)
    expect(screen.getByText(/only the teacher of this course in this section can upload/)).toBeTruthy()
  })
})
