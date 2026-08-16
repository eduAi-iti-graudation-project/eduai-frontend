import { AgentGraph } from "@/components/shared/AgentGraph"
import type { LabAgentStep } from "@/lib/api"

const stepConfig: Record<LabAgentStep, { label: string; caption: string }> = {
  thinking: {
    label: "Thinking…",
    caption: "The agent is planning the lab.",
  },
  search_curriculum: {
    label: "Searching the unit material…",
    caption: "The agent is scanning the selected unit's content for context.",
  },
  design_game: {
    label: "Designing the game…",
    caption: "The agent is building an interactive game spec grounded in the unit's material.",
  },
  generate_code: {
    label: "Writing the game…",
    caption: "The agent is building the interactive game/simulation from the unit's material.",
  },
  load_lab: {
    label: "Loading the current lab…",
    caption: "The agent is reading the existing lab and the unit material.",
  },
  modify_lab: {
    label: "Applying your change…",
    caption: "The agent is modifying the existing game in place — not rewriting it.",
  },
}

const toolSteps = [
  { key: "search_curriculum", icon: "menu_book", duration: "12s" },
  { key: "design_game", icon: "smart_toy", duration: "18s" },
  { key: "generate_code", icon: "code", duration: "22s" },
  { key: "modify_lab", icon: "edit_note", duration: "27s" },
]

export function LabAgentGraph({
  step,
  lastToolStep,
  variant = "centered",
}: {
  step: LabAgentStep | null
  lastToolStep?: LabAgentStep | null
  variant?: "inline" | "centered"
}) {
  const current = step ?? "thinking"
  const active: LabAgentStep =
    current === "thinking" && lastToolStep ? lastToolStep : current
  const config = stepConfig[current] ?? stepConfig.thinking

  return (
    <AgentGraph
      variant={variant}
      toolSteps={toolSteps}
      activeToolKey={active}
      orchestratorIcon="science"
      status={{ label: config.label, caption: config.caption }}
    />
  )
}