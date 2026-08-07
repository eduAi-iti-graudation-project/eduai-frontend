import { describe, expect, it } from "vitest"
import type { ChatMessage } from "@/lib/api"
import {
  chatMessagesQueryKey,
  dedupeMessagesById,
  markCounterpartyRead,
} from "@/hooks/use-chat-messages"

function message(id: string, authorId: string, readAt: string | null = null): ChatMessage {
  return {
    id,
    threadId: "thread-1",
    authorId,
    text: id,
    readAt,
    createdAt: "2026-01-01T00:00:00Z",
  }
}

describe("chat messages query key", () => {
  it("uses ['chat-threads', threadId, 'messages']", () => {
    expect(chatMessagesQueryKey("thread-1")).toEqual(["chat-threads", "thread-1", "messages"])
  })
})

describe("dedupeMessagesById", () => {
  it("lets the latest copy of a duplicate id win (upsert semantics)", () => {
    const first = message("msg-1", "student-1")
    const dup = { ...message("msg-1", "student-1"), text: "updated text" }
    expect(dedupeMessagesById([first, dup])).toEqual([dup])
  })

  it("preserves order across upserts", () => {
    const a = message("msg-1", "student-1")
    const b = message("msg-2", "teacher-1")
    const c = message("msg-3", "student-1")
    expect(dedupeMessagesById([a, c, b])).toEqual([a, c, b])
  })

  it("handles an empty list", () => {
    expect(dedupeMessagesById([])).toEqual([])
  })
})

describe("markCounterpartyRead", () => {
  it("marks only the counterparty's unread messages as read", () => {
    const mine = message("msg-1", "student-1")
    const theirsUnread = message("msg-2", "teacher-1")
    const theirsRead = message("msg-3", "teacher-1", "2026-01-01T00:00:01Z")
    const result = markCounterpartyRead([mine, theirsUnread, theirsRead], "student-1", "2026-01-01T00:00:02Z")
    expect(result[0].readAt).toBeNull()
    expect(result[1].readAt).toBe("2026-01-01T00:00:02Z")
    expect(result[2].readAt).toBe("2026-01-01T00:00:01Z")
  })

  it("does not mark messages the current user authored", () => {
    const mine = message("msg-1", "student-1")
    const result = markCounterpartyRead([mine], "student-1", "2026-01-01T00:00:02Z")
    expect(result[0].readAt).toBeNull()
  })
})
