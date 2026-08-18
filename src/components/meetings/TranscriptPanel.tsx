import { cn } from "@/lib/utils"
import { useMeetingTranscript } from "@/hooks/use-meeting-chat"
import { TranscriptStatusBadge } from "./MeetingStatusBadge"
import type { LiveTranscriptSegment } from "@/hooks/use-livekit"

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function formatLiveTime(timestampMs: number): string {
  const date = new Date(timestampMs)
  return date.toLocaleTimeString(undefined, { minute: "2-digit", second: "2-digit" })
}

const statusMessages: Record<string, string> = {
  PENDING: "Speak into your microphone during the meeting or check back after it ends.",
  PROCESSING: "Transcribing the recording… this usually takes a minute or two.",
  FAILED: "The transcript could not be generated. The recording is still available.",
}

interface TranscriptPanelProps {
  meetingId: string
  liveSegments?: LiveTranscriptSegment[]
  className?: string
}

export function TranscriptPanel({ meetingId, liveSegments, className }: TranscriptPanelProps) {
  const { data, isLoading } = useMeetingTranscript(meetingId)
  const status = data?.status ?? "PENDING"
  const dbSegments = data?.segments ?? []

  const hasLive = Boolean(liveSegments && liveSegments.length > 0)
  const hasDB = dbSegments.length > 0

  return (
    <div className={cn("flex flex-col h-full bg-surface-container-lowest", className)}>
      <div className="px-md py-sm border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">article</span>
          <h2 className="font-label-lg text-label-lg text-primary">Transcript</h2>
        </div>
        {hasLive ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        ) : (
          <TranscriptStatusBadge status={status} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-md space-y-3">
          {isLoading && status === "PENDING" && !hasLive && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Loading…</p>
          )}

          {!isLoading && !hasDB && !hasLive && (
            <div className="text-center py-lg">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant block mb-2">
                {status === "FAILED" ? "error_outline" : "speech_to_text"}
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {statusMessages[status] ?? ""}
              </p>
            </div>
          )}

          {/* Database / Saved Transcript Segments */}
          {dbSegments.map((segment, index) => (
            <div key={`db-${segment.startMs}-${index}`} className="flex gap-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 mt-0.5 tabular-nums">
                {formatTimestamp(segment.startMs)}
              </span>
              <p className="font-body-md text-body-md text-on-surface">{segment.text}</p>
            </div>
          ))}

          {/* Real-time Live Speech Captions */}
          {hasLive &&
            liveSegments?.map((segment) => (
              <div key={segment.id} className="flex flex-col gap-0.5 bg-surface-container-low p-2.5 rounded-xl border border-border/40">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold text-primary">{segment.speakerName}</span>
                  <span className="text-[10px] tabular-nums">{formatLiveTime(segment.timestampMs)}</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface mt-0.5">{segment.text}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
