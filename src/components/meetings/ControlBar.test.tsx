import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ControlBar } from "@/components/meetings/ControlBar"
import type { LivekitCall } from "@/hooks/use-livekit"

afterEach(cleanup)

function makeCall(overrides: Partial<LivekitCall> = {}): LivekitCall {
  return {
    connecting: false,
    connected: true,
    error: null,
    mediaError: null,
    localParticipant: null,
    participants: [],
    trackStates: { camera: true, mic: true, screen: false },
    raisedHands: {},
    reactions: [],
    liveTranscripts: [],
    toggleMic: vi.fn(),
    toggleCam: vi.fn(),
    toggleScreenShare: vi.fn(),
    setHandRaised: vi.fn(),
    sendEmoji: vi.fn(),
    switchCamera: vi.fn(),
    switchMic: vi.fn(),
    clearMediaError: vi.fn(),
    disconnect: vi.fn(),
    ...overrides,
  }
}

function renderBar(call: LivekitCall, props: Partial<Parameters<typeof ControlBar>[0]> = {}) {
  return render(
    <TooltipProvider>
      <ControlBar
        call={call}
        isHost
        recordingEnabled={false}
        recordingIndicator={false}
        chatOpen={false}
        transcriptOpen={false}
        onToggleChat={() => undefined}
        onToggleTranscript={() => undefined}
        onToggleRecording={() => undefined}
        onLeave={() => undefined}
        onEnd={() => undefined}
        {...props}
      />
    </TooltipProvider>,
  )
}

describe("ControlBar", () => {
  it("shows 'Start recording' when recording is off and 'Stop recording' when on", () => {
    const call = makeCall()
    const { rerender } = renderBar(call, { recordingEnabled: false })
    expect(screen.getByRole("button", { name: "Start recording" })).toBeInTheDocument()

    rerender(
      <TooltipProvider>
        <ControlBar
          call={call}
          isHost
          recordingEnabled
          recordingIndicator
          chatOpen={false}
          transcriptOpen={false}
          onToggleChat={() => undefined}
          onToggleTranscript={() => undefined}
          onToggleRecording={() => undefined}
          onLeave={() => undefined}
          onEnd={() => undefined}
        />
      </TooltipProvider>,
    )
    expect(screen.getByRole("button", { name: "Stop recording" })).toBeInTheDocument()
    expect(screen.getByText("REC")).toBeInTheDocument()
  })

  it("hides the recording button for non-hosts", () => {
    const call = makeCall()
    renderBar(call, { isHost: false })
    expect(screen.queryByRole("button", { name: /recording/i })).not.toBeInTheDocument()
  })

  it("wires camera, mic and screen-share toggles to the call", () => {
    const call = makeCall()
    renderBar(call)
    fireEvent.click(screen.getByRole("button", { name: "Turn camera off" }))
    fireEvent.click(screen.getByRole("button", { name: "Mute microphone" }))
    fireEvent.click(screen.getByRole("button", { name: "Share screen" }))
    expect(call.toggleCam).toHaveBeenCalledTimes(1)
    expect(call.toggleMic).toHaveBeenCalledTimes(1)
    expect(call.toggleScreenShare).toHaveBeenCalledTimes(1)
  })

  it("shows 'Turn camera on' when the camera track is off (muted or unpublished)", () => {
    const call = makeCall({ trackStates: { camera: false, mic: true, screen: false } })
    renderBar(call)
    expect(screen.getByRole("button", { name: "Turn camera on" })).toBeInTheDocument()
  })

  it("renders the control bar on a dark surface for contrast", () => {
    const call = makeCall()
    const { container } = renderBar(call)
    expect(container.firstChild).toHaveClass("bg-inverse-surface")
  })
})
