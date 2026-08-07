import { useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const instructorAssignmentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
    dueDate: z.string().min(1, "Due date is required"),
    totalMarks: z
      .number({ message: "Total marks is required" })
      .min(1, "Total marks must be at least 1")
      .max(1000, "Total marks must be 1000 or fewer"),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(5000, "Description must be 5000 characters or fewer"),
    instructorNotes: z
      .string()
      .trim()
      .max(2000, "Notes must be 2000 characters or fewer")
      .optional()
      .or(z.literal("")),
    file: z.instanceof(File).nullable(),
  })
  .superRefine((value, context) => {
    if (value.file) {
      if (value.file.type !== "application/pdf") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["file"],
          message: "Only PDF files are allowed",
        })
      }

      if (value.file.size > MAX_FILE_SIZE) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["file"],
          message: "File size must be 10MB or less",
        })
      }
    }
  })

export type InstructorAssignmentFormData = z.infer<typeof instructorAssignmentSchema>

const defaultValues: InstructorAssignmentFormData = {
  title: "",
  dueDate: "",
  totalMarks: undefined as unknown as number,
  description: "",
  instructorNotes: "",
  file: null,
}

export function InstructorAssignmentForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get("classId")

  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [rubricMode, setRubricMode] = useState<"manual" | "pdf" | "library">("manual")
  const [rubricTitle, setRubricTitle] = useState("")
  const [criteriaRows, setCriteriaRows] = useState<{ id: string; description: string; maxPoints: number }[]>([])
  const [rubricPdfFile, setRubricPdfFile] = useState<File | null>(null)
  const [importedCriteria, setImportedCriteria] = useState<{ description: string; maxPoints: number }[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [rubricSubmitting, setRubricSubmitting] = useState(false)
  const [selectedLibraryId, setSelectedLibraryId] = useState("")
  const rubricFileInputRef = useRef<HTMLInputElement | null>(null)

  const { data: allRubrics, isLoading: rubricsLoading } = useQuery({
    queryKey: ["rubrics"],
    queryFn: () => api.getRubrics(),
  })

  const confirmedRubrics = useMemo(
    () =>
      (allRubrics ?? [])
        .filter((r) => r.isConfirmed)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allRubrics],
  )

  function selectLibraryRubric(rubric: api.Rubric) {
    setSelectedLibraryId(rubric.id)
    setRubricTitle(rubric.title)
    setCriteriaRows(
      rubric.criteria.map((c) => ({ id: freshCritId(), description: c.description, maxPoints: c.maxPoints })),
    )
  }

  async function handleRubricPdfImport(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed")
      return
    }
    setIsImporting(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const data = await api.createRubricFromPdf(fd)
      setImportedCriteria(data.criteria || [])
      toast.success(`Extracted ${data.criteria?.length || 0} criteria from PDF`)
      if (!rubricTitle && data.title) setRubricTitle(data.title)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse PDF")
    } finally {
      setIsImporting(false)
    }
  }

  function acceptImportedCriterion(desc: string, pts: number) {
    setCriteriaRows([...criteriaRows, { id: freshCritId(), description: desc, maxPoints: pts }])
    setImportedCriteria(importedCriteria.filter((c) => c.description !== desc))
  }

  function dismissImportedCriterion(desc: string) {
    setImportedCriteria(importedCriteria.filter((c) => c.description !== desc))
  }

  const critIdCounter = useRef(0)
  function freshCritId() {
    critIdCounter.current += 1
    return `crit_${critIdCounter.current}`
  }

  function addCriteriaRow() {
    setCriteriaRows([...criteriaRows, { id: freshCritId(), description: "", maxPoints: 10 }])
  }

  function removeCriteriaRow(id: string) {
    setCriteriaRows(criteriaRows.filter((r) => r.id !== id))
  }

  function updateCriteriaRow(id: string, field: "description" | "maxPoints", value: string | number) {
    setCriteriaRows(criteriaRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const form = useForm<InstructorAssignmentFormData>({
    resolver: zodResolver(instructorAssignmentSchema),
    mode: "onChange",
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = form

  const onSubmit: SubmitHandler<InstructorAssignmentFormData> = async (data) => {
    if (!classId) {
      toast.error("No class selected. Please go back and try again.")
      return
    }

    if (rubricMode === "library" && !selectedLibraryId) {
      toast.error("Select a rubric from the library")
      return
    }

    if (!rubricTitle.trim()) {
      toast.error("Please enter a rubric title")
      return
    }
    if (criteriaRows.length === 0 || criteriaRows.every((r) => !r.description.trim())) {
      toast.error("Add at least one criterion with a description")
      return
    }

    setRubricSubmitting(true)

    try {
      const description = data.instructorNotes
        ? `${data.description}\n\nInstructor notes: ${data.instructorNotes}`
        : data.description

      const assignment = await api.createAssignment({
        title: data.title,
        description,
        dueDate: new Date(data.dueDate).toISOString(),
        totalPoints: data.totalMarks,
        classId,
      })

      const rubric = await api.createRubric({
        title: rubricTitle.trim(),
        assignmentId: assignment.id,
        criteria: criteriaRows
          .filter((r) => r.description.trim())
          .map((r) => ({ description: r.description.trim(), maxPoints: r.maxPoints })),
      })

      if (data.file) {
        await api.uploadMaterial(data.title, classId, data.file)
      }

      toast.success("Assignment created. Now review and confirm the rubric.")
      navigate(`/rubrics/confirm/${rubric.id}?classId=${classId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setRubricSubmitting(false)
    }
  }

  const onInvalid: SubmitErrorHandler<InstructorAssignmentFormData> = () => {
    toast.error("Please fix the highlighted fields")
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit, onInvalid)(event)
  }

  const handleFileSelect = (file: File | null) => {
    setValue("file", file, { shouldValidate: true })
    setSelectedFile(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0] ?? null
    handleFileSelect(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    handleFileSelect(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <main className="flex-grow relative flex items-center justify-center p-md lg:p-lg overflow-hidden">
        {/* Assignment Card */}
        <section className="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-lg border border-outline-variant p-8 lg:p-[32px] shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-base mb-2">
              <span className="material-symbols-outlined text-4xl text-primary">add_task</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Create New Assignment</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Set up the details and resources for your students.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignment Title */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="title">Assignment Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Final Project: E-commerce App"
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-error text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="due_date">Due Date</label>
                <input
                  id="due_date"
                  type="date"
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="text-error text-sm mt-1">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Total Marks */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="marks">Total Marks</label>
                <input
                  id="marks"
                  type="number"
                  placeholder="100"
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                  {...register("totalMarks", { valueAsNumber: true })}
                />
                {errors.totalMarks && (
                  <p className="text-error text-sm mt-1">{errors.totalMarks.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="description">Assignment Description</label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Provide detailed instructions for the students..."
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-error text-sm">{errors.description.message}</p>
                )}
                <p className="text-right text-label-sm text-on-surface-variant/70">Min 20 characters</p>
              </div>

              {/* Instructor Notes */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="instructor_notes">Instructor Notes (Optional)</label>
                <textarea
                  id="instructor_notes"
                  rows={2}
                  placeholder="Internal notes for grading or reference..."
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                  {...register("instructorNotes")}
                />
                {errors.instructorNotes && (
                  <p className="text-error text-sm mt-1">{errors.instructorNotes.message}</p>
                )}
              </div>

              {/* Attachment Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface ml-1">Attachment Upload (Optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    handleFileSelect(file)
                  }}
                />

                {selectedFile ? (
                  <div className="flex items-center justify-between bg-surface-container p-3 rounded-lg border border-outline-variant">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">{selectedFile.name}</p>
                        <p className="text-[10px] text-on-surface-variant leading-none">{formatFileSize(selectedFile.size)} &bull; Ready to submit</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`relative group cursor-pointer ${isDragging ? "scale-[1.02]" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={openFilePicker}
                  >
                    <div className="flex flex-col items-center justify-center w-full min-h-[180px] bg-surface-container-low border border-dashed border-outline-variant rounded-lg hover:border-primary hover:bg-primary-container/40 transition-all p-6 text-center">
                      <span className="material-symbols-outlined text-5xl mb-3 text-primary">cloud_upload</span>
                      <p className="font-headline-md text-[18px] text-on-surface">
                        {isDragging ? "Drop the file here!" : "Drag & drop resources here, or "}
                        <span className="text-primary font-bold">click to browse</span>
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">PDF only, max 10MB</p>
                    </div>
                  </div>
                )}

                {errors.file && (
                  <p className="text-error text-sm mt-1">{errors.file.message}</p>
                )}
              </div>

            {/* ── Rubric (Required) ── */}
            <div className="md:col-span-2 border-t border-outline-variant pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">checklist</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Rubric</h3>
                <span className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-widest">Required</span>
              </div>

              <div className="space-y-2 mb-4">
                <label className="font-label-md text-label-md text-on-surface ml-1">Rubric Title</label>
                <input
                  value={rubricTitle}
                  onChange={(e) => setRubricTitle(e.target.value)}
                  placeholder="e.g. Final Project Rubric"
                  className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2.5 font-body-md text-body-md transition-all"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRubricMode("manual")}
                  className={`flex-1 px-md py-sm rounded-md font-label-md transition-all ${rubricMode === "manual" ? "bg-primary text-primary-foreground" : "bg-surface-container text-on-surface-variant"}`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setRubricMode("pdf")}
                  className={`flex-1 px-md py-sm rounded-md font-label-md transition-all ${rubricMode === "pdf" ? "bg-primary text-primary-foreground" : "bg-surface-container text-on-surface-variant"}`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setRubricMode("library")}
                  className={`flex-1 px-md py-sm rounded-md font-label-md transition-all ${rubricMode === "library" ? "bg-primary text-primary-foreground" : "bg-surface-container text-on-surface-variant"}`}
                >
                  Use from library
                </button>
              </div>

              {rubricMode === "manual" ? (
                <div className="space-y-4">
                  {criteriaRows.map((row) => (
                    <div key={row.id} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-lg">
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={row.description}
                          onChange={(e) => updateCriteriaRow(row.id, "description", e.target.value)}
                          placeholder="Criterion description..."
                          rows={2}
                          className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2 font-body-md text-body-md transition-all resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={row.maxPoints || ""}
                            onChange={(e) =>
                              updateCriteriaRow(row.id, "maxPoints", Math.max(1, parseInt(e.target.value) || 0))
                            }
                            className="w-24 bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-2 py-2 font-body-md text-body-md text-center transition-all"
                            placeholder="pts"
                          />
                          <span className="font-label-sm text-label-sm text-on-surface-variant">points</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCriteriaRow(row.id)}
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/30 transition-colors shrink-0 mt-1"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCriteriaRow}
                    className="flex items-center justify-center gap-sm py-sm px-md bg-primary text-primary-foreground rounded-md font-label-md text-label-md hover:bg-primary/90 transition-all active:scale-95 w-full"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Add Criterion
                  </button>
                </div>
              ) : rubricMode === "pdf" ? (
                <div className="space-y-4">
                  <input
                    ref={rubricFileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      if (file) {
                        setRubricPdfFile(file)
                        handleRubricPdfImport(file)
                      }
                      e.target.value = ""
                    }}
                  />

                  {isImporting ? (
                    <div className="flex items-center justify-center gap-3 py-6 bg-surface-container-low rounded-lg">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">Extracting criteria from PDF...</span>
                    </div>
                  ) : rubricPdfFile ? (
                    <div className="flex items-center justify-between bg-surface-container p-3 rounded-lg border border-outline-variant">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
                          <span className="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{rubricPdfFile.name}</p>
                          <p className="text-[10px] text-on-surface-variant leading-none">{formatFileSize(rubricPdfFile.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRubricPdfFile(null)
                          setImportedCriteria([])
                          if (rubricFileInputRef.current) rubricFileInputRef.current.value = ""
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => rubricFileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full min-h-[120px] bg-surface-container-low border border-dashed border-outline-variant rounded-lg hover:border-primary hover:bg-primary-container/40 transition-all p-6 text-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-4xl mb-2 text-primary">description</span>
                      <p className="font-label-md text-label-md text-on-surface">
                        Upload a PDF with rubric criteria
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">PDF only</p>
                    </button>
                  )}

                  {importedCriteria.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-label-md text-label-md text-primary">AI-Suggested Criteria</p>
                      {importedCriteria.map((c, i) => (
                        <div key={`ai-${i}`} className="flex items-center justify-between p-3 bg-primary-container/50 rounded-md border border-dashed border-primary/30">
                          <div className="flex-1 min-w-0">
                            <p className="font-body-md text-body-md text-on-surface truncate">{c.description}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">{c.maxPoints} pts</p>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            <button
                              type="button"
                              onClick={() => acceptImportedCriterion(c.description, c.maxPoints)}
                              className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md font-bold"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissImportedCriterion(c.description)}
                              className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs rounded-md font-bold"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {rubricsLoading ? (
                    <div className="flex items-center justify-center gap-3 py-6 bg-surface-container-low rounded-lg">
                      <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">Loading your rubric library...</span>
                    </div>
                  ) : confirmedRubrics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-6 bg-surface-container-low rounded-lg text-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">menu_book</span>
                      <p className="font-body-md text-body-md text-on-surface">No confirmed rubrics yet</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Rubrics become reusable once you confirm them.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {confirmedRubrics.map((rubric) => {
                          const selected = selectedLibraryId === rubric.id
                          const totalPts = rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)
                          return (
                            <button
                              key={rubric.id}
                              type="button"
                              onClick={() => selectLibraryRubric(rubric)}
                              className={`text-left p-4 rounded-lg border transition-all ${
                                selected
                                  ? "border-primary bg-primary-container/40"
                                  : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-label-md text-label-md text-on-surface truncate">{rubric.title}</p>
                                {selected && (
                                  <span className="material-symbols-outlined text-primary text-lg shrink-0">check_circle</span>
                                )}
                              </div>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">
                                {rubric.criteria.length} criteria · {totalPts} pts
                              </p>
                              <p className="font-label-sm text-label-sm text-outline mt-1">
                                {new Date(rubric.createdAt).toLocaleDateString()}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                      {selectedLibraryId && (
                        <p className="font-label-sm text-label-sm text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          Loaded from library — you can still tweak it in Manual mode.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || rubricSubmitting}
                className="bg-primary text-white flex items-center gap-sm px-8 py-4 rounded-md font-bold transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || rubricSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="font-label-md text-label-md">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="font-label-md text-label-md">Create Assignment</span>
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5">send</span>
                  </>
                )}
              </button>
            </div>
            </div>
          </form>
        </section>
    </main>
  )
}