import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { MiniStat } from "@/components/admin/MiniStat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAlerts } from "@/hooks/use-alerts"
import { MonthlyAttendanceBars } from "@/components/attendance/AttendanceCharts"
import { FriendlyAlert, SeverityPill } from "@/components/admin/AlertPresentation"
import { AgentInsightCard } from "@/components/insights/AgentInsightCard"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

const statusBadge: Record<string, string> = {
  PRESENT: "bg-[#dcfce7] text-[#14532d]",
  ABSENT: "bg-[#ffdad6] text-[#93000a]",
  LATE: "bg-[#fef3c7] text-[#78350f]",
  EXCUSED: "bg-[#dde1fd] text-[#41465c]",
}

interface AssignmentSummary {
  id: string
  title: string
  earned: number
  maxPossible: number
  criteriaCount: number
  confirmedCount: number
}

interface ClassSummary {
  id: string
  name: string
  teacherName: string
  totalAssignments: number
  averageGrade: number
  totalEarned: number
  totalMax: number
  assignments: AssignmentSummary[]
}

function buildClassSummaries(
  grades: api.StudentGrade[],
  classes: api.StudentClass[],
): ClassSummary[] {
  const confirmed = grades.filter((g) => g.isConfirmed)
  const gradesBySubId = new Map<string, typeof confirmed>()
  for (const g of confirmed) {
    const subId = g.submissionId
    if (!gradesBySubId.has(subId)) gradesBySubId.set(subId, [])
    gradesBySubId.get(subId)!.push(g)
  }

  const subToAssignment = new Map<string, { id: string; title: string; classId: string }>()
  for (const g of confirmed) {
    const a = (g as unknown as { assignment: { id: string; title: string; classId: string } | undefined }).assignment
    if (a?.id) subToAssignment.set(g.submissionId, { id: a.id, title: a.title ?? "Untitled", classId: a.classId })
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
        earned,
        maxPossible,
        criteriaCount: criteria.length,
        confirmedCount: criteria.filter((c) => c.isConfirmed).length,
      },
    ])
  }

  return classes.map((cls) => {
    const assignments = assignmentsByClass.get(cls.id) ?? []
    const totalEarned = assignments.reduce((s, a) => s + a.earned, 0)
    const totalMax = assignments.reduce((s, a) => s + a.maxPossible, 0)
    return {
      id: cls.id,
      name: cls.name,
      teacherName: cls.teacherName,
      totalAssignments: cls.assignments.length,
      averageGrade: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
      totalEarned,
      totalMax,
      assignments,
    }
  })
}

export function StudentManagementPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<api.AdminUser | null>(null)
  const [guardianSearch, setGuardianSearch] = useState("")
  const [selectedGuardian, setSelectedGuardian] = useState<api.AdminUser | null>(null)
  const [attendanceFilter, setAttendanceFilter] = useState("ALL")
  const [expelOpen, setExpelOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [confirmChecked, setConfirmChecked] = useState(false)

  const students = useQuery({
    queryKey: ["users", "STUDENT"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const grades = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.getAllGrades(),
  })

  const guardians = useQuery({
    queryKey: ["users", "GUARDIAN"],
    queryFn: () => api.getUsers({ role: "GUARDIAN" }),
  })

  const { alerts } = useAlerts("ACTIVE")

  const studentId = selectedStudent?.id

  const studentClassesQ = useQuery({
    queryKey: ["students", studentId, "classes"],
    queryFn: () => api.getStudentClasses(studentId!),
    enabled: !!studentId,
  })

  const studentAttendanceQ = useQuery({
    queryKey: ["students", studentId, "attendance"],
    queryFn: () => api.getStudentAttendance(studentId!),
    enabled: !!studentId,
  })

  const studentGradesQ = useQuery({
    queryKey: ["students", studentId, "grades"],
    queryFn: () => api.getStudentGrades(studentId!),
    enabled: !!studentId,
  })

  const studentInsightsQ = useQuery({
    queryKey: ["students", studentId, "insights"],
    queryFn: () => api.getStudentInsights(studentId!),
    enabled: !!studentId,
    staleTime: 60_000,
  })

  const linkGuardian = useMutation({
    mutationFn: () => api.linkGuardianToStudent(selectedStudent!.id, selectedGuardian!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "STUDENT"] })
      toast.success("Guardian linked")
      setSelectedGuardian(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const expelStudent = useMutation({
    mutationFn: () => api.deleteUser(selectedStudent!.id),
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["users", "STUDENT"] })
      queryClient.invalidateQueries({ queryKey: ["users", "GUARDIAN"] })
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      toast.success(`${deleted.name} was expelled and their account removed`)
      setExpelOpen(false)
      setConfirmName("")
      setConfirmChecked(false)
      setSelectedStudent(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const guardiansById = useMemo(() => {
    const map = new Map<string, api.AdminUser>()
    for (const g of guardians.data ?? []) map.set(g.id, g)
    return map
  }, [guardians.data])

  const gradeById = useMemo(() => {
    const map = new Map<string, api.TeacherGrade>()
    for (const g of grades.data ?? []) map.set(g.id, g)
    return map
  }, [grades.data])

  const nameConfirmed = useMemo(
    () => confirmName.trim().toLowerCase() === (selectedStudent?.name.trim().toLowerCase() ?? ""),
    [confirmName, selectedStudent],
  )
  const canExpel = nameConfirmed && confirmChecked && !expelStudent.isPending

  const filteredStudents = (students.data ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  )

  const filteredGuardians = (guardians.data ?? []).filter((g) =>
    !guardianSearch || g.name.toLowerCase().includes(guardianSearch.toLowerCase()) || g.email.toLowerCase().includes(guardianSearch.toLowerCase())
  )

  const currentGuardianId: string | undefined = selectedStudent
    ? (selectedStudent as unknown as { guardianId: string | undefined }).guardianId
    : undefined
  const currentGuardian = currentGuardianId ? guardiansById.get(currentGuardianId) : undefined

  const studentFlags = useMemo(
    () => alerts.filter((a) => a.studentId === selectedStudent?.id),
    [alerts, selectedStudent?.id],
  )

  const attendanceRecords = useMemo(() => studentAttendanceQ.data ?? [], [studentAttendanceQ.data])
  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length
    const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length
    const late = attendanceRecords.filter((a) => a.status === "LATE").length
    const excused = attendanceRecords.filter((a) => a.status === "EXCUSED").length
    const total = attendanceRecords.length
    return {
      total,
      present,
      absent,
      late,
      excused,
      rate: total > 0 ? Math.round(((present + late + excused) / total) * 100) : null,
    }
  }, [attendanceRecords])

  const filteredRecords = useMemo(() => {
    if (attendanceFilter === "ALL") return attendanceRecords
    return attendanceRecords.filter((r) => r.status === attendanceFilter)
  }, [attendanceRecords, attendanceFilter])

  const classSummaries = useMemo(
    () => buildClassSummaries(studentGradesQ.data ?? [], studentClassesQ.data ?? []),
    [studentGradesQ.data, studentClassesQ.data],
  )

  const overallAverage = useMemo(() => {
    const earned = classSummaries.reduce((s, c) => s + c.totalEarned, 0)
    const max = classSummaries.reduce((s, c) => s + c.totalMax, 0)
    return max > 0 ? Math.round((earned / max) * 100) : null
  }, [classSummaries])

  if (students.isError) {
    return (
      <ErrorState
        title="Couldn't load students"
        message={students.error instanceof Error ? students.error.message : "Failed to load students"}
        onRetry={() => students.refetch()}
      />
    )
  }

  if (students.isLoading) {
    return <LoadingState label="Loading students…" />
  }

  const loadingProfile = studentClassesQ.isFetching || studentAttendanceQ.isFetching || studentGradesQ.isFetching

  return (
    <div className="flex-1 px-4 py-4 min-w-0">
      <div className="max-w-[1500px] mx-auto space-y-4 min-w-0">
        <PageHeader
          title="Students"
          subtitle={`${students.data?.length ?? 0} enrolled · select a student to manage guardians, grades and attendance`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-1 rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden min-w-0">
            <div className="p-3 border-b border-outline-variant">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-outline-variant font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary h-auto focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
              {filteredStudents.map((s) => {
                const sg = (s as unknown as { guardianId: string | undefined }).guardianId
                const guardian = sg ? guardiansById.get(sg) : undefined
                const flagCount = alerts.filter((a) => a.studentId === s.id).length
                const grade = s.gradeId ? gradeById.get(s.gradeId) : undefined
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSelectedStudent(s); setSelectedGuardian(null) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      selectedStudent?.id === s.id
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface hover:bg-surface-container-low",
                    )}
                  >
                    <Avatar className="h-9 w-9 rounded-full shrink-0">
                      <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
                        {initials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md font-semibold truncate">{s.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{s.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        {grade && (
                          <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-[6px] bg-primary-fixed text-on-primary-fixed-variant font-medium">
                            {grade.name}
                          </span>
                        )}
                        {flagCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm px-1.5 py-0.5 rounded-[6px] bg-[#ffdad6] text-[#93000a] font-medium">
                            <span className="material-symbols-outlined text-[12px]">flag</span>
                            {flagCount}
                          </span>
                        )}
                      </div>
                      {guardian && (
                        <span className="font-label-sm text-label-sm text-on-surface-variant max-w-[140px] truncate">
                          {guardian.name}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
              {filteredStudents.length === 0 && (
                <p className="font-body-md text-body-md text-on-surface-variant text-center py-8">No students found</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 min-w-0">
            {!selectedStudent ? (
              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center min-h-[360px]">
                <div className="text-center px-6">
                  <span className="material-symbols-outlined text-[40px] text-outline mb-2">person_search</span>
                  <p className="font-body-md text-body-md text-on-surface-variant">Select a student to manage</p>
                </div>
              </div>
            ) : loadingProfile && !studentClassesQ.data && !studentAttendanceQ.data && !studentGradesQ.data ? (
              <LoadingState label="Loading profile…" />
            ) : (
              <>
                <ProfileHeader
                  student={selectedStudent}
                  currentGuardian={currentGuardian}
                  flagCount={studentFlags.length}
                  classesCount={classSummaries.length}
                  attendanceRate={attendanceStats.rate}
                  overallAverage={overallAverage}
                  grade={selectedStudent.gradeId ? gradeById.get(selectedStudent.gradeId) : undefined}
                />

                {studentInsightsQ.data && studentInsightsQ.data.agentInsights.length > 0 && (
                  <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
                    <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">AI overview</h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Generated from grades, attendance and submissions</p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant font-medium">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        {studentInsightsQ.data.interval}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {studentInsightsQ.data.agentInsights.slice(0, 3).map((insight, i) => (
                        <div key={`${insight.title}-${i}`} className="px-5 py-3.5">
                          <AgentInsightCard insight={insight} bare />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {studentFlags.length > 0 && (
                  <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-outline-variant">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Active alerts</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {studentFlags.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <FriendlyAlert alert={a} />
                          </div>
                          <SeverityPill severity={a.severity} severityText />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
                  <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Confirmed grades</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        {classSummaries.length} class{classSummaries.length === 1 ? "" : "es"} · averages from confirmed criteria
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-md font-label-md text-label-md">
                      <Link to={`/admin/insights/students/${selectedStudent.id}`}>
                        <span className="material-symbols-outlined text-[16px]">monitoring</span>
                        Deep insights
                      </Link>
                    </Button>
                  </div>
                  {classSummaries.length === 0 ? (
                    <div className="py-10">
                      <EmptyState flat
                        icon="grade"
                        title="No confirmed grades yet"
                        description="Scores appear here once this student submits assignments and their teacher confirms the grades."
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {classSummaries.map((cls) => (
                        <div key={cls.id} className="rounded-md border border-outline-variant overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">{cls.name}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{cls.teacherName} · {cls.totalAssignments} assignments</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-headline-md text-headline-md text-on-surface tabular-nums leading-none">{cls.averageGrade}%</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{cls.totalEarned}/{cls.totalMax} pts</p>
                            </div>
                          </div>
                          {cls.assignments.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-outline-variant hover:bg-transparent">
                                  <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant py-2 px-4 h-auto">Assignment</TableHead>
                                  <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant py-2 px-2 h-auto">Score</TableHead>
                                  <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant py-2 px-2 h-auto">%</TableHead>
                                  <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant py-2 px-4 h-auto">Criteria</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cls.assignments.map((a) => (
                                  <TableRow key={a.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                                    <TableCell className="py-2 px-4 font-body-md text-body-md text-on-surface truncate">{a.title}</TableCell>
                                    <TableCell className="py-2 px-2 text-right font-body-md text-body-md text-on-surface tabular-nums">{a.earned}/{a.maxPossible}</TableCell>
                                    <TableCell className="py-2 px-2 text-right font-body-md text-body-md">
                                      <span className={cn("font-semibold", a.maxPossible > 0 && a.earned / a.maxPossible >= 0.5 ? "text-[#14532d]" : "text-[#93000a]")}>
                                        {a.maxPossible > 0 ? Math.round((a.earned / a.maxPossible) * 100) : 0}%
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right font-body-md text-body-md text-on-surface tabular-nums">{a.confirmedCount}/{a.criteriaCount}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
                  <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Attendance</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        {attendanceStats.total} records · {attendanceStats.rate === null ? "—" : `${attendanceStats.rate}% present`}
                      </p>
                    </div>
                    <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                      <SelectTrigger className="w-auto h-9 gap-1 rounded-md border border-outline-variant bg-surface-container-low px-3 font-label-md text-label-md">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="PRESENT">Present</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                        <SelectItem value="LATE">Late</SelectItem>
                        <SelectItem value="EXCUSED">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniStat icon="event_available" label="Present" value={attendanceStats.present} tone="positive" />
                    <MiniStat icon="event_busy" label="Absent" value={attendanceStats.absent} tone="danger" />
                    <MiniStat icon="schedule" label="Late" value={attendanceStats.late} tone="warning" />
                    <MiniStat icon="verified_user" label="Excused" value={attendanceStats.excused} />
                  </div>

                  {filteredRecords.length === 0 ? (
                    <div className="py-8">
                      <EmptyState icon="calendar_today" title="No attendance records for this filter." />
                    </div>
                  ) : (
                    <>
                      <div className="px-4 pb-4">
                        <MonthlyAttendanceBars records={attendanceRecords} />
                      </div>
                      <div className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-outline-variant hover:bg-transparent">
                              <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant py-2 px-3 h-auto">Date</TableHead>
                              <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant py-2 px-3 h-auto">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRecords.map((r) => (
                              <TableRow key={r.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                                <TableCell className="px-3 py-2 font-label-md text-label-md text-on-surface">
                                  {new Date(r.date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="px-3 py-2">
                                  <span className={cn("inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md font-medium", statusBadge[r.status] ?? statusBadge.EXCUSED)}>
                                    {r.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
                  {currentGuardian && (
                    <div className="mb-4 p-4 rounded-md bg-surface-container-low">
                      <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-1">Current guardian</h3>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">{currentGuardian.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{currentGuardian.email}</p>
                    </div>
                  )}

                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">
                    {currentGuardian ? "Change guardian" : "Link guardian"}
                  </h3>
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <Input
                      value={guardianSearch}
                      onChange={(e) => setGuardianSearch(e.target.value)}
                      placeholder="Search guardians..."
                      className="w-full pl-10 pr-3 py-1.5 rounded-md border border-outline-variant font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary h-9 focus-visible:ring-transparent focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto mb-4">
                    {filteredGuardians.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGuardian(g)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors",
                          selectedGuardian?.id === g.id
                            ? "bg-primary-container text-on-primary-container"
                            : "text-on-surface hover:bg-surface-container-low",
                        )}
                      >
                        <Avatar className="h-7 w-7 rounded-full shrink-0">
                          <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm">
                            {initials(g.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block font-label-md text-label-md truncate">{g.name}</span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">{g.email}</span>
                        </span>
                      </button>
                    ))}
                    {filteredGuardians.length === 0 && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant text-center py-4">No guardians found</p>
                    )}
                  </div>

<Button
                    type="button"
                    onClick={() => linkGuardian.mutate()}
                    disabled={!selectedGuardian || linkGuardian.isPending}
                    className="h-auto rounded-md bg-primary text-primary-foreground px-4 py-2 font-label-md text-label-md hover:bg-primary/90"
                  >
                    {selectedGuardian ? `Link ${selectedGuardian.name}` : "Select a guardian"}
                  </Button>
                </div>

                <div className="rounded-lg border border-[#ffdad6] bg-[#fff8f7]/60 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-[22px] text-[#93000a] shrink-0">delete_forever</span>
                      <div className="min-w-0">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Danger zone</h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                          Expel this student and permanently remove their account
                        </p>
                      </div>
                    </div>
                    <AlertDialog open={expelOpen} onOpenChange={setExpelOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-[#efc7c2] bg-transparent text-on-error px-3 py-1.5 font-label-md text-label-md hover:bg-[#ffdad6] hover:text-[#93000a]"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                          Expel student
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogPortal>
                        <AlertDialogOverlay className="bg-black/60" />
                        <AlertDialogContent className="rounded-xl bg-surface-container-lowest border border-outline-variant max-w-[460px]">
                          <AlertDialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="material-symbols-outlined text-[22px] text-[#93000a]">warning</span>
                              <AlertDialogTitle className="font-headline-md text-headline-md text-on-surface">
                                Expel {selectedStudent?.name}?
                              </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="space-y-2 font-body-md text-body-md text-on-surface-variant">
                              <p>
                                This <span className="font-semibold text-[#93000a]">cannot be undone</span>. The student's
                                profile, confirmed grades, attendance history, alerts, guardian link, class enrollments and
                                login account will be permanently deleted.
                              </p>
                              <p>To confirm, type the student's full name exactly as shown below.</p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="mt-3">
                            <Input
                              value={confirmName}
                              onChange={(e) => setConfirmName(e.target.value)}
                              placeholder={`Type "${selectedStudent.name}"`}
                              className="w-full rounded-md border border-outline-variant bg-surface-container-low font-body-md text-body-md h-auto py-2 px-3 outline-none focus:border-primary focus-visible:ring-transparent focus-visible:ring-offset-0"
                            />
                          </div>

                          <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
                            <Checkbox
                              checked={confirmChecked}
                              onCheckedChange={(v) => setConfirmChecked(!!v)}
                              className="mt-0.5 border-outline data-[state=checked]:bg-[#ba1a1a] data-[state=checked]:border-[#ba1a1a]"
                            />
                            <span className="font-label-md text-label-md text-on-surface leading-snug">
                              I understand this permanently removes {selectedStudent.name} and their account.
                            </span>
                          </label>

                          {!nameConfirmed && confirmName.trim().length > 0 && (
                            <p className="font-label-sm text-label-sm text-[#ba1a1a] mt-2">
                              Name doesn't match — the expelled student
                            </p>
                          )}
                          {nameConfirmed && !confirmChecked && (
                            <p className="font-label-sm text-label-sm text-[#ba1a1a] mt-2">
                              Tick the checkbox above to confirm.
                            </p>
                          )}

                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel
                              className="rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                              onClick={() => {
                                setConfirmName("")
                                setConfirmChecked(false)
                              }}
                            >
                              Keep student
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={!canExpel}
                              onClick={async (e) => {
                                e.preventDefault()
                                expelStudent.mutate()
                              }}
                              className={cn(
                                "rounded-lg px-3 py-1.5 font-label-md text-label-md text-white hover:brightness-95",
                                canExpel ? "bg-[#ba1a1a]" : "bg-[#ba1a1a]/40 cursor-not-allowed",
                              )}
                            >
                              {expelStudent.isPending ? "Removing…" : "Expel permanently"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialogPortal>
                    </AlertDialog>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileHeader({
  student,
  currentGuardian,
  flagCount,
  classesCount,
  overallAverage,
  attendanceRate,
  grade,
}: {
  student: api.AdminUser
  currentGuardian: api.AdminUser | undefined
  flagCount: number
  classesCount: number
  overallAverage: number | null
  attendanceRate: number | null
  grade: api.TeacherGrade | undefined
}) {
  return (
    <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-12 w-12 rounded-full shrink-0">
            <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-headline-md text-headline-md">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-headline-md text-headline-md text-on-surface leading-none truncate">{student.name}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant font-medium">
            STUDENT
          </span>
          {grade && (
            <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
              {grade.name}
            </span>
          )}
          {currentGuardian ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-[#dde1fd] text-[#41465c] font-medium">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Guardian linked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-md bg-[#ffdad6] text-[#93000a] font-medium">
              <span className="material-symbols-outlined text-[14px]">gpp_bad</span>
              No guardian
            </span>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-md font-label-md text-label-md">
            <Link to={`/admin/students/${student.id}`}>
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              Full profile
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <MiniStat icon="meeting_room" label="Classes" value={classesCount} />
        <MiniStat
          icon="trending_up"
          label="Overall average"
          value={overallAverage === null ? "—" : `${overallAverage}%`}
          tone={overallAverage === null ? "default" : overallAverage >= 60 ? "positive" : "warning"}
        />
        <MiniStat
          icon="event_available"
          label="Attendance rate"
          value={attendanceRate === null ? "—" : `${attendanceRate}%`}
          tone={attendanceRate === null ? "default" : attendanceRate >= 90 ? "positive" : "warning"}
        />
        <MiniStat
          icon="flag"
          label="Active flags"
          value={flagCount}
          tone={flagCount ? "danger" : "positive"}
        />
      </div>
    </div>
  )
}