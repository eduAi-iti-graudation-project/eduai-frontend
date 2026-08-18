import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import QRCode from "qrcode"
import * as api from "@/lib/api"
import { DAY_ORDER } from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import {
 useOpenAttendanceSession,
 useCloseAttendanceSession,
 useAttendanceSession,
 useMyTeacherAttendance,
 useMyTeacherFines,
} from "@/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"

type Tab = "sessions" | "records" | "fines"

const STATUS_STYLE: Record<api.AttendanceStatus, string> = {
 PRESENT: "bg-success/15 text-success border-success/40",
 ABSENT: "bg-accent text-foreground border-accent",
 LATE: "bg-surface-container-high text-on-surface border-surface-container-high",
 EXCUSED: "bg-surface-container-low text-on-surface-variant border-outline-variant",
}

function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function formatDate(iso: string): string {
 return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function TeacherAttendancePage() {
 const { user } = useAuth()
 const [tab, setTab] = useState<Tab>("sessions")
 const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
 const [now, setNow] = useState(() => Date.now())

 const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7]

 const schedule = useQuery({
  queryKey: ["timetable", "teacher", user?.id],
  queryFn: () => api.getTeacherTimetable(user!.id),
  enabled: !!user?.id,
 })

 const todaysSlots = useMemo(() => {
  const byOffering = new Map<string, api.TimetableSlotWithOffering>()
  for (const slot of schedule.data ?? []) {
   if (slot.dayOfWeek !== todayName) continue
   if (!byOffering.has(slot.courseOfferingId)) byOffering.set(slot.courseOfferingId, slot)
  }
  return [...byOffering.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
 }, [schedule.data, todayName])

 const openSession = useOpenAttendanceSession()
 const closeSession = useCloseAttendanceSession()
 const session = useAttendanceSession(activeSessionId ?? "")
 const myAttendance = useMyTeacherAttendance()
 const myFines = useMyTeacherFines()

 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 1000)
  return () => clearInterval(t)
 }, [])

 const handleOpen = (offeringId: string) => {
  openSession.mutate(offeringId, {
   onSuccess: (s) => setActiveSessionId(s.id),
  })
 }

 const handleClose = () => {
  if (activeSessionId) {
   closeSession.mutate(activeSessionId, {
    onSuccess: () => setActiveSessionId(null),
   })
  }
 }

 const qrUrl = useMemo(() => {
  if (!session.data?.token) return ""
  return `${window.location.origin}/student/check-in?session=${encodeURIComponent(session.data.token)}`
 }, [session.data?.token])

 const [qrDataUrl, setQrDataUrl] = useState("")
 useEffect(() => {
  if (!qrUrl) return
  let cancelled = false
  QRCode.toDataURL(qrUrl, { width: 240, margin: 1 })
   .then((url) => {
    if (!cancelled) setQrDataUrl(url)
   })
   .catch(() => {
    if (!cancelled) setQrDataUrl("")
   })
  return () => {
   cancelled = true
  }
 }, [qrUrl])

 const remaining = session.data?.expiresAt ? Math.max(0, Math.floor((new Date(session.data.expiresAt).getTime() - now) / 1000)) : 0
 const remainingLabel =
  remaining > 0
   ? `${Math.floor(remaining / 60)}m ${remaining % 60}s left`
   : session.data?.status === "OPEN"
     ? "Expired"
     : ""

 const summary = useMemo(() => {
  const rows = myAttendance.data ?? []
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1
  return counts
 }, [myAttendance.data])

 return (
  <div className="flex-1 p-xl w-full">
   <div className="flex flex-wrap items-center justify-between gap-md mb-lg">
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary">Attendance</h1>
     <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Open a QR check-in for today&apos;s classes or import manual records.</p>
    </div>
    <Link to="/attendance/import">
     <Button type="button" className="px-lg h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover">
      Import manual records
     </Button>
    </Link>
   </div>

   <div className="flex gap-1 mb-lg bg-surface-container rounded-full p-1 w-fit">
    {(
     [
      { id: "sessions", label: "Check-in" },
      { id: "records", label: "My records" },
      { id: "fines", label: "My fines" },
     ] as { id: Tab; label: string }[]
    ).map((t) => (
     <button
      key={t.id}
      type="button"
      onClick={() => setTab(t.id)}
      className={`press-scale px-md py-sm rounded-full font-label-md text-label-md transition-all duration-150 ease-premium ${
       tab === t.id ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
      }`}
     >
      {t.label}
     </button>
    ))}
   </div>

   {tab === "sessions" && (
    <div className="space-y-md">
     {activeSessionId && session.data && (
      <div className="bg-surface-container-lowest rounded-lg p-xl border border-primary-container/60">
       <div className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div>
         <h2 className="font-headline-md text-headline-md text-primary">
          {session.data.courseName ?? "Check-in session"} · {session.data.sectionName ?? ""}
         </h2>
         <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          Opened {formatTime(session.data.openedAt)} — {session.data.status === "OPEN" ? remainingLabel : session.data.status.toLowerCase()}
         </p>
        </div>
        {session.data.status === "OPEN" && (
         <div className="flex gap-sm">
          <Button
           type="button"
           onClick={() => navigator.clipboard?.writeText(qrUrl).catch(() => undefined)}
           disabled={!qrUrl}
           className="px-md h-auto py-sm border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container"
          >
           Copy link
          </Button>
          <Button
           type="button"
           onClick={handleClose}
           disabled={closeSession.isPending}
           className="px-md h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover disabled:opacity-50"
          >
           {closeSession.isPending ? "Closing..." : "Close session"}
          </Button>
         </div>
        )}
       </div>

       {session.data.status === "OPEN" ? (
        <div className="flex flex-col items-center gap-md py-md">
         {qrDataUrl ? (
          <img src={qrDataUrl} alt="Check-in QR code" className="w-60 h-60 rounded-lg bg-white p-sm" />
         ) : (
          <LoadingState className="py-lg" />
         )}
         <div className="text-center max-w-md">
          <p className="font-label-md text-label-md text-on-surface">Scan this code or share the link</p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs break-all">{qrUrl || "Generating link..."}</p>
         </div>
        </div>
       ) : (
        <div className="py-md text-center">
         <span className="material-symbols-outlined text-3xl text-on-surface-variant">check_circle</span>
         <p className="font-label-md text-label-md text-on-surface mt-sm">This session is closed. Open a new check-in for the next class.</p>
        </div>
       )}
      </div>
     )}

     {openSession.isPending && <LoadingState className="py-lg" />}

     {todaysSlots.length === 0 ? (
      <EmptyState
       icon="calendar_month"
       title="No classes today"
       description="Your scheduled classes will appear here so you can open a check-in."
      />
     ) : (
      <div className="space-y-sm">
       {todaysSlots.map((slot) => (
        <div key={slot.id} className="flex flex-wrap items-center justify-between gap-md p-md rounded-lg bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-colors">
         <div>
          <p className="font-label-lg text-label-lg text-on-surface">
           {slot.courseOffering.course.name}
          </p>
          <p className="font-label-md text-label-md text-on-surface-variant mt-xs">
           {slot.courseOffering.section.name} · {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
           {slot.room ? ` · ${slot.room}` : ""}
          </p>
         </div>
         <Button
          type="button"
          onClick={() => handleOpen(slot.courseOfferingId)}
          className="px-md h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover"
         >
          Open check-in
         </Button>
        </div>
       ))}
      </div>
     )}
    </div>
   )}

   {tab === "records" && (
    <div className="bg-surface-container-lowest rounded-lg p-xl border border-outline-variant">
     {myAttendance.isLoading ? (
      <LoadingState className="py-lg" />
     ) : !myAttendance.data || myAttendance.data.length === 0 ? (
      <EmptyState icon="how_to_reg" title="No attendance yet" description="Open a check-in session to record your own attendance." />
     ) : (
      <>
       <div className="flex flex-wrap gap-sm mb-lg">
        {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as api.AttendanceStatus[]).map((s) => (
         <Badge key={s} className={STATUS_STYLE[s]}>
          {s}: {summary[s] ?? 0}
         </Badge>
        ))}
       </div>
       <div className="space-y-sm">
        {myAttendance.data.map((r) => (
         <div key={r.id} className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-lg bg-surface-container-lowest border border-outline-variant">
          <div>
           <p className="font-label-md text-label-md text-on-surface">
            {r.courseOffering?.course?.name ?? "Class"} · {r.courseOffering?.section?.name ?? ""}
           </p>
           <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(r.date)}</p>
          </div>
          <Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge>
         </div>
        ))}
       </div>
      </>
     )}
    </div>
   )}

   {tab === "fines" && (
    <div className="bg-surface-container-lowest rounded-lg p-xl border border-outline-variant">
     {myFines.isLoading ? (
      <LoadingState className="py-lg" />
     ) : !myFines.data || myFines.data.length === 0 ? (
      <EmptyState icon="payments" title="No fines" description="Any fines issued to you will appear here." />
     ) : (
      <div className="space-y-sm">
       {myFines.data.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-lg bg-surface-container-lowest border border-outline-variant">
         <div>
          <p className="font-label-md text-label-md text-on-surface">
           {f.type} — {f.reason}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
           Due {f.dueDate ? formatDate(f.dueDate) : "—"}
           {f.issuedBy ? ` · issued by ${f.issuedBy.name}` : ""}
          </p>
         </div>
         <div className="flex items-center gap-sm">
          <span className="font-label-lg text-label-lg text-on-surface">{Number(f.amount).toFixed(2)}</span>
          <Badge className={f.status === "PAID" ? "bg-success/15 text-success border-success/40" : "bg-accent text-foreground border-accent"}>{f.status}</Badge>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   )}
  </div>
 )
}