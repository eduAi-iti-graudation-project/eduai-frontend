import { describe, expect, it } from "vitest"
import {
  computeAttendanceStats,
  computeDayStats,
  dateKey,
  lastNDays,
  monthBuckets,
} from "./attendance-stats"

const record = (date: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => ({ date, status })

describe("computeDayStats", () => {
  it("groups records by calendar day, summing statuses", () => {
    const byDay = computeDayStats([
      record("2026-03-02", "PRESENT"),
      record("2026-03-02", "PRESENT"),
      record("2026-03-03", "ABSENT"),
      record("2026-03-03", "LATE"),
    ])
    expect(byDay.get("2026-03-02")).toEqual({ present: 2, absent: 0, late: 0, excused: 0, total: 2 })
    expect(byDay.get("2026-03-03")).toEqual({ present: 0, absent: 1, late: 1, excused: 0, total: 2 })
  })

  it("treats date-only strings as calendar dates regardless of timezone", () => {
    const byDay = computeDayStats([record("2026-01-01", "PRESENT")])
    expect([...byDay.keys()]).toEqual(["2026-01-01"])
  })
})

describe("computeAttendanceStats", () => {
  it("counts contiguous attended school days; gaps in the log (weekends/holidays) never break a streak", () => {
    const stats = computeAttendanceStats([
      record("2026-03-02", "PRESENT"),
      record("2026-03-03", "PRESENT"),
      record("2026-03-04", "PRESENT"),
      record("2026-03-09", "PRESENT"),
      record("2026-03-10", "PRESENT"),
      record("2026-03-11", "PRESENT"),
    ])
    expect(stats.currentStreak).toBe(6)
    expect(stats.bestStreak).toBe(6)
  })

  it("breaks the current streak on an absence but keeps the best streak", () => {
    const stats = computeAttendanceStats([
      record("2026-03-02", "PRESENT"),
      record("2026-03-03", "PRESENT"),
      record("2026-03-04", "ABSENT"),
      record("2026-03-05", "PRESENT"),
    ])
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(2)
  })

  it("counts late as attended for streaks and rate; an absence on the latest day resets the current streak", () => {
    const stats = computeAttendanceStats([
      record("2026-03-02", "LATE"),
      record("2026-03-03", "PRESENT"),
      record("2026-03-04", "ABSENT"),
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.bestStreak).toBe(2)
    expect(stats.presentPercent).toBe(67)
  })

  it("returns zeros for empty records", () => {
    expect(computeAttendanceStats([])).toEqual({
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      excusedDays: 0,
      presentPercent: 0,
      currentStreak: 0,
      bestStreak: 0,
    })
  })

  it("counts a day with any presence as a present day", () => {
    const stats = computeAttendanceStats([
      record("2026-03-02", "PRESENT"),
      record("2026-03-02", "ABSENT"),
      record("2026-03-03", "EXCUSED"),
    ])
    expect(stats.totalDays).toBe(2)
    expect(stats.presentDays).toBe(1)
    expect(stats.excusedDays).toBe(1)
  })
})

describe("lastNDays", () => {
  it("returns n consecutive calendar days ending on the given date", () => {
    const days = lastNDays(3, new Date(2026, 2, 5))
    expect(days.map(dateKey)).toEqual(["2026-03-03", "2026-03-04", "2026-03-05"])
  })
})

describe("monthBuckets", () => {
  it("buckets records into the last n months and labels them", () => {
    const buckets = monthBuckets(
      [record("2026-01-15", "PRESENT"), record("2026-02-02", "ABSENT"), record("2026-03-10", "LATE")],
      3,
      new Date(2026, 2, 20),
    )
    expect(buckets.map((b) => b.label)).toEqual(["Jan", "Feb", "Mar"])
    expect(buckets[0].present).toBe(1)
    expect(buckets[1].absent).toBe(1)
    expect(buckets[2].late).toBe(1)
  })

  it("drops records older than the window", () => {
    const buckets = monthBuckets([record("2025-12-01", "PRESENT")], 3, new Date(2026, 2, 20))
    expect(buckets.flatMap((b) => [b.present, b.absent, b.late, b.excused])).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})
