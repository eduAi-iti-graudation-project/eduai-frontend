import { describe, expect, it } from "vitest"
import { membershipRequestsQueryKey } from "@/hooks/use-membership-requests"

describe("membership requests query key", () => {
  it("defaults to PENDING", () => {
    expect(membershipRequestsQueryKey()).toEqual(["membership-requests", "PENDING"])
  })

  it("uses the given status", () => {
    expect(membershipRequestsQueryKey("APPROVED")).toEqual(["membership-requests", "APPROVED"])
  })
})
