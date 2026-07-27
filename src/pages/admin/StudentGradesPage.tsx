import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

interface AssignmentSummary {
  id: string
  title: string
  totalPoints: number
  earned: number
  maxPossible: number
  criteriaCount: number
  confirmedCount: number
  status: string
}

export function StudentGradesPage() {
  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const students = useQuery({
    queryKey: ["users", "STUDENT"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const studentClasses = useQuery({
    queryKey: ["student-classes-grades", selectedStudentId],
    queryFn: () => api.getStudentClasses(selectedStudentId!),
    enabled: !!selectedStudentId,
  })

  const studentGrades = useQuery({
    queryKey: ["student-grades", selectedStudentId],
    queryFn: () => api.getStudentGrades(selectedStudentId!),
    enabled: !!selectedStudentId,
  })

  const filteredStudents = (students.data ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedStudent = (students.data ?? []).find((s) => s.id === selectedStudentId)

  const classSummaries = useMemo(() => {
    const grades = studentGrades.data ?? []
    const classes = studentClasses.data ?? []
    const confirmedGrades = grades.filter((g) => g.isConfirmed)

    const gradesBySubId = new Map<string, typeof confirmedGrades>()
    for (const g of confirmedGrades) {
      const subId = g.submissionId
      if (!gradesBySubId.has(subId)) gradesBySubId.set(subId, [])
      gradesBySubId.get(subId)!.push(g)
    }

    const subToAssignment = new Map<string, { id: string; title: string; classId: string; totalPoints: number }>()
    for (const g of confirmedGrades) {
      const a = (g as unknown as { assignment: { id: string; title: string; classId: string; totalPoints: number } | undefined }).assignment
      if (a?.id) {
        subToAssignment.set(g.submissionId, {
          id: a.id,
          title: a.title ?? "Untitled",
          classId: a.classId,
          totalPoints: a.totalPoints ?? 0,
        })
      }
    }

    const assignmentsByClass = new Map<string, AssignmentSummary[]>()
    for (const [subId, criteria] of gradesBySubId) {
      const assignment = subToAssignment.get(subId)
      if (!assignment) continue
      const earned = criteria.reduce((s, c) => s + c.pointsAwarded, 0)
      const maxPossible = criteria.reduce((s, c) => s + ((c as unknown as { criterion: { maxPoints: number } }).criterion?.maxPoints ?? 0), 0)
      assignmentsByClass.set(assignment.classId, [
        ...(assignmentsByClass.get(assignment.classId) ?? []),
        {
          id: assignment.id,
          title: assignment.title,
          totalPoints: assignment.totalPoints,
          earned,
          maxPossible,
          criteriaCount: criteria.length,
          confirmedCount: criteria.filter((c) => c.isConfirmed).length,
          status: criteria.every((c) => c.isConfirmed) ? "CONFIRMED" : "PENDING",
        },
      ])
    }

    return classes.map((cls) => {
      const clsAssignments = assignmentsByClass.get(cls.id) ?? []
      const totalEarned = clsAssignments.reduce((s, a) => s + a.earned, 0)
      const totalMax = clsAssignments.reduce((s, a) => s + a.maxPossible, 0)
      return {
        id: cls.id,
        name: cls.name,
        teacherName: cls.teacherName,
        totalAssignments: cls.assignments.length,
        averageGrade: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
        totalEarned,
        totalMax,
        assignments: clsAssignments,
      }
    })
  }, [studentGrades.data, studentClasses.data])

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Student Grades</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-1 bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-11 pr-4 py-2 rounded-full border border-outline-variant/20 font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left px-md py-sm rounded-full transition-all ${
                  selectedStudentId === s.id
                    ? "bg-primary-container text-on-primary-container"
                    : "hover:bg-surface-container text-on-surface"
                }`}
              >
                <p className="font-label-md text-label-md">{s.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{s.email}</p>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-md">No students found</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedStudentId ? (
            <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm flex items-center justify-center min-h-[300px]">
              <p className="font-body-md text-body-md text-on-surface-variant">Select a student to view grades</p>
            </div>
          ) : studentClasses.isLoading || studentGrades.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm animate-pulse">
                  <div className="h-6 w-48 bg-surface-container-high rounded-full mb-4" />
                  <div className="h-4 w-full bg-surface-container-high rounded-full mb-2" />
                  <div className="h-4 w-3/4 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedStudent && (
                <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
                  <h2 className="font-headline-md text-headline-md text-primary mb-1">{selectedStudent.name}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">{selectedStudent.email}</p>
                </div>
              )}

              {classSummaries.length === 0 ? (
                <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">No grades found for this student.</p>
                </div>
              ) : (
                classSummaries.map((cls) => (
                  <div key={cls.id} className="bg-white rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="px-xl py-4 border-b border-outline-variant/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary">{cls.name}</h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{cls.teacherName} · {cls.totalAssignments} assignments</p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline-lg text-headline-lg text-primary">{cls.averageGrade}%</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{cls.totalEarned}/{cls.totalMax} pts</p>
                      </div>
                    </div>

                    {cls.assignments.length > 0 && (
                      <div className="px-xl py-3">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-outline-variant/10">
                              <th className="text-left font-label-sm text-label-sm text-on-surface-variant pb-2">Assignment</th>
                              <th className="text-right font-label-sm text-label-sm text-on-surface-variant pb-2">Score</th>
                              <th className="text-right font-label-sm text-label-sm text-on-surface-variant pb-2">Percentage</th>
                              <th className="text-right font-label-sm text-label-sm text-on-surface-variant pb-2">Criteria</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cls.assignments.map((a) => (
                              <tr key={a.id} className="border-b border-outline-variant/5 last:border-0">
                                <td className="py-2 font-body-md text-body-md text-on-surface">{a.title}</td>
                                <td className="py-2 text-right font-body-md text-body-md text-on-surface">{a.earned}/{a.maxPossible}</td>
                                <td className="py-2 text-right font-body-md text-body-md">
                                  <span className={a.maxPossible > 0 && (a.earned / a.maxPossible) >= 0.5 ? "text-primary" : "text-error"}>
                                    {a.maxPossible > 0 ? Math.round((a.earned / a.maxPossible) * 100) : 0}%
                                  </span>
                                </td>
                                <td className="py-2 text-right font-body-md text-body-md text-on-surface">{a.confirmedCount}/{a.criteriaCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
