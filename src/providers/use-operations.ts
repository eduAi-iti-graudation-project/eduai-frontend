import { useContext, useState } from "react"
import { OperationsContext, type Operation } from "./operations-context"

export function useOperations() {
  const context = useContext(OperationsContext)
  if (!context) {
    throw new Error("useOperations must be used within an OperationsProvider")
  }
  return context
}

export function useOperationId(kind: string): string {
  const [id] = useState(() => `${kind}-${crypto.randomUUID()}`)
  return id
}

export function useOperation(kind: string): Operation | undefined {
  const { operations } = useOperations()
  // A fresh useOperationId(kind) would mint a DIFFERENT random id than the one
  // the registering hook created, so a by-id lookup could never match. Look up
  // by kind and take the most recently registered running operation instead.
  return [...operations].reverse().find((op) => op.kind === kind)
}