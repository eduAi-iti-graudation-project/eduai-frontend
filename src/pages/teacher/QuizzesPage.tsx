import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useClasses } from "@/hooks/use-classes"
import { useQuizList, useGenerateQuiz, useDeleteQuiz, usePublishQuiz } from "@/hooks/use-quizzes"
import { useUpdateQuiz } from "@/hooks/use-quizzes"
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge"
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
import type { QuizDto, QuizQuestionType } from "@/lib/api"

const TYPE_LABELS: Record<QuizQuestionType, string> = {
 MCQ: "Multiple choice",
 TRUE_FALSE: "True / False",
 SHORT_ANSWER: "Short answer",
 ESSAY: "Essay",
}

const ALL_CLASSES = "__all__"
const NO_CLASS = "__none__"

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
   <PageHeader
    title="Quizzes"
    actions={
     <div className="flex items-center gap-3">
      <Select
       value={classFilter}
       onValueChange={(v) => setClassFilter(v === ALL_CLASSES ? "" : v)}
      >
       <SelectTrigger className="w-auto rounded-full bg-surface px-3 py-2 text-label-md text-on-surface form-input-focus">
        <SelectValue placeholder="All classes" />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
        {(classes.data ?? []).map((c) => (
         <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
       </SelectContent>
      </Select>
      <Button
       type="button"
       onClick={() => {
        setGenClassId(classFilter || classes.data?.[0]?.id || "")
        setGeneratorOpen(true)
       }}
       className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-full font-label-md nudge-hover inline-flex items-center gap-1"
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
    ) : (
     <div className="space-y-3 max-w-4xl mx-auto">
      {(quizzes.data ?? []).map((quiz) => {
       const totalPoints = (quiz.questions ?? []).reduce((sum, q) => sum + q.points, 0)
       return (
        <div key={quiz.id} className="rounded-lg bg-surface-container-lowest p-md hover:border-primary transition-colors">
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
           <h2 className="font-headline-md text-headline-md text-primary group-hover:text-primary transition-colors">
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
              className=" text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
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
              onClick={() => setCloseTarget(quiz)}
              className=" text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
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
              className=" text-on-surface bg-surface-container-lowest px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover hover:bg-surface-container-high"
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
       <h3 className="font-headline-md text-headline-md text-primary">Generate quiz with AI</h3>
       <p id="quiz-generator-description" className="font-label-sm text-label-sm text-on-surface-variant">
        The AI drafts a full quiz you can review before publishing.
       </p>
      </div>
     </div>

     <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Class</label>
     <Select
      value={genClassId}
      onValueChange={(v) => setGenClassId(v === NO_CLASS ? "" : v)}
     >
      <SelectTrigger className="w-full rounded-full bg-surface px-3 py-2 text-label-md text-on-surface form-input-focus mb-md">
       <SelectValue placeholder="Select a class" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value={NO_CLASS}>Select a class</SelectItem>
       {(classes.data ?? []).map((c) => (
        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
       ))}
      </SelectContent>
     </Select>

     <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Topic</label>
     <Input
      value={genTopic}
      onChange={(e) => setGenTopic(e.target.value)}
      placeholder="e.g. Photosynthesis, World War II, Fractions…"
      className="w-full h-auto rounded-full bg-surface px-3 py-2 text-label-md text-on-surface form-input-focus mb-md"
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
      className="w-full mb-md accent-primary"
     />

     <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Question types</label>
     <div className="grid grid-cols-2 gap-2 mb-lg">
      {(Object.keys(TYPE_LABELS) as QuizQuestionType[]).map((type) => (
       <Button
        key={type}
        type="button"
        onClick={() => toggleType(type)}
        className={`flex items-center gap-2 px-3 py-2 h-auto rounded-md border text-sm font-label-md transition-all ${
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

     <div className="flex gap-md">
      <Button
       type="button"
       onClick={() => setGeneratorOpen(false)}
       disabled={generateQuiz.isPending}
       className="flex-1 h-auto py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-md disabled:opacity-50"
      >
       Cancel
      </Button>
      <Button
       type="button"
       onClick={runGenerate}
       disabled={generateQuiz.isPending || !genClassId || !genTopic.trim() || genTypes.length === 0}
       className="flex-1 h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-md disabled:opacity-50 active:scale-95 transition-all"
      >
       {generateQuiz.isPending ? "AI is writing your quiz…" : "Generate"}
      </Button>
     </div>
    </DialogContent>
   </Dialog>

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
