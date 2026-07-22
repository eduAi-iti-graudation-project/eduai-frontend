import { useState, useCallback, useMemo } from "react"
import { SubmissionCard } from "@/components/teacher/SubmissionCard"
import { useSubmissions } from "@/hooks/use-submissions"
import { toast } from "sonner"

const filterOptions = [
  { value: "", label: "All Statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "GRADING_IN_PROGRESS", label: "Grading in Progress" },
  { value: "REVIEW_READY", label: "Review Ready" },
  { value: "CONFIRMED", label: "Confirmed" },
]

export function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
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
      <div className="flex items-center justify-center h-full p-md">
        <div className="text-center w-full">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Failed to load submissions</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">{error?.message ?? "Something went wrong"}</p>
          <button onClick={() => submissions.refetch()} className="px-md py-sm bg-secondary-container text-white rounded-full font-label-md text-label-md shadow-lg nudge-hover">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob absolute -top-20 -left-20 w-96 h-96 bg-primary-fixed rounded-full animate-pulse" />
        <div className="blob absolute top-1/2 -right-20 w-80 h-80 bg-secondary-fixed rounded-full" style={{ animation: "bounce 10s infinite" }} />
        <div className="blob absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-tertiary-fixed rounded-full opacity-20" />
      </div>

      <div className="flex-grow p-xl max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-primary mb-xs">Submissions Queue</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              {isLoading ? "Loading..." : `${submissions.data?.length ?? 0} submissions to review`}
            </p>
          </div>
          {!isLoading && submittedSubs.length > 0 && (
            <button onClick={handleBulkGrade} disabled={bulkState !== null} className="flex items-center gap-xs px-md py-sm bg-secondary-container text-white rounded-full font-label-md text-label-md shadow-lg nudge-hover active:scale-95 disabled:opacity-50">
              {bulkState ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />AI Reviewing {bulkState.pending}/{bulkState.total}...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">auto_awesome</span>AI Review All ({submittedSubs.length})</>
              )}
            </button>
          )}
        </div>

        <div className="bg-surface-container-lowest/60 backdrop-blur-md rounded-3xl p-md mb-xl flex flex-wrap gap-md items-center justify-between border border-outline-variant/30">
          <div className="flex items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Filter by:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent border-b-2 border-outline-variant py-1 pr-base focus:border-primary outline-none text-label-md font-label-md text-on-surface">
              {filterOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex gap-sm">
            <button className="p-xs text-primary bg-primary-fixed/20 rounded-lg material-symbols-outlined">grid_view</button>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container rounded-lg material-symbols-outlined">list</button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[32px] p-md border border-outline-variant/10 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 bg-surface-container-high rounded-full" />
                    <div className="h-4 w-32 bg-surface-container-high rounded-full" />
                  </div>
                  <div className="h-8 w-20 bg-surface-container-high rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.data?.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">inbox</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-2">No submissions yet</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{statusFilter ? "No submissions match the selected filter." : "Submissions from students will appear here."}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-md">
            {submissions.data?.map((sub, idx) => (
              <SubmissionCard key={sub.id} submission={sub} iconIndex={idx} gradeMutation={gradeSubmission} confirmMutation={confirmGrade} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
