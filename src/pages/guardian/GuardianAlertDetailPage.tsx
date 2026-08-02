import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAlertDetail } from "@/hooks/use-alert-detail"
import { HomeStrategiesList } from "@/components/communication/HomeStrategiesList"
import * as api from "@/lib/api"

export function GuardianAlertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: detail, isLoading, isError, error } = useAlertDetail(id ?? "")

  const grades = useQuery({
    queryKey: ["student-grades", id],
    queryFn: () => api.getStudentGrades(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>family_history</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Loading alert...</p>
        </div>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load alert</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link to="/guardian" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
      <Link
        to="/guardian"
        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-primary mb-4"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-headline-xl text-headline-xl text-primary">Academic Update</h1>
      </div>

      {detail.guardianContent && (
        <div className="space-y-6">
          <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-tertiary">family_history</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary">Message</h2>
            </div>
            <div className="bg-tertiary-fixed/10 rounded-xl p-4 border border-tertiary-fixed/20">
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                {detail.guardianContent.message}
              </p>
            </div>
          </div>

          <HomeStrategiesList strategies={detail.guardianContent.homeSupport} />
        </div>
      )}

      {!detail.guardianContent && detail.diagnosis.summary && (
        <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
          <p className="font-body-md text-body-md text-on-surface">{detail.diagnosis.summary}</p>
        </div>
      )}

      <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden mt-4">
        <div className="px-md py-3 border-b border-outline-variant/10">
          <h3 className="font-headline-md text-headline-md text-primary">Recent Grades</h3>
        </div>
        {grades.isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-container-high rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !grades.data || grades.data.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">No grades available yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                <th className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3">Assignment</th>
                <th className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3">Score</th>
                <th className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3">Max</th>
              </tr>
            </thead>
            <tbody>
              {grades.data.filter((g) => g.isConfirmed).map((g) => (
                <tr key={g.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors">
                  <td className="px-md py-3 font-body-md text-body-md text-on-surface">{g.criterionDescription}</td>
                  <td className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{g.pointsAwarded}</td>
                  <td className="px-md py-3 text-right font-body-md text-body-md text-on-surface-variant">{g.criterionMaxPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
