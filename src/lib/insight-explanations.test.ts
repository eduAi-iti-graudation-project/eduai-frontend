import { describe, expect, it } from "vitest"
import {
  formatBucket,
  getInsightExplanation,
  interpretPoint,
} from "@/lib/insight-explanations"

describe("getInsightExplanation", () => {
  it("returns a curated explanation for every known section key", () => {
    const keys = [
      "submissions_volume",
      "confirmed_grades",
      "pending_confirmations",
      "alerts_created",
      "alerts_resolved",
      "attendance_rate",
      "class_average",
      "criterion_average",
      "struggling_students",
      "grade_trend",
      "attendance_trend",
      "criterion_strengths",
      "help_action_split",
      "pass_rate_trend",
      "user_growth",
      "teacher_workload",
      "alert_status_split",
    ]
    for (const key of keys) {
      const explanation = getInsightExplanation(key)
      expect(explanation.subtitle.length, `${key} subtitle`).toBeGreaterThan(0)
      expect(explanation.what.length, `${key} what`).toBeGreaterThan(0)
    }
  })

  it("resolves guardian per-child keys by their kind", () => {
    const grades = getInsightExplanation(
      "child_11111111-1111-1111-1111-111111111111_grades",
    )
    const alerts = getInsightExplanation(
      "child_22222222-2222-2222-2222-222222222222_alerts",
    )
    const attendance = getInsightExplanation(
      "child_33333333-3333-3333-3333-333333333333_attendance",
    )

    expect(grades.isPercent).toBe(true)
    expect(grades.subtitle).toContain("grades")
    expect(alerts.unitNoun).toBe("alert")
    expect(attendance.isPercent).toBe(true)
  })

  it("falls back to a generic explanation for unknown keys", () => {
    const explanation = getInsightExplanation("does_not_exist")
    expect(explanation.subtitle).toContain("changes over time")
  })
})

describe("formatBucket", () => {
  it("formats a weekly bucket label", () => {
    expect(formatBucket("week", "2026-08-10")).toMatch(/week of/i)
    expect(formatBucket("week", "2026-08-10")).toMatch(/Aug/i)
  })

  it("formats a monthly bucket label", () => {
    expect(formatBucket("month", "2026-08-01")).toContain("2026")
  })

  it("returns the raw label when it is not a date", () => {
    expect(formatBucket("week", "Math")).toBe("Math")
  })
})

describe("interpretPoint", () => {
  it("describes a count point on a trend chart with its period", () => {
    const sentence = interpretPoint(
      { key: "submissions_volume", chartType: "area" },
      "2026-08-10",
      3,
      "week",
    )
    expect(sentence).toContain("3 submissions")
    expect(sentence).toMatch(/week of/i)
    expect(sentence).toMatch(/Aug/i)
  })

  it("uses the singular noun for a value of one", () => {
    expect(
      interpretPoint(
        { key: "alerts_created", chartType: "line" },
        "2026-08-10",
        1,
        "week",
      ),
    ).toContain("1 alert")
  })

  it("appends a percent sign for percent sections", () => {
    const sentence = interpretPoint(
      { key: "class_average", chartType: "bar" },
      "Math",
      62.5,
    )
    expect(sentence).toContain("Math: 62.5%")
  })

  it("labels category points with the category name", () => {
    expect(
      interpretPoint(
        { key: "alert_status_split", chartType: "donut" },
        "ACTIVE",
        4,
      ),
    ).toContain("ACTIVE: 4 alerts")
  })
})
