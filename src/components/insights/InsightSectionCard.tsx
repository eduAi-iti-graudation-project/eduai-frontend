import { useState } from "react"
import type { InsightSection } from "@/lib/api"
import { DeltaBadge } from "@/components/insights/DeltaBadge"
import { isEmptySection } from "@/components/insights/delta-utils"
import { renderChart } from "@/components/insights/chart-map"
import { InsightPointDetailSheet } from "@/components/insights/InsightPointDetailSheet"
import type { InsightsInterval } from "@/hooks/use-dashboard-insights"

interface InsightSectionCardProps {
 section: InsightSection
 interval?: InsightsInterval
 studentId?: string
}

export function InsightSectionCard({ section, interval = "week", studentId }: InsightSectionCardProps) {
 const empty = isEmptySection(section)
 const [selectedPoint, setSelectedPoint] = useState<{ label: string; value: number } | null>(null)

const openDetails = () => {
   const last = [...section.series].reverse().find((p) => p.value > 0) ?? section.series[section.series.length - 1]
   if (last) setSelectedPoint({ label: last.label, value: last.value })
  }

 return (
  <>
   <div className="rounded-lg bg-surface-container-lowest p-md flex flex-col">
    <div className="flex items-center justify-between gap-2 mb-md">
     <h3 className="font-headline-md text-headline-md text-primary leading-snug">{section.title}</h3>
     {section.delta ? (
      <DeltaBadge deltaPercent={section.delta.deltaPercent} direction={section.delta.direction} />
     ) : null}
    </div>
    {empty ? (
     <div className="flex flex-col items-center justify-center text-center py-lg min-h-[220px]">
      <span className="material-symbols-outlined text-[40px] text-outline mb-sm">monitoring</span>
      <p className="font-body-md text-body-md text-on-surface-variant">No data yet</p>
     </div>
    ) : (
     <>
      <div className="flex-1">{renderChart(section, (label, value) => setSelectedPoint({ label, value }))}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
       <p className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]">touch_app</span>
        Click a point or use Details
       </p>
       <button
        type="button"
        onClick={openDetails}
        className="inline-flex items-center gap-1 rounded-md bg-primary-container/15 text-primary px-2.5 py-1 font-label-sm text-label-sm hover:bg-primary-container/25 transition-colors"
       >
        <span className="material-symbols-outlined text-[14px]">info</span>
        Details
       </button>
      </div>
     </>
    )}
   </div>

   <InsightPointDetailSheet
    open={selectedPoint !== null}
    onOpenChange={(open) => {
     if (!open) setSelectedPoint(null)
    }}
    section={section}
    point={selectedPoint ?? { label: "", value: 0 }}
    interval={interval}
    studentId={studentId}
   />
  </>
 )
}
