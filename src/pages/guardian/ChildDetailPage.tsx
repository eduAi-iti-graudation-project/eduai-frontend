import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { BackLink } from "@/components/shared/BackLink"
import { RichText } from "@/components/shared/RichText"
import { Button } from "@/components/ui/button"
import { renderReportSection } from "@/lib/report-sections"
import { Badge } from "@/components/ui/badge"
import { WeeklyTimetableGrid } from "@/components/timetable/WeeklyTimetableGrid"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Tab = "grades" | "attendance" | "reports" | "schedule"

const statusStyles: Record<string, string> = {
  PRESENT: "bg-primary-fixed/30 text-primary",
  ABSENT: "bg-error-container text-on-error-container",
  LATE: "bg-surface-container-high text-on-surface",
  EXCUSED: "bg-surface-container-high text-on-surface-variant",
}

export function ChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>("grades")

  const grades = useQuery({
    queryKey: ["student-grades", id],
    queryFn: () => api.getStudentGrades(id!),
    enabled: !!id,
  })

  const attendance = useQuery({
    queryKey: ["student-attendance", id],
    queryFn: () => api.getStudentAttendance(id!),
    enabled: !!id,
  })

  const reports = useQuery({
    queryKey: ["reports", id],
    queryFn: () => api.getReports(id),
    enabled: !!id,
  })

  const studentClasses = useQuery({
    queryKey: ["student", "classes", id],
    queryFn: () => api.getStudentClasses(id!),
    enabled: !!id,
  })

  const sectionIds = (studentClasses.data ?? []).map((s) => s.id)

  const timetable = useQuery({
    queryKey: ["timetable", "student-sections", sectionIds.join(",")],
    queryFn: async () => {
      const all: api.TimetableSlotWithOffering[] = []
      for (const sectionId of sectionIds) {
        const list = await api.getSectionTimetable(sectionId)
        all.push(...list)
      }
      return all
    },
    enabled: sectionIds.length > 0,
  })

  if (grades.isError && attendance.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <ErrorState
          title="Failed to load data"
          message="Something went wrong loading the child's data."
        />
        <div className="pb-xl">
          <Link to="/guardian" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "grades", label: "Grades", icon: "grade" },
    { id: "attendance", label: "Attendance", icon: "calendar_today" },
    { id: "schedule", label: "Schedule", icon: "calendar_month" },
    { id: "reports", label: "Reports", icon: "description" },
  ]

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
        <BackLink to="/guardian" label="Back to Dashboard" />
        <h1 className="font-headline-xl text-headline-xl text-primary">Student Detail</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-md py-sm rounded-lg font-label-md text-label-md h-auto transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground hover:bg-primary-container hover:text-white"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "grades" && (
        <div className="space-y-3">
          {grades.isLoading ? (
            <LoadingState className="w-full" />
          ) : !grades.data || grades.data.length === 0 ? (
            <EmptyState flat icon="grade" title="No grades yet" description="Confirmed grades will appear here." />
          ) : (
            grades.data.filter((g) => g.isConfirmed).map((g) => (
              <div key={g.id} className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Points Awarded</p>
                  <Badge
                    variant="outline"
                    className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0"
                  >
                    {g.pointsAwarded}
                  </Badge>
                </div>
                {g.aiFeedback && (
                  <p className="font-body-md text-body-md text-on-surface-variant">{g.aiFeedback}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div>
          {attendance.isLoading ? (
            <LoadingState className="w-full" />
          ) : !attendance.data || attendance.data.length === 0 ? (
            <EmptyState icon="calendar_today" title="No attendance records" description="Attendance records will appear here once logged." />
          ) : (
            <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-outline-variant bg-surface-container-low hover:bg-transparent">
                    <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Date</TableHead>
                    <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.data.map((r) => (
                    <TableRow key={r.id} className="border-b border-outline-variant hover:bg-surface-container">
                      <TableCell className="px-md py-3 font-body-md text-body-md text-on-surface">
                        {new Date(r.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="px-md py-3 text-right">
                        <Badge
                          variant="outline"
                          className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 ${statusStyles[r.status] ?? "bg-surface-container-high text-on-surface-variant"}`}
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
      )}

      {activeTab === "schedule" && (
        <div>
          {studentClasses.isLoading ? (
            <LoadingState className="w-full" />
          ) : sectionIds.length === 0 ? (
            <EmptyState icon="calendar_month" title="Not enrolled in any classes" description="This student is not enrolled in any classes yet." />
          ) : timetable.isLoading ? (
            <LoadingState className="w-full" />
          ) : !timetable.data || timetable.data.length === 0 ? (
            <EmptyState icon="calendar_month" title="No classes scheduled" description="The school hasn't published a timetable for these classes yet." />
          ) : (
            <WeeklyTimetableGrid slots={timetable.data} showSection />
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-3">
          {reports.isLoading ? (
            <LoadingState className="w-full" />
          ) : !reports.data || reports.data.length === 0 ? (
            <EmptyState icon="description" title="No reports" description="Reports will appear here once generated." />
          ) : (
            reports.data.map((r) => (
              <div key={r.id} className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <RichText text={renderReportSection(r.parentSection)} className="text-on-surface" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
