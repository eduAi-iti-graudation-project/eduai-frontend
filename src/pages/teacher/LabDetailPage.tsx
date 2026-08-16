import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { LabSimulationFrame } from "@/components/labs/LabSimulationFrame"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { LabStatusChip } from "@/components/labs/LabStatusChip"
import { useLab, usePublishLab, useRejectLab, useTeacherOfferingNameMap } from "@/hooks/use-labs"
import { cn } from "@/lib/utils"

function ReviewFlagsPanel({ flags, reasoning }: { flags: string[]; reasoning: string }) {
 return (
  <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
   <p className="font-label-lg text-label-lg text-danger flex items-center gap-2">
    <span className="material-symbols-outlined text-[18px]">shield_moon</span>
    AI security review flagged the generated code
   </p>
   <ul className="mt-2 space-y-1">
    {flags.map((flag, index) => (
     <li key={index} className="font-body-sm text-body-sm text-danger list-disc ml-5">
      {flag}
     </li>
    ))}
   </ul>
   {reasoning ? (
    <p className="font-body-sm text-body-sm text-danger mt-2">{reasoning}</p>
   ) : null}
   <p className="font-body-sm text-body-sm text-danger mt-3">
    You can reject this lab, or generate a new one on the same topic. Flagged code is never shown to students.
   </p>
  </div>
 )
}

export function LabDetailPage() {
 const { id = "" } = useParams()
 const { data: lab, isLoading } = useLab(id)
 const offeringNames = useTeacherOfferingNameMap()
 const publish = usePublishLab()
 const reject = useRejectLab()

 const [confirmPublish, setConfirmPublish] = useState(false)
 const [rejectOpen, setRejectOpen] = useState(false)
 const [rejectNotes, setRejectNotes] = useState("")

 if (isLoading) {
  return (
   <div className="flex-1 flex flex-col items-center justify-center gap-3 py-xl">
    <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-spin">progress_activity</span>
    <p className="font-body-md text-body-md text-on-surface-variant">Loading lab…</p>
   </div>
  )
 }

 if (!lab) {
  return (
   <div className="flex-1 flex flex-col items-center justify-center py-xl">
    <p className="font-body-lg text-body-lg text-on-surface">Lab not found.</p>
    <Link to="/labs" className="text-primary hover:underline mt-2">Back to labs</Link>
   </div>
  )
 }

 const publishable = lab.status === "PENDING_TEACHER_REVIEW"
 const rejectable = ["GENERATING", "AI_REVIEW_FAILED", "PENDING_TEACHER_REVIEW"].includes(lab.status)
 const offeringLabel = offeringNames.get(lab.courseOfferingId) ?? "—"

 return (
  <div className="flex-1 flex flex-col">
   <PageHeader
    title={`Lab — ${lab.topic}`}
    subtitle={`${offeringLabel} · created ${new Date(lab.createdAt).toLocaleDateString()}`}
    actions={
     <div className="flex items-center gap-2">
      <Link to="/labs">
       <Button variant="ghost">Back</Button>
      </Link>
      <LabStatusChip status={lab.status} />
     </div>
    }
   />

   <div className="px-6 pb-6 flex-1 min-h-0 space-y-4">
    {lab.generatedCode ? (
     <div className="aspect-[16/10] max-h-[65vh]">
      <LabSimulationFrame code={lab.generatedCode} className="h-full" />
     </div>
    ) : (
     <div className="rounded-lg border border-border bg-surface flex flex-col items-center justify-center gap-2 py-16">
      <span className="material-symbols-outlined text-[36px] text-on-surface-variant">science</span>
      <p className="font-body-md text-body-md text-on-surface-variant">
       {lab.status === "GENERATING"
        ? "Still generating… this can take a minute. The page refreshes automatically."
        : "No simulation code available for this lab."}
      </p>
     </div>
    )}

    {lab.status === "AI_REVIEW_FAILED" && lab.reviewFlags && (
     <ReviewFlagsPanel flags={lab.reviewFlags.flags} reasoning={lab.reviewFlags.reasoning} />
    )}

    {lab.status === "PENDING_TEACHER_REVIEW" && (
     <div className="rounded-lg border border-primary/40 bg-primary-container p-4">
      <p className="font-label-lg text-label-lg text-primary">Passed AI review — now verify it yourself</p>
      <p className="font-body-sm text-body-sm text-primary mt-1">
       Play the simulation above, confirm the objective is achievable and the physics behaves, then publish so
       students in this section can run it.
      </p>
     </div>
    )}

    {lab.teacherNotes && (
     <div className="rounded-lg border border-border bg-surface p-4">
      <p className="font-label-md text-label-md text-on-surface-variant">Teacher notes</p>
      <p className="font-body-md text-body-md text-on-surface mt-1">{lab.teacherNotes}</p>
     </div>
    )}

    {lab.publishedAt && (
     <p className="font-label-sm text-label-sm text-on-surface-variant">
      Published {new Date(lab.publishedAt).toLocaleString()}
     </p>
    )}

    <div className="flex items-center gap-3 pt-2">
     {publishable && (
      <Button onClick={() => setConfirmPublish(true)} disabled={publish.isPending}>
       Publish to students
      </Button>
     )}
     {rejectable && (
      <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={reject.isPending}>
       Reject
      </Button>
     )}
     {lab.status === "AI_REVIEW_FAILED" && (
      <Link to="/labs">
       <Button variant="ghost">Generate another lab for this topic</Button>
      </Link>
     )}
    </div>
   </div>

   <ConfirmDialog
    open={confirmPublish}
    title="Publish this lab?"
    message="Students enrolled in this section will immediately be able to run this simulation. You can't unpublish it after the fact — you can only reject new labs going forward."
    confirmLabel="Publish"
    isLoading={publish.isPending}
    onConfirm={() =>
     publish.mutate(lab.id, {
      onError: () => setConfirmPublish(false),
     })
    }
    onCancel={() => setConfirmPublish(false)}
   />

   <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Reject this lab</DialogTitle>
      <DialogDescription>
       Students never see rejected labs. Add a note so the reason is clear.
      </DialogDescription>
     </DialogHeader>
     <textarea
      value={rejectNotes}
      onChange={(e) => setRejectNotes(e.target.value)}
      placeholder="e.g. The pendulum never reaches the objective angle — regenerated with clearer physics."
      rows={4}
      className={cn(
       "w-full rounded-full bg-surface px-3 py-2 text-label-md text-on-surface",
       "focus:outline-none focus:ring-2 focus:ring-primary/40",
      )}
     />
     <DialogFooter>
      <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={reject.isPending}>
       Cancel
      </Button>
      <Button
       variant="destructive"
       disabled={reject.isPending}
       onClick={() =>
        reject.mutate(
         { id: lab.id, notes: rejectNotes.trim() || undefined },
         {
          onSuccess: () => setRejectOpen(false),
          onError: () => {},
         },
        )
       }
      >
       Reject lab
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}