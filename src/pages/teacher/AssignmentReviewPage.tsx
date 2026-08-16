import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSaveGeneratedAssignments } from "@/hooks/use-assignments"
import { useAssignmentDraft } from "@/hooks/use-assignment-draft"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { BackLink } from "@/components/shared/BackLink"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface CriterionRow {
  id: string
  description: string
  maxPoints: number
}

let critSeq = 0
const freshCritId = () => `crit-${Date.now()}-${critSeq++}`

export function AssignmentReviewPage() {
  const navigate = useNavigate()
  const { session, clear } = useAssignmentDraft()
  const save = useSaveGeneratedAssignments()

  const [title, setTitle] = useState(session?.draft.assignment.title ?? "")
  const [description, setDescription] = useState(session?.draft.assignment.description ?? "")
  const [rubricTitle, setRubricTitle] = useState(session?.draft.rubric.title ?? "")
  const [dueDate, setDueDate] = useState(session?.dueDate ?? "")
  const [criteria, setCriteria] = useState<CriterionRow[]>(() =>
    (session?.draft.rubric.criteria ?? []).map((c) => ({
      id: freshCritId(),
      description: c.description,
      maxPoints: c.maxPoints,
    })),
  )

  const [confirmOpen, setConfirmOpen] = useState(false)

  const totalPoints = useMemo(
    () => criteria.reduce((sum, c) => sum + (Number.isFinite(c.maxPoints) ? c.maxPoints : 0), 0),
    [criteria],
  )

  const dueDateError = !dueDate
    ? "A due date is required."
    : new Date(dueDate).getTime() <= new Date().getTime()
      ? "The due date must be in the future."
      : null

  const canSave =
    !!session &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    rubricTitle.trim().length > 0 &&
    dueDateError === null &&
    criteria.length > 0 &&
    criteria.every((c) => c.description.trim().length > 0 && c.maxPoints >= 1)

  const updateCriteria = (id: string, patch: Partial<CriterionRow>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeCriteria = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const addCriteria = () => {
    setCriteria((prev) => [...prev, { id: freshCritId(), description: "", maxPoints: 10 }])
  }

  const runSave = () => {
    if (!session || !canSave) return
    save.mutate(
      {
        assignments: session.targets.map((t) => ({ courseOfferingId: t.courseOfferingId })),
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        rubricTitle: rubricTitle.trim(),
        criteria: criteria
          .filter((c) => c.description.trim())
          .map((c) => ({ description: c.description.trim(), maxPoints: Math.max(1, c.maxPoints) })),
      },
      {
        onSuccess: () => {
          clear()
          navigate("/assignments")
        },
      },
    )
  }

  if (!session) {
    return (
      <div className="flex-1 p-xl flex items-center justify-center">
        <EmptyState
          icon="auto_awesome"
          title="No draft to review"
          description="Generate an assignment with AI first — the draft you review appears here."
          action={
            <Button
              asChild
              className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md hover:opacity-90 transition-all"
            >
              <Link to="/assignments">Back to assignments</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <BackLink to="/assignments" label="Assignments" />
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Review AI draft</h1>
        </div>
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={save.isPending || !canSave}
          className="bg-primary text-white! px-md h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
        >
          {save.isPending ? "Saving…" : "Approve rubric & save"}
        </Button>
      </header>

      <div className="flex-1 p-md overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-dashed border-primary/40 bg-primary-container/50">
            <span className="material-symbols-outlined shrink-0 text-primary">auto_awesome</span>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface font-bold">
                AI-generated draft — review before saving
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Generated from{" "}
                {session.scopeTitle ? `the unit "${session.scopeTitle}"` : "the entire course"} for{" "}
                {session.targets.length} section{session.targets.length > 1 ? "s" : ""}:{" "}
                {session.targets.map((t) => t.sectionName).join(", ")}. Edit anything below — the
                rubric is confirmed and applied to every section when you save.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant space-y-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Photosynthesis Essay"
                className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Instructions students see"
                className="w-full min-h-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus resize-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Due date (required)
              </label>
              <Input
                type="datetime-local"
                value={dueDate}
                required
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus"
              />
              {dueDateError && (
                <p className="font-label-sm text-label-sm text-error mt-1">{dueDateError}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Rubric <span className="text-on-surface-variant text-body-md">· {criteria.length} criteria · {totalPoints} pts</span>
              </h2>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Rubric title</label>
              <Input
                value={rubricTitle}
                onChange={(e) => setRubricTitle(e.target.value)}
                placeholder="e.g. Photosynthesis Rubric"
                className="w-full h-auto rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus"
              />
            </div>
            <div className="space-y-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={c.description}
                      onChange={(e) => updateCriteria(c.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Criterion description…"
                      className="w-full min-h-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={c.maxPoints || ""}
                        onChange={(e) =>
                          updateCriteria(c.id, { maxPoints: Math.max(1, Number(e.target.value) || 0) })
                        }
                        className="w-24 h-auto rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-sm text-on-surface text-center form-input-focus"
                        placeholder="pts"
                      />
                      <span className="font-label-sm text-label-sm text-on-surface-variant">points</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeCriteria(c.id)}
                    className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors shrink-0"
                    aria-label="Remove criterion"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={addCriteria}
              className="flex w-full items-center justify-center gap-1 py-sm px-md bg-primary text-white! rounded-md font-label-md hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add criterion
            </Button>
          </div>

          <div className="flex justify-end gap-3 pb-lg">
            <Button
              type="button"
              onClick={() => navigate("/assignments")}
              disabled={save.isPending}
              className="border border-outline-variant text-on-surface bg-surface-container-lowest px-lg h-auto py-sm rounded-lg font-label-md nudge-hover"
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={save.isPending || !canSave}
              className="bg-primary text-white! px-lg h-auto py-sm rounded-lg font-label-md disabled:opacity-50 nudge-hover"
            >
              {save.isPending ? "Saving…" : "Approve rubric & save to sections"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Approve rubric and save?"
        message={`This creates the assignment and a confirmed rubric for ${session.targets.length} section${session.targets.length > 1 ? "s" : ""}: ${session.targets.map((t) => t.sectionName).join(", ")}. Students see it as soon as it's saved.`}
        confirmLabel="Approve & save"
        isLoading={save.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          runSave()
        }}
      />
    </>
  )
}