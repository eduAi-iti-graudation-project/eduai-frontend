import { describe, expect, it } from "vitest"
import { getGradeLabel, type GradeRef } from "./grade-label"

describe("getGradeLabel", () => {
  it("returns null for undefined or null grade", () => {
    expect(getGradeLabel(undefined)).toBeNull()
    expect(getGradeLabel(null)).toBeNull()
  })

  it("returns Grade <level> when level is present", () => {
    const grade: GradeRef = { id: "g1", level: 10, name: "Grade 10" }
    expect(getGradeLabel(grade)).toBe("Grade 10")
  })

  it("falls back to the grade name when level is invalid", () => {
    const grade: GradeRef = { id: "g1", level: 0, name: "Tenth Grade" }
    expect(getGradeLabel(grade)).toBe("Tenth Grade")
  })

  it("returns null when neither level nor name is usable", () => {
    const grade: GradeRef = { id: "g1", level: 0, name: null }
    expect(getGradeLabel(grade)).toBeNull()
  })
})