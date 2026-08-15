import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { InsightSection } from "@/lib/api"
import { CHART_COLORS } from "@/components/insights/chart-theme"

export type OnPointClick = (label: string, value: number) => void

interface ChartProps {
  section: InsightSection
  onPointClick?: OnPointClick
}

function pointClickHandler(onPointClick?: OnPointClick) {
  if (!onPointClick) return undefined
  return (data: unknown) => {
    const d = (data ?? {}) as {
      payload?: { label?: string | number; value?: string | number }
      label?: string | number
      value?: string | number
    }
    const entry = d.payload ?? d
    const { label, value } = entry
    if (typeof label === "string" && typeof value === "number") {
      onPointClick(label, value)
    }
  }
}

const click = (onPointClick?: OnPointClick) =>
  pointClickHandler(onPointClick) as never

export function TrendLineChart({ section, onPointClick }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ecd5e2" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          name={section.title}
          stroke="#db2777"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#db2777" }}
          onClick={click(onPointClick)}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TrendAreaChart({ section, onPointClick }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <defs>
          <linearGradient id={`grad-${section.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#db2777" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#db2777" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ecd5e2" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="value"
          name={section.title}
          stroke="#db2777"
          strokeWidth={2.5}
          fill={`url(#grad-${section.key})`}
          onClick={click(onPointClick)}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ComparisonBarChart({ section, onPointClick }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ecd5e2" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#7d5470", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="value" name={section.title} radius={[8, 8, 0, 0]} onClick={click(onPointClick)}>
          {section.series.map((entry, index) => (
            <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StrengthRadarChart({ section, onPointClick }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={section.series} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#ecd5e2" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "#7d5470", fontSize: 12 }} />
        <Radar
          dataKey="value"
          name={section.title}
          stroke="#db2777"
          fill="#db2777"
          fillOpacity={0.25}
          onClick={click(onPointClick)}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ section, onPointClick }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={section.series}
          dataKey="value"
          nameKey="label"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={3}
          onClick={click(onPointClick)}
        >
          {section.series.map((entry, index) => (
            <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
