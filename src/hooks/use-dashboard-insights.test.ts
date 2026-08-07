import { describe, expect, it } from "vitest"
import { dashboardInsightsQueryKey, studentInsightsQueryKey } from "@/hooks/use-dashboard-insights"

describe("insights query keys", () => {
  it("uses ['dashboard-insights', { interval }] for the role dashboard", () => {
    expect(dashboardInsightsQueryKey("week")).toEqual(["dashboard-insights", { interval: "week" }])
    expect(dashboardInsightsQueryKey("month")).toEqual(["dashboard-insights", { interval: "month" }])
  })

  it("uses ['dashboard-insights', { studentId, interval }] for drill-down", () => {
    expect(studentInsightsQueryKey("stu-1", "week")).toEqual([
      "dashboard-insights",
      { studentId: "stu-1", interval: "week" },
    ])
    expect(studentInsightsQueryKey("stu-2", "month")).toEqual([
      "dashboard-insights",
      { studentId: "stu-2", interval: "month" },
    ])
  })

  it("produces distinct keys when the interval toggles", () => {
    expect(dashboardInsightsQueryKey("week")).not.toEqual(dashboardInsightsQueryKey("month"))
  })
})
