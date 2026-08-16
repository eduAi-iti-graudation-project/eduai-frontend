import { useEffect, useState } from "react"
import { AgentGraph } from "@/components/shared/AgentGraph"
import type { AgentToolNode } from "@/components/shared/AgentGraph"

const toolSteps: AgentToolNode[] = [
  { key: "read_course", icon: "menu_book", duration: "16s" },
  { key: "read_students", icon: "group", duration: "21s" },
  { key: "search_content", icon: "search", duration: "26s" },
  { key: "draft_reply", icon: "edit_note", duration: "31s" },
]

const stepStatus: Record<string, { label: string; caption: string }> = {
  read_course: {
    label: "Reading the course material…",
    caption: "The agent is pulling in your course and class context.",
  },
  read_students: {
    label: "Checking student data…",
    caption: "The agent is looking up who is in this class and how they're doing.",
  },
  search_content: {
    label: "Searching for answers…",
    caption: "The agent is finding the content that answers your question.",
  },
  draft_reply: {
    label: "Drafting a response…",
    caption: "The agent is putting together your answer.",
  },
}

export function AssistantAgentGraph({
  variant = "inline",
}: {
  variant?: "inline" | "centered"
}) {
  const [active, setActive] = useState(toolSteps[0].key)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const idx = toolSteps.findIndex((t) => t.key === prev)
        return toolSteps[(idx + 1) % toolSteps.length].key
      })
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const status = stepStatus[active]

  return (
    <AgentGraph
      variant={variant}
      toolSteps={toolSteps}
      activeToolKey={active}
      orchestratorIcon="school"
      status={{ label: status.label, caption: status.caption }}
    />
  )
}