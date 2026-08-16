import { createContext } from "react"

export type OperationStatus = "running"

export interface Operation {
  id: string
  kind: string
  label: string
  step: string | null
  lastToolStep: string | null
  status: OperationStatus
}

export interface OperationsContextType {
  operations: Operation[]
  register: (op: Omit<Operation, "status">) => void
  update: (id: string, patch: Partial<Pick<Operation, "step" | "lastToolStep">>) => void
  remove: (id: string) => void
}

export const OperationsContext = createContext<OperationsContextType | null>(null)