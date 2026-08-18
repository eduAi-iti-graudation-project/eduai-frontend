import type { DiagnosisPayload } from "@/lib/api"
import { RichText } from "@/components/shared/RichText"

const severityConfig: Record<string, { icon: string; label: string; class: string }> = {
 HIGH: { icon: "error", label: "High", class: "bg-primary text-primary-foreground" },
 MEDIUM: { icon: "warning", label: "Medium", class: "bg-surface-container-high text-on-surface" },
 LOW: { icon: "info", label: "Low", class: "bg-surface-container-high text-on-surface-variant" },
}

interface AlertDetailDiagnosisProps {
 diagnosis: DiagnosisPayload
}

export function AlertDetailDiagnosis({ diagnosis }: AlertDetailDiagnosisProps) {
  const summary = diagnosis.reason ?? diagnosis.summary
  const classContext = diagnosis.classContext ?? classStatsText(diagnosis.classStats)
  if (!summary && !classContext) return null

  const sev = diagnosis.severity ? severityConfig[diagnosis.severity] : null

  return (
   <div className="rounded-lg bg-surface-container-lowest border border-border p-md">
    <div className="flex items-center gap-2 mb-3">
     <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
      <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
     </div>
     <h3 className="font-headline-md text-headline-md text-primary">Diagnosis</h3>
     {sev && (
      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-lg ${sev.class}`}>
       {sev.icon === "error" && "⨯ "}{sev.icon === "warning" && "△ "}{sev.icon === "info" && "◯ "}{sev.label}
      </span>
     )}
    </div>

    {summary && (
     <RichText text={summary} className="text-body-md text-on-surface mb-2" />
    )}
    {classContext && (
     <RichText
      text={classContext}
      className="text-body-md text-on-surface-variant bg-surface-container-low rounded-lg p-3"
     />
    )}
   </div>
  )
}

function classStatsText(stats: DiagnosisPayload["classStats"]): string | null {
  if (!stats) return null
  const parts: string[] = []
  if (typeof stats.studentCount === "number") parts.push(`${stats.studentCount} students`)
  if (typeof stats.classAvgPct === "number") parts.push(`class avg ${stats.classAvgPct}%`)
  if (typeof stats.droppingCount === "number") parts.push(`${stats.droppingCount} dropping`)
  if (typeof stats.belowAverageCount === "number") parts.push(`${stats.belowAverageCount} below average`)
  return parts.length ? parts.join(" · ") : null
}
