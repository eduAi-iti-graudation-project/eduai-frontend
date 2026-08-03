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
          <Link to="/alerts" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
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
            <h1 className="font-headline-xl text-headline-xl text-primary">Alert Detail</h1>
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
            className="bg-primary-container text-white px-md h-auto py-sm rounded-full font-label-md text-label-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Resolve
          </Button>
          <Button
            type="button"
            onClick={() => resolve.mutate("DISMISSED")}
            disabled={resolve.isPending}
            className="bg-surface-container text-on-surface-variant px-md h-auto py-sm rounded-full font-label-md text-label-sm hover:bg-surface-container-high disabled:opacity-50 transition-all"
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

        {detail.managementSummary && <ManagementSummarySection summary={detail.managementSummary} />}

        {detail.teacherContent && detail.teacherContent.resourceSuggestions.length > 0 && (
          <div className="flex items-center justify-center pt-2">
            <Button
              asChild
              className="inline-flex items-center gap-2 bg-surface-container-low text-on-surface-variant px-lg h-auto py-sm rounded-full font-label-md text-label-sm hover:bg-surface-container-high transition-colors"
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
