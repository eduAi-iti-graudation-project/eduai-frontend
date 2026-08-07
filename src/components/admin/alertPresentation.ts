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
    iconChip: "bg-[#ffdad6] text-[#93000a]",
  },
  DOWNWARD_TREND: {
    title: "Declining performance",
    icon: "trending_down",
    iconChip: "bg-[#fef3c7] text-[#78350f]",
  },
  CONSISTENT_STRUGGLE: {
    title: "Struggling to keep up",
    icon: "repeat",
    iconChip: "bg-[#ffdad6] text-[#93000a]",
  },
  WEAK_CRITERION: {
    title: "Weak in key skills",
    icon: "track_changes",
    iconChip: "bg-[#dcfce7] text-[#14532d]",
  },
}

const FALLBACK_META: AlertMeta = {
  title: "Flagged",
  icon: "warning",
  iconChip: "bg-[#fef3c7] text-[#78350f]",
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
  if (severity === "HIGH") return "bg-[#ffdad6] text-[#93000a]"
  if (severity === "MEDIUM") return "bg-[#fef3c7] text-[#78350f]"
  return "bg-[#dde1fd] text-[#41465c]"
}

export function severityLabel(severity: AlertListItem["severity"] | string | null | undefined): string {
  if (severity === "HIGH") return "High priority"
  if (severity === "MEDIUM") return "Monitor"
  return "Track"
}