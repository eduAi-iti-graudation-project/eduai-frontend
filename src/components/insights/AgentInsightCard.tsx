import type { AgentInsight } from "@/lib/api"

interface AgentInsightCardProps {
  insight: AgentInsight
}

export function AgentInsightCard({ insight }: AgentInsightCardProps) {
  return (
    <div className="tactile-card rounded-[24px] bg-surface-container-lowest p-md border border-outline-variant/10 flex items-start gap-3">
      <span className="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">auto_awesome</span>
      <div className="min-w-0">
        <h4 className="font-label-md text-label-md text-on-surface font-bold mb-1">{insight.title}</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">{insight.summary}</p>
      </div>
    </div>
  )
}
