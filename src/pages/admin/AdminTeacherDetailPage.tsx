import { useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
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

function fmtBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const docTypes: api.TeacherDocumentType[] = [
  "SOCIAL_SECURITY",
  "NATIONAL_ID",
  "PASSPORT",
  "LICENSE",
  "DEGREE",
  "CONTRACT",
  "OTHER",
]

const docTypeLabels: Record<api.TeacherDocumentType, string> = {
  SOCIAL_SECURITY: "Social security",
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  LICENSE: "License",
  DEGREE: "Degree",
  CONTRACT: "Contract",
  OTHER: "Other",
}

const salaryStatuses: api.SalaryStatus[] = ["PAID", "PARTIAL", "POSTPONED", "UNPAID"]

const salaryStatusStyles: Record<api.SalaryStatus, string> = {
  PAID: "bg-[#dcfce7] text-[#14532d]",
  PARTIAL: "bg-[#fef3c7] text-[#78350f]",
  POSTPONED: "bg-[#e0e2ec] text-[#41465c]",
  UNPAID: "bg-[#ffdad6] text-[#93000a]",
}

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
}

export function AdminTeacherDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const profileQ = useQuery({
    queryKey: ["admin-teacher-profile", id],
    queryFn: () => api.getAdminTeacherProfile(id),
    enabled: !!id,
  })
  const classesQ = useQuery({
    queryKey: ["admin-teacher-classes", id],
    queryFn: () => api.getTeacherClasses(id),
    enabled: !!id,
  })
  const historyQ = useQuery({
    queryKey: ["admin-teacher-history", id],
    queryFn: () => api.getTeacherHistory(id),
    enabled: !!id,
  })
  const docsQ = useQuery({
    queryKey: ["admin-teacher-documents", id],
    queryFn: () => api.getTeacherDocuments(id),
    enabled: !!id,
  })
  const salariesQ = useQuery({
    queryKey: ["admin-teacher-salaries", id],
    queryFn: () => api.getTeacherSalaries(id),
    enabled: !!id,
  })

  const deleteDocM = useMutation({
    mutationFn: (docId: string) => api.deleteTeacherDocument(id, docId),
    onSuccess: () => {
      toast.success("Document deleted")
      qc.invalidateQueries({ queryKey: ["admin-teacher-documents", id] })
    },
    onError: () => toast.error("Could not delete the document"),
  })

  if (profileQ.isLoading || (id && !profileQ.data)) {
    return (
      <div className="flex-1 px-4 py-4 min-w-0">
        <LoadingState label="Loading teacher profile…" />
      </div>
    )
  }
  if (profileQ.isError) {
    return (
      <div className="flex-1 px-4 py-4 min-w-0">
        <ErrorState message="Could not load this teacher's profile." onRetry={() => profileQ.refetch()} />
      </div>
    )
  }

  const profile = profileQ.data!

  const openConversation = async () => {
    try {
      const thread = await api.createOrGetAdminChatThread(profile.id, "TEACHER")
      navigate(`/admin/chat/${thread.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start a conversation")
    }
  }

  return (
    <div className="flex-1 px-4 py-4 min-w-0">
      <div className="max-w-[1100px] mx-auto space-y-4 min-w-0">
        <PageHeader title="Teacher profile" subtitle="Classes, teaching history, salary and documents" />

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {profile.avatarUrl ? (
                <img src={api.teacherAvatarUrl(profile.id)} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
              ) : (
                <Avatar className="h-12 w-12 rounded-full shrink-0">
                  <AvatarFallback className="bg-primary/10 text-on-primary-fixed-variant font-headline-md text-headline-md">
                    {initials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <h2 className="font-headline-md text-headline-md text-on-surface leading-none truncate">{profile.name}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">{profile.email}</p>
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
                  {g.name ?? `Grade ${g.level}`}
                </span>
              ))}
              {profile.grades.length > 3 && (
                <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
                  +{profile.grades.length - 3} more
                </span>
              )}
              <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={openConversation}>
                <span className="material-symbols-outlined text-[16px] mr-1">chat_bubble</span>
                Message
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <StatBox icon="calendar_month" label="Joined" value={fmtDate(profile.createdAt)} />
            <StatBox icon="meeting_room" label="Classes" value={profile.classCount} />
            <StatBox icon="group" label="Students" value={profile.studentCount} />
            <StatBox icon="quiz" label="Quizzes" value={profile.quizCount} />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant flex-wrap gap-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {profile.documentsCount} document{profile.documentsCount === 1 ? "" : "s"} · {profile.salaryRecordsCount} salary record{profile.salaryRecordsCount === 1 ? "" : "s"}
            </p>
            <GenderEditor gender={profile.gender} teacherId={profile.id} />
          </div>
        </div>

        <PersonalInfoCard profile={profile} />

        <Tabs defaultValue="classes">
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-1.5">
            <TabsList className="bg-surface-container-low h-auto p-1 w-full">
              <TabsTrigger value="classes" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Current classes
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Teaching history
              </TabsTrigger>
              <TabsTrigger value="salary" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Salary
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="classes" className="mt-4">
            <ClassesPanel
              classes={classesQ.data ?? null}
              isLoading={classesQ.isLoading}
              isError={classesQ.isError}
              onRetry={() => classesQ.refetch()}
            />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryPanel
              entries={historyQ.data ?? null}
              isLoading={historyQ.isLoading}
              isError={historyQ.isError}
              onRetry={() => historyQ.refetch()}
            />
          </TabsContent>
          <TabsContent value="salary" className="mt-4">
            <SalaryPanel
              salaries={salariesQ.data ?? null}
              isLoading={salariesQ.isLoading}
              isError={salariesQ.isError}
              onRetry={() => salariesQ.refetch()}
              teacherId={id}
            />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <DocumentsPanel
              docs={docsQ.data ?? null}
              isLoading={docsQ.isLoading}
              isError={docsQ.isError}
              onRetry={() => docsQ.refetch()}
              teacherId={id}
              onDelete={(docId) => deleteDocM.mutate(docId)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value, tone = "default" }: { icon: string; label: string; value: number | string; tone?: "default" | "positive" | "warning" | "danger" }) {
  const toneStyles = {
    default: "bg-primary-fixed text-on-primary-fixed-variant",
    positive: "bg-[#dcfce7] text-[#14532d]",
    warning: "bg-[#fef3c7] text-[#78350f]",
    danger: "bg-[#ffdad6] text-[#93000a]",
  }
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        <span className={cn("w-5 h-5 rounded flex items-center justify-center", toneStyles[tone])}>
          <span className="material-symbols-outlined text-[13px]">{icon}</span>
        </span>
        <span className="font-label-sm text-label-sm">{label}</span>
      </div>
      <p className="font-headline-md text-headline-md text-on-surface tabular-nums mt-1">{value}</p>
    </div>
  )
}

function PanelCard({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden min-w-0">
      <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function gradeName(g: { id: string; level: number; name: string | null }) {
  return g.name ?? `Grade ${g.level}`
}

function GradeChips({ grades }: { grades: { id: string; level: number; name: string | null }[] }) {
  if (grades.length === 0) return <span className="font-label-sm text-label-sm text-on-surface-variant">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {grades.map((g) => (
        <span key={g.id} className="inline-flex items-center font-label-sm text-label-sm px-1.5 py-0.5 rounded-[6px] bg-primary-fixed text-on-primary-fixed-variant font-medium">
          {gradeName(g)}
        </span>
      ))}
    </div>
  )
}

function ClassesPanel({ classes, isLoading, isError, onRetry }: { classes: api.TeacherClass[] | null; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) return <LoadingState label="Loading classes…" />
  if (isError) return <ErrorState message="Could not load classes." onRetry={onRetry} />

  const data = classes ?? []
  return (
    <PanelCard title="Current classes" subtitle={`${data.length} class${data.length === 1 ? "" : "es"} this teacher is assigned to`}>
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="meeting_room" title="No classes assigned" description="This teacher isn't teaching any classes right now." />
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <Table className="w-full min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Class</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Grades</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-2.5">
                    <p className="font-label-md text-label-md text-on-surface font-medium truncate max-w-[260px]">{c.name}</p>
                    {c.description && <p className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[260px]">{c.description}</p>}
                  </TableCell>
                  <TableCell className="px-3 py-2.5"><GradeChips grades={c.grades} /></TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right">{c.students.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PanelCard>
  )
}

function HistoryPanel({ entries, isLoading, isError, onRetry }: { entries: api.TeacherHistoryEntry[] | null; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) return <LoadingState label="Loading history…" />
  if (isError) return <ErrorState message="Could not load history." onRetry={onRetry} />

  const data = entries ?? []
  return (
    <PanelCard title="Teaching history" subtitle="Every class this teacher has been assigned to, with periods">
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="history" title="No history yet" description="Class assignments and their time periods will appear here." />
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <Table className="w-full min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Class</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Grades</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Period</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Students</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="px-4 py-2.5 font-label-md text-label-md text-on-surface font-medium truncate max-w-[240px]">{h.className}</TableCell>
                  <TableCell className="px-3 py-2.5"><GradeChips grades={h.grades} /></TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface whitespace-nowrap">
                    {fmtDate(h.startedAt)} — {h.endedAt ? fmtDate(h.endedAt) : "now"}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right">{h.studentCount}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                    {h.active ? (
                      <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#14532d] font-medium">Active</span>
                    ) : (
                      <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-[#e0e2ec] text-[#41465c] font-medium">Ended</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PanelCard>
  )
}

function GenderEditor({ gender, teacherId }: { gender: api.TeacherGender | null; teacherId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<api.TeacherGender | "UNSET">(gender ?? "UNSET")

  const saveM = useMutation({
    mutationFn: () => api.updateTeacherGender(teacherId, value === "UNSET" ? null : value),
    onSuccess: () => {
      toast.success("Profile updated")
      qc.invalidateQueries({ queryKey: ["admin-teacher-profile", teacherId] })
      setOpen(false)
    },
    onError: () => toast.error("Could not update the profile"),
  })

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => { setValue(gender ?? "UNSET"); setOpen(true) }}>
        <span className="material-symbols-outlined text-[16px]">edit</span>
        {gender ? genderLabels[gender] : "Set gender"}
      </Button>
      <Dialog open={open} onOpenChange={(next) => { if (!next && !saveM.isPending) setOpen(false) }}>
        <DialogContent className="rounded-lg max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="font-headline-md text-headline-md text-on-surface">Edit profile</DialogTitle>
            <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
              Update the teacher's gender.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Gender</Label>
            <Select value={value} onValueChange={(v) => setValue(v as api.TeacherGender | "UNSET")}>
              <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNSET">Not set</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-md sm:gap-md">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => saveM.mutate()}
              disabled={saveM.isPending}
              className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saveM.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocumentsPanel({
  teacherId,
  docs,
  isLoading,
  isError,
  onRetry,
  onDelete,
}: {
  teacherId: string
  docs: api.TeacherDocument[] | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onDelete: (docId: string) => void
}) {
  const [uploadOpen, setUploadOpen] = useState(false)

  if (isLoading) return <LoadingState label="Loading documents…" />
  if (isError) return <ErrorState message="Could not load documents." onRetry={onRetry} />

  const data = docs ?? []

  return (
    <PanelCard
      title="Documents"
      subtitle="Social security, national ID, licenses, degrees and contracts"
      action={
        <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => setUploadOpen(true)}>
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          Upload document
        </Button>
      }
    >
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="folder_open" title="No documents" description="Upload contracts, IDs, licenses or other teacher records here." />
        </div>
      ) : (
        <div className="divide-y divide-[#eceef5]">
          {data.map((d) => (
            <div key={d.id} className="flex items-start gap-3 px-5 py-3">
              <span className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">badge</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface font-medium truncate">{d.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                  {docTypeLabels[d.type]} · {fmtBytes(d.sizeBytes)} · uploaded {fmtDate(d.createdAt)}{d.uploadedBy ? ` by ${d.uploadedBy.name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-on-surface-variant"
                  title="Download"
                  onClick={async () => {
                    try {
                      const url = await api.getTeacherDocumentUrl(teacherId, d.id)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = d.fileName
                      a.click()
                    } catch {
                      toast.error("Could not download this document")
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-error"
                  title="Delete"
                  onClick={() => onDelete(d.id)}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} teacherId={teacherId} />
    </PanelCard>
  )
}

function UploadDocumentDialog({ open, onOpenChange, teacherId }: { open: boolean; onOpenChange: (v: boolean) => void; teacherId: string }) {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [type, setType] = useState<api.TeacherDocumentType>("OTHER")

  const uploadM = useMutation({
    mutationFn: () => api.uploadTeacherDocument(teacherId, {
      file: file!,
      title,
      type,
    }),
    onSuccess: () => {
      toast.success("Document uploaded")
      qc.invalidateQueries({ queryKey: ["admin-teacher-documents", teacherId] })
      onOpenChange(false)
      setFile(null)
      setTitle("")
      setType("OTHER")
    },
    onError: () => toast.error("Could not upload the document"),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next && !uploadM.isPending) onOpenChange(false)
    }}>
      <DialogContent className="rounded-lg max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Upload a document</DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Add an ID, license, degree or contract to this teacher's file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">File</Label>
            <label className="mt-2 flex flex-col items-center justify-center gap-1 cursor-pointer rounded-lg border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container-low py-6 text-center transition-all">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  if (f && !title) setTitle(f.name.replace(/\.[^.]*$/, ""))
                  e.target.value = ""
                }}
              />
              <span className="material-symbols-outlined text-[24px] text-primary">upload_file</span>
              <span className="font-label-md text-label-md text-on-surface">
                {file ? file.name : "Choose a file"}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">PDF, images or Word · up to 20MB</span>
            </label>
          </div>

          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Teaching license 2026"
              className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-body-md text-body-md"
            />
          </div>

          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as api.TeacherDocumentType)}>
              <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => (
                  <SelectItem key={t} value={t}>{docTypeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={uploadM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => uploadM.mutate()}
            disabled={uploadM.isPending || !file || !title.trim()}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {uploadM.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SalaryPanel({
  teacherId,
  salaries,
  isLoading,
  isError,
  onRetry,
}: {
  teacherId: string
  salaries: api.SalaryRecord[] | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const qc = useQueryClient()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<api.SalaryRecord | null>(null)
  const [deleting, setDeleting] = useState<api.SalaryRecord | null>(null)

  const deleteM = useMutation({
    mutationFn: (salaryId: string) => api.deleteTeacherSalary(teacherId, salaryId),
    onSuccess: () => {
      toast.success("Salary record removed")
      qc.invalidateQueries({ queryKey: ["admin-teacher-salaries", teacherId] })
      setDeleting(null)
    },
    onError: () => toast.error("Could not remove the salary record"),
  })

  if (isLoading) return <LoadingState label="Loading salary records…" />
  if (isError) return <ErrorState message="Could not load salary records." onRetry={onRetry} />

  const data = salaries ?? []

  return (
    <PanelCard
      title="Salary records"
      subtitle={`${data.length} record${data.length === 1 ? "" : "s"} by pay period`}
      action={
        <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => { setEditing(null); setEditorOpen(true) }}>
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add salary
        </Button>
      }
    >
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="payments" title="No salary records" description="Add salary records for this teacher by pay period." />
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <Table className="w-full min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 font-label text-label text-on-surface-variant">Period</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Amount</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Paid</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant">Status</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant">Notes</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="px-4 py-2.5 font-label-md text-label-md text-on-surface font-medium whitespace-nowrap">{r.period}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right whitespace-nowrap">{r.amount}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right whitespace-nowrap">{r.amountPaid ?? "—"}</TableCell>
                  <TableCell className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center rounded-md font-label-sm text-label-sm px-2 py-0.5 font-medium", salaryStatusStyles[r.status])}>{r.status}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant truncate max-w-[200px]">{r.body ?? "—"}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-on-surface-variant" onClick={() => { setEditing(r); setEditorOpen(true) }}>
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-error" onClick={() => setDeleting(r)}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SalaryEditorDialog
        key={editing?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        teacherId={teacherId}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Remove this salary record?"
        message={deleting ? `This removes the salary record for ${deleting.period}.` : ""}
        confirmLabel="Remove record"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteM.isPending}
        onConfirm={() => deleting && deleteM.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </PanelCard>
  )
}

function SalaryEditorDialog({
  open,
  onOpenChange,
  teacherId,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  teacherId: string
  editing: api.SalaryRecord | null
}) {
  const qc = useQueryClient()
  const [period, setPeriod] = useState(editing?.period ?? "")
  const [amount, setAmount] = useState(editing?.amount ?? "")
  const [amountPaid, setAmountPaid] = useState(editing?.amountPaid ?? "")
  const [status, setStatus] = useState<api.SalaryStatus>(editing?.status ?? "UNPAID")
  const [body, setBody] = useState(editing?.body ?? "")

  const saveM = useMutation({
    mutationFn: (input: api.CreateSalaryInput) =>
      editing
        ? api.updateTeacherSalary(teacherId, editing.id, input)
        : api.createTeacherSalary(teacherId, input),
    onSuccess: () => {
      toast.success(editing ? "Salary record updated" : "Salary record added")
      qc.invalidateQueries({ queryKey: ["admin-teacher-salaries", teacherId] })
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message || (editing ? "Could not update the record" : "Could not add the record")),
  })

  const handleSubmit = () => {
    if (!period.trim() || !amount) return
    saveM.mutate({
      period: period.trim(),
      amount: Number(amount),
      amountPaid: amountPaid.trim() ? Number(amountPaid) : null,
      status,
      body: body.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next && !saveM.isPending) onOpenChange(false)
    }}>
      <DialogContent className="rounded-lg max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">
            {editing ? "Edit salary record" : "Add salary record"}
          </DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Record salary for this teacher by pay period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Period</Label>
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. January 2026"
              className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
              />
            </div>
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Paid</Label>
              <Input
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
              />
            </div>
          </div>
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as api.SalaryStatus)}>
              <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {salaryStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Notes</Label>
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Optional notes"
              className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saveM.isPending || !period.trim() || !amount}
            className="flex-1 h-auto py-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveM.isPending ? "Saving…" : editing ? "Save changes" : "Add record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PersonalInfoCard({ profile }: { profile: api.AdminTeacherProfile }) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [revealedSsn, setRevealedSsn] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [ssnOpen, setSsnOpen] = useState(false)

  const avatarM = useMutation({
    mutationFn: (file: File) => api.uploadTeacherAvatar(profile.id, file),
    onSuccess: () => {
      toast.success("Photo updated")
      qc.invalidateQueries({ queryKey: ["admin-teacher-profile", profile.id] })
    },
    onError: () => toast.error("Could not update the photo"),
  })

  const revealM = useMutation({
    mutationFn: () => api.revealTeacherSsn(profile.id),
    onSuccess: (res) => setRevealedSsn(res.ssn),
    onError: () => toast.error("Could not reveal the SSN"),
  })

  const ec = profile.emergencyContact
  const rows: { label: string; value: string | null; icon: string }[] = [
    { label: "Phone", value: profile.phone, icon: "call" },
    { label: "Address", value: profile.street && profile.city ? `${profile.street}, ${profile.city}` : profile.street ?? profile.city, icon: "home" },
    { label: "Nationality", value: profile.nationality, icon: "travel_explore" },
    { label: "Personal email", value: profile.personalEmail, icon: "alternate_email" },
    { label: "Date of birth", value: profile.dateOfBirth ? fmtDate(profile.dateOfBirth) : null, icon: "cake" },
    { label: "Emergency contact", value: ec.name ? [ec.name, ec.phone, ec.relationship].filter(Boolean).join(" · ") : ec.phone ?? null, icon: "emergency" },
  ]

  return (
    <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Personal info</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => fileInputRef.current?.click()}>
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            {profile.avatarUrl ? "Change photo" : "Add photo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) avatarM.mutate(file)
              e.target.value = ""
            }}
          />
          <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => setEditOpen(true)}>
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 shrink-0">{row.icon}</span>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-on-surface-variant">{row.label}</p>
              <p className="font-body-md text-body-md text-on-surface truncate">{row.value ?? "—"}</p>
            </div>
          </div>
        ))}
        <div className="flex items-start gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 shrink-0">badge</span>
          <div className="min-w-0 flex-1">
            <p className="font-label-sm text-label-sm text-on-surface-variant">National ID / SSN</p>
            <p className="font-body-md text-body-md text-on-surface truncate">{revealedSsn ?? profile.ssnMasked ?? "—"}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {profile.ssnMasked && (
              <Button variant="ghost" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => (revealedSsn ? setRevealedSsn(null) : revealM.mutate())}>
                <span className="material-symbols-outlined text-[16px]">{revealedSsn ? "visibility_off" : "visibility"}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => setSsnOpen(true)}>
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </Button>
          </div>
        </div>
      </div>

      <PersonalDetailsDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />
      <SsnDialog open={ssnOpen} onOpenChange={setSsnOpen} profile={profile} />
    </div>
  )
}

function PersonalDetailsDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: api.AdminTeacherProfile
}) {
  const qc = useQueryClient()
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [street, setStreet] = useState(profile.street ?? "")
  const [city, setCity] = useState(profile.city ?? "")
  const [nationality, setNationality] = useState(profile.nationality ?? "")
  const [personalEmail, setPersonalEmail] = useState(profile.personalEmail ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "")
  const [ecName, setEcName] = useState(profile.emergencyContact.name ?? "")
  const [ecPhone, setEcPhone] = useState(profile.emergencyContact.phone ?? "")
  const [ecRel, setEcRel] = useState(profile.emergencyContact.relationship ?? "")

  const saveM = useMutation({
    mutationFn: () =>
      api.updateTeacherProfile(profile.id, {
        phone,
        street,
        city,
        nationality,
        personalEmail: personalEmail || null,
        dateOfBirth,
        emergencyContactName: ecName || null,
        emergencyContactPhone: ecPhone || null,
        emergencyContactRelationship: ecRel || null,
      }),
    onSuccess: () => {
      toast.success("Profile updated")
      qc.invalidateQueries({ queryKey: ["admin-teacher-profile", profile.id] })
      onOpenChange(false)
    },
    onError: () => toast.error("Could not update the profile"),
  })

  const ready = phone.trim() && street.trim() && city.trim() && nationality.trim() && dateOfBirth

  const field = (label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <Label className="font-label-sm text-label-sm text-on-surface">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saveM.isPending) onOpenChange(false) }}>
      <DialogContent className="rounded-lg max-w-lg bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Edit personal info</DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Update the teacher's contact and personal details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Phone", phone, setPhone)}
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Date of birth</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md" />
            </div>
          </div>
          {field("Street address", street, setStreet)}
          {field("City", city, setCity)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Nationality", nationality, setNationality)}
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Personal email</Label>
              <Input type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md" />
            </div>
          </div>
          <div className="rounded-lg border border-outline-variant p-4 space-y-4">
            <p className="font-label-md text-label-md text-on-surface">Emergency contact</p>
            {field("Name", ecName, setEcName)}
            {field("Phone", ecPhone, setEcPhone)}
            {field("Relationship", ecRel, setEcRel)}
          </div>
        </div>
        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending || !ready}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveM.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SsnDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: api.AdminTeacherProfile
}) {
  const qc = useQueryClient()
  const [ssn, setSsn] = useState("")
  const valid = /^\d{3}[- ]?\d{2}[- ]?\d{4}$/.test(ssn)

  const saveM = useMutation({
    mutationFn: () => api.updateTeacherProfile(profile.id, { ssn }),
    onSuccess: () => {
      toast.success("SSN updated")
      qc.invalidateQueries({ queryKey: ["admin-teacher-profile", profile.id] })
      onOpenChange(false)
      setSsn("")
    },
    onError: () => toast.error("Could not update the SSN"),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saveM.isPending) onOpenChange(false) }}>
      <DialogContent className="rounded-lg max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Update SSN</DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            The new number replaces the stored one (encrypted, e.g. 123-45-6789).
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="font-label-sm text-label-sm text-on-surface">SSN</Label>
          <Input
            value={ssn}
            onChange={(e) => setSsn(e.target.value)}
            placeholder="123-45-6789"
            className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
          />
        </div>
        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending || !valid}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveM.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
