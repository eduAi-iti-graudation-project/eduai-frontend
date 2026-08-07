import type { InsightSection } from "@/lib/api"
import { DeltaBadge } from "@/components/insights/DeltaBadge"
import { isEmptySection } from "@/components/insights/delta-utils"
import { renderChart } from "@/components/insights/chart-map"

interface InsightSectionCardProps {
  section: InsightSection
}

export function InsightSectionCard({ section }: InsightSectionCardProps) {
  const empty = isEmptySection(section)

  return (
    <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
      <div className="flex items-center justify-between gap-2 mb-md">
        <h3 className="font-headline-md text-headline-md text-on-surface leading-snug">{section.title}</h3>
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
        renderChart(section)
      )}
    </div>
  )
}
