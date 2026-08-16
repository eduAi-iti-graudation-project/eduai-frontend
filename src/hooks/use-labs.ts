import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import { useOperations, useOperationId, useOperation } from "@/providers/use-operations"
import * as api from "@/lib/api"
import { toast } from "sonner"

const LABS_KEY = ["labs"]

export function useLabs(courseOfferingId?: string) {
  const query = useQuery({
    queryKey: [...LABS_KEY, courseOfferingId ?? "all"],
    queryFn: () => api.getLabs(courseOfferingId),
    // Generation is a single blocking request, but a refresh mid-flight (or a
    // leftover GENERATING row from a dropped tab) should resolve itself.
    refetchInterval: (q) =>
      (q.state.data as api.Lab[] | undefined)?.some((lab) => lab.status === "GENERATING")
        ? 5000
        : false,
  })

  return {
    labs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useLab(id: string) {
  return useQuery({
    queryKey: [...LABS_KEY, id],
    queryFn: () => api.getLab(id),
    enabled: !!id,
    refetchInterval: (q) =>
      (q.state.data as api.Lab | undefined)?.status === "GENERATING" ? 5000 : false,
  })
}

function invalidateLabs(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: LABS_KEY })
}

/**
 * Streaming lab generation. `mutate(data, handlers?)` fires the request
 * fire-and-forget; live progress is exposed via `step`/`lastToolStep` and the
 * agent graph while `isLoading`. Progress lives in the global operations
 * store so it survives navigation — the SSE stream keeps writing even after
 * the page unmounts, and returning to the page re-reads the live step.
 */
export function useGenerateLab() {
  const queryClient = useQueryClient()
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("lab-generate")
  const active = useOperation("lab-generate")
  const step = (active?.step ?? null) as api.LabAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.LabAgentStep | null
  const isLoading = active?.status === "running"

  const mutate = useCallback(
    (
      data: api.GenerateLabInput,
      handlers?: {
        onDone?: (result: api.GenerateLabResponse) => void
        onError?: (err: Error) => void
      },
    ) => {
      register({
        id: operationId,
        kind: "lab-generate",
        label: "Generating lab…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamGenerateLab(data, {
          onStep: (s) => {
            update(operationId, { step: s, lastToolStep: s !== "thinking" ? s : null })
          },
          onDone: (result) => {
            remove(operationId)
            if (result.labId) invalidateLabs(queryClient)
            handlers?.onDone?.(result)
          },
        })
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
          handlers?.onError?.(err)
        })
    },
    [operationId, register, update, remove, queryClient],
  )

  return { mutate, isPending: isLoading, isLoading, step, lastToolStep }
}

/**
 * Streaming iterative refinement. `mutate(id, instruction, handlers?)` asks
 * the AI to modify the EXISTING generated code in place (never a from-scratch
 * regeneration) and re-checks it against the sandbox guards.
 */
export function useRefineLab() {
  const queryClient = useQueryClient()
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("lab-refine")
  const active = useOperation("lab-refine")
  const step = (active?.step ?? null) as api.LabAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.LabAgentStep | null
  const isLoading = active?.status === "running"

  const mutate = useCallback(
    (
      id: string,
      instruction: string,
      handlers?: {
        onDone?: (result: api.GenerateLabResponse) => void
        onError?: (err: Error) => void
      },
    ) => {
      register({
        id: operationId,
        kind: "lab-refine",
        label: "Refining lab…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamRefineLab(id, instruction, {
          onStep: (s) => {
            update(operationId, { step: s, lastToolStep: s !== "thinking" ? s : null })
          },
          onDone: (result) => {
            remove(operationId)
            if (result.labId) invalidateLabs(queryClient)
            handlers?.onDone?.(result)
          },
        })
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
          handlers?.onError?.(err)
        })
    },
    [operationId, register, update, remove, queryClient],
  )

  return { mutate, isPending: isLoading, isLoading, step, lastToolStep }
}

/**
 * Streaming in-place restart. `mutate(id, handlers?)` throws away the current
 * content and asks the AI for a FRESH lab grounded in the same unit — use this
 * instead of refine when a lab is beyond repair.
 */
export function useRegenerateLab() {
  const queryClient = useQueryClient()
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("lab-regenerate")
  const active = useOperation("lab-regenerate")
  const step = (active?.step ?? null) as api.LabAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.LabAgentStep | null
  const isLoading = active?.status === "running"

  const mutate = useCallback(
    (
      id: string,
      handlers?: {
        onDone?: (result: api.GenerateLabResponse) => void
        onError?: (err: Error) => void
      },
    ) => {
      register({
        id: operationId,
        kind: "lab-regenerate",
        label: "Regenerating lab…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamRegenerateLab(id, {
          onStep: (s) => {
            update(operationId, { step: s, lastToolStep: s !== "thinking" ? s : null })
          },
          onDone: (result) => {
            remove(operationId)
            if (result.labId) invalidateLabs(queryClient)
            handlers?.onDone?.(result)
          },
        })
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
          handlers?.onError?.(err)
        })
    },
    [operationId, register, update, remove, queryClient],
  )

  return { mutate, isPending: isLoading, isLoading, step, lastToolStep }
}

export function useDeleteLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteLab(id),
    onSuccess: () => {
      invalidateLabs(queryClient)
      toast.success("Lab deleted.")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function usePublishLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.publishLab(id),
    onSuccess: () => {
      invalidateLabs(queryClient)
      toast.success("Lab published — students can now run it.")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRejectLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.rejectLab(id, notes),
    onSuccess: () => {
      invalidateLabs(queryClient)
      toast.success("Lab rejected.")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useTeacherOfferings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["teacher-offerings", user?.id],
    queryFn: () => api.getTeacherOfferings(user!.id),
    enabled: !!user?.id,
  })
}

export function useTeacherOfferingNameMap(): Map<string, string> {
  const offerings = useTeacherOfferings()
  const map = new Map<string, string>()
  for (const offering of offerings.data ?? []) {
    map.set(offering.id, `${offering.course.name} · ${offering.section.name}`)
  }
  return map
}