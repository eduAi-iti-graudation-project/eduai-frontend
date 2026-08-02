export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

export interface AttendanceRecordLike {
  date: string
  status: AttendanceStatus
}

export interface DayAttendance {
  present: number
  absent: number
  late: number
  excused: number
  total: number
}

export interface AttendanceStats {
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  excusedDays: number
  presentPercent: number
  currentStreak: number
  bestStreak: number
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

export function computeDayStats(records: AttendanceRecordLike[]): Map<string, DayAttendance> {
  const byDay = new Map<string, DayAttendance>()
  for (const record of records) {
    const key = dateKey(new Date(`${record.date}T12:00:00`))
    let day = byDay.get(key)
    if (!day) {
      day = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      byDay.set(key, day)
    }
    if (record.status === "PRESENT") day.present++
    else if (record.status === "ABSENT") day.absent++
    else if (record.status === "LATE") day.late++
    else if (record.status === "EXCUSED") day.excused++
    day.total++
  }
  return byDay
}

function isAttended(day: DayAttendance | undefined): boolean {
  return !!day && (day.present > 0 || day.late > 0)
}

export function computeAttendanceStats(records: AttendanceRecordLike[]): AttendanceStats {
  const byDay = computeDayStats(records)
  const days = [...byDay.keys()].sort().reverse()

  let currentStreak = 0
  for (const key of days) {
    if (isAttended(byDay.get(key))) currentStreak++
    else break
  }

  let bestStreak = 0
  let run = 0
  for (const key of days) {
    if (isAttended(byDay.get(key))) {
      run++
      bestStreak = Math.max(bestStreak, run)
    } else {
      run = 0
    }
  }

  const countStatus = (status: AttendanceStatus) =>
    [...byDay.values()].filter((d) =>
      status === "PRESENT" ? d.present > 0 : status === "LATE" ? d.late > 0 : status === "ABSENT" ? d.absent > 0 : d.excused > 0,
    ).length

  const totalDays = byDay.size
  const presentDays = countStatus("PRESENT")
  const lateDays = countStatus("LATE")
  const absentDays = countStatus("ABSENT")
  const excusedDays = countStatus("EXCUSED")

  return {
    totalDays,
    presentDays,
    lateDays,
    absentDays,
    excusedDays,
    presentPercent: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0,
    currentStreak,
    bestStreak,
  }
}

export function lastNDays(days: number, end: Date = new Date()): Date[] {
  const result: Date[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - i)
    result.push(d)
  }
  return result
}

export interface MonthBucket {
  key: string
  label: string
  present: number
  late: number
  excused: number
  absent: number
  total: number
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function monthBuckets(records: AttendanceRecordLike[], months: number, end: Date = new Date()): MonthBucket[] {
  const byDay = computeDayStats(records)

  const start = new Date(end)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - (months - 1))

  const buckets: MonthBucket[] = []
  for (let i = 0; i < months; i++) {
    const cursor = new Date(start)
    cursor.setMonth(start.getMonth() + i)
    buckets.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[cursor.getMonth()],
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      total: 0,
    })
  }

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
  for (const [key, day] of byDay) {
    const bucket = bucketByKey.get(key.slice(0, 7))
    if (!bucket) continue
    bucket.present += day.present
    bucket.late += day.late
    bucket.excused += day.excused
    bucket.absent += day.absent
    bucket.total += day.total
  }

  return buckets
}
