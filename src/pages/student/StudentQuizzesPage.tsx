import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useStudentQuizList } from "@/hooks/use-quizzes"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"

const attemptBadge: Record<string, { label: string; className: string }> = {
 IN_PROGRESS: { label: "In progress", className: "bg-surface-container-high text-on-surface" },
 COMPLETED: { label: "Completed", className: "bg-primary text-primary-foreground" },
}

export function StudentQuizzesPage() {
 const quizzes = useStudentQuizList()

 const published = (quizzes.data ?? []).filter(
  (q) =>
   q.status === "PUBLISHED" &&
   (q.endsAt == null || new Date(q.endsAt).getTime() > new Date().getTime()),
 )

 const closesLabel = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
   month: "short",
   day: "numeric",
   hour: "numeric",
   minute: "2-digit",
  })

 const assignmentLabel = (assignments: api.QuizAssignmentDto[]) =>
 assignments.map((a) => a.sectionName).join(", ")

 return (
  <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
   <header className="mb-lg">
    <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Quizzes</h1>
    <p className="font-body-lg text-body-lg text-on-surface-variant">
     Quizzes your teachers assigned to you
    </p>
   </header>

   {quizzes.isLoading ? (
    <LoadingState />
   ) : quizzes.isError ? (
    <ErrorState
     title="Failed to load quizzes"
     onRetry={() => quizzes.refetch()}
    />
   ) : published.length === 0 ? (
    <EmptyState
     icon="quiz"
     title="No quizzes right now"
     description="When your teacher publishes a quiz, it will show up here."
    />
   ) : (
    <div className="stagger-enter grid grid-cols-1 md:grid-cols-2 gap-md">
     {published.map((quiz) => {
      const totalPoints = (quiz.questions ?? []).reduce((sum, q) => sum + q.points, 0)
      const badge = quiz.attemptStatus ? attemptBadge[quiz.attemptStatus] : undefined
      const link =
       quiz.attemptStatus === "COMPLETED"
        ? `/student/quizzes/${quiz.id}/result`
        : `/student/quizzes/${quiz.id}/take`
      const actionLabel =
       quiz.attemptStatus === "IN_PROGRESS"
        ? "Resume quiz"
        : quiz.attemptStatus === "COMPLETED"
         ? "View result"
         : "Start quiz"
      return (
       <div key={quiz.id} className="rounded-lg bg-surface-container-lowest border border-border p-md">
        <div className="flex items-start justify-between gap-4">
         <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
           <span className="font-label-sm text-label-sm text-on-surface-variant">{assignmentLabel(quiz.assignments ?? [])}</span>
           {quiz.questions && (
            <>
             <span className="font-label-sm text-label-sm text-on-surface-variant">·</span>
             <span className="font-label-sm text-label-sm text-on-surface-variant">
              {quiz.questions.length} questions · {totalPoints} pts
             </span>
            </>
           )}
           {quiz.timeLimit != null && (
            <>
             <span className="font-label-sm text-label-sm text-on-surface-variant">·</span>
             <span className="font-label-sm text-label-sm text-on-surface-variant inline-flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              {quiz.timeLimit} min
             </span>
            </>
           )}
           {quiz.endsAt != null && (
            <>
             <span className="font-label-sm text-label-sm text-on-surface-variant">·</span>
             <span className="font-label-sm text-label-sm text-on-surface-variant inline-flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Closes {closesLabel(quiz.endsAt)}
             </span>
            </>
           )}
           {badge && (
            <Badge
             variant="outline"
             className={`font-label-sm text-label-sm px-2 py-0.5 rounded-lg border-0 ${badge.className}`}
            >
             {badge.label}
            </Badge>
           )}
          </div>
          <h2 className="font-headline-md text-headline-md text-primary">{quiz.title}</h2>
          {quiz.description && (
           <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-2">
            {quiz.description}
           </p>
          )}
         </div>
         <Link
          to={link}
          className={`shrink-0 px-md py-sm rounded-lg font-label-md nudge-hover ${
           quiz.attemptStatus === "COMPLETED"
            ? "bg-surface-container text-on-surface-variant"
            : "bg-primary text-primary-foreground"
          }`}
         >
          {actionLabel}
         </Link>
        </div>
       </div>
      )
     })}
    </div>
   )}
  </div>
 )
}
