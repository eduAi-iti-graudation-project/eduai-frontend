import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useClassDetail } from "@/hooks/use-classes"
import { useMaterials } from "@/hooks/use-materials"
import { useClassAttendance } from "@/hooks/use-attendance"
import { useCreateChatThread } from "@/hooks/use-chat-threads"
import { FileDropzone } from "@/components/ui/FileDropzone"
import { EmptyState } from "@/components/ui/EmptyState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import * as api from "@/lib/api"

type TabId = "students" | "assignments" | "materials" | "attendance" | "requests"

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "students", label: "Students", icon: "group" },
  { id: "assignments", label: "Assignments", icon: "assignment" },
  { id: "materials", label: "Materials", icon: "folder" },
  { id: "attendance", label: "Attendance", icon: "calendar_month" },
  { id: "requests", label: "Requests", icon: "person_add" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>("students")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const { detail, assignments, isLoading, isError, error, deleteClass, removeEnrollment } = useClassDetail(id ?? "")
  const { materials, upload, remove: removeMaterial } = useMaterials(id ?? "")
  const attendanceQuery = useClassAttendance(id ?? "")
  const createThread = useCreateChatThread()

  const cls = detail.data
  const assignmentsData = assignments.data ?? []
  const attendanceRecords = attendanceQuery.data ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = cls ? (cls as any).enrollments?.map((e: any) => ({ ...e.student, enrollmentId: e.id })) ?? [] : []

  const handleDelete = async () => {
    if (!id) return
    await deleteClass.mutateAsync()
    navigate("/classes", { replace: true })
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return
    await removeEnrollment.mutateAsync(studentId)
  }

  const requestsQuery = useQuery({
    queryKey: ["class", "requests", id],
    queryFn: () => api.getClassRequests(id!),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: (enrollmentId: string) => api.approveEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", "requests", id] })
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      toast.success("Enrollment approved")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: (enrollmentId: string) => api.rejectEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", "requests", id] })
      toast.success("Enrollment rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleUploadMaterial = (file: File) => {
    const base = file.name.replace(/\.pdf$/i, "")
    setUploadTitle(base)
    setPendingFile(file)
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!pendingFile || !uploadTitle.trim()) return
    try {
      await upload.mutateAsync({ title: uploadTitle.trim(), file: pendingFile, onProgress: setUploadProgress })
      toast.success("Material uploaded")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    } finally {
      setPendingFile(null)
      setUploadTitle("")
      setUploadProgress(0)
    }
  }

  const handleRemoveMaterial = async (id: string) => {
    try {
      await removeMaterial.mutateAsync(id)
      toast.success("Material deleted")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    }
  }

  const tabContent = (tab: TabId) => {
    switch (tab) {
      case "students":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Class Roster</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Students join via self-enrollment</p>
            </div>

            {students.length === 0 ? (
              <EmptyState icon="group" title="No students enrolled" description="Add a student to get started" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
                {students.map((s: { id: string; name: string; email: string; enrollmentId: string }) => (
                  <div key={s.id} className="bg-white rounded-[24px] p-md shadow-sm border border-outline-variant/10 flex items-center gap-sm group">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-label-sm font-bold shrink-0">{getInitials(s.name)}</div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/students/${s.id}`} className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors truncate block">{s.name}</Link>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{s.email}</p>
                    </div>
                    <Button
                      onClick={() =>
                        createThread.mutate(
                          { classId: id as string, studentId: s.id },
                          {
                            onSuccess: (thread) => navigate(`/chat/${thread.id}`),
                            onError: (err: Error) => toast.error(err.message),
                          },
                        )
                      }
                      disabled={createThread.isPending}
                      className="h-auto w-auto p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10"
                      title="Message student"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    </Button>
                    <Button
                      onClick={() => handleRemoveStudent(s.id)}
                      className="h-auto w-auto p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove student"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "assignments":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Assignments</h3>
              <Button asChild className="flex items-center gap-xs px-md py-sm h-auto rounded-full bg-primary-container text-white font-label-md text-label-md nudge-hover">
                <Link to={`/assignments/new?classId=${cls?.id}`}>
                  <span className="material-symbols-outlined text-[18px]">add</span>New Assignment
                </Link>
              </Button>
            </div>

            {assignmentsData.length === 0 ? (
              <EmptyState icon="assignment" title="No assignments yet" description="Create an assignment to start grading" />
            ) : (
              <div className="space-y-sm">
                {assignmentsData.map((a) => (
                  <Link key={a.id} to={`/assignments/${a.id}`} className="block bg-white rounded-3xl p-md shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:border-primary-container/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{a.title}</h4>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Due {new Date(a.dueDate).toLocaleDateString()} &bull; {a.totalPoints} pts</p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => { e.preventDefault(); navigate(`/submissions?assignmentId=${a.id}`) }}
                      className="h-auto px-md py-2 rounded-2xl bg-primary-container/10 text-primary font-label-sm text-label-sm hover:bg-primary-container/20 transition-colors cursor-pointer"
                    >
                      View Submissions
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )

      case "materials":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Materials</h3>
            </div>

            <div className="bg-white rounded-[24px] p-md shadow-sm border border-outline-variant/10">
              <h4 className="font-label-md text-label-md text-primary mb-sm">Upload Material</h4>
              <FileDropzone
                accept=".pdf"
                onFileSelect={handleUploadMaterial}
                isUploading={upload.isPending}
                uploadProgress={uploadProgress}
              />
              {pendingFile && (
                <div className="mt-sm space-y-sm">
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Material title"
                    disabled={upload.isPending}
                    className="w-full px-md py-sm rounded-2xl border border-outline-variant bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                  <div className="flex items-center gap-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant flex-1 truncate">{pendingFile.name}</p>
                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={upload.isPending || !uploadTitle.trim()}
                      className="h-auto px-md py-sm rounded-full bg-primary-container text-white font-label-md text-label-md hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                      {upload.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {materials.length === 0 ? (
              <EmptyState icon="folder" title="No materials uploaded" description="Upload a PDF to make it searchable for students" />
            ) : (
              <div className="space-y-sm">
                {materials.map((m) => (
                  <div key={m.id} className="bg-white rounded-3xl p-md shadow-sm border border-outline-variant/10 flex items-center justify-between group">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{m.title}</h4>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      {m.fileUrl && (
                        <Button asChild className="h-auto px-md py-2 rounded-2xl bg-primary-container/10 text-primary font-label-sm text-label-sm hover:bg-primary-container/20 transition-colors">
                          <a href={m.fileUrl} target="_blank" rel="noreferrer">View</a>
                        </Button>
                      )}
                      <Button
                        onClick={() => handleRemoveMaterial(m.id)}
                        disabled={removeMaterial.isPending}
                        className="h-auto w-auto p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "attendance":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Attendance</h3>
              <Button asChild className="flex items-center gap-xs px-md py-sm h-auto rounded-full bg-primary-container text-white font-label-md text-label-md nudge-hover">
                <Link to={`/attendance/import?classId=${id}`}>
                  <span className="material-symbols-outlined text-[18px]">upload</span>Import
                </Link>
              </Button>
            </div>

            {attendanceRecords.length === 0 ? (
              <EmptyState icon="calendar_month" title="No attendance records" description="Import attendance to see the grid here" />
            ) : (
              <div className="overflow-x-auto bg-white rounded-[24px] shadow-sm border border-outline-variant/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <th className="text-left px-4 py-3 font-label-md text-label-md text-on-surface-variant">Student</th>
                      {[...new Set(attendanceRecords.map((r) => r.date))].sort().map((date) => (
                        <th key={date} className="px-3 py-3 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{new Date(date).toLocaleDateString()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: { id: string; name: string }) => (
                      <tr key={s.id} className="border-b border-outline-variant/10 last:border-none">
                        <td className="px-4 py-3 font-label-md text-label-md text-on-surface whitespace-nowrap">{s.name}</td>
                        {[...new Set(attendanceRecords.map((r) => r.date))].sort().map((date) => {
                          const record = attendanceRecords.find((r) => r.studentId === s.id && r.date === date)
                          const statusColors: Record<string, string> = {
                            PRESENT: "bg-green-100 text-green-700",
                            ABSENT: "bg-red-100 text-red-700",
                            LATE: "bg-yellow-100 text-yellow-700",
                            EXCUSED: "bg-gray-100 text-gray-700",
                          }
                          return (
                            <td key={date} className="px-3 py-3">
                              {record ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ${statusColors[record.status] ?? ""}`}>{record.status}</span>
                              ) : (
                                <span className="text-on-surface-variant/30">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case "requests":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Enrollment Requests</h3>
            </div>

            {requestsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-[24px] bg-white p-md border border-outline-variant/10 animate-pulse">
                    <div className="h-5 w-48 bg-surface-container-high rounded-full mb-2" />
                    <div className="h-4 w-32 bg-surface-container-high rounded-full" />
                  </div>
                ))}
              </div>
            ) : (requestsQuery.data ?? []).length === 0 ? (
              <EmptyState icon="person_add" title="No pending requests" description="Students can request to join this class from their portal." />
            ) : (
              <div className="space-y-2">
                {(requestsQuery.data ?? []).map((req) => (
                  <div key={req.id} className="rounded-[24px] bg-white p-md border border-outline-variant/10 flex items-center justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">{req.student.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{req.student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => rejectMutation.mutate(req.id)}
                        disabled={rejectMutation.isPending}
                        className="h-auto px-md py-sm border-2 border-error text-error font-label-sm text-label-sm rounded-full hover:bg-error/10 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                        className="h-auto px-md py-sm rounded-full bg-secondary-container text-white font-label-sm text-label-sm hover:opacity-90 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center w-full">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Class not found</h2>
          <p className="font-body-md text-on-surface-variant mb-lg">{error instanceof Error ? error.message : "Failed to load class"}</p>
          <Link to="/classes" className="bg-secondary-container text-white px-lg py-sm rounded-full font-label-md nudge-hover inline-block">Back to Classes</Link>
        </div>
      </div>
    )
  }

  if (isLoading || !cls) {
    return <LoadingState label="Loading class..." />
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob absolute -top-20 -left-20 w-96 h-96 bg-primary-fixed rounded-full animate-pulse" />
        <div className="blob absolute top-1/3 -right-20 w-80 h-80 bg-secondary-fixed rounded-full" style={{ animation: "bounce 10s infinite" }} />
      </div>

      <div className="flex-1 overflow-y-auto p-xl max-w-7xl mx-auto w-full">
        <Link to="/classes" className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Classes
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-md mb-xl">
          <div className="flex items-center gap-md">
            <div className="w-16 h-16 bg-primary-container rounded-3xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div>
              <h2 className="font-headline-xl text-headline-xl text-primary mb-xs">{cls.name}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                {cls.description ?? "No description"} &bull; {students.length} Student{students.length !== 1 ? "s" : ""} &bull; {assignmentsData.length} Assignment{assignmentsData.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-auto px-md py-sm border-2 border-error text-error font-label-md text-label-md rounded-full hover:bg-error/10 transition-colors"
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="flex gap-1 mb-xl border-b border-outline-variant/20">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-xs px-md py-3 font-label-md text-label-md border-b-2 transition-colors ${activeTab === tab.id ? "border-primary-container text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {tabContent(activeTab)}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${cls.name}?`}
        message="This will permanently delete this class and all associated assignments, submissions, and rubrics."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteClass.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="fixed bottom-md right-md z-50">
        <Link to="/assistant" className="flex items-center gap-sm bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-full shadow-2xl hover:scale-105 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className="font-label-md text-label-md">Ask EduAI Assistant</span>
        </Link>
      </div>
    </>
  )
}
