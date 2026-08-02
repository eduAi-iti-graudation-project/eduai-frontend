import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useStudentQuizList } from "@/hooks/use-quizzes"

const attemptBadge: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "In progress", className: "bg-primary-fixed text-primary" },
  COMPLETED: { label: "Completed", className: "bg-secondary-container text-white" },
}

export function StudentQuizzesPage() {
  const { user } = useAuth()
  const quizzes = useStudentQuizList()

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

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

  const className = (classId: string) =>
    studentClasses.data?.find((c) => c.id === classId)?.name ?? "Class"

  return (
    <div className="flex-1 p-xl max-w-3xl mx-auto w-full">
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Quizzes</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Quizzes your teachers assigned to you
        </p>
      </header>

      {quizzes.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md animate-pulse">
              <div className="h-6 w-40 bg-surface-container-high rounded-full mb-3" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded-full" />
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
      ) : published.length === 0 ? (
        <div className="text-center py-xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">quiz</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">No quizzes right now</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            When your teacher publishes a quiz, it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
              <div key={quiz.id} className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{className(quiz.classId)}</span>
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
                        <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <Link
                    to={link}
                    className={`shrink-0 px-md py-sm rounded-full font-label-md nudge-hover ${
                      quiz.attemptStatus === "COMPLETED"
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-primary text-white"
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
