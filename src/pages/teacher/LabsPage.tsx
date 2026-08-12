import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTeacherOfferings } from "@/hooks/use-labs"
import { useGenerateLab, useLabs } from "@/hooks/use-labs"
import { LabStatusChip } from "@/components/labs/LabStatusChip"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function LabsPage() {
  const navigate = useNavigate()
  const [offeringId, setOfferingId] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [topic, setTopic] = useState("")

  const offerings = useTeacherOfferings()
  const { labs, isLoading } = useLabs(offeringId || undefined)
  const generate = useGenerateLab()

  const offeringNameMap = useMemo(
    () => new Map((offerings.data ?? []).map((o) => [o.id, `${o.course.name} · ${o.section.name}`])),
    [offerings.data],
  )

  const canGenerate = !!offeringId && topic.trim().length >= 3 && !generate.isPending

  const submit = () => {
    if (!canGenerate) return
    generate.mutate(
      { courseOfferingId: offeringId, topic: topic.trim() },
      {
        onSuccess: (result) => {
          if (!result.grounded) {
            toast.error(result.message ?? "No curriculum material was found for this topic.")
            setDialogOpen(false)
            return
          }
          setDialogOpen(false)
          setTopic("")
          if (result.status === "AI_REVIEW_FAILED") {
            toast.error("The AI security review rejected the generated code. See the review flags.")
          } else {
            toast.success(
              result.status === "PENDING_TEACHER_REVIEW"
                ? "Lab generated and AI-reviewed. Play it, then publish."
                : "Lab generated.",
            )
          }
          if (result.labId) navigate(`/labs/${result.labId}`)
        },
      },
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Lab Simulations"
        subtitle="Generate, review, and publish AI-built physics simulations grounded in your class material."
        actions={
          <Button onClick={() => setDialogOpen(true)} disabled={!offerings.data?.length}>
            New lab
          </Button>
        }
      />

      <div className="px-6 pb-6 flex-1 min-h-0">
        <div className="mb-4 flex items-center gap-3">
          <Select value={offeringId} onValueChange={setOfferingId}>
            <SelectTrigger className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[220px]">
              <SelectValue placeholder="All my sections…" />
            </SelectTrigger>
            <SelectContent>
              {offerings.data?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.course.name} · {o.section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading labs…</p>
        ) : labs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">science</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-3">No labs yet</p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {offerings.data?.length
                ? "Create one from a topic in your uploaded class material."
                : "You have no course offerings to create labs for."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {labs.map((lab) => (
              <li key={lab.id}>
                <Link
                  to={`/labs/${lab.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface truncate">{lab.topic}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      {offeringNameMap.get(lab.courseOfferingId) ?? "—"} · created {formatDate(lab.createdAt)}
                    </p>
                  </div>
                  {lab.status === "PENDING_TEACHER_REVIEW" && lab.reviewApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      AI-approved
                    </span>
                  )}
                  {lab.status === "AI_REVIEW_FAILED" && lab.reviewFlags && lab.reviewFlags.flags.length > 0 && (
                    <span className="font-label-sm text-label-sm text-red-600">{lab.reviewFlags.flags.length} flag(s)</span>
                  )}
                  <LabStatusChip status={lab.status} />
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate a lab simulation</DialogTitle>
            <DialogDescription>
              The AI writes a Matter.js physics simulation grounded in your uploaded material, then a separate agent
              security-reviews the code before you see it. Usually takes 30–90 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">Section &amp; course</label>
              <Select value={offeringId} onValueChange={setOfferingId}>
                <SelectTrigger className="w-full form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
                  <SelectValue placeholder="Choose a course…" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.course.name} · {o.section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit()
                }}
                placeholder="e.g. Projectile motion on an inclined plane"
                className="w-full form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                The topic must appear in your uploaded class material, or generation is refused.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generate.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canGenerate}>
              {generate.isPending ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Generating…
                </>
              ) : (
                "Generate lab"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}