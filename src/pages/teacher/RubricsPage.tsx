import { useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useRubrics } from "@/hooks/use-rubrics"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import * as api from "@/lib/api"
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header ref={builderTopRef} className="flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
          <div className="flex items-center gap-md">
            <h1 className="font-headline-lg text-headline-lg text-primary">Rubric Builder</h1>
            <div className="hidden lg:flex items-center gap-md">
              {!assignmentId && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">assignment</span>
                  <Select
                    value={selectedAssignmentId || "none"}
                    onValueChange={(value) => setSelectedAssignmentId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="h-auto gap-2 rounded-full bg-surface-container-low border border-outline-variant/20 px-3 py-1.5 text-label-md text-on-surface focus:ring-0 focus:border-primary shadow-none">
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
            </div>
          </div>
        </header>

        <div className="p-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-1 overflow-y-auto">
          <section className="lg:col-span-5 flex flex-col gap-md">
            <div className="bg-white rounded-xl p-md border-2 border-on-surface/5 shadow-sm">
              <div className="flex items-center gap-sm mb-md">
                <div className="p-2 bg-primary-fixed rounded-lg">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Build manually</h3>
              </div>
              <div className="flex flex-col gap-md">
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface block">Rubric Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-12 px-md bg-white border-2 border-outline-variant/30 rounded-xl focus:border-primary focus:ring-0 transition-all font-body-md text-on-surface"
                    placeholder="e.g., Creative Writing Final"
                  />
                </div>

                {manualCriteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-base relative group">
                    <label className="font-label-md text-label-md text-on-surface block">Criteria Row</label>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-sm">
                        <input
                          value={criterion.name}
                          onChange={(e) => updateRow(criterion.id, "name", e.target.value)}
                          className="w-full h-12 px-md bg-white border-2 border-outline-variant/30 rounded-xl focus:border-primary focus:ring-0 transition-all font-body-md"
                          placeholder="Criterion Name (e.g., Grammar)"
                        />
                        <textarea
                          value={criterion.description}
                          onChange={(e) => updateRow(criterion.id, "description", e.target.value)}
                          rows={3}
                          className="w-full p-md bg-white border-2 border-outline-variant/30 rounded-xl focus:border-primary focus:ring-0 transition-all font-body-md"
                          placeholder="Describe expectation levels..."
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={criterion.maxPoints || ""}
                            onChange={(e) => updateRow(criterion.id, "maxPoints", Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-24 h-10 px-3 bg-white border-2 border-outline-variant/30 rounded-xl focus:border-primary focus:ring-0 transition-all font-body-md text-center"
                            placeholder="pts"
                          />
                          <span className="font-label-sm text-sm text-on-surface-variant">points</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeRow(criterion.id)}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-on-surface-variant hover:text-error rounded-full hover:bg-error-container/30"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addRow}
                  className="flex items-center justify-center gap-sm py-sm px-md h-auto rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:opacity-90 transition-all active:scale-95 shadow-md"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Another Row
                </Button>
              </div>
            </div>

            <div className="bg-primary-container/5 rounded-xl p-md border-2 border-primary-container/10 border-dashed relative overflow-hidden">
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  <div className="p-2 bg-primary-fixed rounded-lg">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Import from PDF</h3>
                </div>
                <Badge variant="outline" className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-widest border-0">PRO Feature</Badge>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                Upload your assignment prompt or syllabus. Our AI will automatically draft rubric rows for you.
              </p>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfImport} className="hidden" />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importRubricPdf.isPending}
                className="w-full flex items-center justify-center gap-sm py-sm px-md h-auto border-2 border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">attach_file</span>
                {importRubricPdf.isPending ? "Extracting..." : "Upload Syllabus PDF"}
              </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-lg opacity-40">
              <div className="w-32 h-32 bg-surface-container-high rounded-full flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">auto_awesome</span>
              </div>
              <p className="font-body-md text-body-md text-center text-on-surface-variant">
                Crafting the perfect feedback loop for your students.
              </p>
            </div>
          </section>

          <section className="lg:col-span-7 flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">Live Preview</h2>
              <div className="flex gap-sm items-center">
                <Badge variant="outline" className="px-md py-1 bg-surface-container-high text-on-surface-variant rounded-full text-sm font-medium border border-outline-variant/20">
                  {selectedRubricId ? "Saved" : "Draft Mode"}
                </Badge>
                {manualCriteria.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleFinalize}
                    disabled={createRubric.isPending}
                    className="h-auto p-0 text-primary hover:underline text-sm font-bold gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Template
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border-2 border-on-surface/5 p-lg shadow-sm space-y-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
                </div>
              ) : selectedRubricId ? (
                (() => {
                  const rubric = rubrics.data?.find((r) => r.id === selectedRubricId)
                  if (!rubric) return null
                  return (
                    <>
                      <div className="border-b border-outline-variant/10 pb-md mb-md">
                        <h4 className="font-headline-lg text-headline-lg text-on-surface">{rubric.title}</h4>
                        <p className="text-on-surface-variant font-body-md">{rubric.criteria.length} criteria · {rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} total pts</p>
                      </div>
                      {rubric.criteria.map((c) => (
                        <div key={c.id} className="p-md rounded-xl border-2 border-outline-variant/10 group hover:border-primary-container/30 transition-all">
                          <div className="flex justify-between items-start mb-sm">
                            <div className="flex items-center gap-base">
                              <span className="material-symbols-outlined text-on-surface-variant">checklist</span>
                              <h5 className="font-label-md text-label-md text-on-surface">{c.description}</h5>
                            </div>
                            <span className="text-on-surface-variant text-sm font-bold">{c.maxPoints} pts</span>
                          </div>
                        </div>
                      ))}
                      {!rubric.isConfirmed && (
                        <Button
                          type="button"
                          onClick={() => confirmRubric.mutate(rubric.id)}
                          disabled={confirmRubric.isPending}
                          className="w-full h-auto py-md rounded-xl font-headline-md text-headline-md font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                          style={{ backgroundColor: "#FF6B5D", color: "#fff", border: "none" }}
                        >
                          {confirmRubric.isPending ? "Confirming..." : "Confirm & Publish Rubric"}
                        </Button>
                      )}
                    </>
                  )
                })()
              ) : manualCriteria.length === 0 && importedCriteria.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-sm">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/40">add_circle</span>
                  <p className="text-on-surface-variant font-label-md text-sm">Start building your rubric on the left</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-outline-variant/10 pb-md mb-md">
                    <h4 className="font-headline-lg text-headline-lg text-on-surface">{title || "Untitled Rubric"}</h4>
                    <p className="text-on-surface-variant font-body-md">{manualCriteria.length} criteria · {totalPoints} total pts</p>
                  </div>

                  {manualCriteria.map((c) => (
                    <div key={c.id} className="p-md rounded-xl border-2 border-outline-variant/10 group hover:border-primary-container/30 transition-all">
                      <div className="flex justify-between items-start mb-sm">
                        <div className="flex items-center gap-base">
                          <span className="material-symbols-outlined text-on-surface-variant">drag_indicator</span>
                          <h5 className="font-label-md text-label-md text-on-surface">{c.name || "Unnamed criterion"}</h5>
                        </div>
                        <span className="text-on-surface-variant text-sm font-bold">{c.maxPoints} pts</span>
                      </div>
                      {c.description && (
                        <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1 ml-8">{c.description}</p>
                      )}
                    </div>
                  ))}

                  {importedCriteria.map((c, i) => (
                    <div key={`ai-${i}`} className="relative p-md rounded-xl border-2 border-dashed border-primary-container/30 group hover:scale-[1.01] transition-all cursor-default">
                      <div className="absolute -top-3 right-4 flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-primary-container/30 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">AI Suggested</span>
                      </div>
                      <div className="flex justify-between items-start mb-sm">
                        <div className="flex items-center gap-base">
                          <span className="material-symbols-outlined text-primary">auto_stories</span>
                          <h5 className="font-label-md text-label-md text-on-surface">{c.description}</h5>
                        </div>
                        <span className="text-primary text-sm font-bold">{c.maxPoints} pts</span>
                      </div>
                      <div className="mt-md flex gap-base opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          onClick={() => acceptAiRow(c.description, c.maxPoints)}
                          className="h-auto px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
                        >
                          Accept Row
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setImportedCriteria(importedCriteria.filter((_, idx) => idx !== i))}
                          className="h-auto px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="p-lg border-2 border-outline-variant/10 border-dashed rounded-xl flex flex-col items-center justify-center gap-sm bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/40">add_circle</span>
                    <p className="text-on-surface-variant font-label-md text-sm">
                      {importedCriteria.length > 0 ? "Accept AI suggestions above" : "Add more rows to complete your rubric"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-md">
              <Button
                type="button"
                onClick={handleFinalize}
                disabled={createRubric.isPending || manualCriteria.length === 0}
                className="flex-1 h-auto py-md rounded-xl font-headline-md text-headline-md border-2 transition-all active:scale-95 disabled:opacity-40 bg-white text-[#1F9D7C] border-[#1F9D7C] hover:bg-[#1F9D7C] hover:text-white"
              >
                {createRubric.isPending ? "Publishing..." : "Preview Final Rubric"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-auto px-md py-md rounded-xl bg-white border-2 border-outline-variant/30 text-on-surface font-headline-md text-headline-md hover:bg-surface-container-low transition-all"
              >
                <span className="material-symbols-outlined">share</span>
              </Button>
            </div>
          </section>
        </div>

        {rubrics.data && rubrics.data.length > 0 && (
          <div className="px-margin-desktop pb-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Saved Rubrics</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
              Use in builder to reuse criteria in a new assignment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {rubrics.data.map((rubric) => (
                <div
                  key={rubric.id}
                  className={`text-left bg-white rounded-xl p-md border-2 transition-all hover:shadow-sm ${
                    selectedRubricId === rubric.id ? "border-primary shadow-md" : "border-on-surface/5"
                  }`}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedRubricId(rubric.id)}
                    className="w-full h-auto p-0 text-left items-start gap-0"
                  >
                    <div className="flex items-center justify-between mb-2 w-full">
                      <h4 className="font-headline-md text-headline-md text-on-surface truncate">{rubric.title}</h4>
                      {rubric.isConfirmed ? (
                        <Badge variant="outline" className="text-primary text-xs font-bold bg-primary-fixed/30 px-2 py-0.5 rounded-full border-0">Confirmed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gold-honey text-xs font-bold bg-tertiary-fixed/30 px-2 py-0.5 rounded-full border-0">Draft</Badge>
                      )}
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {rubric.criteria.length} criteria · {rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} pts
                    </p>
                    <p className="font-label-sm text-label-sm text-outline mt-1">
                      {new Date(rubric.createdAt).toLocaleDateString()}
                    </p>
                  </Button>
                  <div className="mt-md flex gap-sm">
                    <Button
                      type="button"
                      onClick={() => handleUseInBuilder(rubric)}
                      className="flex-1 h-auto px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      Use in builder
                    </Button>
                    {resolvedAssignmentId && (
                      <Button
                        type="button"
                        onClick={() => handleCopyToAssignment(rubric)}
                        disabled={createRubric.isPending}
                        className="flex-1 h-auto px-3 py-1.5 rounded-full bg-secondary-container/10 text-secondary text-xs font-bold hover:bg-secondary-container hover:text-white transition-all disabled:opacity-50"
                      >
                        Copy to assignment
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={reuseCandidate !== null}
          title="Replace current draft?"
          message={`Loading "${reuseCandidate?.title ?? ""}" will replace the criteria you've already entered in the builder.`}
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
