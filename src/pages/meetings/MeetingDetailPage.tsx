import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAuth } from "@/providers/use-auth"
import { useMeeting } from "@/hooks/use-meetings"
import { MeetingStatusBadge, TranscriptStatusBadge } from "@/components/meetings/MeetingStatusBadge"
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel"
import { StruggleSignalsPanel } from "@/components/meetings/StruggleSignalsPanel"
import * as api from "@/lib/api"
import type { MeetingDetail } from "@/lib/api"

function formatDate(iso: string): string {
 return new Date(iso).toLocaleString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 })
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
 return (
  <div className="flex items-center gap-3">
   <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">{icon}</span>
   <span className="font-label-md text-label-md text-on-surface-variant w-32 shrink-0">{label}</span>
   <span className="font-body-md text-body-md text-on-surface min-w-0 break-words">{value}</span>
  </div>
 )
}

function RecordingTab({ meeting }: { meeting: MeetingDetail }) {
  const { id } = useParams<{ id: string }>()
  // `meeting.recordingUrl` is the raw storage key — the playable URL is a
  // short-lived signed link from GET /meetings/:id/recording.
  const recording = useQuery({
    queryKey: ["meetings", id, "recording"],
    queryFn: () => api.getMeetingRecording(id as string),
    enabled: !!id && !!meeting.recordingUrl,
    staleTime: 5 * 60 * 1000,
  })

  if (!meeting.recordingEnabled) {
    return (
      <EmptyState
        icon="videocam_off"
        title="No recording"
        description="Recording wasn't enabled for this meeting."
      />
    )
  }
  if (meeting.status !== "ENDED") {
    return (
      <EmptyState
        icon="videocam"
        title="Recording pending"
        description="The recording will be available after the meeting ends."
      />
    )
  }
  if (!meeting.recordingUrl) {
    return (
      <EmptyState
        icon="videocam"
        title="No recording available"
        description="The host may not have started the recording."
      />
    )
  }
  if (recording.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingState className="h-8" />
      </div>
    )
  }
  if (recording.isError || !recording.data?.recordingUrl) {
    return (
      <EmptyState
        icon="videocam"
        title="Recording not ready yet"
        description="The recording file isn't reachable yet — it may still be processing. Try again in a minute."
      />
    )
  }
  return (
    <div className="space-y-lg">
      <EmptyState
        icon="movie"
        title="Recording ready"
        description="Download or watch the meeting recording."
      />
      <div className="flex justify-center">
        <Button asChild>
          <a href={recording.data.recordingUrl} target="_blank" rel="noreferrer">
            <span className="material-symbols-outlined text-[18px] mr-1">play_circle</span>
            Watch recording
          </a>
        </Button>
      </div>
    </div>
  )
}

function AttendanceTab({ meeting }: { meeting: MeetingDetail }) {
 return (
  <div className="overflow-x-auto">
   <table className="w-full text-left">
    <thead>
     <tr className="border-b border-border">
      <th className="py-2 pr-4 font-label-sm text-label-sm text-on-surface-variant">Participant</th>
      <th className="py-2 pr-4 font-label-sm text-label-sm text-on-surface-variant">Joined</th>
      <th className="py-2 font-label-sm text-label-sm text-on-surface-variant">Left</th>
     </tr>
    </thead>
    <tbody>
     {meeting.participants.map((p) => {
      const record = meeting.attendance.find((a) => a.userId === p.userId)
      return (
       <tr key={p.userId} className="border-b border-border/60 last:border-0">
        <td className="py-2 pr-4 font-body-md text-body-md text-on-surface">{p.name}</td>
        <td className="py-2 pr-4 font-body-md text-body-md text-on-surface-variant tabular-nums">
         {record ? formatTime(record.joinedAt) : "—"}
        </td>
        <td className="py-2 font-body-md text-body-md text-on-surface-variant tabular-nums">
         {record?.leftAt ? formatTime(record.leftAt) : "—"}
        </td>
       </tr>
      )
     })}
    </tbody>
   </table>
  </div>
 )
}

function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export function MeetingDetailPage() {
 const { id } = useParams<{ id: string }>()
 const { user } = useAuth()
 const { data: meeting, isLoading, isError, error, refetch } = useMeeting(id)
 const [tab, setTab] = useState<"recording" | "transcript" | "attendance" | "followup">(
  "recording",
 )

 const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
 const basePath = isTeacher ? "/meetings" : "/student/meetings"

 if (isLoading) return <LoadingState className="flex-1" />
 if (isError) {
  return (
   <ErrorState
    title="Failed to load meeting"
    message={error?.message ?? "Something went wrong"}
    onRetry={() => refetch()}
    className="flex-1"
   />
  )
 }
 if (!meeting) return null

 const canJoin = meeting.canJoin && (meeting.status === "SCHEDULED" || meeting.status === "LIVE")

 return (
  <div className="p-xl max-w-3xl mx-auto w-full">
   <Link to={basePath} className="font-label-md text-label-md text-primary hover:underline inline-flex items-center gap-1 mb-lg">
    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
    Back to meetings
   </Link>

   <Card className="border-border mb-lg">
    <CardContent className="p-lg space-y-4">
     <div className="flex items-center justify-between gap-4">
      <h1 className="font-headline-lg text-headline-lg text-primary">{meeting.title}</h1>
      <MeetingStatusBadge status={meeting.status} />
     </div>
     <div className="space-y-3">
      <MetaRow icon="menu_book" label="Course" value={meeting.courseName ?? "Ad-hoc"} />
      {meeting.sectionName && <MetaRow icon="groups" label="Section" value={meeting.sectionName} />}
      <MetaRow icon="schedule" label="Starts" value={formatDate(meeting.scheduledStart)} />
      <MetaRow icon="schedule" label="Ends" value={formatDate(meeting.scheduledEnd)} />
      <MetaRow icon="person" label="Host" value={meeting.hostName} />
      <MetaRow
       icon="videocam"
       label="Recording"
       value={
        <span className="flex items-center gap-2">
         {meeting.recordingEnabled ? "Enabled" : "Off"}
         <TranscriptStatusBadge status={meeting.transcriptStatus} />
        </span>
       }
      />
     </div>
     {canJoin && (
      <div className="flex justify-end gap-3 pt-2">
       <Button asChild>
        <Link to={`${basePath}/${meeting.id}/call`}>
         <span className="material-symbols-outlined text-[18px] mr-1">video_call</span>
         {meeting.status === "LIVE" ? "Join live" : "Join meeting"}
        </Link>
       </Button>
      </div>
     )}
     {!canJoin && (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
       You don't have access to this meeting.
      </p>
     )}
    </CardContent>
   </Card>

   <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
    <TabsList>
     <TabsTrigger value="recording">Recording</TabsTrigger>
     <TabsTrigger value="transcript">Transcript</TabsTrigger>
     <TabsTrigger value="attendance">Attendance</TabsTrigger>
     {isTeacher && <TabsTrigger value="followup">Follow-up</TabsTrigger>}
    </TabsList>
    <TabsContent value="recording">
     <RecordingTab meeting={meeting} />
    </TabsContent>
    <TabsContent value="transcript">
     <div
      className="h-[26rem] rounded-xl border border-border overflow-hidden"
     >
      <TranscriptPanel meetingId={meeting.id} className="h-full" />
     </div>
    </TabsContent>
    <TabsContent value="attendance">
     <Card className="border-border">
      <CardContent className="p-md">
       <AttendanceTab meeting={meeting} />
      </CardContent>
     </Card>
    </TabsContent>
    {isTeacher && (
     <TabsContent value="followup">
      <div className="h-[26rem] rounded-xl border border-border overflow-hidden">
       <StruggleSignalsPanel meetingId={meeting.id} className="h-full" />
      </div>
     </TabsContent>
    )}
   </Tabs>
  </div>
 )
}