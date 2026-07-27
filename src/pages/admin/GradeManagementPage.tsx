import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import type { components } from "@/types/api-schema"

export function GradeManagementPage() {
  const queryClient = useQueryClient()
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState("")
  const [newName, setNewName] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [classToAdd, setClassToAdd] = useState("")

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

  const changeTeacher = useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      api.updateClass(classId, { teacherId } as unknown as components["schemas"]["UpdateClassDto"] & { teacherId: string }),
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

  const gradeClassIds = new Set((gradeClasses.data ?? []).map((c) => c.id))
  const unassignedClasses = (allClasses.data ?? []).filter((c) => !gradeClassIds.has(c.id))

  const classesByTeacher = (gradeClasses.data ?? []).reduce<Map<string, typeof gradeClasses.data>>((acc, c) => {
    const tid = (c as unknown as { teacherId: string }).teacherId ?? "unassigned"
    if (!acc.has(tid)) acc.set(tid, [])
    acc.get(tid)!.push(c)
    return acc
  }, new Map())

  const isLoading = grades.isLoading

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary">Grades</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">{list.length} grades</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Grade
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm mb-lg">
          <h2 className="font-headline-md text-headline-md text-primary mb-4">Create Grade</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Level (1-12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="w-full px-md py-2 rounded-full border border-outline-variant/20 font-body-md bg-surface-container-low outline-none focus:border-primary"
              />
            </div>
            <div className="flex-[2]">
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Eighth Grade"
                className="w-full px-md py-2 rounded-full border border-outline-variant/20 font-body-md bg-surface-container-low outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => createGrade.mutate()}
              disabled={!newLevel || !newName || createGrade.isPending}
              className="bg-secondary-container text-white px-md py-2 rounded-full font-label-md disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-xl border border-outline-variant/10 animate-pulse">
              <div className="h-6 w-48 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((g) => (
            <div key={g.id} className="bg-white rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedGrade(expandedGrade === g.id ? null : g.id)}
                className="w-full flex items-center justify-between px-xl py-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-fixed/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">school</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-headline-md text-headline-md text-primary">Grade {g.level}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{g.name}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: expandedGrade === g.id ? "rotate(180deg)" : "" }}>
                  expand_more
                </span>
              </button>

              {expandedGrade === g.id && (
                <div className="px-xl pb-4 border-t border-outline-variant/10">
                  {gradeClasses.isLoading ? (
                    <div className="space-y-2 mt-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 bg-surface-container-high rounded-full animate-pulse" />
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
                              <span className="font-label-lg text-label-lg text-primary">{teacherName}</span>
                            </div>
                            <div className="space-y-2">
                              {list.map((c) => {
                                const currentTid = (c as unknown as { teacherId: string }).teacherId ?? ""
                                return (
                                <div key={c.id} className="flex items-center justify-between bg-surface-container-low rounded-full px-md py-2 ml-6">
                                  <span className="font-label-md text-label-md text-on-surface">{classNames.get(c.id) || c.name || `Class (${c.id.slice(0, 8)})`}</span>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={currentTid}
                                      onChange={(e) => changeTeacher.mutate({ classId: c.id, teacherId: e.target.value })}
                                      disabled={changeTeacher.isPending}
                                      className="px-sm py-1 rounded-full border border-outline-variant/20 font-body-sm text-body-sm bg-white outline-none focus:border-primary"
                                    >
                                      <option value="">No teacher</option>
                                      {(teachers.data ?? []).map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => removeClass.mutate(c.id)}
                                      disabled={removeClass.isPending}
                                      className="text-error font-label-sm text-label-sm hover:underline disabled:opacity-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )})}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center gap-3">
                      <select
                        value={classToAdd}
                        onChange={(e) => setClassToAdd(e.target.value)}
                        className="flex-1 px-md py-2 rounded-full border border-outline-variant/20 font-body-md bg-surface-container-low outline-none focus:border-primary"
                      >
                        <option value="">Select a class to add...</option>
                        {unassignedClasses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.description ? ` — ${c.description}` : ""}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addClass.mutate()}
                        disabled={!classToAdd || addClass.isPending}
                        className="bg-secondary-container text-white px-md py-2 rounded-full font-label-md disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
