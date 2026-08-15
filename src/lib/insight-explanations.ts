import type { InsightSection } from "@/lib/api"

/**
 * Curated, static explanations for each insight chart.
 * Purposefully deterministic — no LLM calls. Every chart gets a plain-language
 * subtitle ("what is this graph doing") plus longer prose for an info popover.
 */

export interface InsightExplanation {
  /** one-line subtitle shown under the card title */
  subtitle: string
  /** longer prose for the info popover */
  what: string
  /** singular noun for count values, e.g. "submission" */
  unitNoun: string
  /** plural noun for count values, e.g. "submissions" */
  unitNounPlural: string
  /** true when the chart value is a percentage (0-100) */
  isPercent: boolean
}

const GUARDIAN_CHILD = /^child_[0-9a-fA-F-]{36}_(grades|attendance|alerts)$/

export const INSIGHT_EXPLANATIONS: Record<string, InsightExplanation> = {
  // ── TEACHER ────────────────────────────────────────────────────
  submissions_volume: {
    subtitle: "Submissions from your classes, per period",
    what: "Counts every student submission in your classes for each period. A sudden spike usually means a deadline landed — plan your review time around it.",
    unitNoun: "submission",
    unitNounPlural: "submissions",
    isPercent: false,
  },
  confirmed_grades: {
    subtitle: "Grades you confirmed after review",
    what: "Each point is the number of grading scores you confirmed in that period. Unconfirmed AI suggestions are never counted — only real, confirmed grades appear.",
    unitNoun: "confirmed grade",
    unitNounPlural: "confirmed grades",
    isPercent: false,
  },
  pending_confirmations: {
    subtitle: "Scores still waiting for your review",
    what: "Scores that were auto-graded but not yet confirmed. They stay suggestions until you approve them — confirming is what publishes the real grade to the student.",
    unitNoun: "pending score",
    unitNounPlural: "pending scores",
    isPercent: false,
  },
  alerts_created: {
    subtitle: "Alerts the system raised for your students",
    what: "Alerts triggered by the analysis agent for your students. Watch for sudden jumps — several alerts in one period usually means a struggling student or a hard assignment.",
    unitNoun: "alert",
    unitNounPlural: "alerts",
    isPercent: false,
  },
  alerts_resolved: {
    subtitle: "Alerts you resolved or dismissed",
    what: "Alerts you closed in each period. A steady flow here means issues are being followed up, not piling up.",
    unitNoun: "resolved alert",
    unitNounPlural: "resolved alerts",
    isPercent: false,
  },
  attendance_rate: {
    subtitle: "Attendance rate in your classes",
    what: "The share of attendances marked present in each period. A dip flags engagement problems before they become grade problems.",
    unitNoun: "attendance rate",
    unitNounPlural: "attendance rate",
    isPercent: true,
  },
  class_average: {
    subtitle: "Average confirmed score per class",
    what: "Each bar is one of your classes, showing the average of all confirmed scores in it. A short bar tells you which class needs a closer look.",
    unitNoun: "class",
    unitNounPlural: "classes",
    isPercent: true,
  },
  criterion_average: {
    subtitle: "Average confirmed score per rubric criterion",
    what: "Each bar is a rubric criterion, averaged across confirmed scores. Short bars are the criteria students find hardest — target your next lesson there.",
    unitNoun: "criterion",
    unitNounPlural: "criteria",
    isPercent: true,
  },
  struggling_students: {
    subtitle: "Students redirected to you by the helper",
    what: "Students who asked the homework helper for help and were redirected to a teacher. The helper surfaces these as early warning signals.",
    unitNoun: "student",
    unitNounPlural: "students",
    isPercent: false,
  },

  // ── STUDENT ─────────────────────────────────────────────────────
  grade_trend: {
    subtitle: "Your confirmed grades over time",
    what: "Only confirmed grades show up here — a suggestion your teacher hasn't reviewed yet stays hidden until it becomes a real grade.",
    unitNoun: "average grade",
    unitNounPlural: "average grades",
    isPercent: true,
  },
  attendance_trend: {
    subtitle: "Your attendance rate per period",
    what: "The share of your attendances marked present in each period.",
    unitNoun: "attendance rate",
    unitNounPlural: "attendance rate",
    isPercent: true,
  },
  criterion_strengths: {
    subtitle: "Your average score per criterion",
    what: "Your average score for each rubric criterion. Long bars are strengths to keep — short bars show exactly what to practice.",
    unitNoun: "criterion",
    unitNounPlural: "criteria",
    isPercent: true,
  },
  help_action_split: {
    subtitle: "How the helper responded to you",
    what: "Each slice is one homework-helper outcome. REDIRECT_TEACHER means the helper asked you to bring the question to your teacher.",
    unitNoun: "help action",
    unitNounPlural: "help actions",
    isPercent: false,
  },

  // ── ADMIN ───────────────────────────────────────────────────────
  pass_rate_trend: {
    subtitle: "Share of confirmed grades at or above 60%",
    what: "For each period, the percentage of confirmed grades that met the passing bar (60%). Volume up while pass rate drops is the classic early warning.",
    unitNoun: "pass rate",
    unitNounPlural: "pass rate",
    isPercent: true,
  },
  user_growth: {
    subtitle: "New students and teachers per period",
    what: "How many students and teachers joined in each period. Slow growth may mean onboarding needs attention.",
    unitNoun: "new user",
    unitNounPlural: "new users",
    isPercent: false,
  },
  teacher_workload: {
    subtitle: "Pending reviews and class sizes per teacher",
    what: "For each teacher: reviews still waiting to be confirmed plus the students they serve. Use it to rebalance workload before deadlines hit.",
    unitNoun: "task",
    unitNounPlural: "tasks",
    isPercent: false,
  },
  alert_status_split: {
    subtitle: "Current alerts by status",
    what: "All current alerts split into ACTIVE and RESOLVED. A large ACTIVE slice means follow-up work is piling up.",
    unitNoun: "alert",
    unitNounPlural: "alerts",
    isPercent: false,
  },

  // ── GUARDIAN (per-child wildcard) ───────────────────────────────
  child_grades: {
    subtitle: "How your child's confirmed grades change over time",
    what: "Grades shown here are always confirmed results — suggestions still under teacher review stay hidden.",
    unitNoun: "average grade",
    unitNounPlural: "average grades",
    isPercent: true,
  },
  child_attendance: {
    subtitle: "How your child's attendance changes over time",
    what: "The share of your child's attendances marked present in each period.",
    unitNoun: "attendance rate",
    unitNounPlural: "attendance rate",
    isPercent: true,
  },
  child_alerts: {
    subtitle: "Alerts raised for your child",
    what: "Everything the system flagged for your child in each period, with the reason the alert was raised.",
    unitNoun: "alert",
    unitNounPlural: "alerts",
    isPercent: false,
  },
}

const FALLBACK: InsightExplanation = {
  subtitle: "How this metric changes over time",
  what: "Click any point to see the exact records behind it. Switch to the Month view to read longer trends.",
  unitNoun: "record",
  unitNounPlural: "records",
  isPercent: false,
}

export function getInsightExplanation(sectionKey: string): InsightExplanation {
  if (GUARDIAN_CHILD.test(sectionKey)) {
    const kind = sectionKey.split("_").pop()
    if (kind === "grades") return INSIGHT_EXPLANATIONS.child_grades
    if (kind === "attendance") return INSIGHT_EXPLANATIONS.child_attendance
    return INSIGHT_EXPLANATIONS.child_alerts
  }
  return INSIGHT_EXPLANATIONS[sectionKey] ?? FALLBACK
}

export type InsightIntervalLabel = "week" | "month"

/** "2026-08-10" + week → "week of 10 Aug"; + month → "Aug 2026" */
export function formatBucket(
  interval: InsightIntervalLabel,
  label: string,
): string {
  const parts = label.split("-").map(Number)
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) {
    return label
  }
  const [y, m, d] = parts
  if (interval === "month") {
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    })
  }
  return `week of ${new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })}`
}

/** Human sentence for a clicked chart point, e.g. "3 submissions in the week of 10 Aug". */
export function interpretPoint(
  section: Pick<InsightSection, "key" | "chartType">,
  label: string,
  value: number,
  interval: InsightIntervalLabel = "week",
): string {
  const explanation = getInsightExplanation(section.key)
  const amount = explanation.isPercent
    ? `${value}%`
    : `${value} ${value === 1 ? explanation.unitNoun : explanation.unitNounPlural}`
  if (section.chartType === "line" || section.chartType === "area") {
    return `${amount} in the ${formatBucket(interval, label)} period`
  }
  return `${label}: ${amount}`
}
