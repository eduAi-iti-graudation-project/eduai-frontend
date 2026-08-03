import { describe, expect, it } from "vitest"
import { directionStyles, formatPercent, isEmptySection } from "@/components/insights/delta-utils"

describe("formatPercent", () => {
  it("prefixes positive deltas with a plus sign", () => {
    expect(formatPercent(12.5)).toBe("+12.5%")
    expect(formatPercent(8)).toBe("+8%")
  })

  it("keeps negative deltas signed", () => {
    expect(formatPercent(-8)).toBe("-8%")
    expect(formatPercent(-12.5)).toBe("-12.5%")
  })

  it("renders zero deltas without a sign", () => {
    expect(formatPercent(0)).toBe("0%")
    expect(formatPercent(-0)).toBe("0%")
  })

  it("drops trailing zero decimals", () => {
    expect(formatPercent(12.0)).toBe("+12%")
    expect(formatPercent(-3.0)).toBe("-3%")
  })
})

describe("directionStyles", () => {
  it("maps up → green (primary), down → red (error), flat → gray", () => {
    expect(directionStyles.up).toContain("text-primary")
    expect(directionStyles.down).toContain("text-error")
    expect(directionStyles.flat).toContain("text-on-surface-variant")
  })

  it("distinguishes the three directions from each other", () => {
    expect(directionStyles.up).not.toBe(directionStyles.down)
    expect(directionStyles.down).not.toBe(directionStyles.flat)
    expect(directionStyles.up).not.toBe(directionStyles.flat)
  })
})

describe("isEmptySection", () => {
  it("is true when series is empty (never render an empty chart)", () => {
    expect(isEmptySection({ series: [] })).toBe(true)
  })

  it("is false when the section has data", () => {
    expect(isEmptySection({ series: [{ label: "w1", value: 4 }] })).toBe(false)
  })
})
