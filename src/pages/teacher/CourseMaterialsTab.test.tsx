import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CourseMaterialsTab } from "@/pages/teacher/CourseMaterialsTab"

const { useCourseMaterialChapters } = vi.hoisted(() => ({
  useCourseMaterialChapters: vi.fn(),
}))

vi.mock("@/hooks/use-materials", () => ({
  useCourseMaterialChapters: (...a: unknown[]) => useCourseMaterialChapters(...a),
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

function baseMutations() {
  return {
    create: { mutateAsync: vi.fn().mockResolvedValue({ id: "ch-new" }), isPending: false },
    update: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    remove: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    move: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  }
}

function renderTab(overrides: Partial<ReturnType<typeof baseMutations>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  useCourseMaterialChapters.mockReturnValue({
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
      <CourseMaterialsTab courseId="course-1" offeringId="off-1" sectionName="9-A" />
    </QueryClientProvider>,
  )
}

describe("CourseMaterialsTab", () => {
  afterEach(() => cleanup())
  beforeEach(() => vi.clearAllMocks())

  it("renders chapters and a New Chapter button", () => {
    renderTab()
    expect(screen.getByText("Chapter 1 — Intro to Cells")).toBeTruthy()
    expect(screen.getByRole("button", { name: /New Chapter/ })).toBeTruthy()
  })

  it("creates a chapter from the dialog title", async () => {
    const mutations = baseMutations()
    renderTab({ create: { ...mutations.create } })

    fireEvent.click(screen.getByRole("button", { name: /New Chapter/ }))
    const titleInput = await screen.findByLabelText("Chapter title")
    fireEvent.change(titleInput, { target: { value: "Chapter 2 — Genetics" } })
    fireEvent.click(screen.getByRole("button", { name: "Create chapter" }))

    await waitFor(() =>
      expect(mutations.create.mutateAsync).toHaveBeenCalledWith("Chapter 2 — Genetics"),
    )
  })

  it("uploads files into the newly created chapter", async () => {
    const { uploadMaterial } = await import("@/lib/api")
    const createMutate = vi.fn().mockResolvedValue({ id: "ch-new" })
    renderTab({ create: { mutateAsync: createMutate, isPending: false } })

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

    await waitFor(() =>
      expect(uploadMaterial).toHaveBeenCalledWith(
        "genetics",
        file,
        { courseOfferingId: "off-1", chapterId: "ch-new" },
      ),
    )
  })

  it("shows the Add PDF button on each chapter", () => {
    renderTab()
    expect(screen.getByTitle("Add PDF")).toBeTruthy()
  })
})