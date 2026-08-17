import { describe, expect, it, vi, afterEach } from "vitest"
import { streamAdminChat } from "./api"

describe("admin chat SSE stream", () => {
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

  it("parses step events then a done event with the reply, sources and conversationId", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([
      JSON.stringify({ type: "step", step: "read_overview" }),
      JSON.stringify({ type: "step", step: "read_alerts" }),
      JSON.stringify({ type: "step", step: "thinking" }),
      JSON.stringify({
        type: "done",
        data: { reply: "**2** students are flagged.", sources: ["Active alerts"], conversationId: "convo-1" },
      }),
    ])

    const onStep = vi.fn()
    const onDone = vi.fn()
    await streamAdminChat(
      { messages: [{ role: "user", content: "hi" }], newMessage: "Who is at risk?" },
      { onStep, onDone },
    )

    expect(onStep).toHaveBeenCalledTimes(3)
    expect(onStep).toHaveBeenNthCalledWith(1, "read_overview")
    expect(onStep).toHaveBeenNthCalledWith(2, "read_alerts")
    expect(onStep).toHaveBeenNthCalledWith(3, "thinking")
    expect(onDone).toHaveBeenCalledWith({
      reply: "**2** students are flagged.",
      sources: ["Active alerts"],
      conversationId: "convo-1",
    })
  })

  it("throws when the stream ends without a done event", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([JSON.stringify({ type: "step", step: "read_insights" })])

    await expect(
      streamAdminChat({ messages: [], newMessage: "hello" }, { onStep: vi.fn(), onDone: vi.fn() }),
    ).rejects.toThrow("ended unexpectedly")
  })

  it("throws on an explicit error event", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    stubFetch([JSON.stringify({ type: "error", message: "This feature requires the pro plan." })])

    await expect(
      streamAdminChat({ messages: [], newMessage: "hello" }, { onStep: vi.fn(), onDone: vi.fn() }),
    ).rejects.toThrow("This feature requires the pro plan.")
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
      streamAdminChat({ messages: [], newMessage: "hello" }, { onStep: vi.fn(), onDone: vi.fn() }),
    ).rejects.toThrow("Upgrade required.")
  })
})