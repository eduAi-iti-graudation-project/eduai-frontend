import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { UpgradeDialog } from "@/components/billing/UpgradeDialog"

const { useAuth, useOrganization, createCheckoutSession, changePlan } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useOrganization: vi.fn(),
  createCheckoutSession: vi.fn(),
  changePlan: vi.fn(),
}))

vi.mock("@/providers/use-auth", () => ({ useAuth }))
vi.mock("@/hooks/use-organization", () => ({ useOrganization }))
vi.mock("@/lib/api", () => ({ createCheckoutSession, changePlan }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const assign = vi.fn()

function renderDialog(requiredTier: string | null = null) {
  const onOpenChange = vi.fn()
  render(<UpgradeDialog open onOpenChange={onOpenChange} requiredTier={requiredTier} />)
  return { onOpenChange }
}

function planButton(name: string): HTMLButtonElement {
  return screen.getByRole("button", { name: new RegExp(name) }) as HTMLButtonElement
}

describe("UpgradeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", {
      writable: true,
      value: { assign },
    })
    useAuth.mockReturnValue({ user: { role: "ADMIN", id: "admin-1" } })
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "TRIALING", subscriptionTier: "TRIAL", seatLimit: null },
    })
    createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/xyz" })
    changePlan.mockResolvedValue({ planId: "pro", status: "ACTIVE", cancelAtPeriodEnd: false })
  })

  afterEach(() => cleanup())

  it("tells non-admin users to ask an administrator", () => {
    useAuth.mockReturnValue({ user: { role: "TEACHER", id: "teacher-1" } })
    renderDialog("pro")
    expect(screen.getByText(/ask an administrator/i)).toBeTruthy()
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(changePlan).not.toHaveBeenCalled()
  })

  it("starts a checkout when the org has no active subscription", async () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "TRIALING", subscriptionTier: "TRIAL", seatLimit: null },
    })
    renderDialog("pro")

    fireEvent.click(planButton("Pro"))
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith("pro"))
    expect(changePlan).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/xyz")
  })

  it("switches the existing subscription via changePlan for an active org", async () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "ACTIVE", subscriptionTier: "BASIC", seatLimit: 30 },
    })
    const { onOpenChange } = renderDialog("pro")

    fireEvent.click(planButton("Pro"))
    await waitFor(() => expect(changePlan).toHaveBeenCalledWith("pro"))
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      "Plan update scheduled — your organization is now on Pro.",
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("only offers tiers strictly above the current one for an active org", () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "ACTIVE", subscriptionTier: "PRO", seatLimit: 100 },
    })
    renderDialog(null)

    expect(planButton("Basic").disabled).toBe(true)
    expect(planButton("Pro").disabled).toBe(true)
    expect(planButton("Enterprise").disabled).toBe(false)
  })

  it("keeps the requiredTier floor while allowing higher tiers", () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "ACTIVE", subscriptionTier: "BASIC", seatLimit: 30 },
    })
    renderDialog("pro")

    expect(planButton("Basic").disabled).toBe(true)
    expect(planButton("Pro").disabled).toBe(false)
    expect(planButton("Enterprise").disabled).toBe(false)
  })

  it("shows only the Enterprise plan for a school in a group", () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "TRIALING", subscriptionTier: "TRIAL", groupId: "group-1", seatLimit: null },
    })
    renderDialog("pro")

    expect(screen.queryByRole("button", { name: /basic/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /pro/i })).toBeNull()
    expect(planButton("Enterprise").disabled).toBe(false)
    expect(screen.getByText(/group billed on the Enterprise plan/i)).toBeTruthy()
  })

  it("starts an Enterprise checkout for a grouped school", async () => {
    useOrganization.mockReturnValue({
      data: { subscriptionStatus: "TRIALING", subscriptionTier: "TRIAL", groupId: "group-1", seatLimit: null },
    })
    renderDialog("pro")

    fireEvent.click(planButton("Enterprise"))
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith("enterprise"))
    expect(changePlan).not.toHaveBeenCalled()
  })

  it("switches a grouped active org to Enterprise via changePlan", async () => {
    useOrganization.mockReturnValue({
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "BASIC",
        groupId: "group-1",
        seatLimit: null,
      },
    })
    const { onOpenChange } = renderDialog("pro")

    fireEvent.click(planButton("Enterprise"))
    await waitFor(() => expect(changePlan).toHaveBeenCalledWith("enterprise"))
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})