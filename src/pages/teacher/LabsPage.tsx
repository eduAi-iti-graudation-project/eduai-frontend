import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useTeacherOfferings } from "@/hooks/use-labs"
import { useGenerateLab, useLabs } from "@/hooks/use-labs"
import { LabStatusChip } from "@/components/labs/LabStatusChip"
import * as api from "@/lib/api"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function LabsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [touched, setTouched] = useState(false)
  const [gradeId, setGradeId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [offeringId, setOfferingId] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([])

  const offerings = useTeacherOfferings()
  const gradesQ = useQuery({
    queryKey: ["assistant", "grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })

  // Cascade defaults to the teacher's first teaching offering (recommended);
  // touching any dropdown switches to the manual selection.
  const initialOffering = offerings.data?.[0]

  const offeringGradeIds = useMemo(
    () => new Set((offerings.data ?? []).map((o) => o.section.gradeLevelId)),
    [offerings.data],
  )
  const grades = useMemo(
    () => (gradesQ.data ?? []).filter((g) => offeringGradeIds.has(g.id)),
    [gradesQ.data, offeringGradeIds],
  )

  const derivedGradeId = touched ? gradeId : (initialOffering?.section.gradeLevelId ?? "")
  const derivedCourseId = touched ? courseId : (initialOffering?.course.id ?? "")

  const courseOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const o of offerings.data ?? []) {
      if (o.section.gradeLevelId !== derivedGradeId) continue
      byId.set(o.course.id, o.course.name)
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [offerings.data, derivedGradeId])

  const sectionOptions = useMemo(
    () =>
      (offerings.data ?? []).filter(
        (o) =>
          o.section.gradeLevelId === derivedGradeId &&
          o.course.id === derivedCourseId,
      ),
    [offerings.data, derivedGradeId, derivedCourseId],
  )

  const derivedOfferingId =
    touched ||
    !derivedCourseId ||
    !initialOffering ||
    !sectionOptions.some((o) => o.id === initialOffering.id)
      ? offeringId
      : initialOffering.id

  const { labs, isLoading } = useLabs(derivedOfferingId || undefined)
  const generate = useGenerateLab()

  const offeringNameMap = useMemo(
    () => new Map((offerings.data ?? []).map((o) => [o.id, `${o.course.name} · ${o.section.name}`])),
    [offerings.data],
  )

  // Sections available for a given grade + course (used to pre-select the
  // dialog's section checkboxes whenever the course changes).
  const sectionIdsFor = (grade: string, course: string) =>
    (offerings.data ?? [])
      .filter((o) => o.section.gradeLevelId === grade && o.course.id === course)
      .map((o) => o.id)

  const openDialog = () => {
    if (sectionOptions.length === 0) return
    // Default to the section the top bar is currently filtered to; otherwise
    // pre-select every section of the chosen course.
    const defaults =
      derivedOfferingId && sectionOptions.some((o) => o.id === derivedOfferingId)
        ? [derivedOfferingId]
        : sectionOptions.map((o) => o.id)
    setSelectedOfferingIds(defaults)
    setDialogOpen(true)
  }

  const toggleOffering = (id: string) => {
    setSelectedOfferingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canGenerate = selectedOfferingIds.length > 0 && topic.trim().length >= 3 && !generate.isPending

  const submit = () => {
    if (!canGenerate) return
    generate.mutate(
      { courseOfferingIds: selectedOfferingIds, topic: topic.trim() },
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
          <Button onClick={openDialog} disabled={!offerings.data?.length}>
            New lab
          </Button>
        }
      />

      <div className="px-6 pb-6 flex-1 min-h-0">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Grade</label>
            <Select
              value={derivedGradeId}
              onValueChange={(v) => {
                setTouched(true)
                setGradeId(v)
                setCourseId("")
                setOfferingId("")
              }}
            >
              <SelectTrigger aria-label="Grade" className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[150px]">
                <SelectValue placeholder="Grade…" />
              </SelectTrigger>
              <SelectContent>
                {grades.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">
                    No grades assigned yet
                  </p>
                )}
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Grade {g.level}
                    {g.name ? ` — ${g.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Course</label>
            <Select
              value={derivedCourseId}
              onValueChange={(v) => {
                setTouched(true)
                setCourseId(v)
                setOfferingId("")
              }}
              disabled={!derivedGradeId}
            >
              <SelectTrigger aria-label="Course" className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[180px] disabled:opacity-50">
                <SelectValue placeholder="Course…" />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">
                    {derivedGradeId ? "No courses in this grade" : "Pick a grade first"}
                  </p>
                )}
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Section</label>
            <Select
              value={derivedOfferingId}
              onValueChange={(v) => {
                setTouched(true)
                setOfferingId(v)
              }}
              disabled={!derivedCourseId}
            >
              <SelectTrigger aria-label="Section" className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[150px] disabled:opacity-50">
                <SelectValue placeholder="Section…" />
              </SelectTrigger>
              <SelectContent>
                {sectionOptions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">
                    {derivedCourseId
                      ? "You don't teach this in any section"
                      : "Pick a course first"}
                  </p>
                )}
              {sectionOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
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
              security-reviews the code before you see it. Usually takes 30–90 seconds. Pick the sections it should be
              published to once it passes review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">Grade</label>
              <Select
                value={derivedGradeId}
                onValueChange={(v) => {
                  setTouched(true)
                  setGradeId(v)
                  setCourseId("")
                  setOfferingId("")
                  setSelectedOfferingIds([])
                }}
              >
                <SelectTrigger className="w-full form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
                  <SelectValue placeholder="Choose a grade…" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      Grade {g.level}
                      {g.name ? ` — ${g.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">Course</label>
              <Select
                value={derivedCourseId}
                onValueChange={(v) => {
                  setTouched(true)
                  setCourseId(v)
                  setOfferingId("")
                  setSelectedOfferingIds(sectionIdsFor(derivedGradeId, v))
                }}
                disabled={!derivedGradeId}
              >
                <SelectTrigger className="w-full form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface disabled:opacity-50">
                  <SelectValue placeholder="Choose a course…" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">Sections</label>
              <div className="rounded-lg border border-outline-variant bg-surface divide-y divide-outline-variant/60">
                {sectionOptions.length === 0 ? (
                  <p className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">
                    {derivedCourseId
                      ? "You don't teach this course in any section."
                      : "Pick a grade and course first."}
                  </p>
                ) : (
                  sectionOptions.map((o) => {
                    const checked = selectedOfferingIds.includes(o.id)
                    return (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <Checkbox
                          id={`lab-section-${o.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleOffering(o.id)}
                        />
                        <label
                          htmlFor={`lab-section-${o.id}`}
                          className="flex-1 cursor-pointer select-none"
                        >
                          <span className="block font-label-md text-label-md text-on-surface">
                            {o.section.name}
                          </span>
                        </label>
                      </div>
                    )
                  })
                )}
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                {selectedOfferingIds.length > 0
                  ? `${selectedOfferingIds.length} section${selectedOfferingIds.length === 1 ? "" : "s"} selected — the lab is published to all of them at once.`
                  : "Select at least one section."}
              </p>
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