import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { useSubmissions } from "@/hooks/use-submissions"

export function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const { submissions, isLoading, gradeSubmission, confirmGrade } = useSubmissions(
    statusFilter || undefined,
  )

  const statusColors: Record<string, string> = {
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    GRADING_IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW_READY: "bg-purple-100 text-purple-800",
    CONFIRMED: "bg-green-100 text-green-800",
  }

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Submitted",
    GRADING_IN_PROGRESS: "Grading...",
    REVIEW_READY: "Review Ready",
    CONFIRMED: "Confirmed",
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20 sticky top-0 z-30">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Submissions</h1>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            >
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADING_IN_PROGRESS">Grading in progress</option>
              <option value="REVIEW_READY">Review ready</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
        </header>

        <div className="flex-1 p-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-body-md text-body-md text-on-surface-variant">Loading submissions...</p>
            </div>
          ) : submissions.data?.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">inbox</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-2">No submissions yet</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Submissions from students will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {submissions.data?.map((sub) => (
                <div
                  key={sub.id}
                  className="tactile-card rounded-[24px] bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-headline-md text-headline-md text-on-surface truncate">
                        {sub.student?.name ?? "Unknown Student"}
                      </span>
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${statusColors[sub.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[sub.status] ?? sub.status}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant truncate">
                      {sub.student?.email ?? ""}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      Submitted {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub.scores && sub.scores.length > 0 && (
                      <div className="text-right">
                        <p className="font-headline-md text-headline-md text-on-surface">
                          {sub.scores.reduce((sum, s) => sum + s.pointsAwarded, 0)}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">points</p>
                      </div>
                    )}

                    {sub.status === "SUBMITTED" && (
                      <button
                        onClick={() => gradeSubmission.mutate(sub.id)}
                        disabled={gradeSubmission.isPending}
                        className="submit-button-gradient text-white rounded-xl px-4 py-2 font-label-sm text-label-sm transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px] mr-1">auto_awesome</span>
                        Grade
                      </button>
                    )}

                    {sub.status === "REVIEW_READY" && (
                      <button
                        onClick={() => {
                          const total = sub.scores?.reduce((s, sc) => s + sc.pointsAwarded, 0) ?? 0
                          confirmGrade.mutate({ id: sub.id, data: { pointsAwarded: total } })
                        }}
                        disabled={confirmGrade.isPending}
                        className="bg-primary text-on-primary rounded-xl px-4 py-2 font-label-sm text-label-sm transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
