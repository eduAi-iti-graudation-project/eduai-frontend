import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useSubmissions } from "@/hooks/use-submissions"
import { useRubrics } from "@/hooks/use-rubrics"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { SubmissionStatus } from "@/components/ui/StatusBadge"

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const assignmentQuery = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => api.getAssignment(id!),
    enabled: !!id,
  })

  const assignment = assignmentQuery.data
  const { submissions: submissionsQuery, isLoading: subsLoading } = useSubmissions(undefined, id)
  const { rubrics: rubricsQuery } = useRubrics(id)

  const subs = submissionsQuery.data ?? []
  const rubricList = rubricsQuery.data ?? []
  const confirmedRubric = rubricList.find((r) => r.isConfirmed)
  const classId = assignment?.classId

  if (assignmentQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading assignment...</p>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <EmptyState icon="error" title="Assignment not found" description="This assignment may have been deleted." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
      <Link to={classId ? `/classes/${classId}` : "/assignments/new"} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        {classId ? "Back to Class" : "Back"}
      </Link>

      <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10 mb-xl">
        <div className="flex items-start justify-between gap-md mb-md">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">{assignment.title}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Due {new Date(assignment.dueDate).toLocaleDateString()} &bull; {assignment.totalPoints} pts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-2 space-y-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">Submissions</h2>
            <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">{subs.length} total</span>
          </div>

          {subsLoading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading submissions...</p>
          ) : subs.length === 0 ? (
            <EmptyState icon="inbox" title="No submissions yet" description="Submissions will appear here once students submit their work." />
          ) : (
            <div className="space-y-sm">
              {subs.map((sub) => (
                <Link key={sub.id} to={`/submissions/${sub.id}`} className="block bg-white rounded-3xl p-md shadow-sm border border-outline-variant/10 hover:border-primary-container/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <span className="font-label-md text-label-md text-on-surface">{(sub as any).student?.name ?? "Unknown Student"}</span>
                      <StatusBadge status={(sub.status as SubmissionStatus) ?? "SUBMITTED"} />
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(sub as any).scores?.some((s: any) => s.isConfirmed) && (
                      <span className="font-label-sm text-label-sm text-primary">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(sub as any).scores.filter((s: any) => s.isConfirmed).reduce((a: number, s: any) => a + s.pointsAwarded, 0)} / {assignment.totalPoints} pts
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-md">
          <div className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10">
            <h3 className="font-headline-md text-headline-md text-primary mb-md">Rubric</h3>
            {confirmedRubric ? (
              <div className="space-y-sm">
                <p className="font-label-md text-label-md text-on-surface">{confirmedRubric.title}</p>
                {confirmedRubric.criteria.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-sm border-b border-outline-variant/10 last:border-none">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{c.description}</span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">{c.maxPoints} pts</span>
                  </div>
                ))}
              </div>
            ) : rubricList.length > 0 ? (
              <div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">Rubric not yet confirmed</p>
                <Link to={`/rubrics?assignmentId=${id}`} className="text-primary font-label-md">Review Rubric</Link>
              </div>
            ) : (
              <div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">No rubric yet</p>
                <Link to={`/rubrics/new?assignmentId=${id}`} className="inline-flex items-center gap-xs px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover">
                  <span className="material-symbols-outlined text-[18px]">add</span>Create Rubric
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10">
            <h4 className="font-label-md text-label-md text-primary mb-sm">Quick Actions</h4>
            <div className="space-y-sm">
              <Link to={`/submissions?assignmentId=${id}`} className="flex items-center gap-sm px-sm py-sm rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-primary-container">list_alt</span>
                <span className="font-label-sm text-label-sm">All Submissions</span>
              </Link>
              <Link to={`/rubrics?assignmentId=${id}`} className="flex items-center gap-sm px-sm py-sm rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-primary-container">assignment</span>
                <span className="font-label-sm text-label-sm">Manage Rubrics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
