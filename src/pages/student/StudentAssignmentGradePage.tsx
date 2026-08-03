import { useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"

export function StudentAssignmentGradePage() {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>()
  const { user } = useAuth()

  const { data: studentClasses } = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const cls = studentClasses?.find((c) => c.id === classId)
  const assignment = cls?.assignments.find((a) => a.id === assignmentId)

  const { data: grades, isLoading } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: () => api.getStudentGrades(user!.id),
    enabled: !!user?.id,
  })

  const confirmedGrades = useMemo(
    () => (grades ?? []).filter((g) => g.isConfirmed && g.assignmentId === assignmentId),
    [grades, assignmentId],
  )

  const needsFeedback = useMemo(
    () => confirmedGrades.some((g) => !g.aiFeedback),
    [confirmedGrades],
  )

  const firstSubmissionId = useMemo(
    () => confirmedGrades.find((g) => !g.aiFeedback)?.submissionId,
    [confirmedGrades],
  )

  const { data: polledGrades } = useQuery({
    queryKey: ["student-submission-grades", user?.id, firstSubmissionId],
    queryFn: () => api.getStudentSubmissionGrades(user!.id, firstSubmissionId!),
    enabled: !!user?.id && !!firstSubmissionId,
    refetchInterval: needsFeedback ? 5_000 : false,
  })

  const mergedGrades = useMemo(() => {
    if (!polledGrades) return confirmedGrades
    return confirmedGrades.map((g) => {
      const polled = polledGrades.find((p) => p.id === g.id)
      return polled ?? g
    })
  }, [confirmedGrades, polledGrades])

  const totalEarned = mergedGrades.reduce((s, g) => s + g.pointsAwarded, 0)
  const totalPossible = mergedGrades.reduce((s, g) => s + g.criterionMaxPoints, 0)

  if (isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <LoadingState />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <EmptyState icon="assignment" title="Assignment not found" description="This assignment doesn't exist in this class." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/student/classes/${classId}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">{assignment.title}</h1>
      </div>

      {assignment.description && (
        <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm mb-6">
          <p className="font-body-md text-body-md text-on-surface-variant">{assignment.description}</p>
        </div>
      )}

      {mergedGrades.length === 0 ? (
        <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm text-center py-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">rate_review</span>
          <p className="font-label-md text-label-md text-on-surface-variant">No grades confirmed yet for this assignment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Results</h2>
              <div className="text-right">
                <p className="font-headline-lg text-headline-lg text-primary">
                  {totalEarned}
                  <span className="font-body-md text-body-md text-on-surface-variant">/{totalPossible}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {mergedGrades.map((g) => (
                <div
                  key={g.id}
                  className="rounded-3xl bg-surface-container-low p-md border border-outline-variant/10"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <p className="font-label-md text-label-md text-on-surface">{g.criterionDescription}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {g.pointsAwarded}/{g.criterionMaxPoints} points
                      </p>
                    </div>
                    {g.criterionMaxPoints > 0 && (
                      <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full border-0 shrink-0">
                        {Math.round((g.pointsAwarded / g.criterionMaxPoints) * 100)}%
                      </Badge>
                    )}
                  </div>
                  {g.aiFeedback ? (
                    <div className="mt-2 pt-2 border-t border-outline-variant/10">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">AI Feedback</p>
                      <p className="font-body-md text-body-md text-on-surface">{g.aiFeedback}</p>
                    </div>
                  ) : needsFeedback ? (
                    <div className="mt-2 pt-2 border-t border-outline-variant/10 flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] animate-spin">sync</span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Generating feedback...</p>
                    </div>
                  ) : null}
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
        </div>
      )}
    </div>
  )
}
