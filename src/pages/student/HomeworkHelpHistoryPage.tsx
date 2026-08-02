import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useHomeworkHelpHistory } from "@/hooks/use-homework-history"
import { HomeworkHelpCard } from "@/components/student/HomeworkHelpCard"

export function HomeworkHelpHistoryPage() {
  const { user } = useAuth()
  const [classFilter, setClassFilter] = useState("")

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const history = useHomeworkHelpHistory(classFilter || undefined)

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
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        >
          <option value="">All Classes</option>
          {studentClasses.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {history.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 w-24 bg-surface-container-high rounded-full" />
                <div className="h-4 w-16 bg-surface-container-high rounded-full" />
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full mb-2" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded-full mb-4" />
              <div className="h-4 w-full bg-surface-container-high rounded-full mb-2" />
              <div className="h-4 w-2/3 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      ) : history.isError ? (
        <div className="text-center py-xl">
          <span className="material-symbols-outlined text-[48px] text-error mb-md block">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load history</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {history.error instanceof Error ? history.error.message : "Something went wrong"}
          </p>
          <button
            onClick={() => history.refetch()}
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
          >
            Try Again
          </button>
        </div>
      ) : history.data && history.data.length === 0 ? (
        <div className="text-center py-xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">history</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">No past questions yet</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Ask the homework assistant for help and your questions will appear here.
          </p>
          <Link
            to="/student/homework-help"
            className="inline-block bg-primary text-white px-md py-sm rounded-full font-label-md hover:opacity-90 transition-all"
          >
            Ask for homework help →
          </Link>
        </div>
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
