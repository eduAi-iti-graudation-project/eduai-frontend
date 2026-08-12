import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"

export function AvailableClassesPage() {
  const { user } = useAuth()

  const enrolled = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  if (enrolled.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Classes</h1>
        <LoadingState />
      </div>
    )
  }

  const enrolledClasses = enrolled.data ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Classes</h1>

      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        You're automatically enrolled in all sections for your grade level.
      </p>

      {enrolledClasses.length === 0 ? (
        <EmptyState
          icon="school"
          title="Not enrolled in any sections"
          description="You'll be automatically enrolled as soon as sections are set up for your grade level."
        />
      ) : (
        <div className="space-y-3">
          {enrolledClasses.map((cls) => (
            <Link
              key={cls.id}
              to={`/student/classes/${cls.id}`}
              className="block rounded-lg bg-white p-md border border-border hover:border-primary-container/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-label-md text-label-md text-on-surface">{cls.name}</h3>
                  {cls.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{cls.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {cls.teacherName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">assignment</span>
                      {cls.assignments.length} {cls.assignments.length === 1 ? "assignment" : "assignments"}
                    </span>
                  </div>
                </div>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 shrink-0 self-center">
                  View Grades
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
