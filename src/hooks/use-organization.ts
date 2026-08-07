import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function organizationQueryKey() {
  return ["organization"] as const
}

export function useOrganization(): UseQueryResult<api.Organization> {
  return useQuery({
    queryKey: organizationQueryKey(),
    queryFn: () => api.getOrganization(),
    enabled: api.getStoredToken() !== null,
    staleTime: 1000 * 60 * 2,
  })
}

export function useChangePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, atPeriodEnd = false }: { planId: api.PlanId; atPeriodEnd?: boolean }) =>
      api.changePlan(planId, atPeriodEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKey() })
    },
  })
}
