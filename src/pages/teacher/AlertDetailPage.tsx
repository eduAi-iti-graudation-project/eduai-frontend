import { useParams, Link, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAlertDetail } from "@/hooks/use-alert-detail"
import { AlertDetailDiagnosis } from "@/components/communication/AlertDetailDiagnosis"
import { TeacherAnalysisSection } from "@/components/communication/TeacherAnalysisSection"
import { TeacherFeedbackSection } from "@/components/communication/TeacherFeedbackSection"
import { GuardianMessagePreview } from "@/components/communication/GuardianMessagePreview"
import { ManagementSummarySection } from "@/components/communication/ManagementSummarySection"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import * as api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>()
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
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load alert</h2>
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
    <div className="flex-1 overflow-y-auto p-xl max-w-4xl mx-auto w-full">
      <Link
        to="/alerts"
        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-primary mb-4"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Alerts
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">Alert Detail</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {detail.diagnosis.issueType?.replace(/_/g, " ") ?? "Student"} issue
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="space-y-4">
        <AlertDetailDiagnosis diagnosis={detail.diagnosis} />

        {detail.teacherContent && <TeacherAnalysisSection content={detail.teacherContent} />}

        {detail.teacherFeedback && <TeacherFeedbackSection content={detail.teacherFeedback} />}

        {detail.guardianContent && <GuardianMessagePreview content={detail.guardianContent} />}

        {detail.recommendations && detail.recommendations.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h2 className="font-label-md text-label-md text-primary flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px]">spark</span>
              Recommended practice
            </h2>
            <div className="space-y-2">
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
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700",
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

        {detail.managementSummary && <ManagementSummarySection summary={detail.managementSummary} />}

        {detail.teacherContent && detail.teacherContent.resourceSuggestions.length > 0 && (
          <div className="flex items-center justify-center pt-2">
            <Button
              asChild
              className="inline-flex items-center gap-2 bg-surface-container-low text-on-surface-variant px-lg h-auto py-sm rounded-lg font-label-md text-label-sm hover:bg-surface-container-high transition-colors"
            >
              <Link to="/reports">
                <span className="material-symbols-outlined text-[18px]">description</span>
                View Full Report
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
