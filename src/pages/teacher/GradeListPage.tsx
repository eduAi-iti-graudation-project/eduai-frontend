import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

export function GradeListPage() {
  const { user } = useAuth()

  const { data: grades, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })

  if (isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error instanceof Error ? error.message : "Failed to load grades"}
        onRetry={() => refetch()}
        className="flex-1"
      />
    )
  }

  if (isLoading) {
    return (
      <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
    )
  }

  const list = grades ?? []

  if (list.length === 0) {
    return (
      <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Grades</h1>
        <EmptyState
          icon="school"
          title="No grades assigned"
          description="Ask your admin to assign you to the grades you teach."
        />
      </div>
    )
  }

  const blobColors = ["bg-primary-fixed/10", "bg-secondary-fixed/20", "bg-primary-fixed-dim/20"]

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary">My Grades</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">{list.length} grade{list.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
        {list.map((grade, index) => (
          <Link
            key={grade.id}
            to={`/grades/${grade.id}`}
            className="block rounded-[32px] bg-white p-xl shadow-sm border border-outline-variant/10 hover:border-primary-container/30 hover:shadow-md transition-all hover:scale-[1.02] relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-8 -mt-8 ${blobColors[index % blobColors.length]} opacity-50`} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-1">Grade {grade.level}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{grade.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
