import { useState } from "react"
import type { InsightSection } from "@/lib/api"
import { DeltaBadge } from "@/components/insights/DeltaBadge"
import { isEmptySection } from "@/components/insights/delta-utils"
import { renderChart } from "@/components/insights/chart-map"
import { getInsightExplanation } from "@/lib/insight-explanations"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  InsightPointDetailSheet,
  type InsightPoint,
} from "@/components/insights/InsightPointDetailSheet"
import type { InsightsInterval } from "@/hooks/use-dashboard-insights"

interface InsightSectionCardProps {
  section: InsightSection
  interval?: InsightsInterval
  studentId?: string
}

function defaultPoint(section: InsightSection): InsightPoint | null {
  if (section.series.length === 0) return null
  const lastNonZero = [...section.series].reverse().find((p) => p.value > 0)
  const point = lastNonZero ?? section.series[section.series.length - 1]
  return { label: point.label, value: point.value }
}

export function InsightSectionCard({
  section,
  interval = "week",
  studentId,
}: InsightSectionCardProps) {
  const empty = isEmptySection(section)
  const explanation = getInsightExplanation(section.key)
  const [point, setPoint] = useState<InsightPoint | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openDetails = () => {
    const defaulted = defaultPoint(section)
    if (!defaulted) return
    setPoint(defaulted)
    setSheetOpen(true)
  }

  const onPointClick = (label: string, value: number) => {
    setPoint({ label, value })
    setSheetOpen(true)
  }

  return (
    <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
      <div className="flex items-center justify-between gap-2 mb-sm">
        <h3 className="font-headline-md text-headline-md text-on-surface leading-snug">
          {section.title}
        </h3>
        {section.delta ? (
          <DeltaBadge
            deltaPercent={section.delta.deltaPercent}
            direction={section.delta.direction}
          />
        ) : null}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
        {explanation.subtitle}
        <Popover>
          <PopoverTrigger
            type="button"
            aria-label="What this chart means"
            className="ml-1 align-middle text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
          </PopoverTrigger>
          <PopoverContent className="max-w-xs">
            <p className="font-body-sm text-body-sm text-popover-foreground leading-relaxed">
              {explanation.what}
            </p>
          </PopoverContent>
        </Popover>
      </p>

      {empty ? (
        <div className="flex flex-col items-center justify-center text-center py-lg min-h-[220px]">
          <span className="material-symbols-outlined text-[40px] text-outline mb-sm">
            monitoring
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No data yet
          </p>
        </div>
      ) : (
        renderChart(section, onPointClick)
      )}

      {!empty ? (
        <div className="flex justify-end mt-sm">
          <button
            type="button"
            onClick={openDetails}
            className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary/80"
          >
            Details
            <span className="material-symbols-outlined text-[15px]">
              chevron_right
            </span>
          </button>
        </div>
      ) : null}

      {point ? (
        <InsightPointDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          section={section}
          point={point}
          interval={interval}
          studentId={studentId}
        />
      ) : null}
    </div>
  )
}
