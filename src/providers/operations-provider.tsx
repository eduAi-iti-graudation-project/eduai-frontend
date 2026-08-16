import { useCallback, useMemo, useState, type ReactNode } from "react"
import { OperationsContext, type OperationsContextType, type Operation } from "./operations-context"

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([])

  const register = useCallback<OperationsContextType["register"]>((op) => {
    setOperations((prev) => {
      if (prev.some((existing) => existing.id === op.id)) return prev
      return [...prev, { ...op, status: "running" }]
    })
  }, [])

  const update = useCallback<OperationsContextType["update"]>((id, patch) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, ...patch } : op)),
    )
  }, [])

  const remove = useCallback<OperationsContextType["remove"]>((id) => {
    setOperations((prev) => prev.filter((op) => op.id !== id))
  }, [])

  const value = useMemo<OperationsContextType>(
    () => ({ operations, register, update, remove }),
    [operations, register, update, remove],
  )

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>
}