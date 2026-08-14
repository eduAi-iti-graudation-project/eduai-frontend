import { DAY_ORDER, type DayOfWeek } from "@/lib/api"

export type WeekStart = "MONDAY" | "SUNDAY"

const STORAGE_KEY = "eduai.timetable.weekStart"

export function getWeekStart(): WeekStart {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === "SUNDAY" ? "SUNDAY" : "MONDAY"
}

export function setWeekStart(value: WeekStart): void {
  localStorage.setItem(STORAGE_KEY, value)
}

export function orderedDays(): DayOfWeek[] {
  if (getWeekStart() === "SUNDAY") {
    const sundayIdx = DAY_ORDER.indexOf("SUNDAY")
    return [...DAY_ORDER.slice(sundayIdx), ...DAY_ORDER.slice(0, sundayIdx)]
  }
  return DAY_ORDER
}