import type { MonthBucket } from "@/lib/attendance-stats"
import { computeAttendanceStats, monthBuckets, type AttendanceRecordLike } from "@/lib/attendance-stats"

const BAR_MAX = 132
const SEGMENT_CLASSES: Record<string, string> = {
  present: "bg-primary",
  late: "bg-tertiary-fixed-dim",
  excused: "bg-[#d9ccf2]",
  absent: "bg-[#c8cad6]",
}

const SEGMENT_LABELS: Record<string, string> = {
  present: "Present",
  late: "Late",
  excused: "Excused",
  absent: "Absent",
}

function segmentHeight(bucket: MonthBucket, maxTotal: number, key: "present" | "late" | "excused" | "absent") {
  return (bucket[key] / maxTotal) * BAR_MAX
}

export function MonthlyAttendanceBars({ records }: { records: AttendanceRecordLike[] }) {
  const buckets = monthBuckets(records, 6)
  const maxTotal = Math.max(1, ...buckets.map((b) => b.total))

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: BAR_MAX + 28 }}>
        {buckets.map((bucket, index) => {
          const isCurrent = index === buckets.length - 1
          const total = bucket.total
          const attended = bucket.present + bucket.late
          const attendedPercent = total > 0 ? Math.round((attended / total) * 100) : 0
          return (
            <div key={bucket.key} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className={`relative w-full max-w-[36px] overflow-hidden rounded-md ${isCurrent ? "border border-primary/30" : ""}`}
                style={{ height: Math.max(total > 0 ? 6 : 3, (total / maxTotal) * BAR_MAX) }}
              >
                {total === 0 ? (
                  <div className="absolute inset-0 bg-surface-container" />
                ) : (
                  <div className="absolute inset-0 flex origin-bottom flex-col-reverse animate-[bar-grow_550ms_ease-out_both]"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    {(["present", "late", "excused", "absent"] as const).map((key) =>
                      bucket[key] > 0 ? (
                        <div
                          key={key}
                          className="w-full"
                          style={{ height: segmentHeight(bucket, maxTotal, key) }}
                        >
                          <div className={`h-full w-full ${SEGMENT_CLASSES[key]}`} />
                        </div>
                      ) : null,
                    )}
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 flex-col items-center group-hover:flex">
                  <div className="whitespace-nowrap rounded-lg bg-inverse-surface px-2 py-1 font-label-sm text-label-sm text-inverse-on-surface shadow-lg">
                    <div className="font-label-md">{bucket.label}</div>
                    {total === 0 ? (
                      <div className="opacity-80">No records</div>
                    ) : (
                      <>
                        {(["present", "late", "excused", "absent"] as const).map((key) =>
                          bucket[key] > 0 ? (
                            <div key={key} className="opacity-80">
                              {SEGMENT_LABELS[key]} {bucket[key]}
                            </div>
                          ) : null,
                        )}
                        <div>{attendedPercent}% attended</div>
                      </>
                    )}
                  </div>
                  <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-inverse-surface" />
                </div>
              </div>
              <span
                className={`font-label-sm text-label-sm ${isCurrent ? "font-label-md text-primary" : "text-on-surface-variant"}`}
              >
                {bucket.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-lg gap-y-sm border-t border-outline-variant/10 pt-3">
        {(["present", "late", "excused", "absent"] as const).map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className={`h-2.5 w-2.5 rounded-[3px] ${SEGMENT_CLASSES[key]}`} />
            {SEGMENT_LABELS[key]}
          </span>
        ))}
      </div>
    </div>
  )
}

const DONUT_COLORS: Record<string, string> = {
  present: "#006951",
  late: "#f4be4e",
  excused: "#d9ccf2",
  absent: "#c8cad6",
}

export function AttendanceDonut({ records }: { records: AttendanceRecordLike[] }) {
  const stats = computeAttendanceStats(records)
  const total = stats.totalDays

  const segments = [
    { key: "present", count: stats.presentDays },
    { key: "late", count: stats.lateDays },
    { key: "excused", count: stats.excusedDays },
    { key: "absent", count: stats.absentDays },
  ].filter((s) => s.count > 0)

  let cursor = 0
  const stops = segments.map((s) => {
    const from = cursor
    const pct = (s.count / Math.max(1, total)) * 100
    cursor += pct
    return `${DONUT_COLORS[s.key]} ${from}% ${cursor}%`
  })
  if (cursor < 100) stops.push(`var(--color-surface-container) ${cursor}% 100%`)

  return (
    <div className="flex flex-col items-center gap-lg sm:flex-row">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full animate-[rise-in_600ms_ease-out_both]"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-white">
          <p className="font-headline-lg text-headline-lg text-primary leading-none">{stats.presentPercent}%</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">attendance</p>
        </div>
      </div>

      <div className="w-full space-y-2">
        {total === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant text-center sm:text-left">No records yet.</p>
        ) : (
          segments.map((s) => {
            const pct = Math.round((s.count / total) * 100)
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-[4px]" style={{ background: DONUT_COLORS[s.key] }} />
                <span className="font-label-md text-label-md text-on-surface">{SEGMENT_LABELS[s.key]}</span>
                <span className="ml-auto font-label-sm text-label-sm text-on-surface-variant">
                  {s.count} · {pct}%
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
