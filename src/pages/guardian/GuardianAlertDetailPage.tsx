import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HomeStrategiesList } from "@/components/communication/HomeStrategiesList"
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

  const { guardianContent, diagnosis } = detail.data

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <BackLink to="/guardian" label="Back to Dashboard" className="mb-4" />

      <div className="mb-6 border-b border-border pb-3">
        <h1 className="font-headline-xl text-headline-xl text-primary">Academic Update</h1>
      </div>

      {guardianContent && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white border border-border p-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-accent-foreground">family_history</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary">Message</h2>
            </div>
            <div className="bg-accent rounded-lg p-4 border border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                {guardianContent.message}
              </p>
            </div>
          </div>

          <HomeStrategiesList strategies={guardianContent.homeSupport} />
        </div>
      )}

      {!guardianContent && diagnosis.summary && (
        <div className="rounded-lg bg-white border border-border p-md">
          <p className="font-body-md text-body-md text-on-surface">{diagnosis.summary}</p>
        </div>
      )}

      <div className="rounded-lg bg-white border border-border overflow-hidden mt-4">
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
    </div>
  )
}
