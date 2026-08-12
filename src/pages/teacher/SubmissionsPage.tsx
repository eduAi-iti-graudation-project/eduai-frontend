import { useState, useCallback, useMemo } from "react"
import { SubmissionCard } from "@/components/teacher/SubmissionCard"
import { useSubmissions } from "@/hooks/use-submissions"
import { toast } from "sonner"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const filterOptions = [
  { value: "", label: "All Statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "GRADING_IN_PROGRESS", label: "Grading in Progress" },
  { value: "CONFIRMED", label: "Confirmed" },
]

export function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [view, setView] = useState<"list" | "grid">("list")
  const [bulkState, setBulkState] = useState<{ pending: number; total: number } | null>(null)
  const { submissions, isLoading, isError, error, gradeSubmission, confirmGrade } = useSubmissions(statusFilter || undefined)

  const submittedSubs = useMemo(
    () => submissions.data?.filter((s) => s.status === "SUBMITTED") ?? [],
    [submissions.data],
  )

  const handleBulkGrade = useCallback(async () => {
    if (submittedSubs.length === 0) return
    setBulkState({ pending: 0, total: submittedSubs.length })
    let completed = 0
    for (const sub of submittedSubs) {
      try {
        await gradeSubmission.mutateAsync(sub.id)
        completed++
        setBulkState({ pending: completed, total: submittedSubs.length })
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toast.error(`Failed to grade ${(sub as any).student?.name ?? "unknown"}`)
      }
    }
    setBulkState(null)
    if (completed === submittedSubs.length) {
      toast.success(`AI review complete for ${completed} submission${completed !== 1 ? "s" : ""}`)
    }
  }, [submittedSubs, gradeSubmission])

  if (isError) {
    return (
      <ErrorState
        title="Failed to load submissions"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => submissions.refetch()}
      />
    )
  }

  return (
    <>
      <div className="flex-grow p-xl max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Submissions Queue</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="w-2 h-2 rounded-lg bg-primary-container" />
              {isLoading ? "Loading..." : `${submissions.data?.length ?? 0} submissions to review`}
            </p>
          </div>
          {!isLoading && submittedSubs.length > 0 && (
            <Button
              onClick={handleBulkGrade}
              disabled={bulkState !== null}
              className="flex items-center gap-xs px-md py-sm h-auto rounded-lg bg-primary text-primary-foreground font-label-md text-label-md active:scale-95 disabled:opacity-50"
            >
              {bulkState ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-lg animate-spin" />AI Reviewing {bulkState.pending}/{bulkState.total}...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">auto_awesome</span>AI Review All ({submittedSubs.length})</>
              )}
            </Button>
          )}
        </div>

        <div className="bg-surface-container-lowest/60 rounded-lg p-md mb-xl flex flex-wrap gap-md items-center justify-between border border-outline-variant">
          <div className="flex items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Filter by:</span>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-auto gap-1 bg-transparent border-b-2 border-outline-variant rounded-none py-1 pr-1 pl-0 focus:border-primary focus:ring-0 text-label-md font-label-md text-on-surface shadow-none [&>svg]:text-on-surface-variant">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || "all"}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`p-xs rounded-lg material-symbols-outlined transition-colors ${
                view === "grid" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              grid_view
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`p-xs rounded-lg material-symbols-outlined transition-colors ${
                view === "list" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              list
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading submissions..." />
        ) : submissions.data?.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <EmptyState
              icon="inbox"
              title="No submissions yet"
              description={statusFilter ? "No submissions match the selected filter." : "Submissions from students will appear here."}
            />
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-md" : "space-y-md"}>
            {submissions.data?.map((sub, idx) => (
              <SubmissionCard key={sub.id} submission={sub} iconIndex={idx} gradeMutation={gradeSubmission} confirmMutation={confirmGrade} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
