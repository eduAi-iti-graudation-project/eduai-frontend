import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { MiniStat } from "@/components/admin/MiniStat"
import { Checkbox } from "@/components/ui/checkbox"
import {
 AlertDialog,
 AlertDialogTrigger,
 AlertDialogPortal,
 AlertDialogOverlay,
 AlertDialogContent,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogCancel,
 AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

function initials(name: string) {
 return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((p) => p[0])
  .join("")
  .toUpperCase()
}

function fmtDate(iso: string | null | undefined) {
 if (!iso) return "—"
 return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function gradeName(g: { id: string; level: number; name: string | null }) {
 return g.name ?? `Grade ${g.level}`
}

const genderLabels: Record<string, string> = {
 MALE: "Male",
 FEMALE: "Female",
 OTHER: "Other",
}

export function TeacherManagementPage() {
 const [search, setSearch] = useState("")
 const [selectedTeacher, setSelectedTeacher] = useState<api.AdminUser | null>(null)

 const teachers = useQuery({
  queryKey: ["users", "TEACHER"],
  queryFn: () => api.getUsers({ role: "TEACHER" }),
 })

 const teacherId = selectedTeacher?.id

 const profileQ = useQuery({
  queryKey: ["admin-teacher-profile", teacherId],
  queryFn: () => api.getAdminTeacherProfile(teacherId!),
  enabled: !!teacherId,
 })

 const historyQ = useQuery({
  queryKey: ["admin-teacher-history", teacherId],
  queryFn: () => api.getTeacherHistory(teacherId!),
  enabled: !!teacherId,
 })

 if (teachers.isError) {
  return (
   <ErrorState
    title="Couldn't load teachers"
    message={teachers.error instanceof Error ? teachers.error.message : "Failed to load teachers"}
    onRetry={() => teachers.refetch()}
   />
  )
 }

 if (teachers.isLoading) {
  return <LoadingState label="Loading teachers…" />
 }

 const list = (teachers.data ?? []).filter((u) => u.role === "TEACHER")
 const filtered = list.filter((t) =>
  !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
 )

 const loadingProfile = profileQ.isLoading && !profileQ.data

 return (
  <div className="flex-1 px-4 py-4 min-w-0">
   <div className="max-w-[1500px] mx-auto space-y-4 min-w-0">
    <PageHeader
     title="Teachers"
     subtitle={`${list.length} on staff · select a teacher to view classes, history, salary and documents`}
    />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
     <div className="lg:col-span-1 rounded-lg bg-surface-container-lowest overflow-hidden min-w-0">
      <div className="p-3 border-b border-outline-variant">
       <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <Input
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Search teachers..."
         className="w-full pl-9 pr-3 py-1.5 rounded-md font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
        />
       </div>
      </div>
      <div className="divide-y divide-border max-h-[680px] overflow-y-auto">
       {filtered.map((t) => (
        <button
         key={t.id}
         type="button"
         onClick={() => setSelectedTeacher(t)}
         className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
          selectedTeacher?.id === t.id
           ? "bg-primary-container text-on-primary-container"
           : "text-on-surface hover:bg-surface-container-low",
         )}
        >
         <Avatar className="h-9 w-9 rounded-full shrink-0">
          <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
           {initials(t.name)}
          </AvatarFallback>
         </Avatar>
         <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md font-semibold truncate">{t.name}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{t.email}</p>
         </div>
         <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">chevron_right</span>
        </button>
       ))}
       {filtered.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-8">No teachers found</p>
       )}
      </div>
     </div>

     <div className="lg:col-span-2 space-y-4 min-w-0">
      {!selectedTeacher ? (
       <div className="rounded-lg bg-surface-container-lowest flex items-center justify-center min-h-[360px]">
        <div className="text-center px-6">
         <span className="material-symbols-outlined text-[40px] text-outline mb-2">person_search</span>
         <p className="font-body-md text-body-md text-on-surface-variant">Select a teacher to manage</p>
        </div>
       </div>
      ) : loadingProfile ? (
       <LoadingState label="Loading profile…" />
      ) : (
       <TeacherDetail
        teacher={selectedTeacher}
        profile={profileQ.data!}
        history={historyQ.data ?? []}
        onRemoved={() => setSelectedTeacher(null)}
       />
      )}
     </div>
    </div>
   </div>
  </div>
 )
}

function TeacherDetail({
 teacher,
 profile,
 history,
 onRemoved,
}: {
 teacher: api.AdminUser
 profile: api.AdminTeacherProfile
 history: api.TeacherHistoryEntry[]
 onRemoved: () => void
}) {
 const activeHistory = history.filter((h) => h.active).length
 const navigate = useNavigate()
 const qc = useQueryClient()
 const [removeOpen, setRemoveOpen] = useState(false)
 const [confirmName, setConfirmName] = useState("")
 const [confirmChecked, setConfirmChecked] = useState(false)

 const chatM = useMutation({
  mutationFn: () => api.createOrGetAdminChatThread(teacher.id, "TEACHER"),
  onSuccess: (thread) => {
   qc.invalidateQueries({ queryKey: ["chat-threads"] })
   navigate(`/admin/chat/${thread.id}`)
  },
  onError: () => toast.error("Could not open a chat with this teacher"),
 })

 const removeM = useMutation({
  mutationFn: () => api.deleteUser(teacher.id),
  onSuccess: (deleted) => {
   toast.success(`${deleted.name} was removed and their account deleted`)
   qc.invalidateQueries({ queryKey: ["users", "TEACHER"] })
   setRemoveOpen(false)
   setConfirmName("")
   setConfirmChecked(false)
   onRemoved()
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const nameConfirmed =
  confirmName.trim().toLowerCase() === teacher.name.trim().toLowerCase()
 const canRemove = nameConfirmed && confirmChecked && !removeM.isPending

 return (
  <>
   <ProfileHeader
    teacher={teacher}
    profile={profile}
    activeHistoryCount={activeHistory}
    chatPending={chatM.isPending}
    onChat={() => chatM.mutate()}
   />

   <div className="rounded-lg bg-surface-container-lowest overflow-hidden min-w-0">
    <div className="px-md py-3 border-b border-outline-variant flex items-center justify-between gap-3 flex-wrap">
     <div>
      <h3 className="font-headline-sm text-headline-sm text-primary">Current classes</h3>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
       {profile.classCount} class{profile.classCount === 1 ? "" : "es"} · {profile.studentCount} student{profile.studentCount === 1 ? "" : "s"} · {profile.quizCount} quiz{profile.quizCount === 1 ? "" : "zes"}
      </p>
     </div>
    </div>
    {profile.classes.length === 0 ? (
     <div className="py-8">
      <EmptyState icon="meeting_room" title="No classes assigned" description="This teacher isn't teaching any classes right now." />
     </div>
    ) : (
     <div className="divide-y divide-border">
      {profile.classes.map((c) => (
       <div key={c.id} className="flex items-start gap-3 px-md py-3">
        <span className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
         <span className="material-symbols-outlined text-[18px] text-on-surface-variant">school</span>
        </span>
        <div className="flex-1 min-w-0">
         <p className="font-label-md text-label-md text-on-surface font-medium truncate">{c.name}</p>
         <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
          {c.grades.map(gradeName).join(" · ") || "No grade"} · {c.studentCount} students · {c.quizCount} quizzes · {c.assignmentCount} assignments
         </p>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   <div className="rounded-lg bg-surface-container-lowest overflow-hidden min-w-0">
    <div className="px-md py-3 border-b border-outline-variant">
     <h3 className="font-headline-sm text-headline-sm text-primary">Teaching history</h3>
     <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
      {history.length} assignment{history.length === 1 ? "" : "s"} · {activeHistory} active
     </p>
    </div>
    {history.length === 0 ? (
     <div className="py-8">
      <EmptyState icon="history" title="No history yet" description="Past class assignments will appear here." />
     </div>
    ) : (
     <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
      {history.map((h) => (
       <div key={h.id} className="flex items-center gap-3 px-md py-3">
        <span className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
         <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
        </span>
        <div className="flex-1 min-w-0">
         <p className="font-label-md text-label-md text-on-surface font-medium truncate">{h.className}</p>
         <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
          {fmtDate(h.startedAt)} — {h.endedAt ? fmtDate(h.endedAt) : "now"}
          {h.grades.length > 0 && ` · ${h.grades.map(gradeName).join(" · ")}`}
         </p>
        </div>
        {h.active ? (
         <span className="shrink-0 inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-success-container text-on-success-container font-medium">Active</span>
        ) : (
         <span className="shrink-0 inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-medium">Ended</span>
        )}
        </div>
       ))}
      </div>
     )}
    </div>

    <div className="rounded-lg border border-error-container bg-error-container/20 p-md">
     <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
       <span className="material-symbols-outlined text-[22px] text-on-error-container shrink-0">delete_forever</span>
       <div className="min-w-0">
        <h3 className="font-headline-sm text-headline-sm text-primary">Danger zone</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
         Remove this teacher and permanently delete their account
        </p>
       </div>
      </div>
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
       <AlertDialogTrigger asChild>
        <Button
         type="button"
         variant="outline"
         size="sm"
         className="rounded-lg border-error-container bg-transparent text-on-error px-3 py-1.5 font-label-md text-label-md hover:bg-error-container hover:text-on-error-container"
        >
         <span className="material-symbols-outlined text-[16px]">person_remove</span>
         Remove teacher
        </Button>
       </AlertDialogTrigger>
       <AlertDialogPortal>
        <AlertDialogOverlay className="bg-black/80" />
        <AlertDialogContent className="rounded-xl bg-surface-container-lowest max-w-[460px]">
         <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
           <span className="material-symbols-outlined text-[22px] text-on-error-container">warning</span>
           <AlertDialogTitle className="font-headline-md text-headline-md text-on-surface">
            Remove {teacher.name}?
           </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 font-body-md text-body-md text-on-surface-variant">
           <p>
            This <span className="font-semibold text-on-error-container">cannot be undone</span>. The teacher's
            profile, salary records, documents and login account will be permanently deleted.
           </p>
           <p>To confirm, type the teacher's full name exactly as shown below.</p>
          </AlertDialogDescription>
         </AlertDialogHeader>

         <div className="mt-3">
          <Input
           value={confirmName}
           onChange={(e) => setConfirmName(e.target.value)}
           placeholder={`Type "${teacher.name}"`}
           className="w-full rounded-md bg-surface-container-low font-body-md text-body-md h-auto py-2 px-3 outline-none focus:border-primary focus-visible:ring-transparent focus-visible:ring-offset-0"
          />
         </div>

         <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
          <Checkbox
           checked={confirmChecked}
           onCheckedChange={(v) => setConfirmChecked(!!v)}
           className="mt-0.5 border-outline data-[state=checked]:bg-error data-[state=checked]:border-error"
          />
          <span className="font-label-md text-label-md text-on-surface leading-snug">
           I understand this permanently removes {teacher.name} and their account.
          </span>
         </label>

         {!nameConfirmed && confirmName.trim().length > 0 && (
          <p className="font-label-sm text-label-sm text-error mt-2">
           Name doesn't match — the removed teacher
          </p>
         )}
         {nameConfirmed && !confirmChecked && (
          <p className="font-label-sm text-label-sm text-error mt-2">
           Tick the checkbox above to confirm.
          </p>
         )}

         <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
           className="rounded-lg font-label-md text-label-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low"
           onClick={() => {
            setConfirmName("")
            setConfirmChecked(false)
           }}
          >
           Keep teacher
          </AlertDialogCancel>
          <AlertDialogAction
           disabled={!canRemove}
           onClick={async (e) => {
            e.preventDefault()
            removeM.mutate()
           }}
           className={cn(
            "rounded-full px-3 py-1.5 font-label-md text-label-md text-on-error hover:brightness-95",
            canRemove ? "bg-error" : "bg-error/40 cursor-not-allowed",
           )}
          >
           {removeM.isPending ? "Removing…" : "Remove permanently"}
          </AlertDialogAction>
         </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialogPortal>
      </AlertDialog>
     </div>
    </div>
   </>
  )
 }

function ProfileHeader({
 teacher,
 profile,
 activeHistoryCount,
 chatPending,
 onChat,
}: {
 teacher: api.AdminUser
 profile: api.AdminTeacherProfile
 activeHistoryCount: number
 chatPending: boolean
 onChat: () => void
}) {
 return (
  <div className="rounded-lg bg-surface-container-lowest p-md">
   <div className="flex items-start justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3 min-w-0">
     <Avatar className="h-12 w-12 rounded-full shrink-0">
      <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-headline-md text-headline-md">
       {initials(teacher.name)}
      </AvatarFallback>
     </Avatar>
     <div className="min-w-0">
      <h2 className="font-headline-md text-headline-md text-primary leading-none truncate">{teacher.name}</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">{teacher.email}</p>
     </div>
    </div>
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
     <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant font-medium">
      TEACHER
     </span>
     {profile.gender && (
      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
       <span className="material-symbols-outlined text-[14px]">{profile.gender === "FEMALE" ? "female" : profile.gender === "MALE" ? "male" : "transgender"}</span>
       {genderLabels[profile.gender]}
      </span>
     )}
     {profile.grades.slice(0, 3).map((g) => (
      <span key={g.id} className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
       {gradeName(g)}
      </span>
     ))}
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="rounded-md font-label-md text-label-md"
       onClick={onChat}
       disabled={chatPending}
      >
       <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
       {chatPending ? "Opening…" : "Chat"}
      </Button>
      <Button asChild variant="outline" size="sm" className="rounded-md font-label-md text-label-md">
       <Link to={`/admin/teachers/${profile.id}`}>
        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
        Full profile
       </Link>
      </Button>
    </div>
   </div>

   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
    <MiniStat icon="meeting_room" label="Classes" value={profile.classCount} />
    <MiniStat icon="group" label="Students" value={profile.studentCount} />
    <MiniStat icon="quiz" label="Quizzes" value={profile.quizCount} />
    <MiniStat
     icon="history"
     label="Teaching now"
     value={activeHistoryCount}
     tone={activeHistoryCount ? "positive" : "default"}
    />
   </div>
  </div>
 )
}