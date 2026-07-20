import { useRef, useState } from "react"
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
      .max(1000, "Notes must be 1000 characters or fewer"),
    file: z.instanceof(File).nullable(),
  })
  .superRefine((value, context) => {
    const hasNotes = value.notes.length >= 10
    const hasFile = value.file !== null

    if (!hasNotes && !hasFile) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message: "Either add notes (min 10 characters) or upload a PDF file",
      })
      return
    }

    if (hasFile && value.file) {
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

export type AssignmentFormData = z.infer<typeof assignmentSchema>

const defaultValues: AssignmentFormData = {
  notes: "",
  file: null,
}

export function StudentAssignmentForm() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
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

  const onSubmit: SubmitHandler<AssignmentFormData> = async (data) => {
    try {
      console.log(data)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Assignment submitted successfully")
      reset(defaultValues)
      setSelectedFile(null)
      setNotes("")
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* TopNavBar */}
      <header className="bg-surface dark:bg-surface flex justify-between items-center w-full px-margin-mobile py-base max-w-full fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary font-bold text-headline-lg">school</span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed-dim">EduAI</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaR8Kwh6k2eyYYhxwSn4aX4zJQmf9agPvc0KlznytwDFSumsDNq6sAOJDpYlirNfefdIDN1cdYdX_zUN3oszkAhECboawshZ9BoM0hCHY5LZPHAgqdMpbgNcHQ1S4K6JYYTZJT-LdkAkaYl_ixsrrCtHm9rTNrAVRngax8oyEOpyQKSExN81uEBFDFW73QVTbjOneg0eZgXRHqxZjRUl4XuqByOlq2xvyRJ8PN-sXSXP3ek1mhEjaP" alt="Student avatar" />
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="flex-grow pt-20 pb-24 px-margin-mobile">
        <div className="relative bg-surface-container-lowest rounded-3xl p-6 shadow-xl shadow-on-background/5 border border-on-surface/5 overflow-hidden">
          {/* Decorative Blobs */}
          <div className="blurred-blob blob-1"></div>
          <div className="blurred-blob blob-2"></div>

          {/* Header Section */}
          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center mb-4 border border-white">
              <span className="material-symbols-outlined text-gradient" style={{ fontSize: "32px" }}>description</span>
              <span className="material-symbols-outlined absolute text-yellow-400 -top-1 -right-1" style={{ fontSize: "20px" }}>auto_awesome</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-background mb-1">Submit Your Assignment</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Add your notes and upload your file below</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleFormSubmit} className="relative z-10 space-y-6">
            {/* Textarea */}
            <div>
              <label className="block font-label-md text-label-md text-on-background mb-2 px-1" htmlFor="notes">Assignment Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                placeholder="Add any notes or comments about your assignment..."
                className="w-full min-h-[140px] rounded-2xl border-2 border-surface-container-high focus:border-primary-container focus:ring-0 bg-surface-container-low p-4 text-on-surface placeholder:text-outline text-body-md transition-colors"
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
            <div>
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
                /* Selected File State */
                <div className="flex items-center justify-between bg-surface-container p-3 rounded-full border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-background">{selectedFile.name}</p>
                      <p className="text-[10px] text-on-surface-variant leading-none">{formatFileSize(selectedFile.size)} &bull; Ready to submit</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              ) : (
                /* Drop Zone */
                <div
                  className={`upload-zone rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer ${isDragging ? "border-primary scale-[1.02]" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={openFilePicker}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-submit flex items-center justify-center mb-3 text-white shadow-md">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p className="font-label-md text-label-md text-on-background">
                    {isDragging ? "Drop the file here!" : "Drag & drop your PDF here, or "}
                    <span className="text-primary font-bold">click to browse</span>
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">PDF only, max 10MB</p>
                </div>
              )}

              {errors.file && (
                <p className="text-error text-sm mt-1">{errors.file.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-submit text-white font-headline-md text-body-md py-4 rounded-full glow-button flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Assignment</span>
                  <span className="material-symbols-outlined">send</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Submission Meta Card (Bento-style snippet) */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-on-surface/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">calendar_today</span>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Deadline</p>
              <p className="font-label-md text-label-md text-on-background">Oct 24, 11:59 PM</p>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-on-surface/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Points</p>
              <p className="font-label-md text-label-md text-on-background">100 Max</p>
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-margin-mobile py-base pb-safe bg-surface dark:bg-surface shadow-lg rounded-t-xl md:hidden">
        <div className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm-mobile text-label-sm-mobile">Home</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-90 transition-transform duration-200">
          <span className="material-symbols-outlined">school</span>
          <span className="font-label-sm-mobile text-label-sm-mobile">Classes</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">notifications</span>
          <span className="font-label-sm-mobile text-label-sm-mobile">Alerts</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">smart_toy</span>
          <span className="font-label-sm-mobile text-label-sm-mobile">Assistant</span>
        </div>
      </nav>
    </div>
  )
}