import { describe, expect, it, vi, afterEach } from "vitest"
import { streamGuardianChat } from "./api"

describe("guardian chat SSE stream", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function stubFetch(events: string[]) {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            for (const payload of events) {
              controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`))
            }
            controller.close()
          },
        }),
        { status: 200 },
      ),
    )
  }

  it("parses step events then a done event with the reply and sources", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([
      JSON.stringify({ type: "step", step: "read_grades" }),
      JSON.stringify({ type: "step", step: "read_attendance" }),
      JSON.stringify({ type: "step", step: "thinking" }),
      JSON.stringify({
        type: "done",
        data: { reply: "**92%** attendance", sources: ["Attendance"] },
      }),
    ])

    const onStep = vi.fn()
    const onDone = vi.fn()
    await streamGuardianChat(
      { studentId: "ward-0001", messages: [{ role: "user", content: "hi" }], newMessage: "How is attendance?" },
      { onStep, onDone },
    )

    expect(onStep).toHaveBeenCalledTimes(3)
    expect(onStep).toHaveBeenNthCalledWith(1, "read_grades")
    expect(onStep).toHaveBeenNthCalledWith(2, "read_attendance")
    expect(onStep).toHaveBeenNthCalledWith(3, "thinking")
    expect(onDone).toHaveBeenCalledWith({
      reply: "**92%** attendance",
      sources: ["Attendance"],
    })
  })

  it("throws when the stream ends without a done event", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([JSON.stringify({ type: "step", step: "read_insights" })])

    const onStep = vi.fn()
    const onDone = vi.fn()
    await expect(
      streamGuardianChat(
        { studentId: "ward-0001", messages: [], newMessage: "hello" },
        { onStep, onDone },
      ),
    ).rejects.toThrow("ended unexpectedly")
    expect(onDone).not.toHaveBeenCalled()
  })

  it("throws on an explicit error event", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([JSON.stringify({ type: "error", message: "This child could not be found." })])

    const onStep = vi.fn()
    const onDone = vi.fn()
    await expect(
      streamGuardianChat(
        { studentId: "ward-0001", messages: [], newMessage: "hello" },
        { onStep, onDone },
      ),
    ).rejects.toThrow("This child could not be found.")
    expect(onDone).not.toHaveBeenCalled()
  })

  it("surfaces a non-ok response status as an error", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Upgrade required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await expect(
      streamGuardianChat(
        { studentId: "ward-0001", messages: [], newMessage: "hello" },
        { onStep: vi.fn(), onDone: vi.fn() },
      ),
    ).rejects.toThrow("Upgrade required.")
  })
})