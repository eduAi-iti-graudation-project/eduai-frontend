import { useState } from "react"
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

const documentCategories: api.StudentDocumentCategory[] = [
  "BIRTH_CERTIFICATE",
  "IMMUNIZATION_RECORD",
  "PREVIOUS_TRANSCRIPT",
  "PAYMENT_RECEIPT",
  "ID_DOCUMENT",
  "OTHER",
]

const documentCategoryLabels: Record<api.StudentDocumentCategory, string> = {
  BIRTH_CERTIFICATE: "Birth certificate",
  IMMUNIZATION_RECORD: "Immunization record",
  PREVIOUS_TRANSCRIPT: "Previous transcript",
  PAYMENT_RECEIPT: "Payment receipt",
  ID_DOCUMENT: "ID document",
  OTHER: "Other",
}

const feeTypes: api.FeeType[] = ["TUITION", "REGISTRATION", "EXAM", "MATERIALS", "OTHER"]
const feeTypeLabels: Record<api.FeeType, string> = {
  TUITION: "Tuition",
  REGISTRATION: "Registration",
  EXAM: "Exam",
  MATERIALS: "Materials",
  OTHER: "Other",
}

const feeStatuses: api.FeeStatus[] = ["PAID", "PARTIAL", "POSTPONED", "UNPAID"]

const feeStatusStyles: Record<api.FeeStatus, string> = {
  PAID: "bg-[#dcfce7] text-[#14532d]",
  PARTIAL: "bg-[#fef3c7] text-[#78350f]",
  POSTPONED: "bg-[#e0e2ec] text-[#41465c]",
  UNPAID: "bg-[#ffdad6] text-[#93000a]",
}

function severityTone(severity: string | undefined) {
  return severity === "LOW"
    ? "bg-[#e0e2ec] text-[#41465c]"
    : severity === "HIGH"
      ? "bg-[#ffdad6] text-[#93000a]"
      : "bg-[#fef3c7] text-[#78350f]"
}

function PercentChip({ value }: { value: number }) {
  const tone =
    value >= 60
      ? "bg-[#dcfce7] text-[#14532d]"
      : value >= 40
        ? "bg-[#fef3c7] text-[#78350f]"
        : "bg-[#ffdad6] text-[#93000a]"
  return (
    <span className={cn("inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md font-semibold", tone)}>
      {value}%
    </span>
  )
}

export function AdminStudentDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const profileQ = useQuery({
    queryKey: ["admin-student-profile", id],
    queryFn: () => api.getAdminStudentProfile(id),
    enabled: !!id,
  })
  const gradesQ = useQuery({
    queryKey: ["admin-student-quiz-grades", id],
    queryFn: () => api.getStudentQuizGrades(id),
    enabled: !!id,
  })
  const historyQ = useQuery({
    queryKey: ["admin-student-history", id],
    queryFn: () => api.getStudentHistory(id),
    enabled: !!id,
  })
  const docsQ = useQuery({
    queryKey: ["admin-student-documents", id],
    queryFn: () => api.getStudentDocuments(id),
    enabled: !!id,
  })
  const feesQ = useQuery({
    queryKey: ["admin-student-fees", id],
    queryFn: () => api.getStudentFees(id),
    enabled: !!id,
  })

  const deleteDocM = useMutation({
    mutationFn: (docId: string) => api.deleteStudentDocument(id, docId),
    onSuccess: () => {
      toast.success("Document deleted")
      qc.invalidateQueries({ queryKey: ["admin-student-documents", id] })
    },
    onError: () => toast.error("Could not delete the document"),
  })

  const resetM = useMutation({
    mutationFn: () => api.resetStudentCredentials(id),
    onSuccess: () => {
      toast.success("Set-password invite sent to the student.")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (profileQ.isLoading || (id && !profileQ.data)) {
    return (
      <div className="flex-1 px-4 py-4 min-w-0">
        <LoadingState label="Loading student profile…" />
      </div>
    )
  }
  if (profileQ.isError) {
    return (
      <div className="flex-1 px-4 py-4 min-w-0">
        <ErrorState message="Could not load this student's profile." onRetry={() => profileQ.refetch()} />
      </div>
    )
  }

  const profile = profileQ.data!

  const openConversation = async (guardianId: string) => {
    try {
      const thread = await api.createOrGetAdminChatThread(guardianId, "GUARDIAN")
      navigate(`/admin/chat/${thread.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start a conversation")
    }
  }

  return (
    <div className="flex-1 px-4 py-4 min-w-0">
      <div className="max-w-[1100px] mx-auto space-y-4 min-w-0">
        <PageHeader title="Student profile" subtitle="Academic record, documents and fee history" />

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-12 w-12 rounded-full shrink-0">
                <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-headline-md text-headline-md">
                  {initials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="font-headline-md text-headline-md text-on-surface leading-none truncate">{profile.name}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant font-medium">
                STUDENT
              </span>
              {profile.grade && (
                <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
                  {profile.grade.name ?? `Grade ${profile.grade.level}`}
                </span>
              )}
              {profile.guardian && (
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-[#dde1fd] text-[#41465c] font-medium">
                  <span className="material-symbols-outlined text-[14px]">family_restroom</span>
                  {profile.guardian.name}
                </span>
              )}
              {profile.guardian && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md font-label-md text-label-md"
                  onClick={() => openConversation(profile.guardian!.id)}
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">chat_bubble</span>
                  Message guardian
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-md font-label-md text-label-md"
                disabled={resetM.isPending}
                onClick={() => resetM.mutate()}
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                {resetM.isPending ? "Resetting…" : "Reset password"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <StatBox icon="calendar_month" label="Enrolled" value={fmtDate(profile.createdAt)} />
            <StatBox
              icon="flag"
              label="Active alerts"
              value={profile.activeAlertCount}
              tone={profile.activeAlertCount ? "danger" : "positive"}
            />
            <StatBox icon="quiz" label="Quizzes taken" value={profile.quizGradeSummary.count} />
            <StatBox
              icon="trending_up"
              label="Quiz average"
              value={profile.quizGradeSummary.averagePct === null ? "—" : `${profile.quizGradeSummary.averagePct}%`}
              tone={profile.quizGradeSummary.averagePct === null ? "default" : profile.quizGradeSummary.averagePct >= 60 ? "positive" : "warning"}
            />
          </div>
        </div>

        <Tabs defaultValue="grades">
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-1.5">
            <TabsList className="bg-surface-container-low h-auto p-1 w-full">
              <TabsTrigger value="grades" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Quiz grades
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                History
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Documents
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex-1 rounded-md font-label-md text-label-md text-on-surface-variant data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                Fees
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grades" className="mt-4">
            <GradesPanel grades={gradesQ} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryPanel historyQuery={historyQ.data ?? null} isLoading={historyQ.isLoading} isError={historyQ.isError} onRetry={() => historyQ.refetch()} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <DocumentsPanel
              docs={docsQ.data ?? null}
              isLoading={docsQ.isLoading}
              isError={docsQ.isError}
              onRetry={() => docsQ.refetch()}
              studentId={id}
              onDelete={(docId) => deleteDocM.mutate(docId)}
            />
          </TabsContent>
          <TabsContent value="fees" className="mt-4">
            <FeesPanel
              fees={feesQ.data ?? null}
              isLoading={feesQ.isLoading}
              isError={feesQ.isError}
              onRetry={() => feesQ.refetch()}
              studentId={id}
            />
          </TabsContent>
        </Tabs>

        <CredentialsDialog
          open={resetM.data !== undefined}
          onOpenChange={() => resetM.reset()}
          credentials={resetM.data ?? null}
        />
      </div>
    </div>
  )
}

function CredentialsDialog({
  open,
  onOpenChange,
  credentials,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  credentials: api.ResetStudentCredentialsResult | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Invite sent</DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            The student can set a new password from the invite we emailed them. No password is shown here.
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-container-low p-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant">School email</p>
              <p className="font-body-md text-body-md text-on-background break-all">{credentials.email}</p>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              We emailed a set-password invite to the student's inbox — the link is valid for 72 hours.
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function GradesPanel({ grades }: { grades: { data: api.StudentQuizGrade[] | undefined; isLoading: boolean; isError: boolean; refetch: () => void } }) {
  const data = grades.data ?? []
  if (grades.isLoading) return <LoadingState label="Loading quiz grades…" />
  if (grades.isError) return <ErrorState message="Could not load quiz grades." onRetry={() => grades.refetch()} />

  return (
    <PanelCard
      title="Quiz grades"
      subtitle={`${data.length} completed quiz attempt${data.length === 1 ? "" : "s"}`}
    >
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="quiz" title="No quiz results yet" description="This student hasn't completed any quizzes." />
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Quiz</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant">Class</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Score</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Result</TableHead>
                <TableHead className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="px-4 py-2.5 font-label-md text-label-md text-on-surface font-medium truncate max-w-[260px]">{g.quizTitle}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant truncate max-w-[180px]">{g.className}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right whitespace-nowrap">{g.totalScore}/{g.maxPoints}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right"><PercentChip value={g.percent} /></TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right whitespace-nowrap">{fmtDate(g.submittedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PanelCard>
  )
}

function HistoryPanel({ historyQuery, isLoading, isError, onRetry }: { historyQuery: api.StudentHistory | null; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) return <LoadingState label="Loading history…" />
  if (isError) return <ErrorState message="Could not load history." onRetry={onRetry} />

  const years = historyQuery?.years ?? []
  if (years.length === 0) {
    return (
      <PanelCard title="History" subtitle="Year-by-year progress">
        <div className="py-10">
          <EmptyState icon="history" title="No history yet" description="This student has no quiz attempts or warnings on record." />
        </div>
      </PanelCard>
    )
  }

  return (
    <div className="space-y-4">
      {years.map((y) => (
        <div key={y.year} className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{y.year}</h3>
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{y.quizCount} quiz{ y.quizCount === 1 ? "" : "zes"}</span>
              {y.quizAveragePct !== null && (
                <span className={cn("inline-flex items-center rounded-md font-label-sm text-label-sm px-2 py-0.5 font-semibold",
                  y.quizAveragePct >= 60 ? "bg-[#dcfce7] text-[#14532d]" : y.quizAveragePct >= 40 ? "bg-[#fef3c7] text-[#78350f]" : "bg-[#ffdad6] text-[#93000a]")}>
                  {y.quizAveragePct}% avg
                </span>
              )}
              {y.warnings.length > 0 && (
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-[#ffdad6] text-[#93000a] font-medium">
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  {y.warnings.length} warning{ y.warnings.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {y.warnings.length > 0 && (
            <div className="border-b border-outline-variant bg-[#fef7f6]">
              {y.warnings.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-[#93000a] shrink-0">warning</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface">{w.reason}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{fmtDate(w.createdAt)} · {w.type}</p>
                  </div>
                  <span className={cn("shrink-0 inline-flex items-center rounded-md font-label-sm text-label-sm px-2 py-0.5 font-medium", severityTone(w.severity ?? "MEDIUM"))}>
                    {w.severity ?? "MEDIUM"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {y.quizScores.length > 0 ? (
            <div className="overflow-x-auto min-w-0">
              <Table className="w-full min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-2.5 font-label text-label text-on-surface-variant">Quiz</TableHead>
                    <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Score</TableHead>
                    <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Result</TableHead>
                    <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {y.quizScores.map((q, i) => (
                    <TableRow key={`${q.quizTitle}-${i}`}>
                      <TableCell className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface truncate max-w-[300px]">{q.quizTitle}</TableCell>
                      <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right">{q.totalScore}/{q.maxPoints}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right"><PercentChip value={q.percent} /></TableCell>
                      <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant text-right whitespace-nowrap">{fmtDate(q.submittedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-6 text-center font-body-md text-body-md text-on-surface-variant">
              No quiz attempts recorded this year
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DocumentsPanel({
  studentId,
  docs,
  isLoading,
  isError,
  onRetry,
  onDelete,
}: {
  studentId: string
  docs: api.StudentDocument[] | null
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
      subtitle="Certificates, transcripts, records and uploads"
      action={
        <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => setUploadOpen(true)}>
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          Upload document
        </Button>
      }
    >
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="folder_open" title="No documents" description="Upload certificates, transcripts or other student records here." />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data.map((d) => (
            <div key={d.id} className="flex items-start gap-3 px-5 py-3">
              <span className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface font-medium truncate">{d.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                  {documentCategoryLabels[d.category]}{d.academicYear ? ` · ${d.academicYear}` : ""} · {fmtBytes(d.sizeBytes)} · uploaded {fmtDate(d.createdAt)}
                  {d.aiSuggestedCategory && d.aiSuggestedCategory !== d.category ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-tertiary-fixed px-1.5 py-0.5 font-label-sm text-label-sm text-on-tertiary-fixed">
                      <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                      AI suggested: {documentCategoryLabels[d.aiSuggestedCategory as api.StudentDocumentCategory] ?? d.aiSuggestedCategory}
                    </span>
                  ) : null}
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
                      const url = await api.getStudentDocumentUrl(studentId, d.id)
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

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} studentId={studentId} />
    </PanelCard>
  )
}

function UploadDocumentDialog({ open, onOpenChange, studentId }: { open: boolean; onOpenChange: (v: boolean) => void; studentId: string }) {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<api.StudentDocumentCategory | "">("")
  const [academicYear, setAcademicYear] = useState("")
  const [uploadedDoc, setUploadedDoc] = useState<api.StudentDocument | null>(null)

  const uploadM = useMutation({
    mutationFn: () => api.uploadStudentDocument(studentId, {
      file: file!,
      title,
      ...(category ? { category } : {}),
      academicYear: academicYear.trim() || null,
    }),
    onSuccess: (doc) => {
      toast.success("Document uploaded")
      qc.invalidateQueries({ queryKey: ["admin-student-documents", studentId] })
      setUploadedDoc(doc)
      setFile(null)
      setTitle("")
      setCategory("")
      setAcademicYear("")
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
            Add a certificate, transcript or record to this student's file.
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
              placeholder="e.g. Year 6 transcript"
              className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-body-md text-body-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as api.StudentDocumentCategory)}>
                <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                  <SelectValue placeholder="AI will suggest" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map((c) => (
                    <SelectItem key={c} value={c}>{documentCategoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">Leave empty to let AI suggest a category.</p>
            </div>
            <div>
              <Label className="font-label-sm text-label-sm text-on-surface">Academic year</Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2025–2026"
                className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
              />
            </div>
          </div>

          {uploadedDoc?.aiSuggestedCategory ? (
            <div className="rounded-lg border border-tertiary-container bg-tertiary-container/30 px-md py-2.5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container mt-0.5">auto_awesome</span>
              <div>
                <p className="font-label-sm text-label-sm text-on-tertiary-container">AI suggested category</p>
                <p className="font-label-md text-label-md text-on-tertiary-container">
                  {documentCategoryLabels[uploadedDoc.aiSuggestedCategory as api.StudentDocumentCategory] ?? uploadedDoc.aiSuggestedCategory}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex gap-md sm:gap-md">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (uploadedDoc) {
                setUploadedDoc(null)
                onOpenChange(false)
              } else {
                onOpenChange(false)
              }
            }}
            disabled={uploadM.isPending}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg"
          >
            {uploadedDoc ? "Done" : "Cancel"}
          </Button>
          {!uploadedDoc ? (
            <Button
              type="button"
              onClick={() => uploadM.mutate()}
              disabled={uploadM.isPending || !file || !title.trim()}
              className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploadM.isPending ? "Uploading…" : "Upload"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FeesPanel({
  studentId,
  fees,
  isLoading,
  isError,
  onRetry,
}: {
  studentId: string
  fees: api.StudentFee[] | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const qc = useQueryClient()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<api.StudentFee | null>(null)
  const [deletingFee, setDeletingFee] = useState<api.StudentFee | null>(null)

  const deleteM = useMutation({
    mutationFn: (feeId: string) => api.deleteStudentFee(studentId, feeId),
    onSuccess: () => {
      toast.success("Fee removed")
      qc.invalidateQueries({ queryKey: ["admin-student-fees", studentId] })
      setDeletingFee(null)
    },
    onError: () => toast.error("Could not remove the fee"),
  })

  if (isLoading) return <LoadingState label="Loading fees…" />
  if (isError) return <ErrorState message="Could not load fees." onRetry={onRetry} />

  const data = fees ?? []

  return (
    <PanelCard
      title="School fees"
      subtitle={`${data.length} fee · occurrence${data.length === 1 ? "" : "s"} across academic years`}
      action={
        <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => { setEditing(null); setEditorOpen(true) }}>
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add fee
        </Button>
      }
    >
      {data.length === 0 ? (
        <div className="py-10">
          <EmptyState icon="payments" title="No fees recorded" description="Add tuition or other school fees for this student by academic year." />
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <Table className="w-full min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 font-label text-label text-on-surface-variant">Year</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant">Fee</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Amount</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Paid</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant">Status</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant">Due</TableHead>
                <TableHead className="px-3 py-2.5 font-label text-label text-on-surface-variant text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="px-4 py-2.5 font-label-md text-label-md text-on-surface font-medium whitespace-nowrap">{f.academicYear}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface whitespace-nowrap">{feeTypeLabels[f.feeType]}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right whitespace-nowrap">{f.amount}</TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface tabular-nums text-right whitespace-nowrap">{f.amountPaid ?? "—"}</TableCell>
                  <TableCell className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center rounded-md font-label-sm text-label-sm px-2 py-0.5 font-medium", feeStatusStyles[f.status])}>{f.status}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{f.dueDate ? fmtDate(f.dueDate) : "—"}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-on-surface-variant" onClick={() => { setEditing(f); setEditorOpen(true) }}>
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-error" onClick={() => setDeletingFee(f)}>
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

      <FeeEditorDialog
        key={editing?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        studentId={studentId}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deletingFee}
        title="Remove this fee record?"
        message={deletingFee ? `This removes the ${feeTypeLabels[deletingFee.feeType]} fee for ${deletingFee.academicYear}.` : ""}
        confirmLabel="Remove fee"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteM.isPending}
        onConfirm={() => deletingFee && deleteM.mutate(deletingFee.id)}
        onCancel={() => setDeletingFee(null)}
      />
    </PanelCard>
  )
}

function FeeEditorDialog({
  open,
  onOpenChange,
  studentId,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  studentId: string
  editing: api.StudentFee | null
}) {
  const qc = useQueryClient()
  const [academicYear, setAcademicYear] = useState(editing?.academicYear ?? "")
  const [feeType, setFeeType] = useState<api.FeeType>(editing?.feeType ?? "TUITION")
  const [amount, setAmount] = useState(editing?.amount ?? "")
  const [amountPaid, setAmountPaid] = useState(editing?.amountPaid ?? "")
  const [status, setStatus] = useState<api.FeeStatus>(editing?.status ?? "UNPAID")

  const saveM = useMutation({
    mutationFn: (input: api.CreateFeeInput) =>
      editing
        ? api.updateStudentFee(studentId, editing.id, input)
        : api.createStudentFee(studentId, input),
    onSuccess: () => {
      toast.success(editing ? "Fee updated" : "Fee added")
      qc.invalidateQueries({ queryKey: ["admin-student-fees", studentId] })
      onOpenChange(false)
    },
    onError: () => toast.error(editing ? "Could not update the fee" : "Could not add the fee"),
  })

  const handleSubmit = () => {
    if (!academicYear.trim() || !feeType || !amount) return
    saveM.mutate({
      academicYear: academicYear.trim(),
      feeType,
      amount: Number(amount),
      amountPaid: amountPaid.trim() ? Number(amountPaid) : null,
      status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next && !saveM.isPending) onOpenChange(false)
    }}>
      <DialogContent className="rounded-lg max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">
            {editing ? "Edit fee" : "Add a fee"}
          </DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Record a fee for this student by academic year.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Academic year</Label>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2025–2026"
              className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
            />
          </div>
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface">Fee type</Label>
            <Select value={feeType} onValueChange={(v) => setFeeType(v as api.FeeType)}>
              <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feeTypes.map((t) => (
                  <SelectItem key={t} value={t}>{feeTypeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select value={status} onValueChange={(v) => setStatus(v as api.FeeStatus)}>
              <SelectTrigger className="mt-1.5 h-auto rounded-md border border-outline-variant bg-surface-container-lowest px-md py-2 font-medium text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feeStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saveM.isPending || !academicYear.trim() || !feeType || !amount}
            className="flex-1 h-auto py-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveM.isPending ? "Saving…" : editing ? "Save changes" : "Add fee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}