import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { struggleSignalsQueryKey } from "@/hooks/use-meetings"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { cn } from "@/lib/utils"

function SignalRow({
 signal,
 onDone,
}: {
 signal: api.StruggleSignal
 onDone: () => void
}) {
 const queryClient = useQueryClient()
 const [open, setOpen] = useState(false)

 const send = useMutation({
  mutationFn: () => api.sendStruggleSignal(signal.id),
  onSuccess: () => {
   toast.success("Follow-up sent to the student", {
    description: "A quiz and a re-explanation were generated.",
   })
   void queryClient.invalidateQueries()
   onDone()
  },
  onError: (error) => {
   toast.error("Could not send follow-up", { description: error.message })
   void queryClient.invalidateQueries()
  },
 })

 const dismiss = useMutation({
  mutationFn: () => api.dismissStruggleSignal(signal.id),
  onSuccess: () => {
   toast.success("Suggestions dismissed")
   void queryClient.invalidateQueries()
   onDone()
  },
  onError: (error) => {
   toast.error("Could not dismiss", { description: error.message })
   void queryClient.invalidateQueries()
  },
 })

 const busy = send.isPending || dismiss.isPending

 return (
  <div className="border border-border rounded-xl p-md flex items-start justify-between gap-4">
   <div className="min-w-0">
    <p className="font-label-md text-label-md text-on-surface">
     {signal.concept}
     {signal.classWide && (
      <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
       class-wide
      </span>
     )}
    </p>
    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
     {signal.studentName ? `${signal.studentName} — ` : ""}
     {signal.explanation}
    </p>
    <button
     type="button"
     onClick={() => setOpen((v) => !v)}
     className="font-label-sm text-label-sm text-primary hover:underline mt-2"
    >
     {open ? "Hide details" : "Show student transcript context"}
    </button>
    {open && (
     <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 border-l-2 border-primary/30 pl-3">
      The follow-up sends a short quiz and a re-explanation based on the
      class material. Nothing is sent until you press Send.
     </p>
    )}
   </div>
   <div className="flex gap-2 shrink-0">
    <Button
     size="sm"
     onClick={() => send.mutate()}
     disabled={busy}
    >
     <span className="material-symbols-outlined text-[16px] mr-1">send</span>
     {send.isPending ? "Sending…" : "Send"}
    </Button>
    <Button
     size="sm"
     variant="ghost"
     onClick={() => dismiss.mutate()}
     disabled={busy}
    >
     Dismiss
    </Button>
   </div>
  </div>
 )
}

export function StruggleSignalsPanel({
 meetingId,
 className,
}: {
 meetingId: string
 className?: string
}) {
 const queryClient = useQueryClient()
 const [showHistory, setShowHistory] = useState(false)

 const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: struggleSignalsQueryKey(meetingId),
  queryFn: () => api.getStruggleSignalsForMeeting(meetingId),
 })
 const refresh = () => {
  void queryClient.invalidateQueries()
  void refetch()
 }

 const pendingClassWide = data?.pending.classWide ?? []
 const pendingIndividual = data?.pending.individual ?? []
 const history = data?.history ?? []
 const totalPending = pendingClassWide.length + pendingIndividual.length

 const extract = useMutation({
  mutationFn: () => api.triggerStruggleSignalExtraction(meetingId),
  onSuccess: (res: any) => {
    toast.success("AI analysis completed", {
      description: res?.count ? `Found ${res.count} follow-up suggestions!` : "Checked transcript for confusion signals.",
    })
    refresh()
  },
  onError: (err: any) => {
    toast.error("Analysis failed", { description: err?.message ?? "Could not analyze transcript" })
  },
})

 return (
  <div className={cn("bg-surface-container-lowest h-[26rem] overflow-y-auto", className)}>
    {extract.isPending && (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-[32px] text-primary animate-spin">psychology</span>
        </div>
        <div>
          <h3 className="font-label-lg text-label-lg text-on-surface">Analyzing transcript with AI...</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">
            Scanning transcript lines to extract educational concepts and questions.
          </p>
        </div>
      </div>
    )}

    {!extract.isPending && isLoading && <LoadingState />}
    {!extract.isPending && isError && (
      <ErrorState
        title="Failed to load follow-up suggestions"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => refetch()}
      />
    )}
   {!extract.isPending && !isLoading && !isError && (
    <div className="p-md space-y-4">
     <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
       <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">school</span>
        <h2 className="font-label-lg text-label-lg text-primary">
         Follow-up suggestions
        </h2>
        {totalPending > 0 && (
         <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
          {totalPending} pending
         </span>
        )}
       </div>
       <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={extract.isPending}
        onClick={() => extract.mutate()}
       >
        <span className="material-symbols-outlined text-[16px] mr-1">psychology</span>
        {extract.isPending ? "Analyzing..." : "Analyze Transcript"}
       </Button>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
       Post-meeting notes on concepts students seemed unsure about. Review
       them and send a follow-up — it is never sent automatically.
      </p>
     </div>

     {totalPending === 0 && history.length === 0 && (
      <EmptyState
       icon="auto_awesome"
       title="No suggestions yet"
       description="Suggestions appear automatically after a meeting ends, or click 'Analyze Transcript' above to scan now."
      />
     )}

     {totalPending === 0 && history.length > 0 && (
      <EmptyState
       icon="task_alt"
       title="All caught up"
       description="Every suggested follow-up has been sent or dismissed."
      />
     )}

     {pendingClassWide.map((cluster) => (
      <div key={cluster.concept}>
       <p className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
        {cluster.concept}
        <span className="font-label-sm text-label-sm text-on-surface-variant">
         {cluster.studentCount} students
        </span>
       </p>
       <div className="space-y-2">
        {cluster.signals.map((signal) => (
         <SignalRow key={signal.id} signal={signal} onDone={refresh} />
        ))}
       </div>
      </div>
     ))}

     {pendingIndividual.length > 0 && (
      <div>
       <div className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
        Individual signals
       </div>
       <div className="space-y-2">
        {pendingIndividual.map((signal) => (
         <SignalRow key={signal.id} signal={signal} onDone={refresh} />
        ))}
       </div>
      </div>
     )}

     {history.length > 0 && (
      <div>
       <button
        type="button"
        onClick={() => setShowHistory((v) => !v)}
        className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1"
       >
        <span className="material-symbols-outlined text-[18px]">
         {showHistory ? "expand_less" : "expand_more"}
        </span>
        History ({history.length})
       </button>
       {showHistory && (
        <div className="mt-2 space-y-2">
         {history.map((signal) => (
          <div
           key={signal.id}
           className="border border-border rounded-2xl p-md flex items-start justify-between gap-4 opacity-80"
          >
           <div className="min-w-0">
            <p className="font-label-md text-label-md text-on-surface">
             {signal.concept}
             {signal.classWide && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
               class-wide
              </span>
             )}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
             {signal.studentName ?? ""}
            </p>
           </div>
           <span
            className={cn(
             "font-label-sm text-label-sm px-2 py-0.5 rounded-full",
             signal.status === "SENT"
              ? "bg-primary/10 text-primary"
              : "bg-surface-variant text-on-surface-variant",
            )}
           >
            {signal.status === "SENT" ? "Sent" : "Dismissed"}
           </span>
          </div>
         ))}
        </div>
       )}
      </div>
     )}
    </div>
   )}
  </div>
 )
}