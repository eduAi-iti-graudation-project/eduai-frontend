import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      <span className="font-label-sm text-label-sm font-semibold text-on-surface tabular-nums">{value}</span>
      <span className="font-label-sm text-label-sm">{label}</span>
    </span>
  )
}

function SummaryTile({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-md border border-outline-variant">
      <div className="w-10 h-10 rounded-md bg-primary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-primary-container text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-headline-lg text-headline-lg text-on-surface leading-none tabular-nums">{value}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  )
}

export function AvailableClassesPage() {
  const { user } = useAuth()

  const enrolled = useQuery({
    queryKey: ["student", "courses", user?.id],
    queryFn: () => api.getStudentCourses(user!.id),
    enabled: !!user?.id,
  })

  if (enrolled.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4 border-b border-border pb-3">My Courses</h1>
        <LoadingState />
      </div>
    )
  }

  const enrolledClasses = enrolled.data ?? []

  const summary = enrolledClasses.reduce(
    (acc, cls) => ({
      assignments: acc.assignments + cls.assignments.length,
      materials: acc.materials + cls.materialCount,
      quizzes: acc.quizzes + cls.quizCount,
    }),
    { assignments: 0, materials: 0, quizzes: 0 },
  )

  return (
    <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-on-surface border-b border-border pb-3">My Courses</h1>

      <p className="font-body-md text-body-md text-on-surface-variant mt-1 mb-6">
        These are the courses available in your section.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-6">
        <SummaryTile icon="school" value={enrolledClasses.length} label="Courses" />
        <SummaryTile icon="assignment" value={summary.assignments} label="Assignments" />
        <SummaryTile icon="folder_open" value={summary.materials} label="Materials" />
        <SummaryTile icon="quiz" value={summary.quizzes} label="Quizzes" />
      </div>

      {enrolledClasses.length === 0 ? (
        <EmptyState
          icon="school"
          title="No courses available"
          description="Courses will show up here as soon as they're set up for your section."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {enrolledClasses.map((cls) => (
            <Link
              key={cls.id}
              to={`/student/classes/${cls.id}`}
              className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-md bg-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary-container text-[22px]">menu_book</span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">
                    {cls.name}
                  </h2>
                  {cls.description && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{cls.description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-sm mb-3">
                <StatChip icon="assignment" value={cls.assignments.length} label={cls.assignments.length === 1 ? "assignment" : "assignments"} />
                <StatChip icon="folder_open" value={cls.materialCount} label={cls.materialCount === 1 ? "material" : "materials"} />
                <StatChip icon="quiz" value={cls.quizCount} label={cls.quizCount === 1 ? "quiz" : "quizzes"} />
              </div>
              {cls.materialTitles.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {cls.materialTitles.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                    >
                      {t}
                    </span>
                  ))}
                  {cls.materialTitles.length > 2 && (
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      +{cls.materialTitles.length - 2} more
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-outline-variant pt-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{cls.teacherName}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 group-hover:text-primary transition-colors">
                  Open class
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}