import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { HomeworkAgentStep } from "@/lib/api"

const TOOL_STEPS = ["search_material", "search_assignment", "search_web"] as const

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

function AgentNode({
  icon,
  active,
  duration,
  index,
}: {
  icon: string
  active: boolean
  duration: string
  index: number
}) {
  const phaseDelay = `${(-(parseFloat(duration) / TOOL_STEPS.length) * index).toFixed(2)}s`
  const orbitStyle = { "--orbit-duration": duration, animationDelay: phaseDelay } as CSSProperties
  return (
    <div className="agent-orbit" style={orbitStyle}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div className="agent-orbit-reverse" style={orbitStyle}>
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300",
              active
                ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/30 scale-110"
                : "bg-surface-container text-on-surface-variant border-outline-variant",
            )}
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <div className="flex items-center gap-6 py-4">
      <div className="relative w-56 h-56 shrink-0">
        {/* Central agent node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-14 h-14">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDelay: "0.8s" }} />
            <div className="relative w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center border border-primary shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-[26px]">smart_toy</span>
            </div>
          </div>
        </div>

        {/* Orbiting agent tools */}
        <AgentNode icon="menu_book" active={active === "search_material"} duration="16s" index={0} />
        <AgentNode icon="assignment" active={active === "search_assignment"} duration="21s" index={1} />
        <AgentNode icon="public" active={active === "search_web"} duration="26s" index={2} />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="font-headline-sm text-headline-sm text-on-surface">{config.label}</p>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{config.caption}</p>
      </div>
    </div>
  )
}
