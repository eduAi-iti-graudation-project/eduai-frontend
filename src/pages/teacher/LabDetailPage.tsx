import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
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
import { LabAgentGraph } from "@/components/labs/LabAgentGraph"
import {
  useLab,
  usePublishLab,
  useRejectLab,
  useRefineLab,
  useRegenerateLab,
  useDeleteLab,
  useTeacherOfferingNameMap,
} from "@/hooks/use-labs"
import { cn } from "@/lib/utils"

function ReviewFlagsPanel({
  flags,
  reasoning,
  isTemplate,
}: {
  flags: string[]
  reasoning: string
  isTemplate: boolean
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-label-lg text-label-lg text-red-700 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">shield_moon</span>
        {isTemplate
          ? "The AI generation pipeline failed"
          : "The lab generation was flagged"}
      </p>
      <ul className="mt-2 space-y-1">
        {flags.map((flag, index) => (
          <li key={index} className="font-body-sm text-body-sm text-red-600 list-disc ml-5">
            {flag}
          </li>
        ))}
      </ul>
      {reasoning ? (
        <p className="font-body-sm text-body-sm text-red-500 mt-2">{reasoning}</p>
      ) : null}
      <p className="font-body-sm text-body-sm text-red-500 mt-3">
        {isTemplate
          ? "The lab content was never built. You can reject it, refine it with change requests, or regenerate it fresh."
          : "Flagged code is never shown to students. You can refine it with change requests, regenerate it fresh, or verify the flagged points yourself and publish it anyway."}
      </p>
    </div>
  )
}

export function LabDetailPage() {
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const { data: lab, isLoading } = useLab(id)
  const offeringNames = useTeacherOfferingNameMap()
  const publish = usePublishLab()
  const reject = useRejectLab()
  const refine = useRefineLab()
  const regenerate = useRegenerateLab()
  const removeLab = useDeleteLab()

  const [confirmPublish, setConfirmPublish] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")
  const [refineInstruction, setRefineInstruction] = useState("")
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-spin">progress_activity</span>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading lab…</p>
      </div>
    )
  }

  if (!lab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <p className="font-body-lg text-body-lg text-on-surface">Lab not found.</p>
        <Link to="/labs" className="text-primary hover:underline mt-2">Back to labs</Link>
      </div>
    )
  }

  const publishable =
    lab.status === "PENDING_TEACHER_REVIEW" || lab.status === "AI_REVIEW_FAILED"
  const rejectable = ["GENERATING", "AI_REVIEW_FAILED", "PENDING_TEACHER_REVIEW"].includes(lab.status)
  const refineable = lab.status === "AI_REVIEW_FAILED" || lab.status === "PENDING_TEACHER_REVIEW"
  const restartable = refineable
  const isTemplate = Boolean(lab.gameSpec)

  const runRefine = () => {
    if (!refineInstruction.trim() || refine.isLoading) return
    refine.mutate(lab.id, refineInstruction.trim(), {
      onDone: (result) => {
        setRefineInstruction("")
        if (result.status === "AI_REVIEW_FAILED") {
          toast.error("The refined content was flagged. See the review flags.")
        } else {
          toast.success("Lab updated — re-verify it, then publish.")
        }
      },
    })
  }

  const runRegenerate = () => {
    if (regenerate.isPending) return
    setConfirmRegenerate(false)
    regenerate.mutate(lab.id, {
      onDone: (result) => {
        if (result.status === "AI_REVIEW_FAILED") {
          toast.error("The regenerated content was flagged. See the review flags.")
        } else {
          toast.success("Lab regenerated — verify it, then publish.")
        }
      },
    })
  }
  const offeringLabels = (lab.courseOfferingIds ?? [lab.courseOfferingId])
    .map((id) => offeringNames.get(id))
    .filter((name): name is string => Boolean(name))
  const offeringLabel = offeringLabels.length > 0 ? offeringLabels.join(" · ") : "—"

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
        {refine.isLoading && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <LabAgentGraph
              variant="inline"
              step={refine.step}
              lastToolStep={refine.lastToolStep}
            />
          </div>
        )}

        {lab.gameSpec || lab.generatedCode ? (
          <div className="aspect-[16/10] max-h-[65vh]">
            <LabSimulationFrame
              spec={lab.gameSpec}
              code={lab.generatedCode}
              className="h-full"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface flex flex-col items-center justify-center gap-2 py-16">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant">science</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {lab.status === "GENERATING"
                ? "Still generating… this can take a minute. The page refreshes automatically."
                : "No content available for this lab."}
            </p>
          </div>
        )}

        {refineable && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="font-label-md text-label-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Refine this lab
            </p>
            <div className="mt-2 flex items-end gap-2">
              <textarea
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runRefine()
                }}
                rows={2}
                placeholder="Tell the AI what to change, e.g. add a hint on the nucleus region…"
                disabled={refine.isLoading}
                className={cn(
                  "flex-1 resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  refine.isLoading && "opacity-60",
                )}
              />
              <Button
                onClick={runRefine}
                disabled={refineInstruction.trim().length < 3 || refine.isLoading}
              >
                {refine.isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Refining…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Send
                  </>
                )}
              </Button>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
              The AI modifies the existing lab in place — it never regenerates from scratch.
            </p>
          </div>
        )}

        {lab.status === "AI_REVIEW_FAILED" && lab.reviewFlags && (
          <ReviewFlagsPanel
            flags={lab.reviewFlags.flags}
            reasoning={lab.reviewFlags.reasoning}
            isTemplate={isTemplate}
          />
        )}

        {lab.status === "PENDING_TEACHER_REVIEW" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="font-label-lg text-label-lg text-blue-700">
              {isTemplate ? "Built — now verify it yourself" : "Generated — now verify it yourself"}
            </p>
            <p className="font-body-sm text-body-sm text-blue-600 mt-1">
              {isTemplate
                ? "Play the game above, confirm it teaches the unit's material and the objective is achievable, then publish so students in the selected sections can run it."
                : "Play the simulation above, confirm the objective is achievable and behaves correctly, then publish so students in the selected sections can run it."}
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
            <Button onClick={() => setConfirmPublish(true)} disabled={publish.isPending || refine.isLoading || regenerate.isLoading}>
              Publish to students
            </Button>
          )}
          {restartable && (
            <Button
              variant="outline"
              onClick={() => setConfirmRegenerate(true)}
              disabled={regenerate.isLoading}
            >
              {regenerate.isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Regenerating…
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          )}
          {rejectable && (
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={reject.isPending || refine.isLoading}>
              Reject
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(true)}
            disabled={removeLab.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerate this lab?"
        message="This throws away the current content and builds a fresh lab grounded in the same unit. If the lab is a free-form game it is safety-reviewed again before you see it."
        confirmLabel="Regenerate"
        isLoading={regenerate.isPending}
        onConfirm={runRegenerate}
        onCancel={() => setConfirmRegenerate(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this lab?"
        message={
          lab.status === "PUBLISHED"
            ? "This lab is currently published — deleting it removes student access immediately. This can't be undone."
            : "This lab and all its section links will be permanently removed. This can't be undone."
        }
        confirmLabel="Delete lab"
        isLoading={removeLab.isPending}
        onConfirm={() =>
          removeLab.mutate(lab.id, {
            onSuccess: () => navigate("/labs"),
            onError: () => setConfirmDelete(false),
          })
        }
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmPublish}
        title={lab.status === "AI_REVIEW_FAILED" ? "Publish this flagged lab?" : "Publish this lab?"}
        message={
          lab.status === "AI_REVIEW_FAILED"
            ? "This lab's generation was flagged. Publishing it overrides that verdict — make sure you have personally verified the code above and the win condition actually works, because students in the selected sections will be able to run it immediately. You can't unpublish it after the fact."
            : "Students enrolled in the selected sections will immediately be able to run this lab. You can't unpublish it after the fact — you can only reject new labs going forward."
        }
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
            placeholder="e.g. The pendulum never reaches the objective angle — regenerated with clearer mechanics."
            rows={4}
            className={cn(
              "w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface",
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