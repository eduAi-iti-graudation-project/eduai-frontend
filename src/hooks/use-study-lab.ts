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
  })
}

export function useStudyLabGeneration(generationId: string | null) {
  const [generation, setGeneration] = useState<api.StudyGeneration | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIdRef = useRef(0)

  useEffect(() => {
    if (!generationId) return

    const poll = async () => {
      const currentPollId = ++pollIdRef.current
      setIsLoading(true)
      try {
        const next = await api.getStudyLabGeneration(generationId)
        if (currentPollId !== pollIdRef.current) return
        setGeneration(next)
        if (next.status === "READY" || next.status === "FAILED") {
          if (timerRef.current) clearInterval(timerRef.current)
        }
      } catch {
        // transient — keep polling
      } finally {
        if (currentPollId === pollIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    void poll()
    timerRef.current = setInterval(poll, 4000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      pollIdRef.current++
    }
  }, [generationId])

  return { generation, isLoading }
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
