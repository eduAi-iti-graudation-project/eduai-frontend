import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useHomeworkHelpHistory(classId?: string) {
  return useQuery({
    queryKey: ["homework-help", "history", classId ?? "all"],
    queryFn: () => api.getHomeworkHelpHistory(classId),
  })
}
