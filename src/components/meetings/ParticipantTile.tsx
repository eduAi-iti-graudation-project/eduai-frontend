import { useEffect, useRef, useState } from "react"
import { Track, TrackEvent, type Participant, type TrackPublication } from "livekit-client"
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
 * The video a tile should show.
 *
 * Screen share takes priority (that's what everyone actually wants to see),
 * then the camera feed. We key off the participant's enablement flags —
 * NOT publication kind/source/isMuted — because LiveKit mutes/pauses local
 * camera publications in several states (device swap, toggle races) while
 * the feed is still valid, and a muted camera must still render a tile.
 * Avatar is the fallback only when no track exists at all.
 */
function findVideoPublication(participant: Participant): TrackPublication | undefined {
  const publications = participant.getTrackPublications()
  const screenShare = publications.find((pub) => pub.source === Track.Source.ScreenShare)
  const camera = publications.find((pub) => pub.source === Track.Source.Camera)
  if (participant.isScreenShareEnabled && screenShare?.track) return screenShare
  if (participant.isCameraEnabled && camera?.track) return camera
  return screenShare?.track ? screenShare : camera?.track ? camera : undefined
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
  const publication = findVideoPublication(participant)
  const hasVideo = Boolean(publication)
  const [, setFrameVersion] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const track = publication?.track
    if (!container || !track) return
    const el = track.attach()
    el.className = "w-full h-full object-cover"
    container.appendChild(el)
    const onFrame = () => setFrameVersion((v) => v + 1)
    track.on(TrackEvent.VideoDimensionsChanged, onFrame)
    return () => {
      track.off(TrackEvent.VideoDimensionsChanged, onFrame)
      track.detach()
      if (el.parentNode === container) container.removeChild(el)
    }
  }, [publication?.track, hasVideo, participant])

  const muted = !participant.isMicrophoneEnabled

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden bg-[#1a2038] aspect-video flex items-center justify-center",
        className,
      )}
    >
      {hasVideo && publication?.track ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-[#2C5FB3] flex items-center justify-center text-white font-headline-md">
            {getInitials(participant.name || "Guest")}
          </div>
          <span className="font-label-md text-label-md text-[#a9b2c8]">Camera off</span>
        </div>
      )}

      {handRaised && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#FFF4E5] text-[#b45309] rounded-full px-sm py-1 shadow">
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