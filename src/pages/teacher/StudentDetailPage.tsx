import { useParams, Link } from "react-router-dom"
import { useStudentGrades } from "@/hooks/use-students"
import { useStudentAttendance } from "@/hooks/use-attendance"
import { useReports } from "@/hooks/use-reports"
import { EmptyState } from "@/components/ui/EmptyState"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const attendanceStatusClasses: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-700",
  EXCUSED: "bg-gray-100 text-gray-700",
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: grades, isLoading: gradesLoading } = useStudentGrades(id ?? "")
  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance(id ?? "")
  const { reports, isLoading: reportsLoading } = useReports(id)

  return (
    <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
      <Link to="/classes" className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Classes
      </Link>

      <div className="flex items-center gap-md mb-xl">
        <div className="w-16 h-16 bg-primary-container rounded-3xl flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <div className="flex-1">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Student Detail</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">ID: {id}</p>
        </div>
        {id ? (
          <Link
            to={`/insights/students/${id}`}
            className="inline-flex items-center gap-xs bg-primary-container text-white font-label-md text-label-md px-lg py-sm rounded-full hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            Insights
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10">
          <h2 className="font-headline-md text-headline-md text-primary mb-md">Grades</h2>
          {gradesLoading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
          ) : !grades || grades.length === 0 ? (
            <EmptyState icon="grade" title="No grades yet" description="Confirmed grades will appear here." />
          ) : (
            <div className="space-y-sm">
              {grades.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-sm border-b border-outline-variant/10 last:border-none">
                  <div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-label-md text-label-md text-on-surface">{(g as any).assignment?.title ?? "Assignment"}</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{(g as any).assignment?.totalPoints ?? "?"} pts</p>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <span className="font-label-md text-label-md text-primary font-semibold">{g.pointsAwarded} / {(g as any).maxPoints ?? "?"} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10">
          <h2 className="font-headline-md text-headline-md text-primary mb-md">Attendance</h2>
          {attendanceLoading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
          ) : !attendance || attendance.length === 0 ? (
            <EmptyState icon="calendar_month" title="No attendance records" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-outline-variant/20 hover:bg-transparent">
                    <TableHead className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Date</TableHead>
                    <TableHead className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((r) => (
                    <TableRow key={r.id} className="border-b border-outline-variant/10 last:border-none hover:bg-transparent">
                      <TableCell className="px-3 py-2 font-label-sm text-label-sm text-on-surface">{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm border-0",
                            attendanceStatusClasses[r.status] ?? "bg-gray-100 text-gray-700",
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10 lg:col-span-2">
          <h2 className="font-headline-md text-headline-md text-primary mb-md">Reports</h2>
          {reportsLoading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
          ) : reports.length === 0 ? (
            <EmptyState icon="description" title="No reports yet" description="Reports will appear here once generated." />
          ) : (
            <div className="space-y-sm">
              {reports.map((r) => (
                <div key={r.id} className="p-md rounded-2xl bg-surface-container hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between mb-sm">
                    <p className="font-label-md text-label-md text-on-surface">Report</p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {[
                    ["Teacher Section", r.teacherSection],
                    ["Parent Section", r.parentSection],
                    ["Management Section", r.managementSection],
                  ].map(([heading, content]) => (
                    <div key={heading} className="mt-sm p-sm rounded-xl bg-white">
                      <p className="font-label-sm text-label-sm text-primary mb-xs">{heading}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">{content || "No content available."}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
