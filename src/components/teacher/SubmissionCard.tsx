import { Link } from "react-router-dom"
import type { SubmissionEnriched } from "@/lib/api"
import type { UseMutationResult } from "@tanstack/react-query"

interface SubmissionCardProps {
 submission: SubmissionEnriched
 iconIndex: number
 gradeMutation: UseMutationResult<unknown, Error, string>
 confirmMutation: UseMutationResult<unknown, Error, SubmissionEnriched>
}

const statusConfigs: Record<string, { label: string; badge: string }> = {
 SUBMITTED: {
  label: "Submitted",
  badge: "bg-surface-container-high text-on-surface",
 },
 GRADING_IN_PROGRESS: {
  label: "Grading...",
  badge: "bg-surface-container-high text-on-surface",
 },
 REVIEW_READY: {
  label: "Review Ready",
  badge: "bg-primary text-primary-foreground",
 },
 CONFIRMED: {
  label: "Confirmed",
  badge: "bg-primary text-primary-foreground",
 },
}

const assignmentIcons = [
 "functions",
 "menu_book",
 "biotech",
 "history_edu",
 "language",
 "palette",
]

export function SubmissionCard({
 submission,
 iconIndex,
 gradeMutation,
 confirmMutation,
}: SubmissionCardProps) {
 const config = statusConfigs[submission.status] ?? statusConfigs.SUBMITTED
 const iconKey = assignmentIcons[iconIndex % assignmentIcons.length]
 const totalPoints = submission.scores?.reduce((sum, s) => sum + s.pointsAwarded, 0) ?? 0

 return (
  <div className="bg-background rounded-lg p-md border border-border flex items-center gap-md group hover:shadow-card-hover transition-all nudge-hover relative overflow-hidden">
   <div className="relative z-10 flex items-center gap-md w-full">
    <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center text-primary shrink-0">
     <span className="material-symbols-outlined text-3xl">{iconKey}</span>
    </div>

    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 mb-1">
      <span className="font-headline-md text-headline-md text-on-surface truncate">
       {submission.student?.name ?? "Unknown Student"}
      </span>
      <span className={`font-label-sm text-label-sm px-sm py-1 rounded-lg ${config.badge}`}>
       {config.label}
      </span>
     </div>
     <p className="font-body-md text-body-md text-on-surface-variant truncate">
      {submission.student?.email ?? ""}
     </p>
     <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
      Submitted {new Date(submission.createdAt).toLocaleDateString()}
     </p>
    </div>

    <div className="flex items-center gap-3 shrink-0">
     <Link
      to={`/submissions/${submission.id}`}
      className="flex items-center gap-1 px-md py-sm border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all"
     >
      <span className="material-symbols-outlined text-[16px]">visibility</span>
      View Submission
     </Link>

     {submission.scores && submission.scores.length > 0 && (
      <div className="text-right">
       <p className="font-headline-md text-headline-md text-on-surface">{totalPoints}</p>
       <p className="font-label-sm text-label-sm text-on-surface-variant">points</p>
      </div>
     )}

     {submission.status === "SUBMITTED" && (
      <button
       onClick={() => gradeMutation.mutate(submission.id)}
       disabled={gradeMutation.isPending}
       className="flex items-center gap-1 px-md py-sm bg-primary text-primary-foreground rounded-lg font-label-md text-label-md active:scale-95 disabled:opacity-50"
      >
       <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
       Grade
      </button>
     )}

     {submission.status === "REVIEW_READY" && (
      <button
       onClick={() => {
        confirmMutation.mutate(submission)
       }}
       disabled={confirmMutation.isPending}
       className="flex items-center gap-1 px-md py-sm bg-primary text-primary-foreground rounded-lg font-label-md text-label-md active:scale-95 disabled:opacity-50"
      >
       <span className="material-symbols-outlined text-[16px]">check_circle</span>
       Confirm
      </button>
     )}

     {submission.status === "GRADING_IN_PROGRESS" && (
      <div className="flex items-center gap-2 px-md py-sm">
       <span className="w-2 h-2 bg-primary-fixed-dim rounded-lg animate-pulse" />
       <span className="font-label-sm text-label-sm text-on-surface-variant">Grading...</span>
      </div>
     )}
    </div>
   </div>
  </div>
 )
}
