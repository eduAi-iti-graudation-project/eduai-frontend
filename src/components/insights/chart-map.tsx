import type { InsightChartType, InsightSection } from "@/lib/api"
import {
  ComparisonBarChart,
  DonutChart,
  StrengthRadarChart,
  TrendAreaChart,
  TrendLineChart,
  type OnPointClick,
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

export function renderChart(section: InsightSection, onPointClick?: OnPointClick) {
  switch (section.chartType) {
    case "line":
      return <TrendLineChart section={section} onPointClick={onPointClick} />
    case "area":
      return <TrendAreaChart section={section} onPointClick={onPointClick} />
    case "bar":
      return <ComparisonBarChart section={section} onPointClick={onPointClick} />
    case "radar":
      return <StrengthRadarChart section={section} onPointClick={onPointClick} />
    case "donut":
      return <DonutChart section={section} onPointClick={onPointClick} />
  }
}
