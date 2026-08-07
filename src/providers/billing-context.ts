import { createContext } from "react"

export interface BillingContextValue {
  requiredTier: string | null
  upgradeOpen: boolean
  openUpgrade: (requiredTier?: string) => void
  closeUpgrade: () => void
}

export const BillingContext = createContext<BillingContextValue | undefined>(undefined)
