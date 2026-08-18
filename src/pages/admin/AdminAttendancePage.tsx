import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import {
 useTeacherAttendanceLedger,
 useTeacherAttendance,
 useTeacherFines,
 useCreateTeacherFine,
 useUpdateTeacherFine,
 useDeleteTeacherFine,
} from "@/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"

const STATUS_STYLE: Record<string, string> = {
 PRESENT: "bg-success/15 text-success border-success/40",
 ABSENT: "bg-accent text-foreground border-accent",
 LATE: "bg-surface-container-high text-on-surface border-surface-container-high",
 EXCUSED: "bg-surface-container-low text-on-surface-variant border-outline-variant",
}

const FINE_STATUS_STYLE: Record<api.FineStatus, string> = {
 PAID: "bg-success/15 text-success border-success/40",
 PARTIAL: "bg-surface-container-high text-on-surface border-surface-container-high",
 POSTPONED: "bg-surface-container-low text-on-surface-variant border-outline-variant",
 UNPAID: "bg-accent text-foreground border-accent",
}

function formatDate(iso: string): string {
 return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminAttendancePage() {
 const [teacherId, setTeacherId] = useState("")
 const [from, setFrom] = useState("")
 const [to, setTo] = useState("")
 const [status, setStatus] = useState("")
 const [fineOpen, setFineOpen] = useState(false)
 const [fineTeacherId, setFineTeacherId] = useState("")
 const [amount, setAmount] = useState("")
 const [reason, setReason] = useState("")
 const [fineType, setFineType] = useState<api.FineType>("ATTENDANCE")
 const [fineStatus, setFineStatus] = useState<api.FineStatus>("UNPAID")
 const [dueDate, setDueDate] = useState("")

 const teachers = useQuery({
  queryKey: ["users", "TEACHER"],
  queryFn: () => api.getUsers({ role: "TEACHER" }),
 })

 const ledger = useTeacherAttendanceLedger({
  teacherId: teacherId || undefined,
  from: from || undefined,
  to: to || undefined,
  status: (status as api.AttendanceStatus) || undefined,
 })

 const selectedTeacherFines = useTeacherFines(fineTeacherId)
 const teacherAttendance = useTeacherAttendance(teacherId)

 const createFine = useCreateTeacherFine()
 const updateFine = useUpdateTeacherFine()
 const deleteFine = useDeleteTeacherFine()

 const teacherName = useMemo(() => {
  const map = new Map<string, string>()
  for (const t of teachers.data ?? []) map.set(t.id, t.name)
  return (id: string) => map.get(id) ?? "—"
 }, [teachers.data])

 const handleIssueFine = () => {
  const parsedAmount = Number(amount)
  if (!fineTeacherId || !reason.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return
  createFine.mutate(
   {
    teacherId: fineTeacherId,
    payload: {
     amount: parsedAmount,
     reason: reason.trim(),
     type: fineType,
     status: fineStatus,
     ...(dueDate ? { dueDate } : {}),
    },
   },
   {
    onSuccess: () => {
     setFineOpen(false)
     setAmount("")
     setReason("")
     setDueDate("")
    },
   },
  )
 }

 const handleDeleteFine = (fineId: string) => {
  deleteFine.mutate(fineId)
 }

 const ledgerCounts = useMemo(() => {
  const counts: Record<string, number> = {}
  for (const r of ledger.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1
  return counts
 }, [ledger.data])

 return (
  <div className="flex-1 p-xl max-w-6xl mx-auto w-full">
   <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Teacher Attendance</h1>

   <div className="bg-surface-container-lowest rounded-lg p-xl mb-lg">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-md">
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Teacher</label>
      <select
       value={teacherId}
       onChange={(e) => setTeacherId(e.target.value)}
       className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
      >
       <option value="">All teachers</option>
       {teachers.data?.map((t) => (
        <option key={t.id} value={t.id}>
         {t.name}
        </option>
       ))}
      </select>
     </div>
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">From</label>
      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus" />
     </div>
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">To</label>
      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus" />
     </div>
     <div>
      <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Status</label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus">
       <option value="">All statuses</option>
       {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as api.AttendanceStatus[]).map((s) => (
        <option key={s} value={s}>
         {s}
        </option>
       ))}
      </select>
     </div>
    </div>

    {ledger.isLoading ? (
     <LoadingState className="py-lg" />
    ) : !ledger.data || ledger.data.length === 0 ? (
     <EmptyState icon="how_to_reg" title="No attendance records" description="Adjust the filters or wait for teachers to check in." />
    ) : (
     <>
      <div className="flex flex-wrap gap-sm mb-md">
       {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as api.AttendanceStatus[]).map((s) => (
        <Badge key={s} className={STATUS_STYLE[s]}>
         {s}: {ledgerCounts[s] ?? 0}
        </Badge>
       ))}
      </div>
      <div className="space-y-sm max-h-[420px] overflow-y-auto">
       {ledger.data.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-lg bg-surface-container">
         <div>
          <p className="font-label-md text-label-md text-on-surface">
           {r.teacher?.name ?? "—"} · {r.courseOffering?.course?.name ?? "Class"}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
           {formatDate(r.date)} · {r.source === "SELF" ? "Self check-in" : "Marked by admin"}
          </p>
         </div>
         <Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge>
        </div>
       ))}
      </div>
     </>
    )}
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
    <div className="bg-surface-container-lowest rounded-lg p-xl">
     <div className="flex flex-wrap items-center justify-between gap-sm mb-md">
      <div>
       <h2 className="font-headline-md text-headline-md text-primary">Teacher detail</h2>
       <p className="font-body-sm text-body-sm text-on-surface-variant">{teacherId ? teacherName(teacherId) : "Select a teacher above"}</p>
      </div>
     </div>
     {teacherId ? (
      teacherAttendance.isLoading ? (
       <LoadingState className="py-lg" />
      ) : !teacherAttendance.data || teacherAttendance.data.length === 0 ? (
       <EmptyState icon="how_to_reg" title="No records" description="This teacher has no attendance records yet." />
      ) : (
       <div className="space-y-sm max-h-[300px] overflow-y-auto">
        {teacherAttendance.data.map((r) => (
         <div key={r.id} className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-lg bg-surface-container">
          <div>
           <p className="font-label-md text-label-md text-on-surface">{r.courseOffering?.course?.name ?? "Class"}</p>
           <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(r.date)}</p>
          </div>
          <Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge>
         </div>
        ))}
       </div>
      )
     ) : (
      <EmptyState icon="person_search" title="No teacher selected" description="Pick a teacher to see their attendance." />
     )}
    </div>

    <div className="bg-surface-container-lowest rounded-lg p-xl">
     <div className="flex flex-wrap items-center justify-between gap-sm mb-md">
      <div>
       <h2 className="font-headline-md text-headline-md text-primary">Fines</h2>
       <p className="font-body-sm text-body-sm text-on-surface-variant">Issue and manage teacher fines.</p>
      </div>
      <Button
       type="button"
       onClick={() => {
        setFineTeacherId(teacherId)
        setFineOpen(true)
       }}
       disabled={!teacherId}
       className="px-md h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover disabled:opacity-50"
      >
       Issue fine
      </Button>
     </div>

     {!teacherId ? (
      <EmptyState icon="payments" title="No teacher selected" description="Select a teacher to manage fines." />
     ) : selectedTeacherFines.isLoading ? (
      <LoadingState className="py-lg" />
     ) : !selectedTeacherFines.data || selectedTeacherFines.data.length === 0 ? (
      <EmptyState icon="payments" title="No fines" description="No fines issued to this teacher yet." />
     ) : (
      <div className="space-y-sm max-h-[300px] overflow-y-auto">
       {selectedTeacherFines.data.map((f) => (
        <div key={f.id} className="p-sm rounded-lg bg-surface-container">
         <div className="flex flex-wrap items-center justify-between gap-sm">
          <div className="min-w-0">
           <p className="font-label-md text-label-md text-on-surface truncate">{f.reason}</p>
           <p className="font-body-sm text-body-sm text-on-surface-variant">
            {f.type} · {Number(f.amount).toFixed(2)} {f.dueDate ? `· due ${formatDate(f.dueDate)}` : ""}
           </p>
          </div>
          <Badge className={FINE_STATUS_STYLE[f.status]}>{f.status}</Badge>
         </div>
         <div className="flex flex-wrap items-center gap-sm mt-sm">
          <select
           value={f.status}
           onChange={(e) => updateFine.mutate({ fineId: f.id, payload: { status: e.target.value as api.FineStatus } })}
           className="h-auto rounded-lg bg-surface px-3 py-1 font-label-sm text-label-sm text-on-surface form-input-focus"
          >
           {(["UNPAID", "PARTIAL", "POSTPONED", "PAID"] as api.FineStatus[]).map((s) => (
            <option key={s} value={s}>
             {s}
            </option>
           ))}
          </select>
          <Button
           type="button"
           onClick={() => handleDeleteFine(f.id)}
           disabled={deleteFine.isPending}
           className="px-sm h-auto py-1 font-label-sm text-label-sm text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
          >
           Delete
          </Button>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   </div>

   <Dialog open={fineOpen} onOpenChange={setFineOpen}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Issue fine</DialogTitle>
      <DialogDescription>
       {fineTeacherId ? `Issuing a fine to ${teacherName(fineTeacherId)}. The teacher will be notified.` : "Select a teacher first."}
      </DialogDescription>
     </DialogHeader>
     <div className="space-y-md">
      <div className="grid grid-cols-2 gap-md">
       <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Teacher</label>
        <select value={fineTeacherId} onChange={(e) => setFineTeacherId(e.target.value)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus">
         <option value="">Select...</option>
         {teachers.data?.map((t) => (
          <option key={t.id} value={t.id}>
           {t.name}
          </option>
         ))}
        </select>
       </div>
       <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Amount</label>
        <input
         type="number"
         min="0"
         step="0.01"
         value={amount}
         onChange={(e) => setAmount(e.target.value)}
         placeholder="0.00"
         className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
        />
       </div>
      </div>
      <div>
       <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Reason</label>
       <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Missed the 8:00 AM session"
        className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
       />
      </div>
      <div className="grid grid-cols-2 gap-md">
       <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Type</label>
        <select value={fineType} onChange={(e) => setFineType(e.target.value as api.FineType)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus">
         {(["ATTENDANCE", "LATE", "OTHER"] as api.FineType[]).map((t) => (
          <option key={t} value={t}>
           {t}
          </option>
         ))}
        </select>
       </div>
       <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Status</label>
        <select value={fineStatus} onChange={(e) => setFineStatus(e.target.value as api.FineStatus)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus">
         {(["UNPAID", "PARTIAL", "POSTPONED", "PAID"] as api.FineStatus[]).map((s) => (
          <option key={s} value={s}>
           {s}
          </option>
         ))}
        </select>
       </div>
      </div>
      <div>
       <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Due date</label>
       <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus" />
      </div>
     </div>
     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setFineOpen(false)} className="font-label-md text-label-md rounded-lg">
       Cancel
      </Button>
      <Button
       type="button"
       onClick={handleIssueFine}
       disabled={!fineTeacherId || !reason.trim() || !(Number(amount) > 0) || createFine.isPending}
       className="px-lg h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover disabled:opacity-50"
      >
       {createFine.isPending ? "Issuing..." : "Issue fine"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}