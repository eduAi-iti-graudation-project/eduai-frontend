import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getWeekStart, orderedDays, setWeekStart, type WeekStart } from "@/lib/timetable-settings"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { WeeklyTimetableGrid } from "@/components/timetable/WeeklyTimetableGrid"
import { cn } from "@/lib/utils"

export function AdminTimetablePage() {
  const gradesQ = useQuery({
    queryKey: ["admin-grades"],
    queryFn: api.getAllGrades,
  })

  const classesQ = useQuery({
    queryKey: ["admin-classes"],
    queryFn: api.getClasses,
  })

  const offeringsQ = useQuery({
    queryKey: ["admin-offerings"],
    queryFn: () => api.getOfferings(),
  })

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [weekStart, setWeekStartState] = useState<WeekStart>(() => getWeekStart())

  const grades = gradesQ.data ?? []
  const allSections = classesQ.data ?? []
  const offerings = offeringsQ.data ?? []

  const gradeOptions = useMemo(() => {
    const withSections = new Set((classesQ.data ?? []).map((c) => c.gradeLevelId))
    return (gradesQ.data ?? []).filter((g) => withSections.has(g.id))
  }, [gradesQ.data, classesQ.data])

  const effectiveGradeId = gradeOptions.some((g) => g.id === selectedGradeId)
    ? selectedGradeId
    : (gradeOptions[0]?.id ?? null)

  const gradeSections = useMemo(
    () => (classesQ.data ?? []).filter((c) => c.gradeLevelId === effectiveGradeId),
    [classesQ.data, effectiveGradeId],
  )

  const effectiveSectionId = gradeSections.some((s) => s.id === selectedSectionId)
    ? selectedSectionId
    : (gradeSections[0]?.id ?? null)

  const selectedGrade = grades.find((g) => g.id === effectiveGradeId) ?? null
  const selectedSection = gradeSections.find((s) => s.id === effectiveSectionId) ?? null

  const slotsQ = useQuery({
    queryKey: ["timetable", "section", effectiveSectionId ?? "none"],
    queryFn: () => api.getSectionTimetable(effectiveSectionId!),
    enabled: Boolean(effectiveSectionId),
  })

  const loading = gradesQ.isLoading || classesQ.isLoading || offeringsQ.isLoading
  const error = gradesQ.isError || classesQ.isError || offeringsQ.isError

  const handleWeekStartChange = (value: WeekStart) => {
    setWeekStart(value)
    setWeekStartState(value)
  }

  const subtitle = selectedSection
    ? `${selectedGrade?.name ?? `Grade ${selectedGrade?.level}`} · ${selectedSection.name} — drag on the grid to add a course, or move and resize existing slots. Conflicts are checked live against the server.`
    : "Pick a grade and section to edit its timetable."

  return (
    <div className="px-6 pb-10">
      <PageHeader
        title="Timetable"
        subtitle={subtitle}
      />

      {loading ? (
        <LoadingState label="Loading timetable…" />
      ) : error ? (
        <ErrorState message="Could not load the timetable." onRetry={() => {
          gradesQ.refetch()
          classesQ.refetch()
          offeringsQ.refetch()
        }} />
      ) : grades.length === 0 || allSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            No grade levels or sections yet — create them in{" "}
            <span className="font-medium text-on-surface">Grade Management</span> first.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Grade</label>
              <Select
                value={effectiveGradeId ?? undefined}
                onValueChange={(v) => {
                  setSelectedGradeId(v)
                  setSelectedSectionId(null)
                }}
              >
                <SelectTrigger aria-label="Grade" className="w-auto min-w-[180px] h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-label-md">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name ?? `Grade ${g.level}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Section</label>
              <Select
                value={effectiveSectionId ?? undefined}
                onValueChange={setSelectedSectionId}
                disabled={!effectiveGradeId || gradeSections.length === 0}
              >
                <SelectTrigger aria-label="Section" className="w-auto min-w-[220px] h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-label-md">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {gradeSections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <p className="font-label-sm text-label-sm text-on-surface-variant">Week starts:</p>
              <div className="flex rounded-lg border border-outline-variant bg-surface-container-lowest p-0.5">
                {(["MONDAY", "SUNDAY"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleWeekStartChange(value)}
                    className={cn(
                      "px-3 py-1 rounded-md font-label-sm text-label-sm transition-colors",
                      weekStart === value
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {value === "MONDAY" ? "Mon" : "Sun"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!selectedSection ? (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                No sections in this grade yet — create one in Grade Management.
              </p>
            </div>
          ) : slotsQ.isLoading ? (
            <LoadingState label="Loading section timetable…" />
          ) : slotsQ.isError ? (
            <ErrorState
              message="Could not load the section timetable."
              onRetry={() => slotsQ.refetch()}
            />
          ) : (
            <WeeklyTimetableGrid
              slots={slotsQ.data ?? []}
              offerings={offerings}
              sectionId={selectedSection.id}
              days={orderedDays()}
              editable
              className="max-h-[calc(100vh-260px)] overflow-y-auto"
            />
          )}
        </>
      )}
    </div>
  )
}