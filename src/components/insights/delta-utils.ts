import type { InsightDirection, InsightSection } from "@/lib/api"

export const directionStyles: Record<InsightDirection, string> = {
  up: "bg-primary-container/15 text-primary",
  down: "bg-error-container/30 text-error",
  flat: "bg-surface-container-high text-on-surface-variant",
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const abs = Math.abs(rounded)
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)
  if (rounded > 0) return `+${text}%`
  if (rounded < 0) return `-${text}%`
  return `${text}%`
}

export function isEmptySection(section: Pick<InsightSection, "series">): boolean {
  return section.series.length === 0
}
