import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAuth } from "@/providers/use-auth"
import {
 useMeeting,
 useSetMeetingRecording,
 useJoinMeeting,
 useEndMeeting,
} from "@/hooks/use-meetings"
import { useLivekitCall } from "@/hooks/use-livekit"
import { LobbyPanel } from "@/components/meetings/LobbyPanel"
import { ParticipantTile } from "@/components/meetings/ParticipantTile"
import { ControlBar } from "@/components/meetings/ControlBar"
import { ChatPanel } from "@/components/meetings/ChatPanel"
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel"
import { cn } from "@/lib/utils"
import type { Participant } from "livekit-client"

interface JoinSession {
 token: string
 url: string
 roomName: string
 cameraId?: string
 micId?: string
}

export function MeetingCallPage() {
 const { id } = useParams<{ id: string }>()
 const { user } = useAuth()
 const navigate = useNavigate()

 const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
 const basePath = isTeacher ? "/meetings" : "/student/meetings"

 const { data: meeting, isLoading, isError, error, refetch } = useMeeting(id)
 const join = useJoinMeeting()
 const end = useEndMeeting()
 const recording = useSetMeetingRecording()

 const [session, setSession] = useState<JoinSession | null>(null)
 const [joining, setJoining] = useState(false)
 const [chatOpen, setChatOpen] = useState(true)
 const [transcriptOpen, setTranscriptOpen] = useState(false)

 const call = useLivekitCall(
  session?.url,
  session?.token,
  session?.roomName,
  session
   ? {
     cameraId: session.cameraId && session.cameraId !== "default" ? session.cameraId : undefined,
     micId: session.micId && session.micId !== "default" ? session.micId : undefined,
    }
   : undefined,
 )

 const participants = useMemo<Participant[]>(() => {
  if (!call.localParticipant) return call.participants
  return [call.localParticipant, ...call.participants]
 }, [call.localParticipant, call.participants])

 const handleJoin = async ({ cameraId, micId }: { cameraId?: string; micId?: string }) => {
  if (!id || joining) return
  setJoining(true)
  try {
   const res = await join.mutateAsync(id)
   setSession({ token: res.token, url: res.url, roomName: res.roomName, cameraId, micId })
  } catch {
   setJoining(false)
  }
 }

 const handleRecord = () => {
  if (!meeting || recording.isPending) return
  recording.mutate({ id: meeting.id, enabled: !meeting.recordingEnabled })
 }

 const handleLeave = async () => {
  call.disconnect()
  navigate(`${basePath}/${id}`, { replace: true })
 }

 const handleEnd = async () => {
  if (!meeting) return
  call.disconnect()
  try {
   await end.mutateAsync(meeting.id)
  } catch {
   // still navigate away
  }
  navigate(`${basePath}/${id}`, { replace: true })
 }

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

 if (!session && !joining) {
  return (
   <div className="h-full flex items-center justify-center p-xl">
    <LobbyPanel
     title={meeting.title}
     subtitle={`${meeting.status === "LIVE" ? "Live now" : "Scheduled for"} ${new Date(meeting.scheduledStart).toLocaleString()}`}
     joining={joining}
     onJoin={handleJoin}
     onBack={() => navigate(basePath)}
    />
   </div>
  )
 }

 if (joining && !call.connected && !call.error) {
  return (
   <LoadingState
    label={call.connecting ? "Connecting to the meeting…" : "Requesting access…"}
    className="flex-1"
   />
  )
 }

 return (
  <div className="h-full flex flex-col bg-inverse-surface text-inverse-on-surface">
   <header className="px-lg py-sm flex items-center justify-between border-b border-white/15">
    <div className="flex items-center gap-3 min-w-0">
     <span className="material-symbols-outlined text-inverse-on-surface/60">video_camera_front</span>
     <div className="min-w-0">
      <h1 className="font-label-lg text-label-lg font-semibold truncate">{meeting.title}</h1>
      <p className="font-label-sm text-label-sm text-inverse-on-surface/50">
       {meeting.courseName ? `${meeting.courseName}${meeting.sectionName ? ` · ${meeting.sectionName}` : ""} · ` : ""}
       {participants.length} participant{participants.length === 1 ? "" : "s"}
      </p>
     </div>
    </div>
    <Link
     to={`${basePath}/${meeting.id}`}
     className="font-label-sm text-label-sm text-inverse-on-surface/50 hover:text-inverse-on-surface transition-colors"
    >
     View details
    </Link>
   </header>

   <div className="flex-1 flex overflow-hidden">
    <main className="flex-1 flex flex-col min-w-0">
     <div className="flex-1 p-md overflow-y-auto">
      {call.error ? (
       <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-[48px] text-danger">error_outline</span>
        <p className="font-body-md text-body-md text-inverse-on-surface/80 max-w-md">{call.error}</p>
        <p className="font-label-sm text-label-sm text-inverse-on-surface/50">You may need to refresh and try again.</p>
       </div>
      ) : (
       <div
        className={cn(
         "grid gap-md",
         participants.length > 1 ? "grid-cols-1 md:grid-cols-2" : "mx-auto max-w-4xl grid-cols-1",
        )}
       >
        {participants.map((participant) => (
         <ParticipantTile
          key={participant.identity}
          participant={participant}
          isLocal={participant.identity === call.localParticipant?.identity}
          handRaised={Boolean(call.raisedHands[participant.identity])}
          reactions={call.reactions.filter((r) => r.identity === participant.identity)}
         />
        ))}
       </div>
      )}
     </div>
     <ControlBar
      call={call}
      isHost={meeting.isHost}
      recordingEnabled={meeting.recordingEnabled}
      recordingIndicator={meeting.recordingEnabled && call.connected}
      chatOpen={chatOpen}
      transcriptOpen={transcriptOpen}
      onToggleChat={() => setChatOpen((v) => !v)}
      onToggleTranscript={() => setTranscriptOpen((v) => !v)}
      onToggleRecording={handleRecord}
      onLeave={handleLeave}
      onEnd={handleEnd}
      className="border-t border-white/5 bg-surface-container"
     />
    </main>

    {(chatOpen || transcriptOpen) && (
     <aside className="w-[22rem] border-l border-white/5 hidden md:flex flex-col bg-surface-container-lowest">
      {chatOpen && <ChatPanel meetingId={meeting.id} className="flex-1 min-h-0" />}
      {transcriptOpen && <TranscriptPanel meetingId={meeting.id} className="flex-1 min-h-0" />}
     </aside>
    )}
   </div>
  </div>
 )
}