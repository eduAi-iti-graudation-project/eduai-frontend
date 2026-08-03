import { describe, expect, it } from "vitest"
import axios from "axios"
import { getErrorMessage, getErrorStatus } from "./api"

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
