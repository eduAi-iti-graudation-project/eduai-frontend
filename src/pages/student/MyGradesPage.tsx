import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"

export function MyGradesPage() {
  const { user } = useAuth()

  const { data: studentClasses, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  if (isError) {
    return (
      <ErrorState
        title="Failed to load grades"
        message={error instanceof Error ? error.message : "Something went wrong"}
        onRetry={() => refetch()}
      />
    )
  }

  const classes = studentClasses ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Grades</h1>
      {isLoading ? (
        <LoadingState />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="grade"
          title="No grades yet"
          description="Your grades will appear here once teachers confirm them."
        />
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              to={`/student/classes/${cls.id}`}
              className="block rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-label-md text-label-md text-on-surface">{cls.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {cls.teacherName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">assignment</span>
                      {cls.assignments.length} {cls.assignments.length === 1 ? "assignment" : "assignments"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
