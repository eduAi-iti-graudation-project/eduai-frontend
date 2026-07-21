import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useDashboardData() {
  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: api.getClasses,
  })

  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.getAssignments(),
  })

  const submissions = useQuery({
    queryKey: ["submissions"],
    queryFn: () => api.getSubmissions(),
  })

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
  })

  const isLoading = classes.isLoading || assignments.isLoading || submissions.isLoading || alerts.isLoading
  const isError = classes.isError || assignments.isError || submissions.isError || alerts.isError
  const error = classes.error ?? assignments.error ?? submissions.error ?? alerts.error

  const classesData = classes.data ?? []
  const assignmentsData = assignments.data ?? []
  const submissionsData = submissions.data ?? []
  const alertsData = alerts.data ?? []

  const assignmentMap = new Map(assignmentsData.map((a) => [a.id, a]))

  const submissionsByClass = new Map<string, api.SubmissionEnriched[]>()
  for (const sub of submissionsData) {
    const assignment = assignmentMap.get(sub.assignmentId)
    if (!assignment) continue
    const classId = assignment.classId
    const existing = submissionsByClass.get(classId) ?? []
    existing.push(sub)
    submissionsByClass.set(classId, existing)
  }

  const pendingStatuses = new Set(["SUBMITTED", "REVIEW_READY"])
  const classCards = classesData.map((c) => {
    const classSubmissions = submissionsByClass.get(c.id) ?? []
    const pending = classSubmissions.filter((s) => pendingStatuses.has(s.status)).length
    const confirmed = classSubmissions.filter((s) => s.status === "CONFIRMED").length
    return {
      id: c.id,
      name: c.name,
      section: c.description ?? "No description",
      students: c.enrollments?.length ?? 0,
      pending,
      total: classSubmissions.length,
      confirmed,
    }
  })

  const totalSubmissions = submissionsData.length
  const confirmedSubmissions = submissionsData.filter((s) => s.status === "CONFIRMED").length
  const submissionRate = totalSubmissions > 0 ? Math.round((confirmedSubmissions / totalSubmissions) * 100) : 0

  const allScores = submissionsData.flatMap((s) => s.scores ?? [])
  const confirmedScores = allScores.filter((s) => s.isConfirmed)
  const avgGrade =
    confirmedScores.length > 0
      ? confirmedScores.reduce((sum, s) => sum + s.pointsAwarded, 0) / confirmedScores.length
      : 0

  return {
    isLoading,
    isError,
    error: error instanceof Error ? error.message : "Failed to load dashboard data",
    classCards,
    submissionRate,
    avgGrade,
    totalSubmissions,
    confirmedSubmissions,
    alerts: alertsData,
  }
}
