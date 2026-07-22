import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useClassDetail } from "@/hooks/use-classes"
import { useImportAttendance } from "@/hooks/use-attendance"
import { EmptyState } from "@/components/ui/EmptyState"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "LATE", label: "Late", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "EXCUSED", label: "Excused", color: "bg-gray-100 text-gray-700 border-gray-300" },
]

export function AttendanceImportPage() {
  const [searchParams] = useSearchParams()
  const classIdParam = searchParams.get("classId") ?? ""
  const [selectedClassId, setSelectedClassId] = useState(classIdParam)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const actualClassId = classIdParam || selectedClassId
  const { detail, isLoading } = useClassDetail(actualClassId)
  const importAttendance = useImportAttendance()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = detail.data ? (detail.data as any).enrollments?.map((e: any) => e.student) ?? [] : []

  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSubmit = async () => {
    const entries = Object.entries(records)
    if (entries.length === 0) return

    const payload = entries.map(([studentId, status]) => ({
      studentId,
      classId: actualClassId,
      date,
      status,
    }))

    await importAttendance.mutateAsync(payload)
    setRecords({})
  }

  const selectedCount = Object.keys(records).length

  return (
    <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
      <Link to={classIdParam ? `/classes/${classIdParam}` : "/classes"} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Class
      </Link>

      <h1 className="font-headline-xl text-headline-xl text-primary mb-xl">Import Attendance</h1>

      <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10 mb-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg">
          {!classIdParam && (
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Class</label>
              <input
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                placeholder="Class ID..."
                className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
              />
            </div>
          )}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
            />
          </div>
        </div>

        {!actualClassId ? (
          <EmptyState icon="calendar_month" title="Select a class" description="Choose a class to mark attendance." />
        ) : isLoading ? (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">Loading class roster...</p>
        ) : students.length === 0 ? (
          <EmptyState icon="group" title="No students enrolled" description="Add students to the class before importing attendance." />
        ) : (
          <>
            <p className="font-label-md text-label-md text-primary mb-md">{students.length} students</p>
            <div className="space-y-sm max-h-[500px] overflow-y-auto">
              {students.map((s: { id: string; name: string }) => (
                <div key={s.id} className="flex items-center justify-between p-sm rounded-2xl bg-surface-container hover:bg-surface-container-low transition-colors">
                  <span className="font-label-md text-label-md text-on-surface">{s.name}</span>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(s.id, opt.value)}
                        className={`px-3 py-1 rounded-full font-label-sm text-label-sm border transition-all ${
                          records[s.id] === opt.value
                            ? `${opt.color} border-2 font-semibold`
                            : "border-outline-variant text-on-surface-variant hover:border-primary-container"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-lg pt-lg border-t border-outline-variant/20">
              <span className="font-label-md text-label-md text-on-surface-variant">{selectedCount} student{selectedCount !== 1 ? "s" : ""} marked</span>
              <button
                onClick={handleSubmit}
                disabled={selectedCount === 0 || importAttendance.isPending}
                className="px-lg py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover disabled:opacity-50"
              >
                {importAttendance.isPending ? "Importing..." : `Import Attendance (${selectedCount})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
