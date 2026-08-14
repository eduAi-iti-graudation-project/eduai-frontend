import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useHomeworkHelpHistory(courseOfferingId?: string) {
  return useQuery({
    queryKey: ["homework-help", "history", courseOfferingId ?? "all"],
    queryFn: () => api.getHomeworkHelpHistory(courseOfferingId),
  })
}
