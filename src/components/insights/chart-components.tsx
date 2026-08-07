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

export function TrendLineChart({ section }: { section: InsightSection }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" name={section.title} stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: "#4f46e5" }} />
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
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="value" name={section.title} stroke="#4f46e5" strokeWidth={2.5} fill={`url(#grad-${section.key})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ComparisonBarChart({ section }: { section: InsightSection }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={section.series} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#625f70", fontSize: 12 }} axisLine={false} tickLine={false} />
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
        <PolarGrid stroke="#e8e8ed" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "#625f70", fontSize: 12 }} />
        <Radar dataKey="value" name={section.title} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
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
