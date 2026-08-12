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
    mutationFn: ({
      title,
      file,
      onProgress,
      chapterId,
    }: {
      title: string
      file: File
      onProgress?: (percent: number) => void
      chapterId?: string
    }) => api.uploadMaterial(title, classId, file, onProgress, undefined, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", classId] })
      queryClient.invalidateQueries({ queryKey: ["material-chapters", classId] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", classId] })
      queryClient.invalidateQueries({ queryKey: ["material-chapters", classId] })
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

export function useMaterialChapters(classId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["material-chapters", classId],
    queryFn: () => api.getMaterialChapters(classId),
    enabled: !!classId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["material-chapters", classId] })
    queryClient.invalidateQueries({ queryKey: ["materials", classId] })
  }

  const create = useMutation({
    mutationFn: (title: string) => api.createMaterialChapter(classId, title),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; order?: number } }) =>
      api.renameMaterialChapter(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMaterialChapter(id),
    onSuccess: invalidate,
  })

  const move = useMutation({
    mutationFn: ({
      materialId,
      chapterId,
      fromChapterId,
    }: {
      materialId: string
      chapterId: string | null
      fromChapterId?: string
    }) => api.moveMaterialToChapter(materialId, chapterId, fromChapterId),
    onSuccess: invalidate,
  })

  return {
    chapters: query.data?.chapters ?? [],
    unassigned: query.data?.unassigned ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create,
    update,
    remove,
    move,
  }
}

export function useMaterialSearch(classId: string, q: string, topK?: number) {
  return useQuery({
    queryKey: ["materials", classId, "search", q, topK],
    queryFn: () => api.searchMaterials(classId, q, topK),
    enabled: !!classId && !!q,
  })
}

export function useCourseMaterialChapters(courseId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["course-material-chapters", courseId],
    queryFn: () => api.getCourseMaterialChapters(courseId),
    enabled: !!courseId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["course-material-chapters", courseId] })
    queryClient.invalidateQueries({ queryKey: ["course-materials", courseId] })
    queryClient.invalidateQueries({ queryKey: ["material-chapters"] })
  }

  const create = useMutation({
    mutationFn: (title: string) => api.createCourseChapter(courseId, title),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; order?: number } }) =>
      api.renameMaterialChapter(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMaterialChapter(id),
    onSuccess: invalidate,
  })

  const move = useMutation({
    mutationFn: ({
      materialId,
      chapterId,
      fromChapterId,
    }: {
      materialId: string
      chapterId: string | null
      fromChapterId?: string
    }) => api.moveMaterialToChapter(materialId, chapterId, fromChapterId),
    onSuccess: invalidate,
  })

  return {
    chapters: query.data?.chapters ?? [],
    unassigned: query.data?.unassigned ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create,
    update,
    remove,
    move,
  }
}

export function useCourseMaterials(courseId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["course-materials", courseId],
    queryFn: () => api.getCourseMaterials(courseId),
    enabled: !!courseId,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-materials", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course-material-chapters", courseId] })
    },
  })

  return {
    materials: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    remove,
    refetch: query.refetch,
  }
}
