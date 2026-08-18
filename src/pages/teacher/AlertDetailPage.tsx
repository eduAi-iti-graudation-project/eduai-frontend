import { useParams, Link, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAlertDetail } from "@/hooks/use-alert-detail"
import { AlertDetailDiagnosis } from "@/components/communication/AlertDetailDiagnosis"
import { TeacherAnalysisSection } from "@/components/communication/TeacherAnalysisSection"
import { TeacherFeedbackSection } from "@/components/communication/TeacherFeedbackSection"
import { ManagementSummarySection } from "@/components/communication/ManagementSummarySection"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import * as api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function issueLabel(diagnosis: api.DiagnosisPayload): string {
  const attribution =
    diagnosis.attribution ??
    (diagnosis.issueType === "CLASS_ISSUE"
      ? "CLASS"
      : diagnosis.issueType === "BOTH"
       ? "BOTH"
       : diagnosis.issueType === "STUDENT_ISSUE"
        ? "STUDENT"
        : null)
  if (attribution === "CLASS") return "Class issue"
  if (attribution === "BOTH") return "Student and class issue"
  return "Student issue"
}

const SEVERITY_META: Record<string, { icon: string; label: string; class: string }> = {
  HIGH: { icon: "error", label: "High", class: "bg-error-container/40 text-error border border-error-container" },
  MEDIUM: { icon: "warning", label: "Medium", class: "bg-primary-container/40 text-primary border border-primary-container" },
  LOW: { icon: "info", label: "Low", class: "bg-surface-container-high text-on-surface-variant border border-outline-variant" },
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
   <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest border border-outline-variant p-md">
    <div className="w-10 h-10 rounded-lg bg-primary-fixed/20 flex items-center justify-center shrink-0">
     <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
    </div>
    <div className="min-w-0">
     <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
     <p className="font-label-lg text-label-lg text-on-surface truncate">{value}</p>
     {sub ? <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{sub}</p> : null}
    </div>
   </div>
  )
}

export function AlertDetailPage() { const { alertId } = useParams<{ alertId: string }>()
 const navigate = useNavigate()
 const queryClient = useQueryClient()
 const { data: detail, isLoading, isError, error } = useAlertDetail(alertId ?? "")

 const resolve = useMutation({
  mutationFn: (status: "RESOLVED" | "DISMISSED") => api.resolveAlert(alertId!, status),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["alerts"] })
   toast.success("Alert updated")
   navigate("/alerts")
  },
  onError: (err: Error) => toast.error(err.message),
 })

 if (isLoading) {
  return (
   <LoadingState className="flex-1 p-md" />
  )
 }

 if (isError) {
  return (
   <div className="flex items-center justify-center h-full p-xl">
    <div className="text-center">
     <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
     <h2 className="font-headline-md text-headline-md text-primary mb-sm">Failed to load alert</h2>
     <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
      {error instanceof Error ? error.message : "Something went wrong"}
     </p>
     <Link to="/alerts" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md">
      Back to Alerts
     </Link>
    </div>
   </div>
  )
 }

 if (!detail) return null

 return (
  <div className="flex-1 overflow-y-auto p-xl w-full">
   <Link
    to="/alerts"
    className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-primary mb-4"
   >
    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
    Back to Alerts
   </Link>

   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
    <div>
     <div className="flex items-center gap-2 mb-1">
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
      <h1 className="font-headline-xl text-headline-xl text-primary">Alert Detail</h1>
      {detail.diagnosis.severity ? (
       <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-lg ${SEVERITY_META[detail.diagnosis.severity]?.class}`}>
        {detail.diagnosis.severity === "HIGH" && "⨯ "}
        {detail.diagnosis.severity === "MEDIUM" && "△ "}
        {detail.diagnosis.severity === "LOW" && "◯ "}
        {SEVERITY_META[detail.diagnosis.severity]?.label}
       </span>
      ) : null}
     </div>
     <p className="font-body-lg text-body-lg text-on-surface-variant">{issueLabel(detail.diagnosis)}</p>
    </div>

    <div className="flex items-center gap-2">
     <Button
      asChild
      className="bg-surface-container-low text-on-surface-variant px-md h-auto py-sm rounded-lg font-label-md text-label-sm hover:bg-surface-container-high transition-colors"
     >
      <Link to="/reports">
       <span className="material-symbols-outlined text-[18px]">description</span>
       View Full Report
      </Link>
     </Button>
     <Button
      type="button"
      onClick={() => resolve.mutate("RESOLVED")}
      disabled={resolve.isPending}
      className="bg-primary text-primary-foreground px-md h-auto py-sm rounded-lg font-label-md text-label-sm hover:opacity-90 disabled:opacity-50 transition-all"
     >
      Resolve
     </Button>
     <Button
      type="button"
      onClick={() => resolve.mutate("DISMISSED")}
      disabled={resolve.isPending}
      className="bg-surface-container text-on-surface-variant px-md h-auto py-sm rounded-lg font-label-md text-label-sm hover:bg-surface-container-high disabled:opacity-50 transition-all"
     >
      Dismiss
     </Button>
    </div>
   </div>

   <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
    <StatCard icon="campaign" label="Issue" value={issueLabel(detail.diagnosis)} />
    <StatCard
     icon="insights"
     label="Class average"
     value={typeof detail.diagnosis.classStats?.classAvgPct === "number" ? `${detail.diagnosis.classStats.classAvgPct}%` : "—"}
     sub={typeof detail.diagnosis.classStats?.studentCount === "number" ? `${detail.diagnosis.classStats.studentCount} students` : undefined}
    />
    <StatCard
     icon="trending_down"
     label="Below average"
     value={typeof detail.diagnosis.classStats?.belowAverageCount === "number" ? String(detail.diagnosis.classStats.belowAverageCount) : "—"}
     sub={typeof detail.diagnosis.classStats?.droppingCount === "number" ? `${detail.diagnosis.classStats.droppingCount} dropping` : undefined}
    />
    <StatCard
     icon="recommend"
     label="Practice sets"
     value={String(detail.recommendations?.length ?? 0)}
     sub={detail.recommendations?.length ? "recommended for student" : undefined}
    />
   </div>

   <AlertDetailDiagnosis diagnosis={detail.diagnosis} />

   {detail.teacherContent && (
    <div className="mt-4">
     <TeacherAnalysisSection content={detail.teacherContent} />
    </div>
   )}

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
    {detail.teacherFeedback && <TeacherFeedbackSection content={detail.teacherFeedback} />}

    {detail.managementSummary && <ManagementSummarySection summary={detail.managementSummary} />}
   </div>

   {detail.recommendations && detail.recommendations.length > 0 && (
    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
     <h2 className="font-label-md text-label-md text-primary flex items-center gap-2 mb-3">
      <span className="material-symbols-outlined text-[18px]">spark</span>
      Recommended practice
     </h2>
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {detail.recommendations.map((r) => (
       <div
        key={r.id}
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
       >
        <div className="min-w-0">
         <p className="font-label-md text-label-md text-on-surface truncate">{r.topic}</p>
         <p className="font-label-sm text-label-sm text-on-surface-variant">
          {new Date(r.createdAt).toLocaleString()}
         </p>
        </div>
        <span
         className={cn(
          "font-label-sm text-label-sm rounded-full px-2 py-0.5 shrink-0",
          r.status === "READY"
           ? "bg-success/15 text-success"
           : r.status === "FAILED"
            ? "bg-danger/15 text-danger"
            : "bg-highlight/20 text-highlight",
         )}
        >
         {r.status === "PROCESSING" ? r.stage : r.status.toLowerCase()}
        </span>
       </div>
      ))}
     </div>
     <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
      The student sees this practice set in Study Lab under "Recommended practice" — remind them to complete it before the next assessment.
     </p>
    </div>
   )}
  </div>
 )
}
