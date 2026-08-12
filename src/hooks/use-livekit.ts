import { useCallback, useEffect, useRef, useState } from "react"
import {
  Room,
  RoomEvent,
  type LocalParticipant,
  type Participant,
  type RemoteParticipant,
  type RoomConnectOptions,
} from "livekit-client"

export interface Reaction {
  id: string
  identity: string
  emoji: string
}

export interface DataPayload {
  type: "emoji" | "hand" | "hand-cancel"
  emoji?: string
  name?: string
}

export interface LivekitCall {
  connecting: boolean
  connected: boolean
  error: string | null
  localParticipant: LocalParticipant | null
  participants: Participant[]
  raisedHands: Record<string, boolean>
  reactions: Reaction[]
  toggleMic: () => void
  toggleCam: () => void
  toggleScreenShare: () => void
  setHandRaised: (up: boolean) => void
  sendEmoji: (emoji: string) => void
  switchCamera: (deviceId: string) => Promise<void>
  switchMic: (deviceId: string) => Promise<void>
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

export function useLivekitCall(
  url: string | undefined,
  token: string | undefined,
  roomName: string | undefined,
  devices?: { cameraId?: string; micId?: string },
): LivekitCall {
  const roomRef = useRef<Room | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null)
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({})
  const [reactions, setReactions] = useState<Reaction[]>([])
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

  const preferredDevices = useRef<{ cameraId?: string; micId?: string }>({})
  useEffect(() => {
    preferredDevices.current = {
      cameraId: devices?.cameraId || undefined,
      micId: devices?.micId || undefined,
    }
  }, [devices?.cameraId, devices?.micId])

  useEffect(() => {
    if (!url || !token || !roomName) return
    const key = `${url}|${token}|${roomName}`
    if (sharedConnection && sharedConnection.key !== key) {
      teardownSharedConnection()
    }
    if (!sharedConnection) {
      sharedConnection = { key, room: new Room() }
    }
    const room = sharedConnection.room
    roomRef.current = room

    const onParticipant = () => refresh(room)
    const onTrack = () => bump()
    const onConnected = () => {
      setConnected(true)
      refresh(room)
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
      .on(RoomEvent.LocalTrackPublished, onTrack)
      .on(RoomEvent.LocalTrackUnpublished, onTrack)
      .on(RoomEvent.ActiveSpeakersChanged, onTrack)
      .on(RoomEvent.DataReceived, onData)
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

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipant)
      room.off(RoomEvent.ParticipantDisconnected, onParticipant)
      room.off(RoomEvent.TrackSubscribed, onTrack)
      room.off(RoomEvent.TrackUnsubscribed, onTrack)
      room.off(RoomEvent.TrackMuted, onTrack)
      room.off(RoomEvent.TrackUnmuted, onTrack)
      room.off(RoomEvent.TrackPublished, onTrack)
      room.off(RoomEvent.TrackUnpublished, onTrack)
      room.off(RoomEvent.LocalTrackPublished, onTrack)
      room.off(RoomEvent.LocalTrackUnpublished, onTrack)
      room.off(RoomEvent.ActiveSpeakersChanged, onTrack)
      room.off(RoomEvent.DataReceived, onData)
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

  const toggleMic = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    const turningOn = !participant.isMicrophoneEnabled
    void participant.setMicrophoneEnabled(
      turningOn,
      turningOn && preferredDevices.current.micId
        ? { deviceId: preferredDevices.current.micId }
        : undefined,
    )
  }, [])

  const toggleCam = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    const turningOn = !participant.isCameraEnabled
    void participant.setCameraEnabled(
      turningOn,
      turningOn && preferredDevices.current.cameraId
        ? { deviceId: preferredDevices.current.cameraId }
        : undefined,
    )
  }, [])

  const toggleScreenShare = useCallback(() => {
    const participant = roomRef.current?.localParticipant
    if (!participant) return
    void participant.setScreenShareEnabled(!participant.isScreenShareEnabled)
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
    await roomRef.current?.localParticipant.setCameraEnabled(true, { deviceId })
  }, [])

  const switchMic = useCallback(async (deviceId: string) => {
    await roomRef.current?.localParticipant.setMicrophoneEnabled(true, { deviceId })
  }, [])

  const disconnect = useCallback(() => {
    void roomRef.current?.disconnect()
  }, [])

  const connecting = Boolean(url && token && roomName && !connected && !error)

  return {
    connecting,
    connected,
    error,
    localParticipant,
    participants,
    raisedHands,
    reactions,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    setHandRaised,
    sendEmoji,
    switchCamera,
    switchMic,
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
