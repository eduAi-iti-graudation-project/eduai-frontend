import { Link, useParams } from "react-router-dom"
import { useQuiz, useAttemptsByQuiz } from "@/hooks/use-quizzes"

export function QuizAttemptsListPage() {
  const { id } = useParams<{ id: string }>()
  const quiz = useQuiz(id ?? "")
  const attempts = useAttemptsByQuiz(id ?? "")

  const maxPoints = (quiz.data?.questions ?? []).reduce((sum, q) => sum + q.points, 0)

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : "—"

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <Link to="/quizzes" className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quizzes
          </Link>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Attempts</h1>
            {quiz.data && (
              <p className="font-label-sm text-label-sm text-on-surface-variant">{quiz.data.title}</p>
            )}
          </div>
        </div>
        {quiz.data && (
          <Link
            to={`/quizzes/${quiz.data.id}`}
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md nudge-hover"
          >
            View quiz
          </Link>
        )}
      </header>

      <div className="flex-1 p-md">
        {attempts.isLoading ? (
          <div className="text-center py-xl">
            <p className="font-body-md text-body-md text-on-surface-variant">Loading attempts…</p>
          </div>
        ) : attempts.isError ? (
          <div className="text-center py-xl">
            <span className="material-symbols-outlined text-[48px] text-error mb-md block">error_outline</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load attempts</h2>
            <button
              onClick={() => attempts.refetch()}
              className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
            >
              Try Again
            </button>
          </div>
        ) : (attempts.data ?? []).length === 0 ? (
          <div className="text-center py-xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">how_to_reg</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">No attempts yet</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              When students take this quiz, their attempts will appear here for review.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-[24px] border border-outline-variant/10 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 font-label-sm text-label-sm text-on-surface-variant">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {(attempts.data ?? []).map((attempt) => {
                  const violations = (attempt.violations ?? []).length
                  return (
                    <tr key={attempt.id} className="border-b border-outline-variant/10 last:border-0">
                      <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                        {attempt.student?.name ?? "Student"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${
                            attempt.status === "COMPLETED"
                              ? "bg-primary-fixed text-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {attempt.status === "COMPLETED" ? "Submitted" : "In progress"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                        {attempt.totalScore != null
                          ? `${attempt.totalScore} / ${maxPoints}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
                        {formatDate(attempt.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {violations > 0 && (
                            <span className="bg-error/10 text-error font-label-sm text-label-sm px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              {violations}
                            </span>
                          )}
                          <Link
                            to={`/quizzes/attempts/${attempt.id}`}
                            className="bg-primary text-white px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Review
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
