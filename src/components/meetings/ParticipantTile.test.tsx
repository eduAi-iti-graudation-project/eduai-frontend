import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { Track, type Participant, type TrackPublication } from "livekit-client"
import { ParticipantTile } from "@/components/meetings/ParticipantTile"

afterEach(cleanup)

function makeTrack(enabled = true) {
  return {
    attach: vi.fn(() => document.createElement("video")),
    detach: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    mediaStreamTrack: { enabled } as MediaStreamTrack,
  } as unknown as TrackPublication["track"]
}

function makeParticipant(publications: TrackPublication[], overrides: Partial<Participant> = {}) {
  return {
    identity: "p1",
    name: "Test User",
    getTrackPublications: () => publications,
    getTrackPublication: (source: Track.Source) =>
      publications.find((p) => p.source === source),
    on: vi.fn(),
    off: vi.fn(),
    isMicrophoneEnabled: true,
    isScreenShareEnabled: false,
    ...overrides,
  } as unknown as Participant
}

describe("ParticipantTile", () => {
  it("renders video when a camera track exists even if the enable flags say otherwise", () => {
    const cameraPub = {
      source: Track.Source.Camera,
      track: makeTrack(),
    } as TrackPublication
    // isCameraEnabled is false/missing, exactly the stale state that broke the tile
    const participant = makeParticipant([cameraPub], { isScreenShareEnabled: false })
    const { container } = render(<ParticipantTile participant={participant} />)
    expect(screen.queryByText("Camera off")).not.toBeInTheDocument()
    expect(container.querySelector("video")).not.toBeNull()
  })

  it("shows the avatar when no video track exists", () => {
    const participant = makeParticipant([])
    render(<ParticipantTile participant={participant} />)
    expect(screen.getByText("Camera off")).toBeInTheDocument()
    expect(screen.getByText("TU")).toBeInTheDocument()
  })

  it("prefers the screen share track over the camera track", () => {
    const screenPub = {
      source: Track.Source.ScreenShare,
      track: makeTrack(),
    } as TrackPublication
    const cameraPub = {
      source: Track.Source.Camera,
      track: makeTrack(),
    } as TrackPublication
    const participant = makeParticipant([cameraPub, screenPub])
    const { container } = render(<ParticipantTile participant={participant} />)
    expect(screenPub.track?.attach).toHaveBeenCalled()
    expect(cameraPub.track?.attach).not.toHaveBeenCalled()
    expect(container.querySelector("video")).not.toBeNull()
  })

  it("shows the avatar when the camera media is actually disabled (real mute)", () => {
    const cameraPub = {
      source: Track.Source.Camera,
      track: makeTrack(false),
    } as TrackPublication
    const participant = makeParticipant([cameraPub])
    render(<ParticipantTile participant={participant} />)
    expect(screen.getByText("Camera off")).toBeInTheDocument()
  })

  it("renders the local video when the camera is published but paused (enabled flag false)", () => {
    const cameraPub = {
      source: Track.Source.Camera,
      track: makeTrack(false),
    } as TrackPublication
    const participant = makeParticipant([cameraPub], { isCameraEnabled: true, isScreenShareEnabled: false })
    const { container } = render(<ParticipantTile participant={participant} isLocal />)
    expect(screen.queryByText("Camera off")).not.toBeInTheDocument()
    expect(container.querySelector("video")).not.toBeNull()
  })

  it("shows the avatar for the local participant when their camera is muted", () => {
    const cameraPub = {
      source: Track.Source.Camera,
      track: makeTrack(),
    } as TrackPublication
    const participant = makeParticipant([cameraPub], { isCameraEnabled: false, isScreenShareEnabled: false })
    render(<ParticipantTile participant={participant} isLocal />)
    expect(screen.getByText("Camera off")).toBeInTheDocument()
  })
})
