import { useParams, Link } from "react-router-dom"
import { useSubmissionDetail } from "@/hooks/use-submissions"
import { StatusBadge } from "@/components/ui/StatusBadge"

export function SubmissionStatusPage() {
  const { id } = useParams<{ id: string }>()
  const { data: submission, isLoading, isError, error } = useSubmissionDetail(id ?? "")

  if (isLoading) {
    return (
      <div className="flex-1 p-xl max-w-3xl mx-auto w-full">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-surface-container-high rounded-full" />
          <div className="h-64 rounded-[32px] bg-white border border-outline-variant/10" />
        </div>
      </div>
    )
  }

  if (isError || !submission) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load submission</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {error instanceof Error ? error.message : "Submission not found"}
          </p>
          <Link to="/student/assignments" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Back to Assignments
          </Link>
        </div>
      </div>
    )
  }

  const status = submission.status
  const isConfirmed = status === "CONFIRMED"

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <Link to="/student/assignments" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-primary">Submission Status</h1>
        </div>
        <StatusBadge status={status} />
      </header>

      <div className="flex-1 p-xl max-w-3xl mx-auto w-full">
        {submission.assignment && (
          <div className="rounded-[32px] bg-white p-xl border border-outline-variant/10 shadow-sm mb-6">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">{submission.assignment.title}</h2>
            {submission.assignment.description && (
              <p className="font-body-md text-body-md text-on-surface-variant">{submission.assignment.description}</p>
            )}
          </div>
        )}

        {status === "SUBMITTED" || status === "GRADING_IN_PROGRESS" ? (
          <div className="rounded-[32px] bg-white p-xl border border-outline-variant/10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed/20 flex items-center justify-center mx-auto mb-4">
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
          <div className="rounded-[32px] bg-white p-xl border border-outline-variant/10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-tertiary-fixed text-3xl">rate_review</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Awaiting teacher confirmation</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              The AI has completed grading. Your teacher will review and confirm the results.
            </p>
          </div>
        ) : isConfirmed && submission.scores ? (
          <div className="space-y-4">
            {/* Hard rule: Only confirmed grades are shown — unconfirmed scores are never visible to students */}
            <div className="rounded-[32px] bg-white p-xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-md text-headline-md text-primary">Results</h2>
                <div className="text-right">
                  <p className="font-headline-lg text-headline-lg text-primary">
                    {submission.scores.filter(s => s.isConfirmed).reduce((sum, s) => sum + s.pointsAwarded, 0)}
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      /{submission.scores.filter(s => s.isConfirmed).reduce((sum, s) => sum + s.criterion.maxPoints, 0)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {submission.scores.filter(s => s.isConfirmed).map((score) => (
                  <div key={score.id} className="rounded-3xl bg-surface-container-low p-md border border-outline-variant/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-label-md text-label-md text-on-surface">{score.criterion.description}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {score.pointsAwarded}/{score.criterion.maxPoints} points
                        </p>
                      </div>
                      <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full shrink-0">
                        {Math.round((score.pointsAwarded / score.criterion.maxPoints) * 100)}%
                      </span>
                    </div>
                    {score.aiFeedback && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/10">
                        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">AI Feedback</p>
                        <p className="font-body-md text-body-md text-on-surface">{score.aiFeedback}</p>
                      </div>
                    )}
                    {score.teacherNotes && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/10">
                        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Teacher Notes</p>
                        <p className="font-body-md text-body-md text-on-surface">{score.teacherNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
