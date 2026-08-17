import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { useStudentInsights, type InsightsInterval } from "@/hooks/use-dashboard-insights"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { InsightSectionsGrid } from "@/components/insights/InsightSectionsGrid"
import { AgentInsightsTable } from "@/components/insights/AgentInsightsTable"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StudentInsightsPage() {
 const { id } = useParams<{ id: string }>()
 const [interval, setInterval] = useState<InsightsInterval>("week")
 const { data, isLoading, isError, error, refetch } = useStudentInsights(id ?? "", interval)

 const isForbidden = isError && axios.isAxiosError(error) && error.response?.status === 403

 if (isForbidden) {
  return (
   <ErrorState
    title="No access to this student's insights"
    message="You don't have permission to view insights for this student."
    onRetry={() => refetch()}
   />
  )
 }

 return (
  <>
   <PageHeader
    title="Student Insights"
    subtitle={id ? undefined : "No student selected"}
    actions={
     <div className="flex items-center gap-1 rounded-lg bg-surface-container p-1" role="group" aria-label="Time interval">
      {(["week", "month"] as const).map((value) => (
       <Button
        key={value}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setInterval(value)}
        className={cn(
         "rounded-lg px-4 h-8 font-label-md text-label-md",
         interval === value
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-on-surface-variant hover:bg-surface-container-high",
        )}
        aria-pressed={interval === value}
       >
        {value === "week" ? "Week" : "Month"}
       </Button>
      ))}
     </div>
    }
   />

   {isLoading ? (
    <LoadingState label="Loading student insights..." />
   ) : isError ? (
    <div>
     <ErrorState
      title="Couldn't load insights"
      message={error instanceof Error ? error.message : "Failed to load insights"}
      onRetry={() => refetch()}
     />
     <div className="text-center pb-lg">
      <Link
       to="/insights"
       className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors"
      >
       <span className="material-symbols-outlined text-[18px]">arrow_back</span>
       Back to Insights
      </Link>
     </div>
    </div>
   ) : data ? (
<div className="flex-1 p-md space-y-lg">
      <InsightSectionsGrid sections={data.sections} interval={interval} studentId={id} />

     {data.agentInsights.length > 0 && (
      <section className="space-y-3">
       <div className="flex items-baseline justify-between gap-3 px-sm">
        <h2 className="font-headline-md text-headline-md text-primary">What to know</h2>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
         AI-generated notes · {data.agentInsights.length} insight{data.agentInsights.length !== 1 ? "s" : ""}
        </p>
       </div>
       <AgentInsightsTable insights={data.agentInsights} />
      </section>
     )}
    </div>
   ) : null}
  </>
 )
}
