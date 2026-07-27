import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

const statusStyles: Record<string, string> = {
  PRESENT: "bg-primary-fixed/30 text-primary",
  ABSENT: "bg-error-container text-error",
  LATE: "bg-tertiary-fixed text-on-tertiary-fixed",
  EXCUSED: "bg-surface-container-high text-on-surface-variant",
}

export function MyAttendancePage() {
  const { user } = useAuth()

  const { data: records, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-attendance", user?.id],
    queryFn: () => api.getStudentAttendance(user!.id),
    enabled: !!user?.id,
  })

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-margin-desktop">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load attendance</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <button onClick={() => refetch()} className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Attendance</h1>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-32 bg-surface-container-high rounded-full" />
                  <div className="h-5 w-20 bg-surface-container-high rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : !records || records.length === 0 ? (
          <EmptyState
            icon="calendar_today"
            title="No attendance records"
            description="Your attendance records will appear here once they're logged."
          />
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
                {records.map((r) => (
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
  )
}
