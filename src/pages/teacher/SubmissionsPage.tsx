import { useMemo, useState, useCallback } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { SubmissionCard } from "@/components/teacher/SubmissionCard"
import { useSubmissions } from "@/hooks/use-submissions"
import { useTeacherOfferings } from "@/hooks/use-labs"
import { useAuth } from "@/providers/use-auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as api from "@/lib/api"

const statusOptions = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "GRADING_IN_PROGRESS", label: "Grading in Progress" },
  { value: "REVIEW_READY", label: "Review Ready" },
  { value: "CONFIRMED", label: "Confirmed" },
]

const statOrder: Array<{ key: "SUBMITTED" | "GRADING_IN_PROGRESS" | "REVIEW_READY" | "CONFIRMED"; label: string }> = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "GRADING_IN_PROGRESS", label: "Grading" },
  { key: "REVIEW_READY", label: "Review Ready" },
  { key: "CONFIRMED", label: "Confirmed" },
]

export function SubmissionsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [statusFilter, setStatusFilter] = useState<string>("")
  const [q, setQ] = useState<string>("")
  const [gradeId, setGradeId] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")
  const [offeringId, setOfferingId] = useState<string>("")
  const [assignmentId, setAssignmentId] = useState<string>(searchParams.get("assignmentId") ?? "")
  const [touched, setTouched] = useState(false)
  const [view, setView] = useState<"list" | "grid">("list")
  const [bulkState, setBulkState] = useState<{ pending: number; total: number } | null>(null)

  const offerings = useTeacherOfferings()
  const gradesQ = useQuery({
    queryKey: ["assistant", "grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })
  const allAssignmentsQ = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.getAssignments(),
    enabled: !!user?.id,
  })

  // Cascade options derived from the teacher's own offerings.
  const offeringGradeIds = useMemo(
    () => new Set((offerings.data ?? []).map((o) => o.section.gradeLevelId)),
    [offerings.data],
  )
  const grades = useMemo(
    () => (gradesQ.data ?? []).filter((g) => offeringGradeIds.has(g.id)),
    [gradesQ.data, offeringGradeIds],
  )

  // Deep-link support: ?assignmentId=xxx pre-selects the assignment and back-fills
  // the grade → course → section cascade from the assignment's offering. The
  // cascade values are derived during render until the teacher touches a filter.
  const deepAssignment = assignmentId
    ? (allAssignmentsQ.data ?? []).find((a) => a.id === assignmentId)
    : undefined
  const deepOffering = deepAssignment
    ? (offerings.data ?? []).find((o) => o.id === deepAssignment.courseOfferingId)
    : undefined

  const derivedGradeId = touched ? gradeId : (deepOffering?.section.gradeLevelId ?? gradeId)
  const derivedCourseId = touched ? courseId : (deepOffering?.course.id ?? courseId)
  const derivedOfferingId = touched ? offeringId : (deepOffering?.id ?? offeringId)

  const courseOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const o of offerings.data ?? []) {
      if (derivedGradeId && o.section.gradeLevelId !== derivedGradeId) continue
      byId.set(o.course.id, o.course.name)
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }))
  }, [offerings.data, derivedGradeId])
  const sectionOptions = useMemo(
    () =>
      (offerings.data ?? []).filter(
        (o) =>
          (!derivedGradeId || o.section.gradeLevelId === derivedGradeId) &&
          (!derivedCourseId || o.course.id === derivedCourseId),
      ),
    [offerings.data, derivedGradeId, derivedCourseId],
  )

  // Assignments visible to the teacher = assignments in the teacher's offerings,
  // further narrowed by the selected course/section when filters are active.
  const teacherOfferingIds = useMemo(
    () => new Set((offerings.data ?? []).map((o) => o.id)),
    [offerings.data],
  )
  const assignmentOptions = useMemo(() => {
    let list = (allAssignmentsQ.data ?? []).filter((a) =>
      teacherOfferingIds.has(a.courseOfferingId),
    )
    if (derivedOfferingId) list = list.filter((a) => a.courseOfferingId === derivedOfferingId)
    else if (derivedCourseId)
      list = list.filter((a) =>
        sectionOptions.some((o) => o.id === a.courseOfferingId),
      )
    return list
  }, [allAssignmentsQ.data, teacherOfferingIds, derivedOfferingId, derivedCourseId, sectionOptions])

  const filters = useMemo<api.SubmissionFilters>(() => {
    const f: api.SubmissionFilters = {}
    if (statusFilter) f.status = statusFilter
    if (assignmentId) f.assignmentId = assignmentId
    if (derivedCourseId) f.courseId = derivedCourseId
    if (derivedOfferingId) f.offeringId = derivedOfferingId
    if (q.trim()) f.q = q.trim()
    return f
  }, [statusFilter, assignmentId, derivedCourseId, derivedOfferingId, q])

  const { submissions, isLoading, isError, error, gradeSubmission, confirmGrade } =
    useSubmissions(filters)

  const clearFilters = () => {
    setStatusFilter("")
    setQ("")
    setGradeId("")
    setCourseId("")
    setOfferingId("")
    setAssignmentId("")
    setTouched(false)
    setSearchParams({})
  }

  const activeFilterCount = [
    statusFilter,
    q.trim(),
    gradeId,
    courseId,
    offeringId,
    assignmentId,
  ].filter(Boolean).length

  const stats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const sub of submissions.data ?? []) {
      counts.set(sub.status, (counts.get(sub.status) ?? 0) + 1)
    }
    return {
      total: submissions.data?.length ?? 0,
      byStatus: counts,
    }
  }, [submissions.data])

  const submittedSubs = useMemo(
    () => submissions.data?.filter((s) => s.status === "SUBMITTED") ?? [],
    [submissions.data],
  )

  const handleBulkGrade = useCallback(async () => {
    if (submittedSubs.length === 0) return
    setBulkState({ pending: 0, total: submittedSubs.length })
    let completed = 0
    for (const sub of submittedSubs) {
      try {
        await gradeSubmission.mutateAsync(sub.id)
        completed++
        setBulkState({ pending: completed, total: submittedSubs.length })
      } catch {
        toast.error(`Failed to grade ${sub.student?.name ?? "unknown"}`)
      }
    }
    setBulkState(null)
    if (completed === submittedSubs.length) {
      toast.success(`AI review complete for ${completed} submission${completed !== 1 ? "s" : ""}`)
    }
  }, [submittedSubs, gradeSubmission])

  if (isError) {
    return (
      <ErrorState
        title="Failed to load submissions"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => submissions.refetch()}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Review and confirm student work across your classes."
        actions={
          !isLoading && submittedSubs.length > 0 ? (
            <Button
              onClick={handleBulkGrade}
              disabled={bulkState !== null}
              className="flex items-center gap-xs px-md py-sm h-auto rounded-lg bg-primary text-primary-foreground font-label-md text-label-md active:scale-95 disabled:opacity-50"
            >
              {bulkState ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-lg animate-spin" />
                  AI Reviewing {bulkState.pending}/{bulkState.total}...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  AI Review All ({submittedSubs.length})
                </>
              )}
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 pt-0">
        {isLoading ? (
          <LoadingState label="Loading submissions..." />
        ) : (
          <>
            {/* Stats strip — one card per status; click to filter */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  !statusFilter
                    ? "border-primary bg-primary-fixed/20"
                    : "border-outline-variant bg-surface-container-lowest hover:border-primary/50"
                }`}
              >
                <p className="font-headline-lg text-headline-lg text-on-surface">{stats.total}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">All submissions</p>
              </button>
              {statOrder.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    statusFilter === key
                      ? "border-primary bg-primary-fixed/20"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary/50"
                  }`}
                >
                  <p className="font-headline-lg text-headline-lg text-on-surface">
                    {stats.byStatus.get(key) ?? 0}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
                </button>
              ))}
            </div>

            {/* Filter bar */}
            <div className="bg-surface-container-lowest/60 rounded-lg border border-outline-variant p-4 mb-5 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative min-w-[220px] flex-1 max-w-sm">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    search
                  </span>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by student name or email…"
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Grade</label>
                  <Select value={derivedGradeId} onValueChange={(v) => { setTouched(true); setGradeId(v); setCourseId(""); setOfferingId(""); setAssignmentId("") }}>
                    <SelectTrigger aria-label="Grade" className="w-auto min-w-[150px] h-10">
                      <SelectValue placeholder="All grades" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.length === 0 && (
                        <p className="px-3 py-2 text-sm text-on-surface-variant">No grades assigned yet</p>
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
                    onValueChange={(v) => { setTouched(true); setCourseId(v); setOfferingId(""); setAssignmentId("") }}
                    disabled={courseOptions.length === 0}
                  >
                    <SelectTrigger aria-label="Course" className="w-auto min-w-[180px] h-10">
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.length === 0 && (
                        <p className="px-3 py-2 text-sm text-on-surface-variant">
                          {derivedGradeId ? "No courses in this grade" : "No courses available"}
                        </p>
                      )}
                      {courseOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Section</label>
                  <Select
                    value={derivedOfferingId}
                    onValueChange={(v) => { setTouched(true); setOfferingId(v); setAssignmentId("") }}
                    disabled={sectionOptions.length === 0}
                  >
                    <SelectTrigger aria-label="Section" className="w-auto min-w-[150px] h-10">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionOptions.length === 0 && (
                        <p className="px-3 py-2 text-sm text-on-surface-variant">
                          {derivedCourseId ? "No sections for this course" : "No sections available"}
                        </p>
                      )}
                      {sectionOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.section.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Assignment</label>
                  <Select
                    value={assignmentId}
                    onValueChange={(v) => { setTouched(true); setAssignmentId(v) }}
                    disabled={assignmentOptions.length === 0}
                  >
                    <SelectTrigger aria-label="Assignment" className="w-auto min-w-[200px] h-10">
                      <SelectValue placeholder="All assignments" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentOptions.length === 0 && (
                        <p className="px-3 py-2 text-sm text-on-surface-variant">No assignments</p>
                      )}
                      {assignmentOptions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-auto min-w-[170px] h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="h-10 px-md font-label-md">
                    Clear filters ({activeFilterCount})
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-3">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {stats.total} submission{stats.total !== 1 ? "s" : ""}
                  {activeFilterCount > 0 ? " match the current filters" : " across your classes"}
                </p>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-label="Card view"
                    aria-pressed={view === "grid"}
                    className={`p-xs rounded-lg material-symbols-outlined transition-colors ${
                      view === "grid" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    grid_view
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    className={`p-xs rounded-lg material-symbols-outlined transition-colors ${
                      view === "list" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    list
                  </button>
                </div>
              </div>
            </div>

            {submissions.data?.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <EmptyState flat
                  icon="inbox"
                  title="No submissions yet"
                  description={
                    activeFilterCount > 0
                      ? "No submissions match the selected filters."
                      : "Submissions from your students will appear here."
                  }
                />
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {submissions.data?.map((sub, idx) => (
                  <SubmissionCard
                    key={sub.id}
                    submission={sub}
                    iconIndex={idx}
                    gradeMutation={gradeSubmission}
                    confirmMutation={confirmGrade}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-outline-variant font-label-sm text-label-sm text-on-surface-variant">
                      <TableHead className="px-4 py-3 h-auto">Student</TableHead>
                      <TableHead className="px-4 py-3 h-auto">Assignment</TableHead>
                      <TableHead className="px-4 py-3 h-auto">Course · Section</TableHead>
                      <TableHead className="px-4 py-3 h-auto">Status</TableHead>
                      <TableHead className="px-4 py-3 h-auto text-right">Points</TableHead>
                      <TableHead className="px-4 py-3 h-auto">Submitted</TableHead>
                      <TableHead className="px-4 py-3 h-auto text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.data?.map((sub) => {
                      const totalPoints =
                        sub.scores?.reduce((sum, s) => sum + s.pointsAwarded, 0) ?? 0
                      return (
                        <TableRow key={sub.id} className="border-outline-variant">
                          <TableCell className="px-4 py-3">
                            <p className="font-body-md text-body-md text-on-surface">
                              {sub.student?.name ?? "Unknown Student"}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {sub.student?.email ?? ""}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="font-body-md text-body-md text-on-surface">
                              {sub.assignment?.title ?? "Untitled assignment"}
                            </p>
                            {sub.assignment?.dueDate && (
                              <p className="font-label-sm text-label-sm text-on-surface-variant">
                                Due {new Date(sub.assignment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="font-body-md text-body-md text-on-surface">
                              {sub.assignment?.offering?.course?.name ?? "—"}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {sub.assignment?.offering?.section?.name ?? "—"}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <StatusBadge status={sub.status} />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-body-md text-body-md text-on-surface">
                            {sub.scores && sub.scores.length > 0 ? totalPoints : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/submissions/${sub.id}`}
                                className="flex items-center gap-1 px-md py-sm border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-white transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                View
                              </Link>
                              {sub.status === "SUBMITTED" && (
                                <Button
                                  onClick={() => gradeSubmission.mutate(sub.id)}
                                  disabled={gradeSubmission.isPending}
                                  className="flex items-center gap-1 px-md py-sm bg-primary text-primary-foreground rounded-lg font-label-md text-label-md h-auto active:scale-95 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                  Grade
                                </Button>
                              )}
                              {sub.status === "REVIEW_READY" && (
                                <Button
                                  onClick={() => confirmGrade.mutate(sub)}
                                  disabled={confirmGrade.isPending}
                                  className="flex items-center gap-1 px-md py-sm bg-primary text-primary-foreground rounded-lg font-label-md text-label-md h-auto active:scale-95 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  Confirm
                                </Button>
                              )}
                              {sub.status === "GRADING_IN_PROGRESS" && (
                                <div className="flex items-center gap-2 px-md py-sm">
                                  <span className="w-2 h-2 bg-primary-fixed-dim rounded-lg animate-pulse" />
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">Grading...</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}