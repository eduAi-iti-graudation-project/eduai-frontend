import { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { BackLink } from "@/components/shared/BackLink"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function StatCard({ icon, iconClass, label, value }: { icon: string; iconClass: string; label: string; value: number }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex items-center gap-md shadow-sm">
      <span className={`material-symbols-outlined ${iconClass}`} style={{ fontSize: 22 }}>{icon}</span>
      <div className="min-w-0">
        <p className="font-headline-md text-headline-md text-on-surface tabular-nums leading-none">{value}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}

type SectionSort = "name-az" | "name-za" | "students-desc" | "students-asc"
type CourseSort = "name-az" | "name-za" | "sections-desc"

function SectionCard({ section, gradeId }: { section: api.GradeSection; gradeId: string }) {
  return (
    <Link
      to={`/classes/${section.id}`}
      className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary-container text-[20px]">groups</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">{section.name}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            {section.enrollments} student{section.enrollments !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="ml-auto shrink-0 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm border border-outline-variant">
          Grade {gradeId}
        </span>
      </div>
      {section.description ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3 line-clamp-2">{section.description}</p>
      ) : null}
      {section.courses.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-outline-variant pt-3">
          {section.courses.map((course) => (
            <span
              key={course.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-fixed text-secondary font-label-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-[14px]">menu_book</span>
              {course.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="border-t border-outline-variant pt-3 font-label-sm text-label-sm text-on-surface-variant">
          No courses assigned
        </div>
      )}
      <div className="flex items-center justify-between border-t border-outline-variant pt-3 mt-3">
        <span className="font-label-sm text-label-sm text-on-surface-variant">View section</span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
          arrow_forward
        </span>
      </div>
    </Link>
  )
}

function CourseCard({ course, sections, gradeId }: { course: api.GradeCourse; sections: api.GradeSection[]; gradeId: string }) {
  return (
    <Link
      to={`/courses/${course.id}?gradeId=${gradeId}`}
      className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-secondary-fixed flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">{course.name}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {course.description || getInitials(course.name)}
          </p>
        </div>
      </div>
      <div className="border-t border-outline-variant pt-3">
        {sections.length === 0 ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">Not offered in any section yet</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Offered in:</span>
            {sections.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface font-label-sm text-label-sm"
              >
                <span className="material-symbols-outlined text-[14px]">groups</span>
                {s.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary shrink-0">
            Manage
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </div>
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

  const [sectionQuery, setSectionQuery] = useState("")
  const [sectionSort, setSectionSort] = useState<SectionSort>("name-az")
  const [courseQuery, setCourseQuery] = useState("")
  const [courseSort, setCourseSort] = useState<CourseSort>("name-az")

  const sections = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase()
    const rows = (grade?.sections ?? []).filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        s.courses.some((c) => c.name.toLowerCase().includes(q)),
    )
    const sorters: Record<SectionSort, (a: api.GradeSection, b: api.GradeSection) => number> = {
      "name-az": (a, b) => a.name.localeCompare(b.name),
      "name-za": (a, b) => b.name.localeCompare(a.name),
      "students-desc": (a, b) => b.enrollments - a.enrollments,
      "students-asc": (a, b) => a.enrollments - b.enrollments,
    }
    return [...rows].sort(sorters[sectionSort])
  }, [grade, sectionQuery, sectionSort])

  const courses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase()
    const rows = (grade?.courses ?? []).filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
    )
    const sectionCount = (course: api.GradeCourse) =>
      (grade?.sections ?? []).filter((s) => s.courses.some((c) => c.id === course.id)).length
    const sorters: Record<CourseSort, (a: api.GradeCourse, b: api.GradeCourse) => number> = {
      "name-az": (a, b) => a.name.localeCompare(b.name),
      "name-za": (a, b) => b.name.localeCompare(a.name),
      "sections-desc": (a, b) => sectionCount(b) - sectionCount(a),
    }
    return [...rows].sort(sorters[courseSort])
  }, [grade, courseQuery, courseSort])

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
    return <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
  }

  const gradeEmpty = grade.sections.length === 0 && grade.courses.length === 0

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <BackLink to="/grades" label="Back to Grades" className="mb-md" />

      <div className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Grade {grade.level}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          {grade.name || "—"} · sections in this grade mostly share the same courses
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        <StatCard icon="account_tree" iconClass="text-primary" label="Grade level" value={grade.level} />
        <StatCard icon="groups" iconClass="text-secondary" label="Sections" value={grade.sections.length} />
        <StatCard icon="menu_book" iconClass="text-tertiary" label="Courses" value={grade.courses.length} />
        <StatCard icon="person" iconClass="text-[#059669]" label="Students" value={grade.students} />
      </div>

      {gradeEmpty ? (
        <EmptyState
          icon="class"
          title="This grade is empty"
          description="No sections or courses are assigned to this grade yet."
        />
      ) : (
        <Tabs defaultValue="sections">
          <div className="flex flex-wrap items-center gap-sm mb-md">
            <TabsList>
              <TabsTrigger value="sections">Sections ({grade.sections.length})</TabsTrigger>
              <TabsTrigger value="courses">Courses ({grade.courses.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sections">
            {grade.sections.length === 0 ? (
              <EmptyState
                icon="groups"
                title="No sections yet"
                description="Sections are the class groups inside this grade."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-sm mb-md">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      search
                    </span>
                    <Input
                      value={sectionQuery}
                      onChange={(e) => setSectionQuery(e.target.value)}
                      placeholder="Search sections…"
                      className="pl-10 h-10"
                      aria-label="Search sections"
                    />
                  </div>
                  <Select value={sectionSort} onValueChange={(v) => setSectionSort(v as SectionSort)}>
                    <SelectTrigger className="w-auto min-w-[170px] h-10">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-az">Name A–Z</SelectItem>
                      <SelectItem value="name-za">Name Z–A</SelectItem>
                      <SelectItem value="students-desc">Most students</SelectItem>
                      <SelectItem value="students-asc">Fewest students</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto">
                    {sections.length} of {grade.sections.length} section{grade.sections.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {sections.length === 0 ? (
                  <EmptyState
                    icon="filter_alt"
                    title="No matching sections"
                    description="Try clearing the search or sorting differently."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
                    {sections.map((section) => (
                      <SectionCard key={section.id} section={section} gradeId={String(grade.level)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="courses">
            {grade.courses.length === 0 ? (
              <EmptyState
                icon="menu_book"
                title="No courses yet"
                description="Courses are shared across sections — most sections teach the same ones."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-sm mb-md">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      search
                    </span>
                    <Input
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      placeholder="Search courses…"
                      className="pl-10 h-10"
                      aria-label="Search courses"
                    />
                  </div>
                  <Select value={courseSort} onValueChange={(v) => setCourseSort(v as CourseSort)}>
                    <SelectTrigger className="w-auto min-w-[170px] h-10">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-az">Name A–Z</SelectItem>
                      <SelectItem value="name-za">Name Z–A</SelectItem>
                      <SelectItem value="sections-desc">Most sections</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto">
                    {courses.length} of {grade.courses.length} course{grade.courses.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {courses.length === 0 ? (
                  <EmptyState
                    icon="filter_alt"
                    title="No matching courses"
                    description="Try clearing the search or sorting differently."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
                    {courses.map((course) => {
                      const sections = grade.sections.filter((s) => s.courses.some((c) => c.id === course.id))
                      return <CourseCard key={course.id} course={course} sections={sections} gradeId={gradeId!} />
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}