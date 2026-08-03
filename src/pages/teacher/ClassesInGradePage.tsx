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
        <Link to="/grades" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">Classes</h1>
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
                className="block rounded-[32px] bg-white p-xl shadow-sm border border-outline-variant/10 hover:border-primary-container/30 hover:shadow-md transition-all hover:scale-[1.02] group"
              >
                <div className={`w-12 h-12 rounded-2xl ${icon.bg} flex items-center justify-center mb-4 ${icon.color}`}>
                  <span className="material-symbols-outlined">{icon.icon}</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-1">{c.name}</h3>
                {c.description && (
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] font-bold">
                    {getInitials(c.name)}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(c as any).enrollments?.length ?? 0} students
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
