import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useClasses } from "@/hooks/use-classes"
import { useAuth } from "@/providers/use-auth"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { colorForTag } from "@/components/timetable/timetable-utils"
import * as api from "@/lib/api"

type SortKey = "name-az" | "name-za" | "students-desc" | "students-asc" | "courses-desc"

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

export function ClassesPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState("")
  const [courseFilter, setCourseFilter] = useState("")
  const [sort, setSort] = useState<SortKey>("name-az")

  const { isLoading, isError, error, classCards, sectionCourseColors } = useClasses()

  const gradesQ = useQuery({
    queryKey: ["teacher-grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })

  const gradeOptions = useMemo(() => {
    const gradeIds = new Set(classCards.map((c) => c.gradeLevelId))
    const byLevel = new Map<number, { id: string; label: string }>()
    for (const g of gradesQ.data ?? []) {
      if (!gradeIds.has(g.id)) continue
      const label = `Grade ${g.level}${g.name ? ` — ${g.name}` : ""}`
      byLevel.set(g.level, { id: g.id, label })
    }
    return [...byLevel.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
  }, [classCards, gradesQ.data])

  const gradeLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of gradesQ.data ?? []) map.set(g.id, `Grade ${g.level}`)
    return map
  }, [gradesQ.data])

  const courseOptions = useMemo(() => {
    const set = new Set<string>()
    for (const c of classCards) for (const course of c.courses) set.add(course)
    return [...set].sort()
  }, [classCards])

  const stats = useMemo(() => {
    const students = classCards.reduce((sum, c) => sum + c.students, 0)
    const courses = new Set<string>()
    const grades = new Set<string>()
    for (const c of classCards) {
      for (const course of c.courses) courses.add(course)
      grades.add(c.gradeLevelId)
    }
    return { sections: classCards.length, students, courses: courses.size, grades: grades.size }
  }, [classCards])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    const rows = classCards.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || c.section.toLowerCase().includes(q) || c.courses.some((course) => course.toLowerCase().includes(q))) &&
        (!gradeFilter || c.gradeLevelId === gradeFilter) &&
        (!courseFilter || c.courses.includes(courseFilter)),
    )
    const sorters: Record<SortKey, (a: typeof rows[number], b: typeof rows[number]) => number> = {
      "name-az": (a, b) => a.name.localeCompare(b.name),
      "name-za": (a, b) => b.name.localeCompare(a.name),
      "students-desc": (a, b) => b.students - a.students,
      "students-asc": (a, b) => a.students - b.students,
      "courses-desc": (a, b) => b.courses.length - a.courses.length,
    }
    return [...rows].sort(sorters[sort])
  }, [classCards, q, gradeFilter, courseFilter, sort])

  const activeFilterCount = [q, gradeFilter, courseFilter].filter(Boolean).length
  const clearFilters = () => {
    setQuery("")
    setGradeFilter("")
    setCourseFilter("")
  }

  if (isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error instanceof Error ? error.message : "Failed to load sections"}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (isLoading) {
    return <LoadingState label="Loading sections..." />
  }

  return (
    <div className="min-h-full bg-surface-container-low">
      <div className="mx-auto flex max-w-6xl flex-col gap-md p-gutter pb-24 md:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Your Sections</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Sections you're currently teaching.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="school" iconClass="text-primary" label="Sections" value={stats.sections} />
          <StatCard icon="groups" iconClass="text-secondary" label="Students" value={stats.students} />
          <StatCard icon="menu_book" iconClass="text-tertiary" label="Courses taught" value={stats.courses} />
          <StatCard icon="account_tree" iconClass="text-[#059669]" label="Grade levels" value={stats.grades} />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-sm">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              placeholder="Search sections…"
              aria-label="Search sections"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Grade</label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger aria-label="Grade" className="w-auto min-w-[150px]">
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All grades</SelectItem>
                {gradeOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Course</label>
            <Select value={courseFilter} onValueChange={setCourseFilter} disabled={courseOptions.length === 0}>
              <SelectTrigger aria-label="Course" className="w-auto min-w-[150px]">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All courses</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Sort</label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger aria-label="Sort" className="w-auto min-w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-az">Name A–Z</SelectItem>
                <SelectItem value="name-za">Name Z–A</SelectItem>
                <SelectItem value="students-desc">Most students</SelectItem>
                <SelectItem value="students-asc">Fewest students</SelectItem>
                <SelectItem value="courses-desc">Most courses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto">
            {filtered.length} of {classCards.length} section{classCards.length !== 1 ? "s" : ""}
          </span>

          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearFilters} className="h-10 px-md font-label-md">
              Clear filters ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Cards */}
        {classCards.length === 0 ? (
          <EmptyState
            icon="school"
            title="No sections yet"
            description="The sections assigned to your courses will appear here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="filter_alt"
            title="No matching sections"
            description="Try clearing the filters or searching for something else."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {filtered.map((c) => {
              const gradeLabel = gradeLabelMap.get(c.gradeLevelId)
              const courseChips = sectionCourseColors.get(c.id)
              return (
                <div
                  key={c.id}
                  className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm hover:shadow-md hover:border-primary/60 transition-all relative group"
                >
                  <div className="p-md border-b border-outline-variant">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">{c.name}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 truncate">
                          {c.section}
                        </p>
                      </div>
                      {gradeLabel && (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm border border-outline-variant">
                          {gradeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-md">
                    <div className="flex flex-wrap gap-1.5 min-h-[26px] mb-sm">
                      {(courseChips && courseChips.length > 0 ? courseChips.map((course) => ({ name: course.name, colorTag: course.colorTag })) : c.courses.map((course) => ({ name: course, colorTag: null }))).map((course) => {
                        const color = colorForTag(course.colorTag)
                        return (
                          <span
                            key={course.name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm"
                            style={{ backgroundColor: color.tint, color: color.solid }}
                          >
                            {course.name}
                          </span>
                        )
                      })}
                      {(courseChips?.length ?? 0) === 0 && c.courses.length === 0 && (
                        <span className="font-label-sm text-label-sm text-on-surface-variant">No courses assigned</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mb-sm">
                      <span className="font-meta text-meta text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        {c.students} Student{c.students !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link
                      to={`/classes/${c.id}`}
                      className="mt-md w-full flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-outline-variant bg-surface-container-highest/40 text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors font-body-md text-body-md"
                    >
                      View Section
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}