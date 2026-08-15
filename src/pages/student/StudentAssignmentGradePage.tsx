import { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileDropzone } from "@/components/ui/FileDropzone"
import { LoadingState } from "@/components/shared/LoadingState"
import { BackLink } from "@/components/shared/BackLink"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "NOT_STARTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
        Not started
      </span>
    )
  }
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-fixed/30 text-primary font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[15px]">check_circle</span>
        Graded
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
      <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
      Submitted
    </span>
  )
}

export function StudentAssignmentGradePage() {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text")
  const [textContent, setTextContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: studentClasses } = useQuery({
    queryKey: ["student", "courses", user?.id],
    queryFn: () => api.getStudentCourses(user!.id),
    enabled: !!user?.id,
  })

  const cls = studentClasses?.find((c) => c.id === classId)
  const assignment = cls?.assignments.find((a) => a.id === assignmentId)

  const { data: mySubmissions } = useQuery<api.MySubmission[]>({
    queryKey: ["my-submissions", user?.id],
    queryFn: () => api.getMySubmissions(),
    enabled: !!user?.id,
    staleTime: 30_000,
  })
  const submission = mySubmissions?.find((s) => s.assignmentId === assignmentId)

  const { data: grades, isLoading } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: () => api.getStudentGrades(user!.id),
    enabled: !!user?.id,
  })

  const confirmedGrades = useMemo(
    () => (grades ?? []).filter((g) => g.isConfirmed && g.assignmentId === assignmentId),
    [grades, assignmentId],
  )

  const needsFeedback = useMemo(
    () => confirmedGrades.some((g) => !g.aiFeedback),
    [confirmedGrades],
  )

  const firstSubmissionId = useMemo(
    () => confirmedGrades.find((g) => !g.aiFeedback)?.submissionId,
    [confirmedGrades],
  )

  const { data: polledGrades } = useQuery({
    queryKey: ["student-submission-grades", user?.id, firstSubmissionId],
    queryFn: () => api.getStudentSubmissionGrades(user!.id, firstSubmissionId!),
    enabled: !!user?.id && !!firstSubmissionId,
    refetchInterval: needsFeedback ? 5_000 : false,
  })

  const mergedGrades = useMemo(() => {
    if (!polledGrades) return confirmedGrades
    return confirmedGrades.map((g) => {
      const polled = polledGrades.find((p) => p.id === g.id)
      return polled ?? g
    })
  }, [confirmedGrades, polledGrades])

  const totalEarned = mergedGrades.reduce((s, g) => s + g.pointsAwarded, 0)
  const totalPossible = mergedGrades.reduce((s, g) => s + g.criterionMaxPoints, 0)

  const createSubmission = useMutation({
    mutationFn: (data: { assignmentId: string; content: string }) => api.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions", user?.id] })
      toast.success("Assignment submitted successfully")
      setSubmitOpen(false)
      setTextContent("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createSubmissionPdf = useMutation({
    mutationFn: (formData: FormData) => api.createSubmissionFromPdf(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions", user?.id] })
      toast.success("PDF submitted successfully")
      setSubmitOpen(false)
      setSelectedFile(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <LoadingState />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <EmptyState icon="assignment" title="Assignment not found" description="This assignment doesn't exist in this class." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
        <BackLink to={`/student/classes/${classId}`} label="Back to Class" />
        <h1 className="font-headline-lg text-headline-lg text-primary">{assignment.title}</h1>
        <Link
          to={`/student/homework-help?course=${classId}&assignment=${assignmentId}`}
          className="ml-auto inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-md py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Ask AI
        </Link>
      </div>

      {assignment.description && (
        <div className="rounded-lg bg-white p-md border border-border mb-6">
          <p className="font-body-md text-body-md text-on-surface-variant">{assignment.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Due {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{assignment.totalPoints} pts</span>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">task</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Your submission</p>
              <StatusBadge status={submission?.status} />
            </div>
          </div>
          <div className="shrink-0">
            {submission ? (
              <Button asChild variant="outline" className="rounded-lg shrink-0">
                <Link to={`/student/submissions/${submission.id}`}>
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  View submission
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setSubmitOpen(true)}
                className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md hover:bg-primary/90 active:scale-95 transition-all h-auto"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Submit
              </Button>
            )}
          </div>
        </div>
        {submission && (
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
            {submission.status === "CONFIRMED" ? "Graded and confirmed by your teacher." : "Submitted — awaiting grading."}
          </p>
        )}
      </div>

      {mergedGrades.length === 0 ? (
        <div className="rounded-lg bg-white p-md border border-border text-center py-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">rate_review</span>
          <p className="font-label-md text-label-md text-on-surface-variant">No grades confirmed yet for this assignment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Results</h2>
              <div className="text-right">
                <p className="font-headline-lg text-headline-lg text-primary">
                  {totalEarned}
                  <span className="font-body-md text-body-md text-on-surface-variant">/{totalPossible}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {mergedGrades.map((g) => (
                <div
                  key={g.id}
                  className="rounded-lg bg-surface-container-low p-md border border-border"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <p className="font-label-md text-label-md text-on-surface">{g.criterionDescription}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {g.pointsAwarded}/{g.criterionMaxPoints} points
                      </p>
                    </div>
                    {g.criterionMaxPoints > 0 && (
                      <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 shrink-0">
                        {Math.round((g.pointsAwarded / g.criterionMaxPoints) * 100)}%
                      </Badge>
                    )}
                  </div>
                  {g.aiFeedback ? (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">AI Feedback</p>
                      <p className="font-body-md text-body-md text-on-surface">{g.aiFeedback}</p>
                    </div>
                  ) : needsFeedback ? (
                    <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] animate-spin">sync</span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Generating feedback...</p>
                    </div>
                  ) : null}
                  {g.teacherNotes && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="font-label-sm text-label-sm text-primary mb-1">Teacher Notes</p>
                      <p className="font-body-md text-body-md text-on-surface">{g.teacherNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {submitOpen && (
        <Dialog open onOpenChange={(next) => { if (!next) setSubmitOpen(false) }}>
          <DialogContent className="rounded-lg w-full max-w-[768px] bg-white p-xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="font-headline-md text-headline-md text-primary">Submit Assignment</DialogTitle>
            </div>
            <DialogDescription className="font-body-md text-body-md text-on-surface-variant mb-4">
              {assignment.title}
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
                onClick={() => setSubmitOpen(false)}
                className="border border-outline-variant text-on-surface-variant px-md py-sm rounded-lg font-label-md hover:bg-surface-container h-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (uploadMode === "text") {
                    if (!textContent.trim()) {
                      toast.error("Please enter your submission content")
                      return
                    }
                    createSubmission.mutate({ assignmentId: assignment.id, content: textContent })
                  } else {
                    if (!selectedFile) {
                      toast.error("Please select a PDF file")
                      return
                    }
                    const formData = new FormData()
                    formData.append("file", selectedFile)
                    formData.append("assignmentId", assignment.id)
                    createSubmissionPdf.mutate(formData)
                  }
                }}
                disabled={createSubmission.isPending || createSubmissionPdf.isPending}
                className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md hover:bg-primary/90 h-auto"
              >
                {createSubmission.isPending || createSubmissionPdf.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
