import { cn } from "@/lib/utils"
import { useMeetingTranscript } from "@/hooks/use-meeting-chat"
import { TranscriptStatusBadge } from "./MeetingStatusBadge"

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const statusMessages: Record<string, string> = {
  PENDING: "The transcript will appear here after the meeting ends.",
  PROCESSING: "Transcribing the recording… this usually takes a minute or two.",
  FAILED: "The transcript could not be generated. The recording is still available.",
}

export function TranscriptPanel({ meetingId, className }: { meetingId: string; className?: string }) {
  const { data, isLoading } = useMeetingTranscript(meetingId)
  const status = data?.status ?? "PENDING"
  const segments = data?.segments ?? []

  return (
    <div className={cn("flex flex-col h-full bg-surface-container-lowest", className)}>
      <div className="px-md py-sm border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">article</span>
          <h2 className="font-label-lg text-label-lg text-on-surface">Transcript</h2>
        </div>
        <TranscriptStatusBadge status={status} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-md space-y-3">
          {isLoading && status === "PENDING" && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Loading…</p>
          )}

          {!isLoading && segments.length === 0 && (
            <div className="text-center py-lg">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant block mb-2">
                {status === "FAILED" ? "error_outline" : "notes"}
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant">{statusMessages[status] ?? ""}</p>
            </div>
          )}

          {segments.map((segment, index) => (
            <div key={`${segment.startMs}-${index}`} className="flex gap-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 mt-0.5 tabular-nums">
                {formatTimestamp(segment.startMs)}
              </span>
              <p className="font-body-md text-body-md text-on-surface">{segment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
