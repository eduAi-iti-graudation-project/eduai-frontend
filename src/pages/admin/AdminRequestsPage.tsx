import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { getErrorCode } from "@/lib/api"
import { useOrganization } from "@/hooks/use-organization"
import { useMembershipRequests } from "@/hooks/use-membership-requests"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Status = api.MembershipRequestStatus

const TABS: { value: Status; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const EMPTY_MESSAGES: Record<Status, string> = {
  PENDING: "No pending requests.",
  APPROVED: "No approved requests yet.",
  REJECTED: "No rejected requests.",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminRequestsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>("PENDING")
  const [roleOverrides, setRoleOverrides] = useState<Record<string, api.MembershipRole>>({})
  const [requestToReject, setRequestToReject] = useState<api.MembershipRequest | null>(null)
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false)
  const [seatLimitWarning, setSeatLimitWarning] = useState(false)

  const orgQuery = useOrganization()
  const requestsQuery = useMembershipRequests(status)

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["membership-requests"] })
    queryClient.invalidateQueries({ queryKey: ["organization"] })
    queryClient.invalidateQueries({ queryKey: ["users"] })
  }

  const approveMutation = useMutation({
    mutationFn: ({ requestId, role }: { requestId: string; role: api.MembershipRole }) =>
      api.approveMembershipRequest(requestId, role),
    onSuccess: (res) => {
      toast.success(`${res.name} was approved and can now sign in.`)
      setSeatLimitWarning(false)
      invalidateAll()
    },
    onError: (err: Error) => {
      if (getErrorCode(err) === "INVITE_SEATS_FULL") {
        setSeatLimitWarning(true)
      } else {
        toast.error(err.message)
      }
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => api.rejectMembershipRequest(requestId),
    onSuccess: () => {
      toast.success("Request rejected.")
      setRequestToReject(null)
      invalidateAll()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const regenerateMutation = useMutation({
    mutationFn: api.regenerateJoinCode,
    onSuccess: () => {
      toast.success("Join code regenerated. Share the new code with your school.")
      setRegenConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["organization"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const copyJoinCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Join code copied to clipboard.")
    } catch {
      toast.error("Could not copy the join code. Please copy it manually.")
    }
  }

  if (orgQuery.isError) {
    return (
      <ErrorState
        message={orgQuery.error instanceof Error ? orgQuery.error.message : "Failed to load organization"}
        onRetry={() => orgQuery.refetch()}
      />
    )
  }

  if (orgQuery.isLoading) {
    return <LoadingState label="Loading membership settings..." />
  }

  const org = orgQuery.data
  const requests = requestsQuery.data ?? []
  const loading = requestsQuery.isLoading

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full space-y-md">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Membership Requests</h1>

      {/* Join code card */}
      <div className="rounded-lg bg-white border border-border p-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">key</span>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{org?.name}</p>
            <h2 className="font-headline-md text-headline-md text-on-surface">School join code</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Share this code with teachers and students so they can request to join your school.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {org?.joinCode ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-5 py-2.5">
                <span className="font-headline-md text-headline-md text-primary tracking-[0.2em]">{org.joinCode}</span>
              </div>
              <Button
                variant="outline"
                className="rounded-lg font-label-md text-label-md border border-border bg-white text-primary hover:bg-surface-container h-auto px-5 py-2.5"
                onClick={() => copyJoinCode(org.joinCode!)}
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy
              </Button>
              <Button
                variant="outline"
                className="rounded-lg font-label-md text-label-md border border-border bg-white text-on-surface-variant hover:bg-surface-container h-auto px-5 py-2.5"
                onClick={() => setRegenConfirmOpen(true)}
                disabled={regenerateMutation.isPending}
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                {regenerateMutation.isPending ? "Regenerating..." : "Regenerate"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="rounded-lg font-label-md text-label-md border border-border bg-white text-primary hover:bg-surface-container h-auto px-5 py-2.5"
              onClick={() => setRegenConfirmOpen(true)}
              disabled={regenerateMutation.isPending}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              {regenerateMutation.isPending ? "Generating..." : "Generate join code"}
            </Button>
          )}
        </div>
      </div>

      {/* Seat limit warning */}
      {seatLimitWarning && (
        <div className="rounded-lg border border-error/30 bg-error-container/60 p-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-on-error-container">group_off</span>
            <p className="font-body-md text-body-md text-on-error-container">
              Your organization has reached its seat limit, so this request could not be approved.{" "}
              <a href="/admin/billing" className="font-bold underline underline-offset-2">
                Upgrade your plan
              </a>{" "}
              to add more members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSeatLimitWarning(false)}
            className="material-symbols-outlined text-on-error-container hover:opacity-70 shrink-0"
            aria-label="Dismiss"
          >
            close
          </button>
        </div>
      )}

      {/* Requests table */}
      <div className="rounded-lg bg-white border border-border p-md">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList className="bg-surface-container-low rounded-lg p-1 h-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-5 py-2 font-label-md text-label-md data-[state=active]:bg-primary-container data-[state=active]:text-on-primary-container data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading ? (
                <LoadingState label="Loading requests..." />
              ) : requestsQuery.isError ? (
                <ErrorState
                  message={requestsQuery.error instanceof Error ? requestsQuery.error.message : "Failed to load requests"}
                  onRetry={() => requestsQuery.refetch()}
                />
              ) : requests.length === 0 ? (
                <EmptyState
                  icon="person_search"
                  title={EMPTY_MESSAGES[tab.value]}
                  description={
                    tab.value === "PENDING"
                      ? "When someone signs up with your join code, their request will appear here for approval."
                      : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-label-md text-label-md text-on-surface-variant">Name</TableHead>
                        <TableHead className="font-label-md text-label-md text-on-surface-variant">Email</TableHead>
                        <TableHead className="font-label-md text-label-md text-on-surface-variant">Requested role</TableHead>
                        <TableHead className="font-label-md text-label-md text-on-surface-variant">Date</TableHead>
                        <TableHead className="font-label-md text-label-md text-on-surface-variant text-right">
                          {tab.value === "PENDING" ? "Actions" : "Status"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-label-md text-label-md text-on-surface">{request.name}</TableCell>
                          <TableCell className="font-body-md text-body-md text-on-surface-variant">{request.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-lg px-3 py-1 font-label-sm text-label-sm ${
                                request.role === "TEACHER"
                                  ? "bg-primary-container text-on-primary-container"
                                  : "bg-surface-container-high text-on-surface"
                              }`}
                            >
                              {request.role === "TEACHER" ? "Teacher" : "Student"}
                            </span>
                          </TableCell>
                          <TableCell className="font-body-sm text-body-sm text-on-surface-variant">
                            {formatDate(request.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {tab.value === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={roleOverrides[request.id] ?? request.role}
                                  onValueChange={(v) =>
                                    setRoleOverrides((prev) => ({ ...prev, [request.id]: v as api.MembershipRole }))
                                  }
                                >
                                  <SelectTrigger className="h-auto w-[110px] rounded-lg border border-border bg-white px-3 py-1.5 font-label-sm text-label-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TEACHER">Teacher</SelectItem>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="secondary"
                                  className="rounded-lg bg-primary text-primary-foreground font-label-sm text-label-sm px-4 py-2 h-auto hover:bg-primary/90/90"
                                  disabled={approveMutation.isPending}
                                  onClick={() =>
                                    approveMutation.mutate({
                                      requestId: request.id,
                                      role: roleOverrides[request.id] ?? request.role,
                                    })
                                  }
                                >
                                  {approveMutation.isPending ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="rounded-lg font-label-sm text-label-sm text-error hover:bg-error-container/40 h-auto px-4 py-2"
                                  onClick={() => setRequestToReject(request)}
                                  disabled={rejectMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`font-label-sm text-label-sm ${
                                  tab.value === "APPROVED" ? "text-primary" : "text-on-surface-variant"
                                }`}
                              >
                                {tab.value === "APPROVED" ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={requestToReject !== null}
        title="Reject membership request"
        message={
          requestToReject
            ? `Reject ${requestToReject.name}'s request to join ${org?.name ?? "your organization"}? They won't be able to sign in with this account.`
            : ""
        }
        confirmLabel="Reject"
        variant="danger"
        isLoading={rejectMutation.isPending}
        onConfirm={() => requestToReject && rejectMutation.mutate(requestToReject.id)}
        onCancel={() => setRequestToReject(null)}
      />
      <ConfirmDialog
        open={regenConfirmOpen}
        title="Regenerate join code"
        message="Regenerating invalidates the current code. Anyone using the old code will need the new one to join."
        confirmLabel="Regenerate"
        variant="danger"
        isLoading={regenerateMutation.isPending}
        onConfirm={() => regenerateMutation.mutate()}
        onCancel={() => setRegenConfirmOpen(false)}
      />
    </div>
  )
}
