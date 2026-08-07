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

  it("pretty-prints structured sections as JSON", () => {
    const content = { message: "Improving", homeSupport: ["Read more"] }
    expect(renderReportSection(content)).toBe(JSON.stringify(content, null, 2))
  })
})