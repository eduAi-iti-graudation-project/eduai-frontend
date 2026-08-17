import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

function getInitials(name: string): string {
 return name
  .split(" ")
  .map((w) => w[0])
  .join("")
  .toUpperCase()
  .slice(0, 2)
}

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
 return (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
   <span className="material-symbols-outlined text-[15px]">{icon}</span>
   <span className="font-label-sm text-label-sm font-semibold text-on-surface tabular-nums">{value}</span>
   <span className="font-label-sm text-label-sm">{label}</span>
  </span>
 )
}

function CourseChip({ id, name }: { id: string; name: string }) {
 return (
  <Link
   to={`/courses/${id}`}
   className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm hover:bg-secondary hover:text-on-secondary transition-colors"
   title={`Manage ${name} materials`}
  >
   <span className="material-symbols-outlined text-[14px]">menu_book</span>
   {name}
  </Link>
 )
}

export function GradeDetailPage() {
 const { gradeId } = useParams<{ gradeId: string }>()
 const { user } = useAuth()

 const { data: grade, isLoading, isError, error, refetch } = useQuery({
  queryKey: ["teacher-grade-detail", user?.id, gradeId],
  queryFn: () => api.getTeacherGrade(user!.id, gradeId!),
  enabled: !!user?.id && !!gradeId,
 })

 if (isError) {
  return (
   <ErrorState
    title="Something went wrong"
    message={error instanceof Error ? error.message : "Failed to load grade"}
    onRetry={() => refetch()}
    className="flex-1"
   />
  )
 }

 if (isLoading || !grade) {
  return (
   <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
  )
 }

 return (
  <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
   <div className="flex items-center gap-3 mb-6">
    <Link to="/grades" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
     <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
    </Link>
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary">Grade {grade.level}</h1>
     <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
      {grade.name || "—"} · sections in this grade mostly share the same courses
     </p>
    </div>
   </div>

   <div className="flex flex-wrap gap-sm mb-xl">
    <StatChip icon="groups" value={grade.sections.length} label={grade.sections.length === 1 ? "section" : "sections"} />
    <StatChip icon="menu_book" value={grade.courses.length} label={grade.courses.length === 1 ? "course" : "courses"} />
    <StatChip icon="person" value={grade.students} label={grade.students === 1 ? "student" : "students"} />
   </div>

   {grade.sections.length === 0 && grade.courses.length === 0 ? (
    <EmptyState
     icon="class"
     title="This grade is empty"
     description="No sections or courses are assigned to this grade yet."
    />
   ) : (
    <div className="space-y-xl">
     {/* Sections */}
     <section>
      <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Sections</h2>
      {grade.sections.length === 0 ? (
       <EmptyState
        icon="groups"
        title="No sections yet"
        description="Sections are the class groups inside this grade."
       />
      ) : (
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
        {grade.sections.map((section) => (
         <Link
          key={section.id}
          to={`/classes/${section.id}`}
          className="block rounded-lg bg-surface-container-lowest p-md hover:border-primary transition-colors group"
         >
          <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-[20px]">groups</span>
           </div>
           <div className="min-w-0">
            <h3 className="font-headline-md text-headline-md text-primary truncate group-hover:text-primary transition-colors">{section.name}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
             {section.enrollments} student{section.enrollments !== 1 ? "s" : ""}
            </p>
           </div>
          </div>
          {section.courses.length > 0 ? (
           <div className="flex flex-wrap gap-1.5 border-t border-outline-variant pt-3">
            {section.courses.map((course) => (
             <CourseChip key={course.id} id={course.id} name={course.name} />
            ))}
           </div>
          ) : (
           <div className="border-t border-outline-variant pt-3 font-label-sm text-label-sm text-on-surface-variant">
            No courses assigned
           </div>
          )}
         </Link>
        ))}
       </div>
      )}
     </section>

     {/* Courses */}
     <section>
      <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Courses</h2>
      {grade.courses.length === 0 ? (
       <EmptyState
        icon="menu_book"
        title="No courses yet"
        description="Courses are shared across sections — most sections teach the same ones."
       />
      ) : (
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
        {grade.courses.map((course) => {
         const sections = grade.sections.filter((s) => s.courses.some((c) => c.id === course.id))
         return (
          <Link
           key={course.id}
           to={`/courses/${course.id}?gradeId=${gradeId}`}
           className="block rounded-lg bg-surface-container-lowest p-md hover:border-primary transition-colors group"
          >
           <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
            </div>
            <div className="min-w-0">
             <h3 className="font-headline-md text-headline-md text-primary truncate group-hover:text-primary transition-colors">{course.name}</h3>
             <p className="font-body-sm text-body-sm text-on-surface-variant">
              {course.description || getInitials(course.name)}
             </p>
            </div>
           </div>
           <div className="border-t border-outline-variant pt-3 flex items-center justify-between gap-sm">
            {sections.length === 0 ? (
             <span className="font-label-sm text-label-sm text-on-surface-variant">Not offered in any section yet</span>
            ) : (
             <span className="font-label-sm text-label-sm text-on-surface-variant">
              Offered in:{" "}
              <span className="text-on-surface font-medium">{sections.map((s) => s.name).join(", ")}</span>
             </span>
            )}
            <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary shrink-0">
             Manage
             <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
           </div>
          </Link>
         )
        })}
       </div>
      )}
     </section>
    </div>
   )}
  </div>
 )
}