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
 * Whether a track's underlying MediaStreamTrack is live and producing frames.
 * For remote tracks, `enabled` is the ground truth (LiveKit flips it on mute).
 * For local tracks we also check readyState so a stopped/revoked track is caught.
 */
function isTrackLive(track: TrackPublication["track"] | undefined): boolean {
  if (!track) return false
  const mediaTrack = track.mediaStreamTrack
  if (!mediaTrack) return true // no raw track yet → assume live (will settle next render)
  if (mediaTrack.readyState === "ended") return false
  return mediaTrack.enabled !== false
}

/**
 * Pick the best video publication to display for a participant.
 *
 * Key fix: for the LOCAL participant we no longer rely solely on
 * `participant.isCameraEnabled` because that SDK flag can lag by a render
 * cycle after `LocalTrackPublished` fires — the publication + its track
 * already exist while the flag is still false, causing a single blank frame.
 *
 * Instead we check the publication's own mute state + track liveness, which
 * is synchronous and always up-to-date.
 */
function pickVideoPublication(
  participant: Participant,
  _isLocal?: boolean,
): TrackPublication | undefined {
  const publications = participant.getTrackPublications()

  // Screen share takes priority
  const screenShare = publications.find(
    (pub) =>
      pub.source === Track.Source.ScreenShare &&
      Boolean(pub.track) &&
      !pub.isMuted &&
      isTrackLive(pub.track),
  )
  if (screenShare) return screenShare

  // Camera: for local AND remote use the same ground truth —
  // publication exists + not muted + underlying MediaStreamTrack is live.
  return publications.find(
    (pub) =>
      pub.source === Track.Source.Camera &&
      Boolean(pub.track) &&
      !pub.isMuted &&
      isTrackLive(pub.track),
  )
}

interface ParticipantTileProps {
  participant: Participant
  isLocal?: boolean
  handRaised?: boolean
  reactions?: Reaction[]
  className?: string
}

export function ParticipantTile({
  participant,
  isLocal,
  handRaised,
  reactions,
  className,
}: ParticipantTileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [version, setVersion] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Re-render whenever this participant's tracks/mute/speaking state change.
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    const onSpeaking = (speaking: boolean) => setIsSpeaking(speaking)

    const events = [
      ParticipantEvent.TrackMuted,
      ParticipantEvent.TrackUnmuted,
      ParticipantEvent.TrackPublished,
      ParticipantEvent.TrackUnpublished,
      ParticipantEvent.LocalTrackPublished,
      ParticipantEvent.LocalTrackUnpublished,
    ] as const
    events.forEach((event) => participant.on(event, bump))
    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeaking)

    // Sync initial speaking state
    setIsSpeaking(participant.isSpeaking)

    return () => {
      events.forEach((event) => participant.off(event, bump))
      participant.off(ParticipantEvent.IsSpeakingChanged, onSpeaking)
    }
  }, [participant])

  // Derive video publication every render (version bump forces recompute)
  const publication = pickVideoPublication(participant, isLocal)
  const hasVideo = Boolean(publication?.track)

  // Attach / detach the LiveKit video element
  useEffect(() => {
    const container = containerRef.current
    const track = publication?.track
    if (!container || !track) return

    const el = track.attach()
    el.className = "w-full h-full object-cover"
    el.autoplay = true
    ;(el as HTMLVideoElement).playsInline = true
    container.appendChild(el)

    const onFrame = () => setVersion((v) => v + 1)
    track.on(TrackEvent.VideoDimensionsChanged, onFrame)

    return () => {
      track.off(TrackEvent.VideoDimensionsChanged, onFrame)
      track.detach()
      if (el.parentNode === container) container.removeChild(el)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.track, hasVideo, version])

  const muted = !participant.isMicrophoneEnabled

  return (
    <div
      data-participant-identity={participant.identity}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-[#1a1a2e] aspect-video flex items-center justify-center transition-all duration-200",
        // Speaking ring — pulsing colored border like Google Meet
        isSpeaking && !muted
          ? "ring-[3px] ring-emerald-400 ring-offset-2 ring-offset-[#1a1a2e] shadow-[0_0_16px_2px_rgba(52,211,153,0.35)]"
          : "ring-1 ring-white/10",
        className,
      )}
    >
      {/* Video or avatar */}
      {hasVideo && publication?.track ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* Avatar with speaking pulse animation */}
          <div
            className={cn(
              "relative w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-headline-md text-lg select-none transition-transform duration-200",
              isSpeaking && !muted && "scale-110",
            )}
          >
            {getInitials(participant.name || "Guest")}
            {/* Speaking rings around avatar */}
            {isSpeaking && !muted && (
              <>
                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
                <span className="absolute -inset-1.5 rounded-full border-2 border-emerald-400/50 animate-pulse" />
              </>
            )}
          </div>
          <span className="font-label-sm text-label-sm text-white/50 text-xs">
            Camera off
          </span>
        </div>
      )}

      {/* Hand raised badge */}
      {handRaised && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-amber-500/90 text-white rounded-full px-2.5 py-1 shadow text-xs font-medium">
          <span className="material-symbols-outlined text-[15px]">back_hand</span>
          Hand raised
        </div>
      )}

      {/* Emoji reactions */}
      {(reactions ?? []).map((reaction) => (
        <span
          key={reaction.id}
          className="absolute right-3 bottom-10 text-[30px] animate-bounce pointer-events-none drop-shadow-lg"
        >
          {reaction.emoji}
        </span>
      ))}

      {/* Speaking waveform bars (shown when actively speaking and mic on) */}
      {isSpeaking && !muted && (
        <div className="absolute top-2 right-2 flex items-end gap-[3px] h-4">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-emerald-400"
              style={{
                height: `${20 + i * 15}%`,
                animation: `speakBar ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Footer bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <span className="font-label-sm text-white text-xs truncate drop-shadow">
          {participant.name || "Guest"}
          {isLocal ? " (You)" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          {participant.isScreenShareEnabled && (
            <span className="material-symbols-outlined text-[15px] text-blue-300">
              present_to_all
            </span>
          )}
          <span
            className={cn(
              "material-symbols-outlined text-[15px] transition-colors",
              muted ? "text-red-400" : isSpeaking ? "text-emerald-400" : "text-white/80",
            )}
          >
            {muted ? "mic_off" : "mic"}
          </span>
        </div>
      </div>
    </div>
  )
}
