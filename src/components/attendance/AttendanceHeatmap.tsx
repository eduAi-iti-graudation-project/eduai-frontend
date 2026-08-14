import type { DayAttendance } from "@/lib/attendance-stats"
import { computeDayStats, dateKey, type AttendanceRecordLike, lastNDays } from "@/lib/attendance-stats"

const CELL = 16
const GAP = 4
const STEP = CELL + GAP
const WEEKS = 26

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-[#22c55e]",
  LATE: "bg-[#86efac]",
  EXCUSED: "bg-[#6366f1]",
  ABSENT: "bg-[#ef4444]",
  EMPTY: "bg-surface-container",
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  EXCUSED: "Excused",
  ABSENT: "Absent",
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function cellAppearance(day: DayAttendance | undefined): { className: string; summary: string } {
  if (!day || day.total === 0) {
    return { className: STATUS_COLORS.EMPTY, summary: "No record" }
  }
  if (day.present > 0) return { className: STATUS_COLORS.PRESENT, summary: "Present" }
  if (day.late > 0) return { className: STATUS_COLORS.LATE, summary: "Late" }
  if (day.excused > 0) return { className: STATUS_COLORS.EXCUSED, summary: "Excused" }
  return { className: STATUS_COLORS.ABSENT, summary: "Absent" }
}

function cellTooltip(date: Date, day: DayAttendance | undefined): string[] {
  const label = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  if (!day || day.total === 0) return [label, "No record"]
  const lines: string[] = []
  for (const status of ["PRESENT", "LATE", "EXCUSED", "ABSENT"] as const) {
    const count = day[status.toLowerCase() as "present" | "late" | "excused" | "absent"]
    if (count > 0) lines.push(`${STATUS_LABELS[status]} ${count}`)
  }
  return [label, ...lines]
}

export function AttendanceHeatmap({ records }: { records: AttendanceRecordLike[] }) {
  const byDay = computeDayStats(records)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = lastNDays(WEEKS * 7, today)

  const columns: Date[][] = []
  for (let w = 0; w < WEEKS; w++) {
    columns.push(days.slice(w * 7, w * 7 + 7))
  }

  const now = new Date()
  now.setHours(12, 0, 0, 0)

  const monthLabels: { index: number; text: string }[] = []
  columns.forEach((column, index) => {
    const monthDate = column[0]
    const prev = index > 0 ? columns[index - 1][0] : null
    if (!prev || monthDate.getMonth() !== prev.getMonth() || monthDate.getFullYear() !== prev.getFullYear()) {
      const text =
        monthDate.getMonth() === 0
          ? `${MONTHS[0]} ${String(monthDate.getFullYear()).slice(2)}`
          : MONTHS[monthDate.getMonth()]
      monthLabels.push({ index, text })
    }
  })

  const weekdayLabels = [
    { row: 1, label: "Mon" },
    { row: 3, label: "Wed" },
    { row: 5, label: "Fri" },
  ]

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex">
          <div className="flex flex-col">
            <div className="relative h-5" style={{ width: WEEKS * STEP - GAP }}>
              {monthLabels.map(({ index, text }) => (
                <span
                  key={`${index}-${text}`}
                  className="absolute top-0 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap"
                  style={{ left: index * STEP }}
                >
                  {text}
                </span>
              ))}
            </div>
            <div className="flex">
              <div className="relative" style={{ height: 7 * STEP - GAP, width: 24 }}>
                {weekdayLabels.map(({ row, label }) => (
                  <span
                    key={label}
                    className="absolute font-label-sm text-label-sm text-on-surface-variant leading-none"
                    style={{ top: row * STEP - 3 }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex gap-[4px]">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-col gap-[4px]">
                    {column.map((date) => {
                      const key = dateKey(date)
                      const day = byDay.get(key)
                      const isFuture = date.getTime() > now.getTime()
                      const appearance = cellAppearance(day)
                      return (
                        <div
                          key={key}
                          className={`group relative rounded-[4px] ${isFuture ? "bg-transparent" : appearance.className} ${
                            isFuture ? "" : "animate-[heatmap-pop_400ms_ease-out_both]"
                          }`}
                          style={{
                            width: CELL,
                            height: CELL,
                            animationDelay: `${Math.min(columnIndex, 12) * 14}ms`,
                          }}
                        >
                          {!isFuture && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 flex-col items-center group-hover:flex">
                              <div className="whitespace-nowrap rounded-lg bg-inverse-surface px-2 py-1 font-label-sm text-label-sm text-inverse-on-surface shadow-lg">
                                {cellTooltip(date, day).map((line, i) => (
                                  <div key={line} className={i === 0 ? "" : "opacity-80"}>
                                    {line}
                                  </div>
                                ))}
                              </div>
                              <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-inverse-surface" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-md flex flex-wrap items-center gap-x-lg gap-y-sm">
        {(["PRESENT", "LATE", "EXCUSED", "ABSENT"] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className={`h-3 w-3 rounded-[3px] ${STATUS_COLORS[status]}`} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  )
}
