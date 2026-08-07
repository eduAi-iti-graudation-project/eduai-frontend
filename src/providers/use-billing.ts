import { useContext } from "react"
import { BillingContext, type BillingContextValue } from "./billing-context"

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext)
  if (!ctx) {
    throw new Error("useBilling must be used within a BillingProvider")
  }
  return ctx
}
