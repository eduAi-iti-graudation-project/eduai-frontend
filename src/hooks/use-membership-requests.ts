import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function membershipRequestsQueryKey(status: api.MembershipRequestStatus = "PENDING") {
  return ["membership-requests", status] as const
}

export function useMembershipRequests(
  status: api.MembershipRequestStatus = "PENDING",
): UseQueryResult<api.MembershipRequest[]> {
  return useQuery({
    queryKey: membershipRequestsQueryKey(status),
    queryFn: () => api.getMembershipRequests(status),
  })
}
