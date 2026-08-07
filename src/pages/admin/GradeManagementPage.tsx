import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useOrganization } from "@/hooks/use-organization"
import { PageHeader } from "@/components/shared/PageHeader"
import { MiniStat } from "@/components/admin/MiniStat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function GradeManagementPage() {
  const queryClient = useQueryClient()
  const { data: org } = useOrganization()
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState("")
  const [newName, setNewName] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [classToAdd, setClassToAdd] = useState("")
  const [showNewClass, setShowNewClass] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassDesc, setNewClassDesc] = useState("")
  const [newClassTeacher, setNewClassTeacher] = useState("")

  const grades = useQuery({
    queryKey: ["admin-grades"],
    queryFn: api.getAllGrades,
  })

  const allClasses = useQuery({
    queryKey: ["admin-classes"],
    queryFn: api.getClasses,
  })

  const teachers = useQuery({
    queryKey: ["users", "TEACHER"],
    queryFn: () => api.getUsers({ role: "TEACHER" }),
  })

  const roster = useQuery({
    queryKey: ["users", "STUDENT", "grade-page"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const gradeClasses = useQuery({
    queryKey: ["grade-classes", expandedGrade],
    queryFn: () => api.getGradeClasses(expandedGrade!),
    enabled: !!expandedGrade,
  })

  const createGrade = useMutation({
    mutationFn: () => api.createGrade({ level: parseInt(newLevel), name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-grades"] })
      toast.success("Grade created")
      setNewLevel("")
      setNewName("")
      setShowCreate(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addClass = useMutation({
    mutationFn: () => api.addClassToGrade(expandedGrade!, classToAdd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-classes", expandedGrade] })
      toast.success("Class added to grade")
      setClassToAdd("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeClass = useMutation({
    mutationFn: (classId: string) => api.removeClassFromGrade(expandedGrade!, classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-classes", expandedGrade] })
      toast.success("Class removed from grade")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createAndAssignClass = useMutation({
    mutationFn: async () => {
      const cls = await api.createClass({
        name: newClassName.trim(),
        description: newClassDesc.trim() || undefined,
        teacherId: newClassTeacher,
      })
      await api.addClassToGrade(expandedGrade!, cls.id)
      return cls
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-grades"] })
      queryClient.invalidateQueries({ queryKey: ["grade-classes", expandedGrade] })
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] })
      toast.success("Class created and added to grade")
      setNewClassName("")
      setNewClassDesc("")
      setNewClassTeacher("")
      setShowNewClass(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const changeTeacher = useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      api.updateClass(classId, { teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-classes", expandedGrade] })
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] })
      toast.success("Teacher updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const list = grades.data ?? []

  const teachersById = new Map((teachers.data ?? []).map((t) => [t.id, t.name]))
  const classNames = new Map((allClasses.data ?? []).map((c) => [c.id, c.name]))

  const gradeClassesList = (gradeClasses.data ?? []).filter(
    (c) => org?.id != null && (c as { organizationId?: string }).organizationId === org.id,
  )

  const gradeClassIds = new Set(gradeClassesList.map((c) => c.id))
  const unassignedClasses = (allClasses.data ?? []).filter((c) => !gradeClassIds.has(c.id))

  const classesByTeacher = gradeClassesList.reduce<Map<string, typeof gradeClassesList>>((acc, c) => {
    const tid = (c as unknown as { teacherId: string }).teacherId ?? "unassigned"
    if (!acc.has(tid)) acc.set(tid, [])
    acc.get(tid)!.push(c)
    return acc
  }, new Map())

  const totalEnrolled = roster.data?.length ?? 0

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <PageHeader
          title="Grades & Faculty"
          subtitle={
            `${list.length} grade levels · ${teachers.data?.length ?? 0} teachers · ${allClasses.data?.length ?? 0} classes`
          }
          actions={
            <Button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="h-auto rounded-md bg-primary text-primary-foreground px-4 py-2 font-label-md text-label-md flex items-center gap-1 hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Grade
            </Button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon="school" label="Grade levels" value={list.length} />
          <MiniStat icon="co_present" label="Teachers" value={teachers.data?.length ?? 0} />
          <MiniStat icon="meeting_room" label="Classes" value={allClasses.data?.length ?? 0} />
          <MiniStat icon="groups" label="Students rostered" value={totalEnrolled} />
        </div>

        {showCreate && (
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

        <div className="space-y-3">
          {list.map((g) => (
            <div key={g.id} className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setExpandedGrade(expandedGrade === g.id ? null : g.id)}
                className="w-full h-auto justify-between px-5 py-4 rounded-none hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-headline-md text-headline-md text-on-surface">{g.name}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Grade {g.level}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: expandedGrade === g.id ? "rotate(180deg)" : "" }}>
                  expand_more
                </span>
              </Button>

              {expandedGrade === g.id && (
                <div className="px-5 pb-4 border-t border-outline-variant">
                  {gradeClasses.isLoading ? (
                    <div className="space-y-2 mt-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 bg-surface-container-high rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : classesByTeacher.size === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-4">No classes in this grade.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {[...classesByTeacher.entries()].map(([tid, clsList]) => {
                        const list = clsList ?? []
                        const teacherName = teachersById.get(tid) ?? "Unknown Teacher"
                        return (
                          <div key={tid}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
                              <span className="font-label-lg text-label-lg text-on-surface">{teacherName}</span>
                            </div>
                            <div className="space-y-2">
                              {list.map((c) => {
                                const currentTid = (c as unknown as { teacherId: string }).teacherId ?? ""
                                return (
                                <div key={c.id} className="flex items-center justify-between bg-surface-container-low rounded-lg px-md py-2 ml-6">
                                  <span className="font-label-md text-label-md text-on-surface">{classNames.get(c.id) || c.name || `Class (${c.id.slice(0, 8)})`}</span>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={currentTid}
                                      onChange={(e) => changeTeacher.mutate({ classId: c.id, teacherId: e.target.value })}
                                      disabled={changeTeacher.isPending}
                                      className="px-sm py-1 rounded-lg border border-outline-variant font-body-sm text-body-sm bg-surface-container-lowest outline-none focus:border-primary"
                                    >
                                      {(teachers.data ?? []).map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() => removeClass.mutate(c.id)}
                                      disabled={removeClass.isPending}
                                      className="text-error font-label-sm text-label-sm hover:underline hover:text-error hover:bg-transparent px-0 h-auto"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              )})}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-outline-variant space-y-3">
                    <div className="flex items-center gap-3">
                      <Select value={classToAdd} onValueChange={setClassToAdd}>
                        <SelectTrigger className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-md py-2 h-auto font-body-md text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0 focus:ring-transparent focus:ring-offset-0">
                          <SelectValue placeholder="Select a class to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedClasses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}{c.description ? ` — ${c.description}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addClass.mutate()}
                        disabled={!classToAdd || addClass.isPending}
                        className="h-auto rounded-lg bg-primary text-primary-foreground px-md py-2 font-label-md text-label-sm hover:bg-primary/90/90"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewClass(!showNewClass)}
                        className="h-auto rounded-lg border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container px-md py-2 font-label-md text-label-sm flex items-center gap-1 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Class
                      </Button>
                    </div>

                    {showNewClass && (
                      <div className="bg-surface-container-low rounded-lg p-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Class Name</Label>
                            <Input
                              value={newClassName}
                              onChange={(e) => setNewClassName(e.target.value)}
                              placeholder="e.g. Math 8A"
                              className="w-full px-md py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                            />
                          </div>
                          <div>
                            <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Description (optional)</Label>
                            <Input
                              value={newClassDesc}
                              onChange={(e) => setNewClassDesc(e.target.value)}
                              placeholder="e.g. Algebra focus"
                              className="w-full px-md py-2 rounded-lg border border-outline-variant font-body-md bg-surface-container-lowest outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Teacher</Label>
                          <Select value={newClassTeacher} onValueChange={setNewClassTeacher}>
                            <SelectTrigger className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 h-auto font-body-md text-body-md focus:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0 focus:ring-transparent focus:ring-offset-0">
                              <SelectValue placeholder="Select a teacher..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(teachers.data ?? []).map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(teachers.data ?? []).length === 0 && (
                            <p className="text-on-surface-variant text-label-sm ml-1 mt-1">
                              No teachers in your school yet — add one before creating classes.
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => createAndAssignClass.mutate()}
                            disabled={!newClassName.trim() || !newClassTeacher || createAndAssignClass.isPending}
                            className="h-auto rounded-lg bg-primary text-primary-foreground px-md py-2 font-label-md text-label-sm hover:bg-primary/90/90"
                          >
                            {createAndAssignClass.isPending ? "Creating..." : "Create & Add"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowNewClass(false)
                              setNewClassName("")
                              setNewClassDesc("")
                              setNewClassTeacher("")
                            }}
                            className="h-auto text-on-surface-variant font-label-md text-label-sm hover:bg-surface-container px-md py-2 rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
