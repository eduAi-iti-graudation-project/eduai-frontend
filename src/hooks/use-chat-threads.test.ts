import { describe, expect, it } from "vitest"
import { chatThreadsQueryKey } from "@/hooks/use-chat-threads"

describe("chat threads query key", () => {
  it("uses ['chat-threads']", () => {
    expect(chatThreadsQueryKey()).toEqual(["chat-threads"])
  })
})
