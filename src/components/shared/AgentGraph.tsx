import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export interface AgentToolNode {
  key: string
  icon: string
  duration: string
}

export interface AgentStatus {
  label: string
  caption: string
}

function AgentToolNode({
  icon,
  active,
  duration,
  index,
  toolCount,
}: {
  icon: string
  active: boolean
  duration: string
  index: number
  toolCount: number
}) {
  const phaseDelay = `${(-(parseFloat(duration) / toolCount) * index).toFixed(2)}s`
  const orbitStyle = {
    "--orbit-duration": duration,
    animationDelay: phaseDelay,
  } as CSSProperties
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

/**
 * Agent loading visualization: a central orchestrator node with the agent's
 * tool nodes orbiting around it. The currently-active tool node is highlighted.
 */
export function AgentGraph({
  toolSteps,
  activeToolKey,
  status,
  orchestratorIcon = "smart_toy",
  variant = "inline",
}: {
  toolSteps: AgentToolNode[]
  activeToolKey: string | null
  status: AgentStatus
  orchestratorIcon?: string
  variant?: "inline" | "centered"
}) {
  const graph = (
    <div className="relative w-56 h-56 shrink-0">
      {/* Central agent node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <span
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{ animationDelay: "0.8s" }}
          />
          <div className="relative w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center border border-primary shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-[26px]">
              {orchestratorIcon}
            </span>
          </div>
        </div>
      </div>

      {/* Orbiting agent tools */}
      {toolSteps.map((node, idx) => (
        <AgentToolNode
          key={node.key}
          icon={node.icon}
          active={activeToolKey === node.key}
          duration={node.duration}
          index={idx}
          toolCount={toolSteps.length}
        />
      ))}
    </div>
  )

  const text = (
    <div className="min-w-0 flex-1 text-left">
      <p className="font-headline-sm text-headline-sm text-on-surface">
        {status.label}
      </p>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
        {status.caption}
      </p>
    </div>
  )

  if (variant === "centered") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        {graph}
        {text}
      </div>
    )
  }

  return <div className="flex items-center gap-6 py-4">{graph}{text}</div>
}