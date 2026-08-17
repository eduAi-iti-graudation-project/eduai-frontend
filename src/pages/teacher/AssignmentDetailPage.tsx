import { useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useSubmissions } from "@/hooks/use-submissions"
import { useRubrics } from "@/hooks/use-rubrics"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
 const classId = assignment?.courseOfferingId

 const submittedCount = subs.filter((s) => s.status === "SUBMITTED").length
 const gradedCount = subs.filter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s) => (s as any).scores?.some((score: any) => score.isConfirmed),
 ).length
 const gradedTotal = subs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .flatMap((s) => (s as any).scores ?? [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .filter((score: any) => score.isConfirmed)
  .reduce((sum, score) => sum + score.pointsAwarded, 0)
 const avgScore = gradedCount > 0 ? Math.round((gradedTotal / (gradedCount * assignment!.totalPoints)) * 100) : null
 const overDue = useMemo(
  () => assignment ? new Date(assignment.dueDate).getTime() < new Date().getTime() : false,
  [assignment],
 )

 if (assignmentQuery.isLoading) {
  return <LoadingState label="Loading assignment..." />
 }

 if (!assignment) {
  return (
   <div className="flex items-center justify-center h-full p-xl">
    <EmptyState icon="error" title="Assignment not found" description="This assignment may have been deleted." />
   </div>
  )
 }

 const stats = [
  { label: "Submissions", value: String(subs.length), icon: "inbox" },
  { label: "Pending Review", value: String(submittedCount), icon: "pending_actions" },
  { label: "Graded", value: String(gradedCount), icon: "fact_check" },
  { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—", icon: "analytics" },
 ]

 return (
  <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
   <Link to={classId ? `/classes/${classId}` : "/assignments/new"} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
    {classId ? "Back to Class" : "Back"}
   </Link>

   <div className="bg-surface-container-lowest rounded-lg p-xl mb-xl">
    <div className="flex items-start justify-between gap-md mb-md">
     <div>
      <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">{assignment.title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
       Due {new Date(assignment.dueDate).toLocaleDateString()} &bull; {assignment.totalPoints} pts
      </p>
     </div>
     <div className="flex items-center gap-2 shrink-0">
      <Badge
       variant="outline"
       className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border-0 ${
        overDue ? "bg-error-container text-on-error-container" : "bg-primary text-primary-foreground"
       }`}
      >
       {overDue ? "Overdue" : "Open"}
      </Badge>
      <Button asChild className="inline-flex items-center gap-xs px-md py-1.5 h-auto rounded-full bg-primary text-primary-foreground font-label-sm text-label-sm hover:bg-primary/90">
       <Link to={`/submissions?assignmentId=${id}`}>
        <span className="material-symbols-outlined text-[16px]">list_alt</span>
        Review Submissions
       </Link>
      </Button>
     </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
     {stats.map((stat) => (
      <div key={stat.label} className="rounded-lg bg-surface-container-low p-md">
       <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{stat.icon}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{stat.label}</span>
       </div>
       <p className="font-headline-md text-headline-md text-on-surface">{stat.value}</p>
      </div>
     ))}
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
    <div className="lg:col-span-2 space-y-md">
     <div className="flex items-center justify-between">
      <h2 className="font-headline-md text-headline-md text-primary">Submissions</h2>
      <Badge variant="outline" className="bg-primary text-primary-foreground font-label-sm text-label-sm px-sm py-0.5 rounded-full border-0">{subs.length} total</Badge>
     </div>

     {subsLoading ? (
      <LoadingState label="Loading submissions..." />
     ) : subs.length === 0 ? (
      <EmptyState icon="inbox" title="No submissions yet" description="Submissions will appear here once students submit their work." />
     ) : (
      <div className="space-y-sm">
       {subs.map((sub) => (
        <Link key={sub.id} to={`/submissions/${sub.id}`} className="block bg-surface-container-lowest rounded-lg p-md hover:border-primary transition-colors">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
           {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
           <span className="font-label-md text-label-md text-on-surface">{(sub as any).student?.name ?? "Unknown Student"}</span>
           <StatusBadge status={(sub.status as SubmissionStatus) ?? "SUBMITTED"} />
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(sub as any).scores?.some((s: any) => s.isConfirmed) && (
           <span className="font-label-sm text-label-sm text-primary font-medium">
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
     <div className="bg-surface-container-lowest rounded-lg p-md ">
      <h3 className="font-headline-md text-headline-md text-primary mb-md">Rubric</h3>
      {confirmedRubric ? (
       <div className="space-y-sm">
        <div className="flex items-center justify-between gap-2">
         <p className="font-label-md text-label-md text-on-surface truncate">{confirmedRubric.title}</p>
         <Badge className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-label-sm text-label-sm border-0 shrink-0">Confirmed</Badge>
        </div>
        {confirmedRubric.criteria.map((c) => (
         <div key={c.id} className="flex items-center justify-between py-sm border-b border-outline-variant last:border-none">
          <span className="font-label-sm text-label-sm text-on-surface-variant">{c.description}</span>
          <span className="font-label-sm text-label-sm text-primary font-semibold shrink-0 ml-3">{c.maxPoints} pts</span>
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
        <Button asChild className="inline-flex items-center gap-xs px-md py-sm h-auto rounded-full bg-primary text-primary-foreground font-label-md text-label-md">
         <Link to={`/rubrics/new?assignmentId=${id}`}>
          <span className="material-symbols-outlined text-[18px]">add</span>Create Rubric
         </Link>
        </Button>
       </div>
      )}
     </div>

     <div className="bg-surface-container-lowest rounded-lg p-md ">
      <h4 className="font-headline-sm text-headline-sm text-primary mb-sm">Quick Actions</h4>
      <div className="space-y-sm">
       <Link to={`/submissions?assignmentId=${id}`} className="flex items-center gap-sm px-sm py-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">list_alt</span>
        <span className="font-label-sm text-label-sm">All Submissions</span>
       </Link>
       <Link to={`/rubrics?assignmentId=${id}`} className="flex items-center gap-sm px-sm py-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">assignment</span>
        <span className="font-label-sm text-label-sm">Manage Rubrics</span>
       </Link>
      </div>
     </div>
    </div>
   </div>
  </div>
 )
}
