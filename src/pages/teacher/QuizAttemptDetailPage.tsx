import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useAttempt, useConfirmAttempt, useUpdateAnswer } from "@/hooks/use-quizzes"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const VIOLATION_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab switch",
  FULLSCREEN_EXIT: "Left fullscreen",
}

export function QuizAttemptDetailPage() {
  const { id: attemptId } = useParams<{ id: string }>()
  const attempt = useAttempt(attemptId ?? "")
  const confirmAttempt = useConfirmAttempt(attemptId ?? "")
  const updateAnswer = useUpdateAnswer()

  const [draftPoints, setDraftPoints] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [violationsOpen, setViolationsOpen] = useState(false)

  const detail = attempt.data
  const quiz = detail?.quiz
  const questions = quiz ? [...(quiz.questions ?? [])].sort((a, b) => a.order - b.order) : []
  const maxPoints = questions.reduce((sum, q) => sum + q.points, 0)

  const answersSnapshot = (detail?.answers ?? [])
    .map((a) => `${a.id}:${a.pointsAwarded ?? ""}`)
    .join("|")
  const [hydratedSnapshot, setHydratedSnapshot] = useState("")
  if (answersSnapshot !== hydratedSnapshot) {
    setHydratedSnapshot(answersSnapshot)
    const next: Record<string, string> = {}
    for (const answer of detail?.answers ?? []) {
      next[answer.id] = answer.pointsAwarded != null ? String(answer.pointsAwarded) : ""
    }
    setDraftPoints(next)
  }

  const answerFor = (questionId: string) => detail?.answers?.find((a) => a.questionId === questionId)
  const allConfirmed = (detail?.answers ?? []).length > 0 && (detail?.answers ?? []).every((a) => a.isConfirmed)
  const unconfirmedCount = (detail?.answers ?? []).filter((a) => !a.isConfirmed).length

  const optionState = (questionId: string, optionText: string) => {
    const answer = answerFor(questionId)
    if (!answer) return null
    return {
      isStudentPick: answer.answer === optionText,
      answered: answer.answer !== "",
    }
  }

  const savePoints = (answerId: string) => {
    const value = Number(draftPoints[answerId])
    if (Number.isNaN(value) || value < 0) return
    updateAnswer.mutate({ answerId, pointsAwarded: value })
  }

  if (!detail) {
    return (
      <LoadingState className="flex-1 p-md" />
    )
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <Link to={`/quizzes/${quiz?.id}/attempts`} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Attempts
          </Link>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">{detail.student?.name ?? "Student"}</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{quiz?.title}</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={allConfirmed}
          className="bg-primary text-white px-md h-auto py-sm rounded-full font-label-md disabled:opacity-50 nudge-hover"
        >
          {allConfirmed ? "Confirmed" : `Confirm ${unconfirmedCount > 0 ? `${unconfirmedCount} answer${unconfirmedCount > 1 ? "s" : ""}` : "all"}`}
        </Button>
      </header>

      <div className="flex-1 p-md overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="tactile-card rounded-[24px] bg-surface-container-lowest p-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline-md text-headline-md text-primary">
                {detail.totalScore != null ? `${detail.totalScore} / ${maxPoints}` : "Not scored yet"}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {detail.submittedAt ? `Submitted ${new Date(detail.submittedAt).toLocaleString()}` : "In progress"}
              </span>
            </div>
            {unconfirmedCount > 0 && (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {unconfirmedCount} answer{unconfirmedCount > 1 ? "s" : ""} still being reviewed — students can&apos;t see these scores until you confirm.
              </p>
            )}
          </div>

          {(detail.violations ?? []).length > 0 && (
            <div className="tactile-card rounded-[24px] bg-surface-container-lowest p-md">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setViolationsOpen((v) => !v)}
                className="w-full h-auto p-0 flex items-center justify-between font-label-md text-label-md text-error hover:text-error hover:bg-transparent"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {(detail.violations ?? []).length} violation{(detail.violations ?? []).length > 1 ? "s" : ""} detected
                </span>
                <span className="material-symbols-outlined text-[18px] transition-transform" style={{ transform: violationsOpen ? "rotate(180deg)" : undefined }}>
                  expand_more
                </span>
              </Button>
              {violationsOpen && (
                <ul className="mt-3 space-y-1">
                  {(detail.violations ?? []).map((v) => (
                    <li key={v.id} className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{VIOLATION_LABELS[v.type] ?? v.type}</span>
                      <span>{new Date(v.createdAt).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {questions.map((question, index) => {
            const answer = answerFor(question.id)
            const isConfirmed = answer?.isConfirmed ?? false
            return (
              <div key={question.id} className="tactile-card rounded-[24px] bg-surface-container-lowest p-md">
                <div className="flex items-start justify-between gap-3 mb-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Q{index + 1}</span>
                    <Badge
                      variant="outline"
                      className="border-transparent font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-high text-on-surface-variant shrink-0"
                    >
                      {question.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    {!isConfirmed && answer && (
                      <Badge
                        variant="outline"
                        className="border-transparent font-label-sm text-label-sm px-2 py-0.5 bg-primary-fixed text-primary shrink-0 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        AI suggestion
                      </Badge>
                    )}
                    {isConfirmed && (
                      <Badge
                        variant="outline"
                        className="border-transparent font-label-sm text-label-sm px-2 py-0.5 bg-primary text-white shrink-0"
                      >
                        Confirmed
                      </Badge>
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">{question.points} pts</span>
                </div>

                <p className="font-body-lg text-body-lg text-on-surface mb-md">{question.question}</p>

                {question.type === "MCQ" || question.type === "TRUE_FALSE" ? (
                  <div className="space-y-2">
                    {(question.options ?? []).map((option) => {
                      const state = optionState(question.id, option.text)
                      const isStudentPick = state?.isStudentPick ?? false
                      const isCorrectOption = option.isCorrect
                      const showCorrect = isConfirmed || isCorrectOption === isStudentPick
                      return (
                        <div
                          key={option.text}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                            isCorrectOption && showCorrect
                              ? "border-primary bg-primary-fixed/30"
                              : isStudentPick
                                ? "border-error bg-error/10"
                                : "border-outline-variant bg-surface"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              isCorrectOption && showCorrect
                                ? "text-primary"
                                : isStudentPick
                                  ? "text-error"
                                  : "text-on-surface-variant"
                            }`}
                          >
                            {isCorrectOption && showCorrect ? "check_circle" : isStudentPick ? "cancel" : "radio_button_unchecked"}
                          </span>
                          <span className="font-body-md text-body-md text-on-surface flex-1">{option.text}</span>
                          {isStudentPick && (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">student&apos;s pick</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                        Student&apos;s answer{answer?.answer ? "" : " — no answer"}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                        {answer?.answer || "—"}
                      </p>
                    </div>
                    {answer?.aiFeedback && (
                      <div className="rounded-xl border border-primary/20 bg-primary-fixed/20 p-3">
                        <p className="font-label-sm text-label-sm text-primary mb-1 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                          AI feedback
                        </p>
                        <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{answer.aiFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 justify-end">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">
                    Points
                    <Input
                      type="number"
                      min={0}
                      value={draftPoints[answer?.id ?? ""] ?? ""}
                      onChange={(e) => setDraftPoints((prev) => ({ ...prev, [answer?.id ?? ""]: e.target.value }))}
                      className="ml-2 w-20 h-auto rounded-xl border border-outline-variant bg-surface px-2 py-1.5 text-sm text-on-surface form-input-focus"
                    />
                  </label>
                  <Button
                    type="button"
                    onClick={() => answer && savePoints(answer.id)}
                    disabled={!answer || updateAnswer.isPending}
                    className="bg-secondary-container text-white px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm disabled:opacity-50 nudge-hover"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm all grades?"
        message={
          unconfirmedCount > 0
            ? `This makes ${unconfirmedCount} AI-suggested score${unconfirmedCount > 1 ? "s" : ""} final and visible to the student. You can't change them afterwards.`
            : "All scores are already confirmed."
        }
        confirmLabel="Confirm"
        isLoading={confirmAttempt.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirmAttempt.mutate(undefined, { onSettled: () => setConfirmOpen(false) })
        }}
      />
    </>
  )
}
