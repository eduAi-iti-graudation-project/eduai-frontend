import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { cn } from "@/lib/utils"

type Field =
 | "STUDENT_NAME"
 | "EMAIL"
 | "GRADE_LEVEL"
 | "SECTION"
 | "GUARDIAN_NAME"
 | "GUARDIAN_EMAIL"
 | "GUARDIAN_SSN"
 | "GUARDIAN_PHONE"
 | "GUARDIAN_NATIONALITY"
 | "UNMAPPED"

const fieldLabels: Record<Field, string> = {
 STUDENT_NAME: "Student name",
 EMAIL: "Email",
 GRADE_LEVEL: "Grade level",
 SECTION: "Section",
 GUARDIAN_NAME: "Guardian name",
 GUARDIAN_EMAIL: "Guardian email",
 GUARDIAN_SSN: "Guardian SSN",
 GUARDIAN_PHONE: "Guardian phone",
 GUARDIAN_NATIONALITY: "Guardian nationality",
 UNMAPPED: "Not imported",
}

const fieldOptions: Field[] = [
 "STUDENT_NAME",
 "EMAIL",
 "GRADE_LEVEL",
 "SECTION",
 "GUARDIAN_NAME",
 "GUARDIAN_EMAIL",
 "GUARDIAN_SSN",
 "GUARDIAN_PHONE",
 "GUARDIAN_NATIONALITY",
 "UNMAPPED",
]

const confidenceLabel = (c: number) => {
 if (c >= 0.9) return "High"
 if (c >= 0.7) return "Medium"
 return "Low"
}

function fmtDate(iso: string | null | undefined) {
 if (!iso) return "—"
 return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminCsvImportPage() {
 const inputRef = useRef<HTMLInputElement>(null)
 const [step, setStep] = useState<1 | 2 | 3>(1)
 const [csvFile, setCsvFile] = useState<File | null>(null)
 const [csvText, setCsvText] = useState("")
 const [analysis, setAnalysis] = useState<api.CsvAnalyzeResult | null>(null)
 const [isAnalyzing, setIsAnalyzing] = useState(false)
 const [mapping, setMapping] = useState<Record<string, Field>>({})
 const [importResult, setImportResult] = useState<api.CsvImportResult | null>(null)

 const importM = useMutation({
  mutationFn: () =>
   api.importCsv(
    csvText,
    Object.entries(mapping)
     .filter(([, field]) => field !== "UNMAPPED")
     .map(([sourceColumn, mappedField]) => ({ sourceColumn, mappedField })),
   ),
  onSuccess: (result) => {
   setImportResult(result)
   setStep(3)
  },
  onError: () => toast.error("Could not import the file"),
 })

 const handleFile = (file: File) => {
  if (!file.name.toLowerCase().endsWith(".csv")) {
   toast.error("Only CSV files are accepted")
   return
  }
  setCsvFile(file)
  setCsvText("")
  setAnalysis(null)
  setMapping({})
  setImportResult(null)
  setStep(1)
  const reader = new FileReader()
  reader.onload = () => {
   const text = String(reader.result ?? "")
   if (text.trim().length === 0) {
    toast.error("This CSV file is empty")
    return
   }
   setCsvText(text)
  }
  reader.readAsText(file)
 }

 const runAnalyze = async () => {
  if (!csvText) return
  setIsAnalyzing(true)
  try {
   const result = await api.analyzeCsv(csvText)
   setAnalysis(result)
   const initial: Record<string, Field> = {}
   for (const col of result.columns) {
    initial[col.sourceColumn] = col.suggestedField
   }
   setMapping(initial)
   setStep(2)
  } catch {
   toast.error("Could not analyze the file")
  } finally {
   setIsAnalyzing(false)
  }
 }

 const requiredMapped = () => {
  const fields = Object.values(mapping)
  return fields.includes("STUDENT_NAME") && fields.includes("EMAIL")
 }

 const preview = analysis?.columns.length
  ? Object.entries(mapping).map(([sourceColumn, field]) => ({
    sourceColumn,
    field,
    sample: analysis?.columns.find((c) => c.sourceColumn === sourceColumn)?.sampleValues[0] ?? "—",
   }))
  : []

 return (
  <div className="px-6 pb-10">
   <PageHeader
    title="Import students from CSV"
    subtitle="AI proposes the column mapping. You review and confirm it — the import itself never guesses and never overwrites existing students."
   />

   {step !== 3 ? (
    <section className="rounded-xl bg-surface-container-lowest border border-border p-md mb-6">
     <div className="flex items-center gap-2 mb-4">
      {[1, 2].map((s) => (
       <span
        key={s}
        className={cn(
         "h-1.5 rounded-full transition-all",
         s === step ? "w-8 bg-primary" : "w-4 bg-surface-container-high",
        )}
       />
      ))}
     </div>
     <h2 className="font-label-md text-label-md text-primary font-medium mb-1">
      {step === 1 ? "1 · Upload your file" : "2 · Review the column mapping"}
     </h2>
     <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
      {step === 1
       ? "Required columns: student name and email. Grade level and section are matched against your school — unmatched values are flagged, never guessed."
       : "Every column must be reviewed before importing. Student name and email are required; missing either blocks the import."}
     </p>

     {step === 1 ? (
      <label
       className="flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container-low px-6 py-8 text-center transition-all"
       onDragOver={(e) => e.preventDefault()}
       onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
       }}
      >
       <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv"
        onChange={(e) => {
         const file = e.target.files?.[0]
         if (file) handleFile(file)
         e.target.value = ""
        }}
       />
       <span className="material-symbols-outlined text-[32px] text-primary">table_view</span>
       <span className="font-label-md text-label-md text-on-surface">
        {csvFile ? csvFile.name : "Drag your CSV here or click to browse"}
       </span>
       <span className="font-label-sm text-label-sm text-on-surface-variant">
        Your file stays in the browser until you confirm the mapping.
       </span>
      </label>
     ) : analysis ? (
      <>
       <div className="overflow-x-auto rounded-xl border border-border mb-4">
        <Table>
         <TableHeader>
          <TableRow className="bg-surface-container-low">
           <TableHead className="font-label-sm text-label-sm text-on-surface-variant">Source column</TableHead>
           <TableHead className="font-label-sm text-label-sm text-on-surface-variant">Sample value</TableHead>
           <TableHead className="font-label-sm text-label-sm text-on-surface-variant">Maps to</TableHead>
           <TableHead className="font-label-sm text-label-sm text-on-surface-variant">Confidence</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {analysis.columns.map((col) => {
           const current = mapping[col.sourceColumn] ?? "UNMAPPED"
           return (
            <TableRow key={col.sourceColumn}>
             <TableCell className="font-label-md text-label-md text-on-surface">{col.sourceColumn}</TableCell>
             <TableCell className="font-body-sm text-body-sm text-on-surface-variant max-w-[220px] truncate">{col.sampleValues[0] ?? "—"}</TableCell>
             <TableCell className="min-w-[180px]">
              <Select
               value={current}
               onValueChange={(v) => setMapping((prev) => ({ ...prev, [col.sourceColumn]: v as Field }))}
              >
               <SelectTrigger className="h-auto rounded-lg bg-surface-container-lowest px-3 py-1.5 font-label-sm text-label-sm">
                <SelectValue />
               </SelectTrigger>
               <SelectContent>
                {fieldOptions.map((f) => (
                 <SelectItem key={f} value={f}>{fieldLabels[f]}</SelectItem>
                ))}
               </SelectContent>
              </Select>
             </TableCell>
             <TableCell>
              <div className="flex items-center gap-1.5">
               <Badge
                variant="outline"
                className={cn(
                 "rounded-md font-label-sm text-label-sm border-0",
                 col.confidence >= 0.9
                  ? "bg-primary-container text-on-primary-container"
                  : col.confidence >= 0.7
                   ? "bg-secondary-container text-on-secondary-container"
                   : "bg-surface-container-high text-on-surface-variant",
                )}
               >
                {col.suggestedField !== "UNMAPPED" ? `${confidenceLabel(col.confidence)} · AI` : "Unmapped"}
               </Badge>
               {col.masked ? (
                <span className="font-label-sm text-label-sm text-on-surface-variant" title="Sample values were masked before AI analysis">masked</span>
               ) : null}
              </div>
             </TableCell>
            </TableRow>
           )
          })}
         </TableBody>
        </Table>
       </div>

       {!requiredMapped() ? (
        <div className="flex items-start gap-2 rounded-lg border border-tertiary bg-tertiary-fixed/60 px-4 py-3 mb-4">
         <span className="material-symbols-outlined shrink-0 text-[18px] text-on-tertiary-fixed">error</span>
         <p className="font-body-sm text-body-sm text-on-tertiary-fixed">
          Student name and email must both be mapped before you can import. The import never fills in missing values.
         </p>
        </div>
       ) : null}

       {preview.length > 0 ? (
        <div className="mb-4">
         <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5">Preview — first row transformed</p>
         <div className="flex flex-wrap gap-2">
          {preview.map((p) => (
           <span key={p.sourceColumn} className="inline-flex flex-col rounded-lg bg-surface-container-low px-2.5 py-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">{fieldLabels[p.field]}</span>
            <span className="font-label-md text-label-md text-on-surface">{p.sample}</span>
           </span>
          ))}
         </div>
        </div>
       ) : null}

       <div className="flex gap-3">
        <Button
         type="button"
         variant="secondary"
         onClick={() => setStep(1)}
         className="rounded-lg font-label-md text-label-md h-auto py-sm px-md"
        >
         Back
        </Button>
        <Button
         type="button"
         disabled={!requiredMapped() || importM.isPending}
         onClick={() => importM.mutate()}
         className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md h-auto py-sm px-md"
        >
         {importM.isPending ? "Importing…" : `Import ${analysis.totalRows} rows`}
        </Button>
       </div>
      </>
     ) : null}
    </section>
   ) : null}

   {step === 1 && csvText && !analysis ? (
    <div className="mt-4 flex gap-3">
     <Button
      type="button"
      variant="secondary"
      onClick={() => {
       setCsvFile(null)
       setCsvText("")
       if (inputRef.current) inputRef.current.value = ""
      }}
      className="rounded-lg font-label-md text-label-md h-auto py-sm px-md"
     >
      Remove file
     </Button>
     <Button
      type="button"
      onClick={runAnalyze}
      disabled={isAnalyzing}
      className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md h-auto py-sm px-md"
     >
      {isAnalyzing ? "Analyzing…" : "Analyze columns"}
     </Button>
    </div>
   ) : null}

   {step === 3 && importResult ? (
    <section className="rounded-xl bg-surface-container-lowest border border-border p-md">
     <h2 className="font-headline-md text-headline-md text-primary mb-1">Import results</h2>
     <p className="font-body-md text-body-md text-on-surface-variant mb-md">{csvFile?.name ?? "CSV import"} · {fmtDate(new Date().toISOString())}</p>

     <div className="grid grid-cols-3 gap-3 mb-md">
      <div className="rounded-xl bg-primary-container/60 px-4 py-3">
       <p className="font-headline-lg text-headline-lg text-on-primary-container">{importResult.autoApproved}</p>
       <p className="font-label-sm text-label-sm text-on-primary-container/80">Students imported instantly</p>
      </div>
      <div className="rounded-xl bg-tertiary-fixed px-4 py-3">
       <p className="font-headline-lg text-headline-lg text-on-tertiary-fixed">{importResult.queued}</p>
       <p className="font-label-sm text-label-sm text-on-tertiary-fixed">Queued for review</p>
      </div>
      <div className="rounded-xl bg-surface-container-high px-4 py-3">
       <p className="font-headline-lg text-headline-lg text-on-surface">
        {importResult.needsFollowUp.length + importResult.unassignedGradeOrSection.length + importResult.unmatchedSectionsOrGrades.length}
       </p>
       <p className="font-label-sm text-label-sm text-on-surface-variant">Need attention</p>
      </div>
     </div>

     {importResult.autoApproved > 0 && importResult.queued === 0 && importResult.needsFollowUp.length === 0 && importResult.unassignedGradeOrSection.length === 0 && importResult.unmatchedSectionsOrGrades.length === 0 ? (
      <div className="flex items-center gap-2 rounded-lg bg-primary-container/40 px-4 py-3 mb-4">
       <span className="material-symbols-outlined text-[18px] text-on-primary-container">check_circle</span>
       <p className="font-body-md text-body-md text-on-primary-container">
        All rows imported successfully — accounts were created and credentials emailed. Students are now in your school.
       </p>
      </div>
     ) : null}

     {importResult.autoApproved > 0 ? (
      <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest border border-primary/30 px-4 py-3 mb-4">
       <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
       <p className="font-body-md text-body-md text-on-surface">
        {importResult.autoApproved} row{importResult.autoApproved === 1 ? "" : "s"} had complete data and were imported right away — no approval needed. A temporary password was emailed to each student.
       </p>
      </div>
     ) : null}

     {importResult.queued > 0 ? (
      <div className="mb-4">
       <p className="font-label-sm text-label-sm text-on-tertiary-fixed mb-1.5">Queued for review (account creation failed — fix and approve in Admin → Join Approvals)</p>
       <div className="rounded-xl border border-border divide-y divide-border">
        {importResult.needsFollowUp
         .filter((n) => n.reason.startsWith("Auto-approval failed"))
         .map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
           <span className="w-14 shrink-0 font-label-md text-label-md text-on-surface-variant">Row {e.row}</span>
           <span className="font-body-sm text-body-sm text-on-surface">{e.reason}</span>
          </div>
         ))}
       </div>
      </div>
     ) : null}

     {importResult.needsFollowUp.filter((n) => !n.reason.startsWith("Auto-approval failed")).length > 0 ? (
      <div className="mb-4">
       <p className="font-label-sm text-label-sm text-error mb-1.5">Rows that could not be imported</p>
       <div className="rounded-xl border border-border divide-y divide-border">
        {importResult.needsFollowUp
         .filter((n) => !n.reason.startsWith("Auto-approval failed"))
         .map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
           <span className="w-14 shrink-0 font-label-md text-label-md text-on-surface-variant">Row {e.row}</span>
           <span className="font-body-sm text-body-sm text-on-surface">{e.reason}</span>
          </div>
         ))}
       </div>
      </div>
     ) : null}

     {importResult.unassignedGradeOrSection.length > 0 ? (
      <div className="mb-4">
       <p className="font-label-sm text-label-sm text-on-tertiary-fixed mb-1.5">Imported but no grade/section (missing or unmatched)</p>
       <div className="rounded-xl border border-border divide-y divide-border">
        {importResult.unassignedGradeOrSection.map((u, i) => (
         <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-14 shrink-0 font-label-md text-label-md text-on-surface-variant">Row {u.row}</span>
          <span className="font-body-sm text-body-sm text-on-surface">{u.reason}</span>
         </div>
        ))}
       </div>
      </div>
     ) : null}

     {importResult.unmatchedSectionsOrGrades.length > 0 ? (
      <div className="mb-4">
       <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5">Grade/section values that could not be matched</p>
       <div className="rounded-xl border border-border divide-y divide-border">
        {importResult.unmatchedSectionsOrGrades.map((m, i) => (
         <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-14 shrink-0 font-label-md text-label-md text-on-surface-variant">Row {m.row}</span>
          <span className="font-body-sm text-body-sm text-on-surface">"{m.providedValue}" did not match anything</span>
         </div>
        ))}
       </div>
      </div>
     ) : null}

     <Button
      type="button"
      onClick={() => {
       setStep(1)
       setCsvFile(null)
       setCsvText("")
       setAnalysis(null)
       setMapping({})
       setImportResult(null)
       if (inputRef.current) inputRef.current.value = ""
      }}
      className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md h-auto py-sm px-md"
     >
      Import another file
     </Button>
    </section>
   ) : step === 3 ? (
    <EmptyState icon="table_view" title="No import yet" description="Upload a CSV file to begin." />
   ) : null}
  </div>
 )
}
