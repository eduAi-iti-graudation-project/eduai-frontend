import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Tab = "overview" | "assignments" | "materials"

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
 return (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
   <span className="material-symbols-outlined text-[15px]">{icon}</span>
   <span className="font-label-sm text-label-sm font-semibold text-on-surface tabular-nums">{value}</span>
   <span className="font-label-sm text-label-sm">{label}</span>
  </span>
 )
}

function StatusChip({ status }: { status?: string }) {
 if (!status || status === "NOT_STARTED") {
  return (
   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
    <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
    Not started
   </span>
  )
 }
 if (status === "CONFIRMED") {
  return (
   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-fixed/30 text-primary font-label-sm text-label-sm">
    <span className="material-symbols-outlined text-[15px]">check_circle</span>
    Graded
   </span>
  )
 }
 return (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
   <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
   Submitted
  </span>
 )
}

export function StudentClassGradesPage() {
 const { classId } = useParams<{ classId: string }>()
 const { user } = useAuth()
 const [tab, setTab] = useState<Tab>("overview")

 const { data: studentClasses, isLoading: classesLoading } = useQuery({
  queryKey: ["student", "courses", user?.id],
  queryFn: () => api.getStudentCourses(user!.id),
  enabled: !!user?.id,
 })

 const cls = studentClasses?.find((c) => c.id === classId)

 const { data: mySubmissions, isLoading: subsLoading } = useQuery<api.MySubmission[]>({
  queryKey: ["my-submissions", user?.id],
  queryFn: () => api.getMySubmissions(),
  enabled: !!user?.id,
  staleTime: 30_000,
 })

 const submissionByAssignment = new Map((mySubmissions ?? []).map((s) => [s.assignmentId, s]))

 const { data: grades, isLoading: gradesLoading } = useQuery({
  queryKey: ["student-grades", user?.id],
  queryFn: () => api.getStudentGrades(user!.id),
  enabled: !!user?.id,
 })

 const isLoading = classesLoading || gradesLoading || subsLoading

 const confirmedGrades = (grades ?? []).filter((g) => g.isConfirmed && g.assignmentId)

 const gradesByAssignment = new Map<string, typeof confirmedGrades>()
 for (const g of confirmedGrades) {
  const list = gradesByAssignment.get(g.assignmentId) ?? []
  list.push(g)
  gradesByAssignment.set(g.assignmentId, list)
 }

 const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "space_dashboard" },
  { id: "assignments", label: "Assignments", icon: "assignment" },
  { id: "materials", label: "Materials", icon: "folder_open" },
 ]

 if (isLoading) {
  return (
   <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
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
   <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
    <EmptyState icon="school" title="Course not found" description="This course doesn't exist or you're not enrolled in it." />
   </div>
  )
 }

 return (
  <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
   <div className="flex items-center gap-3 mb-4">
    <Link
     to="/student/classes"
     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
    >
     <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
    </Link>
    <h1 className="font-headline-lg text-headline-lg text-primary">{cls.name}</h1>
    <Link
     to={`/student/homework-help?course=${classId}`}
     className="ml-auto inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-md py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shrink-0"
    >
     <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
     Ask AI
    </Link>
   </div>

   <div className="rounded-lg bg-surface-container-lowest p-md mb-6">
    <div className="flex items-center gap-3 mb-4">
     <div className="w-11 h-11 rounded-md bg-primary-container flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-on-primary-container text-[22px]">menu_book</span>
     </div>
     <div className="min-w-0">
      <h2 className="font-headline-md text-headline-md text-primary truncate">{cls.name}</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{cls.teacherName}</p>
     </div>
    </div>
    <div className="flex flex-wrap gap-sm">
     <StatChip icon="assignment" value={cls.assignments.length} label={cls.assignments.length === 1 ? "assignment" : "assignments"} />
     <StatChip icon="folder_open" value={cls.materialCount} label={cls.materialCount === 1 ? "material" : "materials"} />
     <StatChip icon="quiz" value={cls.quizCount} label={cls.quizCount === 1 ? "quiz" : "quizzes"} />
    </div>
   </div>

   <div className="flex items-center gap-1 border-b border-outline-variant mb-6">
    {tabs.map((t) => (
     <button
      key={t.id}
      type="button"
      onClick={() => setTab(t.id)}
      className={cn(
       "flex items-center gap-1.5 px-md py-2 font-label-md text-label-md rounded-t-full border-b-2 transition-colors",
       tab === t.id
        ? "border-primary text-primary font-semibold"
        : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60",
      )}
     >
      <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
      {t.label}
     </button>
    ))}
   </div>

   {tab === "overview" && (
    <div className="space-y-6">
{cls.description && (
       <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md ">
        <p className="font-body-md text-body-md text-on-surface-variant">{cls.description}</p>
       </div>
      )}

     <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md ">
      <div className="flex items-center justify-between mb-3">
       <h2 className="font-headline-md text-headline-md text-primary">Assignments</h2>
       <Button asChild variant="outline" className="rounded-lg shrink-0">
        <Link to={`/student/classes/${classId}`} onClick={() => setTab("assignments")}>
         View all
        </Link>
       </Button>
      </div>
      {cls.assignments.length === 0 ? (
       <p className="font-body-sm text-body-sm text-on-surface-variant">No assignments yet for this course.</p>
      ) : (
       <ul className="divide-y divide-border">
        {cls.assignments.slice(0, 3).map((a) => (
         <li key={a.id} className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
           <p className="font-label-md text-label-md text-on-surface truncate">{a.title}</p>
           <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Due {new Date(a.dueDate).toLocaleDateString()} · {a.totalPoints} pts
           </p>
          </div>
          <StatusChip status={submissionByAssignment.get(a.id)?.status} />
         </li>
        ))}
       </ul>
      )}
     </div>

     <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md ">
      <div className="flex items-center justify-between mb-3">
       <h2 className="font-headline-md text-headline-md text-primary">Materials</h2>
       <Button asChild variant="outline" className="rounded-lg shrink-0">
        <Link to={`/student/classes/${classId}`} onClick={() => setTab("materials")}>
         View all
        </Link>
       </Button>
      </div>
      {cls.materialCount === 0 ? (
       <p className="font-body-sm text-body-sm text-on-surface-variant">No materials yet for this course.</p>
      ) : (
       <div className="flex flex-wrap gap-2">
        {cls.materialTitles.slice(0, 6).map((t) => (
         <Link
          key={t}
          to={`/student/classes/${classId}`}
          onClick={() => setTab("materials")}
          className="font-label-sm text-label-sm px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-border hover:border-primary hover:text-primary transition-colors"
         >
          {t}
         </Link>
        ))}
        {cls.materialTitles.length > 6 && (
         <span className="font-label-sm text-label-sm text-on-surface-variant self-center">
          +{cls.materialTitles.length - 6} more
         </span>
        )}
       </div>
      )}
     </div>

     <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md ">
      <div className="flex items-center justify-between mb-2">
       <h2 className="font-headline-md text-headline-md text-primary">Quizzes</h2>
       <Link to="/student/quizzes" className="font-label-sm text-label-sm text-primary hover:underline">
        View all quizzes
       </Link>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
       {cls.quizCount === 0
        ? "No quizzes for this course yet."
        : `This course has ${cls.quizCount} quiz${cls.quizCount === 1 ? "" : "zes"}.`}
      </p>
     </div>
    </div>
   )}

   {tab === "assignments" && (
    <>
     {cls.assignments.length === 0 ? (
      <EmptyState icon="assignment" title="No assignments yet" description="This course doesn't have any assignments yet." />
     ) : (
      <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-sm">
       <Table>
        <TableHeader>
         <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
          <TableHead className="pl-5">Assignment</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Points</TableHead>
          <TableHead className="pr-5 text-right">Status</TableHead>
         </TableRow>
        </TableHeader>
        <TableBody>
         {cls.assignments.map((assignment) => {
          const sub = submissionByAssignment.get(assignment.id)
          const assignmentGrades = gradesByAssignment.get(assignment.id) ?? []
          const totalEarned = assignmentGrades.reduce((s, g) => s + g.pointsAwarded, 0)
          return (
           <TableRow key={assignment.id}>
            <TableCell className="pl-5 py-3">
             <Link to={`/student/classes/${classId}/assignments/${assignment.id}`} className="group flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-md bg-primary-container flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-[20px] text-on-primary-container">assignment</span>
              </div>
              <div className="min-w-0">
               <p className="font-body-lg text-body-lg text-on-surface truncate group-hover:text-primary transition-colors">
                {assignment.title}
               </p>
               <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                {assignment.description}
               </p>
              </div>
              <span className="ml-auto material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
               chevron_right
              </span>
             </Link>
            </TableCell>
            <TableCell>
             <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Due {new Date(assignment.dueDate).toLocaleDateString()}
             </span>
            </TableCell>
            <TableCell className="text-right font-body-md text-body-md text-on-surface tabular-nums">
             {assignment.totalPoints} pts
            </TableCell>
            <TableCell className="pr-5 text-right">
             {assignmentGrades.length > 0 ? (
              <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface tabular-nums">
               <span className="text-primary font-semibold">{totalEarned}</span>
               / {assignment.totalPoints} pts
              </span>
             ) : (
              <StatusChip status={sub?.status} />
             )}
            </TableCell>
           </TableRow>
          )
         })}
        </TableBody>
       </Table>
      </div>
     )}
    </>
   )}

   {tab === "materials" && (
    <>
     {cls.materialCount === 0 ? (
      <EmptyState icon="folder_open" title="No materials yet" description="This course doesn't have any materials yet." />
     ) : (
      <div className="flex flex-wrap gap-2">
       {cls.materialTitles.map((t) => (
        <Link
         key={t}
         to={`/student/classes/${classId}/materials`}
         className="font-label-md text-label-md px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
         {t}
        </Link>
       ))}
      </div>
     )}
    </>
   )}
  </div>
 )
}
