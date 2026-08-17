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

 const displayGradeId = selectedGradeId ?? grades[0]?.id ?? null

 const gradeSections = useMemo(
  () => (classesQ.data ?? []).filter((c) => c.gradeLevelId === displayGradeId),
  [classesQ.data, displayGradeId],
 )

 const displaySectionId = selectedSectionId ?? gradeSections[0]?.id ?? null

 const selectedGrade = grades.find((g) => g.id === displayGradeId) ?? null
 const selectedSection = gradeSections.find((s) => s.id === displaySectionId) ?? null

 const slotsQ = useQuery({
   queryKey: ["timetable", "section", displaySectionId ?? "none"],
   queryFn: () => api.getSectionTimetable(displaySectionId!),
   enabled: Boolean(displaySectionId),
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
  <div className="flex h-full flex-col px-6">
   <PageHeader
    title="Timetable"
    subtitle={subtitle}
    className="px-0"
   />

   {loading ? (
    <LoadingState label="Loading timetable…" className="flex-1" />
   ) : error ? (
    <div className="flex-1 min-h-0">
     <ErrorState message="Could not load the timetable." onRetry={() => {
      gradesQ.refetch()
      classesQ.refetch()
      offeringsQ.refetch()
     }} />
    </div>
   ) : grades.length === 0 || allSections.length === 0 ? (
    <div className="flex-1 min-h-0 flex items-center justify-center pb-10">
     <div className="max-w-md w-full rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-md py-lg text-center">
      <p className="font-body-md text-body-md text-on-surface-variant">
       No grade levels or sections yet — create them in{" "}
       <span className="font-medium text-on-surface">Grade Management</span> first.
      </p>
     </div>
    </div>
   ) : (
    <>
     <div className="flex flex-wrap items-center gap-3 mb-md shrink-0">
      <Select
       value={displayGradeId ?? undefined}
       onValueChange={(v) => {
        setSelectedGradeId(v)
        setSelectedSectionId(null)
       }}
      >
       <SelectTrigger className="w-auto min-w-[180px] h-9 rounded-lg bg-surface-container-lowest px-3 font-label-md text-label-md">
        <SelectValue placeholder="Select grade" />
       </SelectTrigger>
       <SelectContent className="rounded-lg w-full h-70 bg-surface-container-lowest">
        {grades.map((g) => (
         <SelectItem key={g.id} value={g.id}>
          {g.name ?? `Grade ${g.level}`}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>

      <Select
       value={displaySectionId ?? undefined}
       onValueChange={setSelectedSectionId}
       disabled={!displayGradeId || gradeSections.length === 0}
      >
       <SelectTrigger className="w-auto min-w-[220px] h-9 rounded-lg bg-surface-container-lowest px-3 font-label-md text-label-md">
        <SelectValue placeholder="Select section" />
       </SelectTrigger>
       <SelectContent className="rounded-lg bg-surface-container-lowest">
        {gradeSections.map((s) => (
         <SelectItem key={s.id} value={s.id}>
          {s.name}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
       <p className="font-label-sm text-label-sm text-on-surface-variant">Week starts:</p>
       <div className="flex rounded-lg bg-surface-container-lowest p-0.5">
        {(["MONDAY", "SUNDAY"] as const).map((value) => (
         <button
          key={value}
          type="button"
          onClick={() => handleWeekStartChange(value)}
          className={cn(
           "px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors",
           weekStart === value
            ? "bg-primary text-primary-foreground"
            : "text-on-surface-variant hover:text-on-surface",
          )}
         >
          {value === "MONDAY" ? "Mon" : "Sun"}
         </button>
        ))}
       </div>
      </div>
     </div>

     <div className="flex-1 min-h-0 overflow-y-auto">
       {!selectedSection ? (
        <div className="h-full w-full min-h-56">
         <div className="w-full h-full rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest flex items-center justify-center text-center px-md py-lg">
          <p className="font-body-md text-body-md text-on-surface-variant">
           No sections in this grade yet — create one in Grade Management.
          </p>
         </div>
        </div>
       ) : slotsQ.isLoading ? (
       <LoadingState label="Loading section timetable…" className="h-full" />
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
        fillHeight
        className="h-full"
       />
      )}
     </div>
    </>
   )}
  </div>
 )
}