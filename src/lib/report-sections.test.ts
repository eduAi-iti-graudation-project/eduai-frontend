import { describe, expect, it } from "vitest"
import { renderReportSection } from "./report-sections"

describe("renderReportSection", () => {
  it("returns a fallback for null/undefined", () => {
    expect(renderReportSection(null)).toBe("No content available.")
    expect(renderReportSection(undefined)).toBe("No content available.")
  })

  it("returns the string as-is", () => {
    expect(renderReportSection("All good")).toBe("All good")
  })

  it("returns a fallback for an empty/whitespace string", () => {
    expect(renderReportSection("   ")).toBe("No content available.")
  })

  it("renders structured sections as readable markdown", () => {
    const content = { message: "Improving", homeSupport: ["Read more"] }
    expect(renderReportSection(content)).toBe(
      "- **Message:** Improving\n- **Home Support:**\n  - Read more",
    )
  })

  it("renders top-level arrays as bullet lists", () => {
    expect(renderReportSection(["One", "Two"])).toBe("- One\n- Two")
  })
})