import type { components } from "@/types/api-schema"

type NotificationDto = components["schemas"]["NotificationDto"]

export type UserRole = "STUDENT" | "TEACHER" | "GUARDIAN" | "ADMIN"

export function isUserRole(role: string | undefined): role is UserRole {
  return role === "STUDENT" || role === "TEACHER" || role === "GUARDIAN" || role === "ADMIN"
}

const THREAD_ID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i

/**
 * Older HOMEWORK_HELP_REDIRECT notifications predate the `data.threadId`
 * field, but the backend used to embed the thread id in the body
 * ("…class chat thread: <id>"). Reuse it so clicking the notification still
 * opens the existing conversation with the student instead of the inbox.
 */
function extractThreadIdFromBody(body: string | null | undefined): string | null {
  if (!body) return null
  const match = body.match(THREAD_ID_RE)
  return match ? match[0] : null
}

/**
 * Maps a notification to the most relevant page for the signed-in user.
 * Notifications carry no resource id, so we navigate to the section that
 * surfaces the affected work. Returns null when there is no better
 * destination than the notifications list itself.
 */
export function notificationTargetPath(
  notification: NotificationDto,
  role: UserRole | undefined,
): string | null {
  switch (notification.type) {
    case "GRADING_READY":
      return role === "TEACHER" ? "/assignments/review" : null
    case "HOMEWORK_HELP_REDIRECT":
      if (role === "TEACHER") {
        const threadId = notification.data?.threadId
        if (typeof threadId === "string" && threadId) return `/chat/${threadId}`
        // Older notifications predate thread links in data — fall back to the
        // thread id embedded in the body, then to the chat inbox.
        const bodyThreadId = extractThreadIdFromBody(notification.body)
        if (bodyThreadId) return `/chat/${bodyThreadId}`
        return "/chat"
      }
      return null
    case "QUIZ_READY":
      return role === "STUDENT" ? "/student/quizzes" : null
    case "PRACTICE_READY":
      return role === "STUDENT" ? "/student/quizzes" : null
    case "FEEDBACK_READY": {
      if (role !== "STUDENT") return null
      const { classId, assignmentId } = notification.data ?? {}
      if (
        typeof classId === "string" &&
        classId &&
        typeof assignmentId === "string" &&
        assignmentId
      ) {
        return `/student/classes/${classId}/assignments/${assignmentId}`
      }
      return "/student/grades"
    }
    case "GUARDIAN_REQUIRED":
      return role === "STUDENT" ? "/student/settings" : null
    case "STUDENT_WITHOUT_GUARDIAN":
      return role === "ADMIN" ? "/admin/join-approvals" : null
    case "QUIZ_VIOLATION":
      return role === "STUDENT"
        ? "/student/quizzes"
        : role === "GUARDIAN"
          ? "/guardian/alerts"
          : role === "ADMIN"
            ? "/admin/alerts"
            : null
    case "AGENT_ALERT":
      return role === "TEACHER"
        ? "/alerts"
        : role === "STUDENT"
          ? "/student/insights"
          : role === "GUARDIAN"
            ? "/guardian/alerts"
            : role === "ADMIN"
              ? "/admin/alerts"
              : null
    case "PAYMENT_FAILED":
    case "PAYMENT_RECOVERED":
    case "TRIAL_EXPIRING":
    case "TRIAL_EXPIRED":
      return role === "ADMIN" ? "/admin/billing" : null
    case "BROADCAST":
    default:
      return null
  }
}