import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { toast } from "sonner"
import { GroupManagementPage } from "./GroupManagementPage"

const { useOrganization, organizationQueryKey, createGroup, joinGroup, getGroup, getGroupInsights, createCheckoutSession } =
  vi.hoisted(() => ({
    useOrganization: vi.fn(),
    organizationQueryKey: () => ["organization"],
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    getGroup: vi.fn(),
    getGroupInsights: vi.fn(),
    createCheckoutSession: vi.fn(),
  }))

vi.mock("@/hooks/use-organization", () => ({ useOrganization, organizationQueryKey }))
vi.mock("@/lib/api", () => ({
  createGroup,
  joinGroup,
  getGroup,
  getGroupInsights,
  createCheckoutSession,
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const assign = vi.fn()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <GroupManagementPage />
    </QueryClientProvider>,
  )
}

describe("GroupManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", { writable: true, value: { assign } })
    useOrganization.mockReturnValue({
      data: { id: "org-1", name: "Demo School", subscriptionStatus: "TRIALING", subscriptionTier: "TRIAL", seatLimit: null },
      isError: false,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => cleanup())

  it("renders the create and join forms when the school is not grouped", () => {
    renderPage()

    expect(screen.getByText("Create a group")).toBeTruthy()
    expect(screen.getByText("Join a group")).toBeTruthy()
    expect(screen.getByLabelText("Group name")).toBeTruthy()
    expect(screen.getByLabelText("Join code")).toBeTruthy()
  })

  it("creates a group and routes to an Enterprise checkout when billing is required", async () => {
    createGroup.mockResolvedValue({
      id: "group-1",
      name: "Edu Chain",
      joinCode: "GROUP1234",
      requiresCheckout: true,
      action: "CHECKOUT_REQUIRED",
      message: "Subscribe to Enterprise to activate billing.",
    })
    createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/xyz" })
    renderPage()

    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "Edu Chain" } })
    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    await waitFor(() => expect(createGroup).toHaveBeenCalledWith("Edu Chain"))
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith("enterprise"))
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/xyz")
  })

  it("confirms when a group is created without a checkout", async () => {
    createGroup.mockResolvedValue({
      id: "group-1",
      name: "Edu Chain",
      joinCode: "GROUP1234",
      requiresCheckout: false,
      action: "UPGRADED",
      message: "Your school group is ready on the Enterprise plan.",
    })
    renderPage()

    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "Edu Chain" } })
    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Your school group is ready on the Enterprise plan."))
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it("joins a group by code, normalizing to uppercase", async () => {
    joinGroup.mockResolvedValue({
      id: "group-1",
      name: "Edu Chain",
      message: "Your school is now part of Edu Chain.",
    })
    renderPage()

    fireEvent.change(screen.getByLabelText("Join code"), { target: { value: "group1234" } })
    fireEvent.click(screen.getByRole("button", { name: /join group/i }))

    await waitFor(() => expect(joinGroup).toHaveBeenCalledWith("GROUP1234"))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Your school is now part of Edu Chain."))
  })

  it("surfaces an error when joining fails", async () => {
    joinGroup.mockRejectedValue(new Error("No school group matches that join code."))
    renderPage()

    fireEvent.change(screen.getByLabelText("Join code"), { target: { value: "NOPE0000" } })
    fireEvent.click(screen.getByRole("button", { name: /join group/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No school group matches that join code."))
  })

  it("shows the group, join code and schools for a grouped school", async () => {
    useOrganization.mockReturnValue({
      data: {
        id: "org-1",
        name: "Demo School",
        groupId: "group-1",
        groupName: "Edu Chain",
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "ENTERPRISE",
        seatLimit: null,
      },
      isError: false,
      isLoading: false,
      error: null,
    })
    getGroup.mockResolvedValue({
      id: "group-1",
      name: "Edu Chain",
      joinCode: "GROUP1234",
      subscriptionTier: "ENTERPRISE",
      subscriptionStatus: "ACTIVE",
      seatLimit: null,
      schools: [
        { id: "org-1", name: "Demo School", joinCode: "DEMO2026", seatUsage: 42, subscriptionTier: "ENTERPRISE" },
        { id: "org-2", name: "Branch School", joinCode: "BRANCH26", seatUsage: 17, subscriptionTier: "ENTERPRISE" },
      ],
    })
    getGroupInsights.mockResolvedValue({
      id: "group-1",
      name: "Edu Chain",
      schools: [],
      totals: { users: 59, students: 20, teachers: 20, activeAlerts: 4, quizAttempts: 10 },
    })
    renderPage()

    await waitFor(() => expect(screen.getByText("Edu Chain")).toBeTruthy())
    expect(screen.getByText(/GROUP1234/)).toBeTruthy()
    expect(screen.getByText("Demo School")).toBeTruthy()
    expect(screen.getByText("Branch School")).toBeTruthy()
    expect(screen.getByText("Invite schools to join")).toBeTruthy()
    expect(getGroupInsights).toHaveBeenCalled()
  })
})