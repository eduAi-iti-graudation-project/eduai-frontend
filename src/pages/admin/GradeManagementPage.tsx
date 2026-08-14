import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PrecisionStatCard } from "@/components/admin/PrecisionStatCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RenameState {
  kind: "section" | "course"
  id: string
  name: string
}

export function GradeManagementPage() {
  const queryClient = useQueryClient()
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState("")
  const [newName, setNewName] = useState("")
  const [showCreateGrade, setShowCreateGrade] = useState(false)
  const [showNewSection, setShowNewSection] = useState(false)
  const [secName, setSecName] = useState("")
  const [secDesc, setSecDesc] = useState("")
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [courseName, setCourseName] = useState("")
  const [courseDesc, setCourseDesc] = useState("")
  const [renaming, setRenaming] = useState<RenameState | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const grades = useQuery({
    queryKey: ["admin-grades"],
    queryFn: api.getAllGrades,
  })

  const classes = useQuery({
    queryKey: ["admin-classes"],
    queryFn: api.getClasses,
  })

  const courses = useQuery({
    queryKey: ["admin-courses"],
    queryFn: api.getCourses,
  })

  const offerings = useQuery({
    queryKey: ["admin-offerings"],
    queryFn: () => api.getOfferings(),
  })

  const teachers = useQuery({
    queryKey: ["users", "TEACHER"],
    queryFn: () => api.getUsers({ role: "TEACHER" }),
  })

  const roster = useQuery({
    queryKey: ["users", "STUDENT", "grade-page"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-grades"] })
    queryClient.invalidateQueries({ queryKey: ["admin-classes"] })
    queryClient.invalidateQueries({ queryKey: ["admin-courses"] })
    queryClient.invalidateQueries({ queryKey: ["admin-offerings"] })
  }

  const createGrade = useMutation({
    mutationFn: () => api.createGrade({ level: parseInt(newLevel), name: newName }),
    onSuccess: () => {
      invalidate()
      toast.success("Grade created")
      setNewLevel("")
      setNewName("")
      setShowCreateGrade(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeGrade = useMutation({
    mutationFn: (id: string) => api.deleteGrade(id),
    onSuccess: () => {
      invalidate()
      toast.success("Grade deleted")
      setSelectedGradeId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createSection = useMutation({
    mutationFn: () =>
      api.createClass({
        gradeLevelId: selectedGradeId!,
        name: secName.trim(),
        description: secDesc.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate()
      toast.success("Section created")
      setSecName("")
      setSecDesc("")
      setShowNewSection(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createCourse = useMutation({
    mutationFn: () =>
      api.createCourse({
        gradeLevelId: selectedGradeId!,
        name: courseName.trim(),
        description: courseDesc.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate()
      toast.success("Course created")
      setCourseName("")
      setCourseDesc("")
      setShowNewCourse(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const assignCell = useMutation({
    mutationFn: ({
      sectionId,
      courseId,
      teacherId,
    }: {
      sectionId: string
      courseId: string
      teacherId: string
    }) => {
      const existing = offeringMap.get(`${sectionId}|${courseId}`)
      if (existing) {
        return api.updateOffering(existing.id, { teacherId })
      }
      return api.createOffering({ courseId, sectionId, teacherId })
    },
    onSuccess: () => {
      invalidate()
      toast.success("Teacher assigned")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeOffering = useMutation({
    mutationFn: (id: string) => api.deleteOffering(id),
    onSuccess: () => {
      invalidate()
      toast.success("Offering removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rename = useMutation({
    mutationFn: () => {
      const value = renameValue.trim()
      if (renaming?.kind === "section") {
        return api.updateClass(renaming.id, { name: value })
      }
      return api.updateCourse(renaming!.id, { name: value })
    },
    onSuccess: () => {
      invalidate()
      toast.success("Renamed")
      setRenaming(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeSection = useMutation({
    mutationFn: (id: string) => api.deleteClass(id),
    onSuccess: () => {
      invalidate()
      toast.success("Section removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeCourse = useMutation({
    mutationFn: (id: string) => api.deleteCourse(id),
    onSuccess: () => {
      invalidate()
      toast.success("Course removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const list = grades.data ?? []
  const allSections = classes.data ?? []
  const allCourses = courses.data ?? []
  const teacherList = teachers.data ?? []
  const studentCount = roster.data?.length ?? 0

  const selectedGrade =
    list.find((g) => g.id === selectedGradeId) ?? list[0] ?? null

  const gradeSections = allSections
    .filter((c) => c.gradeLevelId === selectedGrade?.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  const gradeCourses = allCourses
    .filter((c) => c.gradeLevelId === selectedGrade?.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  const offeringCount = allSections.reduce(
    (sum, s) => sum + (s._count?.offerings ?? 0),
    0,
  )

  const offeringMap = new Map<string, api.CourseOffering>()
  for (const o of offerings.data ?? []) {
    offeringMap.set(`${o.section.id}|${o.course.id}`, o)
  }

  const startRename = (kind: "section" | "course", id: string, name: string) => {
    setRenaming({ kind, id, name })
    setRenameValue(name)
  }

  const saveRename = () => {
    if (renaming && renameValue.trim() && renameValue.trim() !== renaming.name) {
      rename.mutate()
    } else {
      setRenaming(null)
    }
  }

  const confirmRemoveGrade = (grade: (typeof list)[number]) => {
    if (
      !window.confirm(
        `Delete "${grade.name || `Grade ${grade.level}`}"? This permanently removes its sections, courses, classes, enrollments and all related data.`,
      )
    )
      return
    removeGrade.mutate(grade.id)
  }

  const confirmRemoveOffering = (offering: api.CourseOffering) => {
    if (
      !window.confirm(
        `Remove "${offering.course.name}" from section ${offering.section.name}? This deletes the offering and its assignments, quizzes and materials.`,
      )
    )
      return
    removeOffering.mutate(offering.id)
  }

  const confirmRemoveSection = (section: (typeof gradeSections)[number]) => {
    if (!window.confirm(`Delete "${section.name}"? This removes the section and its classes.`)) return
    removeSection.mutate(section.id)
  }

  const confirmRemoveCourse = (course: (typeof gradeCourses)[number]) => {
    if (!window.confirm(`Delete "${course.name}"? This removes the course from this grade.`)) return
    removeCourse.mutate(course.id)
  }

  if (grades.isLoading || classes.isLoading || courses.isLoading || offerings.isLoading) {
    return <LoadingState label="Loading academic structure…" />
  }

  if (grades.isError || classes.isError || courses.isError || offerings.isError) {
    return (
      <ErrorState
        title="Couldn't load the academic structure"
        message="Failed to load grades, sections or courses."
        onRetry={() => {
          grades.refetch()
          classes.refetch()
          courses.refetch()
          offerings.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <PageHeader
          title="Academic Structure"
          subtitle={`${list.length} grade levels · ${allSections.length} sections · ${allCourses.length} courses`}
          actions={
            <Button
              type="button"
              onClick={() => setShowCreateGrade(!showCreateGrade)}
              className="h-auto rounded-md bg-primary text-primary-foreground px-4 py-2 font-label-md text-label-md flex items-center gap-1 hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Grade
            </Button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <PrecisionStatCard
            icon="school"
            label="Grade levels"
            value={list.length}
            delta={{ label: "Total", direction: "flat", tone: "neutral" }}
            spark={[1, 1, 2, 3, 3, 4, 5, Math.max(list.length, 1)]}
            iconClass="bg-primary-fixed text-on-primary-fixed-variant"
          />
          <PrecisionStatCard
            icon="meeting_room"
            label="Sections"
            value={allSections.length}
            delta={{ label: "Total", direction: "flat", tone: "neutral" }}
            spark={[3, 5, 4, 7, 8, 10, 12, Math.max(allSections.length, 1)]}
            iconClass="bg-secondary-fixed text-on-secondary-fixed-variant"
          />
          <PrecisionStatCard
            icon="menu_book"
            label="Courses"
            value={allCourses.length}
            delta={{ label: "Total", direction: "flat", tone: "neutral" }}
            spark={[2, 4, 3, 6, 7, 8, 10, Math.max(allCourses.length, 1)]}
            iconClass="bg-tertiary-fixed text-on-tertiary-fixed-variant"
          />
          <PrecisionStatCard
            icon="badge"
            label="Offerings"
            value={offeringCount}
            delta={{ label: "Assigned", direction: "flat", tone: "neutral" }}
            spark={[1, 2, 3, 4, 6, 7, 8, Math.max(offeringCount, 1)]}
            iconClass="bg-[#e9edfe] text-[#2c5fb3]"
          />
          <PrecisionStatCard
            icon="groups"
            label="Students rostered"
            value={studentCount.toLocaleString()}
            delta={{ label: "Roster", direction: "flat", tone: "neutral" }}
            spark={[120, 160, 150, 210, 260, 300, 420, Math.max(studentCount, 1)]}
            iconClass="bg-[#dcfce7] text-[#15803d]"
          />
        </div>

        {showCreateGrade && (
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Create grade level</h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Level (1-12)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-outline-variant font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex-[2]">
                <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Eighth Grade"
                  className="w-full h-10 px-3 py-2 rounded-md border border-outline-variant font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="button"
                onClick={() => createGrade.mutate()}
                disabled={!newLevel || !newName || createGrade.isPending}
                className="h-10 rounded-md bg-primary text-primary-foreground px-4 font-label-md text-label-md hover:bg-primary/90"
              >
                Create
              </Button>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-outline inline-block mb-2">school</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">No grade levels yet</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Create your first grade level to start building sections and courses.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <aside className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-80 shrink-0 pb-1 lg:pb-0">
              {list.map((g) => {
                const active = selectedGrade?.id === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGradeId(g.id)}
                    className={cn(
                      "min-w-56 lg:min-w-0 text-left rounded-lg border p-4 transition-all shrink-0",
                      active
                        ? "border-primary bg-primary-fixed/30 shadow-sm"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 font-label-sm text-label-sm font-medium",
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-primary-fixed text-on-primary-fixed-variant",
                        )}
                      >
                        Grade {g.level}
                      </span>
                      <span
                        className={cn(
                          "material-symbols-outlined text-[18px]",
                          active ? "text-primary" : "text-outline-variant",
                        )}
                      >
                        {active ? "check_circle" : "chevron_right"}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface mt-2 truncate">
                      {g.name || `Grade ${g.level}`}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {g.sections} sections · {g.courses} courses · {g.students} students
                    </p>
                  </button>
                )
              })}
            </aside>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">
                      {selectedGrade?.name || `Grade ${selectedGrade?.level}`}
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Grade {selectedGrade?.level} · {gradeSections.length} sections · {gradeCourses.length} courses · {selectedGrade?.students} students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectedGrade && confirmRemoveGrade(selectedGrade)}
                      disabled={removeGrade.isPending}
                      className="w-9 h-9 flex items-center justify-center rounded-md border border-outline-variant text-error hover:bg-error-container transition-colors shrink-0"
                      title="Delete grade"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewSection(!showNewSection)}
                      className="h-auto rounded-md px-3 py-2 font-label-md text-label-md flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      New Section
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowNewCourse(!showNewCourse)}
                      className="h-auto rounded-md bg-primary text-primary-foreground px-3 py-2 font-label-md text-label-md flex items-center gap-1 hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      New Course
                    </Button>
                  </div>
                </div>

                {showNewSection && (
                  <div className="bg-surface-container-low rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Section name</Label>
                        <Input
                          value={secName}
                          onChange={(e) => setSecName(e.target.value)}
                          placeholder="e.g. 9A"
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                        />
                      </div>
                      <div>
                        <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Description (optional)</Label>
                        <Input
                          value={secDesc}
                          onChange={(e) => setSecDesc(e.target.value)}
                          placeholder="e.g. Morning homeroom"
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          type="button"
                          onClick={() => createSection.mutate()}
                          disabled={!secName.trim() || createSection.isPending}
                          className="h-10 rounded-md bg-primary text-primary-foreground px-4 font-label-md text-label-md hover:bg-primary/90"
                        >
                          {createSection.isPending ? "Creating…" : "Create"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowNewSection(false)
                            setSecName("")
                            setSecDesc("")
                          }}
                          className="h-10 rounded-md px-3 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {showNewCourse && (
                  <div className="bg-surface-container-low rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Course name</Label>
                        <Input
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                        />
                      </div>
                      <div>
                        <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Description (optional)</Label>
                        <Input
                          value={courseDesc}
                          onChange={(e) => setCourseDesc(e.target.value)}
                          placeholder="e.g. Algebra & geometry"
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          type="button"
                          onClick={() => createCourse.mutate()}
                          disabled={!courseName.trim() || createCourse.isPending}
                          className="h-10 rounded-md bg-primary text-primary-foreground px-4 font-label-md text-label-md hover:bg-primary/90"
                        >
                          {createCourse.isPending ? "Creating…" : "Create"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowNewCourse(false)
                            setCourseName("")
                            setCourseDesc("")
                          }}
                          className="h-10 rounded-md px-3 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-outline-variant overflow-hidden mb-4">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                    <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">table_chart</span>
                      Teacher assignments
                    </h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">course × section</span>
                  </div>
                  {gradeSections.length === 0 || gradeCourses.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant px-4 py-6 text-center">
                      {gradeSections.length === 0
                        ? "Create a section first to assign teachers."
                        : "Create a course first to assign teachers."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                        <thead>
                          <tr className="border-b border-outline-variant">
                            <th className="text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-4 py-2.5 min-w-40">
                              Section
                            </th>
                            {gradeCourses.map((c) => (
                              <th key={c.id} className="text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-4 py-2.5">
                                {c.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gradeSections.map((s) => (
                            <tr key={s.id} className="border-b border-outline-variant last:border-b-0">
                              <td className="px-4 py-2.5">
                                <p className="font-body-md text-body-md text-on-surface">{s.name}</p>
                                <p className="font-label-sm text-label-sm text-on-surface-variant">
                                  {s._count?.enrollments ?? 0} students
                                </p>
                              </td>
                              {gradeCourses.map((c) => {
                                const offering = offeringMap.get(`${s.id}|${c.id}`)
                                return (
                                  <td key={c.id} className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={offering?.teacher.id ?? ""}
                                        onChange={(e) =>
                                          e.target.value &&
                                          assignCell.mutate({
                                            sectionId: s.id,
                                            courseId: c.id,
                                            teacherId: e.target.value,
                                          })
                                        }
                                        disabled={teacherList.length === 0 || assignCell.isPending}
                                        title={teacherList.length === 0 ? "No teachers in your school yet" : undefined}
                                        className="px-2 py-1.5 rounded-md border border-outline-variant font-body-sm text-body-sm bg-surface-container-lowest outline-none focus:border-primary w-full min-w-32"
                                      >
                                        <option value="">{offering ? "Reassign…" : "Assign…"}</option>
                                        {teacherList.map((t) => (
                                          <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                      </select>
                                      {offering && (
                                        <button
                                          type="button"
                                          onClick={() => confirmRemoveOffering(offering)}
                                          disabled={removeOffering.isPending}
                                          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-error hover:bg-error-container transition-colors"
                                          title="Remove offering"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">meeting_room</span>
                      Sections
                    </h3>
                    {gradeSections.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          No sections in this grade yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {gradeSections.map((s) => (
                          <div key={s.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center bg-secondary-fixed text-on-secondary-fixed-variant">
                                <span className="material-symbols-outlined text-[18px]">door_open</span>
                              </span>
                              <div className="min-w-0 flex-1">
                                {renaming?.kind === "section" && renaming.id === s.id ? (
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRename()
                                      if (e.key === "Escape") setRenaming(null)
                                    }}
                                    onBlur={saveRename}
                                    autoFocus
                                    className="w-full max-w-64 px-3 py-1 rounded-md border border-primary font-body-md text-body-md bg-surface-container-lowest outline-none h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                                  />
                                ) : (
                                  <p className="font-body-md text-body-md text-on-surface truncate">{s.name}</p>
                                )}
                                <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                                  {s.description ? `${s.description} · ` : ""}
                                  {s._count?.enrollments ?? 0} students
                                </p>
                                {(s.courses?.length ?? 0) > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {s.courses!.map((c) => (
                                      <span key={c} className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startRename("section", s.id, s.name)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                  title="Rename"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmRemoveSection(s)}
                                  disabled={removeSection.isPending}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-error hover:bg-error-container transition-colors"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">menu_book</span>
                      Courses
                    </h3>
                    {gradeCourses.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          No courses in this grade yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {gradeCourses.map((c) => (
                          <div key={c.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center bg-tertiary-fixed text-on-tertiary-fixed-variant">
                                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                              </span>
                              <div className="min-w-0 flex-1">
                                {renaming?.kind === "course" && renaming.id === c.id ? (
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRename()
                                      if (e.key === "Escape") setRenaming(null)
                                    }}
                                    onBlur={saveRename}
                                    autoFocus
                                    className="w-full max-w-64 px-3 py-1 rounded-md border border-primary font-body-md text-body-md bg-surface-container-lowest outline-none h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                                  />
                                ) : (
                                  <p className="font-body-md text-body-md text-on-surface truncate">{c.name}</p>
                                )}
                                {c.description && (
                                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">{c.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startRename("course", c.id, c.name)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                  title="Rename"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmRemoveCourse(c)}
                                  disabled={removeCourse.isPending}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-error hover:bg-error-container transition-colors"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {teacherList.length === 0 && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-4">
                    No teachers in your school yet — add one before assigning them to sections.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}