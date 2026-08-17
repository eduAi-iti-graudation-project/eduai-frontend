import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAlerts } from "@/hooks/use-alerts"
import { useNotifications } from "@/hooks/use-notifications"
import { useMeetings } from "@/hooks/use-meetings"
import { useStudentInsights } from "@/hooks/use-dashboard-insights"
import type { ChatThreadListItem, User } from "@/lib/api"
import type { TimelineItem } from "@/components/shared/ActivityTimeline"

export type ChatContextStat = {
  icon: string
  label: string
  value: string | number
  tone?: "positive" | "warning" | "danger" | "default"
}

export type ContextRow = { text: string; tone?: "positive" | "negative" | "warning" | "danger" | "neutral" }

export type ChatContextTable = {
  title: string
  columns: string[]
  rows: ContextRow[][]
}

export type ChatContextAction = { icon: string; label: string; to: string }

export interface ChatContextProfile {
  name: string
  subtitle: string
  email?: string
  to?: string
}

export interface ChatContextResult {
  role: api.User["role"]
  loading: boolean
  profile: ChatContextProfile | null
  actions: ChatContextAction[]
  stats: ChatContextStat[]
  tables: ChatContextTable[]
  timeline: TimelineItem[]
  aiNote?: { title: string; summary: string; to?: string }
}

interface StudentDashboardData {
  upcomingAssignments: { title: string; dueDate: string; className: string }[]
  recentGrades: { assignmentTitle: string; score: number; totalPoints: number; percentage: number }[]
  attendanceRate: number
  activeAlerts: { id: string; type: string; reason: string }[]
  unreadNotifications: number
}

interface GuardianDashboardData {
  children: {
    id: string
    name: string
    className: string
    overallAverage: number
    attendanceRate: number
    activeAlertCount: number
    activeAlertId: string | null
  }[]
  unreadNotifications: number
}

function statTone(rate: number): "positive" | "warning" | "danger" {
  if (rate >= 90) return "positive"
  if (rate >= 75) return "warning"
  return "danger"
}

function alertTone(severity: string | null): "danger" | "warning" | "neutral" {
  if (severity === "HIGH") return "danger"
  if (severity === "MEDIUM") return "warning"
  return "neutral"
}

export function useChatContext(
  thread: ChatThreadListItem | undefined,
  user: User | null | undefined,
): ChatContextResult {
  const role = user?.role ?? "ADMIN"
  const { alerts } = useAlerts("ACTIVE")
  const { notifications } = useNotifications()

  const teacherStudentId = role === "TEACHER" ? thread?.studentId : undefined

  const gradesQ = useQuery({
    queryKey: ["chat-context", "teacher", teacherStudentId, "grades"],
    queryFn: () => api.getStudentGrades(teacherStudentId as string),
    enabled: role === "TEACHER" && !!teacherStudentId,
  })

  const attendanceQ = useQuery({
    queryKey: ["chat-context", "teacher", teacherStudentId, "attendance"],
    queryFn: () => api.getStudentAttendance(teacherStudentId as string),
    enabled: role === "TEACHER" && !!teacherStudentId,
  })

  const classesQ = useQuery({
    queryKey: ["chat-context", "teacher", teacherStudentId, "classes"],
    queryFn: () => api.getStudentClasses(teacherStudentId as string),
    enabled: role === "TEACHER" && !!teacherStudentId,
  })

  const insightsQ = useStudentInsights(role === "TEACHER" ? (teacherStudentId ?? "") : "", "week")

  const studentDashboardQ = useQuery({
    queryKey: ["chat-context", "student", "dashboard"],
    queryFn: async () => (await api.getDashboard()) as unknown as StudentDashboardData,
    enabled: role === "STUDENT",
  })

  const studentMeetings = useMeetings("upcoming")

  const guardianDashboardQ = useQuery({
    queryKey: ["chat-context", "guardian", "dashboard"],
    queryFn: async () => (await api.getDashboard()) as unknown as GuardianDashboardData,
    enabled: role === "GUARDIAN",
  })

  const guardianAlertsQ = useQuery({
    queryKey: ["chat-context", "guardian", "alerts"],
    queryFn: () => api.getGuardianAlerts(),
    enabled: role === "GUARDIAN",
  })

  const usersQ = useQuery({
    queryKey: ["chat-context", "admin", "users"],
    queryFn: () => api.getUsers(),
    enabled: role === "ADMIN",
  })

  const broadcastsQ = useQuery({
    queryKey: ["chat-context", "admin", "broadcasts"],
    queryFn: () => api.getBroadcasts(),
    enabled: role === "ADMIN",
  })

  const loading =
    (role === "TEACHER" && (gradesQ.isLoading || attendanceQ.isLoading || classesQ.isLoading)) ||
    (role === "STUDENT" && studentDashboardQ.isLoading) ||
    (role === "GUARDIAN" && (guardianDashboardQ.isLoading || guardianAlertsQ.isLoading)) ||
    (role === "ADMIN" && (usersQ.isLoading || broadcastsQ.isLoading))

  const peer = useMemo(() => {
    if (!thread || !user) return null
    return {
      name: thread.peerName,
      className: thread.className,
      peerId: thread.peerId,
    }
  }, [thread, user])

  return useMemo<ChatContextResult>(() => {
    if (!thread || !peer || !user) {
      return { role, loading: false, profile: null, actions: [], stats: [], tables: [], timeline: [] }
    }

    if (role === "TEACHER") {
      const studentId = teacherStudentId
      const grades = gradesQ.data ?? []
      const confirmed = grades.filter((g) => g.isConfirmed)
      const earned = confirmed.reduce((s, g) => s + g.pointsAwarded, 0)
      const max = confirmed.reduce((s, g) => s + g.criterionMaxPoints, 0)
      const average = max > 0 ? Math.round((earned / max) * 100) : null

      const attendance = attendanceQ.data ?? []
      const present = attendance.filter((a) => a.status === "PRESENT").length
      const late = attendance.filter((a) => a.status === "LATE").length
      const excused = attendance.filter((a) => a.status === "EXCUSED").length
      const rate = attendance.length > 0 ? Math.round(((present + late + excused) / attendance.length) * 100) : null

      const studentAlerts = alerts.filter((a) => a.studentId === studentId)
      const classCount = (classesQ.data ?? []).length

      const recentGrades = confirmed.slice(-5).reverse()

      const aiInsight = insightsQ.data?.agentInsights?.[0]

      return {
        role,
        loading,
        profile: {
          name: peer.name,
          subtitle: peer.className ?? "Student",
          to: `/students/${studentId}`,
        },
        actions: [
          { icon: "person_search", label: "Profile", to: `/students/${studentId}` },
          { icon: "monitoring", label: "Insights", to: `/insights/students/${studentId}` },
          { icon: "event_available", label: "Schedule", to: "/meetings/new" },
          { icon: "school", label: "Class", to: peer.className ? `/classes/${thread.courseOfferingId ?? ""}` : "/classes" },
        ],
        stats: [
          { icon: "analytics", label: "Overall avg", value: average === null ? "—" : `${average}%`, tone: average === null ? "default" : average >= 60 ? "positive" : "warning" },
          { icon: "event_available", label: "Attendance", value: rate === null ? "—" : `${rate}%`, tone: rate === null ? "default" : statTone(rate) },
          { icon: "flag", label: "Active alerts", value: studentAlerts.length, tone: studentAlerts.length > 0 ? "danger" : "positive" },
          { icon: "meeting_room", label: "Classes", value: classCount },
        ],
        tables:
          recentGrades.length > 0
            ? [
                {
                  title: "Recent grades",
                  columns: ["Criterion", "Score", "%"],
                  rows: recentGrades.map((g) => [
                    { text: g.criterionDescription || "Assignment" },
                    { text: `${g.pointsAwarded}/${g.criterionMaxPoints}` },
                    {
                      text: g.criterionMaxPoints > 0 ? `${Math.round((g.pointsAwarded / g.criterionMaxPoints) * 100)}%` : "—",
                      tone: g.criterionMaxPoints > 0 && g.pointsAwarded / g.criterionMaxPoints >= 0.6 ? "positive" : "negative",
                    },
                  ]),
                },
              ]
            : [],
        timeline: [
          ...studentAlerts.slice(0, 5).map((a) => ({
            id: a.id,
            icon: "notifications_active",
            title: a.studentName || "Alert",
            description: a.reason,
            timestamp: a.createdAt,
            tone: alertTone(a.severity),
            to: `/alerts/${a.id}`,
          })),
        ],
        aiNote: aiInsight ? { title: "AI overview", summary: aiInsight.summary, to: `/insights/students/${studentId}` } : undefined,
      }
    }

    if (role === "STUDENT") {
      const data = studentDashboardQ.data
      const upcoming = data?.upcomingAssignments ?? []
      const recentGrades = data?.recentGrades ?? []
      const attendanceRate = Math.round((data?.attendanceRate ?? 0) * 100)
      const activeAlerts = data?.activeAlerts ?? []
      const unread = data?.unreadNotifications ?? 0
      const upcomingMeetings = studentMeetings.data?.meetings ?? []

      return {
        role,
        loading,
        profile: {
          name: peer.name,
          subtitle: peer.className ?? "Teacher",
          to: "/student/grades",
        },
        actions: [
          { icon: "grade", label: "Grades", to: "/student/grades" },
          { icon: "event_available", label: "Attendance", to: "/student/attendance" },
          { icon: "calendar_month", label: "Timetable", to: "/student/timetable" },
          { icon: "video_camera_front", label: "Meetings", to: "/student/meetings" },
        ],
        stats: [
          { icon: "pending_actions", label: "Due soon", value: upcoming.length, tone: upcoming.length > 0 ? "warning" : "positive" },
          { icon: "check_circle", label: "Attendance", value: `${attendanceRate}%`, tone: statTone(attendanceRate) },
          { icon: "flag", label: "Alerts", value: activeAlerts.length, tone: activeAlerts.length > 0 ? "danger" : "positive" },
          { icon: "notifications", label: "Unread", value: unread },
        ],
        tables:
          recentGrades.length > 0
            ? [
                {
                  title: "Recent grades",
                  columns: ["Assignment", "Score", "%"],
                  rows: recentGrades.slice(0, 5).map((g) => [
                    { text: g.assignmentTitle },
                    { text: `${g.score}/${g.totalPoints}` },
                    {
                      text: `${g.percentage}%`,
                      tone: g.percentage >= 60 ? "positive" : "negative",
                    },
                  ]),
                },
              ]
            : [],
        timeline: [
          ...upcoming.slice(0, 4).map((a, i) => ({
            id: `deadline-${i}`,
            icon: "pending_actions",
            title: a.title,
            description: a.className,
            timestamp: a.dueDate,
            tone: "warning" as const,
            to: "/student/assignments",
          })),
          ...upcomingMeetings.slice(0, 3).map((m) => ({
            id: m.id,
            icon: "video_camera_front",
            title: m.title,
            description: m.sectionName ?? m.courseName ?? "Live class",
            timestamp: m.scheduledStart,
            tone: "secondary" as const,
            to: "/student/meetings",
          })),
        ],
      }
    }

    if (role === "GUARDIAN") {
      const children = guardianDashboardQ.data?.children ?? []
      const guardianAlerts = guardianAlertsQ.data ?? []
      const totalAlerts = children.reduce((s, c) => s + c.activeAlertCount, 0)
      const avgOverall = children.length > 0 ? Math.round(children.reduce((s, c) => s + c.overallAverage, 0) / children.length) : 0

      return {
        role,
        loading,
        profile: {
          name: peer.name,
          subtitle: peer.className ?? "Teacher",
          to: "/guardian/insights",
        },
        actions: [
          { icon: "monitoring", label: "Insights", to: "/guardian/insights" },
          { icon: "notifications_active", label: "Alerts", to: "/guardian/alerts" },
          { icon: "description", label: "Reports", to: "/guardian/reports" },
        ],
        stats: [
          { icon: "family_history", label: "Children", value: children.length },
          { icon: "grade", label: "Avg overall", value: children.length ? `${avgOverall}%` : "—" },
          { icon: "flag", label: "Alerts", value: totalAlerts, tone: totalAlerts > 0 ? "danger" : "positive" },
          { icon: "notifications", label: "Unread", value: guardianDashboardQ.data?.unreadNotifications ?? 0 },
        ],
        tables:
          children.length > 0
            ? [
                {
                  title: "Children",
                  columns: ["Child", "Avg", "Att", "Alerts"],
                  rows: children.map((c) => [
                    { text: c.name },
                    { text: `${c.overallAverage}%`, tone: c.overallAverage >= 60 ? "positive" : "negative" },
                    { text: `${c.attendanceRate}%`, tone: statTone(c.attendanceRate) },
                    { text: String(c.activeAlertCount), tone: c.activeAlertCount > 0 ? "negative" : "positive" },
                  ]),
                },
              ]
            : [],
        timeline: guardianAlerts.slice(0, 5).map((a) => ({
          id: a.id,
          icon: "notifications_active",
          title: a.studentName || "Alert",
          description: a.reason,
          timestamp: a.createdAt,
          tone: alertTone(a.severity),
          to: `/guardian/alerts/${a.id}`,
        })),
      }
    }

    // ADMIN
    const users = usersQ.data ?? []
    const adminPeer = users.find((u) => u.id === thread.peerId)
    const students = users.filter((u) => u.role === "STUDENT").length
    const teachers = users.filter((u) => u.role === "TEACHER").length
    const broadcasts = broadcastsQ.data ?? []

    return {
      role,
      loading,
      profile: {
        name: peer.name,
        subtitle: adminPeer ? `${adminPeer.role} · ${adminPeer.email}` : thread.type === "ADMIN" ? "School staff" : peer.className ?? "Contact",
        email: adminPeer?.email,
        to: adminPeer?.role === "TEACHER" ? `/admin/teachers/${adminPeer.id}` : undefined,
      },
      actions: [
        { icon: "campaign", label: "Broadcast", to: "/admin/broadcasts" },
        { icon: "co_present", label: "Teachers", to: "/admin/teachers" },
        { icon: "group", label: "Students", to: "/admin/students" },
        { icon: "monitoring", label: "Insights", to: "/admin/insights" },
      ],
      stats: [
        { icon: "school", label: "Students", value: students },
        { icon: "co_present", label: "Teachers", value: teachers },
        { icon: "campaign", label: "Broadcasts", value: broadcasts.length },
        { icon: "notifications", label: "Unread", value: notifications.length },
      ],
      tables: [],
      timeline: notifications.slice(0, 6).map((n) => ({
        id: n.id,
        icon: "notifications",
        title: n.title,
        description: n.body ?? undefined,
        timestamp: n.createdAt,
        tone: "neutral" as const,
      })),
    }
  }, [
    role, loading, thread, peer, user, teacherStudentId,
    gradesQ.data, attendanceQ.data, classesQ.data, insightsQ.data,
    studentDashboardQ.data, studentMeetings.data, alerts, notifications,
    guardianDashboardQ.data, guardianAlertsQ.data, usersQ.data, broadcastsQ.data,
  ])
}