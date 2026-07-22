import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useMaterials(classId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["materials", classId],
    queryFn: () => api.getMaterials(classId),
    enabled: !!classId,
  })

  const upload = useMutation({
    mutationFn: ({ title, file }: { title: string; file: File }) =>
      api.uploadMaterial(title, classId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", classId] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", classId] })
    },
  })

  return {
    materials: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    upload,
    remove,
    refetch: query.refetch,
  }
}

export function useMaterialSearch(classId: string, q: string, topK?: number) {
  return useQuery({
    queryKey: ["materials", classId, "search", q, topK],
    queryFn: () => api.searchMaterials(classId, q, topK),
    enabled: !!classId && !!q,
  })
}
