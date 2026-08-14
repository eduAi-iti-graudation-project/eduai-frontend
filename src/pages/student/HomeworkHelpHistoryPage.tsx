import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useHomeworkHelpHistory } from "@/hooks/use-homework-history"
import { HomeworkHelpCard } from "@/components/student/HomeworkHelpCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"

export function HomeworkHelpHistoryPage() {
  const { user } = useAuth()
  const [courseFilter, setCourseFilter] = useState("")

  const studentClasses = useQuery({
    queryKey: ["student", "courses", user?.id],
    queryFn: () => api.getStudentCourses(user!.id),
    enabled: !!user?.id,
  })

  const history = useHomeworkHelpHistory(courseFilter || undefined)

  return (
    <div className="flex-1 p-xl max-w-3xl mx-auto w-full">
      <header className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Help History</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Past questions you asked the homework assistant
          </p>
        </div>
        <Link
          to="/student/homework-help"
          className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </Link>
      </header>

      <div className="mb-lg">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[180px]">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            {studentClasses.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {history.isLoading ? (
        <LoadingState />
      ) : history.isError ? (
        <ErrorState
          title="Failed to load history"
          message={history.error instanceof Error ? history.error.message : "Something went wrong"}
          onRetry={() => history.refetch()}
        />
      ) : history.data && history.data.length === 0 ? (
        <EmptyState
          icon="history"
          title="No past questions yet"
          description="Ask the homework assistant for help and your questions will appear here."
          action={
            <Link
              to="/student/homework-help"
              className="inline-block bg-primary text-white px-md py-sm rounded-lg font-label-md hover:opacity-90 transition-all"
            >
              Ask for homework help →
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {(history.data ?? []).map((interaction) => (
            <HomeworkHelpCard key={interaction.id} interaction={interaction} />
          ))}
        </div>
      )}
    </div>
  )
}
