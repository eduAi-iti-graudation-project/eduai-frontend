import { Link } from "react-router-dom"
import type { ChatContextResult } from "@/hooks/use-chat-context"
import { ActivityTimeline } from "@/components/shared/ActivityTimeline"
import { cn } from "@/lib/utils"

interface ChatContextPanelProps {
  context: ChatContextResult
  className?: string
}

const statTones: Record<string, string> = {
  positive: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  default: "bg-primary-fixed text-on-primary-fixed-variant",
}

const rowTones: Record<string, string> = {
  positive: "text-on-success-container",
  negative: "text-on-error-container",
  warning: "text-on-warning-container",
  danger: "text-on-error-container",
  neutral: "text-on-surface",
}

export function ChatContextPanel({ context, className }: ChatContextPanelProps) {
  const { profile, stats, tables, timeline, actions, aiNote, loading } = context

  return (
    <aside className={cn("flex flex-col gap-3 overflow-y-auto p-3 min-h-0", className)}>
      {profile && (
        <section className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3">
          {profile.to ? (
            <Link to={profile.to} className="flex items-center gap-3 group">
              <AvatarDot name={profile.name} />
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                  {profile.name}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{profile.subtitle}</p>
                {profile.email ? <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{profile.email}</p> : null}
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 group-hover:text-primary">chevron_right</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <AvatarDot name={profile.name} />
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface font-semibold truncate">{profile.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{profile.subtitle}</p>
                {profile.email ? <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{profile.email}</p> : null}
              </div>
            </div>
          )}
        </section>
      )}

      {aiNote && (
        <section className="rounded-lg bg-surface-container-lowest border border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            </span>
            <h3 className="font-label-md text-label-md text-primary font-semibold">{aiNote.title}</h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{aiNote.summary}</p>
          {aiNote.to ? (
            <Link to={aiNote.to} className="mt-2 inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:underline">
              Open insights
              <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
            </Link>
          ) : null}
        </section>
      )}

      {loading ? (
        <section className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3">
          <div className="space-y-2">
            <div className="h-3 w-2/3 rounded skeleton-shimmer" />
            <div className="h-3 w-1/2 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-14 rounded skeleton-shimmer" />
              <div className="h-14 rounded skeleton-shimmer" />
              <div className="h-14 rounded skeleton-shimmer" />
              <div className="h-14 rounded skeleton-shimmer" />
            </div>
          </div>
        </section>
      ) : (
        <>
          {stats.length > 0 && (
            <section className="grid grid-cols-2 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-md bg-surface-container-low px-2.5 py-2 min-w-0">
                  <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
                    <span className={cn("w-5 h-5 shrink-0 rounded flex items-center justify-center", statTones[stat.tone ?? "default"])}>
                      <span className="material-symbols-outlined text-[13px]">{stat.icon}</span>
                    </span>
                    <span className="font-label-sm text-label-sm truncate">{stat.label}</span>
                  </div>
                  <p className="font-headline-md text-headline-md text-on-surface tabular-nums mt-1 font-bold">{stat.value}</p>
                </div>
              ))}
            </section>
          )}

          {tables.map((table) => (
            <section key={table.title} className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
              <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-low/60">
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">{table.title}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      {table.columns.map((col) => (
                        <th key={col} className="px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {table.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container-low">
                        {row.map((cell, j) => (
                          <td key={j} className={cn("px-3 py-1.5 font-body-sm text-body-sm whitespace-nowrap", rowTones[cell.tone ?? "neutral"])}>
                            {cell.text}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3">
            <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-2">Recent activity</h3>
            <ActivityTimeline items={timeline} emptyIcon="event_available" emptyLabel="No recent activity" />
          </section>

          {actions.length > 0 && (
            <section className="rounded-lg bg-surface-container-lowest border border-outline-variant p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {actions.map((action) => (
                  <Link
                    key={action.to + action.label}
                    to={action.to}
                    className="flex items-center gap-1.5 rounded-md px-2 py-2 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary shrink-0">{action.icon}</span>
                    <span className="truncate">{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </aside>
  )
}

function AvatarDot({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-label-md font-bold">
        {initials}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest bg-success" aria-hidden />
    </div>
  )
}