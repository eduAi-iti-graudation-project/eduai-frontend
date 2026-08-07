import { describe, expect, it } from "vitest"
import { normalizeJoinCode } from "@/lib/api"

describe("normalizeJoinCode", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeJoinCode("  demo2026  ")).toBe("DEMO2026")
  })

  it("uppercases lowercase input", () => {
    expect(normalizeJoinCode("demo2026")).toBe("DEMO2026")
  })

  it("handles mixed case with inner spaces intact", () => {
    expect(normalizeJoinCode(" demo-2026 ")).toBe("DEMO-2026")
  })

  it("returns an empty string for blank input", () => {
    expect(normalizeJoinCode("   ")).toBe("")
  })
})
