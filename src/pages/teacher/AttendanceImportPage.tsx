import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useClassDetail } from "@/hooks/use-classes"
import { useImportAttendance } from "@/hooks/use-attendance"
import { useTeacherOfferings } from "@/hooks/use-labs"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
 { value: "PRESENT", label: "Present", color: "bg-success/15 text-success border-success/40" },
 { value: "ABSENT", label: "Absent", color: "bg-accent text-foreground border-accent" },
 { value: "LATE", label: "Late", color: "bg-surface-container-high text-on-surface border-surface-container-high" },
 { value: "EXCUSED", label: "Excused", color: "bg-surface-container-low text-on-surface-variant border-outline-variant" },
]

export function AttendanceImportPage() {
 const [selectedOfferingId, setSelectedOfferingId] = useState("")
 const [date, setDate] = useState(new Date().toISOString().split("T")[0])

 const offerings = useTeacherOfferings()
 const selectedOffering = useMemo(
  () => offerings.data?.find((o) => o.id === selectedOfferingId) ?? null,
  [offerings.data, selectedOfferingId],
 )
 const sectionId = selectedOffering?.section.id ?? ""
 const { detail, isLoading } = useClassDetail(sectionId)
 const importAttendance = useImportAttendance()

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const students = detail.data ? (detail.data as any).enrollments?.map((e: any) => e.student) ?? [] : []

 const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})

 const setStatus = (studentId: string, status: AttendanceStatus) => {
  setRecords((prev) => ({ ...prev, [studentId]: status }))
 }

 const handleSubmit = async () => {
  const entries = Object.entries(records)
  if (entries.length === 0 || !selectedOffering) return

  const payload = entries.map(([studentId, status]) => ({
   studentId,
   courseOfferingId: selectedOffering.id,
   date,
   status,
  }))

  await importAttendance.mutateAsync(payload)
  setRecords({})
 }

 const selectedCount = Object.keys(records).length

 return (
  <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
   <Link to="/attendance" className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
    Back to Attendance
   </Link>

   <h1 className="font-headline-xl text-headline-xl text-primary mb-xl">Import Attendance</h1>

   <div className="bg-surface-container-lowest rounded-lg p-xl mb-xl">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg">
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Course offering</label>
      {offerings.isLoading ? (
       <LoadingState className="py-sm" />
      ) : (
       <select
        value={selectedOfferingId}
        onChange={(e) => {
         setSelectedOfferingId(e.target.value)
         setRecords({})
        }}
        className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
       >
        <option value="">Select a course offering...</option>
        {offerings.data?.map((o) => (
         <option key={o.id} value={o.id}>
          {o.course.name} · {o.section.name}
         </option>
        ))}
       </select>
      )}
     </div>
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Date</label>
      <input
       type="date"
       value={date}
       onChange={(e) => setDate(e.target.value)}
       className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
      />
     </div>
    </div>

    {!selectedOfferingId ? (
     <EmptyState icon="calendar_month" title="Select a course offering" description="Choose the offering you want to mark attendance for." />
    ) : isLoading ? (
     <LoadingState className="py-lg" />
    ) : students.length === 0 ? (
     <EmptyState icon="group" title="No students enrolled" description="Add students to this section before importing attendance." />
    ) : (
     <>
      <p className="font-label-md text-label-md text-primary mb-md">{students.length} students</p>
      <div className="space-y-sm max-h-[500px] overflow-y-auto">
       {students.map((s: { id: string; name: string }) => (
        <div key={s.id} className="flex items-center justify-between p-sm rounded-lg bg-surface-container hover:bg-surface-container-low transition-colors">
         <span className="font-label-md text-label-md text-on-surface">{s.name}</span>
         <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
           <Button
            key={opt.value}
            type="button"
            onClick={() => setStatus(s.id, opt.value)}
            className={`px-3 py-1 h-auto rounded-lg font-label-sm text-label-sm border transition-all ${
             records[s.id] === opt.value
              ? `${opt.color} border-2 font-semibold`
              : "border-outline-variant text-on-surface-variant hover:border-primary-container"
            }`}
           >
            {opt.label}
           </Button>
          ))}
         </div>
        </div>
       ))}
      </div>

      <div className="flex items-center justify-between mt-lg pt-lg border-t border-outline-variant">
       <span className="font-label-md text-label-md text-on-surface-variant">{selectedCount} student{selectedCount !== 1 ? "s" : ""} marked</span>
       <Button
        type="button"
        onClick={handleSubmit}
        disabled={selectedCount === 0 || importAttendance.isPending}
        className="px-lg h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover disabled:opacity-50"
       >
        {importAttendance.isPending ? "Importing..." : `Import Attendance (${selectedCount})`}
       </Button>
      </div>
     </>
    )}
   </div>
  </div>
 )
}
