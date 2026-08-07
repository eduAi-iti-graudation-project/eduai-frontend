import { describe, expect, it } from "vitest"
import axios from "axios"
import {
  getErrorMessage,
  getErrorStatus,
  getErrorCode,
  getSubscriptionRequirement,
  isAuthEndpointUrl,
  shouldExpireSession,
  SESSION_EXPIRED_EVENT,
} from "./api"

function axiosError(payload: {
  status?: number
  data?: unknown
  network?: boolean
  timeout?: boolean
}): Error {
  const error = new axios.AxiosError(
    payload.network
      ? payload.timeout
        ? "timeout of 10000ms exceeded"
        : "Network Error"
      : `Request failed with status code ${payload.status ?? 500}`,
    undefined,
    undefined,
    undefined,
    payload.network
      ? undefined
      : ({
          status: payload.status ?? 500,
          data: payload.data,
        } as never),
  )
  return error
}

describe("getErrorMessage", () => {
  it("uses a meaningful backend message verbatim", () => {
    expect(
      getErrorMessage(axiosError({ status: 401, data: { message: "Invalid login credentials" } })),
    ).toBe("Invalid login credentials")
  })

  it("joins array backend messages", () => {
    expect(
      getErrorMessage(axiosError({ status: 400, data: { message: ["email must be an email", "name is required"] } })),
    ).toBe("email must be an email, name is required")
  })

  it("maps generic backend 401 to a session message", () => {
    expect(
      getErrorMessage(axiosError({ status: 401, data: { message: "Unauthorized" } })),
    ).toBe("Your session has expired. Please log in again.")
  })

  it("maps 403 to a permission message", () => {
    expect(
      getErrorMessage(axiosError({ status: 403, data: { message: "Forbidden" } })),
    ).toBe("You don't have permission to do that.")
  })

  it("maps 404 without a message to a not-found message", () => {
    expect(getErrorMessage(axiosError({ status: 404, data: {} }))).toBe(
      "This item could not be found — it may have been removed.",
    )
  })

  it("maps 5xx to a server-side message without leaking internals", () => {
    expect(getErrorMessage(axiosError({ status: 500 }))).toBe(
      "Something went wrong on our side. Please try again in a moment.",
    )
  })

  it("maps network failures to a connection message", () => {
    expect(getErrorMessage(axiosError({ network: true }))).toBe(
      "Cannot reach the server. Check your connection and try again.",
    )
  })

  it("maps timeouts to a timeout message", () => {
    expect(getErrorMessage(axiosError({ network: true, timeout: true }))).toBe(
      "The request timed out. Please try again.",
    )
  })

  it("falls back for plain errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
    expect(getErrorMessage("junk")).toBe("Something went wrong")
  })
})

describe("getErrorStatus", () => {
  it("extracts the HTTP status from an error", () => {
    expect(getErrorStatus(axiosError({ status: 409 }))).toBe(409)
    expect(getErrorStatus(axiosError({ network: true }))).toBeUndefined()
    expect(getErrorStatus(new Error("plain"))).toBeUndefined()
  })
})

describe("getErrorCode", () => {
  it("extracts the backend error code from the envelope", () => {
    expect(
      getErrorCode(axiosError({ status: 404, data: { code: "JOIN_CODE_INVALID", message: "not valid" } })),
    ).toBe("JOIN_CODE_INVALID")
  })

  it("returns undefined when no code is present", () => {
    expect(getErrorCode(axiosError({ status: 400, data: { message: "bad" } }))).toBeUndefined()
    expect(getErrorCode(axiosError({ network: true }))).toBeUndefined()
    expect(getErrorCode(new Error("plain"))).toBeUndefined()
  })
})

describe("getSubscriptionRequirement", () => {
  it("returns 'subscription' for a 402 with the subscription-required code", () => {
    expect(
      getSubscriptionRequirement(
        axiosError({
          status: 402,
          data: {
            code: "SUBSCRIPTION_REQUIRED",
            message: "Your organization needs an active subscription to continue using EduAI.",
          },
        }),
      ),
    ).toEqual({ kind: "subscription" })
  })

  it("returns 'subscription' for a 402 whose message mentions an active subscription", () => {
    expect(
      getSubscriptionRequirement(
        axiosError({ status: 402, data: { message: "An active subscription is required to access this resource" } }),
      ),
    ).toEqual({ kind: "subscription" })
  })

  it("treats a seat-limit 402 as not subscription-related", () => {
    expect(
      getSubscriptionRequirement(
        axiosError({
          status: 402,
          data: {
            code: "INVITE_SEATS_FULL",
            message: "Your organization has reached its seat limit. Upgrade to invite more members.",
          },
        }),
      ),
    ).toEqual({ kind: "none" })
  })

  it("returns the required tier for a 403 tier-gating message", () => {
    expect(
      getSubscriptionRequirement(
        axiosError({ status: 403, data: { message: "This feature requires the Enterprise plan or higher" } }),
      ),
    ).toEqual({ kind: "tier", tier: "Enterprise" })
  })

  it("treats unrelated 403s as not subscription-related", () => {
    expect(
      getSubscriptionRequirement(axiosError({ status: 403, data: { message: "Forbidden" } })),
    ).toEqual({ kind: "none" })
  })

  it("returns 'none' for non-subscription errors and plain errors", () => {
    expect(getSubscriptionRequirement(axiosError({ status: 400 }))).toEqual({ kind: "none" })
    expect(getSubscriptionRequirement(axiosError({ network: true }))).toEqual({ kind: "none" })
    expect(getSubscriptionRequirement(new Error("boom"))).toEqual({ kind: "none" })
  })
})

describe("isAuthEndpointUrl", () => {
  it("excludes login and signup URLs so their 401s never expire the session", () => {
    expect(isAuthEndpointUrl("/auth/login")).toBe(true)
    expect(isAuthEndpointUrl("/auth/signup")).toBe(true)
  })

  it("treats protected endpoint URLs as session-expiring", () => {
    expect(isAuthEndpointUrl("/auth/me")).toBe(false)
    expect(isAuthEndpointUrl("/organizations/me")).toBe(false)
    expect(isAuthEndpointUrl("/classes/1/submissions")).toBe(false)
  })

  it("treats a missing URL as protected (conservative default)", () => {
    expect(isAuthEndpointUrl(undefined)).toBe(false)
  })
})

describe("SESSION_EXPIRED_EVENT", () => {
  it("names the event the provider listens for", () => {
    expect(SESSION_EXPIRED_EVENT).toBe("eduai:session-expired")
  })
})

describe("shouldExpireSession", () => {
  it("expires the session on a 401 from a protected endpoint when a token exists", () => {
    expect(shouldExpireSession(401, "/auth/me", true)).toBe(true)
    expect(shouldExpireSession(401, "/organizations/me", true)).toBe(true)
  })

  it("never expires the session for login or signup 401s", () => {
    expect(shouldExpireSession(401, "/auth/login", true)).toBe(false)
    expect(shouldExpireSession(401, "/auth/signup", true)).toBe(false)
  })

  it("ignores 401s when there is no token (expected unauthenticated calls)", () => {
    expect(shouldExpireSession(401, "/organizations/me", false)).toBe(false)
  })

  it("ignores non-401 statuses", () => {
    expect(shouldExpireSession(403, "/auth/me", true)).toBe(false)
    expect(shouldExpireSession(404, "/auth/me", true)).toBe(false)
    expect(shouldExpireSession(undefined, "/auth/me", true)).toBe(false)
  })
})
