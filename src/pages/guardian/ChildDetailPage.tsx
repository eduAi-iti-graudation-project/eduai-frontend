import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

type Tab = "grades" | "attendance" | "reports"

const statusStyles: Record<string, string> = {
  PRESENT: "bg-primary-fixed/30 text-primary",
  ABSENT: "bg-error-container text-error",
  LATE: "bg-tertiary-fixed text-on-tertiary-fixed",
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

  if (grades.isError && attendance.isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load data</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">Something went wrong loading the child's data.</p>
          <Link to="/guardian" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "grades", label: "Grades", icon: "grade" },
    { id: "attendance", label: "Attendance", icon: "calendar_today" },
    { id: "reports", label: "Reports", icon: "description" },
  ]

  return (
    <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/guardian" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-xl text-headline-xl text-primary">Student Detail</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-md py-sm rounded-full font-label-md transition-all ${
              activeTab === tab.id
                ? "bg-primary-container text-white"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "grades" && (
        <div className="space-y-3">
          {grades.isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                <div className="h-5 w-64 bg-surface-container-high rounded-full" />
              </div>
            ))
          ) : !grades.data || grades.data.length === 0 ? (
            <EmptyState icon="grade" title="No grades yet" description="Confirmed grades will appear here." />
          ) : (
            grades.data.map((g) => (
              <div key={g.id} className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Points Awarded</p>
                  <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">
                    {g.pointsAwarded}
                  </span>
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
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                  <div className="h-5 w-48 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          ) : !attendance.data || attendance.data.length === 0 ? (
            <EmptyState icon="calendar_today" title="No attendance records" description="Attendance records will appear here once logged." />
          ) : (
            <div className="rounded-[32px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                    <th className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3">Date</th>
                    <th className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.data.map((r) => (
                    <tr key={r.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors">
                      <td className="px-md py-3 font-body-md text-body-md text-on-surface">
                        {new Date(r.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-md py-3 text-right">
                        <span className={`font-label-sm text-label-sm px-sm py-0.5 rounded-full ${statusStyles[r.status] ?? "bg-surface-container-high text-on-surface-variant"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-3">
          {reports.isLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                <div className="h-5 w-48 bg-surface-container-high rounded-full mb-2" />
                <div className="h-4 w-full bg-surface-container-high rounded-full" />
              </div>
            ))
          ) : !reports.data || reports.data.length === 0 ? (
            <EmptyState icon="description" title="No reports" description="Reports will appear here once generated." />
          ) : (
            reports.data.map((r) => (
              <div key={r.id} className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <p className="font-body-md text-body-md text-on-surface">{r.parentSection}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
