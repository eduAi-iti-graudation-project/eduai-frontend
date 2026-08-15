import { useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { useClassDetail } from "@/hooks/use-classes"
import { useClassAttendance } from "@/hooks/use-attendance"
import { useCreateChatThread } from "@/hooks/use-chat-threads"
import { BackLink } from "@/components/shared/BackLink"
import { useAuth } from "@/providers/use-auth"
import { ClassMaterialsTab } from "./ClassMaterialsTab"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"

type TabId = "students" | "assignments" | "materials" | "attendance"

const TABS: { id: TabId; label: string }[] = [
  { id: "students", label: "Students" },
  { id: "assignments", label: "Assignments" },
  { id: "materials", label: "Materials" },
  { id: "attendance", label: "Attendance" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const ATTENDANCE_STYLES: Record<string, string> = {
  PRESENT: "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]",
  ABSENT: "bg-error-container text-on-error-container border border-error-container",
  LATE: "bg-surface-container-high text-on-surface border border-surface-container-high",
  EXCUSED: "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]",
}

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>("students")
  const [studentQuery, setStudentQuery] = useState("")

  const { user } = useAuth()
  const { detail, assignments, isLoading, isError, error, removeEnrollment } = useClassDetail(id ?? "")
  const attendanceQuery = useClassAttendance(id ?? "")
  const createThread = useCreateChatThread()

  const cls = detail.data
  const assignmentsData = assignments.data ?? []
  const attendanceRecords = attendanceQuery.data ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = cls ? (cls as any).enrollments?.map((e: any) => ({ ...e.student, enrollmentId: e.id })) ?? [] : []

  const sectionCourses = useMemo<import("./ClassMaterialsTab").SectionCourse[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offerings: any[] = (cls as any)?.offerings ?? []
    const seen = new Map<
      string,
      import("./ClassMaterialsTab").SectionCourse
    >()
    for (const o of offerings) {
      const course = o?.course
      if (!course?.id) continue
      const taughtByMe = o.teacher?.id === user?.id
      const prev = seen.get(course.id)
      if (!prev) {
        seen.set(course.id, {
          offeringId: o.id,
          courseId: course.id,
          courseName: course.name ?? "Untitled course",
          taughtByMe,
        })
      } else if (taughtByMe) {
        seen.set(course.id, { ...prev, offeringId: o.id, taughtByMe: true })
      }
    }
    return Array.from(seen.values())
  }, [cls, user?.id])

  const q = studentQuery.trim().toLowerCase()
  const filteredStudents = students.filter(
    (s: { name: string; email: string }) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
  )

  const dates = [...new Set(attendanceRecords.map((r) => r.date))].sort()

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return
    await removeEnrollment.mutateAsync(studentId)
  }

  const resolveCourseOfferingId = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offerings: any[] = (cls as any)?.offerings ?? []
    return offerings.find((o) => o.teacher?.id === user?.id)?.id ?? offerings[0]?.id
  }

  const messageStudent = (studentId: string) => {
    const courseOfferingId = resolveCourseOfferingId()

    if (!courseOfferingId) {
      toast.error("This class has no course/teacher assigned yet.")
      return
    }

    createThread.mutate(
      { courseOfferingId, studentId },
      {
        onSuccess: (thread) => navigate(`/chat/${thread.id}`),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const tabContent = (tab: TabId) => {
    switch (tab) {
      case "students":
        return (
          <div className="space-y-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <h3 className="font-headline-sub text-headline-sub text-on-surface">Enrolled Students ({students.length})</h3>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">search</span>
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-outline-variant rounded-md text-sm font-body-md bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Search students..."
                  type="text"
                />
              </div>
            </div>

            {students.length === 0 ? (
              <EmptyState icon="group" title="No students enrolled" description="Students can request to join this class from their portal." />
            ) : filteredStudents.length === 0 ? (
              <EmptyState icon="search" title="No students match" description="Try a different search term" />
            ) : (
              <div className="border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="py-3 px-4 font-meta text-meta uppercase text-on-surface-variant tracking-wider">Student</th>
                      <th className="py-3 px-4 font-meta text-meta uppercase text-on-surface-variant tracking-wider hidden sm:table-cell">Email</th>
                      <th className="py-3 px-4 font-meta text-meta uppercase text-on-surface-variant tracking-wider">Status</th>
                      <th className="py-3 px-4 font-meta text-meta uppercase text-on-surface-variant tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredStudents.map((s: { id: string; name: string; email: string }) => (
                      <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-label-sm font-bold text-on-surface-variant shrink-0">
                              {getInitials(s.name)}
                            </div>
                            <Link to={`/students/${s.id}`} className="font-body-md text-sm font-medium text-on-surface hover:text-primary transition-colors">{s.name}</Link>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant hidden sm:table-cell">{s.email}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">Enrolled</span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-sm">
                            <button
                              type="button"
                              onClick={() => messageStudent(s.id)}
                              disabled={createThread.isPending}
                              className="bg-surface-container-lowest border border-outline-variant text-primary py-1 px-3 rounded-md text-sm font-medium hover:bg-surface-container transition-colors disabled:opacity-60"
                            >
                              Message
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(s.id)}
                              title="Remove student"
                              className="text-on-surface-variant hover:text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case "assignments":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sub text-headline-sub text-on-surface">Assignments</h3>
              <Button asChild className="flex items-center gap-2 px-4 py-2 h-auto rounded-md bg-primary text-on-primary font-body-medium text-sm hover:bg-primary/90 transition-colors">
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
                  <Link key={a.id} to={`/assignments/${a.id}`} className="block bg-surface-container-lowest rounded p-md border border-outline-variant flex items-center justify-between group hover:border-primary hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{a.title}</h4>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Due {new Date(a.dueDate).toLocaleDateString()} &bull; {a.totalPoints} pts</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={(e) => { e.preventDefault(); navigate(`/submissions?assignmentId=${a.id}`) }}
                      className="h-auto px-md py-2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
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
        return <ClassMaterialsTab classId={cls!.id} courses={sectionCourses} />

      case "attendance":
        return (
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sub text-headline-sub text-on-surface">Attendance</h3>
              <Button asChild className="flex items-center gap-2 px-4 py-2 h-auto rounded-md bg-primary text-on-primary font-body-medium text-sm hover:bg-primary/90 transition-colors">
                <Link to={`/attendance/import?classId=${id}`}>
                  <span className="material-symbols-outlined text-[18px]">upload</span>Import
                </Link>
              </Button>
            </div>

            {attendanceRecords.length === 0 ? (
              <EmptyState icon="calendar_month" title="No attendance records" description="Import attendance to see the grid here" />
            ) : (
              <div className="overflow-x-auto bg-surface-container-lowest rounded-lg border border-outline-variant">
                <table className="w-full text-sm font-body-md">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="text-left px-4 py-3 font-meta text-meta text-on-surface-variant">Student</th>
                      {dates.map((date) => (
                        <th key={date} className="px-3 py-3 font-meta text-meta text-on-surface-variant whitespace-nowrap">{new Date(date).toLocaleDateString()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: { id: string; name: string }) => (
                      <tr key={s.id} className="border-b border-outline-variant last:border-none">
                        <td className="px-4 py-3 font-body-medium text-sm text-on-surface whitespace-nowrap">{s.name}</td>
                        {dates.map((date) => {
                          const record = attendanceRecords.find((r) => r.studentId === s.id && r.date === date)
                          return (
                            <td key={date} className="px-3 py-3">
                              {record ? (
                                <span className={`inline-flex px-2 py-0.5 rounded font-label-sm text-label-sm ${ATTENDANCE_STYLES[record.status] ?? ""}`}>{record.status}</span>
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
    }
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center w-full">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Class not found</h2>
          <p className="font-body-md text-on-surface-variant mb-lg">{error instanceof Error ? error.message : "Failed to load class"}</p>
          <Link to="/classes" className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md inline-block">Back to Classes</Link>
        </div>
      </div>
    )
  }

  if (isLoading || !cls) {
    return <LoadingState label="Loading section..." />
  }

  const assistantOfferingId = resolveCourseOfferingId()

  return (
    <div className="min-h-full bg-surface-container-low">
      <div className="mx-auto w-full max-w-6xl p-gutter pb-24 md:pb-0">
        <BackLink to="/classes" label="Back to Sections" className="mb-4" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">{cls.name}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {cls.description ?? "No description"} &bull; {students.length} Student{students.length !== 1 ? "s" : ""} &bull; {assignmentsData.length} Assignment{assignmentsData.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="flex items-center gap-2 px-4 py-2 h-auto rounded-md bg-primary text-on-primary font-body-medium text-sm hover:bg-primary/90 transition-colors shadow-sm">
              <Link to={assistantOfferingId ? `/assistant?offeringId=${assistantOfferingId}` : "/assistant"}>
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                AI Assistant
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-outline-variant px-6 flex overflow-x-auto shrink-0 hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 mr-6 font-body-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "text-primary border-b-2 border-primary font-medium" : "text-on-surface-variant hover:text-primary border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">{tabContent(activeTab)}</div>
        </div>
      </div>
    </div>
  )
}