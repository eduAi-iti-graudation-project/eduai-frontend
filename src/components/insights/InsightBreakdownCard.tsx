import { cn } from "@/lib/utils"
import type { AgentInsight } from "@/lib/api"
import { RichText } from "@/components/shared/RichText"
import { alertMeta, severityLabel, severityChipClass } from "@/components/admin/alertPresentation"

function PctBar({ label, pct, tone }: { label: string; pct: number; tone: "weak" | "strong" }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="font-label-sm text-label-sm text-on-surface truncate flex-1">{label}</span>
      <div className="w-20 h-1.5 rounded-full bg-surface-container-high shrink-0 overflow-hidden">
        <div
          className={cn("h-full rounded-full", tone === "weak" ? "bg-[#ba1a1a]/70" : "bg-[#14532d]/70")}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <span className="font-label-sm text-label-sm tabular-nums text-on-surface shrink-0">{pct}%</span>
    </div>
  )
}

function lineChip(line: string) {
  const match = line.match(/\((\d{1,3})%\)|(\d{1,3})%/)
  if (!match) return { label: line, pct: null }
  const pct = Number(match[1] ?? match[2])
  return { label: line.replace(/\(?\d{1,3}%\)?/g, "").replace(/\s{2,}/g, " ").trim(), pct }
}

export function InsightBreakdownCard({ insight }: { insight: AgentInsight }) {
  const b = insight.breakdown
  if (!b) return null
  const meta = alertMeta(b.type)
  const weak = b.concerns.map(lineChip).filter((c) => c.pct !== null && c.pct < 60)
  const strengths = b.strengths.map(lineChip).filter((s) => s.pct !== null)

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={cn("inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-[6px] font-medium", severityChipClass(b.severity))}>
          <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
          {severityLabel(b.severity)}
        </span>
        <p className="font-label-md text-label-md text-on-surface font-semibold">{b.headline || meta.title}</p>
      </div>

      {b.highlights.length > 0 && (
        <ul className="space-y-1.5 pl-0 mb-2">
          {b.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-on-surface">
              <span className="mt-[8px] h-[5px] w-[5px] rounded-full bg-primary shrink-0" />
              <RichText text={h} className="font-body-sm text-body-sm" />
            </li>
          ))}
        </ul>
      )}

      {(weak.length > 0 || strengths.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-outline-variant bg-surface-container-low/50 p-3 mb-2">
          {weak.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">trending_down</span>
                Needs work
              </p>
              <div className="space-y-1.5">
                {weak.slice(0, 4).map((w, i) =>
                  w.pct === null ? (
                    <p key={i} className="font-label-sm text-label-sm text-on-surface">{w.label}</p>
                  ) : (
                    <PctBar key={i} label={w.label} pct={w.pct} tone="weak" />
                  ),
                )}
              </div>
            </div>
          )}
          {strengths.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#14532d]">trending_up</span>
                Doing well
              </p>
              <div className="space-y-1.5">
                {strengths.slice(0, 4).map((s, i) =>
                  s.pct === null ? (
                    <p key={i} className="font-label-sm text-label-sm text-on-surface">{s.label}</p>
                  ) : (
                    <PctBar key={i} label={s.label} pct={s.pct} tone="strong" />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {b.recommendation && (
        <div className="flex items-start gap-2 rounded-md border-l-[3px] border-primary bg-primary-container/30 px-3 py-2">
          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">lightbulb</span>
          <RichText text={b.recommendation} className="font-body-sm text-body-sm" />
        </div>
      )}
    </div>
  )
}