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
import { cn } from "@/lib/utils"
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
        title="Recording was not enabled"
        description="The host did not enable recording for this meeting."
      />
    )
  }
  if (meeting.status !== "ENDED") {
    return (
      <EmptyState
        icon="fiber_manual_record"
        title="Recording in progress"
        description="The recording will be available here after the meeting ends."
      />
    )
  }
  if (!meeting.recordingUrl) {
    return (
      <div className="py-lg text-center space-y-3 px-lg">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant block">cloud_off</span>
        <p className="font-label-lg text-label-lg text-on-surface">Recording not saved</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
          The recording button was pressed during the meeting, but the file could not be saved.
          This usually means the server is running without cloud storage (LiveKit Egress + S3) configured.
        </p>
        <p className="font-body-sm text-body-sm text-primary/80">
          To enable recordings, set <code className="bg-surface-container px-1 rounded text-xs">SUPABASE_STORAGE_S3_*</code> and <code className="bg-surface-container px-1 rounded text-xs">SUPABASE_MEETINGS_BUCKET</code> in the backend <code className="bg-surface-container px-1 rounded text-xs">.env</code>.
        </p>
      </div>
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
    <div className="space-y-md">
      <div className="rounded-xl overflow-hidden bg-black shadow-lg">
        <video
          src={recording.data.recordingUrl}
          controls
          className="w-full max-h-[420px] aspect-video object-contain"
        />
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <a href={recording.data.recordingUrl} download target="_blank" rel="noreferrer">
            <span className="material-symbols-outlined text-[18px] mr-1">download</span>
            Download recording
          </a>
        </Button>
      </div>
    </div>
  )
}

function AttendanceTab({ meeting }: { meeting: MeetingDetail }) {
  const map = new Map<string, { name: string; joinedAt?: string | null; leftAt?: string | null }>()

  meeting.participants.forEach((p) => {
    map.set(p.userId, { name: p.name, joinedAt: null, leftAt: null })
  })

  meeting.attendance.forEach((a) => {
    map.set(a.userId, {
      name: a.name || map.get(a.userId)?.name || "Participant",
      joinedAt: a.joinedAt,
      leftAt: a.leftAt,
    })
  })

  const rows = Array.from(map.entries()).map(([userId, data]) => ({ userId, ...data }))

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="groups"
        title="No attendance records"
        description="Attendance records will appear once participants join the meeting."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Participant</th>
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Joined at</th>
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Left at</th>
            <th className="py-2.5 font-label-sm text-label-sm text-on-surface-variant">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId} className="border-b border-border/60 last:border-0">
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface font-medium">{row.name}</td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant tabular-nums">
                {row.joinedAt ? formatTime(row.joinedAt) : "—"}
              </td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant tabular-nums">
                {row.leftAt ? formatTime(row.leftAt) : row.joinedAt ? "Present" : "—"}
              </td>
              <td className="py-3 font-body-md text-body-md">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    row.leftAt
                      ? "bg-surface-variant text-on-surface-variant"
                      : row.joinedAt
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {row.leftAt ? "Attended" : row.joinedAt ? "Active" : "Not joined"}
                </span>
              </td>
            </tr>
          ))}
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
     {canJoin ? (
      <div className="flex justify-end gap-3 pt-2">
       <Button asChild>
        <Link to={`${basePath}/${meeting.id}/call`}>
         <span className="material-symbols-outlined text-[18px] mr-1">video_call</span>
         {meeting.status === "LIVE" ? "Join live" : "Join meeting"}
        </Link>
       </Button>
      </div>
     ) : meeting.status === "ENDED" ? (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-right flex items-center justify-end gap-1">
       <span className="material-symbols-outlined text-[16px]">check_circle</span>
       This meeting has ended.
      </p>
     ) : !meeting.canJoin ? (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
       You don't have access to this meeting.
      </p>
     ) : null}
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