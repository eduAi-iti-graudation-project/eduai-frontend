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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SortKey = "level-asc" | "level-desc" | "name" | "sections" | "courses" | "students"

function StatCard({ icon, iconClass, label, value }: { icon: string; iconClass: string; label: string; value: number }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex items-center gap-md shadow-sm">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="font-headline-md text-headline-md text-on-surface tabular-nums leading-none">{value}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">{label}</p>
      </div>
    </div>
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
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4 border-b border-border pb-3">Grades & Levels</h1>
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
      <div className="mb-lg border-b border-border pb-3">
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Grades & Levels</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {(grades ?? []).length} grade{(grades ?? []).length !== 1 ? "s" : ""} · each grade has sections that share the same courses
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg border-b border-border pb-4">
        <StatCard icon="account_tree" iconClass="bg-primary-container text-primary" label="Grade levels" value={(grades ?? []).length} />
        <StatCard icon="groups" iconClass="bg-secondary-container text-on-secondary-container" label="Sections" value={totals.sections} />
        <StatCard icon="menu_book" iconClass="bg-tertiary-container text-on-tertiary-container" label="Courses" value={totals.courses} />
        <StatCard icon="person" iconClass="bg-[#ECFDF5] text-[#047857]" label="Students" value={totals.students} />
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
        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                <TableHead className="pl-5">Grade</TableHead>
                <TableHead className="text-right">Sections</TableHead>
                <TableHead className="text-right">Courses</TableHead>
                <TableHead className="pr-5 text-right">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((grade) => {
                const isEmpty = grade.sections === 0 && grade.courses === 0 && grade.students === 0
                return (
                  <TableRow key={grade.id} className={isEmpty ? "opacity-70" : ""}>
                    <TableCell className="pl-5 py-3">
                      <Link
                        to={`/grades/${grade.id}`}
                        className="group flex items-center gap-3 cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${isEmpty ? "bg-surface-container text-on-surface-variant" : "bg-primary-container"}`}>
                          <span className={`material-symbols-outlined text-[20px] ${isEmpty ? "" : "text-on-primary-container"}`}>school</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-body-lg text-body-lg text-on-surface truncate group-hover:text-primary transition-colors">
                            Grade {grade.level}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {grade.name || (isEmpty ? "Empty grade" : "—")}
                          </p>
                        </div>
                        <span className="ml-auto material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                          chevron_right
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-body-md text-body-md text-on-surface tabular-nums">{grade.sections}</TableCell>
                    <TableCell className="text-right font-body-md text-body-md text-on-surface tabular-nums">{grade.courses}</TableCell>
                    <TableCell className="pr-5 text-right font-body-md text-body-md text-on-surface tabular-nums">{grade.students}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}