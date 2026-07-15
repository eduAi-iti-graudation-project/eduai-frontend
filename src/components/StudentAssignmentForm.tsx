import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form"
import { toast } from "sonner"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const assignmentSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .min(10, "Notes must be at least 10 characters")
      .max(1000, "Notes must be 1000 characters or fewer"),
    file: z.instanceof(File).nullable(),
  })
  .superRefine((value, context) => {
    if (!value.file) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Please upload a PDF file",
      })
      return
    }

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
  })

export type AssignmentFormData = z.infer<typeof assignmentSchema>

const defaultValues: AssignmentFormData = {
  notes: "",
  file: null,
}

export function StudentAssignmentForm() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const successTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    mode: "onChange",
    defaultValues,
  })

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = form

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const clearSuccessState = () => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  const onSubmit: SubmitHandler<AssignmentFormData> = async (data) => {
    try {
      console.log(data)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Assignment submitted successfully")
      reset(defaultValues)
      setSelectedFile(null)
      setNotes("")
      clearSuccessState()
    } catch {
      toast.error("Something went wrong while submitting")
    }
  }

  const onInvalid: SubmitErrorHandler<AssignmentFormData> = () => {
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

  return (
    <div className="flex min-h-screen">
      {/* SideNavBar (Shared Component Identity) */}
      <aside className="hidden md:flex flex-col h-screen w-64 docked left-0 bg-surface-container-low dark:bg-surface-container-lowest py-md px-sm gap-base sticky top-0 shrink-0">
        <div className="flex flex-col gap-xs px-2 mb-lg">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim leading-none">EduAI Admin</h1>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Teacher Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow space-y-1">
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-md text-label-md">Classes</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <span className="font-label-md text-label-md">Rubrics</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 bg-primary-container text-on-primary-container rounded-full font-bold scale-98 transition-all duration-200" href="#">
            <span className="material-symbols-outlined">list_alt</span>
            <span className="font-label-md text-label-md">Submissions</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">notifications_active</span>
            <span className="font-label-md text-label-md">Alerts</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="font-label-md text-label-md">Assistant</span>
          </a>
        </nav>
        <div className="mt-auto space-y-1 pt-base border-t border-outline-variant/30">
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </a>
          <a className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-label-md text-label-md">Support</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow relative flex items-center justify-center p-md lg:p-lg overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container blur-blob rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-container blur-blob rounded-full translate-x-1/3 translate-y-1/3"></div>

        {/* Assignment Card */}
        <section className="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-xl shadow-on-background/5 border border-on-surface/5 p-8 lg:p-[32px]">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-base mb-2">
              <span className="material-symbols-outlined text-4xl sparkle-icon-gradient" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome_motion</span>
              <h2 className="font-headline-lg text-headline-lg text-on-background">Submit Your Assignment</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Add your notes and upload your file below to complete this task.</p>
          </div>

          {/* Form */}
          <form action="#" onSubmit={handleFormSubmit} className="space-y-6">
            {/* Notes Area */}
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="notes">Notes & Comments</label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                placeholder="Add any notes or comments about your assignment..."
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all placeholder:text-on-surface-variant/50 min-h-[140px]"
                value={notes}
                onChange={(e) => {
                  const value = e.target.value
                  setNotes(value)
                  setValue("notes", value, { shouldValidate: true })
                }}
              />
              {errors.notes && (
                <p className="text-error text-sm mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-background ml-1">File Upload</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  handleFileSelect(file)
                }}
              />

              {selectedFile ? (
                /* Selected File Pill */
                <div className="flex flex-wrap items-center gap-sm">
                  <div className="flex items-center gap-xs bg-surface-variant/50 border border-outline-variant rounded-full py-1.5 pl-3 pr-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    <span className="font-label-md text-label-md text-on-surface">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop Zone */
                <div
                  className={`relative group cursor-pointer ${isDragging ? "scale-[1.02]" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={openFilePicker}
                >
                  <div className="flex flex-col items-center justify-center w-full min-h-[180px] bg-[#F5F7FF] border-2 border-dashed border-[#6366F1]/30 rounded-2xl hover:border-[#14B8A6]/50 hover:bg-[#F0F2FF] transition-all p-6 text-center">
                    <span className="material-symbols-outlined text-5xl mb-3 file-upload-gradient" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                    <p className="font-headline-md text-[18px] text-on-background">
                      {isDragging ? "Drop the file here!" : "Drag & drop your PDF here, or "}
                      <span className="text-[#6366F1] font-bold">click to browse</span>
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">PDF only, max 10MB</p>
                  </div>
                </div>
              )}

              {errors.file && (
                <p className="text-error text-sm mt-1">{errors.file.message}</p>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button-gradient text-white flex items-center gap-sm px-8 py-4 rounded-full font-bold transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="font-label-md text-label-md">Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="font-label-md text-label-md">Submit Assignment</span>
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5">send</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Decorative low-opacity blobs for internal depth */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container/10 blur-3xl rounded-full pointer-events-none"></div>
        </section>
      </main>

      {/* Mobile Navigation (Responsive Pivot) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface border-t border-outline-variant/30 py-base px-margin-mobile pb-safe shadow-lg">
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1" href="#">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-[10px]">Home</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1" href="#">
          <span className="material-symbols-outlined">school</span>
          <span className="font-label-sm text-[10px]">Classes</span>
        </a>
        <a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-90" href="#">
          <span className="material-symbols-outlined">list_alt</span>
          <span className="font-label-sm text-[10px]">Submits</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1" href="#">
          <span className="material-symbols-outlined">smart_toy</span>
          <span className="font-label-sm text-[10px]">AI Bot</span>
        </a>
      </nav>
    </div>
  )
}