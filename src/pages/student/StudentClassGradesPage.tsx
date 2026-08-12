import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import { useCreateChatThread } from "@/hooks/use-chat-threads"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function StudentClassGradesPage() {
  const { classId } = useParams<{ classId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const createThread = useCreateChatThread()

  const { data: studentClasses, isLoading: classesLoading } = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const cls = studentClasses?.find((c) => c.id === classId)

  const { data: classDetail } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => api.getClass(classId!),
    enabled: !!classId,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseOfferingId = (classDetail as any)?.offerings?.[0]?.id as string | undefined

  const messageTeacher = () => {
    if (!courseOfferingId) {
      toast.error("This section has no course/teacher assigned yet.")
      return
    }
    createThread.mutate(
      { courseOfferingId },
      {
        onSuccess: (thread) => navigate(`/student/chat/${thread.id}`),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: () => api.getStudentGrades(user!.id),
    enabled: !!user?.id,
  })

  const isLoading = classesLoading || gradesLoading

  const confirmedGrades = (grades ?? []).filter((g) => g.isConfirmed && g.assignmentId)

  const gradesByAssignment = new Map<string, typeof confirmedGrades>()
  for (const g of confirmedGrades) {
    const list = gradesByAssignment.get(g.assignmentId) ?? []
    list.push(g)
    gradesByAssignment.set(g.assignmentId, list)
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high animate-pulse" />
          <div className="h-8 w-48 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
        <LoadingState />
      </div>
    )
  }

  if (!cls) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <EmptyState icon="school" title="Section not found" description="This section doesn't exist or you're not enrolled." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/student/grades"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">{cls.name}</h1>
      </div>

      <div className="rounded-lg bg-white p-md border border-border mb-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Teacher</p>
            <p className="font-body-md text-body-md text-on-surface">{cls.teacherName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-lg shrink-0"
            >
              <Link to={`/student/classes/${classId}/materials`}>
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                Materials
              </Link>
            </Button>
            <Button
              onClick={messageTeacher}
              disabled={createThread.isPending}
              className="rounded-lg shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              Message
            </Button>
          </div>
        </div>
      </div>

      {cls.assignments.length === 0 ? (
        <EmptyState icon="assignment" title="No assignments yet" description="This section doesn't have any assignments yet." />
      ) : (
        <div className="space-y-3">
          {cls.assignments.map((assignment) => {
            const assignmentGrades = gradesByAssignment.get(assignment.id) ?? []
            const totalEarned = assignmentGrades.reduce((s, g) => s + g.pointsAwarded, 0)

            return (
              <Link
                key={assignment.id}
                to={`/student/classes/${classId}/assignments/${assignment.id}`}
                className="block rounded-lg bg-white p-md border border-border hover:border-primary-container/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-headline-md text-headline-md text-primary">{assignment.title}</h2>
                    {assignment.description && (
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">{assignment.description}</p>
                    )}
                  </div>
                  {assignmentGrades.length > 0 ? (
                    <div className="text-right shrink-0">
                      <p className="font-headline-md text-headline-md text-primary">{totalEarned}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">/ {assignment.totalPoints} pts</p>
                    </div>
                  ) : (
                    <div className="shrink-0 self-center">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Not graded yet</span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
