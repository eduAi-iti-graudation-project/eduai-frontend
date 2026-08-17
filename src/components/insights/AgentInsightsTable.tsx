import { useState } from "react"
import { cn } from "@/lib/utils"
import type { AgentInsight } from "@/lib/api"
import { RichText } from "@/components/shared/RichText"
import { InsightBreakdownCard } from "./InsightBreakdownCard"
import { alertMeta, severityLabel, severityChipClass } from "@/components/admin/alertPresentation"

interface AgentInsightsTableProps {
 insights: AgentInsight[]
 className?: string
}

export function AgentInsightsTable({ insights, className }: AgentInsightsTableProps) {
 return (
  <div className={cn("rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden", className)}>
   <table className="w-full text-left border-collapse">
    <thead>
     <tr className="border-b border-outline-variant bg-surface-container-low/60">
      <th className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant font-medium w-[30%]">Insight</th>
      <th className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant font-medium">Details</th>
      <th className="px-4 py-2.5 w-24 text-right font-label-sm text-label-sm text-on-surface-variant font-medium">
       <span className="sr-only">Expand</span>
      </th>
     </tr>
    </thead>
    <tbody className="divide-y divide-outline-variant/60">
     {insights.map((insight) => (
      <AgentInsightsRow key={`${insight.title}-${insight.summary}`} insight={insight} />
     ))}
    </tbody>
   </table>
  </div>
 )
}

function AgentInsightsRow({ insight }: { insight: AgentInsight }) {
 const [expanded, setExpanded] = useState(false)
 const hasBreakdown = Boolean(insight.breakdown)
 const expandable = hasBreakdown || insight.summary.length > 180
 const clamp = !expanded && expandable
 const meta = insight.breakdown ? alertMeta(insight.breakdown.type) : null

 return (
  <tr className="align-top hover:bg-surface-container-low transition-colors">
   <td className="px-4 py-3 align-top">
    <div className="flex items-start gap-2.5">
     <span className="w-7 h-7 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shrink-0 mt-0.5">
      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
     </span>
     <div className="min-w-0">
      <h4 className="font-label-md text-label-md text-primary font-bold leading-snug">{insight.title}</h4>
      {insight.breakdown && (
       <span
        className={cn(
         "mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold",
         severityChipClass(insight.breakdown.severity),
        )}
       >
        <span className="material-symbols-outlined text-[14px]">{meta?.icon}</span>
        {severityLabel(insight.breakdown.severity)}
       </span>
      )}
     </div>
    </div>
   </td>

   <td className="px-4 py-3 min-w-0">
    <div
     className={cn(
      "text-on-surface-variant",
      clamp && "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden",
     )}
    >
     <RichText text={insight.summary} />
    </div>
    {expanded && insight.breakdown && (
     <div className="mt-3 rounded-md bg-surface-container-low/50 p-3">
      <InsightBreakdownCard insight={insight} />
     </div>
    )}
   </td>

   <td className="px-4 py-3 align-top text-right">
    {expandable && (
     <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary/80"
      aria-expanded={expanded}
     >
      {expanded ? "Collapse" : "Details"}
      <span className={cn("material-symbols-outlined text-[16px] transition-transform", expanded && "rotate-180")}>
       expand_more
      </span>
     </button>
    )}
   </td>
  </tr>
 )
}