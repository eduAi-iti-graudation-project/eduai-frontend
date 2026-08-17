import { useEffect, useRef, useState } from "react"
import {
  ParticipantEvent,
  Track,
  TrackEvent,
  type Participant,
  type TrackPublication,
} from "livekit-client"
import { cn } from "@/lib/utils"
import type { Reaction } from "@/hooks/use-livekit"

function getInitials(name: string): string {
  return name
   .split(" ")
   .map((word) => word[0])
   .join("")
   .toUpperCase()
   .slice(0, 2)
}

/**
 * The video a tile should show: screen share first, then the camera.
 *
 * For REMOTE participants we trust the raw MediaStreamTrack's `enabled` flag:
 * LiveKit sets it to false when the sender actually mutes, which is the
 * ground truth even when the publication's mute flag lags. For the LOCAL
 * participant the participant's own enablement flags are the ground truth —
 * a published-but-paused local track (device swap, hidden tab, transient
 * mute) still has a valid feed we should render, and a locally muted camera
 * must fall back to the avatar.
 */
function isTrackLive(track: TrackPublication["track"] | undefined): boolean {
  if (!track) return false
  const mediaTrack = track.mediaStreamTrack
  if (!mediaTrack) return true
  return mediaTrack.enabled !== false
}

function pickVideoPublication(participant: Participant, isLocal?: boolean): TrackPublication | undefined {
  const publications = participant.getTrackPublications()
  const screenShare = publications.find(
    (pub) =>
      pub.source === Track.Source.ScreenShare &&
      Boolean(pub.track) &&
      (isLocal ? participant.isScreenShareEnabled : isTrackLive(pub.track)),
  )
  if (screenShare) return screenShare
  return publications.find(
    (pub) =>
      pub.source === Track.Source.Camera &&
      Boolean(pub.track) &&
      (isLocal ? participant.isCameraEnabled : isTrackLive(pub.track)),
  )
}

interface ParticipantTileProps {
  participant: Participant
  isLocal?: boolean
  handRaised?: boolean
  reactions?: Reaction[]
  className?: string
}

export function ParticipantTile({ participant, isLocal, handRaised, reactions, className }: ParticipantTileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const publication = pickVideoPublication(participant, isLocal)
  const hasVideo = Boolean(publication)
  const [, setVersion] = useState(0)
  const pubs = participant
   .getTrackPublications()
   .map((p) => {
    const t = p.track?.mediaStreamTrack
    return `${p.source}[sid=${p.trackSid}] pubMuted=${p.isMuted} trackMuted=${p.track?.isMuted} tsEnabled=${t ? t.enabled : "n/a"} state=${t?.readyState ?? "n/a"}`
   })
   .join(" || ")
  const cam = participant.getTrackPublication(Track.Source.Camera)
  const debugLine =
   `hasVideo=${hasVideo} local=${Boolean(isLocal)} sdkLocal=${participant.isLocal} sid=${participant.sid} ` +
   `isCamEnabled=${participant.isCameraEnabled} camPub=${cam ? `sid=${cam.trackSid} pubMuted=${cam.isMuted} track=${Boolean(cam.track)}` : "none"} | ${pubs}`

  // Re-render whenever this participant's tracks/mute state change — the
  // tile must not depend on the parent's room-level event wiring alone.
  useEffect(() => {
   const bump = () => setVersion((v) => v + 1)
   const events = [
    ParticipantEvent.TrackMuted,
    ParticipantEvent.TrackUnmuted,
    ParticipantEvent.TrackPublished,
    ParticipantEvent.TrackUnpublished,
    ParticipantEvent.IsSpeakingChanged,
   ] as const
   events.forEach((event) => participant.on(event, bump))
   return () => {
    events.forEach((event) => participant.off(event, bump))
   }
  }, [participant])

  useEffect(() => {
   const container = containerRef.current
   const track = publication?.track
   if (!container || !track) return
   const el = track.attach()
   el.className = "w-full h-full object-cover"
   container.appendChild(el)
   const onFrame = () => setVersion((v) => v + 1)
   track.on(TrackEvent.VideoDimensionsChanged, onFrame)
   return () => {
    track.off(TrackEvent.VideoDimensionsChanged, onFrame)
    track.detach()
    if (el.parentNode === container) container.removeChild(el)
   }
  }, [publication?.track, hasVideo])

  const muted = !participant.isMicrophoneEnabled

  return (
   <div
    className={cn(
     "relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center",
     className,
    )}
   >
    {hasVideo && publication?.track ? (
     <div ref={containerRef} className="w-full h-full" />
    ) : (
     <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-headline-md">
       {getInitials(participant.name || "Guest")}
      </div>
      <span className="font-label-md text-label-md text-on-surface-variant">Camera off</span>
     </div>
    )}

    {isLocal && (
     <div className="absolute top-0 inset-x-0 bg-black/70 text-[10px] leading-tight text-lime-300 font-mono px-2 py-1 z-10">
      {debugLine}
     </div>
    )}

    {handRaised && (
     <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full px-sm py-1 shadow">
      <span className="material-symbols-outlined text-[16px]">back_hand</span>
      <span className="font-label-sm text-label-sm">Hand raised</span>
     </div>
    )}

    {(reactions ?? []).map((reaction) => (
     <span
      key={reaction.id}
      className="absolute right-3 bottom-8 text-[28px] animate-bounce pointer-events-none"
     >
      {reaction.emoji}
     </span>
    ))}

    <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
     <span className="font-label-sm text-label-sm text-white truncate">
      {participant.name || "Guest"}
      {isLocal ? " (You)" : ""}
     </span>
     <div className="flex items-center gap-1.5">
      {participant.isScreenShareEnabled && (
       <span className="material-symbols-outlined text-[16px] text-white/90">present_to_all</span>
      )}
      <span className="material-symbols-outlined text-[16px] text-white/90">{muted ? "mic_off" : "mic"}</span>
     </div>
    </div>
   </div>
  )
}
