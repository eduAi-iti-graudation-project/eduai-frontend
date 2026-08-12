import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
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

export function useGenerateLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: api.GenerateLabInput) => api.generateLab(input),
    onSuccess: () => {
      invalidateLabs(queryClient)
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