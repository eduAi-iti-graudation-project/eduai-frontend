import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { API_URL, getStoredToken, type ChatMessage } from "@/lib/api"

let sharedSocket: Socket | null = null

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(`${API_URL}/chat`, { auth: { token: getStoredToken() } })
  }
  return sharedSocket
}

export interface ChatSocketHandlers {
  onJoined: (items: ChatMessage[]) => void
  onMessage: (message: ChatMessage) => void
}

export function useChatSocket(
  threadId: string | undefined,
  handlers: ChatSocketHandlers,
): { connected: boolean; socket: Socket } {
  const [connected, setConnected] = useState(() => getSocket().connected)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      setConnected(true)
      if (threadId) socket.emit("thread:join", { threadId })
    }
    const onDisconnect = () => setConnected(false)
    const onJoined = (payload: { threadId: string; items: ChatMessage[] }) => {
      if (payload.threadId === threadId) handlersRef.current.onJoined(payload.items)
    }
    const onMessage = (message: ChatMessage) => {
      if (message.threadId === threadId) handlersRef.current.onMessage(message)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("thread:joined", onJoined)
    socket.on("thread:message", onMessage)

    if (!socket.connected) {
      socket.connect()
    } else if (threadId) {
      socket.emit("thread:join", { threadId })
    }

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("thread:joined", onJoined)
      socket.off("thread:message", onMessage)
      if (threadId) socket.emit("thread:leave", { threadId })
    }
  }, [threadId])

  return { connected, socket: getSocket() }
}
