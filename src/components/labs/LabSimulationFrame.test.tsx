import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react"
import { LabSimulationFrame } from "@/components/labs/LabSimulationFrame"
import type { LabGameSpec } from "@/lib/api"

afterEach(() => {
  cleanup()
})

const matchSpec: LabGameSpec = {
  template: "match-pairs",
  title: "Match the terms",
  instructions: "Match each term to its definition.",
  objective: "Match all pairs.",
  pairs: [
    { id: "p1", term: "Nucleus", definition: "Stores genetic material" },
    { id: "p2", term: "Ribosome", definition: "Makes proteins" },
  ],
}

describe("LabSimulationFrame", () => {
  it("renders the template game when a spec is provided and reports the win", () => {
    const onObjectiveComplete = vi.fn()
    render(<LabSimulationFrame spec={matchSpec} onObjectiveComplete={onObjectiveComplete} />)

    expect(screen.getByText("Match the terms")).toBeInTheDocument()
    expect(screen.queryByTitle("Lab simulation sandbox")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))
    fireEvent.click(screen.getByRole("button", { name: /Ribosome/ }))
    fireEvent.click(screen.getByRole("button", { name: /Makes proteins/ }))

    expect(onObjectiveComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Objective complete")).toBeInTheDocument()
  })

  it("renders the sandboxed iframe when only code is provided", () => {
    render(<LabSimulationFrame code="Matter.Engine.create()" />)

    expect(screen.getByTitle("Lab simulation sandbox")).toBeInTheDocument()
    expect(screen.queryByText("Match the terms")).not.toBeInTheDocument()
  })

  it("restart resets the game so the objective can be completed again", () => {
    const onObjectiveComplete = vi.fn()
    const { rerender } = render(<LabSimulationFrame spec={matchSpec} onObjectiveComplete={onObjectiveComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))
    fireEvent.click(screen.getByRole("button", { name: /Ribosome/ }))
    fireEvent.click(screen.getByRole("button", { name: /Makes proteins/ }))
    expect(onObjectiveComplete).toHaveBeenCalledTimes(1)

    screen.getByRole("button", { name: /Restart/ }).click()
    rerender(<LabSimulationFrame spec={matchSpec} onObjectiveComplete={onObjectiveComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /Nucleus/ }))
    fireEvent.click(screen.getByRole("button", { name: /Stores genetic material/ }))
    fireEvent.click(screen.getByRole("button", { name: /Ribosome/ }))
    fireEvent.click(screen.getByRole("button", { name: /Makes proteins/ }))
    expect(onObjectiveComplete).toHaveBeenCalledTimes(2)
  })

  it("surfaces a runtime error from the sandbox as an overlay with the exact message", () => {
    const onRuntimeError = vi.fn()
    render(<LabSimulationFrame code="Matter.Engine.create()" onRuntimeError={onRuntimeError} />)

    fireEvent(
      window,
      new MessageEvent("message", {
        data: { type: "eduai-lab", event: "runtime-error", message: "Matter is not defined" },
      }),
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("The simulation hit a runtime error")).toBeInTheDocument()
    expect(screen.getByText("Matter is not defined")).toBeInTheDocument()
    expect(onRuntimeError).toHaveBeenCalledWith("Matter is not defined")

    // Restart clears the overlay and re-mounts the sandbox.
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: /Restart/ }))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("ignores postMessage payloads outside the eduai-lab protocol", () => {
    const onRuntimeError = vi.fn()
    render(<LabSimulationFrame code="Matter.Engine.create()" onRuntimeError={onRuntimeError} />)

    fireEvent(
      window,
      new MessageEvent("message", {
        data: { type: "other", event: "runtime-error", message: "ignored" },
      }),
    )
    fireEvent(window, new MessageEvent("message", { data: null }))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(onRuntimeError).not.toHaveBeenCalled()
  })
})