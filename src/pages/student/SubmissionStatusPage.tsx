import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useSubmissionDetail } from "@/hooks/use-submissions"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { BackLink } from "@/components/shared/BackLink"

type ScoreLike = { criterion?: { description?: string; maxPoints?: number } }

export function SubmissionStatusPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: submission, isLoading, isError, error } = useSubmissionDetail(id ?? "")
  const needsPolling = submission?.status === "CONFIRMED" && (submission.scores?.some((s) => !s.aiFeedback) ?? false)
  const { data: polledSubmission } = useQuery({
    queryKey: ["submission", id, "poll"],
    queryFn: () => api.getSubmission(id!),
    enabled: needsPolling,
    refetchInterval: 10_000,
  })
  const submissionData = polledSubmission ?? submission

  const { data: courses } = useQuery({
    queryKey: ["student", "courses", user?.id],
    queryFn: () => api.getStudentCourses(user!.id),
    enabled: !!user?.id && !!submissionData?.assignmentId,
  })
  const courseId = courses?.find((c) =>
    c.assignments.some((a) => a.id === submissionData?.assignmentId),
  )?.id

  const backTo = courseId ? `/student/classes/${courseId}` : "/student/classes"

  if (isLoading && !submissionData) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <LoadingState />
      </div>
    )
  }

  if (isError || !submissionData) {
    return (
      <div className="flex items-center justify-center h-full p-margin-desktop">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load submission</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {error instanceof Error ? error.message : "Submission not found"}
          </p>
          <Link to={backTo} className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md">
            Back to course
          </Link>
        </div>
      </div>
    )
  }

  const status = submissionData.status
  const isConfirmed = status === "CONFIRMED"

  const confirmedScores = (submissionData.scores ?? []).filter((s) => s.isConfirmed)
  const confirmedTotal = confirmedScores.reduce((sum, s) => sum + s.pointsAwarded, 0)
  const confirmedMax = confirmedScores.reduce((sum, s) => sum + ((s as ScoreLike).criterion?.maxPoints ?? 0), 0)

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BackLink to={backTo} label={courseId ? "Back to Class" : "Back to Classes"} />
          <h1 className="font-headline-lg text-headline-lg text-primary">Submission Status</h1>
        </div>
        <StatusBadge status={status} />
      </div>
        {submissionData.assignment && (
          <div className="rounded-lg bg-white p-md border border-border mb-6">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">{submissionData.assignment.title}</h2>
            {submissionData.assignment.description && (
              <p className="font-body-md text-body-md text-on-surface-variant">{submissionData.assignment.description}</p>
            )}
          </div>
        )}

        {status === "SUBMITTED" || status === "GRADING_IN_PROGRESS" ? (
          <div className="rounded-lg bg-white p-md border border-border text-center">
            <div className="w-16 h-16 rounded-lg bg-primary-fixed/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Your submission is being reviewed</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {status === "SUBMITTED"
                ? "Your work has been submitted successfully. The AI is reviewing your submission."
                : "Grading is in progress. Results will be available once complete."}
            </p>
          </div>
        ) : status === "REVIEW_READY" ? (
          <div className="rounded-lg bg-white p-md border border-border text-center">
            <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-accent-foreground text-3xl">rate_review</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Awaiting teacher confirmation</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              The AI has completed grading. Your teacher will review and confirm the results.
            </p>
          </div>
        ) : isConfirmed && submissionData.scores ? (
          <div className="space-y-4">
            {/* Hard rule: Only confirmed grades are shown — unconfirmed scores are never visible to students */}
            <div className="rounded-lg bg-white p-md border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-md text-headline-md text-primary">Results</h2>
                <div className="text-right">
                  <p className="font-headline-lg text-headline-lg text-primary">
                    {confirmedTotal}
                    {confirmedMax > 0 && (
                      <span className="font-body-md text-body-md text-on-surface-variant">
                        /{confirmedMax}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {confirmedScores.map((score) => {
                  const maxPoints = (score as ScoreLike).criterion?.maxPoints ?? 0
                  const description = (score as ScoreLike).criterion?.description ?? "Criteria"
                  const hasMax = maxPoints > 0
                  return (
                  <div key={score.id} className="rounded-lg bg-surface-container-low p-md border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-label-md text-label-md text-on-surface">{description}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {hasMax ? `${score.pointsAwarded}/${maxPoints} points` : `${score.pointsAwarded} pts`}
                        </p>
                      </div>
                      {hasMax && (
                        <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 shrink-0">
                          {Math.round((score.pointsAwarded / maxPoints) * 100)}%
                        </Badge>
                      )}
                    </div>
                    {score.aiFeedback && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">AI Feedback</p>
                        <p className="font-body-md text-body-md text-on-surface">{score.aiFeedback}</p>
                      </div>
                    )}
                    {score.teacherNotes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Teacher Notes</p>
                        <p className="font-body-md text-body-md text-on-surface">{score.teacherNotes}</p>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
  )
}
