import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
 return (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
   <span className="material-symbols-outlined text-[15px]">{icon}</span>
   <span className="font-label-sm text-label-sm font-semibold text-on-surface tabular-nums">{value}</span>
   <span className="font-label-sm text-label-sm">{label}</span>
  </span>
 )
}

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
    <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Grades & Levels</h1>
    <EmptyState
     icon="account_tree"
     title="No grades assigned"
     description="Grades you teach will appear here once you're assigned to courses."
    />
   </div>
  )
 }

 return (
  <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
   <div className="flex items-center justify-between mb-lg">
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary">Grades & Levels</h1>
     <p className="font-body-md text-body-md text-on-surface-variant mt-1">
      {list.length} grade{list.length !== 1 ? "s" : ""} · each grade has sections that share the same courses
     </p>
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
    {list.map((grade) => (
     <Link
      key={grade.id}
      to={`/grades/${grade.id}`}
      className="block rounded-lg bg-surface-container-lowest p-md hover:border-primary transition-colors group"
     >
      <div className="flex items-center gap-3 mb-4">
       <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-primary-container text-[22px]">school</span>
       </div>
       <div className="min-w-0">
        <h2 className="font-headline-md text-headline-md text-primary truncate group-hover:text-primary transition-colors">
         Grade {grade.level}
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{grade.name || "—"}</p>
       </div>
      </div>
      <div className="flex flex-wrap gap-sm mb-3">
       <StatChip icon="groups" value={grade.sections} label={grade.sections === 1 ? "section" : "sections"} />
       <StatChip icon="menu_book" value={grade.courses} label={grade.courses === 1 ? "course" : "courses"} />
       <StatChip icon="person" value={grade.students} label={grade.students === 1 ? "student" : "students"} />
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
       <span className="font-label-sm text-label-sm text-on-surface-variant">View sections & courses</span>
       <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
        arrow_forward
       </span>
      </div>
     </Link>
    ))}
   </div>
  </div>
 )
}
