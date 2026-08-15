import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortKey = "level-asc" | "level-desc" | "name" | "sections" | "courses" | "students"

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

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
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

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("level-asc")
  const [hideEmpty, setHideEmpty] = useState(false)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = (grades ?? []).filter((g) => {
      if (q && !`grade ${g.level} ${g.name}`.toLowerCase().includes(q)) return false
      if (hideEmpty && g.sections === 0 && g.courses === 0 && g.students === 0) return false
      return true
    })
    const sorters: Record<SortKey, (a: api.TeacherGradeWithCounts, b: api.TeacherGradeWithCounts) => number> = {
      "level-asc": (a, b) => a.level - b.level,
      "level-desc": (a, b) => b.level - a.level,
      name: (a, b) => a.name.localeCompare(b.name),
      sections: (a, b) => b.sections - a.sections,
      courses: (a, b) => b.courses - a.courses,
      students: (a, b) => b.students - a.students,
    }
    return [...rows].sort(sorters[sort])
  }, [grades, query, sort, hideEmpty])

  const totals = useMemo(() => {
    const rows = grades ?? []
    return {
      sections: rows.reduce((sum, g) => sum + g.sections, 0),
      courses: rows.reduce((sum, g) => sum + g.courses, 0),
      students: rows.reduce((sum, g) => sum + g.students, 0),
    }
  }, [grades])

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
    return <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
  }

  if (list.length === 0 && (grades ?? []).length === 0) {
    return (
      <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">Grades & Levels</h1>
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
      <div className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Grades & Levels</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {(grades ?? []).length} grade{(grades ?? []).length !== 1 ? "s" : ""} · each grade has sections that share the same courses
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        <StatCard icon="account_tree" iconClass="text-primary" label="Grade levels" value={(grades ?? []).length} />
        <StatCard icon="groups" iconClass="text-secondary" label="Sections" value={totals.sections} />
        <StatCard icon="menu_book" iconClass="text-tertiary" label="Courses" value={totals.courses} />
        <StatCard icon="person" iconClass="text-[#059669]" label="Students" value={totals.students} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-sm mb-md">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grades…"
            className="pl-10 h-10"
            aria-label="Search grades"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-auto min-w-[170px] h-10">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="level-asc">Level ↑</SelectItem>
            <SelectItem value="level-desc">Level ↓</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="sections">Most sections</SelectItem>
            <SelectItem value="courses">Most courses</SelectItem>
            <SelectItem value="students">Most students</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Switch id="hide-empty" checked={hideEmpty} onCheckedChange={setHideEmpty} />
          <Label htmlFor="hide-empty" className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer">
            Hide empty grades
          </Label>
        </div>
      </div>

      {/* Result line */}
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
        {list.length} of {(grades ?? []).length} grade{(grades ?? []).length !== 1 ? "s" : ""}
        {query || hideEmpty ? " match the current filters" : ""}
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon="filter_alt"
          title="No matching grades"
          description="Try clearing the search or turning off the empty-grade filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {list.map((grade) => {
            const isEmpty = grade.sections === 0 && grade.courses === 0 && grade.students === 0
            return (
              <Link
                key={grade.id}
                to={`/grades/${grade.id}`}
                className={`block rounded-lg bg-surface-container-lowest p-md border transition-colors group ${
                  isEmpty
                    ? "border-outline-variant/60 opacity-70 hover:opacity-100 hover:border-primary/50"
                    : "border-outline-variant hover:border-primary"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${isEmpty ? "bg-surface-container text-on-surface-variant" : "bg-primary-container"}`}>
                    <span className={`material-symbols-outlined text-[22px] ${isEmpty ? "" : "text-on-primary-container"}`}>school</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline-md text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">
                      Grade {grade.level}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {grade.name || (isEmpty ? "Empty grade" : "—")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-sm mb-3">
                  <StatChip icon="groups" value={grade.sections} label={grade.sections === 1 ? "section" : "sections"} />
                  <StatChip icon="menu_book" value={grade.courses} label={grade.courses === 1 ? "course" : "courses"} />
                  <StatChip icon="person" value={grade.students} label={grade.students === 1 ? "student" : "students"} />
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant pt-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {isEmpty ? "No sections or courses yet" : "View sections & courses"}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}