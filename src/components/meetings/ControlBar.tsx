import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { LivekitCall } from "@/hooks/use-livekit"

const EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🙌", "🤔", "😮"]

interface ControlBarProps {
  call: LivekitCall
  isHost: boolean
  recordingEnabled: boolean
  recordingIndicator: boolean
  chatOpen: boolean
  transcriptOpen: boolean
  onToggleChat: () => void
  onToggleTranscript: () => void
  onToggleRecording: () => void
  onLeave: () => void
  onEnd: () => void
  className?: string
}

interface ControlButtonProps {
  label: string
  icon: string
  active?: boolean
  destructive?: boolean
  onClick: () => void
}

function ControlButton({ label, icon, active, destructive, onClick }: ControlButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            destructive
              ? "bg-red-500 text-white hover:bg-red-600"
              : active
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-inverse-surface text-white hover:bg-white/15",
          )}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ControlBar({
  call,
  isHost,
  recordingEnabled,
  recordingIndicator,
  chatOpen,
  transcriptOpen,
  onToggleChat,
  onToggleTranscript,
  onToggleRecording,
  onLeave,
  onEnd,
  className,
}: ControlBarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const micOn = call.localParticipant?.isMicrophoneEnabled ?? false
  const camOn = call.localParticipant?.isCameraEnabled ?? false
  const screenOn = call.localParticipant?.isScreenShareEnabled ?? false
  const handUp = call.raisedHands[call.localParticipant?.identity ?? ""]

  return (
    <div className={cn("flex items-center justify-center gap-3 px-lg py-base flex-wrap", className)}>
      <ControlButton label={micOn ? "Mute microphone" : "Unmute microphone"} icon={micOn ? "mic" : "mic_off"} active={!micOn} onClick={call.toggleMic} />
      <ControlButton label={camOn ? "Turn camera off" : "Turn camera on"} icon={camOn ? "videocam" : "videocam_off"} active={!camOn} onClick={call.toggleCam} />
      <ControlButton label={screenOn ? "Stop sharing screen" : "Share screen"} icon="present_to_all" active={screenOn} onClick={call.toggleScreenShare} />
      <ControlButton label={handUp ? "Lower hand" : "Raise hand"} icon={handUp ? "back_hand" : "pan_tool"} active={handUp} onClick={() => call.setHandRaised(!handUp)} />

      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-inverse-surface text-white hover:bg-white/15 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-inverse-surface border-white/15 p-2">
          <div className="flex gap-1.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="w-9 h-9 rounded-lg hover:bg-white/10 text-[20px]"
                onClick={() => {
                  call.sendEmoji(emoji)
                  setEmojiOpen(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-8 bg-white/15" />

      {isHost && (
        <ControlButton
          label={recordingEnabled ? "Stop recording" : "Start recording"}
          icon="fiber_manual_record"
          active={recordingEnabled}
          onClick={onToggleRecording}
        />
      )}
      <ControlButton label="In-meeting chat" icon="chat_bubble" active={chatOpen} onClick={onToggleChat} />
      <ControlButton label="Transcript" icon="article" active={transcriptOpen} onClick={onToggleTranscript} />

      <div className="w-px h-8 bg-white/15" />

      {isHost ? (
        <Button variant="destructive" className="rounded-full h-12" onClick={onEnd}>
          <span className="material-symbols-outlined text-[20px] mr-1">call_end</span>
          End
        </Button>
      ) : (
        <Button variant="destructive" className="rounded-full h-12" onClick={onLeave}>
          <span className="material-symbols-outlined text-[20px] mr-1">call_end</span>
          Leave
        </Button>
      )}

      {recordingIndicator && (
        <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-red-400 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          REC
        </span>
      )}
    </div>
  )
}
