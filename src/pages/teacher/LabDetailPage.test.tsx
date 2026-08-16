import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LabDetailPage } from "@/pages/teacher/LabDetailPage"

const {
  useLab,
  usePublishLab,
  useRejectLab,
  useRefineLab,
  useRegenerateLab,
  useDeleteLab,
  useTeacherOfferingNameMap,
} = vi.hoisted(() => ({
  useLab: vi.fn(),
  usePublishLab: vi.fn(),
  useRejectLab: vi.fn(),
  useRefineLab: vi.fn(),
  useRegenerateLab: vi.fn(),
  useDeleteLab: vi.fn(),
  useTeacherOfferingNameMap: vi.fn(),
}))

const publishMock = vi.fn()
const rejectMock = vi.fn()
const refineMock = vi.fn()
const regenerateMock = vi.fn()
const deleteMock = vi.fn()

vi.mock("@/hooks/use-labs", () => ({
  useLab: () => useLab(),
  usePublishLab: () => usePublishLab(),
  useRejectLab: () => useRejectLab(),
  useRefineLab: () => useRefineLab(),
  useRegenerateLab: () => useRegenerateLab(),
  useDeleteLab: () => useDeleteLab(),
  useTeacherOfferingNameMap: () => useTeacherOfferingNameMap(),
}))

vi.mock("@/components/labs/LabSimulationFrame", () => ({
  LabSimulationFrame: () => <div data-testid="sim-frame" />,
}))

function labRow(status: string, overrides: Record<string, unknown> = {}) {
  return {
    id: "lab-1",
    courseOfferingId: "off-a",
    courseOfferingIds: ["off-a"],
    topic: "Pendulum period",
    chapterId: "unit-1",
    status,
    generatedCode: "// matter",
    reviewApproved: status === "PENDING_TEACHER_REVIEW",
    reviewFlags:
      status === "AI_REVIEW_FAILED" ? { flags: ["XSS risk"], reasoning: "Unescaped output" } : null,
    teacherNotes: null,
    publishedAt: status === "PUBLISHED" ? "2026-01-01T00:00:00Z" : null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function renderDetail(status: string, overrides: Record<string, unknown> = {}) {
  useLab.mockReturnValue({ data: labRow(status, overrides), isLoading: false })
  useTeacherOfferingNameMap.mockReturnValue(new Map([["off-a", "Physics · 9-A"]]))
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/labs/lab-1"]}>
        <Routes>
          <Route path="/labs/:id" element={<LabDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("LabDetailPage refine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refineMock.mockReset()
    publishMock.mockReset()
    rejectMock.mockReset()
    regenerateMock.mockReset()
    deleteMock.mockReset()
    usePublishLab.mockReturnValue({ isPending: false, mutate: publishMock })
    useRejectLab.mockReturnValue({ isPending: false, mutate: rejectMock })
    useRefineLab.mockReturnValue({
      isPending: false,
      isLoading: false,
      step: null,
      lastToolStep: null,
      mutate: refineMock,
    })
    useRegenerateLab.mockReturnValue({
      isPending: false,
      isLoading: false,
      step: null,
      lastToolStep: null,
      mutate: regenerateMock,
    })
    useDeleteLab.mockReturnValue({ isPending: false, mutate: deleteMock })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the inline refine box for a lab that failed AI review", () => {
    renderDetail("AI_REVIEW_FAILED")
    expect(screen.getByText(/Refine this lab/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Send/ })).toBeInTheDocument()
  })

  it("shows the inline refine box for a lab awaiting teacher review", () => {
    renderDetail("PENDING_TEACHER_REVIEW")
    expect(screen.getByText(/Refine this lab/)).toBeInTheDocument()
  })

  it("hides the refine box once the lab is published", () => {
    renderDetail("PUBLISHED")
    expect(screen.queryByText(/Refine this lab/)).not.toBeInTheDocument()
  })

  it("submits the instruction straight from the chat box", async () => {
    renderDetail("AI_REVIEW_FAILED")

    const textarea = screen.getByPlaceholderText(/Tell the AI what to change/)
    fireEvent.change(textarea, { target: { value: "Make the objective easier to reach" } })

    screen.getByRole("button", { name: /Send/ }).click()

    expect(refineMock).toHaveBeenCalledWith(
      "lab-1",
      "Make the objective easier to reach",
      expect.any(Object),
    )
  })

  it("keeps Send disabled until an instruction is typed", () => {
    renderDetail("PENDING_TEACHER_REVIEW")

    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled()
  })

  it("shows the inline agent card while refining", () => {
    useRefineLab.mockReturnValue({
      isPending: true,
      isLoading: true,
      step: "modify_lab",
      lastToolStep: "modify_lab",
      mutate: refineMock,
    })
    renderDetail("PENDING_TEACHER_REVIEW")

    expect(screen.getByText("Applying your change…")).toBeTruthy()
  })

  it("offers Regenerate for a lab that failed AI review and regenerates after confirmation", async () => {
    renderDetail("AI_REVIEW_FAILED")

    screen.getByRole("button", { name: "Regenerate" }).click()
    const dialog = await screen.findByRole("dialog")
    within(dialog).getByRole("button", { name: "Regenerate" }).click()

    expect(regenerateMock).toHaveBeenCalledWith("lab-1", expect.any(Object))
  })

  it("hides Regenerate once the lab is published", () => {
    renderDetail("PUBLISHED")
    expect(screen.queryByRole("button", { name: "Regenerate" })).not.toBeInTheDocument()
  })

  it("deletes the lab after confirmation", async () => {
    renderDetail("AI_REVIEW_FAILED")

    screen.getByRole("button", { name: /Delete/ }).click()
    const dialog = await screen.findByRole("dialog")
    within(dialog).getByRole("button", { name: /Delete lab/ }).click()

    expect(deleteMock).toHaveBeenCalledWith("lab-1", expect.any(Object))
  })

  it("renders a template lab game and labels a failed pipeline as such", () => {
    renderDetail("AI_REVIEW_FAILED", {
      generatedCode: null,
      gameSpec: {
        template: "drag-to-regions",
        title: "Construct the cell",
        instructions: "Drag each organelle into its region.",
        objective: "Place every organelle.",
        tabs: [{ id: "e", label: "Eukaryotic", regions: [{ id: "n", label: "Nucleus" }] }],
        items: [{ id: "i1", label: "Nucleus", tabId: "e", regionId: "n" }],
      },
    })

    expect(screen.getByText(/The AI generation pipeline failed/)).toBeInTheDocument()
    expect(screen.queryByText(/The lab generation was flagged/)).not.toBeInTheDocument()
  })

  it("offers a teacher override publish for a lab that was flagged, with an explicit warning", async () => {
    renderDetail("AI_REVIEW_FAILED")

    const publishButton = screen.getByRole("button", { name: /Publish to students/ })
    expect(publishButton).toBeInTheDocument()

    publishButton.click()
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Publish this flagged lab/)).toBeInTheDocument()
    expect(
      within(dialog).getByText(/This lab's generation was flagged/i),
    ).toBeInTheDocument()

    within(dialog).getByRole("button", { name: /Publish/ }).click()
    expect(publishMock).toHaveBeenCalledWith("lab-1", expect.any(Object))
  })

  it("keeps the publish button hidden for labs that are still generating", () => {
    renderDetail("GENERATING")
    expect(screen.queryByRole("button", { name: /Publish to students/ })).not.toBeInTheDocument()
  })
})