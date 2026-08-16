import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import * as api from "@/lib/api"
import {
 parseCsv,
 parsePasted,
 TEMPLATE_HEADERS,
 TEMPLATE_EXAMPLE,
 isTemplateHeader,
 isEmptyTemplatedFile,
} from "@/lib/csv-parser"
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
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SourceKind = "file" | "paste" | "template"
type Step = "source" | "review" | "result"

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

function apiErrorMessage(err: unknown): string {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const message = (err as any)?.response?.data?.message
 if (typeof message === "string") return message
 if (Array.isArray(message)) return message.join(" · ")
 return "Import went wrong — check the file and try again."
}

function MaskedBadge() {
 return (
  <Badge variant="outline" className="border-highlight/40 bg-highlight/10 text-highlight">
   masked sample
  </Badge>
 )
}

function SampleChips({ values }: { values: string[] }) {
 if (values.length === 0) {
  return <span className="text-label-sm text-muted-foreground">no values</span>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
  <div className="space-y-3">
   <h3 className="text-lg font-semibold">{title}</h3>
   <div className="rounded-xl border border-border bg-card p-4">{children}</div>
  </div>
 )
}

function SummaryCard({
 label,
 value,
 tone,
 detail,
}: {
 label: string
 value: number
 tone: "imported" | "warn" | "danger"
 detail: string
}) {
 const tones: Record<string, string> = {
  imported: "text-success",
  warn: "text-highlight",
  danger: "text-danger",
 }
 return (
  <div className="rounded-xl border border-border bg-card p-4">
   <div className={cn("text-3xl font-bold", tones[tone])}>{value}</div>
   <div className="text-sm font-semibold">{label}</div>
   <div className="mt-1 text-label-sm text-muted-foreground">{detail}</div>
  </div>
 )
}

export function MigrationWizardPage() {
 const queryClient = useQueryClient()
 const [step, setStep] = useState<Step>("source")
 const [sourceKind, setSourceKind] = useState<SourceKind>("file")
 const [rawText, setRawText] = useState("")
 const [analysis, setAnalysis] = useState<api.MigrateAnalyzeResult | null>(null)
 const [mapping, setMapping] = useState<Record<string, api.MigrateField>>({})
 const [result, setResult] = useState<api.MigrateImportResult | null>(null)
 const [busy, setBusy] = useState(false)
 const [fileName, setFileName] = useState<string | null>(null)

 const rows = useMemo(() => {
  if (!rawText) return []
  try {
   return sourceKind === "paste" ? parsePasted(rawText) : parseCsv(rawText)
  } catch {
   return []
  }
 }, [rawText, sourceKind])

 const isTemplateFile = isTemplateHeader(rows[0] ?? [])

 const readFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = () => {
   setFileName(file.name)
   setRawText(String(reader.result ?? ""))
   setAnalysis(null)
   setResult(null)
  }
  reader.readAsText(file)
 }

 const analyzeText = async (text: string, kind: SourceKind) => {
  if (!text.trim()) {
   toast.error("Add a file, paste rows, or pick the template first.")
   return
  }
  const parsed = kind === "paste" ? parsePasted(text) : parseCsv(text)
  if (isEmptyTemplatedFile(parsed)) {
   toast.error(
    "This is the blank template with its example row. Add your own students to it, then import again.",
   )
   return
  }
  setBusy(true)
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
   setStep("review")
  } catch (err) {
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
   const res = await api.importStudentsCsv(rawText, payload)
   setResult(res)
   setStep("result")
   queryClient.invalidateQueries({ queryKey: ["students"] })
  } catch (err) {
   toast.error(apiErrorMessage(err))
  } finally {
   setBusy(false)
  }
 }

 // ── Step 1: source ────────────────────────────────────────
 if (step === "source") {
  return (
   <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader
     title="Import students"
     subtitle="Bring students into your school from a spreadsheet. Name and email create the account; grade and section are matched to the options you already have."
    />

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
        title: "Paste rows",
        desc: "Copy cells from Excel or Google Sheets and paste them in.",
       },
       {
        kind: "template",
        title: "Blank template",
        desc: "Download the exact file we import with no mapping guesswork.",
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

    <div className="space-y-4 rounded-xl border border-border bg-background p-md">
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
        <span className="text-label-sm text-muted-foreground">
         The first row must contain the column headers.
        </span>
        <input
         type="file"
         accept=".csv,text/csv"
         className="hidden"
         onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) readFile(file)
          e.target.value = ""
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
       }}
       placeholder={`Paste cells here, e.g.\n\nName\tEmail\tGrade\nAya Hassan\taya@example.com\tGrade 7`}
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
       <div className="overflow-x-auto rounded-lg border border-border p-3 font-mono text-label-sm text-muted-foreground">
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
       <div className="text-label-sm text-muted-foreground">
        The example row is a legend — it is never imported.
       </div>
      </div>
     )}
    </div>

    {rawText && (
     <div className="rounded-xl border border-border bg-background p-md">
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
       <span>
        Previewing {fileName ?? "your input"} · {rows.length - 1} data rows
       </span>
       {isTemplateFile && (
        <Badge
         variant="outline"
         className="border-success/40 bg-success/10 text-success"
        >
         template recognized — no AI step
        </Badge>
       )}
      </div>
      <div className="max-h-56 overflow-auto rounded-md border border-border">
       <Table>
        <TableHeader>
         <TableRow>
          {(rows[0] ?? []).map((h, i) => (
           <TableHead key={i} className="whitespace-nowrap font-mono text-[11px]">
            {h}
           </TableHead>
          ))}
         </TableRow>
        </TableHeader>
        <TableBody>
         {rows.slice(1, 6).map((r, ri) => (
          <TableRow key={ri}>
           {r.map((c, ci) => (
            <TableCell key={ci} className="whitespace-nowrap text-label-sm">
             {c || "—"}
            </TableCell>
           ))}
          </TableRow>
         ))}
        </TableBody>
       </Table>
      </div>
     </div>
    )}

    <div className="flex justify-end gap-2">
     {sourceKind === "paste" && rawText && (
      <Button variant="ghost" onClick={() => setRawText("")}>
       Clear
      </Button>
     )}
     <Button onClick={() => analyzeText(rawText, sourceKind)} disabled={busy || !rawText.trim()}>
      {busy ? "Reading…" : "Next — map the columns"}
     </Button>
    </div>
   </div>
  )
 }

 // ── Step 2: review / map columns ───────────────────────────
 if (step === "review") {
  if (!analysis) return null
  return (
   <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader
     title="Review the column mapping"
     subtitle={`${analysis.totalRows} students found. The suggested mapping is pre-filled — fix anything that looks off, then import.`}
    />

    <div className="space-y-3">
     {analysis.columns.map((col) => (
      <div
       key={col.sourceColumn}
       className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
      >
       <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
         <span className="font-mono text-sm font-semibold">{col.sourceColumn}</span>
         {col.masked && <MaskedBadge />}
        </div>
        <div className="mt-2">
         <SampleChips values={col.sampleValues} />
        </div>
       </div>
       <div className="w-56">
        <Select
         value={mapping[col.sourceColumn] ?? "UNMAPPED"}
         onValueChange={(v) =>
          setMapping((m) => ({ ...m, [col.sourceColumn]: v as api.MigrateField }))
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
       </div>
      </div>
     ))}
    </div>

    {!hasCoreMapping && (
     <div className="rounded-lg border border-highlight/40 bg-highlight/10 p-4 text-sm text-highlight">
      We need an <strong>email</strong> column and a <strong>student name</strong>{" "}
      (or “first name” + “last name”) to create accounts. Without them the rows are
      deferred instead of imported.
     </div>
    )}

    <div className="flex justify-between gap-2">
     <Button variant="ghost" onClick={() => setStep("source")}>
      ← Back to the file
     </Button>
     <Button onClick={runImport} disabled={busy || !hasCoreMapping}>
      {busy ? "Importing…" : "Import students"}
     </Button>
    </div>
   </div>
  )
 }

 // ── Step 3: result ─────────────────────────────────────────
 if (!result) return null
 const { imported, unassignedGradeOrSection, needsFollowUp, unmatchedSectionsOrGrades } =
  result

 return (
  <div className="mx-auto max-w-3xl space-y-6">
   <PageHeader
    title="Import summary"
    subtitle="Rows with complete data are imported right away — accounts are created and credentials emailed. Rows that still need fixing (or whose auto-approval failed) are staged for review in Join Approvals."
   />

   <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <SummaryCard
     label="Students staged"
     value={imported}
     tone="imported"
     detail="Ready for approval with grade/section where matched"
    />
    <SummaryCard
     label="Unassigned grade / section"
     value={unassignedGradeOrSection.length}
     tone="warn"
     detail="Staged, but missing or unmatched grade/section"
    />
    <SummaryCard
     label="Needs follow-up"
     value={needsFollowUp.length}
     tone="danger"
     detail="Not staged (missing name/email or duplicate email)"
    />
   </div>

   {unassignedGradeOrSection.length > 0 && (
    <Section title="Staged, but unassigned">
     <p className="text-sm text-muted-foreground">
      These students are staged for approval, but their grade or section didn't match.
      They'll be created without grade/section; you can edit them after approval.
     </p>
     <div className="my-3">
      <Button asChild>
       <Link to="/admin/join-approvals">Review staged students →</Link>
      </Button>
     </div>
     <Table>
      <TableHeader>
       <TableRow>
        <TableHead className="w-16">Row</TableHead>
        <TableHead>Reason</TableHead>
       </TableRow>
      </TableHeader>
      <TableBody>
       {unassignedGradeOrSection.slice(0, 10).map((u, i) => (
        <TableRow key={i}>
         <TableCell>{u.row}</TableCell>
         <TableCell>{u.reason}</TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    </Section>
   )}

   {needsFollowUp.length > 0 && (
    <Section title="Needs follow-up — not staged">
     <p className="text-sm text-muted-foreground">
      These rows couldn't be staged. Students without an email can still join using
      your school's code from the signup page.
     </p>
     <Table>
      <TableHeader>
       <TableRow>
        <TableHead className="w-16">Row</TableHead>
        <TableHead>Reason</TableHead>
       </TableRow>
      </TableHeader>
      <TableBody>
       {needsFollowUp.map((u, i) => (
        <TableRow key={i}>
         <TableCell>{u.row}</TableCell>
         <TableCell>{u.reason}</TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    </Section>
   )}

   {unmatchedSectionsOrGrades.length > 0 && (
    <Section title="Values we could not match">
     <p className="text-sm text-muted-foreground">
      The grade/section text below didn't match any option in your school. The
      students are still staged, but will be created without grade/section; you can
      edit their profiles after approval.
     </p>
     <div className="flex flex-wrap gap-2">
      {unmatchedSectionsOrGrades.map((v, i) => (
       <Badge key={i} variant="outline" className="font-mono">
        Row {v.row}: “{v.providedValue}”
       </Badge>
      ))}
     </div>
    </Section>
   )}

   <div className="flex flex-wrap justify-between gap-2">
    <Button
     variant="outline"
     onClick={() => {
      setStep("source")
      setAnalysis(null)
      setResult(null)
      setRawText("")
      setFileName(null)
     }}
    >
     Import another file
    </Button>
    <Button asChild>
     <Link to="/admin/join-approvals">Review staged students →</Link>
    </Button>
   </div>
  </div>
 )
}