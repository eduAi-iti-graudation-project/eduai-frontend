import { Link, useParams } from "react-router-dom"
import { useQuiz, useAttemptsByQuiz } from "@/hooks/use-quizzes"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
          <Button
            asChild
            className="bg-secondary-container text-white px-md h-auto py-sm rounded-full font-label-md nudge-hover"
          >
            <Link to={`/quizzes/${quiz.data.id}`}>View quiz</Link>
          </Button>
        )}
      </header>

      <div className="flex-1 p-md">
        {attempts.isLoading ? (
          <LoadingState className="flex-1 p-md" />
        ) : attempts.isError ? (
          <ErrorState
            title="Failed to load attempts"
            message={attempts.error instanceof Error ? attempts.error.message : "Something went wrong"}
            onRetry={() => attempts.refetch()}
            className="flex-1"
          />
        ) : (attempts.data ?? []).length === 0 ? (
          <EmptyState
            icon="how_to_reg"
            title="No attempts yet"
            description="When students take this quiz, their attempts will appear here for review."
          />
        ) : (
          <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-[24px] border border-outline-variant/10 overflow-hidden">
            <Table className="text-left">
              <TableHeader>
                <TableRow className="border-outline-variant/20 font-label-sm text-label-sm text-on-surface-variant">
                  <TableHead className="px-4 py-3 h-auto">Student</TableHead>
                  <TableHead className="px-4 py-3 h-auto">Status</TableHead>
                  <TableHead className="px-4 py-3 h-auto">Score</TableHead>
                  <TableHead className="px-4 py-3 h-auto">Submitted</TableHead>
                  <TableHead className="px-4 py-3 h-auto text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(attempts.data ?? []).map((attempt) => {
                  const violations = (attempt.violations ?? []).length
                  return (
                    <TableRow key={attempt.id} className="border-outline-variant/10">
                      <TableCell className="px-4 py-3 font-body-md text-body-md text-on-surface">
                        {attempt.student?.name ?? "Student"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`border-transparent font-label-sm text-label-sm px-2 py-0.5 ${
                            attempt.status === "COMPLETED"
                              ? "bg-primary-fixed text-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {attempt.status === "COMPLETED" ? "Submitted" : "In progress"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-body-md text-body-md text-on-surface">
                        {attempt.totalScore != null
                          ? `${attempt.totalScore} / ${maxPoints}`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
                        {formatDate(attempt.submittedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {violations > 0 && (
                            <Badge
                              variant="outline"
                              className="border-transparent bg-error/10 text-error font-label-sm text-label-sm px-2 py-0.5 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              {violations}
                            </Badge>
                          )}
                          <Button
                            asChild
                            className="bg-primary text-white px-4 h-auto py-1.5 rounded-full font-label-md text-label-sm nudge-hover"
                          >
                            <Link to={`/quizzes/attempts/${attempt.id}`}>Review</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
