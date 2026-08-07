import { describe, expect, it } from "vitest"
import { organizationQueryKey } from "@/hooks/use-organization"

describe("organization query key", () => {
  it("uses ['organization']", () => {
    expect(organizationQueryKey()).toEqual(["organization"])
  })
})
