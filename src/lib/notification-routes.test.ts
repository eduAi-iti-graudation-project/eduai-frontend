import { describe, it, expect } from "vitest"
import { notificationTargetPath } from "./notification-routes"

const notification = (overrides: Record<string, unknown>) =>
  ({ type: "BROADCAST", title: "x", body: null, data: null, ...overrides }) as never

describe("notificationTargetPath", () => {
  it("routes HOMEWORK_HELP_REDIRECT for teachers to the thread in data", () => {
    const threadId = "eccf18ba-6ced-4a37-954b-64a495257d18"
    expect(
      notificationTargetPath(
        notification({
          type: "HOMEWORK_HELP_REDIRECT",
          data: { threadId, studentId: "stu-1", studentName: "Abdalla Ehab" },
        }),
        "TEACHER",
      ),
    ).toBe(`/chat/${threadId}`)
  })

  it("routes HOMEWORK_HELP_REDIRECT from the thread id embedded in the body", () => {
    const threadId = "eccf18ba-6ced-4a37-954b-64a495257d18"
    expect(
      notificationTargetPath(
        notification({
          type: "HOMEWORK_HELP_REDIRECT",
          body: `Student asked: "search the internet for hints on this assignment"\n\nYou can reply to them in the class chat thread: ${threadId}`,
        }),
        "TEACHER",
      ),
    ).toBe(`/chat/${threadId}`)
  })

  it("falls back to the chat inbox for HOMEWORK_HELP_REDIRECT without a thread id", () => {
    expect(
      notificationTargetPath(
        notification({ type: "HOMEWORK_HELP_REDIRECT", body: "No thread here" }),
        "TEACHER",
      ),
    ).toBe("/chat")
  })

  it("does not route HOMEWORK_HELP_REDIRECT for students", () => {
    expect(
      notificationTargetPath(
        notification({
          type: "HOMEWORK_HELP_REDIRECT",
          data: { threadId: "eccf18ba-6ced-4a37-954b-64a495257d18" },
        }),
        "STUDENT",
      ),
    ).toBeNull()
  })
})