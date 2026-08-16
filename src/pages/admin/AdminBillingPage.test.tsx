import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { AdminBillingPage } from "./AdminBillingPage"

const { useOrganization } = vi.hoisted(() => ({ useOrganization: vi.fn() }))

vi.mock("@/hooks/use-organization", () => ({ useOrganization }))
vi.mock("@/lib/api", () => ({
  createCheckoutSession: vi.fn(),
  createBillingPortal: vi.fn(),
  changePlan: vi.fn(),
}))
vi.mock("@/components/billing/InviteMemberDialog", () => ({
  InviteMemberDialog: () => null,
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function groupedOrg() {
  return {
    id: "org-1",
    name: "Demo School",
    groupId: "group-1",
    groupName: "Edu Chain",
    subscriptionStatus: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    seatLimit: null,
    userCount: 42,
  }
}

describe("AdminBillingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => cleanup())

  it("shows every plan card for a standalone school", async () => {
    useOrganization.mockReturnValue({
      data: {
        id: "org-1",
        name: "Demo School",
        subscriptionStatus: "TRIALING",
        subscriptionTier: "TRIAL",
        seatLimit: null,
        userCount: 12,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminBillingPage />)

    expect(screen.getByRole("heading", { name: "Basic" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Pro" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Enterprise" })).toBeTruthy()
    expect(screen.queryByText(/part of Edu Chain/i)).toBeNull()
  })

  it("shows a group banner and only the Enterprise plan for a grouped school", async () => {
    useOrganization.mockReturnValue({
      data: groupedOrg(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminBillingPage />)

    expect(screen.getByText(/Your school is part of Edu Chain/)).toBeTruthy()
    expect(screen.getByRole("button", { name: /manage group/i })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Enterprise" })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Basic" })).toBeNull()
    expect(screen.queryByRole("heading", { name: "Pro" })).toBeNull()
  })
})