import axios, { AxiosError } from "axios"
import type { components } from "@/types/api-schema"

// ── Config ───────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
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
  criterion: { id: string; description: string; maxPoints: number }
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

export interface ChatMessage {
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

// ── Error helper ──────────────────────────────────────────────────

function extractMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message ?? error.message
  }
  if (error instanceof Error) return error.message
  return "An unexpected error occurred"
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
  return res.data
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

export async function confirmAllGrades(submissionId: string): Promise<void> {
  await api.patch(`/grades/confirm-all/${submissionId}`)
}

/** @deprecated Use confirmAllGrades instead — kept for backward compat */
export async function confirmGrade(id: string, data?: { pointsAwarded: number; teacherNotes?: string }): Promise<void> {
  void data
  await api.patch(`/grades/confirm-all/${id}`)
}

// ── Alerts ────────────────────────────────────────────────────────

export async function getAlerts(status?: string): Promise<components["schemas"]["AlertDto"][]> {
  const params = status ? { status } : undefined
  const res = await api.get<components["schemas"]["AlertDto"][]>("/alerts", { params })
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

export async function uploadMaterial(title: string, classId: string, file: File): Promise<Material> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("title", title)
  fd.append("classId", classId)
  const res = await api.post<Material>("/materials/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
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

export interface StudentClass {
  id: string
  name: string
  description: string | null
  teacherName: string
  assignments: { id: string; title: string; description: string | null; dueDate: string; totalPoints: number }[]
}

export async function getStudentClasses(studentId: string): Promise<StudentClass[]> {
  const res = await api.get<StudentClass[]>(`/students/${studentId}/classes`)
  return res.data
}

export async function getStudentClasses(studentId: string): Promise<StudentClass[]> {
  const res = await api.get<StudentClass[]>(`/students/${studentId}/classes`)
  return res.data
}

// ── Grades ────────────────────────────────────────────────────────

export interface TeacherGrade { id: string; level: number; name: string; createdAt: string }

export async function getTeacherGrades(teacherId: string): Promise<TeacherGrade[]> {
  const res = await api.get<TeacherGrade[]>(`/teachers/${teacherId}/grades`)
  return res.data
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
  messages: ChatMessage[],
  newMessage: string,
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/assistant/chat", { classId, messages, newMessage })
  return res.data
}

export async function updateGrade(id: string, data: { pointsAwarded?: number; teacherNotes?: string }): Promise<void> {
  await api.patch(`/grades/scores/${id}`, data)
}

// ── Re-export extractMessage for hooks ────────────────────────────

export { extractMessage }
