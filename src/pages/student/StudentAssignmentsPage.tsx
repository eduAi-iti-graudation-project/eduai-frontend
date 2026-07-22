import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { FileDropzone } from "@/components/ui/FileDropzone"

export function StudentAssignmentsPage() {
  const queryClient = useQueryClient()
  const [submitModal, setSubmitModal] = useState<{ assignmentId: string; assignmentTitle: string } | null>(null)
  const [textContent, setTextContent] = useState("")
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: api.getClasses,
  })

  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.getAssignments(),
    enabled: !!classes.data,
  })

  const submissions = useQuery({
    queryKey: ["submissions", "my"],
    queryFn: () => api.getSubmissions(),
  })

  const createSubmission = useMutation({
    mutationFn: (data: { assignmentId: string; content: string }) =>
      api.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("Assignment submitted successfully")
      setSubmitModal(null)
      setTextContent("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createSubmissionPdf = useMutation({
    mutationFn: (formData: FormData) => api.createSubmissionFromPdf(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("PDF submitted successfully")
      setSubmitModal(null)
      setSelectedFile(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isLoading = classes.isLoading || assignments.isLoading || submissions.isLoading
  const isError = classes.isError || assignments.isError || submissions.isError

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Failed to load assignments</p>
          <button
            onClick={() => { classes.refetch(); assignments.refetch(); submissions.refetch() }}
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const classMap = new Map((classes.data ?? []).map((c) => [c.id, c]))
  const submissionMap = new Map((submissions.data ?? []).map((s) => [s.assignmentId, s]))

  const assignmentsByClass = new Map<string, NonNullable<typeof assignments.data>>()
  for (const a of assignments.data ?? []) {
    const list = assignmentsByClass.get(a.classId) ?? []
    list.push(a)
    assignmentsByClass.set(a.classId, list)
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <h1 className="font-headline-lg text-headline-lg text-primary">Assignments</h1>
      </header>

      <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((group) => (
              <div key={group}>
                <div className="h-6 w-48 bg-surface-container-high rounded-full mb-3 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                      <div className="h-5 w-64 bg-surface-container-high rounded-full mb-2" />
                      <div className="h-4 w-40 bg-surface-container-high rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (assignments.data ?? []).length === 0 ? (
          <EmptyState
            icon="assignment"
            title="No assignments"
            description="When your teachers post assignments, they'll appear here."
          />
        ) : (
          <div className="space-y-6">
            {Array.from(assignmentsByClass.entries()).map(([classId, classAssignments]) => {
              const cls = classMap.get(classId)
              return (
                <div key={classId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary">class</span>
                    <h2 className="font-headline-md text-headline-md text-primary">{cls?.name ?? "Unknown Class"}</h2>
                  </div>
                  <div className="space-y-3">
                    {classAssignments.map((a) => {
                      const sub = submissionMap.get(a.id)
                      const isSubmitted = !!sub
                      return (
                        <div
                          key={a.id}
                          className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-label-md text-label-md text-on-surface">{a.title}</h3>
                              {a.description && (
                                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{a.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                                  {new Date(a.dueDate).toLocaleDateString()}
                                </span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">
                                  {a.totalPoints} pts
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSubmitted ? (
                                sub?.status === "CONFIRMED" ? (
                                  <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-1 rounded-full">
                                    Graded
                                  </span>
                                ) : (
                                  <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-sm py-1 rounded-full">
                                    Submitted
                                  </span>
                                )
                              ) : (
                                <button
                                  onClick={() => setSubmitModal({ assignmentId: a.id, assignmentTitle: a.title })}
                                  className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md hover:opacity-90 active:scale-95 transition-all"
                                >
                                  Submit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSubmitModal(null)}>
          <div className="bg-white rounded-[32px] p-xl max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Submit Assignment</h2>
              <button onClick={() => setSubmitModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">{submitModal.assignmentTitle}</p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMode("text")}
                className={`flex-1 px-md py-sm rounded-full font-label-md transition-all ${uploadMode === "text" ? "bg-primary-container text-white" : "bg-surface-container text-on-surface-variant"}`}
              >
                Type
              </button>
              <button
                onClick={() => setUploadMode("file")}
                className={`flex-1 px-md py-sm rounded-full font-label-md transition-all ${uploadMode === "file" ? "bg-primary-container text-white" : "bg-surface-container text-on-surface-variant"}`}
              >
                Upload PDF
              </button>
            </div>

            {uploadMode === "text" ? (
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your submission here..."
                className="w-full min-h-[200px] p-md rounded-2xl border border-outline-variant/20 font-body-md text-body-md text-on-surface bg-surface-container-low resize-none outline-none focus:border-primary"
              />
            ) : (
              <FileDropzone
                onFileSelect={(file) => setSelectedFile(file)}
                isUploading={createSubmissionPdf.isPending}
              />
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSubmitModal(null)}
                className="border-2 border-error text-error px-md py-sm rounded-full font-label-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (uploadMode === "text") {
                    if (!textContent.trim()) {
                      toast.error("Please enter your submission content")
                      return
                    }
                    createSubmission.mutate({ assignmentId: submitModal.assignmentId, content: textContent })
                  } else {
                    if (!selectedFile) {
                      toast.error("Please select a PDF file")
                      return
                    }
                    const formData = new FormData()
                    formData.append("file", selectedFile)
                    formData.append("assignmentId", submitModal.assignmentId)
                    createSubmissionPdf.mutate(formData)
                  }
                }}
                disabled={createSubmission.isPending || createSubmissionPdf.isPending}
                className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md disabled:opacity-50"
              >
                {createSubmission.isPending || createSubmissionPdf.isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
