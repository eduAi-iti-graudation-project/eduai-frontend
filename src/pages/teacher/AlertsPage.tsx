import { useState } from "react"
import { useAlerts } from "@/hooks/use-alerts"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { AlertCard } from "@/components/ui/AlertCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const { alerts, isLoading, resolve } = useAlerts(statusFilter || undefined)

  return (
    <>
      <PageHeader
        title="Alerts"
        actions={
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px] h-auto rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:ring-primary-container">
              <SelectValue placeholder="All alerts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All alerts</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="flex-1 p-md">
        {isLoading ? (
          <LoadingState label="Loading alerts..." />
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState icon="notifications" title="All clear" description="No alerts to show right now." />
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                type={alert.type}
                reason={alert.reason}
                status={alert.status}
                createdAt={alert.createdAt}
                onResolve={alert.status !== "RESOLVED" ? () => resolve.mutate({ id: alert.id, status: "RESOLVED" }) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
