import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { StudyLabPage } from "@/pages/student/StudyLabPage"

vi.mock("@/hooks/use-study-lab", () => ({
  useStudyLabOfferings: () => ({
    data: [
      { offeringId: "off-a", courseId: "course-a", courseName: "Algebra", materialCount: 3 },
      { offeringId: "off-b", courseId: "course-b", courseName: "Biology", materialCount: 0 },
    ],
  }),
  useGenerateStudyLab: () => ({ isPending: false, mutate: vi.fn() }),
  useStudyLabHistory: () => ({ data: [] }),
  useStudyLabGeneration: () => ({ generation: null, isLoading: false }),
  useDeleteStudyLabGeneration: () => ({ mutate: vi.fn() }),
}))

function courseTrigger(): HTMLButtonElement {
  const boxes = screen.getAllByRole("combobox") as HTMLButtonElement[]
  const trigger = boxes.find((b) => b.textContent?.includes("Select a course"))
  if (!trigger) throw new Error("course select trigger not found")
  return trigger
}

describe("StudyLabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders one course option per offering with the course name", async () => {
    render(<StudyLabPage />)

    const trigger = courseTrigger()
    expect(trigger.textContent).toContain("Select a course")
  })

  it("shows course-only labels with material counts and no section names", async () => {
    render(<StudyLabPage />)

    courseTrigger().click()

    const option = await screen.findByText(/Algebra/)
    expect(option).toBeInTheDocument()
    expect(option.textContent).toContain("3 materials")
    expect(option.textContent).not.toContain("Section")
  })

  it("marks courses with no materials", async () => {
    render(<StudyLabPage />)

    courseTrigger().click()

    const option = await screen.findByText(/Biology/)
    expect(option.textContent).toContain("no materials")
    expect(option.textContent).not.toContain("Section")
  })
})