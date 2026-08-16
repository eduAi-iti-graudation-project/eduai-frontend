import { describe, expect, it } from "vitest"
import { PLANS, TRIAL, TRIAL_DAYS, formatSeats } from "./plans"

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