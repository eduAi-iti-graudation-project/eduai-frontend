import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAssignments, useGenerateCourseAssignmentDraft } from "@/hooks/use-assignments"
import { useAssignmentDraft } from "@/hooks/use-assignment-draft"
import { useCourseMaterialChapters } from "@/hooks/use-materials"
import { useTeacherOfferingNameMap } from "@/hooks/use-labs"
import { QuizTargetPicker, type TargetOffering } from "@/components/quiz/QuizTargetPicker"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AssignmentType } from "@/lib/api"

const ALL = "__all__"

const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  essay: "Essay",
  short_answer: "Short answer",
  project: "Project",
}

const ASSIGNMENT_TYPES: AssignmentType[] = ["essay", "short_answer", "project"]

export function AssignmentsPage() {
  const navigate = useNavigate()
  const assignments = useAssignments()
  const offeringNames = useTeacherOfferingNameMap()

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [genTargets, setGenTargets] = useState<TargetOffering[]>([])
  const [genScope, setGenScope] = useState("")
  const [genType, setGenType] = useState<AssignmentType>("essay")
  const [genDueDate, setGenDueDate] = useState("")

  const genCourseId = genTargets[0]?.courseId ?? ""
  const { chapters: genUnits, isLoading: genUnitsLoading } = useCourseMaterialChapters(genCourseId)

  const generate = useGenerateCourseAssignmentDraft()
  const { store } = useAssignmentDraft()

  const handleGenTargetsChange = (next: TargetOffering[]) => {
    const prevCourse = genTargets[0]?.courseId
    const nextCourse = next[0]?.courseId
    setGenTargets(next)
    if (nextCourse !== prevCourse) setGenScope("")
  }

  const runGenerate = () => {
    if (genTargets.length === 0 || !genScope || !genDueDate) return
    const primary = genTargets[0]
    generate.mutate(
      {
        courseId: primary.courseId,
        assignments: genTargets.map((t) => ({ courseOfferingId: t.courseOfferingId })),
        chapterId: genScope === ALL ? null : genScope,
        dueDate: new Date(genDueDate).toISOString(),
        assignmentType: genType,
      },
      {
        onSuccess: (result) => {
          if (result.status === "not_grounded") {
            return
          }
          const scopeTitle =
            genScope === ALL
              ? null
              : genUnits.find((u) => u.id === genScope)?.title ?? null
          store({
            courseId: primary.courseId,
            targets: genTargets,
            chapterId: genScope === ALL ? null : genScope,
            scopeTitle,
            assignmentType: genType,
            dueDate: genDueDate,
            draft: result.draft,
          })
          setGeneratorOpen(false)
          setGenTargets([])
          setGenScope("")
          setGenDueDate("")
          navigate("/assignments/review")
        },
      },
    )
  }

  const rows = useMemo(() => {
    return (assignments.data ?? []).sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    )
  }, [assignments.data])

  return (
    <>
      <PageHeader
        title="Assignments"
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={generate.isPending}
              onClick={() => {
                setGenTargets([])
                setGeneratorOpen(true)
              }}
              className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md nudge-hover inline-flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              AI Generate
            </Button>
            <Button
              asChild
              className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md nudge-hover inline-flex items-center gap-1"
            >
              <Link to="/assignments/new">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Assignment
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-md">
        {assignments.isLoading ? (
          <LoadingState className="flex-1 p-md max-w-4xl mx-auto w-full" />
        ) : assignments.isError ? (
          <ErrorState
            title="Failed to load assignments"
            message={assignments.error instanceof Error ? assignments.error.message : "Something went wrong"}
            onRetry={() => assignments.refetch()}
            className="flex-1"
          />
        ) : (assignments.data ?? []).length === 0 ? (
          <EmptyState
            icon="assignment"
            title="No assignments yet"
            description="Create one manually or let AI draft the assignment and rubric from your curriculum material."
            action={
              <div className="flex gap-md justify-center">
                <Button
                  asChild
                  className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md hover:opacity-90 transition-all"
                >
                  <Link to="/assignments/new">Create an assignment</Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => setGeneratorOpen(true)}
                  className="bg-primary text-white! px-md h-auto py-sm rounded-md font-label-md hover:opacity-90 transition-all"
                >
                  Generate with AI
                </Button>
              </div>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="assignment"
            title="No assignments found"
            description="Assignments will appear here once created."
          />
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {rows.map((assignment) => {
              const overdue = new Date(assignment.dueDate).getTime() < new Date().getTime()
              const sectionName = offeringNames.get(assignment.courseOfferingId)
              return (
                <Link
                  key={assignment.id}
                  to={`/assignments/${assignment.id}`}
                  className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                        {assignment.title}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-1">
                        {assignment.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sectionName && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-[12px]">groups</span>
                            {sectionName}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-2 py-0.5 font-label-sm text-label-sm ${
                            overdue ? "text-error" : "text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          Due {new Date(assignment.dueDate).toLocaleDateString()}
                          {overdue && " · overdue"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          {assignment.totalPoints} pts
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={generatorOpen}
        onOpenChange={(next) => {
          if (!next && !generate.isPending) setGeneratorOpen(false)
        }}
      >
        <DialogContent
          className="rounded-lg max-w-2xl bg-surface-container-lowest p-xl mx-md max-h-[90vh] overflow-y-auto"
          aria-describedby="assignment-generator-description"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-[28px] text-primary">auto_awesome</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Generate assignment with AI</h3>
              <p id="assignment-generator-description" className="font-label-sm text-label-sm text-on-surface-variant">
                The AI drafts a complete assignment and rubric from the selected scope&apos;s curriculum
                material for one or more sections. You review and approve it before it&apos;s saved.
              </p>
            </div>
          </div>

          <div className="mb-md">
            <QuizTargetPicker value={genTargets} onChange={handleGenTargetsChange} disabled={generate.isPending} />
          </div>

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Scope</label>
          <Select
            value={genScope}
            onValueChange={setGenScope}
            disabled={generate.isPending || !genCourseId || genUnitsLoading}
          >
            <SelectTrigger
              aria-label="Scope"
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 mb-md"
            >
              <SelectValue placeholder={genCourseId ? "Pick a scope…" : "Pick a class first…"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Entire course</SelectItem>
              {genUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.title}
                  {u.materials.length > 0 && ` (${u.materials.length} material${u.materials.length === 1 ? "" : "s"})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {genCourseId && !genUnitsLoading && genUnits.length === 0 && genScope !== ALL && (
            <p className="font-label-sm text-label-sm text-on-surface-variant -mt-md mb-md">
              Pick &quot;Entire course&quot; to generate from all uploaded material, or upload and group
              material into units to scope the assignment to a unit.
            </p>
          )}

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Assignment type
          </label>
          <Select
            value={genType}
            onValueChange={(v) => setGenType(v as AssignmentType)}
            disabled={generate.isPending}
          >
            <SelectTrigger aria-label="Assignment type" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-60 mb-md">
              <SelectValue placeholder="Assignment type" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{ASSIGNMENT_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Due date (required)
          </label>
          <Input
            type="datetime-local"
            value={genDueDate}
            required
            aria-label="Due date"
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setGenDueDate(e.target.value)}
            className="w-full h-auto rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus mb-lg"
          />

          {generate.isError && (
            <div className="mb-lg flex items-start gap-3 p-4 rounded-lg border border-dashed border-error/40 bg-error/5">
              <span className="material-symbols-outlined shrink-0 text-error">error</span>
              <p className="font-body-sm text-body-sm text-error">
                {generate.error instanceof Error ? generate.error.message : "Generation failed"}
              </p>
            </div>
          )}

          {generate.data?.status === "not_grounded" && (
            <div className="mb-lg flex items-start gap-3 p-4 rounded-lg border border-dashed border-tertiary bg-tertiary-fixed/60">
              <span className="material-symbols-outlined shrink-0 text-on-tertiary-fixed">search_off</span>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-tertiary-fixed font-bold">No matching curriculum material</p>
                <p className="font-body-sm text-body-sm text-on-tertiary-fixed/80 mt-0.5">
                  {generate.data.message}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-md">
            <Button
              type="button"
              onClick={() => setGeneratorOpen(false)}
              disabled={generate.isPending}
              className="flex-1 h-auto py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-md disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={runGenerate}
              disabled={generate.isPending || genTargets.length === 0 || !genScope || !genDueDate}
              className="flex-1 h-auto py-sm bg-primary text-white! font-label-md text-label-md rounded-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {generate.isPending ? "AI is drafting…" : "Generate draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}