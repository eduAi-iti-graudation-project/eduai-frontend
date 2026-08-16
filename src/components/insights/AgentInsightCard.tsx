import { useState } from "react"
import { cn } from "@/lib/utils"
import type { AgentInsight } from "@/lib/api"
import { RichText } from "@/components/shared/RichText"
import { InsightBreakdownCard } from "./InsightBreakdownCard"

interface AgentInsightCardProps {
 insight: AgentInsight
 bare?: boolean
 className?: string
}

export function AgentInsightCard({ insight, bare, className }: AgentInsightCardProps) {
const [expanded, setExpanded] = useState(false)
 const hasBreakdown = Boolean(insight.breakdown)
 const prose = insight.summary
 const isLong = !hasBreakdown && prose.length > 180

 const richBody = hasBreakdown ? (
  <InsightBreakdownCard insight={insight} />
 ) : (
  <div className={cn("text-on-surface-variant", !expanded && "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden")}>
   <RichText text={prose} />
  </div>
 )

 return (
  <div className={cn("flex items-start gap-3", bare ? "" : "rounded-lg bg-surface-container-lowest p-md ", className)}>
   <span className="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">auto_awesome</span>
   <div className="min-w-0 flex-1">
    <h4 className="font-label-md text-label-md text-primary font-bold mb-1.5">{insight.title}</h4>
    {richBody}
    {isLong && (
     <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="mt-2 inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary/80"
     >
      {expanded ? "Collapse detail" : "Show full details"}
      <span className={cn("material-symbols-outlined text-[15px] transition-transform", expanded && "rotate-180")}>
       expand_more
      </span>
     </button>
    )}
   </div>
  </div>
 )
}