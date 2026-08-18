import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Room,
  RoomEvent,
  Track,
  type LocalParticipant,
  type LocalTrackPublication,
  type Participant,
  type RemoteParticipant,
  type RoomConnectOptions,
} from "livekit-client"

export interface Reaction {
  id: string
  identity: string
  emoji: string
}

export interface LiveTranscriptSegment {
  id: string
  speakerName: string
  text: string
  timestampMs: number
}

export interface DataPayload {
  type: "emoji" | "hand" | "hand-cancel" | "transcript"
  emoji?: string
  name?: string
  text?: string
  timestampMs?: number
}

export interface LivekitCall {
  connecting: boolean
  connected: boolean
  error: string | null
  mediaError: string | null
  localParticipant: LocalParticipant | null
  participants: Participant[]
  /** Live local publish state — ground truth for the control bar and tiles. */
  trackStates: { camera: boolean; mic: boolean; screen: boolean }
  raisedHands: Record<string, boolean>
  reactions: Reaction[]
  liveTranscripts: LiveTranscriptSegment[]
  toggleMic: () => void
  toggleCam: () => void
  toggleScreenShare: () => void
  setHandRaised: (up: boolean) => void
  sendEmoji: (emoji: string) => void
  switchCamera: (deviceId: string) => Promise<void>
  switchMic: (deviceId: string) => Promise<void>
  clearMediaError: () => void
  disconnect: () => void
}

function isHandRaise(payload: DataPayload): boolean {
  return payload.type === "hand" || payload.type === "hand-cancel"
}

/**
 * One LiveKit room per (url, token, roomName) tuple, shared across hook
 * instances. React StrictMode mounts effects twice in dev; a Room created
 * inside the effect lifecycle gets orphaned mid-connect, leaving a ghost
 * room whose participant never sees the published tracks. Keeping the
 * connection at module scope makes every mount reuse the same room and
 * its single in-flight connection.
 */
interface SharedConnection {
  key: string
  room: Room
}

let sharedConnection: SharedConnection | null = null

function teardownSharedConnection(): void {
  if (!sharedConnection) return
  const { room } = sharedConnection
  sharedConnection = null
  room.removeAllListeners()
  void room.disconnect()
}

/** Settle a promise or reject with a clear message after `ms`. Clears the timer. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (cause) => {
        window.clearTimeout(timer)
        reject(cause)
      },
    )
  })
}

export function useLivekitCall(
  url: string | undefined,
  token: string | undefined,
  roomName: string | undefined,
  devices?: { cameraId?: string; micId?: string },
  speechLang?: "ar-EG" | "en-US",
): LivekitCall {
  const roomRef = useRef<Room | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null)
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({})
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscriptSegment[]>([])
  // Bump on any track/mute event so tiles re-read participant state.
  const [, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const refresh = useCallback(
    (room: Room) => {
      setLocalParticipant(room.localParticipant)
      setParticipants([...room.remoteParticipants.values()])
      bump()
    },
    [bump],
  )

  const clearHand = useCallback((identity: string) => {
    setRaisedHands((prev) => {
      if (!prev[identity]) return prev
      const next = { ...prev }
      delete next[identity]
      return next
    })
  }, [])

  const clearMediaError = useCallback(() => setMediaError(null), [])

  const preferredDevices = useRef<{ cameraId?: string; micId?: string }>({})
  const lastKeyRef = useRef<string | null>(null)
  useEffect(() => {
    preferredDevices.current = {
      cameraId: devices?.cameraId || undefined,
      micId: devices?.micId || undefined,
    }
  }, [devices?.cameraId, devices?.micId])

  const toggleMic = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    // Base the intent on the live publication's mute state (same ground truth
    // as the control bar) rather than participant.isMicrophoneEnabled, which
    // can disagree with the actual publication after reconnects/mutes.
    const pub = participant.getTrackPublication(Track.Source.Microphone)
    const turningOn = !(pub && !pub.isMuted)
    void participant
      .setMicrophoneEnabled(
        turningOn,
        turningOn && preferredDevices.current.micId
          ? { deviceId: preferredDevices.current.micId }
          : undefined,
      )
      .then((publication) => {
        if (turningOn && publication) setMediaError(null)
        if (turningOn && !publication) {
          // setMicrophoneEnabled resolved without a track (e.g. it waited on a
          // stuck in-flight publish and timed out internally) — say so instead
          // of silently doing nothing.
          window.setTimeout(() => {
            if (!participant.isMicrophoneEnabled && !participant.getTrackPublication(Track.Source.Microphone)) {
              setMediaError("Microphone start timed out — try again or rejoin the meeting.")
            }
          }, 1500)
        }
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "Could not toggle the microphone"
        setMediaError(message)
        toast.error(message)
      })
  }, [])

  const toggleCam = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    // Same ground truth as the control bar: presence + not muted. Basing this
    // on participant.isCameraEnabled caused a mute-only no-op when that flag
    // disagreed with the actual publication state.
    const pub = participant.getTrackPublication(Track.Source.Camera)
    const turningOn = !(pub && !pub.isMuted)
    void participant
      .setCameraEnabled(
        turningOn,
        turningOn && preferredDevices.current.cameraId
          ? { deviceId: preferredDevices.current.cameraId }
          : undefined,
      )
      .then((publication) => {
        if (turningOn && publication) setMediaError(null)
        if (turningOn && !publication) {
          window.setTimeout(() => {
            if (!participant.isCameraEnabled && !participant.getTrackPublication(Track.Source.Camera)) {
              setMediaError("Camera start timed out — try again or rejoin the meeting.")
            }
          }, 1500)
        }
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "Could not toggle the camera"
        setMediaError(message)
        toast.error(message)
      })
  }, [])

  const toggleScreenShare = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    const pub = participant.getTrackPublication(Track.Source.ScreenShare)
    const turningOn = !(pub && !pub.isMuted)
    void participant
      .setScreenShareEnabled(turningOn)
      .then((publication) => {
        if (turningOn && publication) setMediaError(null)
        if (turningOn && !publication) {
          window.setTimeout(() => {
            if (!participant.isScreenShareEnabled && !participant.getTrackPublication(Track.Source.ScreenShare)) {
              setMediaError("Screen share start timed out — try again or rejoin the meeting.")
            }
          }, 1500)
        }
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "Could not share the screen"
        setMediaError(message)
        toast.error(message)
      })
  }, [])

  useEffect(() => {
    if (!url || !token || !roomName) return
    const key = `${url}|${token}|${roomName}`
    if (sharedConnection && sharedConnection.key !== key) {
      teardownSharedConnection()
    }
    if (!sharedConnection) {
      sharedConnection = { key, room: new Room() }
      console.info(`[livekit] created room for ${roomName}`)
    }
    const room = sharedConnection.room
    roomRef.current = room

    if (lastKeyRef.current !== key) {
      // A new meeting/room — drop any participant state left over from the
      // previous connection so stale LocalParticipant objects never render.
      lastKeyRef.current = key
      setLocalParticipant(null)
      setParticipants([])
      setRaisedHands({})
      setReactions([])
      setLiveTranscripts([])
      setMediaError(null)
      setError(null)
    }

    const onParticipant = () => refresh(room)
    const onTrack = () => bump()
    const onLocalTrackPublished = (publication: LocalTrackPublication) => {
      console.info(`[livekit] local track published: ${publication.source} (muted=${publication.isMuted})`)
      bump()
    }
    const onMediaDevicesError = (cause: Error, kind?: MediaDeviceKind) => {
      const label = kind === "audioinput" ? "Microphone" : "Camera"
      const message = cause instanceof Error ? cause.message : "Unknown media device error"
      console.warn(`[livekit] media device error (${label}):`, cause)
      setMediaError(`${label} failed to start: ${message}`)
      toast.error(`${label} failed to start: ${message}`)
    }
    const onConnected = () => {
      setConnected(true)
      refresh(room)
      console.info(
        `[livekit] connected sid=${room.localParticipant?.sid} camPub=${Boolean(room.localParticipant?.getTrackPublication(Track.Source.Camera))} isCamEnabled=${room.localParticipant?.isCameraEnabled}`,
      )
      const local = room.localParticipant
      if (!local) return
      const camId = preferredDevices.current.cameraId
      const micId = preferredDevices.current.micId
      const enableMedia = async () => {
        const camPub = local.getTrackPublication(Track.Source.Camera)
        const micPub = local.getTrackPublication(Track.Source.Microphone)
        const wantCam = !(camPub && !camPub.isMuted)
        const wantMic = !(micPub && !micPub.isMuted)
        if (!wantCam && !wantMic) return
        if (wantCam) await local.setCameraEnabled(true, camId ? { deviceId: camId } : undefined)
        if (wantMic) await local.setMicrophoneEnabled(true, micId ? { deviceId: micId } : undefined)
      }
      void withTimeout(
        enableMedia(),
        15_000,
        "Timed out while starting the camera and microphone — check your browser's camera/mic permission and try again.",
      ).catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "Could not start the camera or microphone"
        console.warn("[livekit] auto-enable camera/mic failed:", cause)
        setMediaError(message)
      })
    }
    const onDisconnected = () => {
      setConnected(false)
      if (sharedConnection?.room === room) {
        sharedConnection = null
        roomRef.current = null
      }
    }
    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      if (!participant) return
      let data: DataPayload
      try {
        data = JSON.parse(new TextDecoder().decode(payload)) as DataPayload
      } catch {
        return
      }
      if (isHandRaise(data)) {
        if (data.type === "hand") {
          setRaisedHands((prev) => ({ ...prev, [participant.identity]: true }))
        } else {
          clearHand(participant.identity)
        }
      } else if (data.type === "emoji" && data.emoji) {
        const reaction: Reaction = {
          id: `${participant.identity}-${Date.now()}`,
          identity: participant.identity,
          emoji: data.emoji,
        }
        setReactions((prev) => [...prev.slice(-8), reaction])
        window.setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
        }, 3200)
      } else if (data.type === "transcript" && data.text) {
        const segment: LiveTranscriptSegment = {
          id: `${participant.identity}-${Date.now()}`,
          speakerName: data.name || participant.name || "Guest",
          text: data.text,
          timestampMs: data.timestampMs || Date.now(),
        }
        setLiveTranscripts((prev) => [...prev, segment])
      }
    }

    room
      .on(RoomEvent.ParticipantConnected, onParticipant)
      .on(RoomEvent.ParticipantDisconnected, onParticipant)
      .on(RoomEvent.TrackSubscribed, onTrack)
      .on(RoomEvent.TrackUnsubscribed, onTrack)
      .on(RoomEvent.TrackMuted, onTrack)
      .on(RoomEvent.TrackUnmuted, onTrack)
      .on(RoomEvent.TrackPublished, onTrack)
      .on(RoomEvent.TrackUnpublished, onTrack)
      .on(RoomEvent.LocalTrackPublished, onLocalTrackPublished)
      .on(RoomEvent.LocalTrackUnpublished, onTrack)
      .on(RoomEvent.ActiveSpeakersChanged, onTrack)
      .on(RoomEvent.DataReceived, onData)
      .on(RoomEvent.MediaDevicesError, onMediaDevicesError)
      .on(RoomEvent.Connected, onConnected)
      .on(RoomEvent.Disconnected, onDisconnected)

    const connectOptions: RoomConnectOptions = { autoSubscribe: true }
    const connectPromise =
      room.state === "disconnected"
        ? room.connect(url, token, connectOptions)
        : Promise.resolve()
    connectPromise.catch((cause: unknown) => {
      if (sharedConnection?.room === room) sharedConnection = null
      setError(
        cause instanceof Error ? cause.message : "Could not join the room",
      )
    })

    // The room may already be connected when this effect runs (StrictMode
    // remount, or a re-render reusing a live room) — make sure media enable
    // still runs, not only on a fresh Connected event.
    if (room.state === "connected") onConnected()

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipant)
      room.off(RoomEvent.ParticipantDisconnected, onParticipant)
      room.off(RoomEvent.TrackSubscribed, onTrack)
      room.off(RoomEvent.TrackUnsubscribed, onTrack)
      room.off(RoomEvent.TrackMuted, onTrack)
      room.off(RoomEvent.TrackUnmuted, onTrack)
      room.off(RoomEvent.TrackPublished, onTrack)
      room.off(RoomEvent.TrackUnpublished, onTrack)
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished)
      room.off(RoomEvent.LocalTrackUnpublished, onTrack)
      room.off(RoomEvent.ActiveSpeakersChanged, onTrack)
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError)
      room.off(RoomEvent.Connected, onConnected)
      room.off(RoomEvent.Disconnected, onDisconnected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token, roomName, devices?.cameraId, devices?.micId])

  const publish = useCallback(async (payload: DataPayload) => {
    const room = roomRef.current
    if (!room?.localParticipant) return
    await room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(payload)),
      { reliable: true },
    )
  }, [])

  const setHandRaised = useCallback(
    (up: boolean) => {
      void publish({ type: up ? "hand" : "hand-cancel" })
      const identity = roomRef.current?.localParticipant.identity
      if (!identity) return
      if (up) {
        setRaisedHands((prev) => ({ ...prev, [identity]: true }))
      } else {
        clearHand(identity)
      }
    },
    [publish, clearHand],
  )

  const sendEmoji = useCallback(
    (emoji: string) => {
      const identity = roomRef.current?.localParticipant.identity ?? "me"
      const reaction: Reaction = { id: `${identity}-${Date.now()}`, identity, emoji }
      setReactions((prev) => [...prev.slice(-8), reaction])
      window.setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
      }, 3200)
      void publish({ type: "emoji", emoji })
    },
    [publish],
  )

  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      const publication = await roomRef.current?.localParticipant.setCameraEnabled(true, { deviceId })
      if (publication) setMediaError(null)
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Could not switch the camera"
      setMediaError(message)
      toast.error(message)
    }
  }, [])

  const switchMic = useCallback(async (deviceId: string) => {
    try {
      const publication = await roomRef.current?.localParticipant.setMicrophoneEnabled(true, { deviceId })
      if (publication) setMediaError(null)
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Could not switch the microphone"
      setMediaError(message)
      toast.error(message)
    }
  }, [])

  const disconnect = useCallback(() => {
    void roomRef.current?.disconnect()
  }, [])

  const connecting = Boolean(url && token && roomName && !connected && !error)

  // Read publication state off the localParticipant object held in state (the
  // LiveKit object's tracks are mutated live; re-renders triggered by bump()
  // pick up the fresh state without touching the room ref during render).
  const trackOn = (source: Track.Source) => {
    const pub = localParticipant?.getTrackPublication(source)
    return Boolean(pub && !pub.isMuted)
  }
  const trackStates = {
    camera: trackOn(Track.Source.Camera),
    mic: trackOn(Track.Source.Microphone),
    screen: trackOn(Track.Source.ScreenShare),
  }

  // Real-time Web Speech Recognition (Live Captions & Live Transcript)
  useEffect(() => {
    if (!connected || !trackStates.mic) return
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition

    if (!SpeechRecognition) return

    // Resolve the actual BCP-47 language tag (default ar-EG)
    const resolvedLang = speechLang || "ar-EG"

    let recognition: any = null
    try {
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true // Show intermediate results for better UX
      recognition.lang = resolvedLang

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim()
            if (text) {
              const speakerName = roomRef.current?.localParticipant?.name || "You"
              const segment: LiveTranscriptSegment = {
                id: `${roomRef.current?.localParticipant?.identity || "me"}-${Date.now()}`,
                speakerName,
                text,
                timestampMs: Date.now(),
              }
              setLiveTranscripts((prev) => [...prev, segment])
              void publish({
                type: "transcript",
                text,
                name: speakerName,
                timestampMs: segment.timestampMs,
              })
            }
          }
        }
      }

      recognition.onerror = (ev: any) => {
        // "no-speech" is normal in quiet periods — just restart
        if (ev.error === "no-speech" || ev.error === "audio-capture") return
        console.warn(`[speech] recognition error: ${ev.error as string}`)
      }

      // Auto-restart when the session ends (browser stops after ~60s of silence)
      recognition.onend = () => {
        if (recognition._stopped) return
        try { recognition.start() } catch { /* already restarting */ }
      }

      recognition.start()
    } catch {
      // SpeechRecognition already active or unavailable
    }

    return () => {
      if (recognition) {
        recognition._stopped = true
        try {
          recognition.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [connected, trackStates.mic, publish, speechLang])

  return {
    connecting,
    connected,
    error,
    mediaError,
    localParticipant,
    participants,
    trackStates,
    raisedHands,
    reactions,
    liveTranscripts,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    setHandRaised,
    sendEmoji,
    switchCamera,
    switchMic,
    clearMediaError,
    disconnect,
  }
}

export function useMediaDevices() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        if (cancelled) return
        setCameras(devices.filter((d) => d.kind === "videoinput"))
        setMics(devices.filter((d) => d.kind === "audioinput"))
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No media devices available")
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { cameras, mics, error }
}
