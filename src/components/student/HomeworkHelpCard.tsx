import { FeedbackButtons } from "./FeedbackButtons"
import type { HomeworkHelpInteraction } from "@/lib/api"

const actionConfig: Record<string, { icon: string; label: string }> = {
  HINT: { icon: "auto_awesome", label: "Hint" },
  EXPLANATION: { icon: "menu_book", label: "Explanation" },
  REDIRECT_TEACHER: { icon: "school", label: "Ask Teacher" },
}

interface HomeworkHelpCardProps {
  interaction: HomeworkHelpInteraction
  className?: string
}

export function HomeworkHelpCard({ interaction, className }: HomeworkHelpCardProps) {
  const config = actionConfig[interaction.action] ?? { icon: "psychology", label: interaction.action.replace(/_/g, " ") }

  return (
    <div className={`rounded-lg bg-white border border-border p-md ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-label-sm text-label-sm px-2.5 py-1 rounded-lg">
          <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
          {config.label}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {new Date(interaction.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Q:</p>
      <p className="font-body-md text-body-md text-on-surface mb-3">{interaction.question}</p>

      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">A:</p>
      <p className="font-body-md text-body-md text-on-surface-variant mb-3">{interaction.answer}</p>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {interaction.sources.length > 0
            ? `Sources: ${interaction.sources.length}`
            : "No sources"}
        </span>
        <FeedbackButtons
          interactionId={interaction.id}
          currentFeedback={interaction.feedback}
        />
      </div>
    </div>
  )
}
