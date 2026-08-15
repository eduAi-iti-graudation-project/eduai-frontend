import { Link } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import {
  useSectionDetail,
  type InsightsInterval,
} from "@/hooks/use-dashboard-insights"
import type { InsightSection } from "@/lib/api"
import {
  formatBucket,
  getInsightExplanation,
  interpretPoint,
} from "@/lib/insight-explanations"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface InsightPoint {
  label: string
  value: number
}

interface InsightPointDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: InsightSection
  point: InsightPoint
  interval: InsightsInterval
  studentId?: string
}

function refPath(
  role: string | undefined,
  kind: string,
  id: string,
): string | null {
  switch (kind) {
    case "student":
      if (role === "ADMIN") return `/admin/students/${id}`
      if (role === "GUARDIAN") return `/guardian/children/${id}`
      if (role === "STUDENT") return `/student`
      return `/students/${id}`
    case "alert":
      if (role === "ADMIN") return `/admin/alerts`
      if (role === "GUARDIAN") return `/guardian/alerts/${id}`
      return `/alerts/${id}`
    case "submission":
      if (role === "STUDENT") return `/student/submissions/${id}`
      return `/submissions/${id}`
    default:
      return null
  }
}

function refLabel(kind: string): string {
  switch (kind) {
    case "student":
      return "View student"
    case "alert":
      return "View alert"
    case "submission":
      return "View submission"
    default:
      return "Open"
  }
}

export function InsightPointDetailSheet({
  open,
  onOpenChange,
  section,
  point,
  interval,
  studentId,
}: InsightPointDetailSheetProps) {
  const { user } = useAuth()
  const explanation = getInsightExplanation(section.key)
  const { data, isLoading, isError, error, refetch } = useSectionDetail(
    section.key,
    interval,
    point.label,
    studentId,
    open,
  )

  const isTrend = section.chartType === "line" || section.chartType === "area"
  const bucketLabel = isTrend
    ? formatBucket(interval, data?.bucket ?? point.label)
    : data?.bucket ?? point.label

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{section.title}</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>{explanation.subtitle}</p>
            <p className="font-label-md text-label-md text-primary">
              {interpretPoint(section, point.label, point.value, interval)}
            </p>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3 pb-8">
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <div className="h-4 w-40 rounded bg-surface-container-high" />
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-surface-container-high animate-pulse"
                />
              ))}
              <p className="sr-only">Loading records...</p>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md text-center">
              <span className="material-symbols-outlined text-[32px] text-error mb-sm">
                error
              </span>
              <p className="font-body-md text-on-surface mb-sm">
                Couldn't load these records
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
                {error instanceof Error ? error.message : "Something went wrong"}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-primary px-lg py-sm font-label-md text-label-md text-primary-foreground hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {data.totalRecords}{" "}
                {data.totalRecords === 1 ? "record" : "records"} ·{" "}
                {bucketLabel}
              </p>
              {data.records.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant rounded-lg border border-outline-variant bg-surface-container-lowest p-md text-center">
                  No records in this bucket yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.records.map((record, index) => {
                    const path = record.ref
                      ? refPath(user?.role, record.ref.kind, record.ref.id)
                      : null
                    return (
                      <li
                        key={`${record.label}-${index}`}
                        className="rounded-lg border border-outline-variant bg-surface-container-low p-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-label-md text-label-md text-on-surface">
                              {record.label}
                            </p>
                            {record.meta ? (
                              <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                                {record.meta}
                              </p>
                            ) : null}
                          </div>
                          {typeof record.value === "number" ? (
                            <span
                              className={cn(
                                "shrink-0 rounded-lg px-sm py-xs font-label-md text-label-md",
                                record.value >= 60
                                  ? "bg-primary-container/15 text-primary"
                                  : "bg-error-container/30 text-error",
                              )}
                            >
                              {data.unit === "percent"
                                ? `${record.value}%`
                                : record.value}
                            </span>
                          ) : null}
                        </div>
                        {path ? (
                          <Link
                            to={path}
                            onClick={() => onOpenChange(false)}
                            className="mt-sm inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary/80"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              open_in_new
                            </span>
                            {record.ref ? refLabel(record.ref.kind) : "View"}
                          </Link>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
