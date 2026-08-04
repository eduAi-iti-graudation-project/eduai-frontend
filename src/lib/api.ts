import axios, { AxiosError } from "axios"
import type { components } from "@/types/api-schema"

// ── Config ───────────────────────────────────────────────────────

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
const TOKEN_KEY = "eduai_token"

// ── Auth helpers ──────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Axios instance ────────────────────────────────────────────────

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ""
      if (!url.includes("/auth/login") && !url.includes("/auth/signup")) {
        clearToken()
        window.location.href = "/login"
      }
    }
    error.message = getErrorMessage(error)
    return Promise.reject(error)
  },
)

// ── Local types (complements generated api-schema.ts) ─────────────

export interface User {
  id: string
  authId: string
  email: string
  name: string
  role: "TEACHER" | "STUDENT" | "GUARDIAN" | "ADMIN"
  guardianId: string | null
  createdAt: string
  updatedAt: string
}

interface AuthResponse {
  accessToken: string
  user: User
}

export interface RubricCriterion {
  id: string
  description: string
  maxPoints: number
  rubricId: string
}

export interface Rubric {
  id: string
  title: string
  assignmentId: string
  isConfirmed: boolean
  criteria: RubricCriterion[]
  createdAt: string
  updatedAt: string
}

export interface CriterionFeedback {
  id: string
  submissionId: string
  criteriaId: string
  pointsAwarded: number
  aiFeedback: string | null
  teacherNotes: string | null
  isConfirmed: boolean
  createdAt: string
  criterion?: { id: string; description: string; maxPoints: number }
}

export interface SubmissionDetail {
  id: string
  assignmentId: string
  studentId: string
  status: "SUBMITTED" | "GRADING_IN_PROGRESS" | "REVIEW_READY" | "CONFIRMED"
  createdAt: string
  updatedAt: string
  student?: User
  assignment?: components["schemas"]["AssignmentDto"]
  scores?: CriterionFeedback[]
  chunks?: { id: string; content: string }[]
}

export interface DashboardOverview {
  activeAlertCount: number
  resolvedAlertCount: number
  classCount: number
  pendingConfirmations: number
  recentAlerts: { id: string; studentName: string; type: string; reason: string; createdAt: string }[]
  submissionsNeedingReview: { id: string; studentName: string; assignmentTitle: string; createdAt: string }[]
  unreadNotifications: number
}

export interface Material {
  id: string
  title: string
  classId: string
  fileUrl?: string
  createdAt: string
}

export interface MaterialChunk {
  id: string
  content: string
  materialId: string
  similarity?: number
}

export interface AssistantChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  reply: string
  quiz?: {
    title: string
    questions: {
      type: "mcq" | "short_answer"
      question: string
      options?: string[]
      correctAnswer: string
      explanation?: string
    }[]
  }
}

export interface ImportAttendanceRecord {
  studentId: string
  classId: string
  date: string
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
}

type ClassDto = components["schemas"]["ClassDto"]
export interface ClassEnriched extends ClassDto {
  _count?: { enrollments: number; assignments: number }
}

// ── Backward-compat types (will be removed in Phase 5) ────────────

/** @deprecated Use SubmissionDetail instead */
export type SubmissionEnriched = SubmissionDetail
/** @deprecated Will be replaced by a dedicated class detail endpoint */
export interface ClassDetailEnriched extends ClassDto {
  enrollments: { id: string; classId: string; studentId: string; createdAt: string; student: User }[]
}

// ── Error helpers ─────────────────────────────────────────────────

const GENERIC_BACKEND_MESSAGES = new Set([
  "Internal server error",
  "Unauthorized",
  "Bad Request",
  "Forbidden",
  "Not Found",
  "Request failed with status code 400",
  "Request failed with status code 401",
  "Request failed with status code 403",
  "Request failed with status code 404",
  "Request failed with status code 409",
  "Request failed with status code 422",
  "Request failed with status code 500",
])

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Check your input and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to do that.",
  404: "This item could not be found — it may have been removed.",
  409: "This action conflicts with existing data.",
  410: "This resource is no longer available.",
  422: "Some of the submitted data is invalid.",
  429: "Too many requests — please wait a moment and try again.",
}

export function getErrorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

function isGenericBackendMessage(message: string): boolean {
  return GENERIC_BACKEND_MESSAGES.has(message)
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const backendMessage =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : undefined

    if (backendMessage && !isGenericBackendMessage(backendMessage)) {
      return backendMessage
    }

    if (!err.response) {
      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        return "The request timed out. Please try again."
      }
      return "Cannot reach the server. Check your connection and try again."
    }

    const status = err.response.status
    if (status >= 500) {
      return "Something went wrong on our side. Please try again in a moment."
    }
    if (status in STATUS_MESSAGES) {
      return STATUS_MESSAGES[status]
    }
    return "The request failed. Please try again."
  }
  if (err instanceof Error && err.message) return err.message
  return "Something went wrong"
}

// ── Auth ──────────────────────────────────────────────────────────

export async function signup(data: components["schemas"]["SignupDto"]): Promise<User> {
  const res = await api.post<AuthResponse>("/auth/signup", data)
  storeToken(res.data.accessToken)
  return res.data.user
}

export async function login(data: components["schemas"]["LoginDto"]): Promise<User> {
  const res = await api.post<AuthResponse>("/auth/login", data)
  storeToken(res.data.accessToken)
  return res.data.user
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/auth/me")
  return res.data
}

// ── Communication Agent Types ────────────────────────────────────

export interface DiagnosisPayload {
  hasIssue: boolean
  issueType: "STUDENT_ISSUE" | "CLASS_ISSUE" | "BOTH" | null
  severity: "LOW" | "MEDIUM" | "HIGH" | null
  summary: string | null
  classContext: string | null
}

export interface TeacherContentPayload {
  analysis: string
  skillGaps: string[]
  interventions: string[]
  resourceSuggestions: string[]
}

export interface GuardianContentPayload {
  message: string
  homeSupport: string[]
}

export interface TeacherFeedbackPayload {
  feedback: string
  patternAnalysis: string
  strategies: string[]
}

export interface ManagementSummaryPayload {
  summary: string
  classTrend: string
  recommendation: string
}

export interface AlertDetail {
  diagnosis: DiagnosisPayload
  teacherContent: TeacherContentPayload | null
  guardianContent: GuardianContentPayload | null
  teacherFeedback: TeacherFeedbackPayload | null
  managementSummary: ManagementSummaryPayload | null
}

export async function getAlertDetail(id: string): Promise<AlertDetail> {
  const res = await api.get<AlertDetail>(`/alerts/${id}/teacher-detail`)
  return res.data
}

// ── Dashboard ─────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardOverview> {
  const res = await api.get<DashboardOverview>("/dashboard/overview")
  return res.data
}

// ── Classes ───────────────────────────────────────────────────────

export async function getClasses(): Promise<components["schemas"]["ClassDto"][]> {
  const res = await api.get<components["schemas"]["ClassDto"][]>("/classes")
  return res.data
}

export async function getClass(id: string): Promise<components["schemas"]["ClassDto"]> {
  const res = await api.get<components["schemas"]["ClassDto"]>(`/classes/${id}`)
  return res.data
}

export async function createClass(data: components["schemas"]["CreateClassDto"]): Promise<components["schemas"]["ClassDto"]> {
  const res = await api.post<components["schemas"]["ClassDto"]>("/classes", data)
  return res.data
}

export async function updateClass(id: string, data: components["schemas"]["UpdateClassDto"]): Promise<components["schemas"]["ClassDto"]> {
  const res = await api.patch<components["schemas"]["ClassDto"]>(`/classes/${id}`, data)
  return res.data
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`)
}

export async function getAvailableClasses(): Promise<components["schemas"]["ClassDto"][]> {
  const res = await api.get<components["schemas"]["ClassDto"][]>("/classes/available")
  return res.data
}

export async function joinClass(classId: string): Promise<void> {
  await api.post(`/classes/${classId}/join`)
}

// ── Enrollments ───────────────────────────────────────────────────

export async function addEnrollment(classId: string, studentId: string): Promise<void> {
  await api.post(`/classes/${classId}/enrollments`, { studentId })
}

export async function removeEnrollment(classId: string, studentId: string): Promise<void> {
  await api.delete(`/classes/${classId}/enrollments/${studentId}`)
}

export async function getClassRequests(classId: string): Promise<{ id: string; studentId: string; status: string; student: { id: string; name: string; email: string } }[]> {
  const res = await api.get(`/classes/${classId}/requests`)
  return res.data
}

export async function approveEnrollment(enrollmentId: string): Promise<void> {
  await api.patch(`/enrollments/${enrollmentId}/approve`)
}

export async function rejectEnrollment(enrollmentId: string): Promise<void> {
  await api.patch(`/enrollments/${enrollmentId}/reject`)
}

export interface StudentClass {
  id: string
  name: string
  description: string | null
  teacherName: string
  assignments: { id: string; title: string; description: string | null; dueDate: string; totalPoints: number }[]
}

// ── Assignments ───────────────────────────────────────────────────

export async function getAssignments(classId?: string): Promise<components["schemas"]["AssignmentDto"][]> {
  const params = classId ? { classId } : undefined
  const res = await api.get<components["schemas"]["AssignmentDto"][]>("/assignments", { params })
  return res.data
}

export async function getAssignment(id: string): Promise<components["schemas"]["AssignmentDto"]> {
  const res = await api.get<components["schemas"]["AssignmentDto"]>(`/assignments/${id}`)
  return res.data
}

export async function createAssignment(data: components["schemas"]["CreateAssignmentDto"]): Promise<components["schemas"]["AssignmentDto"]> {
  const res = await api.post<components["schemas"]["AssignmentDto"]>("/assignments", data)
  return res.data
}

export async function updateAssignment(id: string, data: components["schemas"]["UpdateAssignmentDto"]): Promise<components["schemas"]["AssignmentDto"]> {
  const res = await api.patch<components["schemas"]["AssignmentDto"]>(`/assignments/${id}`, data)
  return res.data
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

// ── Rubrics ───────────────────────────────────────────────────────

export async function getRubrics(assignmentId?: string): Promise<Rubric[]> {
  const params = assignmentId ? { assignmentId } : undefined
  const res = await api.get<Rubric[]>("/rubrics", { params })
  return res.data
}

export async function getRubric(id: string): Promise<Rubric> {
  const res = await api.get<Rubric>(`/rubrics/${id}`)
  return res.data
}

export async function createRubric(data: components["schemas"]["CreateRubricDto"]): Promise<Rubric> {
  const res = await api.post<Rubric>("/rubrics", data)
  return res.data
}

export async function updateRubric(id: string, data: { title?: string; criteria?: { id?: string; description: string; maxPoints: number }[] }): Promise<Rubric> {
  const res = await api.patch<Rubric>(`/rubrics/${id}`, data)
  return res.data
}

export async function confirmRubric(id: string): Promise<Rubric> {
  const res = await api.patch<Rubric>(`/rubrics/${id}/confirm`)
  return res.data
}

export async function createRubricFromPdf(formData: FormData): Promise<{ title?: string; criteria: { description: string; maxPoints: number }[] }> {
  const res = await api.post("/rubrics/import-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export async function createRubricFromPdfDirect(formData: FormData): Promise<Rubric> {
  const res = await api.post<Rubric>("/rubrics/from-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

// ── Submissions ───────────────────────────────────────────────────

export async function getSubmissions(status?: string, assignmentId?: string): Promise<components["schemas"]["SubmissionDto"][]> {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (assignmentId) params.assignmentId = assignmentId
  const res = await api.get<components["schemas"]["SubmissionDto"][]>("/submissions", { params })
  return res.data
}

export async function getSubmission(id: string): Promise<SubmissionDetail> {
  const res = await api.get<SubmissionDetail>(`/submissions/${id}`)
  const data = res.data

  if (data.scores && data.scores.length > 0) {
    try {
      const rubrics = await getRubrics(data.assignmentId)
      const criteriaMap = new Map<string, { id: string; description: string; maxPoints: number }>()
      for (const rubric of rubrics) {
        for (const c of rubric.criteria) {
          criteriaMap.set(c.id, { id: c.id, description: c.description, maxPoints: c.maxPoints })
        }
      }
      data.scores = data.scores.map((score) => {
        const criterion = criteriaMap.get(score.criteriaId)
        if (criterion) {
          return { ...score, criterion }
        }
        return score
      }) as CriterionFeedback[]
    } catch {
      // Rubric fetch failed — criterion will be missing, fallback UI handles it
    }
  }

  return data
}

export async function createSubmission(data: components["schemas"]["CreateSubmissionDto"]): Promise<components["schemas"]["SubmissionDto"]> {
  const res = await api.post<components["schemas"]["SubmissionDto"]>("/submissions", data)
  return res.data
}

export async function createSubmissionFromPdf(formData: FormData): Promise<components["schemas"]["SubmissionDto"]> {
  const res = await api.post<components["schemas"]["SubmissionDto"]>("/submissions/import-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

// ── Grading ───────────────────────────────────────────────────────

export async function gradeSubmission(submissionId: string): Promise<void> {
  await api.post(`/grades/submissions/${submissionId}/grade`)
}

export async function updateGrade(scoreId: string, data: { pointsAwarded: number; teacherNotes?: string }): Promise<void> {
  await api.patch(`/grades/scores/${scoreId}`, data)
}

export async function confirmAllGrades(submissionId: string): Promise<void> {
  await api.patch(`/grades/confirm-all/${submissionId}`)
}

// ── Alerts ────────────────────────────────────────────────────────

export type AlertListItem = components["schemas"]["AlertDto"] & {
  studentName: string
  className: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  skillGapCount: number
}

export async function getAlerts(status?: string): Promise<AlertListItem[]> {
  const params = status ? { status } : undefined
  const res = await api.get<AlertListItem[]>("/alerts", { params })
  return res.data
}

export async function resolveAlert(id: string, status: "RESOLVED" | "DISMISSED"): Promise<components["schemas"]["AlertDto"]> {
  const res = await api.patch<components["schemas"]["AlertDto"]>(`/alerts/${id}`, { status })
  return res.data
}

// ── Notifications ─────────────────────────────────────────────────

export async function getNotifications(userId?: string): Promise<components["schemas"]["NotificationDto"][]> {
  const params = userId ? { userId } : undefined
  const res = await api.get<components["schemas"]["NotificationDto"][]>("/notifications", { params })
  return res.data
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

// ── Reports ───────────────────────────────────────────────────────

export async function getReports(studentId?: string): Promise<components["schemas"]["ReportDto"][]> {
  const params = studentId ? { studentId } : undefined
  const res = await api.get<components["schemas"]["ReportDto"][]>("/reports", { params })
  return res.data
}

export async function getReport(id: string): Promise<components["schemas"]["ReportDto"]> {
  const res = await api.get<components["schemas"]["ReportDto"]>(`/reports/${id}`)
  return res.data
}

// ── Materials ─────────────────────────────────────────────────────

export async function getMaterials(classId: string): Promise<Material[]> {
  const res = await api.get<Material[]>(`/materials/class/${classId}`)
  return res.data
}

export async function searchMaterials(classId: string, q: string, topK?: number): Promise<MaterialChunk[]> {
  const params: Record<string, string> = { q }
  if (topK) params.topK = String(topK)
  const res = await api.get<MaterialChunk[]>(`/materials/class/${classId}/search`, { params })
  return res.data
}

export async function uploadMaterial(
  title: string,
  classId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Material> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("title", title)
  fd.append("classId", classId)
  const res = await api.post<Material>("/materials/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data
}

export async function deleteMaterial(id: string): Promise<void> {
  await api.delete(`/materials/${id}`)
}

// ── Attendance ────────────────────────────────────────────────────

export async function importAttendance(records: ImportAttendanceRecord[]): Promise<components["schemas"]["AttendanceResponseDto"][]> {
  const res = await api.post<components["schemas"]["AttendanceResponseDto"][]>("/attendance/import", { records })
  return res.data
}

export async function getStudentAttendance(studentId: string): Promise<components["schemas"]["AttendanceResponseDto"][]> {
  const res = await api.get<components["schemas"]["AttendanceResponseDto"][]>(`/students/${studentId}/attendance`)
  return res.data
}

export async function getClassAttendance(classId: string): Promise<components["schemas"]["AttendanceResponseDto"][]> {
  const res = await api.get<components["schemas"]["AttendanceResponseDto"][]>(`/classes/${classId}/attendance`)
  return res.data
}

// ── Student Grades ────────────────────────────────────────────────

export interface StudentGrade {
  id: string
  submissionId: string
  assignmentId: string
  criteriaId: string
  pointsAwarded: number
  aiFeedback: string | null
  teacherNotes: string | null
  isConfirmed: boolean
  createdAt: string
  criterionDescription: string
  criterionMaxPoints: number
}

export async function getStudentGrades(studentId: string): Promise<StudentGrade[]> {
  const res = await api.get<StudentGrade[]>(`/students/${studentId}/grades`)
  return res.data
}

export async function getStudentSubmissionGrades(studentId: string, submissionId: string): Promise<StudentGrade[]> {
  const res = await api.get<StudentGrade[]>(`/students/${studentId}/grades/${submissionId}`)
  return res.data
}

export async function getStudentClasses(studentId: string): Promise<StudentClass[]> {
  const res = await api.get<StudentClass[]>(`/students/${studentId}/classes`)
  return res.data
}

// ── Grades ────────────────────────────────────────────────────────

export interface TeacherGrade { id: string; level: number; name: string; createdAt: string }

interface TeacherGradeRow {
  id: string
  teacherId: string
  gradeId: string
  grade: { id: string; level: number; name: string; createdAt: string }
}

export async function getTeacherGrades(teacherId: string): Promise<TeacherGrade[]> {
  const res = await api.get<TeacherGradeRow[]>(`/teachers/${teacherId}/grades`)
  return res.data.map((row) => ({
    id: row.grade.id,
    level: row.grade.level,
    name: row.grade.name,
    createdAt: row.grade.createdAt,
  }))
}

export async function getGradeClasses(gradeId: string): Promise<components["schemas"]["ClassDto"][]> {
  const res = await api.get<components["schemas"]["ClassDto"][]>(`/grades/${gradeId}/classes`)
  return res.data
}

// ── Admin ─────────────────────────────────────────────────────────

export interface AdminUser { id: string; email: string; name: string; role: string }

export async function getUsers(params?: { role?: string; q?: string }): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>("/users", { params })
  return res.data
}

export async function getAllGrades(): Promise<TeacherGrade[]> {
  const res = await api.get<TeacherGrade[]>("/grades")
  return res.data
}

export async function createGrade(data: { level: number; name: string }): Promise<void> {
  await api.post("/grades", data)
}

export async function linkGuardianToStudent(studentId: string, guardianId: string): Promise<void> {
  await api.post(`/students/${studentId}/guardian`, { guardianId })
}

export async function assignGradeToTeacher(teacherId: string, gradeId: string): Promise<void> {
  await api.post(`/teachers/${teacherId}/grades`, { gradeId })
}

export async function removeGradeFromTeacher(teacherId: string, gradeId: string): Promise<void> {
  await api.delete(`/teachers/${teacherId}/grades/${gradeId}`)
}

export async function addClassToGrade(gradeId: string, classId: string): Promise<void> {
  await api.post(`/grades/${gradeId}/classes`, { classId })
}

export async function removeClassFromGrade(gradeId: string, classId: string): Promise<void> {
  await api.delete(`/grades/${gradeId}/classes/${classId}`)
}

// ── Assistant Chat ────────────────────────────────────────────────

export async function sendChatMessage(
  classId: string,
  messages: AssistantChatMessage[],
  newMessage: string,
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/assistant/chat", { classId, messages, newMessage })
  return res.data
}

// ── Homework Help ─────────────────────────────────────────────────

export type HomeworkHelpFeedbackValue = "HELPFUL" | "NOT_HELPFUL"

export interface HomeworkHelpInteraction {
  id: string
  question: string
  answer: string
  action: "HINT" | "EXPLANATION" | "REDIRECT_TEACHER" | string
  sources: string[]
  feedback: HomeworkHelpFeedbackValue | null
  createdAt: string
}

export interface HomeworkHelpResponse {
  interactionId: string
  reply: string
  action: string
  sources: string[]
  teacherNotified: boolean
}

export async function askHomeworkHelp(data: {
  classId: string
  question: string
  assignmentId?: string
}): Promise<HomeworkHelpResponse> {
  const res = await api.post<HomeworkHelpResponse>("/assistant/homework-help", data)
  return res.data
}

export async function getHomeworkHelpHistory(classId?: string): Promise<HomeworkHelpInteraction[]> {
  const params = classId ? { classId } : undefined
  const res = await api.get<{ interactions: HomeworkHelpInteraction[] }>("/assistant/homework-help/history", { params })
  return res.data.interactions
}

export async function submitHomeworkHelpFeedback(interactionId: string, feedback: HomeworkHelpFeedbackValue): Promise<void> {
  await api.patch(`/assistant/homework-help/${interactionId}/feedback`, { feedback })
}

// ── Quizzes ───────────────────────────────────────────────────────

export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED"
export type QuizQuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY"
export type StudentAttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface QuizOption {
  text: string
  isCorrect?: boolean
}

export interface QuizQuestion {
  id: string
  type: QuizQuestionType
  question: string
  options?: QuizOption[]
  points: number
  order: number
}

export interface QuizDto {
  id: string
  title: string
  description: string | null
  classId: string
  timeLimit: number | null
  passingScore: number | null
  status: QuizStatus
  endsAt: string | null
  createdAt: string
  questions?: QuizQuestion[]
}

export interface QuizWithAttemptStatus extends QuizDto {
  attemptStatus?: StudentAttemptStatus
  attemptId?: string
}

export interface CreateQuizOption {
  id?: string
  text: string
  isCorrect: boolean
}

export interface CreateQuizQuestion {
  id?: string
  type: QuizQuestionType
  question: string
  options?: CreateQuizOption[]
  points?: number
  order: number
}

export interface CreateQuizDto {
  title: string
  description?: string
  classId: string
  timeLimit?: number
  passingScore?: number
  endsAt: string
  questions: CreateQuizQuestion[]
}

export interface GenerateQuizDto {
  classId: string
  topic: string
  questionCount: number
  types: QuizQuestionType[]
}

export interface GenerateQuizResult {
  quizId: string
  title: string
  message: string
}

export type QuizViolationType = "TAB_SWITCH" | "FULLSCREEN_EXIT"

export interface QuizViolation {
  id: string
  type: QuizViolationType | string
  createdAt: string
}

export interface QuizAnswerDto {
  id: string
  questionId: string
  answer: string
  pointsAwarded: number | null
  aiFeedback: string | null
  isConfirmed: boolean
}

export interface QuizAttemptDto {
  id: string
  quizId: string
  studentId: string
  startedAt: string
  submittedAt: string | null
  totalScore: number | null
  status: "IN_PROGRESS" | "COMPLETED"
  violations?: QuizViolation[]
  expiresAt: string | null
  serverNow?: string
}

export interface QuizAttemptDetail extends QuizAttemptDto {
  student?: { id: string; name: string }
  quiz?: QuizDto
  answers?: QuizAnswerDto[]
}

export interface SubmitQuizAnswers {
  questionId: string
  answer: string
}

export async function getQuizzes(classId?: string): Promise<QuizDto[]> {
  const params = classId ? { classId } : undefined
  const res = await api.get<QuizDto[]>("/quizzes", { params })
  return res.data
}

export async function getStudentQuizzes(): Promise<QuizWithAttemptStatus[]> {
  const res = await api.get<QuizWithAttemptStatus[]>("/quizzes")
  return res.data
}

export async function getQuiz(id: string): Promise<QuizDto> {
  const res = await api.get<QuizDto>(`/quizzes/${id}`)
  return res.data
}

export async function createQuiz(data: CreateQuizDto): Promise<QuizDto> {
  const res = await api.post<QuizDto>("/quizzes", data)
  return res.data
}

export async function generateQuiz(data: GenerateQuizDto): Promise<GenerateQuizResult> {
  const res = await api.post<GenerateQuizResult>("/quizzes/generate", data)
  return res.data
}

export async function updateQuiz(id: string, data: Partial<CreateQuizDto> & { status?: QuizStatus }): Promise<QuizDto> {
  const res = await api.patch<QuizDto>(`/quizzes/${id}`, data)
  return res.data
}

export async function publishQuiz(id: string): Promise<QuizDto> {
  const res = await api.patch<QuizDto>(`/quizzes/${id}/publish`)
  return res.data
}

export async function deleteQuiz(id: string): Promise<void> {
  await api.delete(`/quizzes/${id}`)
}

export async function startQuizAttempt(quizId: string): Promise<QuizAttemptDto> {
  const res = await api.post<QuizAttemptDto>(`/quizzes/${quizId}/start`)
  return res.data
}

export async function submitQuizAttempt(quizId: string, answers: SubmitQuizAnswers[]): Promise<QuizAttemptDto> {
  const res = await api.post<QuizAttemptDto>(`/quizzes/${quizId}/submit`, { answers })
  return res.data
}

export async function reportQuizViolation(attemptId: string, type: QuizViolationType): Promise<QuizViolation> {
  const res = await api.post<QuizViolation>(`/quizzes/attempts/${attemptId}/violations`, { type })
  return res.data
}

export async function getQuizAttempt(attemptId: string): Promise<QuizAttemptDetail> {
  const res = await api.get<QuizAttemptDetail>(`/quizzes/attempts/${attemptId}`)
  return res.data
}

export async function getQuizAttempts(quizId: string): Promise<QuizAttemptDetail[]> {
  const res = await api.get<QuizAttemptDetail[]>(`/quizzes/${quizId}/attempts`)
  return res.data
}

export async function confirmQuizAttempt(attemptId: string): Promise<QuizAttemptDetail> {
  const res = await api.patch<QuizAttemptDetail>(`/quizzes/attempts/${attemptId}/confirm`)
  return res.data
}

export async function updateQuizAnswer(answerId: string, pointsAwarded: number): Promise<QuizAnswerDto> {
  const res = await api.patch<QuizAnswerDto>(`/quizzes/answers/${answerId}`, { pointsAwarded })
  return res.data
}

// ── Dashboard Insights (contract: dashboard-insights-frontend.md) ──
// NOTE: shapes mirror the backend Task 4 handoff contract. Once the
// backend ships GET /dashboard/insights, run `npm run sync:api-types`
// and import the generated types instead of these.

export type InsightChartType = "line" | "area" | "bar" | "radar" | "donut"
export type InsightDirection = "up" | "down" | "flat"

export interface InsightSection {
  /** stable id — see dashboard-insights-frontend.md per-role tables */
  key: string
  /** backend-written human-readable title */
  title: string
  chartType: InsightChartType
  series: { label: string; value: number }[]
  /** present on 'line'/'area' only */
  delta?: {
    /** e.g. 12.5 or -8.0 (signed) */
    deltaPercent: number
    direction: InsightDirection
  }
}

export interface AgentInsight {
  title: string
  summary: string
}

export interface InsightsResponse {
  interval: "week" | "month"
  /** ordered for the page layout */
  sections: InsightSection[]
  /** narrative lists (cards), role-specific */
  agentInsights: AgentInsight[]
  unreadNotifications: number
}

export async function getDashboardInsights(interval: "week" | "month" = "week"): Promise<InsightsResponse> {
  const res = await api.get<InsightsResponse>("/dashboard/insights", { params: { interval } })
  return res.data
}

export async function getStudentInsights(
  studentId: string,
  interval: "week" | "month" = "week",
): Promise<InsightsResponse> {
  const res = await api.get<InsightsResponse>(`/dashboard/insights/students/${studentId}`, { params: { interval } })
  return res.data
}

// ── Chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  threadId: string
  authorId: string
  text: string
  readAt: string | null
  createdAt: string
}

export interface ChatThreadListItem {
  id: string
  classId: string
  teacherId: string
  studentId: string
  createdAt: string
  updatedAt: string
  className: string | null
  peerId: string
  peerName: string
  lastMessage: string | null
}

export interface ChatThread {
  id: string
  classId: string
  teacherId: string
  studentId: string
  createdAt: string
  updatedAt: string
}

export interface MessagesPage {
  items: ChatMessage[]
  nextCursor: string | null
}

export async function getChatThreads(): Promise<ChatThreadListItem[]> {
  const res = await api.get<ChatThreadListItem[]>("/chat/threads")
  return res.data
}

export async function createOrGetChatThread(classId: string, studentId?: string): Promise<ChatThread> {
  const res = await api.post<ChatThread>("/chat/threads", { classId, studentId })
  return res.data
}

export async function getChatMessages(threadId: string, after?: string): Promise<MessagesPage> {
  const res = await api.get<MessagesPage>(`/chat/threads/${threadId}/messages`, {
    params: after ? { after } : undefined,
  })
  return res.data
}

export async function sendThreadMessage(threadId: string, text: string): Promise<ChatMessage> {
  const res = await api.post<ChatMessage>(`/chat/threads/${threadId}/messages`, { text })
  return res.data
}

export async function markThreadRead(threadId: string): Promise<void> {
  await api.post(`/chat/threads/${threadId}/read`)
}
