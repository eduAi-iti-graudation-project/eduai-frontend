import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
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
import * as api from "@/lib/api"
import { saveLocalRecording } from "@/lib/local-recording-cache"
import type { Participant } from "livekit-client"

interface JoinSession {
 token: string
 url: string
 roomName: string
 cameraId?: string
 micId?: string
}

function MediaStatus({ dot, label, on }: { dot: string; label: string; on: boolean }) {
 return (
  <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-inverse-on-surface/70">
   <span className={cn("w-2 h-2 rounded-full", on ? dot : "bg-on-surface/25")} />
   {label}: {on ? "On" : "Off"}
  </span>
 )
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
  const [speechLang, setSpeechLang] = useState<"ar-EG" | "en-US">("ar-EG")
  const [isLocalRecording, setIsLocalRecording] = useState(false)
  const localRecorderRef = useRef<MediaRecorder | null>(null)
  const localChunksRef = useRef<Blob[]>([])
  const localDisplayStreamRef = useRef<MediaStream | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const canvasStopRef = useRef<(() => void) | null>(null)
  const queryClient = useQueryClient()

  // React Router reuses this component across /meetings/:id/call navigations,
  // so a session from a previous meeting would otherwise bleed into the next
  // one (wrong room, wrong token). Reset back to the lobby when the id changes.
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
   setPrevId(id)
   setSession(null)
   setJoining(false)
   queryClient.resetQueries({ queryKey: ["meetings", id] })
  }

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
   speechLang,
 )

  const participants = useMemo<Participant[]>(() => {
   if (!call.localParticipant) return call.participants
   const remotes = call.participants.filter(
    // A remote with our own identity is a stale echo/ghost from a previous
    // connection — never render it as a separate tile.
    (p) => p.identity !== call.localParticipant?.identity,
   )
   return [call.localParticipant, ...remotes]
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

 const handleStartLocalRecording = async () => {
  if (!meeting || isLocalRecording) return
  try {
    const containerEl = videoContainerRef.current || document.body

    const audioTracks: MediaStreamTrack[] = []
    const micPub = call.localParticipant?.getTrackPublication("microphone" as any)
    if (micPub && !micPub.isMuted) {
      const micTrack = (micPub as any).track?.mediaStreamTrack
      if (micTrack) audioTracks.push(micTrack.clone())
    }
    call.participants.forEach((p) => {
      p.audioTrackPublications.forEach((pub) => {
        if (!pub.isMuted) {
          const track = (pub as any).track?.mediaStreamTrack
          if (track) audioTracks.push(track.clone())
        }
      })
    })

    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((el) => {
      if (el.srcObject instanceof MediaStream) {
        el.srcObject.getAudioTracks().forEach((track) => {
          if (track.enabled && !audioTracks.some((t) => t.id === track.id)) {
            audioTracks.push(track.clone())
          }
        })
      }
    })

    const canvas = document.createElement("canvas")
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext("2d")!

    let animId: number | null = null

    const drawFrame = () => {
      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const videos = Array.from(containerEl.querySelectorAll<HTMLVideoElement>("video")).filter(
        (v) => v.readyState >= 2 && !v.paused && v.videoWidth > 0,
      )

      if (videos.length === 0) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 32px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Meeting Recording", canvas.width / 2, canvas.height / 2 - 20)
        ctx.fillStyle = "#94a3b8"
        ctx.font = "20px sans-serif"
        ctx.fillText(meeting.title || "EduAI Meeting", canvas.width / 2, canvas.height / 2 + 20)
      } else if (videos.length === 1) {
        ctx.drawImage(videos[0], 0, 0, canvas.width, canvas.height)
      } else {
        const cols = videos.length > 2 ? 2 : videos.length
        const rows = Math.ceil(videos.length / cols)
        const cellW = canvas.width / cols
        const cellH = canvas.height / rows

        videos.forEach((v, idx) => {
          const col = idx % cols
          const row = Math.floor(idx / cols)
          const x = col * cellW
          const y = row * cellH
          ctx.drawImage(v, x, y, cellW, cellH)
        })
      }

      animId = requestAnimationFrame(drawFrame)
    }

    animId = requestAnimationFrame(drawFrame)
    canvasStopRef.current = () => {
      if (animId !== null) cancelAnimationFrame(animId)
    }

    const canvasStream = canvas.captureStream(30)
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ])
    localDisplayStreamRef.current = combinedStream

    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ]
    const mimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm"

    localChunksRef.current = []
    const recorder = new MediaRecorder(combinedStream, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) localChunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      if (canvasStopRef.current) {
        canvasStopRef.current()
        canvasStopRef.current = null
      }
      const blob = new Blob(localChunksRef.current, { type: mimeType })
      if (blob.size > 1000 && meeting?.id) {
        const cached = await saveLocalRecording(meeting.id, blob)
        toast.success(`Meeting recording saved (${(cached.sizeBytes / 1024 / 1024).toFixed(1)} MB)`)
      }
      localDisplayStreamRef.current?.getTracks().forEach((t) => t.stop())
      localDisplayStreamRef.current = null
    }
    recorder.start(1000)
    localRecorderRef.current = recorder
    setIsLocalRecording(true)
    toast.success("Meeting recording started")
  } catch (err: any) {
    console.warn("[local-recording] start failed:", err)
    toast.error(`Couldn't start meeting recording: ${err?.message ?? "Failed"}`)
  }
 }

 const handleStopLocalRecording = (): Promise<void> => {
  return new Promise((resolve) => {
    const recorder = localRecorderRef.current
    if (!recorder || recorder.state === "inactive") {
      localRecorderRef.current = null
      setIsLocalRecording(false)
      resolve()
      return
    }
    const origOnStop = recorder.onstop
    recorder.onstop = async (e) => {
      if (origOnStop) {
        try { await (origOnStop as any).call(recorder, e) } catch {}
      }
      localRecorderRef.current = null
      setIsLocalRecording(false)
      resolve()
    }
    try {
      recorder.stop()
    } catch {
      localRecorderRef.current = null
      setIsLocalRecording(false)
      resolve()
    }
  })
 }

 const handleRecord = async () => {
  if (!meeting || recording.isPending) return
  const wantRecording = !meeting.recordingEnabled
  try {
    if (wantRecording && !isLocalRecording) {
      await handleStartLocalRecording()
    } else if (!wantRecording && isLocalRecording) {
      handleStopLocalRecording()
    }
    recording.mutate({ id: meeting.id, enabled: wantRecording })
  } catch {
    // local start may throw, still attempt server toggle if that's separate
  }
 }

  // Real-time continuous auto-save for transcript segments
  const lastSavedCountRef = useRef(0)
  const pendingSaveRef = useRef<Promise<any> | null>(null)
  useEffect(() => {
    if (!meeting?.id || call.liveTranscripts.length === 0) return
    if (call.liveTranscripts.length === lastSavedCountRef.current) return
    const newSegments = call.liveTranscripts.slice(lastSavedCountRef.current)
    lastSavedCountRef.current = call.liveTranscripts.length

    const run = async () => {
      if (pendingSaveRef.current) {
        try { await pendingSaveRef.current } catch {}
      }
      pendingSaveRef.current = api.saveMeetingTranscript(
        meeting.id,
        newSegments.map((s) => ({
          startMs: s.timestampMs,
          text: `${s.speakerName}: ${s.text}`,
        })),
        false,
      )
      try {
        await pendingSaveRef.current
        void queryClient.invalidateQueries({ queryKey: ["meetings", meeting.id, "transcript"] })
      } catch (err) {
        console.warn("[transcript] background auto-save failed:", err)
        lastSavedCountRef.current = Math.max(0, lastSavedCountRef.current - newSegments.length)
      } finally {
        pendingSaveRef.current = null
      }
    }
    void run()
  }, [meeting?.id, call.liveTranscripts, queryClient])

  const saveTranscripts = async () => {
    if (!meeting || call.liveTranscripts.length === 0) return
    if (pendingSaveRef.current) {
      try { await pendingSaveRef.current } catch {}
    }
    try {
      await api.saveMeetingTranscript(
        meeting.id,
        call.liveTranscripts.map((s) => ({
          startMs: s.timestampMs,
          text: `${s.speakerName}: ${s.text}`,
        })),
        true,
      )
      lastSavedCountRef.current = call.liveTranscripts.length
      void queryClient.invalidateQueries({ queryKey: ["meetings", meeting.id, "transcript"] })
    } catch (err) {
      console.warn("[transcript] failed to save:", err)
    }
  }

  const handleLeave = async () => {
    if (isLocalRecording) await handleStopLocalRecording()
    await saveTranscripts()
    call.disconnect()
    navigate(`${basePath}/${id}`, { replace: true })
  }

  const handleEnd = async () => {
    if (!meeting) return
    if (isLocalRecording) await handleStopLocalRecording()
    await saveTranscripts()
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

   {call.mediaError && (
    <div className="flex items-center justify-between gap-3 px-lg py-2 bg-danger/15 border-b border-white/10">
     <div className="flex items-center gap-2 min-w-0">
      <span className="material-symbols-outlined text-[18px] text-danger shrink-0">error_outline</span>
      <span className="font-label-md text-label-md text-danger truncate">{call.mediaError}</span>
     </div>
     <button
      type="button"
      aria-label="Dismiss error"
      onClick={call.clearMediaError}
      className="shrink-0 text-inverse-on-surface/60 hover:text-inverse-on-surface transition-colors"
     >
      <span className="material-symbols-outlined text-[18px]">close</span>
     </button>
    </div>
   )}

   {call.connected && (
    <div className="px-lg py-1.5 border-b border-white/10 flex items-center gap-4 flex-wrap bg-inverse-surface/60">
     <span className="font-label-sm text-label-sm text-inverse-on-surface/50">Media:</span>
     <MediaStatus dot="bg-success" label="Camera" on={call.trackStates.camera} />
     <MediaStatus dot="bg-success" label="Mic" on={call.trackStates.mic} />
     <MediaStatus dot="bg-primary" label="Screen" on={call.trackStates.screen} />
    </div>
   )}

   <div className="flex-1 flex overflow-hidden">
    <main className="flex-1 flex flex-col min-w-0">
      <div ref={videoContainerRef} className="flex-1 p-md overflow-y-auto">
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
      recordingEnabled={meeting.recordingEnabled || isLocalRecording}
      recordingIndicator={(meeting.recordingEnabled || isLocalRecording) && call.connected}
      chatOpen={chatOpen}
      transcriptOpen={transcriptOpen}
      onToggleChat={() => setChatOpen((v) => !v)}
      onToggleTranscript={() => setTranscriptOpen((v) => !v)}
      onToggleRecording={handleRecord}
      onLeave={handleLeave}
      onEnd={handleEnd}
     />
    </main>

    {(chatOpen || transcriptOpen) && (
     <aside className="w-[22rem] border-l border-white/5 hidden md:flex flex-col bg-surface-container-lowest">
      {chatOpen && <ChatPanel meetingId={meeting.id} className="flex-1 min-h-0" />}
      {transcriptOpen && (
        <TranscriptPanel
          meetingId={meeting.id}
          liveSegments={call.liveTranscripts}
          speechLang={speechLang}
          onLangChange={setSpeechLang}
          className="flex-1 min-h-0"
        />
      )}
     </aside>
    )}
   </div>
  </div>
 )
}