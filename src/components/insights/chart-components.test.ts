import { describe, expect, it } from "vitest"
import {
  ComparisonBarChart,
  DonutChart,
  StrengthRadarChart,
  TrendAreaChart,
  TrendLineChart,
} from "@/components/insights/chart-components"
import { getChartComponent } from "@/components/insights/chart-map"

describe("getChartComponent", () => {
  it("maps every chartType to its generic component", () => {
    expect(getChartComponent("line")).toBe(TrendLineChart)
    expect(getChartComponent("area")).toBe(TrendAreaChart)
    expect(getChartComponent("bar")).toBe(ComparisonBarChart)
    expect(getChartComponent("radar")).toBe(StrengthRadarChart)
    expect(getChartComponent("donut")).toBe(DonutChart)
  })

  it("never maps to a component of another chart type", () => {
    const mapping = {
      line: TrendLineChart,
      area: TrendAreaChart,
      bar: ComparisonBarChart,
      radar: StrengthRadarChart,
      donut: DonutChart,
    } as const

    for (const type of ["line", "area", "bar", "radar", "donut"] as const) {
      for (const other of ["line", "area", "bar", "radar", "donut"] as const) {
        if (other === type) continue
        expect(getChartComponent(type)).not.toBe(mapping[other])
      }
    }
  })
})
