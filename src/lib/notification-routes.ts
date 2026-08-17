import type { components } from "@/types/api-schema"

type NotificationDto = components["schemas"]["NotificationDto"]

export type UserRole = "STUDENT" | "TEACHER" | "GUARDIAN" | "ADMIN"

export function isUserRole(role: string | undefined): role is UserRole {
  return role === "STUDENT" || role === "TEACHER" || role === "GUARDIAN" || role === "ADMIN"
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
      return role === "TEACHER" ? "/assistant" : null
    case "FEEDBACK_READY":
      return role === "STUDENT" ? "/student/assignments" : null
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