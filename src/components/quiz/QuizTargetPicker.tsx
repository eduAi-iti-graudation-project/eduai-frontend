import { useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import { useTeacherOfferings } from "@/hooks/use-labs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import * as api from "@/lib/api"

export interface TargetOffering {
  courseOfferingId: string
  targetStudentIds: string[]
  gradeLevelId: string
  gradeLevelName: string
  courseId: string
  courseName: string
  sectionId: string
  sectionName: string
}

interface QuizTargetPickerProps {
  value: TargetOffering[]
  onChange: (value: TargetOffering[]) => void
  disabled?: boolean
}

interface StudentRow {
  id: string
  name: string
  email: string
}

function StudentMultiSelect({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (studentIds: string[]) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StudentRow[]>([])
  const [open, setOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const search = async (q: string) => {
    if (q.trim().length < 2) return
    setIsSearching(true)
    try {
      const rows = await api.getUsers({ role: "STUDENT", q: q.trim(), take: 20 })
      setResults(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email ?? "",
        })),
      )
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggle = (studentId: string) => {
    onChange(value.includes(studentId) ? value.filter((s) => s !== studentId) : [...value, studentId])
  }

  return (
    <div ref={wrapperRef} className="mt-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">group</span>
          Target specific students
          {value.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-label-sm">
              {value.length}
            </span>
          )}
        </p>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-error disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
        {value.length === 0
          ? "All approved students in the section see this quiz."
          : "Only the selected students see this quiz."}
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 focus-within:border-primary transition-all">
        <span className="material-symbols-outlined text-[16px] text-outline">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            void search(e.target.value)
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Search students…"
          className="flex-1 bg-transparent border-none outline-none font-label-sm text-label-sm text-on-surface placeholder:text-outline-variant disabled:opacity-60"
        />
        {isSearching && (
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-lg animate-spin shrink-0" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="mt-1 rounded-lg border border-outline-variant bg-white shadow-xl max-h-52 overflow-y-auto">
          {results.map((r) => {
            const selected = value.includes(r.id)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container transition-colors text-left"
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                    selected ? "border-primary bg-primary" : "border-outline-variant bg-surface",
                  )}
                >
                  {selected && <span className="material-symbols-outlined text-[12px] text-primary-foreground font-bold">check</span>}
                </span>
                <span className="min-w-0">
                  <span className="block font-label-sm text-label-sm text-on-surface truncate">{r.name}</span>
                  {r.email && (
                    <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">{r.email}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function QuizTargetPicker({ value, onChange, disabled }: QuizTargetPickerProps) {
  const { user } = useAuth()
  const offerings = useTeacherOfferings()

  const gradesQ = useQuery({
    queryKey: ["quizzes", "grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })

  const [gradeId, setGradeId] = useState("")
  const [courseId, setCourseId] = useState("")

  const gradeIds = useMemo(
    () => new Set((offerings.data ?? []).map((o) => o.section.gradeLevelId)),
    [offerings.data],
  )
  const grades = useMemo(
    () => (gradesQ.data ?? []).filter((g) => gradeIds.has(g.id)),
    [gradesQ.data, gradeIds],
  )

  const courseOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const o of offerings.data ?? []) {
      if (o.section.gradeLevelId !== gradeId) continue
      byId.set(o.course.id, o.course.name)
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [offerings.data, gradeId])

  const sectionOptions = useMemo(
    () =>
      (offerings.data ?? []).filter(
        (o) => o.section.gradeLevelId === gradeId && o.course.id === courseId,
      ),
    [offerings.data, gradeId, courseId],
  )

  const toggleOffering = (offering: api.CourseOffering) => {
    const exists = value.some((t) => t.courseOfferingId === offering.id)
    if (exists) {
      onChange(value.filter((t) => t.courseOfferingId !== offering.id))
      return
    }
    const section = offering.section
    onChange([
      ...value,
      {
        courseOfferingId: offering.id,
        targetStudentIds: [],
        gradeLevelId: section.gradeLevelId,
        gradeLevelName: grades.find((g) => g.id === section.gradeLevelId)?.name ?? "",
        courseId: offering.course.id,
        courseName: offering.course.name,
        sectionId: section.id,
        sectionName: section.name,
      },
    ])
  }

  const updateTargets = (offeringId: string, targetStudentIds: string[]) => {
    onChange(value.map((t) => (t.courseOfferingId === offeringId ? { ...t, targetStudentIds } : t)))
  }

  const resetCascade = () => {
    setGradeId("")
    setCourseId("")
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Grade</label>
          <Select
            value={gradeId}
            onValueChange={(v) => {
              setGradeId(v)
              setCourseId("")
            }}
            disabled={disabled || offerings.isLoading}
          >
            <SelectTrigger aria-label="Grade" className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60">
              <SelectValue placeholder="Pick a grade…" />
            </SelectTrigger>
            <SelectContent>
              {grades.length === 0 && (
                <p className="px-3 py-2 text-sm text-on-surface-variant">No grades assigned</p>
              )}
              {grades.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  Grade {g.level}
                  {g.name ? ` — ${g.name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Course</label>
          <Select
            value={courseId}
            onValueChange={setCourseId}
            disabled={disabled || !gradeId}
          >
            <SelectTrigger aria-label="Course" className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60">
              <SelectValue placeholder="Pick a course…" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.length === 0 && (
                <p className="px-3 py-2 text-sm text-on-surface-variant">
                  {gradeId ? "No courses in this grade" : "Pick a grade first"}
                </p>
              )}
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {courseId && sectionOptions.length > 0 && (
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Sections
          </label>
          <div className="space-y-2">
            {sectionOptions.map((o) => {
              const selected = value.some((t) => t.courseOfferingId === o.id)
              return (
                <div key={o.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => toggleOffering(o)}
                    disabled={disabled}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors disabled:opacity-60",
                      selected && "border-l-2 border-l-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        selected ? "border-primary bg-primary" : "border-outline-variant bg-surface",
                      )}
                    >
                      {selected && (
                        <span className="material-symbols-outlined text-[14px] text-primary-foreground font-bold">check</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-label-md text-label-md text-on-surface truncate">
                        {o.section.name}
                      </span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                        {o.course.name} · {grades.find((g) => g.id === o.section.gradeLevelId)?.name ?? ""}
                      </span>
                    </span>
                    {selected && (
                      <span className="font-label-sm text-label-sm text-primary">Assigned</span>
                    )}
                  </button>
                  {selected && (
                    <StudentMultiSelect
                      value={value.find((t) => t.courseOfferingId === o.id)!.targetStudentIds}
                      onChange={(ids) => updateTargets(o.id, ids)}
                      disabled={disabled}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Assigned to {value.length} section{value.length > 1 ? "s" : ""}
            </label>
            <button
              type="button"
              onClick={() => {
                onChange([])
                resetCascade()
              }}
              disabled={disabled}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-error disabled:opacity-50"
            >
              Remove all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((t) => (
              <span
                key={t.courseOfferingId}
                className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 font-label-sm text-label-sm text-on-surface"
              >
                {t.sectionName}
                {t.targetStudentIds.length > 0 && (
                  <span className="text-primary">{t.targetStudentIds.length} targeted</span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x.courseOfferingId !== t.courseOfferingId))}
                  disabled={disabled}
                  className="text-on-surface-variant hover:text-error disabled:opacity-50"
                  aria-label={`Remove ${t.sectionName}`}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {offerings.isLoading ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant">Loading your classes…</p>
      ) : (offerings.data ?? []).length === 0 ? (
        <p className="font-label-sm text-label-sm text-error">
          You don&apos;t teach any classes yet — quizzes must be assigned to at least one section.
        </p>
      ) : null}

      {value.length > 0 && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
          <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Students see this quiz only in the sections you assign it to. You can reuse the same
            quiz in other grades/courses later.
          </p>
        </div>
      )}

      <input type="hidden" value={value.length} aria-hidden />
    </div>
  )
}