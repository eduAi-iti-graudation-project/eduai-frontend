import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

interface AdminDashboardOverview {
  teacherCount: number
  studentCount: number
  classCount: number
  flaggedStudentCount: number
  averagePassRate: number
  pendingReportCount: number
  teachers: { id: string; name: string; classAverage: number; studentCount: number }[]
}

export function AdminDashboardPage() {
  const dashboard = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as AdminDashboardOverview
    },
  })

  if (dashboard.isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
          </p>
          <button onClick={() => dashboard.refetch()} className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (dashboard.isLoading) {
    return (
      <div className="flex-1 p-xl max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
              <div className="h-4 w-16 bg-surface-container-high rounded-full mb-3" />
              <div className="h-6 w-12 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-[32px] bg-white border border-outline-variant/10 animate-pulse" />
      </div>
    )
  }

  const data = dashboard.data

  const statCards = data ? [
    { icon: "school", label: "Teachers", value: data.teacherCount, color: "text-primary" },
    { icon: "group", label: "Students", value: data.studentCount, color: "text-primary" },
    { icon: "meeting_room", label: "Classes", value: data.classCount, color: "text-primary" },
    { icon: "flag", label: "Flagged Students", value: data.flaggedStudentCount, color: "text-error" },
    { icon: "trending_up", label: "Avg Pass Rate", value: `${data.averagePassRate}%`, color: "text-primary" },
    { icon: "description", label: "Pending Reports", value: data.pendingReportCount, color: "text-secondary" },
  ] : []

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
            <span className={`material-symbols-outlined text-[22px] ${stat.color} mb-2 block`}>{stat.icon}</span>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{stat.label}</p>
            <p className="font-headline-lg text-headline-lg text-on-surface mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {data && data.teachers.length > 0 && (
        <div className="rounded-[32px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="px-md py-4 border-b border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary">Teachers</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                <th className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3">Name</th>
                <th className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3">Class Average</th>
                <th className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3">Students</th>
              </tr>
            </thead>
            <tbody>
              {data.teachers.map((t) => (
                <tr key={t.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors cursor-pointer">
                  <td className="px-md py-3 font-body-md text-body-md text-on-surface">{t.name}</td>
                  <td className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{t.classAverage}%</td>
                  <td className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{t.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
