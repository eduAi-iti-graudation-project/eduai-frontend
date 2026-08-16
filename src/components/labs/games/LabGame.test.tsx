import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { LabGame } from "@/components/labs/games/LabGame"
import type { LabGameSpec } from "@/lib/api"

function makeDataTransfer() {
  const store = new Map<string, string>()
  return {
    setData: (type: string, value: string) => {
      store.set(type, value)
    },
    getData: (type: string) => store.get(type) ?? "",
    effectAllowed: "move",
  } as unknown as DataTransfer
}

function drag(card: HTMLElement, target: HTMLElement) {
  const dt = makeDataTransfer()
  fireEvent.dragStart(card, { dataTransfer: dt })
  fireEvent.drop(target, { dataTransfer: dt })
}

function deckItem(label: string): HTMLElement {
  const el = screen.getAllByText(label).find((node) => node.closest("[draggable='true']"))
  if (!el) throw new Error(`deck item not found: ${label}`)
  return el.closest("[draggable='true']") as HTMLElement
}

function dropRegion(label: string): HTMLElement {
  const el = screen.getAllByText(label).find((node) => node.closest("[class*='dashed']"))
  if (!el) throw new Error(`drop region not found: ${label}`)
  return el.closest("[class*='dashed']") as HTMLElement
}

afterEach(() => {
  cleanup()
})

describe("LabGame template games", () => {
  it("drag-to-regions completes the objective once every item is placed", () => {
    const onComplete = vi.fn()
    const spec: LabGameSpec = {
      template: "drag-to-regions",
      title: "Construct the cell",
      instructions: "Drag each organelle into its region.",
      objective: "Place every organelle.",
      tabs: [
        {
          id: "e",
          label: "Eukaryotic",
          regions: [{ id: "n", label: "Nucleus" }],
        },
      ],
      items: [
        { id: "i1", label: "Nucleus", tabId: "e", regionId: "n" },
        { id: "i2", label: "Mitochondria", tabId: "e", regionId: "n" },
      ],
    }
    render(<LabGame spec={spec} onObjectiveComplete={onComplete} />)

    expect(screen.getByText("Construct the cell")).toBeInTheDocument()
    drag(deckItem("Nucleus"), dropRegion("Nucleus"))
    expect(onComplete).not.toHaveBeenCalled()
    drag(deckItem("Mitochondria"), dropRegion("Nucleus"))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("sort-categories completes the objective once every card is in its bucket", () => {
    const onComplete = vi.fn()
    const spec: LabGameSpec = {
      template: "sort-categories",
      title: "Sort the cells",
      instructions: "Drag each statement into the right category.",
      objective: "Classify every statement.",
      categories: [
        { id: "pro", label: "Prokaryotic" },
        { id: "euk", label: "Eukaryotic" },
      ],
      items: [
        { id: "i1", label: "No nucleus", categoryId: "pro" },
        { id: "i2", label: "Has nucleus", categoryId: "euk" },
      ],
    }
    render(<LabGame spec={spec} onObjectiveComplete={onComplete} />)

    drag(deckItem("No nucleus"), dropRegion("Prokaryotic"))
    expect(onComplete).not.toHaveBeenCalled()
    drag(deckItem("Has nucleus"), dropRegion("Eukaryotic"))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("match-pairs completes the objective once every pair is matched", () => {
    const onComplete = vi.fn()
    const spec: LabGameSpec = {
      template: "match-pairs",
      title: "Match the terms",
      instructions: "Match each term to its definition.",
      objective: "Match all pairs.",
      pairs: [
        { id: "p1", term: "Nucleus", definition: "Stores genetic material" },
        { id: "p2", term: "Ribosome", definition: "Makes proteins" },
      ],
    }
    render(<LabGame spec={spec} onObjectiveComplete={onComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /Ribosome/ }))
    fireEvent.click(screen.getByRole("button", { name: /Makes proteins/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("flashcards completes the objective once every card has been reviewed", () => {
    const onComplete = vi.fn()
    const spec: LabGameSpec = {
      template: "flashcards",
      title: "Cell review",
      instructions: "Flip each card.",
      objective: "Review every card.",
      cards: [
        { id: "c1", front: "Nucleus", back: "Stores genetic material" },
        { id: "c2", front: "Ribosome", back: "Makes proteins" },
      ],
    }
    render(<LabGame spec={spec} onObjectiveComplete={onComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /tap to flip/ }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: /tap to flip/ }))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("fires onObjectiveComplete only once", () => {
    const onComplete = vi.fn()
    const spec: LabGameSpec = {
      template: "match-pairs",
      title: "Match the terms",
      instructions: "Match.",
      objective: "Match all pairs.",
      pairs: [{ id: "p1", term: "Nucleus", definition: "Stores genetic material" }],
    }
    render(<LabGame spec={spec} onObjectiveComplete={onComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))
    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})