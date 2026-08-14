import { Fragment } from "react"
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type {
  ChartVisual,
  ComparisonVisual,
  ConceptMapVisual,
  FlowVisual,
  SlideVisual,
  TimelineVisual,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const SERIES = ["#2563EB", "#10B981", "#F59E0B"]
const GRID = "#E5E7EB"
const TICK = "#6B7280"

function ChartVisualView({ visual }: { visual: ChartVisual }) {
  if (visual.kind === "pie") {
    const series = visual.series[0]
    const data = visual.categories.map((cat, i) => ({
      name: cat,
      value: Math.max(0, series?.values[i] ?? 0),
    }))
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SERIES[i % SERIES.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const data = visual.categories.map((cat, i) => {
    const row: Record<string, string | number> = { name: cat }
    visual.series.forEach((s) => {
      row[s.label] = s.values[i] ?? 0
    })
    return row
  })
  const axisProps = {
    dataKey: "name",
    tick: { fill: TICK, fontSize: 12 },
    axisLine: false,
    tickLine: false,
  }
  const margin = { top: 8, right: 16, bottom: 8, left: -8 }

  if (visual.kind === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          {visual.series.map((s, j) => (
            <Bar
              key={s.label}
              dataKey={s.label}
              name={s.label}
              fill={SERIES[j % SERIES.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (visual.kind === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          {visual.series.map((s, j) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              name={s.label}
              stroke={SERIES[j % SERIES.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip />
        {visual.series.map((s, j) => (
          <Area
            key={s.label}
            type="monotone"
            dataKey={s.label}
            name={s.label}
            stroke={SERIES[j % SERIES.length]}
            strokeWidth={2.5}
            fill={SERIES[j % SERIES.length]}
            fillOpacity={0.15}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function FlowVisualView({ visual }: { visual: FlowVisual }) {
  const n = visual.steps.length
  const box = (s: FlowVisual["steps"][number], i: number) => (
    <div
      key={`${i}-${s.label}`}
      className="flex flex-1 min-w-0 flex-col items-center gap-2 rounded-lg border-2 border-primary/60 bg-primary/5 px-3 py-4 text-center"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
        {i + 1}
      </span>
      <span className="font-label-md text-label-md text-on-surface leading-snug">
        {s.label}
      </span>
      {s.detail ? (
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {s.detail}
        </span>
      ) : null}
    </div>
  )

  if (n <= 4) {
    return (
      <div className="flex items-center gap-2">
        {visual.steps.map((s, i) => (
          <Fragment key={`${i}-${s.label}`}>
            {box(s, i)}
            {i < n - 1 ? (
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                arrow_forward
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {visual.steps.map((s, i) => (
        <Fragment key={`${i}-${s.label}`}>
          <div className="flex items-center gap-3 rounded-lg border-2 border-primary/60 bg-primary/5 px-4 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface">
                {s.label}
              </p>
              {s.detail ? (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {s.detail}
                </p>
              ) : null}
            </div>
          </div>
          {i < n - 1 ? (
            <div className="mx-auto my-1 h-4 w-0.5 bg-primary/40" />
          ) : null}
        </Fragment>
      ))}
    </div>
  )
}

function TimelineVisualView({ visual }: { visual: TimelineVisual }) {
  return (
    <div className="relative pt-1">
      <div className="absolute left-0 right-0 top-2.5 h-0.5 bg-primary/40" />
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.max(
            2,
            visual.events.length,
          )}, minmax(0, 1fr))`,
        }}
      >
        {visual.events.map((ev, i) => (
          <div
            key={`${i}-${ev.label}`}
            className={cn(
              "flex flex-col items-center",
              i % 2 === 1 && "translate-y-16",
            )}
          >
            <span className="relative z-10 h-5 w-5 rounded-full border-[3px] border-white bg-primary shadow-sm" />
            <p className="mt-2 text-center font-label-md text-label-md text-on-surface leading-snug">
              {ev.label}
            </p>
            {ev.detail ? (
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
                {ev.detail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonVisualView({ visual }: { visual: ComparisonVisual }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-2 bg-primary text-white">
        <div className="px-4 py-3 text-center font-label-md text-label-md font-semibold">
          {visual.leftTitle}
        </div>
        <div className="border-l border-white/30 px-4 py-3 text-center font-label-md text-label-md font-semibold">
          {visual.rightTitle}
        </div>
      </div>
      {visual.rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            "grid grid-cols-2",
            i % 2 === 1 && "bg-surface-container-lowest",
          )}
        >
          <div className="px-4 py-2.5 font-body-sm text-body-sm text-on-surface">
            {row.left}
          </div>
          <div className="border-l border-border px-4 py-2.5 font-body-sm text-body-sm text-on-surface">
            {row.right}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConceptMapVisualView({ visual }: { visual: ConceptMapVisual }) {
  const n = Math.max(2, visual.nodes.length)
  const W = 560
  const H = 300
  const cx = W / 2
  const cy = H / 2
  const r = n <= 5 ? 108 : n <= 6 ? 100 : 88
  const nodeR = 46
  const pos = new Map<string, { x: number; y: number }>()
  visual.nodes.forEach((node, i) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
    pos.set(node.id, {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    })
  })
  const mid = (a: number, b: number) => (a + b) / 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {visual.edges.map((e, i) => {
        const from = pos.get(e.from)
        const to = pos.get(e.to)
        if (!from || !to) return null
        return (
          <g key={`edge-${i}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#CBD5E1"
              strokeWidth={2}
            />
            {e.label ? (
              <text
                x={mid(from.x, to.x)}
                y={mid(from.y, to.y) + 4}
                textAnchor="middle"
                fontSize={11}
                fill="#6B7280"
              >
                {e.label}
              </text>
            ) : null}
          </g>
        )
      })}
      {visual.nodes.map((node) => {
        const p = pos.get(node.id)
        if (!p) return null
        return (
          <g key={node.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeR}
              fill="#EFF6FF"
              stroke="#2563EB"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={700}
              fill="#1F2937"
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function SlideVisualView({ visual }: { visual: SlideVisual }) {
  switch (visual.kind) {
    case "bar":
    case "line":
    case "area":
    case "pie":
      return <ChartVisualView visual={visual} />
    case "flow":
      return <FlowVisualView visual={visual} />
    case "timeline":
      return <TimelineVisualView visual={visual} />
    case "comparison":
      return <ComparisonVisualView visual={visual} />
    case "concept_map":
      return <ConceptMapVisualView visual={visual} />
  }
}