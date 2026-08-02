import type { DiagnosisPayload } from "@/lib/api"

const severityConfig: Record<string, { icon: string; label: string; class: string }> = {
  HIGH: { icon: "error", label: "High", class: "bg-error-container text-error" },
  MEDIUM: { icon: "warning", label: "Medium", class: "bg-yellow-100 text-yellow-800" },
  LOW: { icon: "info", label: "Low", class: "bg-blue-100 text-blue-800" },
}

interface AlertDetailDiagnosisProps {
  diagnosis: DiagnosisPayload
}

export function AlertDetailDiagnosis({ diagnosis }: AlertDetailDiagnosisProps) {
  if (!diagnosis.summary && !diagnosis.classContext) return null

  const sev = diagnosis.severity ? severityConfig[diagnosis.severity] : null

  return (
    <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary">Diagnosis</h3>
        {sev && (
          <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${sev.class}`}>
            {sev.icon === "error" && "🔴 "}{sev.icon === "warning" && "🟡 "}{sev.icon === "info" && "🟢 "}{sev.label}
          </span>
        )}
      </div>

      {diagnosis.summary && (
        <p className="font-body-md text-body-md text-on-surface mb-2">{diagnosis.summary}</p>
      )}
      {diagnosis.classContext && (
        <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low rounded-xl p-3">
          {diagnosis.classContext}
        </p>
      )}
    </div>
  )
}
