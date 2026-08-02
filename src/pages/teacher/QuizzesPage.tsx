import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useClasses } from "@/hooks/use-classes"
import { useQuizList, useGenerateQuiz, useDeleteQuiz, usePublishQuiz } from "@/hooks/use-quizzes"
import { useUpdateQuiz } from "@/hooks/use-quizzes"
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import type { QuizDto, QuizQuestionType } from "@/lib/api"

const TYPE_LABELS: Record<QuizQuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
}

export function QuizzesPage() {
  const navigate = useNavigate()
  const [classFilter, setClassFilter] = useState("")
  const { classes } = useClasses()
  const quizzes = useQuizList(classFilter || undefined)
  const generateQuiz = useGenerateQuiz()
  const deleteQuiz = useDeleteQuiz()
  const publishQuiz = usePublishQuiz()
  const updateQuiz = useUpdateQuiz()

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [genClassId, setGenClassId] = useState("")
  const [genTopic, setGenTopic] = useState("")
  const [genCount, setGenCount] = useState(10)
  const [genTypes, setGenTypes] = useState<QuizQuestionType[]>(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"])

  const [deleteTarget, setDeleteTarget] = useState<QuizDto | null>(null)
  const [closeTarget, setCloseTarget] = useState<QuizDto | null>(null)
  const [publishTarget, setPublishTarget] = useState<QuizDto | null>(null)

  const toggleType = (type: QuizQuestionType) => {
    setGenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const runGenerate = () => {
    if (!genClassId || !genTopic.trim()) return
    generateQuiz.mutate(
      { classId: genClassId, topic: genTopic.trim(), questionCount: genCount, types: genTypes },
      {
        onSuccess: (result) => {
          setGeneratorOpen(false)
          setGenTopic("")
          navigate(`/quizzes/${result.quizId}`)
        },
      },
    )
  }

  const typeIcon: Record<QuizQuestionType, string> = {
    MCQ: "check_circle",
    TRUE_FALSE: "toggle_on",
    SHORT_ANSWER: "short_text",
    ESSAY: "notes",
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <h1 className="font-headline-lg text-headline-lg text-primary">Quizzes</h1>
        <div className="flex items-center gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setGenClassId(classFilter || classes.data?.[0]?.id || "")
              setGeneratorOpen(true)
            }}
            className="bg-primary text-white px-md py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI Generate
          </button>
          <Link
            to="/quizzes/new"
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Quiz
          </Link>
        </div>
      </header>

      <div className="flex-1 p-md">
        {quizzes.isLoading ? (
          <div className="space-y-3 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="tactile-card rounded-[24px] bg-surface-container-lowest p-4 animate-pulse">
                <div className="h-6 w-40 bg-surface-container-high rounded-full mb-3" />
                <div className="h-4 w-64 bg-surface-container-high rounded-full" />
              </div>
            ))}
          </div>
        ) : quizzes.isError ? (
          <div className="text-center py-xl">
            <span className="material-symbols-outlined text-[48px] text-error mb-md block">error_outline</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load quizzes</h2>
            <button
              onClick={() => quizzes.refetch()}
              className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
            >
              Try Again
            </button>
          </div>
        ) : (quizzes.data ?? []).length === 0 ? (
          <div className="text-center py-xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">quiz</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">No quizzes yet</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">
              Write one from scratch or let AI draft it for you.
            </p>
            <div className="flex gap-md justify-center">
              <Link
                to="/quizzes/new"
                className="bg-primary text-white px-md py-sm rounded-full font-label-md hover:opacity-90 transition-all"
              >
                Create a quiz
              </Link>
              <button
                onClick={() => setGeneratorOpen(true)}
                className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md hover:opacity-90 transition-all"
              >
                Generate with AI
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {(quizzes.data ?? []).map((quiz) => {
              const totalPoints = (quiz.questions ?? []).reduce((sum, q) => sum + q.points, 0)
              return (
                <div key={quiz.id} className="tactile-card rounded-[24px] bg-surface-container-lowest p-4">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/quizzes/${quiz.id}`} className="flex-1 min-w-0 group">
                      <div className="flex items-center gap-2 mb-1">
                        <QuizStatusBadge status={quiz.status} />
                        {quiz.questions && (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {quiz.questions.length} questions · {totalPoints} pts
                          </span>
                        )}
                        {quiz.timeLimit != null && (
                          <span className="font-label-sm text-label-sm text-on-surface-variant inline-flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {quiz.timeLimit} min
                          </span>
                        )}
                        {quiz.endsAt != null && (
                          <span className="font-label-sm text-label-sm text-on-surface-variant inline-flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Closes{" "}
                            {new Date(quiz.endsAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h2>
                      {quiz.description && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                        {(classes.data ?? []).find((c) => c.id === quiz.classId)?.name ?? "Class"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {quiz.status === "DRAFT" && (
                        <>
                          <Link
                            to={`/quizzes/${quiz.id}`}
                            className="bg-primary text-white px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setPublishTarget(quiz)}
                            className="bg-primary-fixed text-primary px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => setDeleteTarget(quiz)}
                            className="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {quiz.status === "PUBLISHED" && (
                        <>
                          <Link
                            to={`/quizzes/${quiz.id}/attempts`}
                            className="bg-primary-fixed text-primary px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            View attempts
                          </Link>
                          <button
                            onClick={() => setCloseTarget(quiz)}
                            className="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {quiz.status === "CLOSED" && (
                        <>
                          <Link
                            to={`/quizzes/${quiz.id}/attempts`}
                            className="bg-primary-fixed text-primary px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            View attempts
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(quiz)}
                            className="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {generatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !generateQuiz.isPending && setGeneratorOpen(false)}>
          <div
            className="bg-white rounded-[32px] p-xl shadow-xl max-w-2xl w-full mx-md border border-outline-variant/10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-[28px] text-primary">auto_awesome</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Generate quiz with AI</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  The AI drafts a full quiz you can review before publishing.
                </p>
              </div>
            </div>

            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Class</label>
            <select
              value={genClassId}
              onChange={(e) => setGenClassId(e.target.value)}
              className="w-full form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface mb-md"
            >
              <option value="">Select a class</option>
              {(classes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Topic</label>
            <input
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, World War II, Fractions…"
              className="w-full form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface mb-md"
            />

            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Questions ({genCount})
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="w-full mb-md accent-[#006951]"
            />

            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Question types</label>
            <div className="grid grid-cols-2 gap-2 mb-lg">
              {(Object.keys(TYPE_LABELS) as QuizQuestionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-label-md transition-all ${
                    genTypes.includes(type)
                      ? "border-primary bg-primary-fixed text-primary"
                      : "border-outline-variant bg-surface text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{typeIcon[type]}</span>
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <div className="flex gap-md">
              <button
                type="button"
                onClick={() => setGeneratorOpen(false)}
                disabled={generateQuiz.isPending}
                className="flex-1 py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runGenerate}
                disabled={generateQuiz.isPending || !genClassId || !genTopic.trim() || genTypes.length === 0}
                className="flex-1 py-sm bg-primary text-white font-label-md text-label-md rounded-full disabled:opacity-50 active:scale-95 transition-all"
              >
                {generateQuiz.isPending ? "AI is writing your quiz…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!publishTarget}
        title="Publish this quiz?"
        message={`"${publishTarget?.title}" will be visible to students immediately. You won't be able to edit questions after publishing.`}
        confirmLabel="Publish"
        isLoading={publishQuiz.isPending}
        onCancel={() => setPublishTarget(null)}
        onConfirm={() => {
          if (publishTarget) {
            publishQuiz.mutate(publishTarget.id, {
              onSettled: () => setPublishTarget(null),
            })
          }
        }}
      />

      <ConfirmDialog
        open={!!closeTarget}
        title="Close this quiz?"
        message={`"${closeTarget?.title}" will be locked. Students who already submitted keep their results; no new attempts can start.`}
        confirmLabel="Close"
        variant="danger"
        onCancel={() => setCloseTarget(null)}
        onConfirm={() => {
          if (closeTarget) {
            updateQuiz.mutate(
              { id: closeTarget.id, data: { status: "CLOSED" } },
              { onSettled: () => setCloseTarget(null) },
            )
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this quiz?"
        message={`"${deleteTarget?.title}" and all of its attempts will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteQuiz.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteQuiz.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
          }
        }}
      />
    </>
  )
}
