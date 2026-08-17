import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuizList, useGenerateQuiz, useDeleteQuiz, usePublishQuiz, useUpdateQuiz, useAssignQuiz } from "@/hooks/use-quizzes"
import { useCourseMaterialChapters } from "@/hooks/use-materials"
import { QuizTargetPicker, type TargetOffering } from "@/components/quiz/QuizTargetPicker"
import { QuizAgentGraph } from "@/components/quiz/QuizAgentGraph"
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge"
import { QuizDifficultyBadge } from "@/components/quiz/QuizDifficultyBadge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QuizDto, QuizDifficulty, QuizQuestionType, QuizStatus } from "@/lib/api"

const DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
}

const DIFFICULTIES: QuizDifficulty[] = ["EASY", "MEDIUM", "HARD"]

const TYPE_LABELS: Record<QuizQuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
}

const ALL = "__all__"
const STATUS_FILTERS: { value: QuizStatus | typeof ALL; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "CLOSED", label: "Closed" },
]

export function QuizzesPage() {
  const navigate = useNavigate()
  const [gradeFilter, setGradeFilter] = useState("")
  const [courseFilter, setCourseFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<QuizStatus | typeof ALL>(ALL)
  const [search, setSearch] = useState("")

  const quizzes = useQuizList(sectionFilter || undefined)
  const generateQuiz = useGenerateQuiz()
  const deleteQuiz = useDeleteQuiz()
  const publishQuiz = usePublishQuiz()
  const updateQuiz = useUpdateQuiz()
  const assignQuiz = useAssignQuiz()

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [genTargets, setGenTargets] = useState<TargetOffering[]>([])
  const [genUnit, setGenUnit] = useState("")
  const [genCount, setGenCount] = useState(10)
  const [genTypes, setGenTypes] = useState<QuizQuestionType[]>(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"])
  const [genDifficulty, setGenDifficulty] = useState<QuizDifficulty>("MEDIUM")
  const [genTimeLimit, setGenTimeLimit] = useState(15)
  const [genClosesAt, setGenClosesAt] = useState("")

  const genCourseId = genTargets[0]?.courseId ?? ""
  const {
    chapters: genUnits,
    isLoading: genUnitsLoading,
  } = useCourseMaterialChapters(genCourseId)

  const handleGenTargetsChange = (next: TargetOffering[]) => {
    const prevCourse = genTargets[0]?.courseId
    const nextCourse = next[0]?.courseId
    setGenTargets(next)
    if (nextCourse !== prevCourse) setGenUnit("")
  }

  const [assignTarget, setAssignTarget] = useState<QuizDto | null>(null)
  const [assignTargets, setAssignTargets] = useState<TargetOffering[]>([])

  const [deleteTarget, setDeleteTarget] = useState<QuizDto | null>(null)
  const [closeTarget, setCloseTarget] = useState<QuizDto | null>(null)
  const [publishTarget, setPublishTarget] = useState<QuizDto | null>(null)

  const toggleType = (type: QuizQuestionType) => {
    setGenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const runGenerate = () => {
    if (genTargets.length === 0 || !genUnit || !genTimeLimit || !genClosesAt) return
    const primary = genTargets[0]
    setGeneratorOpen(false)
    generateQuiz.mutate(
      {
        courseId: primary.courseId,
        assignments: genTargets.map((t) => ({
          courseOfferingId: t.courseOfferingId,
          targetStudentIds: t.targetStudentIds.length > 0 ? t.targetStudentIds : undefined,
        })),
        chapterId: genUnit === ALL ? null : genUnit,
        questionCount: genCount,
        types: genTypes,
        difficulty: genDifficulty,
        timeLimit: genTimeLimit,
        endsAt: new Date(genClosesAt).toISOString(),
      },
      {
        onDone: (result) => {
          setGenUnit("")
          setGenTargets([])
          setGenClosesAt("")
          if (result.quizId) {
            navigate(`/quizzes/${result.quizId}`)
          }
        },
      },
    )
  }

  const runAssign = () => {
    if (!assignTarget || assignTargets.length === 0) return
    assignQuiz.mutate(
      {
        id: assignTarget.id,
        assignments: assignTargets.map((t) => ({
          courseOfferingId: t.courseOfferingId,
          targetStudentIds: t.targetStudentIds.length > 0 ? t.targetStudentIds : undefined,
        })),
      },
      {
        onSettled: () => {
          setAssignTarget(null)
          setAssignTargets([])
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (quizzes.data ?? []).filter((quiz) => {
      if (statusFilter !== ALL && quiz.status !== statusFilter) return false
      if (gradeFilter) {
        const hasGrade = quiz.assignments.some((a) => a.gradeLevelId === gradeFilter)
        if (!hasGrade) return false
      }
      if (courseFilter) {
        const hasCourse = quiz.assignments.some((a) => a.courseId === courseFilter)
        if (!hasCourse) return false
      }
      if (query) {
        const haystack = `${quiz.title} ${quiz.description ?? ""} ${quiz.assignments.map((a) => `${a.sectionName} ${a.courseName} ${a.gradeLevelName}`).join(" ")}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [quizzes.data, statusFilter, gradeFilter, courseFilter, search])

  const allAssignments = useMemo(
    () => (quizzes.data ?? []).flatMap((q) => q.assignments),
    [quizzes.data],
  )
  const gradeOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const a of allAssignments) byId.set(a.gradeLevelId, a.gradeLevelName)
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [allAssignments])
  const courseOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const a of allAssignments) {
      if (gradeFilter && a.gradeLevelId !== gradeFilter) continue
      byId.set(a.courseId, a.courseName)
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [allAssignments, gradeFilter])
  const sectionOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const a of allAssignments) {
      if (gradeFilter && a.gradeLevelId !== gradeFilter) continue
      if (courseFilter && a.courseId !== courseFilter) continue
      byId.set(a.sectionId, a.sectionName)
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [allAssignments, gradeFilter, courseFilter])

  return (
    <>
      <PageHeader
        title="Quizzes"
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={generateQuiz.isLoading}
              onClick={() => {
                setGenTargets([])
                setGeneratorOpen(true)
              }}
              className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              AI Generate
            </Button>
            <Button
              asChild
              className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-1"
            >
              <Link to="/quizzes/new">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Quiz
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-md">
        <div className="max-w-4xl mx-auto mb-md flex flex-wrap items-end gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes…"
            className="w-auto min-w-[200px] h-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus"
          />
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Grade</label>
            <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v === ALL ? "" : v); setCourseFilter(""); setSectionFilter("") }}>
              <SelectTrigger aria-label="Grade" className="w-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus">
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All grades</SelectItem>
                {gradeOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name || "Grade"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Course</label>
            <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v === ALL ? "" : v); setSectionFilter("") }} disabled={!gradeFilter}>
              <SelectTrigger aria-label="Course" className="w-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-50">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Section</label>
            <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v === ALL ? "" : v)} disabled={!courseFilter}>
              <SelectTrigger aria-label="Section" className="w-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-50">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sections</SelectItem>
                {sectionOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuizStatus | typeof ALL)}>
            <SelectTrigger className="w-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto">
            {filtered.length} quiz{filtered.length === 1 ? "" : "zes"}
          </span>
        </div>

        {generateQuiz.isLoading && (
          <div className="max-w-4xl mx-auto mb-md">
            <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
              <QuizAgentGraph
                variant="inline"
                step={generateQuiz.step}
                lastToolStep={generateQuiz.lastToolStep}
              />
            </div>
          </div>
        )}

        {quizzes.isLoading ? (
          <LoadingState className="flex-1 p-md max-w-4xl mx-auto w-full" />
        ) : quizzes.isError ? (
          <ErrorState
            title="Failed to load quizzes"
            message={quizzes.error instanceof Error ? quizzes.error.message : "Something went wrong"}
            onRetry={() => quizzes.refetch()}
            className="flex-1"
          />
        ) : (quizzes.data ?? []).length === 0 ? (
          <EmptyState
            icon="quiz"
            title="No quizzes yet"
            description="Write one from scratch or let AI draft it for you."
            action={
              <div className="flex gap-md justify-center">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-full font-label-md hover:opacity-90 transition-all"
                >
                  <Link to="/quizzes/new">Create a quiz</Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => setGeneratorOpen(true)}
                  className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-full font-label-md hover:opacity-90 transition-all"
                >
                  Generate with AI
                </Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="filter_alt"
            title="No matching quizzes"
            description="Try clearing the filters or searching for something else."
          />
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filtered.map((quiz) => {
              const totalPoints = (quiz.questions ?? []).reduce((sum, q) => sum + q.points, 0)
              return (
                <div key={quiz.id} className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/quizzes/${quiz.id}`} className="flex-1 min-w-0 group">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <QuizStatusBadge status={quiz.status} />
                        <QuizDifficultyBadge difficulty={quiz.difficulty} />
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
                      {quiz.assignments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {quiz.assignments.map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant"
                            >
                              <span className="material-symbols-outlined text-[12px]">groups</span>
                              {a.sectionName}
                              {a.targetStudentIds.length > 0 && (
                                <span className="text-primary">{a.targetStudentIds.length} targeted</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {quiz.status === "DRAFT" && (
                        <>
                          <Button
                            asChild
                            className="bg-primary text-primary-foreground px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            <Link to={`/quizzes/${quiz.id}`}>Edit</Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setPublishTarget(quiz)}
                            className="border border-primary text-primary bg-transparent px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Publish
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setDeleteTarget(quiz)}
                            className="border border-outline-variant text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {quiz.status === "PUBLISHED" && (
                        <>
                          <Button
                            asChild
                            className="border border-primary text-primary bg-transparent px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            <Link to={`/quizzes/${quiz.id}/attempts`}>View attempts</Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => { setAssignTarget(quiz); setAssignTargets([]) }}
                            className="border border-primary text-primary bg-transparent px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            Reassign
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setCloseTarget(quiz)}
                            className="border border-outline-variant text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
                          >
                            Close
                          </Button>
                        </>
                      )}
                      {quiz.status === "CLOSED" && (
                        <>
                          <Button
                            asChild
                            className="border border-primary text-primary bg-transparent px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            <Link to={`/quizzes/${quiz.id}/attempts`}>View attempts</Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setDeleteTarget(quiz)}
                            className="border border-outline-variant text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
                          >
                            Delete
                          </Button>
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

      <Dialog
        open={generatorOpen}
        onOpenChange={(next) => {
          if (!next && !generateQuiz.isPending) setGeneratorOpen(false)
        }}
      >
        <DialogContent
          className="rounded-lg max-w-2xl bg-surface-container-lowest p-xl mx-md max-h-[90vh] overflow-y-auto"
          aria-describedby="quiz-generator-description"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-[28px] text-primary">auto_awesome</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Generate quiz with AI</h3>
              <p id="quiz-generator-description" className="font-label-sm text-label-sm text-on-surface-variant">
                The AI drafts a full quiz from the selected scope&apos;s material. You review it before publishing.
              </p>
            </div>
          </div>

          <div className="mb-md">
            <QuizTargetPicker value={genTargets} onChange={handleGenTargetsChange} disabled={generateQuiz.isPending} />
          </div>

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Scope</label>
          <Select
            value={genUnit}
            onValueChange={setGenUnit}
            disabled={generateQuiz.isPending || !genCourseId || genUnitsLoading}
          >
            <SelectTrigger
              aria-label="Scope"
              className="w-full rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 mb-md"
            >
              <SelectValue placeholder={genCourseId ? "Pick a scope…" : "Pick a class first…"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Entire course</SelectItem>
              {genCourseId && !genUnitsLoading && genUnits.length === 0 && (
                <p className="px-3 py-2 text-sm text-on-surface-variant">
                  No material units in this course yet. Organize material into units first.
                </p>
              )}
              {genUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.title}
                  {u.materials.length > 0 && ` (${u.materials.length} material${u.materials.length === 1 ? "" : "s"})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {genCourseId && !genUnitsLoading && genUnits.length === 0 && genUnit !== ALL && (
            <p className="font-label-sm text-label-sm text-on-surface-variant -mt-md mb-md">
              Pick &quot;Entire course&quot; to generate from all uploaded material, or upload and group
              material into units to scope the quiz to a unit.
            </p>
          )}

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Questions ({genCount})
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={genCount}
            onChange={(e) => setGenCount(Number(e.target.value))}
            className="w-full mb-md accent-primary"
          />

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Question types
          </label>
          <div className="grid grid-cols-2 gap-2 mb-md">
            {(Object.keys(TYPE_LABELS) as QuizQuestionType[]).map((type) => (
              <Button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`flex items-center gap-2 px-3 py-2 h-auto rounded-full border text-sm font-label-md transition-all ${
                  genTypes.includes(type)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-outline-variant bg-surface text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{typeIcon[type]}</span>
                {TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Difficulty
          </label>
          <Select
            value={genDifficulty}
            onValueChange={(v) => setGenDifficulty(v as QuizDifficulty)}
            disabled={generateQuiz.isPending}
          >
            <SelectTrigger aria-label="Difficulty" className="w-full rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 mb-md">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Time limit (minutes)
          </label>
          <Input
            type="number"
            min={1}
            value={genTimeLimit || ""}
            onChange={(e) => setGenTimeLimit(Number(e.target.value))}
            placeholder="e.g. 15"
            aria-label="Time limit"
            className="w-full h-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus mb-md"
          />

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Closes at (required)
          </label>
          <Input
            type="datetime-local"
            value={genClosesAt}
            required
            aria-label="Closes at"
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setGenClosesAt(e.target.value)}
            className="w-full h-auto rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus mb-lg"
          />

          <div className="flex gap-md">
            <Button
              type="button"
              onClick={() => setGeneratorOpen(false)}
              disabled={generateQuiz.isPending}
              className="flex-1 h-auto py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={runGenerate}
              disabled={generateQuiz.isPending || genTargets.length === 0 || !genUnit || !genTimeLimit || !genClosesAt || genTypes.length === 0}
              className="flex-1 h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-full disabled:opacity-50 active:scale-95 transition-all"
            >
              {generateQuiz.isPending ? "AI is writing your quiz…" : "Generate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignTarget}
        onOpenChange={(next) => {
          if (!next && !assignQuiz.isPending) {
            setAssignTarget(null)
            setAssignTargets([])
          }
        }}
      >
        <DialogContent
          className="rounded-lg max-w-2xl bg-surface-container-lowest p-xl mx-md max-h-[90vh] overflow-y-auto"
          aria-describedby="quiz-assign-description"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-[28px] text-primary">groups</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Reassign quiz</h3>
              <p id="quiz-assign-description" className="font-label-sm text-label-sm text-on-surface-variant">
                Add more sections to &quot;{assignTarget?.title}&quot;. Students in those sections get the quiz too.
              </p>
            </div>
          </div>
          <QuizTargetPicker value={assignTargets} onChange={setAssignTargets} disabled={assignQuiz.isPending} />
          <div className="flex gap-md mt-lg">
            <Button
              type="button"
              onClick={() => { setAssignTarget(null); setAssignTargets([]) }}
              disabled={assignQuiz.isPending}
              className="flex-1 h-auto py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={runAssign}
              disabled={assignQuiz.isPending || assignTargets.length === 0}
              className="flex-1 h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-full disabled:opacity-50 active:scale-95 transition-all"
            >
              {assignQuiz.isPending ? "Assigning…" : "Assign to sections"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!publishTarget}
        title="Publish this quiz?"
        message={`"${publishTarget?.title}" will be visible to its assigned students immediately. You won't be able to edit questions after publishing.`}
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