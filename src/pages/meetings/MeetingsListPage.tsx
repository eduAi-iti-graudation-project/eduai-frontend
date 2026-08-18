import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAuth } from "@/providers/use-auth"
import { useMeetings } from "@/hooks/use-meetings"
import { MeetingStatusBadge } from "@/components/meetings/MeetingStatusBadge"
import type { MeetingSummary } from "@/lib/api"

function formatDate(iso: string): string {
 return new Date(iso).toLocaleString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 })
}

function MeetingCard({ meeting, basePath }: { meeting: MeetingSummary; basePath: string }) {
 return (
  <Link
   to={`${basePath}/${meeting.id}`}
   className="block rounded-xl border border-border bg-surface-container-lowest p-md hover:shadow-card-hover hover:border-primary/40 transition-shadow"
  >
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
     <h3 className="font-label-lg text-label-lg text-primary font-semibold truncate">{meeting.title}</h3>
     <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
      {meeting.courseName ? `${meeting.courseName} · ${meeting.sectionName ?? ""}` : "Ad-hoc meeting"}
     </p>
    </div>
    <MeetingStatusBadge status={meeting.status} />
   </div>
   <div className="flex items-center gap-2 mt-3 font-label-sm text-label-sm text-on-surface-variant">
    <span className="material-symbols-outlined text-[16px]">schedule</span>
    <span className="tabular-nums">{formatDate(meeting.scheduledStart)}</span>
   </div>
   <div className="flex items-center gap-2 mt-1 font-label-sm text-label-sm text-on-surface-variant">
    <span className="material-symbols-outlined text-[16px]">person</span>
    <span>
     {meeting.hostName}
     {meeting.type === "CLASS" ? ` · ${meeting.participantCount} participants` : ""}
    </span>
   </div>
  </Link>
 )
}

export function MeetingsListPage() {
 const { user } = useAuth()
 const navigate = useNavigate()
 const [scope, setScope] = useState<"upcoming" | "past">("upcoming")
 const { data, isLoading, isError, error, refetch } = useMeetings(scope)

 const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
 const basePath = isTeacher ? "/meetings" : "/student/meetings"

 if (isError) {
  return (
   <ErrorState
    title="Failed to load meetings"
    message={error?.message ?? "Something went wrong"}
    onRetry={() => refetch()}
    className="flex-1"
   />
  )
 }

 const meetings = data?.meetings ?? []
 const live = meetings.filter((m) => m.status === "LIVE")
 const shown = scope === "upcoming" ? meetings.filter((m) => m.status !== "LIVE") : meetings

 return (
  <div className="p-xl max-w-3xl mx-auto w-full">
   <header className="mb-lg flex items-center justify-between">
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary mb-1">Meetings</h1>
     <p className="font-body-md text-body-md text-on-surface-variant">
      {isTeacher ? "Schedule and join live class meetings" : "Join your live class meetings"}
     </p>
    </div>
    {isTeacher && (
     <Button onClick={() => navigate(`${basePath}/new`)}>
      <span className="material-symbols-outlined text-[18px] mr-1">add</span>
      Schedule
     </Button>
    )}
   </header>

   <Tabs value={scope} onValueChange={(value) => setScope(value as "upcoming" | "past")}>
    <TabsList>
     <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
     <TabsTrigger value="past">Past</TabsTrigger>
    </TabsList>
    <TabsContent value={scope}>
     {scope === "upcoming" && live.length > 0 && (
      <div className="mt-md mb-lg">
       <h2 className="font-label-lg text-label-lg text-primary mb-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
        Happening now
       </h2>
       <div className="space-y-3">
        {live.map((meeting) => (
         <MeetingCard key={meeting.id} meeting={meeting} basePath={basePath} />
        ))}
       </div>
      </div>
     )}
     {isLoading ? (
      <LoadingState className="py-lg" />
     ) : shown.length === 0 ? (
      <EmptyState
       icon="video_camera_front"
       title={scope === "upcoming" ? "No upcoming meetings" : "No past meetings"}
       description={
        scope === "upcoming"
         ? isTeacher
          ? "Schedule your first meeting to get started."
          : "Your teacher hasn't scheduled any meetings yet."
         : "Meetings you attended will appear here."
       }
      />
     ) : (
      <div className="space-y-3 pt-md">
       {shown.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} basePath={basePath} />
       ))}
      </div>
     )}
    </TabsContent>
   </Tabs>
  </div>
 )
}
