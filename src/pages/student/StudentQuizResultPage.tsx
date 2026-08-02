import { Link, useParams } from "react-router-dom"
import { useStudentQuizList, useAttempt, useQuiz } from "@/hooks/use-quizzes"

export function StudentQuizResultPage() {
  const { id: quizId } = useParams<{ id: string }>()
  const quizList = useStudentQuizList()
  const quiz = useQuiz(quizId ?? "")

  const attemptId = quizList.data?.find((q) => q.id === quizId)?.attemptId
  const attemptStatus = quizList.data?.find((q) => q.id === quizId)?.attemptStatus
  const attempt = useAttempt(attemptId ?? "")

  if (attemptStatus === "IN_PROGRESS") {
    return (
      <div className="flex-1 p-xl max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">play_arrow</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Quiz still in progress</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          You haven&apos;t submitted this quiz yet. Head back to continue where you left off.
        </p>
        <Link
          to={`/student/quizzes/${quizId}/take`}
          className="bg-primary text-white px-lg py-sm rounded-full font-label-md hover:opacity-90 transition-all"
        >
          Resume quiz
        </Link>
      </div>
    )
  }

  const detail = attempt.data
  const questions = quiz.data ? [...(quiz.data.questions ?? [])].sort((a, b) => a.order - b.order) : []
  const maxPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const unconfirmedCount = (detail?.answers ?? []).filter((a) => !a.isConfirmed).length
  const violations = detail?.violations?.length ?? 0

  return (
    <div className="flex-1 p-xl max-w-2xl mx-auto w-full">
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Quiz result</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{quiz.data?.title ?? "Quiz"}</p>
      </header>

      {!detail ? (
        <div className="text-center py-xl">
          <p className="font-body-md text-body-md text-on-surface-variant">Loading result…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="tactile-card rounded-[24px] bg-surface-container-lowest p-xl text-center">
            <p className="font-label-md text-label-md text-on-surface-variant mb-2">Your score</p>
            <p className="font-headline-xl text-headline-xl text-primary">
              {detail.totalScore != null ? `${detail.totalScore} / ${maxPoints}` : "Being graded"}
            </p>
            {detail.totalScore == null && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                Your teacher is still reviewing your open-ended answers.
              </p>
            )}
          </div>

          {unconfirmedCount > 0 && (
            <div className="rounded-[24px] bg-primary-fixed/20 border border-primary/20 p-md flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">hourglass_top</span>
              <p className="font-body-md text-body-md text-on-surface">
                {unconfirmedCount} open-ended answer{unconfirmedCount > 1 ? "s" : ""} are being reviewed by
                your teacher. The score above may change once they&apos;re confirmed.
              </p>
            </div>
          )}

          {violations > 0 && (
            <div className="rounded-[24px] bg-surface-container-low p-md flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">info</span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Leaving the quiz screen was recorded during your attempt — your teacher can see it.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {questions.map((question, index) => {
              const answer = detail.answers?.find((a) => a.questionId === question.id)
              const confirmed = answer?.isConfirmed ?? false
              return (
                <div key={question.id} className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Q{index + 1}</span>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0">
                        {question.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                      {confirmed
                        ? `${answer?.pointsAwarded ?? 0} / ${question.points} pts`
                        : "Being reviewed"}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">{question.question}</p>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center pt-md">
            <Link
              to="/student/homework-help"
              className="bg-primary-fixed text-primary px-lg py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Need help on this topic? Ask the Homework Helper
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
