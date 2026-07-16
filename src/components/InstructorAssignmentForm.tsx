import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form"
import { toast } from "sonner"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const instructorAssignmentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    difficulty: z.string().min(1, "Difficulty level is required"),
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
  subject: "",
  category: "",
  difficulty: "",
  dueDate: "",
  totalMarks: undefined as unknown as number,
  description: "",
  instructorNotes: "",
  file: null,
}

export function InstructorAssignmentForm() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<InstructorAssignmentFormData>({
    resolver: zodResolver(instructorAssignmentSchema),
    mode: "onChange",
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = form

  const onSubmit: SubmitHandler<InstructorAssignmentFormData> = async (data) => {
    try {
      console.log(data)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Assignment created successfully")
      reset(defaultValues)
      setSelectedFile(null)
    } catch {
      toast.error("Something went wrong while creating the assignment")
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
    <div className="flex min-h-screen">
      {/* SideNavBar */}
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
              <span className="material-symbols-outlined text-4xl sparkle-icon-gradient" style={{ fontVariationSettings: "'FILL' 1" }}>add_task</span>
              <h2 className="font-headline-lg text-headline-lg text-on-background">Create New Assignment</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Set up the details and resources for your students.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignment Title */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="title">Assignment Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Final Project: E-commerce App"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-error text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("subject")}
                >
                  <option value="">Select Subject</option>
                  <option>React</option>
                  <option>Node.js</option>
                  <option>Database</option>
                  <option>JavaScript</option>
                  <option>Algorithms</option>
                  <option>Flutter</option>
                </select>
                {errors.subject && (
                  <p className="text-error text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="category">Assignment Category</label>
                <select
                  id="category"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("category")}
                >
                  <option value="">Select Category</option>
                  <option>Homework</option>
                  <option>Quiz</option>
                  <option>Project</option>
                  <option>Lab</option>
                  <option>Research</option>
                </select>
                {errors.category && (
                  <p className="text-error text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("difficulty")}
                >
                  <option value="">Select Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                {errors.difficulty && (
                  <p className="text-error text-sm mt-1">{errors.difficulty.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="due_date">Due Date</label>
                <input
                  id="due_date"
                  type="date"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="text-error text-sm mt-1">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Total Marks */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="marks">Total Marks</label>
                <input
                  id="marks"
                  type="number"
                  placeholder="100"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("totalMarks", { valueAsNumber: true })}
                />
                {errors.totalMarks && (
                  <p className="text-error text-sm mt-1">{errors.totalMarks.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="description">Assignment Description</label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Provide detailed instructions for the students..."
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("description")}
                />
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <p className="text-error text-sm">{errors.description.message}</p>
                  )}
                  <p className="text-right text-label-sm text-on-surface-variant/70 ml-auto">Min 20 characters</p>
                </div>
              </div>

              {/* Instructor Notes */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background ml-1" htmlFor="instructor_notes">Instructor Notes (Optional)</label>
                <textarea
                  id="instructor_notes"
                  rows={2}
                  placeholder="Internal notes for grading or reference..."
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
                  {...register("instructorNotes")}
                />
                {errors.instructorNotes && (
                  <p className="text-error text-sm mt-1">{errors.instructorNotes.message}</p>
                )}
              </div>

              {/* Attachment Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background ml-1">Attachment Upload (Optional)</label>
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
                    className={`relative group cursor-pointer ${isDragging ? "scale-[1.02]" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={openFilePicker}
                  >
                    <div className="flex flex-col items-center justify-center w-full min-h-[180px] bg-[#F5F7FF] border-2 border-dashed border-[#6366F1]/30 rounded-2xl hover:border-[#14B8A6]/50 hover:bg-[#F0F2FF] transition-all p-6 text-center">
                      <span className="material-symbols-outlined text-5xl mb-3 file-upload-gradient" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                      <p className="font-headline-md text-[18px] text-on-background">
                        {isDragging ? "Drop the file here!" : "Drag & drop resources here, or "}
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
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button-gradient text-white flex items-center gap-sm px-8 py-4 rounded-full font-bold transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
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
          </form>

          {/* Decorative low-opacity blobs for internal depth */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container/10 blur-3xl rounded-full pointer-events-none"></div>
        </section>
      </main>

      {/* Mobile Navigation */}
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