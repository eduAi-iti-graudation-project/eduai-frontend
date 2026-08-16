import { AgentGraph } from "@/components/shared/AgentGraph"
import type { HomeworkAgentStep } from "@/lib/api"

const stepConfig: Record<HomeworkAgentStep, { label: string; caption: string }> = {
  search_material: {
    label: "Searching the course material…",
    caption: "The agent is scanning your class curriculum for relevant content.",
  },
  search_assignment: {
    label: "Looking up the assignment…",
    caption: "The agent is finding the assignment details and its rubric.",
  },
  search_web: {
    label: "Searching the web…",
    caption: "No course material matched, so the agent is checking general references.",
  },
  thinking: {
    label: "Thinking…",
    caption: "The agent is reasoning about your question.",
  },
  teacher: {
    label: "Notifying your teacher…",
    caption: "This one needs your teacher — the agent is opening a chat thread.",
  },
}

const toolSteps = [
  { key: "search_material", icon: "menu_book", duration: "16s" },
  { key: "search_assignment", icon: "assignment", duration: "21s" },
  { key: "search_web", icon: "public", duration: "26s" },
]

export function HomeworkAgentGraph({
  step,
  lastToolStep,
}: {
  step: HomeworkAgentStep | null
  lastToolStep?: HomeworkAgentStep | null
}) {
  const current = step ?? "thinking"
  const active: HomeworkAgentStep =
    current === "thinking" && lastToolStep ? lastToolStep : current
  const config = stepConfig[current] ?? stepConfig.thinking

  return (
    <AgentGraph
      toolSteps={toolSteps}
      activeToolKey={active}
      status={{ label: config.label, caption: config.caption }}
    />
  )
}