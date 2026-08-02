import { useState } from "react"
import type { TeacherContentPayload } from "@/lib/api"

interface TeacherAnalysisSectionProps {
  content: TeacherContentPayload
}

export function TeacherAnalysisSection({ content }: TeacherAnalysisSectionProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-md hover:bg-surface-container transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-secondary">school</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-primary">Teacher Analysis</h3>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-md pb-md space-y-4">
          {content.analysis && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="font-body-md text-body-md text-on-surface">{content.analysis}</p>
            </div>
          )}

          {content.skillGaps.length > 0 && (
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-error">lightbulb</span>
                Skill Gaps ({content.skillGaps.length})
              </h4>
              <ul className="space-y-1">
                {content.skillGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="text-error mt-0.5">•</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.interventions.length > 0 && (
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">recommend</span>
                Recommended Interventions ({content.interventions.length})
              </h4>
              <ul className="space-y-1">
                {content.interventions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="text-primary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.resourceSuggestions.length > 0 && (
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">menu_book</span>
                Resource Suggestions
              </h4>
              <div className="space-y-1">
                {content.resourceSuggestions.map((res, i) => (
                  <div key={i} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">article</span>
                    {res}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
