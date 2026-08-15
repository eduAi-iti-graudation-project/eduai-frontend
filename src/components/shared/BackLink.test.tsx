import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { BackLink } from "@/components/shared/BackLink"

describe("BackLink", () => {
  it("renders an arrow with the label and href", () => {
    render(
      <MemoryRouter>
        <BackLink to="/grades" label="Back to Grades" />
      </MemoryRouter>,
    )
    const link = screen.getByRole("link", { name: "Back to Grades" })
    expect(link).toBeTruthy()
    expect(link.getAttribute("href")).toBe("/grades")
    expect(link.querySelector(".material-symbols-outlined")).toBeTruthy()
  })

  it("applies an extra className", () => {
    render(
      <MemoryRouter>
        <BackLink to="/" label="Back" className="mb-4" />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: "Back" }).className).toContain("mb-4")
  })
})