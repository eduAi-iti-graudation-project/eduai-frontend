import type { ManagementSummaryPayload } from "@/lib/api"

interface ManagementSummarySectionProps {
  summary: ManagementSummaryPayload
}

export function ManagementSummarySection({ summary }: ManagementSummarySectionProps) {
  return (
    <div className="rounded-lg bg-white border border-border p-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary">Management Summary</h3>
      </div>

      <div className="space-y-3">
        {summary.summary && (
          <div className="bg-surface-container-low rounded-lg p-3">
            <p className="font-body-md text-body-md text-on-surface">{summary.summary}</p>
          </div>
        )}

        {summary.classTrend && (
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">trending_up</span>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Class Trend</p>
              <p className="font-body-md text-body-md text-on-surface">{summary.classTrend}</p>
            </div>
          </div>
        )}

        {summary.recommendation && (
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">recommend</span>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Recommendation</p>
              <p className="font-body-md text-body-md text-on-surface">{summary.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
