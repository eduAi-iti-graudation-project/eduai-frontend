import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HomeStrategiesList } from "@/components/communication/HomeStrategiesList"
import { RichText } from "@/components/shared/RichText"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { BackLink } from "@/components/shared/BackLink"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as api from "@/lib/api"

export function GuardianAlertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const detail = useQuery({
    queryKey: ["guardian-alert", id],
    queryFn: () => api.getGuardianAlertDetail(id!),
    enabled: !!id,
  })

  const grades = useQuery({
    queryKey: ["student-grades", detail.data?.studentId],
    queryFn: () => api.getStudentGrades(detail.data!.studentId),
    enabled: !!detail.data?.studentId,
  })

  if (detail.isLoading) {
    return <LoadingState />
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <ErrorState
          title="Failed to load alert"
          message={detail.error instanceof Error ? detail.error.message : "Something went wrong"}
        />
        <div className="pb-xl">
          <Link to="/guardian" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { guardianContent, diagnosis, studentId, studentName } = detail.data

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <BackLink to="/guardian" label="Back to Dashboard" className="mb-4" />

      <div className="mb-6 border-b border-border pb-3">
        <h1 className="font-headline-xl text-headline-xl text-primary">Academic Update</h1>
        {studentName && (
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            For <span className="font-semibold text-on-surface">{studentName}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-6">
          {guardianContent && (
            <div className="rounded-lg bg-white border border-border p-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-accent-foreground">family_history</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary">Message</h2>
              </div>
              <div className="bg-accent rounded-lg p-4 border border-outline-variant">
                <RichText text={guardianContent.message} className="text-body-md text-on-surface" />
              </div>
            </div>
          )}

          {diagnosis.summary && (
            <div className="rounded-lg bg-white border border-border p-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-on-primary-fixed-variant">psychology</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary">Why this happened</h2>
              </div>
              <RichText text={diagnosis.summary} className="text-body-md text-on-surface" />
            </div>
          )}

          {!guardianContent && !diagnosis.summary && (
            <div className="rounded-lg bg-white border border-border p-md">
              <p className="font-body-md text-body-md text-on-surface">
                No further context is available for this update yet.
              </p>
            </div>
          )}

          {guardianContent && <HomeStrategiesList strategies={guardianContent.homeSupport} />}
        </div>

        <aside className="space-y-4">
          {studentId && (
            <div className="rounded-lg bg-white border border-border p-md">
              <h3 className="font-headline-md text-headline-md text-primary border-b border-border pb-2 mb-3">
                About {studentName ?? "this student"}
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to={`/guardian/children/${studentId}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                    View student detail
                  </Link>
                </li>
                <li>
                  <Link
                    to={`/guardian/insights/students/${studentId}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">monitoring</span>
                    View insights
                  </Link>
                </li>
                <li>
                  <Link
                    to={`/guardian/assistant?student=${studentId}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">smart_toy</span>
                    Ask the Assistant
                  </Link>
                </li>
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-white border border-border overflow-hidden">
            <div className="px-md py-3 border-b border-border">
              <h3 className="font-headline-md text-headline-md text-primary">Recent Grades</h3>
            </div>
            {grades.isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-surface-container-high rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !grades.data || grades.data.length === 0 ? (
              <EmptyState flat icon="grade" title="No grades available yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-surface-container-low hover:bg-transparent">
                    <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Assignment</TableHead>
                    <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Score</TableHead>
                    <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.data.filter((g) => g.isConfirmed).map((g) => (
                    <TableRow key={g.id} className="border-b border-border hover:bg-surface-container">
                      <TableCell className="px-md py-3 font-body-md text-body-md text-on-surface">{g.criterionDescription}</TableCell>
                      <TableCell className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{g.pointsAwarded}</TableCell>
                      <TableCell className="px-md py-3 text-right font-body-md text-body-md text-on-surface-variant">{g.criterionMaxPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}