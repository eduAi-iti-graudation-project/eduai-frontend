import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import * as api from "@/lib/api"
import {
  parseCsvDetailed,
  parsePastedDetailed,
  toCsv,
  TEMPLATE_HEADERS,
  TEMPLATE_EXAMPLE,
  isTemplateHeader,
  isEmptyTemplatedFile,
} from "@/lib/csv-parser"
import {
  buildRecords,
  type StudentRecord,
  type StudentStatus,
} from "@/lib/import-validation"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

type SourceKind = "file" | "paste" | "template"
type Step = "upload" | "review" | "match" | "validate" | "result"

const PAGE_SIZE = 20

const FIELD_LABELS: Record<string, string> = {
  STUDENT_NAME: "Student full name",
  FIRST_NAME: "First name",
  LAST_NAME: "Last name",
  EMAIL: "Email",
  GRADE_LEVEL: "Grade level",
  SECTION: "Section",
  GUARDIAN_NAME: "Guardian name",
  GUARDIAN_EMAIL: "Guardian email",
  GUARDIAN_SSN: "Guardian SSN",
  GUARDIAN_PHONE: "Guardian phone",
  GUARDIAN_NATIONALITY: "Guardian nationality",
  UNMAPPED: "Skip (not imported)",
}

const REQUIRED_FIELDS = new Set<api.MigrateField>([
  "STUDENT_NAME",
  "FIRST_NAME",
  "LAST_NAME",
  "EMAIL",
])

const STATUS_META: Record<
  StudentStatus,
  { label: string; icon: string; className: string }
> = {
  ready: {
    label: "Ready",
    icon: "✓",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  attention: {
    label: "Needs attention",
    icon: "⚠",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  invalid: {
    label: "Invalid",
    icon: "✕",
    className: "border-red-300 bg-red-50 text-red-700",
  },
}

const STEP_LABELS = ["Upload", "Review", "Match Fields", "Import"] as const

function apiErrorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = (err as any)?.response?.data?.message
  if (typeof message === "string") return message
  if (Array.isArray(message)) return message.join(" · ")
  return "Import went wrong — check the file and try again."
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StepIndicator({ step }: { step: Step }) {
  const index =
    step === "result"
      ? STEP_LABELS.length - 1
      : step === "upload"
        ? 0
        : step === "review"
          ? 1
          : step === "match"
            ? 2
            : 3
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {STEP_LABELS.map((label, i) => {
        const done = i < index
        const active = i === index
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-8",
                  done || active ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function MaskedBadge() {
  return (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
      masked sample
    </Badge>
  )
}

function SampleChips({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-xs text-muted-foreground">no values</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v, i) => (
        <span
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
        >
          {v}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", meta.className)}>
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </Badge>
  )
}

function FileSummary({
  fileName,
  rows,
  fileSize,
  isTemplate,
}: {
  fileName: string | null
  rows: string[][]
  fileSize: number | null
  isTemplate: boolean
}) {
  const studentCount = Math.max(rows.length - 1, 0)
  const fieldCount = rows[0]?.length ?? 0
  const sizeLabel = fileSize != null ? formatSize(fileSize) : null
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-low">
        <span className="material-symbols-outlined text-on-surface-variant">
          description
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {fileName ?? "Your input"}
          </p>
          {isTemplate && (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-700"
            >
              template recognized — no AI step
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {studentCount} student{studentCount === 1 ? "" : "s"} detected ·{" "}
          {fieldCount} field{fieldCount === 1 ? "" : "s"}
          {sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      </div>
      <span className="text-sm font-semibold text-primary">
        {studentCount} student{studentCount === 1 ? "" : "s"}
      </span>
    </div>
  )
}

function QualityStat({
  count,
  label,
  tone,
}: {
  count: number
  label: string
  tone: "ready" | "attention" | "invalid"
}) {
  const tones: Record<string, string> = {
    ready: "text-emerald-600",
    attention: "text-amber-600",
    invalid: "text-red-600",
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn("text-3xl font-bold", tones[tone])}>{count}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  )
}

function QualitySummary({ records }: { records: StudentRecord[] }) {
  const ready = records.filter((r) => r.status === "ready").length
  const attention = records.filter((r) => r.status === "attention").length
  const invalid = records.filter((r) => r.status === "invalid").length
  if (records.length === 0) return null
  const allReady = attention === 0 && invalid === 0
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {records.length} student{records.length === 1 ? "" : "s"} detected
        </p>
        {allReady && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <span aria-hidden>✓</span>
            All ready to import
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QualityStat count={ready} label="Ready to import" tone="ready" />
        <QualityStat count={attention} label="Need attention" tone="attention" />
        <QualityStat count={invalid} label="Invalid" tone="invalid" />
      </div>
    </div>
  )
}

type IssueTone = "attention" | "invalid"

const ISSUE_TONE_META: Record<
  IssueTone,
  { icon: string; titleClass: string; cardClass: string; itemIconClass: string }
> = {
  attention: {
    icon: "warning",
    titleClass: "text-amber-800",
    cardClass: "border-amber-200 bg-amber-50/60",
    itemIconClass: "text-amber-500",
  },
  invalid: {
    icon: "error",
    titleClass: "text-red-700",
    cardClass: "border-red-200 bg-red-50/60",
    itemIconClass: "text-red-500",
  },
}

function StudentIssueCard({
  tone,
  title,
  subtitle,
  students,
  onFocus,
}: {
  tone: IssueTone
  title: string
  subtitle: string
  students: Array<{ index: number; name: string; issues: string[] }>
  onFocus?: (index: number) => void
}) {
  if (students.length === 0) return null
  const meta = ISSUE_TONE_META[tone]
  return (
    <div className={cn("overflow-hidden rounded-xl border", meta.cardClass)}>
      <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3">
        <span
          className={cn(
            "material-symbols-outlined mt-0.5 text-lg",
            meta.itemIconClass,
          )}
          aria-hidden
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <h4 className={cn("text-sm font-semibold", meta.titleClass)}>{title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {students.map((s) => (
          <li key={s.index} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {s.index}
              </span>
              {onFocus ? (
                <button
                  type="button"
                  onClick={() => onFocus(s.index)}
                  className="text-sm font-semibold text-on-surface underline-offset-4 hover:underline"
                >
                  Student {s.index} — {s.name || "Unknown Student"}
                </button>
              ) : (
                <span className="text-sm font-semibold text-on-surface">
                  Student {s.index} — {s.name || "Unknown Student"}
                </span>
              )}
            </div>
            <ul className="mt-2 space-y-1 pl-9">
              {s.issues.map((issue, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-on-surface-variant"
                >
                  <span
                    className={cn(
                      "material-symbols-outlined mt-px text-base",
                      meta.itemIconClass,
                    )}
                    aria-hidden
                  >
                    {meta.icon}
                  </span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StudentIssues({
  records,
  onFocus,
}: {
  records: StudentRecord[]
  onFocus?: (index: number) => void
}) {
  const attention = records.filter((r) => r.status === "attention")
  const invalid = records.filter((r) => r.status === "invalid")
  if (attention.length === 0 && invalid.length === 0) return null
  const toItems = (list: StudentRecord[]) =>
    list.map((r) => ({ index: r.index, name: r.name, issues: r.issues }))
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <StudentIssueCard
        tone="attention"
        title="Needs attention"
        subtitle={`${attention.length} student${attention.length === 1 ? "" : "s"} need${attention.length === 1 ? "s" : ""} attention — check the reasons below before importing.`}
        students={toItems(attention)}
        onFocus={onFocus}
      />
      <StudentIssueCard
        tone="invalid"
        title="Invalid"
        subtitle={`${invalid.length} student${invalid.length === 1 ? "" : "s"} cannot be imported until the errors are corrected.`}
        students={toItems(invalid)}
        onFocus={onFocus}
      />
    </div>
  )
}

interface FollowUpIssue {
  label: string
  severity: "attention" | "invalid"
}

/**
 * Frontend presentation layer: maps the technical reason strings the import
 * service returns into administrator-friendly language, and classifies each
 * case as needing attention (fixable / follow-up) vs invalid (cannot import).
 */
function followUpIssue(reason: string): FollowUpIssue {
  if (reason.includes("Missing required field: name")) {
    return { label: "Student name is missing.", severity: "invalid" }
  }
  if (reason.includes("self-register with the school code") || reason.includes("No email")) {
    return {
      label:
        "Missing email address — this student can join later using the school's signup code.",
      severity: "attention",
    }
  }
  if (reason.includes("Guardian data present but missing a valid guardian")) {
    return {
      label: "Guardian information is incomplete — the student was imported without a guardian.",
      severity: "attention",
    }
  }
  if (reason.includes("not a valid 9-digit SSN")) {
    return {
      label: "Guardian information contains an invalid SSN — the student was imported without a guardian.",
      severity: "invalid",
    }
  }
  if (reason.includes("duplicate row in file")) {
    return {
      label: "Duplicate student entry — another student in this file uses the same email address.",
      severity: "invalid",
    }
  }
  if (reason.includes("already a member of this school")) {
    return { label: "This student is already a member of the school.", severity: "attention" }
  }
  if (reason.includes("already pending review")) {
    return {
      label: "This student already has a request pending review.",
      severity: "attention",
    }
  }
  if (reason.startsWith("Auto-approval failed")) {
    return {
      label: "Account creation needs review — this student is waiting in Join Approvals.",
      severity: "attention",
    }
  }
  if (reason.includes("Template example row")) {
    return {
      label: "The template example row was included — remove it before importing.",
      severity: "attention",
    }
  }
  return { label: reason, severity: "attention" }
}

/** Parses the "grade · section" reason into one human-friendly line per issue. */
function unassignedIssues(reason: string): string[] {
  return reason.split(" · ").map((segment) => {
    const grade = segment.match(/^Grade level "(.*)" could not be matched$/)
    if (grade) return `Grade "${grade[1]}" doesn't match any available grade`
    const section = segment.match(/^Section "(.*)" could not be matched$/)
    if (section) return `Section "${section[1]}" doesn't match any available class`
    if (segment === "no grade level provided") return "Grade is missing"
    if (segment === "no section provided") return "Section is missing"
    return segment
  })
}

interface UnmatchedGroup {
  value: string
  rows: number[]
}

function buildUnmatchedGroups(
  values: Array<{ row: number; providedValue: string }>,
): UnmatchedGroup[] {
  const map = new Map<string, UnmatchedGroup>()
  for (const u of values) {
    const key = u.providedValue.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) existing.rows.push(u.row)
    else map.set(key, { value: u.providedValue, rows: [u.row] })
  }
  return [...map.values()]
    .map((g) => ({ ...g, rows: g.rows.sort((a, b) => a - b) }))
    .sort((a, b) => b.rows.length - a.rows.length)
}

function ResultStudentItem({
  row,
  name,
  issues,
  severity,
}: {
  row: number
  name: string
  issues: string[]
  severity: "attention" | "invalid"
}) {
  const icon = severity === "invalid" ? "error" : "warning"
  const iconClass = severity === "invalid" ? "text-red-500" : "text-amber-500"
  return (
    <div className="border-t border-border/60 py-3 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-on-surface">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">Student #{row}</span>
      </div>
      <ul className="mt-1.5 space-y-1.5">
        {issues.map((issue, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-on-surface-variant"
          >
            <span
              className={cn("material-symbols-outlined mt-px text-base", iconClass)}
              aria-hidden
            >
              {icon}
            </span>
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultCategory({
  id,
  icon,
  iconClass,
  title,
  description,
  count,
  defaultOpen = true,
  children,
}: {
  id: string
  icon: string
  iconClass: string
  title: string
  description: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Accordion type="multiple" defaultValue={defaultOpen ? [id] : []}>
        <AccordionItem value={id} className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex flex-1 items-center gap-3 text-left">
              <span
                className={cn("material-symbols-outlined shrink-0 text-lg", iconClass)}
                aria-hidden
              >
                {icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-on-surface">{title}</div>
                <div className="text-xs text-on-surface-variant">{description}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                {count}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function ResultMetric({
  value,
  label,
  icon,
  iconClass,
}: {
  value: number
  label: string
  icon: string
  iconClass: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn("material-symbols-outlined text-lg", iconClass)}
          aria-hidden
        >
          {icon}
        </span>
        <span className="text-2xl font-bold leading-none text-on-surface">{value}</span>
      </div>
      <div className="mt-1.5 text-sm font-medium text-on-surface-variant">{label}</div>
    </div>
  )
}

export function MigrationWizardPage() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>("upload")
  const [sourceKind, setSourceKind] = useState<SourceKind>("file")
  const [rawText, setRawText] = useState("")
  const [analysis, setAnalysis] = useState<api.MigrateAnalyzeResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, api.MigrateField>>({})
  const [result, setResult] = useState<api.MigrateImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const [readingError, setReadingError] = useState<string | null>(null)
  const focusedRowRef = useRef<HTMLTableRowElement | null>(null)
  const readerRef = useRef<FileReader | null>(null)

  const parsed = useMemo(() => {
    if (!rawText) return { rows: [] as string[][], issues: [] as string[] }
    try {
      return sourceKind === "paste"
        ? parsePastedDetailed(rawText)
        : parseCsvDetailed(rawText)
    } catch {
      return { rows: [], issues: [] }
    }
  }, [rawText, sourceKind])
  const rows = parsed.rows
  const parseIssues = parsed.issues

  // Abort any in-flight file read when the component unmounts.
  useEffect(() => () => readerRef.current?.abort(), [])

  const records = useMemo(
    () => buildRecords(rows, mapping),
    [rows, mapping],
  )

  const isTemplateFile = isTemplateHeader(rows[0] ?? [])

  const readyCount = useMemo(
    () => records.filter((r) => r.status === "ready").length,
    [records],
  )

  const resetAll = () => {
    setStep("upload")
    setAnalysis(null)
    setResult(null)
    setRawText("")
    setFileName(null)
    setFileSize(null)
    setMapping({})
    setPage(1)
    setFocusIndex(null)
    setReadingError(null)
  }

  const readFile = (file: File) => {
    // Start a fresh lifecycle: no stale rows, mapping, analysis or results
    // from a previously selected file may leak into the new one.
    setFileName(null)
    setFileSize(null)
    setRawText("")
    setMapping({})
    setAnalysis(null)
    setResult(null)
    setPage(1)
    setFocusIndex(null)
    setReadingError(null)

    // Only the latest read may update the UI. Cancel any previous read so an
    // older/slower file can never overwrite the file the admin just picked.
    readerRef.current?.abort()
    const reader = new FileReader()
    readerRef.current = reader
    reader.onload = () => {
      if (readerRef.current !== reader) return
      setFileName(file.name)
      setFileSize(file.size)
      setRawText(String(reader.result ?? ""))
      setReadingError(null)
    }
    reader.onerror = () => {
      if (readerRef.current !== reader) return
      setReadingError(
        `Could not read "${file.name}". The file may be locked or unreadable — try saving it again.`,
      )
    }
    reader.onabort = () => {
      // Superseded by a newer file selection — nothing to do.
    }
    reader.readAsText(file)
  }

  const analyzeText = async (text: string, kind: SourceKind) => {
    if (!text.trim()) {
      toast.error("Add a file, paste students, or pick the template first.")
      return
    }
    const parsed =
      kind === "paste" ? parsePastedDetailed(text) : parseCsvDetailed(text)
    if (isEmptyTemplatedFile(parsed.rows)) {
      toast.error(
        "This is the blank template with its example row. Add your own students to it, then import again.",
      )
      return
    }
    setBusy(true)
    // Never carry a previous file's mapping into a new analysis.
    setMapping({})
    try {
      const res =
        kind === "paste"
          ? await api.analyzeMigrationPasted(text)
          : await api.analyzeMigrationCsv(text)
      setAnalysis(res)
      setMapping(
        Object.fromEntries(res.columns.map((c) => [c.sourceColumn, c.suggestedField])),
      )
      setResult(null)
      setPage(1)
      setStep("review")
    } catch (err) {
      setMapping({})
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const text = await api.fetchImportTemplate()
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "eduai-students-template.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const hasCoreMapping = useMemo(() => {
    const fields = new Set(Object.values(mapping))
    const hasEmail = fields.has("EMAIL")
    const hasName =
      fields.has("STUDENT_NAME") ||
      (fields.has("FIRST_NAME") && fields.has("LAST_NAME"))
    return hasEmail && hasName
  }, [mapping])

  const runImport = async () => {
    if (!analysis || !hasCoreMapping) return
    setBusy(true)
    try {
      const payload = analysis.columns
        .filter((c) => mapping[c.sourceColumn] !== "UNMAPPED")
        .map((c) => ({
          sourceColumn: c.sourceColumn,
          mappedField: mapping[c.sourceColumn],
        }))
      // Send the import endpoint exactly the grid that was previewed, serialized
      // as comma CSV. The backend always imports with comma parsing, so this
      // guarantees what you see in the preview is what gets imported — and makes
      // pasted tab-separated data work without changing the API contract.
      const csvForImport = toCsv(rows)
      const res = await api.importStudentsCsv(csvForImport, payload)
      setResult(res)
      setStep("result")
      queryClient.invalidateQueries({ queryKey: ["students"] })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRecords = records.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const pageStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(safePage * PAGE_SIZE, records.length)

  const focusStudent = (index: number) => {
    setPage(Math.floor((index - 1) / PAGE_SIZE) + 1)
    setFocusIndex(index)
  }

  useEffect(() => {
    if (focusIndex === null) return
    if (
      focusIndex < (safePage - 1) * PAGE_SIZE + 1 ||
      focusIndex > safePage * PAGE_SIZE
    ) {
      return
    }
    focusedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    const timer = setTimeout(() => setFocusIndex(null), 2600)
    return () => clearTimeout(timer)
  }, [focusIndex, safePage])

  // ── Step 1: upload ────────────────────────────────────────
  if (step === "upload") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Import students"
          subtitle="Bring students into your school from a spreadsheet. Name and email create the account; grade and section are matched to the options you already have."
        />
        <StepIndicator step={step} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(
            [
              {
                kind: "file",
                title: "Upload a CSV file",
                desc: "The classic .csv export from any spreadsheet app.",
              },
              {
                kind: "paste",
                title: "Paste student data",
                desc: "Copy cells from Excel or Google Sheets and paste them in.",
              },
              {
                kind: "template",
                title: "Download template",
                desc: "Get the exact file we import with no mapping guesswork.",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => setSourceKind(opt.kind)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                sourceKind === opt.kind
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="font-semibold">{opt.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-background p-5">
          {sourceKind === "file" && (
            <>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary/50">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {fileName ?? "Choose a .csv file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  The first row must contain the column headers.
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) readFile(file)
                    // Allow re-selecting the same file by resetting the input.
                    try {
                      e.target.value = ""
                    } catch {
                      // Some environments reject clearing a file input — ignore.
                    }
                  }}
                />
              </label>
            </>
          )}

          {sourceKind === "paste" && (
            <Textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value)
                setAnalysis(null)
                setResult(null)
                setMapping({})
                setReadingError(null)
              }}
              placeholder={`Paste students here, e.g.\n\nName\tEmail\tGrade\nAya Hassan\taya@example.com\tGrade 7`}
              rows={8}
            />
          )}

          {sourceKind === "template" && (
            <div className="space-y-3">
              <p className="text-sm">
                The template already carries the exact headers we look for, so the AI
                mapping step is skipped and you get a deterministic one-to-one mapping.
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {TEMPLATE_HEADERS.map((h) => (
                  <li key={h}>
                    <span className="font-mono text-foreground">{h}</span>
                  </li>
                ))}
              </ol>
              <div className="overflow-x-auto rounded-lg border border-border p-3 font-mono text-xs text-muted-foreground">
                <div>{TEMPLATE_HEADERS.join(", ")}</div>
                <div>{TEMPLATE_EXAMPLE.join(", ")}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={downloadTemplate}>
                  Download blank template (.csv)
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      const text = await api.fetchImportTemplate()
                      setRawText(text)
                      setFileName("eduai-students-template.csv")
                      setAnalysis(null)
                      setResult(null)
                      await analyzeText(text, "file")
                    } catch (err) {
                      toast.error(apiErrorMessage(err))
                    }
                  }}
                >
                  Open a sample here →
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                The example row is a legend — it is never imported.
              </div>
            </div>
          )}
        </div>

        {readingError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <span className="material-symbols-outlined text-lg" aria-hidden>
              error
            </span>
            <p>{readingError}</p>
          </div>
        )}

        {parseIssues.length > 0 && rawText && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="material-symbols-outlined mt-px text-lg" aria-hidden>
              warning
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                This file has formatting issues that may affect how it is read:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {parseIssues.slice(0, 5).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
                {parseIssues.length > 5 && (
                  <li>…and {parseIssues.length - 5} more</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {rawText && (
          <FileSummary
            fileName={fileName}
            rows={rows}
            fileSize={fileSize}
            isTemplate={isTemplateFile}
          />
        )}

        <div className="flex justify-end gap-2">
          {sourceKind === "paste" && rawText && (
            <Button variant="ghost" onClick={() => setRawText("")}>
              Clear
            </Button>
          )}
          <Button
            onClick={() => analyzeText(rawText, sourceKind)}
            disabled={busy || !rawText.trim()}
          >
            {busy ? "Reading students…" : "Continue"}
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 2: review students ───────────────────────────────
  if (step === "review") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Review students"
          subtitle={`${records.length} students found. We checked your file against the account requirements — fix anything that needs attention, then continue.`}
        />
        <StepIndicator step={step} />

        {records.length === 0 ? (
          <EmptyState
            icon="group_off"
            title="No students found"
            description="We couldn't find any student rows in this file. Upload a CSV with a header row and at least one student."
            action={
              <Button onClick={() => setStep("upload")}>Back to upload</Button>
            }
          />
        ) : (
          <>
            <QualitySummary records={records} />

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="max-h-[24rem] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b">
                      <th className="h-12 w-16 px-4 text-left align-middle font-medium text-muted-foreground">
                        #
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Student
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Grade
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Section
                      </th>
                      <th className="h-12 w-44 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((r) => (
                      <tr
                        key={r.index}
                        ref={focusIndex === r.index ? focusedRowRef : undefined}
                        className={cn(
                          "border-b transition-colors last:border-0 hover:bg-muted/50",
                          focusIndex === r.index && "bg-primary/10",
                        )}
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground align-middle">
                          {r.index}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="font-semibold">{r.name || "—"}</span>
                          {r.issues.length > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {r.issues.join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">{r.email || "—"}</td>
                        <td className="px-4 py-3 align-middle">{r.grade || "—"}</td>
                        <td className="px-4 py-3 align-middle">{r.section || "—"}</td>
                        <td className="px-4 py-3 align-middle">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {pageStart}–{pageEnd} of {records.length} students
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <StudentIssues records={records} onFocus={focusStudent} />
          </>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => setStep("upload")}>
            ← Back to upload
          </Button>
          <Button onClick={() => setStep("match")}>
            Continue to field matching
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 3: match fields ──────────────────────────────────
  if (step === "match") {
    if (!analysis) return null
    const fieldToColumns = new Map<string, string[]>()
    for (const c of analysis.columns) {
      const field = mapping[c.sourceColumn]
      if (!field || field === "UNMAPPED") continue
      const list = fieldToColumns.get(field) ?? []
      list.push(c.sourceColumn)
      fieldToColumns.set(field, list)
    }
    const duplicateFields = [...fieldToColumns].filter(
      ([, cols]) => cols.length > 1,
    )
    const unmappedCount = analysis.columns.filter(
      (c) => (mapping[c.sourceColumn] ?? "UNMAPPED") === "UNMAPPED",
    ).length
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Match your student information"
          subtitle="Match each field in your file to the information we use for student profiles. The suggested mapping is pre-filled — fix anything that looks off."
        />
        <StepIndicator step={step} />

        {duplicateFields.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">
              {duplicateFields.length} student field
              {duplicateFields.length === 1 ? " is" : "s are"} assigned to more
              than one column.
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {duplicateFields.map(([field, cols]) => (
                <li key={field}>
                  {FIELD_LABELS[field]} ← {cols.join(", ")} — only the first
                  column is used.
                </li>
              ))}
            </ul>
          </div>
        )}

        {fieldToColumns.size > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-2 text-sm font-semibold">Current mapping</h4>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {[...fieldToColumns].map(([field, cols]) => (
                <div
                  key={field}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <dt className="font-medium text-on-surface">
                    {FIELD_LABELS[field]}
                  </dt>
                  <dd className="truncate font-mono text-xs text-on-surface-variant">
                    {cols.join(", ")}
                  </dd>
                </div>
              ))}
              {unmappedCount > 0 && (
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="font-medium text-muted-foreground">
                    Skip (not imported)
                  </dt>
                  <dd className="truncate font-mono text-xs text-muted-foreground">
                    {unmappedCount} column{unmappedCount === 1 ? "" : "s"}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="space-y-3">
          {analysis.columns.map((col) => {
            const mappedField = mapping[col.sourceColumn] ?? "UNMAPPED"
            const isMapped = mappedField !== "UNMAPPED"
            return (
              <div
                key={col.sourceColumn}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isMapped && (
                      <span
                        className="material-symbols-outlined text-lg text-emerald-600"
                        aria-hidden
                      >
                        check_circle
                      </span>
                    )}
                    <span className="font-mono text-sm font-semibold">
                      {col.sourceColumn}
                    </span>
                    {col.masked && <MaskedBadge />}
                  </div>
                  <div className="mt-2">
                    <SampleChips values={col.sampleValues} />
                  </div>
                </div>
                <div className="w-56">
                  <Select
                    value={mappedField}
                    onValueChange={(v) =>
                      setMapping((m) => ({
                        ...m,
                        [col.sourceColumn]: v as api.MigrateField,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {api.IMPORTABLE_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {FIELD_LABELS[field]}
                        </SelectItem>
                      ))}
                      <SelectItem value="UNMAPPED">{FIELD_LABELS.UNMAPPED}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isMapped
                      ? REQUIRED_FIELDS.has(mappedField)
                        ? "Required field"
                        : "Optional"
                      : "Field will be skipped"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {!hasCoreMapping && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            We need an <strong>email</strong> column and a{" "}
            <strong>student name</strong> (or “first name” + “last name”) to create
            accounts. Without them the students are deferred instead of imported.
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => setStep("review")}>
            ← Back to review
          </Button>
          <Button onClick={() => setStep("validate")}>
            Continue to import
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 4: validate & import ─────────────────────────────
  if (step === "validate") {
    const needsAttention = records.length - readyCount
    const mapped = new Set(Object.values(mapping))
    const checks = [
      {
        label: "Student name",
        ok:
          mapped.has("STUDENT_NAME") ||
          (mapped.has("FIRST_NAME") && mapped.has("LAST_NAME")),
      },
      { label: "Email", ok: mapped.has("EMAIL") },
      { label: "Grade level", ok: mapped.has("GRADE_LEVEL") },
      { label: "Section", ok: mapped.has("SECTION") },
    ]
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Ready to import"
          subtitle="Confirm the summary, then import your students."
        />
        <StepIndicator step={step} />

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-primary">{records.length}</div>
          <div className="text-sm font-semibold">students in this file</div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QualityStat count={readyCount} label="Ready to import" tone="ready" />
            <QualityStat
              count={needsAttention}
              label="Needs attention"
              tone="attention"
            />
            <QualityStat count={0} label="Invalid" tone="invalid" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold">Required information</h4>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    c.ok
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600",
                  )}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden>
                    {c.ok ? "check" : "close"}
                  </span>
                </span>
                <span className={c.ok ? "" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {needsAttention > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="material-symbols-outlined text-lg" aria-hidden>
              warning
            </span>
            <p>
              <strong>
                {needsAttention} student{needsAttention === 1 ? "" : "s"} need
                {needsAttention === 1 ? "s" : ""} attention
              </strong>{" "}
              and will not be imported. You can still review them in the results.
            </p>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => setStep("match")}>
            ← Back to mapping
          </Button>
          <Button
            onClick={runImport}
            disabled={busy || !hasCoreMapping || readyCount === 0}
          >
            {busy
              ? "Importing…"
              : `Import ${readyCount} student${readyCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 5: result ────────────────────────────────────────
  if (!result) return null
  const { imported, unassignedGradeOrSection, needsFollowUp, unmatchedSectionsOrGrades } =
    result

  const studentName = (row: number) => {
    const rec = records.find((r) => r.index === row - 1)
    return rec?.name || "Unnamed student"
  }

  const followUpAttention = needsFollowUp.filter(
    (n) => followUpIssue(n.reason).severity === "attention",
  )
  const followUpInvalid = needsFollowUp.filter(
    (n) => followUpIssue(n.reason).severity === "invalid",
  )

  const unmatchedGroups = buildUnmatchedGroups(unmatchedSectionsOrGrades)

  const needsReview = unassignedGradeOrSection.length + needsFollowUp.length
  const needsAttentionCount = unassignedGradeOrSection.length

  const metrics = [
    {
      value: imported,
      label: "Imported",
      icon: "check_circle",
      iconClass: "text-emerald-600",
    },
    {
      value: needsAttentionCount,
      label: "Needs attention",
      icon: "warning",
      iconClass: "text-amber-600",
    },
    {
      value: needsFollowUp.length,
      label: "Not imported",
      icon: "cancel",
      iconClass: "text-red-600",
    },
  ]
  if (unmatchedGroups.length > 0) {
    metrics.push({
      value: unmatchedGroups.length,
      label: "Unmatched values",
      icon: "help",
      iconClass: "text-on-surface-variant",
    })
  }

  const successLine = () => {
    if (imported === 0 && needsReview === 0) return "No students were added or changed."
    if (needsReview === 0) {
      return `All ${imported} student${imported === 1 ? "" : "s"} imported successfully.`
    }
    const parts: string[] = []
    parts.push(
      imported > 0
        ? `${imported} student${imported === 1 ? "" : "s"} imported successfully.`
        : "No students were imported.",
    )
    if (needsAttentionCount > 0) {
      parts.push(
        `${needsAttentionCount} student${needsAttentionCount === 1 ? "" : "s"} need${
          needsAttentionCount === 1 ? "s" : ""
        } your attention before their records are complete.`,
      )
    }
    if (needsFollowUp.length > 0) {
      parts.push(
        `${needsFollowUp.length} student${needsFollowUp.length === 1 ? "" : "s"} could not be imported and need follow-up.`,
      )
    }
    return parts.join(" ")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Import Students"
        subtitle="Review the results of your student import."
      />
      <StepIndicator step={step} />

      {/* B. Import success summary */}
      <div className="flex flex-col gap-4 rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <span className="material-symbols-outlined" aria-hidden>
            check
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-emerald-900">Import completed</h2>
          <p className="mt-0.5 text-sm text-emerald-800">{successLine()}</p>
        </div>
      </div>

      {/* C. Summary metrics */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3",
          metrics.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        {metrics.map((m) => (
          <ResultMetric
            key={m.label}
            value={m.value}
            label={m.label}
            icon={m.icon}
            iconClass={m.iconClass}
          />
        ))}
      </div>

      {/* D. Action required */}
      {needsReview > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Needs your attention</h3>
            <p className="text-sm text-muted-foreground">
              These students were not fully matched during import. Review the details
              below.
            </p>
          </div>

          {unassignedGradeOrSection.length > 0 && (
            <ResultCategory
              id="missing-class"
              icon="warning"
              iconClass="text-amber-500"
              title="Students missing class information"
              description="Imported, but their grade or section couldn't be matched."
              count={unassignedGradeOrSection.length}
            >
              {unassignedGradeOrSection.map((u) => (
                <ResultStudentItem
                  key={u.row}
                  row={u.row}
                  name={studentName(u.row)}
                  issues={unassignedIssues(u.reason)}
                  severity="attention"
                />
              ))}
            </ResultCategory>
          )}

          {followUpAttention.length > 0 && (
            <ResultCategory
              id="follow-up"
              icon="schedule"
              iconClass="text-amber-500"
              title="Students that need follow-up"
              description="These students could not be fully imported because required information is missing or incomplete."
              count={followUpAttention.length}
            >
              {followUpAttention.map((n) => (
                <ResultStudentItem
                  key={n.row}
                  row={n.row}
                  name={studentName(n.row)}
                  issues={[followUpIssue(n.reason).label]}
                  severity="attention"
                />
              ))}
            </ResultCategory>
          )}

          {followUpInvalid.length > 0 && (
            <ResultCategory
              id="invalid"
              icon="error"
              iconClass="text-red-500"
              title="Students with invalid information"
              description="These students have information that is invalid and cannot be imported as-is."
              count={followUpInvalid.length}
            >
              {followUpInvalid.map((n) => (
                <ResultStudentItem
                  key={n.row}
                  row={n.row}
                  name={studentName(n.row)}
                  issues={[followUpIssue(n.reason).label]}
                  severity="invalid"
                />
              ))}
            </ResultCategory>
          )}
        </section>
      )}

      {/* F. Information we couldn't match */}
      {unmatchedGroups.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Information we couldn't match</h3>
            <p className="text-sm text-muted-foreground">
              Some grade or section values from your file don't match the options
              available at your school.
            </p>
          </div>
          <ResultCategory
            id="unmatched"
            icon="help"
            iconClass="text-on-surface-variant"
            title="Unmatched grade or section values"
            description={`${unmatchedGroups.length} value${
              unmatchedGroups.length === 1 ? "" : "s"
            } from your file didn't match anything at your school.`}
            count={unmatchedGroups.length}
          >
            {unmatchedGroups.map((g) => (
              <div key={g.value} className="border-t border-border/60 py-3 first:border-t-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-on-surface">
                    {g.value}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {g.rows.length} student{g.rows.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Affected: {g.rows.slice(0, 3).map(studentName).join(", ")}
                  {g.rows.length > 3 ? ` and ${g.rows.length - 3} more` : ""}
                </p>
              </div>
            ))}
          </ResultCategory>
        </section>
      )}

      {/* G. Final actions */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        {needsReview > 0 ? (
          <Button asChild>
            <Link to="/admin/join-approvals">Review students →</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/admin/students">View students →</Link>
          </Button>
        )}
        <Button variant="secondary" onClick={resetAll}>
          Import more students
        </Button>
        {needsReview > 0 && (
          <Button variant="ghost" asChild>
            <Link to="/admin/students">View students</Link>
          </Button>
        )}
      </div>
    </div>
  )
}