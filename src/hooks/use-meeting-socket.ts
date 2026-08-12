import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { API_URL, getStoredToken, type MeetingMessage, type MeetingTranscript } from "@/lib/api"

let sharedSocket: Socket | null = null

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(`${API_URL}/meeting`, { auth: { token: getStoredToken() } })
  }
  return sharedSocket
}

export interface MeetingSocketHandlers {
  onMessage: (message: MeetingMessage) => void
  onTranscript: (payload: MeetingTranscript) => void
}

export function useMeetingSocket(
  meetingId: string | undefined,
  handlers: MeetingSocketHandlers,
): { connected: boolean } {
  const [connected, setConnected] = useState(() => getSocket().connected)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      setConnected(true)
      if (meetingId) socket.emit("meeting:join", { meetingId })
    }
    const onDisconnect = () => setConnected(false)
    const onMessage = (message: MeetingMessage) => {
      if (message.meetingId === meetingId) handlersRef.current.onMessage(message)
    }
    const onTranscript = (payload: MeetingTranscript) => {
      handlersRef.current.onTranscript(payload)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("meeting:message", onMessage)
    socket.on("meeting:transcript", onTranscript)

    if (!socket.connected) {
      socket.connect()
    } else if (meetingId) {
      socket.emit("meeting:join", { meetingId })
    }

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("meeting:message", onMessage)
      socket.off("meeting:transcript", onTranscript)
      if (meetingId) socket.emit("meeting:leave", { meetingId })
    }
  }, [meetingId])

  return { connected }
}
