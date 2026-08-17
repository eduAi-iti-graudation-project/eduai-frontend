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
import { AXIS_TICK, CHART_COLORS, GRID_LINE, SERIES_ALT, SERIES_MAIN, SERIES_SUCCESS } from "@/components/insights/chart-theme"
import { clickableDot } from "@/components/insights/clickable-dot"

export type ChartPointClick = (label: string, value: number) => void

interface ChartProps {
 section: InsightSection
 onPointClick?: ChartPointClick
}

/** Recharts passes the clicked shape's data; the series entry may live on `.payload`. */
function pointFrom(data: unknown): { label: string; value: number } | null {
 const d = data as
  | { payload?: { label?: string; value?: number } }
  | { label?: string; value?: number }
  | null
  | undefined
 if (!d) return null
 let entry: { label?: string; value?: number } | undefined
 if ("payload" in d && d.payload) {
  entry = d.payload
 } else {
  entry = d as { label?: string; value?: number }
 }
if (entry && typeof entry.label === "string" && typeof entry.value === "number") {
   return { label: entry.label, value: entry.value }
  }
  return null
}

export function TrendLineChart({ section, onPointClick }: ChartProps) {
 const clickable = Boolean(onPointClick)
 return (
  <ResponsiveContainer width="100%" height={220}>
   <LineChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }} style={{ cursor: clickable ? "pointer" : undefined }}>
    <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
    <XAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip />
    <Line
     type="monotone"
     dataKey="value"
     name={section.title}
     stroke={SERIES_MAIN}
     strokeWidth={2.5}
     dot={clickableDot(SERIES_MAIN, 4, onPointClick) ?? { r: 4, fill: SERIES_MAIN, strokeWidth: 0 }}
     activeDot={clickableDot(SERIES_MAIN, 6, onPointClick) ?? { r: 6, fill: SERIES_MAIN, strokeWidth: 0 }}
    />
   </LineChart>
  </ResponsiveContainer>
 )
}

export function TrendAreaChart({ section, onPointClick }: ChartProps) {
 const clickable = Boolean(onPointClick)
 return (
  <ResponsiveContainer width="100%" height={220}>
   <AreaChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }} style={{ cursor: clickable ? "pointer" : undefined }}>
    <defs>
     <linearGradient id={`grad-${section.key}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={SERIES_SUCCESS} stopOpacity={0.35} />
      <stop offset="95%" stopColor={SERIES_SUCCESS} stopOpacity={0.02} />
     </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
    <XAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip />
    <Area
     type="monotone"
     dataKey="value"
     name={section.title}
     stroke={SERIES_SUCCESS}
     strokeWidth={2.5}
     fill={`url(#grad-${section.key})`}
     dot={clickableDot(SERIES_SUCCESS, 4, onPointClick) ?? { r: 4, fill: SERIES_SUCCESS, strokeWidth: 0 }}
     activeDot={clickableDot(SERIES_SUCCESS, 6, onPointClick) ?? { r: 6, fill: SERIES_SUCCESS, strokeWidth: 0 }}
    />
   </AreaChart>
  </ResponsiveContainer>
 )
}

export function ComparisonBarChart({ section, onPointClick }: ChartProps) {
 const clickable = Boolean(onPointClick)
 return (
  <ResponsiveContainer width="100%" height={220}>
   <BarChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }} style={{ cursor: clickable ? "pointer" : undefined }}>
    <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
    <XAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip cursor={{ fill: "transparent" }} />
    <Bar
     dataKey="value"
     name={section.title}
     radius={[8, 8, 0, 0]}
     onClick={
      onPointClick
       ? (data) => {
          const p = pointFrom(data)
          if (p) onPointClick(p.label, p.value)
         }
       : undefined
     }
    >
     {section.series.map((entry, index) => (
      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
     ))}
    </Bar>
   </BarChart>
  </ResponsiveContainer>
 )
}

export function StrengthRadarChart({ section, onPointClick }: ChartProps) {
 const clickable = Boolean(onPointClick)
 return (
  <ResponsiveContainer width="100%" height={220}>
   <RadarChart data={section.series} margin={{ top: 8, right: 24, bottom: 8, left: 24 }} style={{ cursor: clickable ? "pointer" : undefined }}>
    <PolarGrid stroke={GRID_LINE} />
    <PolarAngleAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} />
    <Radar
     dataKey="value"
     name={section.title}
     stroke={SERIES_ALT}
     fill={SERIES_ALT}
     fillOpacity={0.25}
     dot={clickableDot(SERIES_ALT, 4, onPointClick) ?? { r: 4, fill: SERIES_ALT, strokeWidth: 0 }}
     activeDot={clickableDot(SERIES_ALT, 6, onPointClick) ?? { r: 6, fill: SERIES_ALT, strokeWidth: 0 }}
    />
    <Tooltip />
   </RadarChart>
  </ResponsiveContainer>
 )
}

export function DonutChart({ section, onPointClick }: ChartProps) {
 const clickable = Boolean(onPointClick)
 return (
  <ResponsiveContainer width="100%" height={220}>
   <PieChart style={{ cursor: clickable ? "pointer" : undefined }}>
    <Pie
     data={section.series}
     dataKey="value"
     nameKey="label"
     innerRadius={60}
     outerRadius={85}
     paddingAngle={3}
     onClick={
      onPointClick
       ? (data) => {
          const p = pointFrom(data)
          if (p) onPointClick(p.label, p.value)
         }
       : undefined
     }
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
