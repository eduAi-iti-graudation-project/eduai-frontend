import type { InsightChartType, InsightSection } from "@/lib/api"
import {
  ComparisonBarChart,
  DonutChart,
  StrengthRadarChart,
  TrendAreaChart,
  TrendLineChart,
} from "@/components/insights/chart-components"

export function getChartComponent(chartType: InsightChartType) {
  switch (chartType) {
    case "line":
      return TrendLineChart
    case "area":
      return TrendAreaChart
    case "bar":
      return ComparisonBarChart
    case "radar":
      return StrengthRadarChart
    case "donut":
      return DonutChart
  }
}

export function renderChart(section: InsightSection) {
  switch (section.chartType) {
    case "line":
      return <TrendLineChart section={section} />
    case "area":
      return <TrendAreaChart section={section} />
    case "bar":
      return <ComparisonBarChart section={section} />
    case "radar":
      return <StrengthRadarChart section={section} />
    case "donut":
      return <DonutChart section={section} />
  }
}
