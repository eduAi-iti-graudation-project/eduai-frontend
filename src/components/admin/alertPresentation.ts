import type { AlertListItem } from "@/lib/api"

interface AlertMeta {
  title: string
  icon: string
  iconChip: string
}

const ALERT_META: Record<string, AlertMeta> = {
  FAILING: {
    title: "Risk of failing",
    icon: "trending_down",
    iconChip: "bg-error-container text-on-error-container",
  },
  DOWNWARD_TREND: {
    title: "Declining performance",
    icon: "trending_down",
    iconChip: "bg-secondary-fixed text-on-secondary-fixed-variant",
  },
  CONSISTENT_STRUGGLE: {
    title: "Struggling to keep up",
    icon: "repeat",
    iconChip: "bg-error-container text-on-error-container",
  },
  WEAK_CRITERION: {
    title: "Weak in key skills",
    icon: "track_changes",
    iconChip: "bg-success-container text-on-success-container",
  },
}

const FALLBACK_META: AlertMeta = {
  title: "Flagged",
  icon: "warning",
  iconChip: "bg-secondary-fixed text-on-secondary-fixed-variant",
}

export function alertMeta(type: string): AlertMeta {
  const cleaned = type
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
  const meta = ALERT_META[type] ?? FALLBACK_META
  return { ...meta, title: ALERT_META[type]?.title ?? cleaned }
}

export function severityChipClass(severity: AlertListItem["severity"] | string | null | undefined): string {
  if (severity === "HIGH") return "bg-error-container text-on-error-container"
  if (severity === "MEDIUM") return "bg-secondary-fixed text-on-secondary-fixed-variant"
  return "bg-primary-fixed text-on-surface-variant"
}

export function severityLabel(severity: AlertListItem["severity"] | string | null | undefined): string {
  if (severity === "HIGH") return "High priority"
  if (severity === "MEDIUM") return "Monitor"
  return "Track"
}