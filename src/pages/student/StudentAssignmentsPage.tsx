import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { FileDropzone } from "@/components/ui/FileDropzone"

interface LocalSubmission {
  id: string
  assignmentId: string
  status: string
}

export function StudentAssignmentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [submitModal, setSubmitModal] = useState<{ assignmentId: string; assignmentTitle: string } | null>(null)
  const [textContent, setTextContent] = useState("")
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const localSubmissions = useQuery<LocalSubmission[]>({
    queryKey: ["my-submissions"],
    queryFn: () => [],
    initialData: [],
    staleTime: Infinity,
  })

  const createSubmission = useMutation({
    mutationFn: (data: { assignmentId: string; content: string }) =>
      api.createSubmission(data),
    onSuccess: (res) => {
      const existing = queryClient.getQueryData<LocalSubmission[]>(["my-submissions"]) ?? []
      queryClient.setQueryData<LocalSubmission[]>(["my-submissions"], [
        ...existing,
        { id: res.id, assignmentId: res.assignmentId, status: res.status },
      ])
      toast.success("Assignment submitted successfully")
      setSubmitModal(null)
      setTextContent("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createSubmissionPdf = useMutation({
    mutationFn: (formData: FormData) => api.createSubmissionFromPdf(formData),
    onSuccess: (res) => {
      const existing = queryClient.getQueryData<LocalSubmission[]>(["my-submissions"]) ?? []
      queryClient.setQueryData<LocalSubmission[]>(["my-submissions"], [
        ...existing,
        { id: res.id, assignmentId: res.assignmentId, status: res.status },
      ])
      toast.success("PDF submitted successfully")
      setSubmitModal(null)
      setSelectedFile(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (studentClasses.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Assignments</h1>
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
      </div>
    )
  }

  if (studentClasses.isError) {
    return (
      <div className="flex items-center justify-center h-full p-margin-desktop">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Failed to load assignments</p>
          <button
            onClick={() => studentClasses.refetch()}
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const classes = studentClasses.data ?? []
  const submissionMap = new Map((localSubmissions.data ?? []).map((s) => [s.assignmentId, s]))

  if (classes.length === 0) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Assignments</h1>
        <EmptyState
          icon="assignment"
          title="No assignments"
          description="You are not enrolled in any classes yet. Browse available classes to get started."
          action={<Link to="/student/classes" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md inline-block">Browse Classes</Link>}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Assignments</h1>
        <div className="space-y-6">
          {classes.map((cls) => {
            const classAssignments = cls.assignments
            if (classAssignments.length === 0) return null
            return (
              <div key={cls.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">class</span>
                  <h2 className="font-headline-md text-headline-md text-primary">{cls.name}</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">&middot; {cls.teacherName}</span>
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
                            {isSubmitted && sub ? (
                              <Link
                                to={`/student/submissions/${sub.id}`}
                                className="inline-block"
                              >
                                {sub.status === "CONFIRMED" ? (
                                  <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity">
                                    Graded
                                  </span>
                                ) : (
                                  <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-sm py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity">
                                    Submitted
                                  </span>
                                )}
                              </Link>
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
                        {isSubmitted && sub && sub.status !== "CONFIRMED" && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
                            Submitted — awaiting teacher review
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-hidden" onClick={() => setSubmitModal(null)}>
          <div className="bg-white rounded-[32px] p-xl w-full max-w-[768px] mx-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                className="w-full min-h-[300px] p-md rounded-2xl border border-outline-variant/20 font-body-md text-body-md text-on-surface bg-surface-container-low resize-none outline-none focus:border-primary"
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
