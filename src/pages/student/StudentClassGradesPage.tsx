import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

export function StudentClassGradesPage() {
  const { classId } = useParams<{ classId: string }>()
  const { user } = useAuth()

  const { data: studentClasses, isLoading: classesLoading } = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const cls = studentClasses?.find((c) => c.id === classId)

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
          <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
          <div className="h-8 w-48 bg-surface-container-high rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
              <div className="h-5 w-48 bg-surface-container-high rounded-full mb-2" />
              <div className="h-4 w-32 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!cls) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <EmptyState icon="school" title="Class not found" description="This class doesn't exist or you're not enrolled." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/student/grades"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">{cls.name}</h1>
      </div>

      <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm mb-6">
        <p className="font-label-sm text-label-sm text-on-surface-variant">Teacher</p>
        <p className="font-body-md text-body-md text-on-surface">{cls.teacherName}</p>
      </div>

      {cls.assignments.length === 0 ? (
        <EmptyState icon="assignment" title="No assignments yet" description="This class doesn't have any assignments." />
      ) : (
        <div className="space-y-3">
          {cls.assignments.map((assignment) => {
            const assignmentGrades = gradesByAssignment.get(assignment.id) ?? []
            const totalEarned = assignmentGrades.reduce((s, g) => s + g.pointsAwarded, 0)

            return (
              <Link
                key={assignment.id}
                to={`/student/classes/${classId}/assignments/${assignment.id}`}
                className="block rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all"
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
