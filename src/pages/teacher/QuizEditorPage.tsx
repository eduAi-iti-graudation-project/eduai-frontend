import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useQuiz, useCreateQuiz, useUpdateQuiz, usePublishQuiz } from "@/hooks/use-quizzes"
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge"
import { QuizTargetPicker, type TargetOffering } from "@/components/quiz/QuizTargetPicker"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { BackLink } from "@/components/shared/BackLink"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QuizQuestionType, QuizStatus } from "@/lib/api"

interface EditorOption {
  localId: string
  id?: string
  text: string
  isCorrect: boolean
}

interface EditorQuestion {
  localId: string
  id?: string
  type: QuizQuestionType
  question: string
  points: number
  options: EditorOption[]
}

const TYPE_LABELS: Record<QuizQuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
}

const QUESTION_TYPES: QuizQuestionType[] = ["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]

let localSeq = 0
const newLocalId = () => `local-${Date.now()}-${localSeq++}`

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const makeQuestion = (type: QuizQuestionType): EditorQuestion => ({
  localId: newLocalId(),
  type,
  question: "",
  points: 1,
  options:
    type === "MCQ"
      ? [
          { localId: newLocalId(), text: "", isCorrect: false },
          { localId: newLocalId(), text: "", isCorrect: false },
          { localId: newLocalId(), text: "", isCorrect: false },
          { localId: newLocalId(), text: "", isCorrect: false },
        ]
      : type === "TRUE_FALSE"
        ? [
            { localId: newLocalId(), text: "True", isCorrect: false },
            { localId: newLocalId(), text: "False", isCorrect: false },
          ]
        : [],
})

const toEditorQuestion = (q: { id: string; type: QuizQuestionType; question: string; points: number; options?: { id?: string; text: string; isCorrect?: boolean }[] }): EditorQuestion => ({
  localId: newLocalId(),
  id: q.id,
  type: q.type,
  question: q.question,
  points: q.points,
  options: (q.options ?? []).map((o) => ({ localId: newLocalId(), id: o.id, text: o.text, isCorrect: o.isCorrect ?? false })),
})

export function QuizEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()

  const quiz = useQuiz(id ?? "")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targets, setTargets] = useState<TargetOffering[]>([])
  const [timeLimit, setTimeLimit] = useState("")
  const [passingScore, setPassingScore] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [questions, setQuestions] = useState<EditorQuestion[]>([])
  const [status, setStatus] = useState<QuizStatus>("DRAFT")

  const [publishOpen, setPublishOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const createQuiz = useCreateQuiz()
  const updateQuiz = useUpdateQuiz()
  const publishQuiz = usePublishQuiz()

  const [loadedQuizId, setLoadedQuizId] = useState<string | null>(null)
  if (id && quiz.data && loadedQuizId !== id) {
    const q = quiz.data
    setLoadedQuizId(id)
    setTitle(q.title)
    setDescription(q.description ?? "")
    setTargets(
      q.assignments.map((a) => ({
        courseOfferingId: a.courseOfferingId,
        targetStudentIds: a.targetStudentIds,
        gradeLevelId: a.gradeLevelId,
        gradeLevelName: a.gradeLevelName,
        courseId: a.courseId,
        courseName: a.courseName,
        sectionId: a.sectionId,
        sectionName: a.sectionName,
      })),
    )
    setTimeLimit(q.timeLimit != null ? String(q.timeLimit) : "")
    setPassingScore(q.passingScore != null ? String(q.passingScore) : "")
    setClosesAt(q.endsAt ? toLocalInputValue(q.endsAt) : "")
    setQuestions([...(q.questions ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(toEditorQuestion))
    setStatus(q.status)
  }

  const readOnly = !isNew && (status === "PUBLISHED" || status === "CLOSED")

  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions])

  const updateQuestion = (localId: string, patch: Partial<EditorQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)))
  }

  const updateOption = (questionLocalId: string, optionLocalId: string, patch: Partial<EditorOption>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === questionLocalId
          ? { ...q, options: q.options.map((o) => (o.localId === optionLocalId ? { ...o, ...patch } : o)) }
          : q,
      ),
    )
  }

  const setCorrectOption = (questionLocalId: string, optionLocalId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === questionLocalId
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.localId === optionLocalId })) }
          : q,
      ),
    )
  }

  const addOption = (questionLocalId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === questionLocalId
          ? { ...q, options: [...q.options, { localId: newLocalId(), text: "", isCorrect: false }] }
          : q,
      ),
    )
  }

  const removeOption = (questionLocalId: string, optionLocalId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === questionLocalId
          ? { ...q, options: q.options.filter((o) => o.localId !== optionLocalId) }
          : q,
      ),
    )
  }

  const changeType = (questionLocalId: string, type: QuizQuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.localId !== questionLocalId) return q
        const options =
          type === "MCQ"
            ? [
                { localId: newLocalId(), text: "", isCorrect: false },
                { localId: newLocalId(), text: "", isCorrect: false },
                { localId: newLocalId(), text: "", isCorrect: false },
                { localId: newLocalId(), text: "", isCorrect: false },
              ]
            : type === "TRUE_FALSE"
              ? [
                  { localId: newLocalId(), text: "True", isCorrect: false },
                  { localId: newLocalId(), text: "False", isCorrect: false },
                ]
              : []
        return { ...q, type, options }
      }),
    )
  }

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeQuestion = (localId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== localId))
  }

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim() || undefined,
    assignments: targets.map((t) => ({
      courseOfferingId: t.courseOfferingId,
      targetStudentIds: t.targetStudentIds.length > 0 ? t.targetStudentIds : undefined,
    })),
    timeLimit: timeLimit ? Math.max(1, Number(timeLimit)) : undefined,
    passingScore: passingScore ? Math.max(0, Number(passingScore)) : undefined,
    endsAt: closesAt ? new Date(closesAt).toISOString() : undefined,
    questions: questions.map((q, index) => ({
      id: q.id,
      type: q.type,
      question: q.question.trim(),
      options: q.type === "MCQ" || q.type === "TRUE_FALSE" ? q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })) : undefined,
      points: Math.max(1, q.points),
      order: index,
    })),
  })

  const closesAtError = !closesAt
    ? null
    : isNew && new Date(closesAt).getTime() <= new Date().getTime()
      ? "The closing time must be in the future."
      : null

  const canSave =
    title.trim().length > 0 &&
    targets.length > 0 &&
    closesAtError === null &&
    questions.length > 0 &&
    questions.every((q) => q.question.trim().length > 0)

  const save = (asPublish = false) => {
    if (!canSave) return
    setSaving(true)
    const done = () => setSaving(false)
    if (isNew) {
      createQuiz.mutate(buildPayload(), {
        onSuccess: (created) => {
          if (asPublish) {
            publishQuiz.mutate(created.id, { onSettled: () => navigate(`/quizzes/${created.id}`) })
          } else {
            navigate(`/quizzes/${created.id}`)
          }
        },
        onSettled: done,
      })
    } else if (id) {
      updateQuiz.mutate(
        { id, data: buildPayload() },
        {
          onSuccess: () => {
            if (asPublish) {
              publishQuiz.mutate(id, { onSettled: () => navigate("/quizzes") })
            }
          },
          onSettled: done,
        },
      )
    }
  }

  const showEditor = isNew || (quiz.data && loadedQuizId === id)

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <BackLink to="/quizzes" label="Quizzes" />
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {isNew ? "New quiz" : "Edit quiz"}
          </h1>
          {!isNew && quiz.data && <QuizStatusBadge status={quiz.data.status} />}
        </div>
        {readOnly ? (
          <Button
            asChild
            className="bg-primary text-white! px-md h-auto py-sm rounded-lg font-label-md nudge-hover"
          >
            <Link to={`/quizzes/${id}/attempts`}>View attempts</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => save(false)}
              disabled={saving || !canSave}
              className="bg-primary text-white! px-md h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
            >
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button
              type="button"
              onClick={() => setPublishOpen(true)}
              disabled={saving || !canSave}
              className="bg-primary text-white! px-md h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
            >
              Publish
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 p-md overflow-y-auto">
        {readOnly && (
          <div className="max-w-3xl mx-auto mb-md bg-primary-fixed/40 text-primary rounded-lg px-md py-sm font-label-md text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            This quiz is {status.toLowerCase()} — questions are locked. Students&apos; results are unaffected.
          </div>
        )}

        {!showEditor ? (
          <LoadingState className="flex-1 p-md" />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant space-y-4 border border-outline-variant">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={readOnly}
                  placeholder="e.g. Chapter 4: Photosynthesis"
                  className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Description (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={readOnly}
                  rows={2}
                  placeholder="Instructions students see before starting"
                  className="w-full min-h-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 resize-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Assign to sections
                </label>
                <QuizTargetPicker value={targets} onChange={setTargets} disabled={readOnly} />
                {!isNew && readOnly && targets.length > 0 && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    This quiz is assigned to {targets.length} section{targets.length > 1 ? "s" : ""}.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Time limit (minutes, optional)</label>
                  <Input
                    type="number"
                    min={1}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    disabled={readOnly}
                    placeholder="No limit"
                    className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Passing score (optional)</label>
                  <Input
                    type="number"
                    min={0}
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    disabled={readOnly}
                    placeholder="Not required"
                    className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Closes at <span className="text-on-surface-variant">(optional)</span>
                </label>
                <Input
                  type="datetime-local"
                  value={closesAt}
                  min={isNew ? toLocalInputValue(new Date().toISOString()) : undefined}
                  onChange={(e) => setClosesAt(e.target.value)}
                  disabled={readOnly}
                  className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60"
                />
                {closesAtError ? (
                  <p className="font-label-sm text-label-sm text-error mt-1">{closesAtError}</p>
                ) : (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    Optional — leave empty and the quiz stays open until you close it manually.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Questions <span className="text-on-surface-variant text-body-md">· {questions.length} · {totalPoints} pts</span>
              </h2>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, makeQuestion("MCQ")])}
                  className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add question
                </Button>
              )}
            </div>

            {questions.map((q, index) => (
              <div key={q.localId} className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
                <div className="flex items-center gap-2 mb-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">Q{index + 1}</span>
                  <Select
                    value={q.type}
                    onValueChange={(v) => changeType(q.localId, v as QuizQuestionType)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-auto h-auto rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface form-input-focus disabled:opacity-60">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <label className="flex items-center gap-1 text-sm text-on-surface-variant">
                    pts
                    <Input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(q.localId, { points: Math.max(1, Number(e.target.value) || 1) })}
                      disabled={readOnly}
                      className="w-16 h-auto rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-sm text-on-surface form-input-focus disabled:opacity-60"
                    />
                  </label>
                  {!readOnly && (
                    <>
                      <Button
                        type="button"
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                        aria-label="Move up"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                        aria-label="Move down"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => removeQuestion(q.localId)}
                        className="w-8 h-8 rounded-lg bg-surface-container text-error hover:bg-error/10 transition-colors"
                        aria-label="Remove question"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </>
                  )}
                </div>

                <Textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(q.localId, { question: e.target.value })}
                  disabled={readOnly}
                  rows={2}
                  placeholder="Type the question…"
                  className="w-full min-h-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 mb-sm resize-none"
                />

                {(q.type === "MCQ" || q.type === "TRUE_FALSE") && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div key={opt.localId} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => !readOnly && setCorrectOption(q.localId, opt.localId)}
                          disabled={readOnly}
                          className={`w-5 h-5 p-0 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            opt.isCorrect ? "border-primary bg-primary" : "border-outline-variant bg-surface"
                          }`}
                          aria-label={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                        >
                          {opt.isCorrect && <span className="material-symbols-outlined text-[13px] text-primary-foreground font-bold">check</span>}
                        </Button>
                        <Input
                          value={opt.text}
                          onChange={(e) => updateOption(q.localId, opt.localId, { text: e.target.value })}
                          disabled={readOnly}
                          placeholder="Answer option"
                          className="flex-1 h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60"
                        />
                        {!readOnly && q.type === "MCQ" && (
                          <Button
                            type="button"
                            onClick={() => removeOption(q.localId, opt.localId)}
                            disabled={q.options.length <= 2}
                            className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant disabled:opacity-30 hover:bg-error/10 hover:text-error transition-colors"
                            aria-label="Remove option"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </Button>
                        )}
                      </div>
                    ))}
                    {!readOnly && q.type === "MCQ" && (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => addOption(q.localId)}
                        className="text-primary font-label-md text-label-md hover:underline h-auto p-0 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add option
                      </Button>
                    )}
                  </div>
                )}

                {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    Students&apos; answers are AI-graded after submission — you confirm the scores.
                  </p>
                )}
              </div>
            ))}

            {!readOnly && questions.length > 0 && (
              <div className="flex justify-end gap-3 pb-lg">
                <Button
                  type="button"
                  onClick={() => save(false)}
                  disabled={saving || !canSave}
                  className="bg-primary text-white! px-lg h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
                >
                  {saving ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setPublishOpen(true)}
                  disabled={saving || !canSave}
                  className="bg-primary text-white! px-lg h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
                >
                  Publish
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this quiz?"
        message={
          questions.some((q) => q.type === "SHORT_ANSWER" || q.type === "ESSAY")
            ? "Published quizzes are visible to students immediately. Open-ended answers are AI-graded and need your confirmation before students see scores."
            : "Published quizzes are visible to students immediately. Questions become locked and can't be edited anymore."
        }
        confirmLabel="Publish"
        isLoading={saving}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => {
          setPublishOpen(false)
          save(true)
        }}
      />
    </>
  )
}
