import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { toast } from "sonner"

export function useStudyLabOfferings() {
  return useQuery({
    queryKey: ["study-lab", "offerings"],
    queryFn: api.getStudyLabOfferings,
  })
}

export function useGenerateStudyLab() {
  const queryClient = useQueryClient()

  const generate = useMutation({
    mutationFn: (input: api.GenerateStudyLabInput) =>
      api.generateStudyLab(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-lab", "history"] })
      toast.success("Generation started — you'll be notified when it's ready.")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return generate
}

export function useStudyLabHistory(courseOfferingId?: string) {
  return useQuery({
    queryKey: ["study-lab", "history", courseOfferingId ?? "all"],
    queryFn: () => api.getStudyLabHistory(courseOfferingId),
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.some(
        (item) => item.status === "PROCESSING",
      )
      return hasProcessing ? 3000 : false
    },
  })
}

export function useRetryStudyLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (generationId: string) => api.retryStudyLab(generationId),
    onSuccess: (_, generationId) => {
      queryClient.invalidateQueries({ queryKey: ["study-lab", "history"] })
      queryClient.invalidateQueries({ queryKey: ["study-lab", "generation", generationId] })
      toast.success("Retrying generation...")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useStudyLabGeneration(generationId: string | null) {
  const [generation, setGeneration] = useState<api.StudyGeneration | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIdRef = useRef(0)

  const poll = async () => {
    if (!generationId) return
    const currentPollId = ++pollIdRef.current
    setIsLoading(true)
    try {
      const next = await api.getStudyLabGeneration(generationId)
      if (currentPollId !== pollIdRef.current) return
      setGeneration(next)
      if (next.status === "READY" || next.status === "FAILED") {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    } catch {
      // transient — keep polling
    } finally {
      if (currentPollId === pollIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!generationId) return

    const initialPoll = setTimeout(poll, 0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(poll, 3000)

    return () => {
      clearTimeout(initialPoll)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      pollIdRef.current++
    }
  }, [generationId])

  const refetch = () => {
    if (!generationId) return
    // Optimistically update status to PROCESSING so UI shows stage indicator immediately
    setGeneration((prev) =>
      prev ? { ...prev, status: "PROCESSING", stage: "QUEUED", error: null } : null,
    )
    void poll()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(poll, 3000)
  }

  return { generation, isLoading, refetch }
}

export function useDeleteStudyLabGeneration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteStudyLabGeneration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-lab", "history"] })
      toast.success("Deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
