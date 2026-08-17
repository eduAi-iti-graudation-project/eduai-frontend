import { AgentGraph } from "@/components/shared/AgentGraph"
import type { GuardianAgentStep } from "@/lib/api"

const stepConfig: Record<GuardianAgentStep, { label: string; caption: string }> = {
  read_grades: {
    label: "Reading grades…",
    caption: "The copilot is pulling confirmed grades and the child's average.",
  },
  read_attendance: {
    label: "Checking attendance…",
    caption: "The copilot is reading attendance records and the overall rate.",
  },
  read_classes: {
    label: "Loading classes…",
    caption: "The copilot is listing the classes the child is enrolled in.",
  },
  read_alerts: {
    label: "Reviewing alerts…",
    caption: "The copilot is checking for any active alerts on the child.",
  },
  read_insights: {
    label: "Gathering insights…",
    caption: "The copilot is reading quizzes, fees and trend signals.",
  },
  thinking: {
    label: "Thinking…",
    caption: "The copilot is reasoning about your question.",
  },
}

const toolSteps = [
  { key: "read_grades", icon: "school", duration: "16s" },
  { key: "read_attendance", icon: "event_available", duration: "21s" },
  { key: "read_classes", icon: "book", duration: "26s" },
  { key: "read_alerts", icon: "notifications_active", duration: "31s" },
]

export function GuardianAgentGraph({
  step,
  lastToolStep,
  variant = "inline",
}: {
  step: GuardianAgentStep | null
  lastToolStep?: GuardianAgentStep | null
  variant?: "inline" | "centered"
}) {
  const current = step ?? "thinking"
  const active: GuardianAgentStep =
    current === "thinking" && lastToolStep ? lastToolStep : current
  const config = stepConfig[current] ?? stepConfig.thinking

  return (
    <AgentGraph
      variant={variant}
      toolSteps={toolSteps}
      activeToolKey={active}
      orchestratorIcon="family_history"
      status={{ label: config.label, caption: config.caption }}
    />
  )
}