import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { getErrorCode } from "@/lib/api"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type Status = api.JoinRequestStatus

const TABS: { value: Status; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminJoinApprovalsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>("PENDING")
  const [source, setSource] = useState<api.JoinRequestSource | "ALL">("ALL")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [seatLimitWarning, setSeatLimitWarning] = useState(false)
  const [requestToReopen, setRequestToReopen] = useState<api.JoinRequestItem | null>(null)

  const requestsQuery = useQuery({
    queryKey: ["join-requests", status, source],
    queryFn: () =>
      api.getJoinRequests({
        status,
        ...(source === "ALL" ? {} : { source }),
      }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["join-requests"] })
    queryClient.invalidateQueries({ queryKey: ["users"] })
    queryClient.invalidateQueries({ queryKey: ["organization"] })
  }

  const approveMutation = useMutation({
    mutationFn: (ids: string[]) => api.approveJoinRequests(ids),
    onSuccess: (res) => {
      if (res.approved.length > 0) {
        const withCredentials = res.approved.filter((a) => a.generatedPassword).length
        const detail =
          withCredentials > 0
            ? ` ${withCredentials} sign-in credential${withCredentials === 1 ? "" : "s"} sent by email.`
            : ""
        toast.success(`${res.approved.length} request${res.approved.length === 1 ? "" : "s"} approved.${detail}`)
      }
      if (res.failed.length > 0) {
        toast.error(`${res.failed.length} request${res.failed.length === 1 ? "" : "s"} could not be approved.`, {
          description: res.failed.map((f) => f.reason).join(" · "),
        })
        if (res.failed.some((f) => /seat limit|seats limit/i.test(f.reason))) {
          setSeatLimitWarning(true)
        }
      }
      setSelected(new Set())
      invalidate()
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
    mutationFn: (ids: string[]) => api.rejectJoinRequests(ids),
    onSuccess: (res) => {
      toast.success(`${res.rejected} request${res.rejected === 1 ? "" : "s"} rejected.`)
      setSelected(new Set())
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reopenMutation = useMutation({
    mutationFn: (id: string) => api.reopenJoinRequest(id),
    onSuccess: () => {
      toast.success("Request reopened and moved back to pending.")
      setRequestToReopen(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = useMemo(() => requestsQuery.data?.items ?? [], [requestsQuery.data])
  const counts = useMemo(
    () => requestsQuery.data?.counts ?? { pending: 0, approved: 0, rejected: 0 },
    [requestsQuery.data],
  )

  const visibleIds = useMemo(() => items.map((r) => r.id), [items])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (requestsQuery.isLoading) {
    return <LoadingState label="Loading join requests..." />
  }

  if (requestsQuery.isError) {
    return (
      <ErrorState
        message={requestsQuery.error instanceof Error ? requestsQuery.error.message : "Failed to load join requests"}
        onRetry={() => requestsQuery.refetch()}
      />
    )
  }

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full space-y-md">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Join Approvals</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
<Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as Status)
            setSelected(new Set())
            setSeatLimitWarning(false)
          }}
        >
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label} ({counts[tab.value.toLowerCase() as keyof typeof counts]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Select
            value={source}
            onValueChange={(v) => setSource(v as api.JoinRequestSource | "ALL")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              <SelectItem value="ROSTER">Roster import</SelectItem>
              <SelectItem value="SELF">Self-registration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {seatLimitWarning && (
        <div className="rounded-lg bg-error-container/30 border border-error p-md text-body-sm text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          You&apos;ve hit your school&apos;s seat limit. Upgrade your plan to approve more students.
        </div>
      )}

      {status === "PENDING" && items.length > 0 && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => approveMutation.mutate(Array.from(selected))}
            disabled={selected.size === 0 || approveMutation.isPending}
          >
            Approve {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
          <Button
            variant="outline"
            onClick={() => rejectMutation.mutate(Array.from(selected))}
            disabled={selected.size === 0 || rejectMutation.isPending}
          >
            Reject
          </Button>
          <span className="text-label-sm text-on-surface-variant">
            {selected.size > 0 ? `${selected.size} selected` : "Select requests to approve or reject"}
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No requests here"
          description={
            status === "PENDING"
              ? "Students and parents who sign up with your school code or are added via roster import will show up here."
              : status === "REJECTED"
                ? "Rejected requests will show up here. You can reopen them to give the student another chance."
                : "Approved students will show up here."
          }
        />
      ) : (
        <div className="rounded-lg bg-white border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {status === "PENDING" && (
                  <TableHead className="w-10">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((request) => (
                <TableRow key={request.id}>
                  {status === "PENDING" && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(request.id)}
                        onCheckedChange={() => toggleOne(request.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{request.name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>
                    <Badge variant={request.source === "ROSTER" ? "default" : "secondary"}>
                      {request.source === "ROSTER" ? "Roster import" : "Self"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.kind === "GUARDIAN" ? (
                      <Badge variant="outline">Parent</Badge>
                    ) : (
                      <Badge variant="secondary">Student</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.kind === "GUARDIAN"
                      ? (request.targetStudentEmail ?? "—")
                      : (request.gradeLevelName ?? "—")}
                  </TableCell>
                  <TableCell>
                    {request.kind === "GUARDIAN" ? "links to child" : (request.sectionName ?? "—")}
                  </TableCell>
                  <TableCell>{formatDate(request.appliedAt)}</TableCell>
                  <TableCell className="text-right">
                    {status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate([request.id])}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate([request.id])}
                          disabled={rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {status === "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRequestToReopen(request)}
                      >
                        Reopen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {requestToReopen && (
        <ConfirmDialog
          open={requestToReopen !== null}
          title={`Reopen ${requestToReopen.name}'s request?`}
          message="The request will move back to pending so you can approve it."
          confirmLabel="Reopen"
          onConfirm={() => reopenMutation.mutate(requestToReopen.id)}
          onCancel={() => setRequestToReopen(null)}
        />
      )}
    </div>
  )
}