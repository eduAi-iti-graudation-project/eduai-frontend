import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { getClasses, getAssignments, getStudentClasses } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SearchItem {
  id: string
  label: string
  subtitle: string
  href: string
}

interface GroupedResults {
  students: SearchItem[]
  classes: SearchItem[]
  assignments: SearchItem[]
}

const EMPTY: GroupedResults = { students: [], classes: [], assignments: [] }

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase()
  return fields.some((f) => (f ?? "").toLowerCase().includes(q))
}

export function GlobalSearchBox({ className }: { className?: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GroupedResults>(EMPTY)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const role = user?.role
  const isTeacher = role === "TEACHER" || role === "ADMIN"

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    let cancelled = false
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults(EMPTY)
        setOpen(false)
        return
      }

      setSearching(true)
      try {
        if (role === "STUDENT" && user) {
          const classes = await getStudentClasses(user.id)
          if (cancelled) return
          const classResults: SearchItem[] = []
          const assignmentResults: SearchItem[] = []
          for (const cls of classes) {
            if (matches(trimmed, cls.name, cls.description, cls.teacherName)) {
              classResults.push({
                id: cls.id,
                label: cls.name,
                subtitle: cls.teacherName,
                href: `/student/classes/${cls.id}`,
              })
            }
            for (const assignment of cls.assignments) {
              if (matches(trimmed, assignment.title, assignment.description)) {
                assignmentResults.push({
                  id: assignment.id,
                  label: assignment.title,
                  subtitle: cls.name,
                  href: `/student/classes/${cls.id}/assignments/${assignment.id}`,
                })
              }
            }
          }
          setResults({ students: [], classes: classResults.slice(0, 6), assignments: assignmentResults.slice(0, 6) })
        } else if (isTeacher) {
          const [classes, assignments] = await Promise.all([getClasses(), getAssignments()])
          if (cancelled) return
          const classResults: SearchItem[] = []
          const studentMap = new Map<string, { id: string; name: string; email: string }>()
          for (const cls of classes) {
            if (matches(trimmed, cls.name, cls.description)) {
              classResults.push({
                id: cls.id,
                label: cls.name,
                subtitle: cls.description ?? "Class",
                href: `/classes/${cls.id}`,
              })
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const enrollment of (cls as any).enrollments ?? []) {
              const student = enrollment.student
              if (!student || enrollment.status !== "APPROVED") continue
              if (!studentMap.has(student.id)) studentMap.set(student.id, student)
            }
          }
          const studentResults = [...studentMap.values()]
            .filter((s) => matches(trimmed, s.name, s.email))
            .slice(0, 6)
            .map((s) => ({ id: s.id, label: s.name, subtitle: s.email, href: `/students/${s.id}` }))
          const assignmentResults = assignments
            .filter((a) => matches(trimmed, a.title, a.description))
            .slice(0, 6)
            .map((a) => ({
              id: a.id,
              label: a.title,
              subtitle: a.courseOfferingId ? `Assignment · ${a.courseOfferingId.slice(0, 8)}` : "Assignment",
              href: `/assignments/${a.id}`,
            }))
          setResults({
            students: studentResults,
            classes: classResults.slice(0, 6),
            assignments: assignmentResults,
          })
        }
        setOpen(true)
      } catch {
        if (!cancelled) setResults(EMPTY)
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, role, user, isTeacher])

  const total = results.students.length + results.classes.length + results.assignments.length

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    navigate(href)
  }

  const renderGroup = (title: string, icon: string, items: SearchItem[]) => {
    if (items.length === 0) return null
    return (
      <div className="py-1">
        <p className="px-3 py-1.5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">{icon}</span>
          {title}
        </p>
        {items.map((item) => (
          <button
            key={`${title}-${item.id}`}
            type="button"
            onClick={() => go(item.href)}
            className="w-full text-left px-3 py-2 hover:bg-surface-container flex items-center gap-2.5"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">{icon}</span>
            <span className="min-w-0">
              <span className="block font-label-md text-label-md text-on-surface truncate">{item.label}</span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">{item.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: 20 }}>search</span>
      <input
        className={cn(
          "w-full pl-10 pr-10 py-2.5 bg-surface-container rounded-md border border-outline-variant text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all",
          open && "rounded-b-none",
        )}
        placeholder="Search students, classes, or assignments..."
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (total > 0) setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false)
          if (event.key === "Enter" && total === 1) {
            const all = [...results.students, ...results.classes, ...results.assignments]
            if (all[0]) go(all[0].href)
          }
        }}
      />
      {searching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
      {open && (
        <div className="absolute top-full inset-x-0 bg-surface-container-lowest border border-outline-variant rounded-b-md shadow-xl max-h-96 overflow-y-auto z-50">
          {total === 0 ? (
            <p className="px-3 py-4 font-body-sm text-body-sm text-on-surface-variant text-center">
              No matches for “{query.trim()}”
            </p>
          ) : (
            <>
              {renderGroup("Students", "person", results.students)}
              {renderGroup("Classes", "school", results.classes)}
              {renderGroup("Assignments", "assignment", results.assignments)}
            </>
          )}
        </div>
      )}
    </div>
  )
}