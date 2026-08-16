import { AgentGraph } from "@/components/shared/AgentGraph"
import type { QuizAgentStep } from "@/lib/api"

const stepConfig: Record<QuizAgentStep, { label: string; caption: string }> = {
  thinking: {
    label: "Thinking…",
    caption: "The agent is planning how to build your quiz.",
  },
  search_curriculum: {
    label: "Searching the unit material…",
    caption: "The agent is scanning the selected unit's content for context.",
  },
  generate_questions: {
    label: "Writing questions…",
    caption: "The agent is creating questions from the unit's material.",
  },
  review_questions: {
    label: "Reviewing coverage…",
    caption: "The agent is checking the questions cover the whole unit.",
  },
  save_quiz: {
    label: "Saving your quiz…",
    caption: "The agent is saving the quiz and assigning it to the selected sections.",
  },
}

const toolSteps = [
  { key: "search_curriculum", icon: "menu_book", duration: "16s" },
  { key: "generate_questions", icon: "edit_note", duration: "21s" },
  { key: "review_questions", icon: "fact_check", duration: "26s" },
  { key: "save_quiz", icon: "save", duration: "31s" },
]

export function QuizAgentGraph({
  step,
  lastToolStep,
  variant = "centered",
}: {
  step: QuizAgentStep | null
  lastToolStep?: QuizAgentStep | null
  variant?: "inline" | "centered"
}) {
  const current = step ?? "thinking"
  const active: QuizAgentStep =
    current === "thinking" && lastToolStep ? lastToolStep : current
  const config = stepConfig[current] ?? stepConfig.thinking

  return (
    <AgentGraph
      variant={variant}
      toolSteps={toolSteps}
      activeToolKey={active}
      status={{ label: config.label, caption: config.caption }}
    />
  )
}