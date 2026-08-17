import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { PLANS, TRIAL, TRIAL_DAYS, formatSeats, useStartCheckout } from "./plans"

const { useAuth, createCheckoutSession, toast } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  createCheckoutSession: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}))

const navigate = vi.fn()
const assign = vi.fn()

vi.mock("@/providers/use-auth", () => ({ useAuth }))
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }))
vi.mock("./api", () => ({ createCheckoutSession }))
vi.mock("sonner", () => ({ toast }))

describe("plans catalog", () => {
  it("mirrors the backend plan catalog pricing and seats", () => {
    const byId = Object.fromEntries(PLANS.map((plan) => [plan.id, plan]))
    expect(byId.basic.priceCents).toBe(5000)
    expect(byId.basic.seats).toBe(30)
    expect(byId.pro.priceCents).toBe(12000)
    expect(byId.pro.seats).toBe(100)
    expect(byId.enterprise.priceCents).toBe(30000)
    expect(byId.enterprise.seats).toBe(500)
    expect(byId.pro.featured).toBe(true)
  })

  it("keeps a strict feature hierarchy across tiers", () => {
    const has = (id: (typeof PLANS)[number]["id"], feature: string) =>
      PLANS.find((plan) => plan.id === id)!.features.some((f) => f.includes(feature))
    for (const core of ["AI grading", "Curriculum materials", "Attendance tracking", "Struggle-signal alerts"]) {
      expect(has("basic", core)).toBe(true)
    }
    for (const pro of ["AI assistant", "AI quiz", "automated reports", "Labs & study lab"]) {
      expect(has("pro", pro)).toBe(true)
    }
    for (const ent of ["Advanced dashboard insights", "Dedicated support"]) {
      expect(has("enterprise", ent)).toBe(true)
    }
  })

  it("trial is free, 14 days, and unlimited seats", () => {
    expect(TRIAL.price).toBe("$0")
    expect(TRIAL_DAYS).toBe(14)
    expect(formatSeats(TRIAL.seats)).toBe("Unlimited")
  })

  it("formats seat limits", () => {
    expect(formatSeats(30)).toBe("30 seats")
    expect(formatSeats(null)).toBe("Unlimited")
  })
})

describe("useStartCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", {
      writable: true,
      value: { assign },
    })
  })

  afterEach(() => cleanup())

  it("sends guests to /signup", async () => {
    useAuth.mockReturnValue({ user: null })
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current("pro"))

    expect(navigate).toHaveBeenCalledWith("/signup")
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it("blocks non-admin users with a toast", async () => {
    useAuth.mockReturnValue({ user: { role: "TEACHER", id: "t-1" } })
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current("pro"))

    expect(toast.error).toHaveBeenCalledWith("Only an organization admin can purchase a plan.")
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("starts a Stripe checkout and redirects for an admin", async () => {
    useAuth.mockReturnValue({ user: { role: "ADMIN", id: "a-1" } })
    createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/xyz" })
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current("enterprise"))

    expect(createCheckoutSession).toHaveBeenCalledWith("enterprise")
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/xyz")
    expect(navigate).not.toHaveBeenCalled()
  })

  it("toasts when checkout returns no URL", async () => {
    useAuth.mockReturnValue({ user: { role: "ADMIN", id: "a-1" } })
    createCheckoutSession.mockResolvedValue({ url: "" })
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current("basic"))

    expect(toast.error).toHaveBeenCalledWith(
      "Checkout is not available right now. Please try again.",
    )
    expect(assign).not.toHaveBeenCalled()
  })

  it("toasts when checkout fails", async () => {
    useAuth.mockReturnValue({ user: { role: "ADMIN", id: "a-1" } })
    createCheckoutSession.mockRejectedValue(new Error("This plan is not available for purchase right now."))
    const { result } = renderHook(() => useStartCheckout())

    await act(() => result.current("basic"))

    expect(toast.error).toHaveBeenCalledWith(
      "This plan is not available for purchase right now.",
    )
  })
})