import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { FileDropzone } from "@/components/ui/FileDropzone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"

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

  const mySubmissions = useQuery<api.MySubmission[]>({
    queryKey: ["my-submissions", user?.id],
    queryFn: () => api.getMySubmissions(),
    enabled: !!user?.id,
    staleTime: 30_000,
  })

  const createSubmission = useMutation({
    mutationFn: (data: { assignmentId: string; content: string }) =>
      api.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions", user?.id] })
      toast.success("Assignment submitted successfully")
      setSubmitModal(null)
      setTextContent("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createSubmissionPdf = useMutation({
    mutationFn: (formData: FormData) => api.createSubmissionFromPdf(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions", user?.id] })
      toast.success("PDF submitted successfully")
      setSubmitModal(null)
      setSelectedFile(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleOpenMaterial = async (materialId: string) => {
    try {
      const url = await api.getMaterialFileUrl(materialId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open attachment")
    }
  }

  if (studentClasses.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Assignments</h1>
        <LoadingState />
      </div>
    )
  }

  if (studentClasses.isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message="Failed to load assignments"
        onRetry={() => studentClasses.refetch()}
      />
    )
  }

  const classes = studentClasses.data ?? []
  const submissionMap = new Map((mySubmissions.data ?? []).map((s) => [s.assignmentId, s]))

  if (classes.length === 0) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Assignments</h1>
        <EmptyState
          icon="assignment"
          title="No assignments"
          description="You are not enrolled in any classes yet. Browse available classes to get started."
          action={<Link to="/student/classes" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md inline-block">Browse Classes</Link>}
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
                        className="rounded-lg bg-white p-md border border-border hover:border-primary-container/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-label-md text-label-md text-on-surface">{a.title}</h3>
                            {a.description && (
                              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{a.description}</p>
                            )}
                            {a.materials.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {a.materials.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleOpenMaterial(m.id)}
                                    className="inline-flex items-center gap-1.5 px-sm py-1 rounded-md bg-surface-container-low border border-outline-variant hover:border-primary hover:text-primary transition-colors font-label-sm text-label-sm text-on-surface-variant"
                                    title="Download attachment"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                    {m.title}
                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                  </button>
                                ))}
                              </div>
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
                              <div className="flex items-center gap-2">
                                <span
                                  className="bg-surface-container text-on-surface-variant font-label-md px-md py-sm rounded-lg h-auto inline-flex items-center"
                                  aria-label={`Already ${sub.status === "CONFIRMED" ? "graded" : "submitted"}`}
                                >
                                  {sub.status === "CONFIRMED" ? "Graded" : "Submitted"}
                                </span>
                                <Link
                                  to={`/student/submissions/${sub.id}`}
                                  className="font-label-md text-label-md text-primary hover:underline"
                                >
                                  View
                                </Link>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => setSubmitModal({ assignmentId: a.id, assignmentTitle: a.title })}
                                className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md hover:bg-primary/90/90 active:scale-95 transition-all h-auto"
                              >
                                Submit
                              </Button>
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
        <Dialog open onOpenChange={(next) => { if (!next) setSubmitModal(null) }}>
          <DialogContent className="rounded-lg w-full max-w-[768px] bg-white p-xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="font-headline-md text-headline-md text-primary">Submit Assignment</DialogTitle>
            </div>
            <DialogDescription className="font-body-md text-body-md text-on-surface-variant mb-4">
              {submitModal.assignmentTitle}
            </DialogDescription>

            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                onClick={() => setUploadMode("text")}
                className={`flex-1 px-md py-sm rounded-lg font-label-md transition-all h-auto ${uploadMode === "text" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
              >
                Type
              </Button>
              <Button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex-1 px-md py-sm rounded-lg font-label-md transition-all h-auto ${uploadMode === "file" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
              >
                Upload PDF
              </Button>
            </div>

            {uploadMode === "text" ? (
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your submission here..."
                className="w-full min-h-[300px] p-md rounded-lg border border-border font-body-md text-body-md text-on-surface bg-surface-container-low resize-none outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            ) : (
              <FileDropzone
                onFileSelect={(file) => setSelectedFile(file)}
                isUploading={createSubmissionPdf.isPending}
              />
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmitModal(null)}
                className="border border-outline-variant text-on-surface-variant px-md py-sm rounded-lg font-label-md hover:bg-surface-container h-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (submissionMap.has(submitModal.assignmentId)) {
                    toast.error("You have already submitted this assignment")
                    setSubmitModal(null)
                    return
                  }
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
                className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md hover:bg-primary/90/90 h-auto"
              >
                {createSubmission.isPending || createSubmissionPdf.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
