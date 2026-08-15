import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { BackLink } from "@/components/shared/BackLink"
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
        <BackLink to="/student/homework-help" label="Back" />
      </header>

      <div className="mb-lg">
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Course</label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger aria-label="Course" className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              {studentClasses.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
