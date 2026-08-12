import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { WeeklyTimetableGrid } from "@/components/timetable/WeeklyTimetableGrid"

export function TimetablePage() {
  const { user } = useAuth()

  const timetable = useQuery({
    queryKey: ["timetable", "teacher", user?.id],
    queryFn: () => api.getTeacherTimetable(user!.id),
    enabled: !!user?.id,
  })

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-1">My Timetable</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Your weekly schedule across every class you teach.
      </p>

      {timetable.isLoading ? (
        <LoadingState label="Loading your timetable…" />
      ) : timetable.isError ? (
        <ErrorState message="Could not load your timetable." onRetry={() => timetable.refetch()} />
      ) : (timetable.data ?? []).length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="No classes scheduled yet"
          description="Your admin hasn't assigned any time slots to your classes yet."
        />
      ) : (
        <WeeklyTimetableGrid slots={timetable.data ?? []} showSection />
      )}
    </div>
  )
}
