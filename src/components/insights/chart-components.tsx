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

export function TrendLineChart({ section }: { section: InsightSection }) {
 return (
  <ResponsiveContainer width="100%" height={220}>
   <LineChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
    <XAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip />
    <Line type="monotone" dataKey="value" name={section.title} stroke={SERIES_MAIN} strokeWidth={2.5} dot={{ r: 3, fill: SERIES_MAIN }} />
   </LineChart>
  </ResponsiveContainer>
 )
}

export function TrendAreaChart({ section }: { section: InsightSection }) {
 return (
  <ResponsiveContainer width="100%" height={220}>
   <AreaChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
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
    <Area type="monotone" dataKey="value" name={section.title} stroke={SERIES_SUCCESS} strokeWidth={2.5} fill={`url(#grad-${section.key})`} />
   </AreaChart>
  </ResponsiveContainer>
 )
}

export function ComparisonBarChart({ section }: { section: InsightSection }) {
 return (
  <ResponsiveContainer width="100%" height={220}>
   <BarChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
    <XAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip />
    <Bar dataKey="value" name={section.title} radius={[8, 8, 0, 0]}>
     {section.series.map((entry, index) => (
      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
     ))}
    </Bar>
   </BarChart>
  </ResponsiveContainer>
 )
}

export function StrengthRadarChart({ section }: { section: InsightSection }) {
 return (
  <ResponsiveContainer width="100%" height={220}>
   <RadarChart data={section.series} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
    <PolarGrid stroke={GRID_LINE} />
    <PolarAngleAxis dataKey="label" tick={{ fill: AXIS_TICK, fontSize: 12 }} />
    <Radar dataKey="value" name={section.title} stroke={SERIES_ALT} fill={SERIES_ALT} fillOpacity={0.25} />
    <Tooltip />
   </RadarChart>
  </ResponsiveContainer>
 )
}

export function DonutChart({ section }: { section: InsightSection }) {
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
