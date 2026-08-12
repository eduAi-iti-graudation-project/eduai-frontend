import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { WeeklyTimetableGrid } from "@/components/timetable/WeeklyTimetableGrid"

export function AdminTimetablePage() {
  const slotsQ = useQuery({
    queryKey: ["timetable", "all"],
    queryFn: () => api.getAllTimetableSlots(),
  })

  const offeringsQ = useQuery({
    queryKey: ["admin-offerings"],
    queryFn: () => api.getOfferings(),
  })

  const slots = slotsQ.data ?? []
  const offerings = offeringsQ.data ?? []

  return (
    <div className="px-6 pb-10">
      <PageHeader
        title="Timetable"
        subtitle="Drag on the grid to create a slot, then pick the course offering. Move or resize existing slots — conflicts are checked live against the server."
      />

      {slotsQ.isLoading || offeringsQ.isLoading ? (
        <LoadingState label="Loading timetable…" />
      ) : slotsQ.isError || offeringsQ.isError ? (
        <ErrorState message="Could not load the timetable." onRetry={() => {
          slotsQ.refetch()
          offeringsQ.refetch()
        }} />
      ) : (
        <WeeklyTimetableGrid
          slots={slots}
          offerings={offerings}
          editable
          showSection
          className="max-h-[calc(100vh-220px)] overflow-y-auto"
        />
      )}
    </div>
  )
}
