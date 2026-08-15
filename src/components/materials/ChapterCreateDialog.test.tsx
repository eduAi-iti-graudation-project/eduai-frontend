import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { ChapterCreateDialog } from "@/components/materials/ChapterCreateDialog"

describe("ChapterCreateDialog", () => {
  afterEach(() => cleanup())

  it("creates a chapter from the title", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(
      <ChapterCreateDialog
        open
        onOpenChange={() => {}}
        onCreate={onCreate}
      />,
    )
    fireEvent.change(screen.getByLabelText("Chapter title"), {
      target: { value: "Chapter 1 — Intro to Cells" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create chapter" }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Chapter 1 — Intro to Cells", []))
  })

  it("shows the upload button label when files are attached", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(
      <ChapterCreateDialog
        open
        onOpenChange={() => {}}
        onCreate={onCreate}
      />,
    )
    fireEvent.change(screen.getByLabelText("Chapter title"), {
      target: { value: "Genetics" },
    })
    const file = new File(["pdf"], "genetics.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText("genetics.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Create & upload 1 file" }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Genetics", [file]))
  })

  it("disables the create button until a title is typed", () => {
    render(<ChapterCreateDialog open onOpenChange={() => {}} onCreate={vi.fn()} />)
    const button = screen.getByRole("button", { name: "Create chapter" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })
})