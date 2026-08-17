import { useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useRubrics } from "@/hooks/use-rubrics"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import * as api from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface CriteriaRow {
 id: string
 name: string
 description: string
 maxPoints: number
}

let nextId = 1
function freshId() {
 return `criterion_${nextId++}`
}

export function RubricsPage() {
 const [searchParams] = useSearchParams()
 const assignmentId = searchParams.get("assignmentId")

 const { data: allAssignments, isLoading: assignmentsLoading } = useQuery({
  queryKey: ["assignments"],
  queryFn: () => api.getAssignments(),
  enabled: !assignmentId,
 })

 const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentId ?? "")
 const resolvedAssignmentId = assignmentId ?? selectedAssignmentId

 const { rubrics, isLoading, createRubric, importRubricPdf, confirmRubric } = useRubrics()
 const [title, setTitle] = useState("")
 const [manualCriteria, setManualCriteria] = useState<CriteriaRow[]>([])
 const [importedCriteria, setImportedCriteria] = useState<{ description: string; maxPoints: number }[]>([])
 const fileInputRef = useRef<HTMLInputElement>(null)
 const builderTopRef = useRef<HTMLElement>(null)
 const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null)
 const [reuseCandidate, setReuseCandidate] = useState<api.Rubric | null>(null)

 function addRow() {
  setManualCriteria([...manualCriteria, { id: freshId(), name: "", description: "", maxPoints: 10 }])
 }

 function removeRow(id: string) {
  setManualCriteria(manualCriteria.filter((c) => c.id !== id))
 }

 function updateRow(id: string, field: keyof CriteriaRow, value: string | number) {
  setManualCriteria(manualCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
 }

 function acceptAiRow(desc: string, pts: number) {
  setManualCriteria([...manualCriteria, { id: freshId(), name: desc, description: "", maxPoints: pts }])
  setImportedCriteria(importedCriteria.filter((c) => c.description !== desc))
 }

 function handlePdfImport(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append("file", file)
  importRubricPdf.mutate(fd, {
   onSuccess: (data) => {
    if (data.criteria) setImportedCriteria(data.criteria)
   },
  })
  e.target.value = ""
 }

 function handleFinalize() {
  if (!resolvedAssignmentId) {
   toast.error("Please select an assignment")
   return
  }
  if (!title.trim()) {
   toast.error("Please enter a rubric title")
   return
  }
  if (manualCriteria.length === 0) {
   toast.error("Add at least one criterion")
   return
  }
  createRubric.mutate(
   {
    title: title.trim(),
    assignmentId: resolvedAssignmentId,
    criteria: manualCriteria.map(({ name, description, maxPoints }) => ({
     description: [name, description].filter(Boolean).join(" — "),
     maxPoints,
    })),
   },
   {
    onSuccess: () => {
     setTitle("")
     setManualCriteria([])
     setImportedCriteria([])
     setSelectedRubricId(null)
    },
   },
  )
 }

 function loadRubricIntoBuilder(rubric: api.Rubric) {
  setTitle(rubric.title)
  setManualCriteria(
   rubric.criteria.map((c) => ({ id: freshId(), name: c.description, description: "", maxPoints: c.maxPoints })),
  )
  setImportedCriteria([])
  setSelectedRubricId(null)
  builderTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
 }

 function handleUseInBuilder(rubric: api.Rubric) {
  if (manualCriteria.length > 0 || importedCriteria.length > 0) {
   setReuseCandidate(rubric)
   return
  }
  loadRubricIntoBuilder(rubric)
 }

 function handleCopyToAssignment(rubric: api.Rubric) {
  if (!resolvedAssignmentId) return
  createRubric.mutate({
   title: rubric.title,
   assignmentId: resolvedAssignmentId,
   criteria: rubric.criteria.map((c) => ({ description: c.description, maxPoints: c.maxPoints })),
  })
 }

 const totalPoints = manualCriteria.reduce((sum, c) => sum + (c.maxPoints || 0), 0)
 const draftCount = manualCriteria.length + importedCriteria.length

 return (
  <div className="min-h-full bg-surface">
   <div className="mx-auto w-full max-w-6xl flex flex-col gap-md p-gutter pb-24 md:pb-0">
    <header ref={builderTopRef} className="flex flex-col lg:flex-row lg:items-center justify-between gap-md">
     <div>
      <h1 className="font-headline-xl text-headline-xl text-primary">Rubrics</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
       Build grading rubrics from scratch or import one from a syllabus PDF.
      </p>
     </div>

     {!assignmentId && (
      <div className="w-full lg:w-[320px]">
       <label className="font-label-md text-label-md text-on-surface mb-1 block">Assignment</label>
       <Select
        value={selectedAssignmentId || "none"}
        onValueChange={(value) => setSelectedAssignmentId(value === "none" ? "" : value)}
       >
        <SelectTrigger className="h-auto w-full gap-2 rounded-full bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
         <SelectValue placeholder="Select assignment..." />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="none">Select assignment...</SelectItem>
         {assignmentsLoading ? (
          <SelectItem value="__loading__" disabled>Loading...</SelectItem>
         ) : (
          allAssignments?.map((a) => (
           <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
          ))
         )}
        </SelectContent>
       </Select>
      </div>
     )}
    </header>

    {/* Builder */}
    <section className="bg-surface-container-lowest rounded-lg shadow-card overflow-hidden">
     <div className="flex items-center justify-between gap-md border-b border-outline-variant px-md py-3">
      <div className="flex items-center gap-sm flex-wrap">
       <h2 className="font-headline-md text-headline-md text-primary">Rubric Builder</h2>
       <Badge
        variant="outline"
        className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-md font-label-sm text-label-sm border-0"
       >
        {selectedRubricId ? "Saved" : "Draft"}
       </Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
       <span className="font-label-sm text-label-sm text-on-surface-variant">
        {draftCount} criterion{draftCount !== 1 ? "s" : ""} · {totalPoints} pts
       </span>
       <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={importRubricPdf.isPending}
        className="h-auto px-md py-1.5 rounded-md bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-sm text-label-sm disabled:opacity-50"
       >
        <span className="material-symbols-outlined text-[16px]">upload_file</span>
        {importRubricPdf.isPending ? "Extracting..." : "Import PDF"}
       </Button>
       <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfImport} className="hidden" />
      </div>
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant">
      {/* Manual builder */}
      <div className="lg:col-span-5 p-md space-y-md">
       <div className="space-y-base">
        <label className="block font-label-sm text-label-sm text-on-surface-variant">Rubric Title</label>
        <input
         value={title}
         onChange={(e) => setTitle(e.target.value)}
         className="w-full px-md py-2 bg-surface-container-lowest rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-on-surface"
         placeholder="e.g., Creative Writing Final"
        />
       </div>

       {manualCriteria.length === 0 && importedCriteria.length === 0 && (
        <EmptyState
         icon="checklist"
         title="No criteria yet"
         description="Click below to add your first criterion, or import a PDF to let AI propose rows."
        />
       )}

       <div className="space-y-md">
        {manualCriteria.map((criterion) => (
         <div key={criterion.id} className="rounded-md bg-surface-container-low p-sm space-y-sm">
          <div className="flex items-center gap-2">
           <input
            value={criterion.name}
            onChange={(e) => updateRow(criterion.id, "name", e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 bg-surface-container-lowest rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
            placeholder="Criterion (e.g., Grammar)"
           />
           <input
            type="number"
            min={1}
            value={criterion.maxPoints || ""}
            onChange={(e) => updateRow(criterion.id, "maxPoints", Math.max(1, parseInt(e.target.value) || 0))}
            className="w-16 text-center px-2 py-1.5 bg-surface-container-lowest rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
            placeholder="pts"
           />
           <Button
            type="button"
            variant="ghost"
            onClick={() => removeRow(criterion.id)}
            className="w-8 h-8 p-0 flex items-center justify-center text-on-surface-variant hover:text-error rounded-md hover:bg-error-container/20"
           >
            <span className="material-symbols-outlined text-[18px]">close</span>
           </Button>
          </div>
          <textarea
           value={criterion.description}
           onChange={(e) => updateRow(criterion.id, "description", e.target.value)}
           rows={2}
           className="w-full px-3 py-1.5 bg-surface-container-lowest rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-on-surface resize-none"
           placeholder="Describe expectation levels..."
          />
         </div>
        ))}
       </div>

       {importedCriteria.length > 0 && (
        <div className="space-y-md">
         {importedCriteria.map((c, i) => (
          <div key={`ai-${i}`} className="rounded-md border border-primary border-dashed bg-accent/40 p-sm flex items-center gap-sm">
           <div className="min-w-0 flex-1">
            <p className="font-label-sm text-label-sm text-primary mb-0.5 flex items-center gap-1">
             <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
             AI Suggested
            </p>
            <p className="font-body-sm text-body-sm text-on-surface truncate">{c.description}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{c.maxPoints} pts</p>
           </div>
           <div className="flex items-center gap-2 shrink-0">
            <Button
             type="button"
             onClick={() => acceptAiRow(c.description, c.maxPoints)}
             className="h-auto px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-label-sm font-medium"
            >
             Accept
            </Button>
            <Button
             type="button"
             onClick={() => setImportedCriteria(importedCriteria.filter((_, idx) => idx !== i))}
             variant="outline"
             className="h-auto px-2.5 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant text-label-sm font-medium hover:bg-surface-container"
            >
             Dismiss
            </Button>
           </div>
          </div>
         ))}
        </div>
       )}

       <Button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-sm py-2 px-md h-auto rounded-md bg-primary text-primary-foreground font-label-md text-label-sm hover:bg-primary/90 transition-colors"
       >
        <span className="material-symbols-outlined">add</span>
        Add Criterion
       </Button>
      </div>

      {/* Live preview */}
      <div className="lg:col-span-7 p-md">
       <div className="flex items-center justify-between mb-md">
        <h3 className="font-headline-md text-headline-md text-primary">Live Preview</h3>
        <div className="flex items-center gap-2">
         {selectedRubricId && !rubrics.data?.find((r) => r.id === selectedRubricId)?.isConfirmed && (
          <Button
           type="button"
           onClick={() => confirmRubric.mutate(selectedRubricId!)}
           disabled={confirmRubric.isPending}
           className="h-auto px-md py-1.5 rounded-md bg-primary text-primary-foreground font-label-sm text-label-sm hover:bg-primary/90 disabled:opacity-50"
          >
           Confirm & Publish
          </Button>
         )}
         {manualCriteria.length > 0 && (
          <Button
           type="button"
           onClick={handleFinalize}
           disabled={createRubric.isPending}
           className="h-auto px-md py-1.5 rounded-md bg-primary text-primary-foreground font-label-sm text-label-sm hover:bg-primary/90 disabled:opacity-50"
          >
           <span className="material-symbols-outlined text-[16px]">save</span>
           {createRubric.isPending ? "Saving..." : "Save Template"}
          </Button>
         )}
        </div>
       </div>

       {isLoading ? (
        <div className="flex items-center justify-center h-40">
         <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
        </div>
       ) : selectedRubricId ? (
        <div className="rounded-lg overflow-hidden">
         {(() => {
          const rubric = rubrics.data?.find((r) => r.id === selectedRubricId)
          if (!rubric) return null
          return (
           <>
            <div className="px-md py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
             <div>
              <h4 className="font-headline-md text-headline-md text-primary">{rubric.title}</h4>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
               {rubric.criteria.length} criteria · {rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} total pts
              </p>
             </div>
             {rubric.isConfirmed ? (
              <Badge className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-label-sm text-label-sm border-0">Confirmed</Badge>
             ) : (
              <Badge variant="outline" className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-md font-label-sm text-label-sm border-0">Draft</Badge>
             )}
            </div>
            <ul className="divide-y divide-outline-variant">
             {rubric.criteria.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-md py-2.5">
               <span className="font-body-md text-body-md text-on-surface">{c.description}</span>
               <span className="font-label-sm text-label-sm text-primary font-semibold ml-4">{c.maxPoints} pts</span>
              </li>
             ))}
            </ul>
            <div className="flex items-center justify-between px-md py-3 border-t border-outline-variant bg-surface-container-low">
             <span className="font-label-md text-label-md text-on-surface font-medium">Total</span>
             <span className="font-headline-md text-headline-md text-on-surface">{rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} pts</span>
            </div>
           </>
          )
         })()}
        </div>
       ) : manualCriteria.length === 0 && importedCriteria.length === 0 ? (
        <EmptyState
         icon="add_circle"
         title="Your rubric preview"
         description="Add criteria on the left or import a PDF — your rubric will render here as a clean table."
        />
       ) : (
        <div className="rounded-lg overflow-hidden">
         <div className="px-md py-3 border-b border-outline-variant bg-surface-container-low">
          <h4 className="font-headline-md text-headline-md text-primary">{title || "Untitled Rubric"}</h4>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{manualCriteria.length} criteria · {totalPoints} total pts</p>
         </div>
         <ul className="divide-y divide-outline-variant">
          {manualCriteria.map((c) => (
           <li key={c.id} className="px-md py-2.5">
            <div className="flex items-center justify-between">
             <span className="font-label-md text-label-md text-on-surface">{c.name || "Unnamed criterion"}</span>
             <span className="font-label-sm text-label-sm text-primary">{c.maxPoints} pts</span>
            </div>
            {c.description && (
             <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{c.description}</p>
            )}
           </li>
          ))}
          {importedCriteria.map((c, i) => (
           <li key={`ai-${i}`} className="px-md py-2.5">
            <div className="flex items-center justify-between">
             <span className="font-label-md text-label-md text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
              {c.description}
             </span>
             <span className="font-label-sm text-label-sm text-primary">{c.maxPoints} pts</span>
            </div>
           </li>
          ))}
         </ul>
         <div className="flex items-center justify-between px-md py-3 border-t border-outline-variant bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface font-medium">Total</span>
          <span className="font-headline-md text-headline-md text-on-surface">{totalPoints} pts</span>
         </div>
        </div>
       )}
      </div>
     </div>
    </section>

    {/* Saved templates */}
    {rubrics.data && rubrics.data.length > 0 && (
     <section>
      <div className="flex items-end justify-between mb-sm">
       <h3 className="font-headline-md text-headline-md text-primary">Saved Rubrics</h3>
       <p className="font-label-sm text-label-sm text-on-surface-variant">{rubrics.data.length} total</p>
      </div>
      <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
              <TableHead className="pl-5">Title</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rubrics.data.map((rubric) => {
              const selected = selectedRubricId === rubric.id
              return (
                <TableRow key={rubric.id} className={selected ? "bg-primary-fixed/40" : ""}>
                  <TableCell className="pl-5 py-3">
                    <p className="font-body-lg text-body-lg text-on-surface truncate">{rubric.title}</p>
                  </TableCell>
                  <TableCell className="font-body-md text-body-md text-on-surface tabular-nums">
                    {rubric.criteria.length}
                  </TableCell>
                  <TableCell className="font-body-md text-body-md text-on-surface tabular-nums">
                    {rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} pts
                  </TableCell>
                  <TableCell className="font-label-sm text-label-sm text-on-surface-variant">
                    {new Date(rubric.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {rubric.isConfirmed ? (
                      <Badge className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-label-sm text-label-sm border-0">Confirmed</Badge>
                    ) : (
                      <Badge variant="outline" className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm border-0">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => setSelectedRubricId(rubric.id)}
                        variant="outline"
                        className="bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-primary text-label-sm font-medium rounded-md px-2.5 py-1.5 h-auto"
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleUseInBuilder(rubric)}
                        className="rounded-md bg-primary text-primary-foreground text-label-sm font-medium hover:bg-primary/90 px-2.5 py-1.5 h-auto"
                      >
                        Use in Builder
                      </Button>
                      {resolvedAssignmentId && (
                        <Button
                          type="button"
                          onClick={() => handleCopyToAssignment(rubric)}
                          disabled={createRubric.isPending}
                          className="rounded-md bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-primary text-label-sm font-medium px-2.5 py-1.5 h-auto disabled:opacity-50"
                        >
                          Copy to Assignment
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
     </section>
    )}
   </div>

   <ConfirmDialog
    open={reuseCandidate !== null}
    title="Replace current draft?"
    message={`Loading "${reuseCandidate?.title ?? ""}" will replace the criteria you have already entered in the builder.`}
    confirmLabel="Load rubric"
    onCancel={() => setReuseCandidate(null)}
    onConfirm={() => {
     if (reuseCandidate) loadRubricIntoBuilder(reuseCandidate)
     setReuseCandidate(null)
    }}
   />
  </div>
 )
}