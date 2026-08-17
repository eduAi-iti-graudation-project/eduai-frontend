import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams, useBlocker } from "react-router-dom"
import { useQuiz } from "@/hooks/use-quizzes"
import { useQuizSession } from "@/hooks/use-quiz-session"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/api"

const TYPE_HINTS: Record<string, string> = {
 MCQ: "Choose the best answer",
 TRUE_FALSE: "Select True or False",
 SHORT_ANSWER: "Write a short answer",
 ESSAY: "Write a full response",
}

function formatTime(ms: number) {
 const totalSeconds = Math.ceil(ms / 1000)
 const minutes = Math.floor(totalSeconds / 60)
 const seconds = totalSeconds % 60
 return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function formatDateTime(iso: string) {
 return new Date(iso).toLocaleString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
 })
}

export function QuizTakePage() {
 const { id: quizId } = useParams<{ id: string }>()
 const quiz = useQuiz(quizId ?? "")
 const session = useQuizSession(quizId ?? "", quiz.data?.endsAt ?? null)
 const navigate = useNavigate()

 const [startOpen, setStartOpen] = useState(false)
 const [submitOpen, setSubmitOpen] = useState(false)
 const [startError, setStartError] = useState("")
 const submittingRef = useRef(false)

 const {
  phase,
  answers,
  setAnswer,
  remainingMs,
  isSubmitting,
  submitError,
  start,
  submit,
  reportViolation,
 } = session

 const questions = quiz.data ? [...(quiz.data.questions ?? [])].sort((a, b) => a.order - b.order) : []
 const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length
 const deadlinePassed =
  quiz.data?.endsAt != null && new Date(quiz.data.endsAt).getTime() <= new Date().getTime()

 const requestFullscreen = () => {
  if (document.fullscreenElement) return
  document.documentElement.requestFullscreen?.().catch(() => {
   // fullscreen denied — quiz still proceeds, exits are still tracked
  })
 }

 const handleStart = async () => {
  setStartError("")
  const ok = await start()
  if (!ok) {
   setStartError("Couldn't start the quiz. It may have been closed or you already completed it.")
   return
  }
  requestFullscreen()
 }

 const runSubmit = async () => {
  if (submittingRef.current) return
  submittingRef.current = true
  try {
   await submit(answers)
  } catch {
   // errors surface via submitError from the session hook
  } finally {
   submittingRef.current = false
  }
 }

 const blocker = useBlocker(phase === "active")

 useEffect(() => {
  if (phase === "submitted") {
   navigate(`/student/quizzes/${quizId}/result`, { replace: true })
  }
 }, [phase, navigate, quizId])

 useEffect(() => {
  if (phase !== "active") return
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
   e.preventDefault()
   e.returnValue = ""
  }
  window.addEventListener("beforeunload", onBeforeUnload)
  return () => window.removeEventListener("beforeunload", onBeforeUnload)
 }, [phase])

 useEffect(() => {
  if (phase !== "active") return

  const onFullscreenChange = () => {
   if (!document.fullscreenElement) reportViolation("FULLSCREEN_EXIT")
  }
  const onVisibility = () => {
   if (document.hidden) reportViolation("TAB_SWITCH")
  }
  const onBlur = () => reportViolation("TAB_SWITCH")
  const onContextMenu = (e: MouseEvent) => e.preventDefault()
  const onCopy = (e: ClipboardEvent) => e.preventDefault()
  const onPaste = (e: ClipboardEvent) => e.preventDefault()
  const onCut = (e: ClipboardEvent) => e.preventDefault()

  document.addEventListener("fullscreenchange", onFullscreenChange)
  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("blur", onBlur)
  document.addEventListener("contextmenu", onContextMenu)
  document.addEventListener("copy", onCopy)
  document.addEventListener("paste", onPaste)
  document.addEventListener("cut", onCut)

  return () => {
   document.removeEventListener("fullscreenchange", onFullscreenChange)
   document.removeEventListener("visibilitychange", onVisibility)
   window.removeEventListener("blur", onBlur)
   document.removeEventListener("contextmenu", onContextMenu)
   document.removeEventListener("copy", onCopy)
   document.removeEventListener("paste", onPaste)
   document.removeEventListener("cut", onCut)
  }
 }, [phase, reportViolation])

 useEffect(() => {
  if (phase === "active") return
  if (document.fullscreenElement) {
   document.exitFullscreen?.().catch(() => {
    // noop
   })
  }
 }, [phase])

 useEffect(() => {
  return () => {
   if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {
     // noop
    })
   }
  }
 }, [])

 const timerColor =
  remainingMs != null && remainingMs <= 30_000
   ? "bg-primary text-primary-foreground animate-pulse"
   : remainingMs != null && remainingMs <= 60_000
    ? "bg-primary text-primary-foreground"
    : "bg-surface-container text-on-surface-variant"

 if (phase === "expired") {
  return (
   <div className="flex-1 p-xl max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center mb-4">
     <span className="material-symbols-outlined text-accent-foreground text-3xl">timer_off</span>
    </div>
    <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Time&apos;s up</h1>
    <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
     The quiz time ran out before your answers could be submitted. Your teacher can see the
     attempt — ask them if you should try again.
    </p>
    <Link
     to="/student/quizzes"
     className="bg-primary text-primary-foreground px-lg py-sm rounded-lg font-label-md hover:opacity-90 transition-all"
    >
     Back to quizzes
    </Link>
   </div>
  )
 }

 if (phase === "pre") {
  const timeLimit = quiz.data?.timeLimit
  if (quiz.isLoading) {
   return (
    <div className="flex-1 p-md flex items-center justify-center">
     <p className="font-body-md text-body-md text-on-surface-variant">Loading quiz…</p>
    </div>
   )
  }
  if (quiz.isError) {
   return (
    <div className="flex-1 p-xl max-w-2xl mx-auto w-full">
     <div className="rounded-lg bg-surface-container-lowest border border-border p-xl text-center">
      <span className="material-symbols-outlined text-[48px] text-error mb-md block">error_outline</span>
      <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">Couldn&apos;t load this quiz</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-md">
       {getErrorMessage(quiz.error)}
      </p>
      <div className="flex gap-md justify-center">
       <Button
        type="button"
        onClick={() => quiz.refetch()}
        className="px-lg py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg hover:opacity-90 transition-all h-auto"
       >
        Try again
       </Button>
       <Link
        to="/student/quizzes"
        className="px-lg py-sm border border-border text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-low transition-colors"
       >
        Back to quizzes
       </Link>
      </div>
     </div>
    </div>
   )
  }
  if (!quiz.data) {
   return (
    <div className="flex-1 p-xl max-w-2xl mx-auto w-full">
     <div className="rounded-lg bg-surface-container-lowest border border-border p-xl text-center">
      <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md block">quiz</span>
      <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">Quiz not found</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
       This quiz doesn&apos;t exist or you don&apos;t have access to it. Check your quiz list.
      </p>
      <Link
       to="/student/quizzes"
       className="bg-primary text-primary-foreground px-lg py-sm rounded-lg font-label-md hover:opacity-90 transition-all"
      >
       Back to quizzes
      </Link>
     </div>
    </div>
   )
  }
  return (
   <div className="flex-1 p-xl max-w-2xl mx-auto w-full">
    <div className="rounded-lg bg-surface-container-lowest border border-border p-xl">
     <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">{quiz.data?.title ?? "Quiz"}</h1>
     {quiz.data?.description && (
      <p className="font-body-md text-body-md text-on-surface-variant mb-md">{quiz.data.description}</p>
     )}

     {questions.length === 0 ? (
      <div className="rounded-lg bg-surface-container-low p-md mb-lg">
       <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">info</span>
        <p className="font-body-md text-body-md text-on-surface">
         This quiz has no questions yet. Ask your teacher to check it.
        </p>
       </div>
      </div>
     ) : (
      <>
       <div className="rounded-lg bg-surface-container-low p-md mb-lg space-y-3">
      <div className="flex items-start gap-3">
       <span className="material-symbols-outlined text-[20px] text-primary shrink-0">quiz</span>
       <p className="font-body-md text-body-md text-on-surface">
        {questions.length} questions · {questions.reduce((s, q) => s + q.points, 0)} points
       </p>
      </div>
      {timeLimit != null && (
       <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-primary shrink-0">timer</span>
        <p className="font-body-md text-body-md text-on-surface">{timeLimit} minutes</p>
       </div>
      )}
      {quiz.data?.endsAt != null && (
       <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-primary shrink-0">schedule</span>
        <p className="font-body-md text-body-md text-on-surface">
         Closes {formatDateTime(quiz.data.endsAt)} — the quiz submits automatically when time is up.
        </p>
       </div>
      )}
      <div className="flex items-start gap-3">
       <span className="material-symbols-outlined text-[20px] text-primary shrink-0">fullscreen</span>
       <p className="font-body-md text-body-md text-on-surface">
        The quiz runs in fullscreen. Switching tabs or leaving fullscreen is recorded and
        reported to your teacher.
       </p>
      </div>
      <div className="flex items-start gap-3">
       <span className="material-symbols-outlined text-[20px] text-primary shrink-0">auto_awesome</span>
       <p className="font-body-md text-body-md text-on-surface">
        The Homework Helper is paused while a quiz is in progress.
       </p>
      </div>
      <div className="flex items-start gap-3">
       <span className="material-symbols-outlined text-[20px] text-primary shrink-0">save</span>
       <p className="font-body-md text-body-md text-on-surface">
        Your progress is saved as you go — refreshing the page resumes the quiz.
       </p>
      </div>
     </div>

     {submitError && (
      <div className="rounded-lg bg-primary-fixed/20 border border-primary/20 p-md mb-lg flex items-start gap-3">
       <span className="material-symbols-outlined text-[20px] text-primary shrink-0">info</span>
       <p className="font-body-md text-body-md text-on-surface">{submitError}</p>
      </div>
     )}

     {startError && (
      <p className="font-label-md text-label-md text-error mb-md text-center">{startError}</p>
     )}

     {deadlinePassed && (
      <div className="rounded-lg bg-error/10 border border-error/20 p-md mb-md text-center">
       <p className="font-label-md text-label-md text-error">
        This quiz closed — you can no longer start it.
       </p>
      </div>
     )}

     <Button
      type="button"
      onClick={() => setStartOpen(true)}
      disabled={!quiz.data || deadlinePassed}
      className="w-full bg-primary text-primary-foreground py-md rounded-lg font-label-lg text-label-lg disabled:opacity-50 nudge-hover h-auto"
     >
      Start quiz
     </Button>
      </>
     )}
    </div>

    <ConfirmDialog
     open={startOpen}
     title="Ready?"
     message={`You're about to start "${quiz.data?.title}". You can't restart the quiz after this — if you leave, you can come back and continue.`}
     confirmLabel="Start"
     onCancel={() => setStartOpen(false)}
     onConfirm={() => {
      setStartOpen(false)
      handleStart()
     }}
    />
   </div>
  )
 }

 if (!quiz.data) {
  return (
   <div className="flex-1 p-md flex items-center justify-center">
    <p className="font-body-md text-body-md text-on-surface-variant">Loading quiz…</p>
   </div>
  )
 }

 return (
  <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
   <div className="sticky top-0 z-20 bg-surface-container-lowest border-b border-border px-md py-3 flex items-center justify-between">
    <div className="min-w-0">
     <h1 className="font-headline-md text-headline-md text-primary truncate">{quiz.data.title}</h1>
     <p className="font-label-sm text-label-sm text-on-surface-variant">
      {answeredCount} / {questions.length} answered
     </p>
    </div>
    {remainingMs != null && (
     <span className={`font-label-md text-label-md px-3 py-1.5 rounded-lg inline-flex items-center gap-1 ${timerColor}`}>
      <span className="material-symbols-outlined text-[16px]">timer</span>
      {formatTime(remainingMs)}
     </span>
    )}
   </div>

   <div className="flex-1 p-xl space-y-6 pb-32">
    {questions.map((question, index) => {
     const value = answers[question.id] ?? ""
     return (
      <section key={question.id} className="rounded-lg bg-surface-container-lowest border border-border p-md">
       <div className="flex items-start justify-between gap-3 mb-sm">
        <div className="flex items-center gap-2 min-w-0">
         <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Q{index + 1}</span>
         <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant shrink-0">
          {TYPE_HINTS[question.type]}
         </span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">{question.points} pts</span>
       </div>

       <p className="font-body-lg text-body-lg text-on-surface mb-md">{question.question}</p>

       {question.type === "MCQ" && (
        <RadioGroup
         value={value}
         onValueChange={(v) => setAnswer(question.id, v)}
         className="space-y-2"
        >
         {(question.options ?? []).map((option) => (
          <label
           key={option.text}
           className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
            value === option.text
             ? "border-primary bg-primary-fixed/20"
             : "border-outline-variant bg-surface hover:border-primary/40"
           }`}
          >
           <RadioGroupItem
            value={option.text}
            id={`q-${question.id}-${option.text}`}
            className="shrink-0"
           />
           <span className="font-body-md text-body-md text-on-surface">{option.text}</span>
          </label>
         ))}
        </RadioGroup>
       )}

       {question.type === "TRUE_FALSE" && (
        <div className="grid grid-cols-2 gap-2">
         {["True", "False"].map((label) => (
          <Button
           key={label}
           type="button"
           variant="outline"
           onClick={() => setAnswer(question.id, label)}
           className={`py-md rounded-lg border font-label-lg text-label-lg transition-all h-auto hover:bg-transparent ${
            value === label
             ? "border-primary bg-primary text-primary-foreground"
             : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary/40"
           }`}
          >
           {label}
          </Button>
         ))}
        </div>
       )}

       {question.type === "SHORT_ANSWER" && (
        <Textarea
         value={value}
         onChange={(e) => setAnswer(question.id, e.target.value)}
         rows={3}
         placeholder="Write your answer…"
         className="w-full form-input-focus rounded-full bg-surface px-3 py-2 text-label-md text-on-surface resize-none focus-visible:ring-0"
        />
       )}

       {question.type === "ESSAY" && (
        <div>
         <Textarea
          value={value}
          onChange={(e) => setAnswer(question.id, e.target.value)}
          rows={6}
          placeholder="Write your full response…"
          className="w-full form-input-focus rounded-full bg-surface px-3 py-2 text-label-md text-on-surface resize-none focus-visible:ring-0"
         />
         <p className="font-label-sm text-label-sm text-on-surface-variant text-right">{value.length} characters</p>
        </div>
       )}
      </section>
     )
    })}
   </div>

   <div className="sticky bottom-0 bg-surface-container-lowest border-t border-border px-md py-3 flex flex-col items-end gap-2">
    {submitError && (
     <p className="font-label-md text-label-md text-error w-full text-center">{submitError}</p>
    )}
    <Button
     type="button"
     onClick={() => {
      if (answeredCount < questions.length) setSubmitOpen(true)
      else runSubmit()
     }}
     disabled={isSubmitting || questions.length === 0}
     className="bg-primary text-primary-foreground px-lg py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover h-auto"
    >
     {isSubmitting ? "Submitting…" : "Submit quiz"}
    </Button>
   </div>

   {(isSubmitting || blocker.state === "blocked") && (
    <Dialog open>
     <DialogContent className="rounded-lg max-w-2xl bg-popover p-xl shadow-xl text-center [&>button.absolute]:hidden">
      {blocker.state === "blocked" ? (
       <>
        <span className="material-symbols-outlined text-[32px] text-primary block mb-sm">logout</span>
        <DialogTitle className="font-headline-md text-headline-md text-on-surface mb-2">Leave the quiz?</DialogTitle>
        <DialogDescription className="font-body-md text-body-md text-on-surface-variant mb-lg">
         Your answers are saved — you can come back and continue.
        </DialogDescription>
        <div className="flex gap-md">
         <Button
          type="button"
          variant="secondary"
          onClick={() => blocker.reset?.()}
          className="flex-1 py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container-high h-auto"
         >
          Stay
         </Button>
         <Button
          type="button"
          onClick={() => blocker.proceed?.()}
          className="flex-1 py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg h-auto"
         >
          Leave
         </Button>
        </div>
       </>
      ) : (
       <>
        <DialogTitle className="sr-only">Submitting quiz</DialogTitle>
        <p className="font-body-md text-body-md text-on-surface">Submitting your quiz…</p>
       </>
      )}
     </DialogContent>
    </Dialog>
   )}

   <ConfirmDialog
    open={submitOpen}
    title="Submit quiz?"
    message={`You still have ${questions.length - answeredCount} unanswered question${questions.length - answeredCount > 1 ? "s" : ""}. Unanswered questions score zero — submit anyway?`}
    confirmLabel="Submit"
    variant="danger"
    onCancel={() => setSubmitOpen(false)}
    onConfirm={() => {
     setSubmitOpen(false)
     runSubmit()
    }}
   />
  </div>
 )
}
