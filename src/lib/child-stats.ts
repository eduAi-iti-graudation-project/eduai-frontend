import type { components } from "@/types/api-schema"
import type { StudentGrade } from "@/lib/api"

export interface ChildSummary {
  overallAverage: number
  confirmedCount: number
  attendanceRate: number
  present: number
  absent: number
  late: number
  excused: number
}

/** Derive a guardian-facing summary from raw confirmed grades + attendance records. */
export function computeChildSummary(
  grades: StudentGrade[],
  attendance: components["schemas"]["AttendanceResponseDto"][],
): ChildSummary {
  const confirmed = grades.filter((g) => g.isConfirmed)
  const overallAverage =
    confirmed.length > 0
      ? Math.round(
          confirmed.reduce((sum, g) => sum + g.pointsAwarded, 0) / confirmed.length,
        )
      : 0

  const present = attendance.filter((a) => a.status === "PRESENT").length
  const absent = attendance.filter((a) => a.status === "ABSENT").length
  const late = attendance.filter((a) => a.status === "LATE").length
  const excused = attendance.filter((a) => a.status === "EXCUSED").length
  const total = attendance.length
  const attendanceRate =
    total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0

  return {
    overallAverage,
    confirmedCount: confirmed.length,
    attendanceRate,
    present,
    absent,
    late,
    excused,
  }
}

/** One-line attendance description used by the assistant. */
export function attendanceSummaryLine(
  name: string,
  attendance: components["schemas"]["AttendanceResponseDto"][],
): string {
  if (attendance.length === 0) return `${name} has no attendance records stored yet.`
  const s = computeChildSummary([], attendance)
  return `${name} has ${attendance.length} attendance record${attendance.length === 1 ? "" : "s"} (${s.present} present, ${s.absent} absent, ${s.late} late, ${s.excused} excused). Attendance rate ≈ ${s.attendanceRate}%.`
}