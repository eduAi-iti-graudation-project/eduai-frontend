import { describe, expect, it, vi, afterEach } from "vitest"
import { streamGenerateLab } from "./api"

describe("lab generation SSE watchdog", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("force-clears a hung stream after the timeout instead of spinning forever", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    // A stream that never sends a terminal event — simulating a provider or
    // proxy that wedged after the backend's own retries were exhausted.
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"type":"step","step":"thinking"}\n\n'),
            )
          },
        }),
        { status: 200 },
      ),
    )

    const onStep = vi.fn()
    const onDone = vi.fn()
    const promise = streamGenerateLab(
      { courseOfferingIds: ["offering-0001"], chapterId: "unit-0001", prompt: "pendulums" },
      { onStep, onDone },
    )

    // Nothing has ended the stream yet — no done/error event was seen.
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onDone).not.toHaveBeenCalled()
    expect(onStep).toHaveBeenCalledWith("thinking")

    // Attach the rejection handler BEFORE the watchdog fires so the timed-out
    // rejection is observed (not reported as unhandled), then advance past the
    // 10-minute cap — the watchdog aborts the stream and throws.
    const settled = expect(promise).rejects.toThrow("Lab generation timed out")
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
    await settled
    expect(onDone).not.toHaveBeenCalled()
  })
})