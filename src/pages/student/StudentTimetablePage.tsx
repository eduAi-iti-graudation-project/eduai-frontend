import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { WeeklyTimetableGrid } from "@/components/timetable/WeeklyTimetableGrid"

export function StudentTimetablePage() {
  const { user } = useAuth()

  const classesQ = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const sections = useMemo(() => classesQ.data ?? [], [classesQ.data])

  const slotsQ = useQuery({
    queryKey: ["timetable", "student-sections", sections.map((s) => s.id).join(",")],
    queryFn: async () => {
      const all: api.TimetableSlotWithOffering[] = []
      for (const section of sections) {
        const list = await api.getSectionTimetable(section.id)
        all.push(...list)
      }
      return all
    },
    enabled: sections.length > 0,
  })

  if (classesQ.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
        <LoadingState label="Loading your schedule…" />
      </div>
    )
  }

  if (classesQ.isError || slotsQ.isError) {
    return (
      <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
        <ErrorState message="Could not load your schedule." onRetry={() => slotsQ.refetch()} />
      </div>
    )
  }

  const slots = slotsQ.data ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-1">My Timetable</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Your weekly section schedule.
      </p>

      {sections.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="You are not enrolled in any classes"
          description="Join a course to see your weekly schedule here."
        />
      ) : slotsQ.isLoading ? (
        <LoadingState label="Loading your schedule…" />
      ) : slots.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="Nothing scheduled yet"
          description="Your school hasn't published a timetable for your classes yet."
        />
      ) : (
        <WeeklyTimetableGrid slots={slots} showSection />
      )}
    </div>
  )
}
