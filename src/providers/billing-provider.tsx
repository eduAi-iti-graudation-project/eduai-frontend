import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { SubscriptionRequirement } from "@/lib/api"
import { BillingContext } from "./billing-context"

const SUBSCRIPTION_REQUIRED_EVENT = "eduai:subscription-required"

export function BillingProvider({ children }: { children: ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [requiredTier, setRequiredTier] = useState<string | null>(null)

  const openUpgrade = useCallback((tier?: string) => {
    setRequiredTier(tier ?? null)
    setUpgradeOpen(true)
  }, [])

  const closeUpgrade = useCallback(() => setUpgradeOpen(false), [])

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<SubscriptionRequirement>).detail
      if (detail.kind === "subscription") {
        setRequiredTier(null)
      } else if (detail.kind === "tier") {
        setRequiredTier(detail.tier)
      }
      setUpgradeOpen(true)
    }
    window.addEventListener(SUBSCRIPTION_REQUIRED_EVENT, handleEvent)
    return () => window.removeEventListener(SUBSCRIPTION_REQUIRED_EVENT, handleEvent)
  }, [])

  const value = {
    requiredTier,
    upgradeOpen,
    openUpgrade,
    closeUpgrade,
  }

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}
