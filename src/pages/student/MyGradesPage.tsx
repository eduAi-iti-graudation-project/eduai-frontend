import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

export function MyGradesPage() {
  const { user } = useAuth()

  const { data: grades, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: () => api.getStudentGrades(user!.id),
    enabled: !!user?.id,
  })

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load grades</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <button onClick={() => refetch()} className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const confirmedGrades = (grades ?? []).filter((g) => g.isConfirmed)
  const gradesBySubmission = new Map<string, NonNullable<typeof grades>>()
  for (const g of confirmedGrades) {
    const key = g.submissionId
    const list = gradesBySubmission.get(key) ?? []
    list.push(g)
    gradesBySubmission.set(key, list)
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <h1 className="font-headline-lg text-headline-lg text-primary">My Grades</h1>
      </header>

      <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                <div className="h-5 w-64 bg-surface-container-high rounded-full mb-2" />
                <div className="h-4 w-32 bg-surface-container-high rounded-full" />
              </div>
            ))}
          </div>
        ) : !grades || grades.length === 0 ? (
          <EmptyState
            icon="grade"
            title="No grades yet"
            description="Your grades will appear here once teachers confirm them."
          />
        ) : (
          <div className="space-y-3">
            {Array.from(gradesBySubmission.entries()).map(([submissionId, submissionGrades]) => {
              const totalEarned = submissionGrades.reduce((s, g) => s + g.pointsAwarded, 0)
              return (
                <div key={submissionId} className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-label-md text-label-md text-on-surface">Submission</p>
                    <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">
                      {totalEarned} pts
                    </span>
                  </div>
                  <div className="space-y-2">
                    {submissionGrades.map((g) => (
                      <div key={g.id} className="rounded-3xl bg-surface-container-low p-md border border-outline-variant/10">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Criterion</p>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold">+{g.pointsAwarded}</span>
                        </div>
                        {g.aiFeedback && (
                          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{g.aiFeedback}</p>
                        )}
                        {g.teacherNotes && (
                          <div className="mt-2 pt-2 border-t border-outline-variant/10">
                            <p className="font-label-sm text-label-sm text-primary mb-1">Teacher Notes</p>
                            <p className="font-body-md text-body-md text-on-surface">{g.teacherNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
