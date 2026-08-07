import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const iconOptions = [
  { icon: "functions", bg: "bg-surface-container", color: "text-primary-container" },
  { icon: "menu_book", bg: "bg-secondary-fixed", color: "text-secondary" },
  { icon: "biotech", bg: "bg-surface-container-high", color: "text-primary" },
  { icon: "history_edu", bg: "bg-surface-container", color: "text-primary-container" },
  { icon: "language", bg: "bg-secondary-fixed", color: "text-secondary" },
  { icon: "palette", bg: "bg-surface-container-high", color: "text-primary" },
]

export function ClassesInGradePage() {
  const { gradeId } = useParams<{ gradeId: string }>()

  const { data: classes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["grade-classes", gradeId],
    queryFn: () => api.getGradeClasses(gradeId!),
    enabled: !!gradeId,
  })

  if (isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error instanceof Error ? error.message : "Failed to load classes"}
        onRetry={() => refetch()}
        className="flex-1"
      />
    )
  }

  if (isLoading) {
    return (
      <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
    )
  }

  const list = classes ?? []

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/grades" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Classes</h1>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="class"
          title="No classes in this grade"
          description="There are no classes assigned to this grade yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
          {list.map((c, index) => {
            const icon = iconOptions[index % iconOptions.length]
            return (
              <Link
                key={c.id}
                to={`/classes/${c.id}`}
                className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${icon.bg} ${icon.color}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">{c.name}</h3>
                </div>
                {c.description && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-3">{c.description}</p>
                )}
                <div className="flex items-center justify-between border-t border-outline-variant pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {getInitials(c.name)}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(c as any).enrollments?.length ?? 0} students
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
