export interface CourseColor {
  solid: string
  tint: string
}

export const COURSE_PALETTE: CourseColor[] = [
  { solid: "#3B82F6", tint: "#EFF6FF" }, // blue
  { solid: "#0D9488", tint: "#F0FDFA" }, // teal
  { solid: "#EC4899", tint: "#FDF2F8" }, // pink
  { solid: "#EA580C", tint: "#FFF7ED" }, // orange
  { solid: "#0891B2", tint: "#ECFEFF" }, // cyan
  { solid: "#C026D3", tint: "#FAF5FF" }, // fuchsia
  { solid: "#65A30D", tint: "#F7FEE7" }, // lime
  { solid: "#92400E", tint: "#FEF3C7" }, // brown
]

export function colorForTag(colorTag: string | null | undefined): CourseColor {
  if (!colorTag) return COURSE_PALETTE[0]
  const index = COURSE_PALETTE.findIndex((c) => c.solid === colorTag)
  return index >= 0 ? COURSE_PALETTE[index] : COURSE_PALETTE[0]
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function fromMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(minutes)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function fmtTime(time: string): string {
  const [h, m] = time.split(":")
  const hour = Number(h)
  const suffix = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m ?? "00"} ${suffix}`
}

export function fmtTimeRange(start: string, end: string): string {
  return `${fmtTime(start)} – ${fmtTime(end)}`
}

export function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function isToday(day: DayOfWeekLike): boolean {
  const today = new Date()
  const dayIndex = (today.getDay() + 6) % 7 // 0 = Monday
  return DAY_LIKE_ORDER[dayIndex] === day
}

type DayOfWeekLike = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"

const DAY_LIKE_ORDER: DayOfWeekLike[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]
