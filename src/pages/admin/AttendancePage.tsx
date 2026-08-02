import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  presentPercent: number
}

export function AttendancePage() {
  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const students = useQuery({
    queryKey: ["users", "STUDENT"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const allAttendance = useQuery({
    queryKey: ["student-attendance", selectedStudentId],
    queryFn: () => api.getStudentAttendance(selectedStudentId!),
    enabled: !!selectedStudentId,
  })

  const filteredStudents = (students.data ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedStudent = (students.data ?? []).find((s) => s.id === selectedStudentId)

  const stats: AttendanceStats = useMemo(() => {
    const records = allAttendance.data ?? []
    const present = records.filter((r) => r.status === "PRESENT").length
    const absent = records.filter((r) => r.status === "ABSENT").length
    const late = records.filter((r) => r.status === "LATE").length
    const excused = records.filter((r) => r.status === "EXCUSED").length
    const total = records.length
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercent: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  }, [allAttendance.data])

  const filteredRecords = useMemo(() => {
    const records = allAttendance.data ?? []
    if (statusFilter === "ALL") return records
    return records.filter((r) => r.status === statusFilter)
  }, [allAttendance.data, statusFilter])

  const statusBadgeColors: Record<string, string> = {
    PRESENT: "bg-primary/10 text-primary",
    ABSENT: "bg-error/10 text-error",
    LATE: "bg-secondary/10 text-secondary",
    EXCUSED: "bg-surface-container-high text-on-surface-variant",
  }

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-1 bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-11 pr-4 py-2 rounded-full border border-outline-variant/20 font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left px-md py-sm rounded-full transition-all ${
                  selectedStudentId === s.id
                    ? "bg-primary-container text-on-primary-container"
                    : "hover:bg-surface-container text-on-surface"
                }`}
              >
                <p className="font-label-md text-label-md">{s.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{s.email}</p>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-md">No students found</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedStudentId ? (
            <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm flex items-center justify-center min-h-[300px]">
              <p className="font-body-md text-body-md text-on-surface-variant">Select a student to view attendance</p>
            </div>
          ) : allAttendance.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm animate-pulse">
                  <div className="h-6 w-48 bg-surface-container-high rounded-full mb-4" />
                  <div className="h-4 w-full bg-surface-container-high rounded-full mb-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedStudent && (
                <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
                  <h2 className="font-headline-md text-headline-md text-primary mb-1">{selectedStudent.name}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{selectedStudent.email}</p>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="text-center p-md bg-surface-container-low rounded-2xl">
                      <p className="font-headline-lg text-headline-lg text-primary">{stats.total}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Total</p>
                    </div>
                    <div className="text-center p-md bg-primary/5 rounded-2xl">
                      <p className="font-headline-lg text-headline-lg text-primary">{stats.presentPercent}%</p>
                      <p className="font-label-sm text-label-sm text-primary">Present</p>
                    </div>
                    <div className="text-center p-md bg-error/5 rounded-2xl">
                      <p className="font-headline-lg text-headline-lg text-error">{stats.absent}</p>
                      <p className="font-label-sm text-label-sm text-error">Absent</p>
                    </div>
                    <div className="text-center p-md bg-secondary/5 rounded-2xl">
                      <p className="font-headline-lg text-headline-lg text-secondary">{stats.late}</p>
                      <p className="font-label-sm text-label-sm text-secondary">Late</p>
                    </div>
                    <div className="text-center p-md bg-surface-container-high rounded-2xl">
                      <p className="font-headline-lg text-headline-lg text-on-surface-variant">{stats.excused}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Excused</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
                <div className="px-xl py-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <h3 className="font-headline-md text-headline-md text-primary">Records</h3>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-md py-1 rounded-full border border-outline-variant/20 font-body-sm text-body-sm bg-surface-container-low outline-none focus:border-primary"
                  >
                    <option value="ALL">All</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="p-xl text-center">
                    <p className="font-body-md text-body-md text-on-surface-variant">No attendance records found.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                        <th className="text-left font-label-sm text-label-sm text-on-surface-variant px-xl py-3">Date</th>
                        <th className="text-left font-label-sm text-label-sm text-on-surface-variant px-xl py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container-low transition-colors">
                          <td className="px-xl py-3 font-body-md text-body-md text-on-surface">
                            {new Date(r.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-xl py-3">
                            <span className={`inline-block px-md py-0.5 rounded-full font-label-sm text-label-sm ${statusBadgeColors[r.status] ?? "bg-surface-container-high text-on-surface-variant"}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
