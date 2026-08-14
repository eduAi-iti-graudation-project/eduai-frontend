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

export const SESSION_EXPIRED_EVENT = "eduai:session-expired"

export function isAuthEndpointUrl(url: string | undefined): boolean {
  const u = url ?? ""
  return u.includes("/auth/login") || u.includes("/auth/signup")
}

export function shouldExpireSession(
  status: number | undefined,
  url: string | undefined,
  hasToken: boolean,
): boolean {
  return status === 401 && hasToken && !isAuthEndpointUrl(url)
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (shouldExpireSession(error.response?.status, error.config?.url, getStoredToken() !== null)) {
      clearToken()
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }

    const requirement = getSubscriptionRequirement(error)
    if (requirement.kind !== "none") {
      window.dispatchEvent(
        new CustomEvent("eduai:subscription-required", { detail: requirement }),
      )
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
  organizationId: string | null
  guardianId: string | null
  gradeId: string | null
  grade?: { id: string; level: number; name: string | null } | null
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
  criteria?: { id: string; description: string; maxPoints: number } | null
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
  assignmentId?: string | null
  chapterId?: string | null
  createdAt: string
  chunkCount?: number
  detectedChapterCount?: number
  _count?: { chunks: number }
}

export interface MaterialChapter {
  id: string
  title: string
  order: number
  materials: Material[]
  createdAt?: string
}

export interface MaterialGrouped {
  chapters: MaterialChapter[]
  unassigned: Material[]
}

export interface MaterialChunk {
  id: string
  content: string
  materialId: string
  materialTitle?: string
  chapterId?: string | null
  chapterTitle?: string | null
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

// Backend schema renamed classes → sections (SectionDto); keep the legacy local names
type ClassDto = components["schemas"]["ClassDto"]
type CreateClassDto = components["schemas"]["CreateSectionDto"]
type UpdateClassDto = components["schemas"]["UpdateSectionDto"]
export interface ClassEnriched extends ClassDto {
  _count?: { enrollments: number; assignments: number; offerings?: number }
  courses?: string[]
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

export function getErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { code?: string } | undefined
    return data?.code
  }
  return undefined
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

export type SubscriptionRequirement =
  | { kind: "none" }
  | { kind: "subscription" }
  | { kind: "tier"; tier: string }

export function getSubscriptionRequirement(err: unknown): SubscriptionRequirement {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    if (status === 402) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err)
      const isSubscriptionRequired =
        code === "SUBSCRIPTION_REQUIRED" || /active subscription/i.test(message)
      if (isSubscriptionRequired) {
        return { kind: "subscription" }
      }
    }
    if (status === 403) {
      const message = getErrorMessage(err)
      const match = message.match(/This feature requires the (.+) plan or higher/)
      if (match) {
        return { kind: "tier", tier: match[1] }
      }
    }
  }
  return { kind: "none" }
}

// ── Auth ──────────────────────────────────────────────────────────

export interface SignupPayload {
  name: string
  email: string
  password: string
  role?: "TEACHER" | "STUDENT"
  gradeLevel?: number
  joinCode?: string
  organizationName?: string
}

export interface PendingSignupResult {
  status: "PENDING"
  message: string
}

export type SignupResult = User | PendingSignupResult

export async function signup(data: SignupPayload): Promise<SignupResult> {
  const res = await api.post<AuthResponse | PendingSignupResult>("/auth/signup", data)
  if ("status" in res.data && res.data.status === "PENDING") {
    return res.data
  }
  storeToken((res.data as AuthResponse).accessToken)
  return (res.data as AuthResponse).user
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/auth/forgot-password", { email })
  return res.data
}

export async function resetPassword(token: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/reset-password", { token, password })
  storeToken(res.data.accessToken)
  return res.data
}

export interface VerifyEmailResult {
  email: string
  schoolCode: string | null
  needsPassword: boolean
}

export async function verifyEmail(token: string, password?: string): Promise<VerifyEmailResult> {
  const res = await api.post<VerifyEmailResult>("/auth/verify-email", {
    token,
    ...(password ? { password } : {}),
  })
  return res.data
}

export async function resendCredentials(personalEmail: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/auth/credentials/resend", { personalEmail })
  return res.data
}

export async function oauthAuthorize(provider: "google" | "microsoft"): Promise<{ url: string }> {
  const res = await api.post<{ url: string }>(`/auth/oauth/${provider}/authorize`)
  return res.data
}

export interface OauthOnboardResult {
  id: string
  name: string
  joinCode: string
  emailDomain: string | null
}

export async function oauthOnboard(input: {
  organizationName?: string
  joinCode?: string
}): Promise<OauthOnboardResult> {
  const res = await api.post<OauthOnboardResult>("/auth/oauth/onboard", input)
  return res.data
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/auth/change-password", {
    currentPassword,
    newPassword,
  })
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

export interface PracticeRecommendation {
  id: string
  topic: string
  status: string
  stage: string
  error: string | null
  createdAt: string
}

export interface AlertDetail {
  diagnosis: DiagnosisPayload
  teacherContent: TeacherContentPayload | null
  guardianContent: GuardianContentPayload | null
  teacherFeedback: TeacherFeedbackPayload | null
  managementSummary: ManagementSummaryPayload | null
  recommendations: PracticeRecommendation[] | null
}

export async function getAlertDetail(id: string): Promise<AlertDetail> {
  const res = await api.get<AlertDetail>(`/alerts/${id}/teacher-detail`)
  return res.data
}

export interface GuardianAlertDetail {
  studentId: string
  studentName: string
  diagnosis: { summary: string | null }
  guardianContent: GuardianContentPayload | null
}

export async function getGuardianAlertDetail(id: string): Promise<GuardianAlertDetail> {
  const res = await api.get<GuardianAlertDetail>(`/alerts/${id}/guardian-detail`)
  return res.data
}

// ── Dashboard ─────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardOverview> {
  const res = await api.get<DashboardOverview>("/dashboard/overview")
  return res.data
}

// ── Classes ───────────────────────────────────────────────────────

export async function getClasses(): Promise<ClassEnriched[]> {
  const res = await api.get<ClassEnriched[]>("/classes")
  return res.data
}

export async function getClass(id: string): Promise<ClassDto> {
  const res = await api.get<ClassDto>(`/classes/${id}`)
  return res.data
}

export async function createClass(data: CreateClassDto): Promise<ClassDto> {
  const res = await api.post<ClassDto>("/classes", data)
  return res.data
}

export async function updateClass(id: string, data: UpdateClassDto): Promise<ClassDto> {
  const res = await api.patch<ClassDto>(`/classes/${id}`, data)
  return res.data
}

export async function assignTeacherToClass(classId: string, teacherId: string): Promise<ClassDto> {
  const res = await api.post<ClassDto>(`/classes/${classId}/teacher`, { teacherId })
  return res.data
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`)
}

// ── Courses ───────────────────────────────────────────────────────

export async function getCourses(): Promise<components["schemas"]["CourseDto"][]> {
  const res = await api.get<components["schemas"]["CourseDto"][]>("/courses")
  return res.data
}

export async function createCourse(data: components["schemas"]["CreateCourseDto"]): Promise<components["schemas"]["CourseDto"]> {
  const res = await api.post<components["schemas"]["CourseDto"]>("/courses", data)
  return res.data
}

export async function updateCourse(id: string, data: components["schemas"]["UpdateCourseDto"]): Promise<components["schemas"]["CourseDto"]> {
  const res = await api.patch<components["schemas"]["CourseDto"]>(`/courses/${id}`, data)
  return res.data
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`)
}

// ── Offerings (course × section × teacher) ────────────────────────

export async function createOffering(data: components["schemas"]["CreateOfferingDto"]): Promise<CourseOffering> {
  const res = await api.post<CourseOffering>("/offerings", data)
  return res.data
}

export async function updateOffering(id: string, data: components["schemas"]["UpdateOfferingDto"]): Promise<CourseOffering> {
  const res = await api.patch<CourseOffering>(`/offerings/${id}`, data)
  return res.data
}

export async function deleteOffering(id: string): Promise<void> {
  await api.delete(`/offerings/${id}`)
}

// ── Enrollments ───────────────────────────────────────────────────

export async function addEnrollment(classId: string, studentId: string): Promise<void> {
  await api.post(`/classes/${classId}/enrollments`, { studentId })
}

export async function removeEnrollment(classId: string, studentId: string): Promise<void> {
  await api.delete(`/classes/${classId}/enrollments/${studentId}`)
}

export interface StudentClass {
  id: string
  name: string
  description: string | null
  teacherName: string
  materialCount: number
  materialTitles: string[]
  quizCount: number
  assignments: {
    id: string
    title: string
    description: string | null
    dueDate: string
    totalPoints: number
    materials: { id: string; title: string }[]
  }[]
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

export type GenerateAssignmentDraftResult =
  | components["schemas"]["GenerateGroundedResultDto"]
  | components["schemas"]["GenerateNotGroundedResultDto"]

export async function generateAssignmentDraft(data: components["schemas"]["GenerateAssignmentDto"]): Promise<GenerateAssignmentDraftResult> {
  const res = await api.post<GenerateAssignmentDraftResult>("/assignments/generate", data)
  return res.data
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

export async function getSubmissions(status?: string, assignmentId?: string): Promise<SubmissionDetail[]> {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (assignmentId) params.assignmentId = assignmentId
  const res = await api.get<SubmissionDetail[]>("/submissions", { params })
  return res.data
}

export interface MySubmission {
  id: string
  assignmentId: string
  status: string
}

export async function getMySubmissions(assignmentId?: string): Promise<MySubmission[]> {
  const params: Record<string, string> = {}
  if (assignmentId) params.assignmentId = assignmentId
  const res = await api.get<MySubmission[]>("/submissions/mine", { params })
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
  grade: { id: string; level: number; name: string | null } | null
  teacherName: string | null
  teacherId: string | null
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

// ── Admin student detail ───────────────────────────────────────────

export interface AdminStudentProfile {
  id: string
  name: string
  email: string
  grade: { id: string; level: number; name: string | null } | null
  guardian: { id: string; name: string; email: string } | null
  createdAt: string
  classes: {
    id: string
    name: string
    description: string | null
    teacher: { id: string; name: string; email: string }
    grade: { id: string; level: number; name: string | null } | null
  }[]
  activeAlertCount: number
  quizGradeSummary: { count: number; averagePct: number | null }
}

export interface StudentQuizGrade {
  id: string
  quizId: string
  quizTitle: string
  className: string
  teacherName: string | null
  totalScore: number
  maxPoints: number
  percent: number
  submittedAt: string
}

export interface HistoryYear {
  year: string
  quizCount: number
  quizAveragePct: number | null
  quizScores: {
    quizTitle: string
    totalScore: number
    maxPoints: number
    percent: number
    submittedAt: string
  }[]
  warnings: {
    id: string
    type: string
    reason: string
    status: string
    createdAt: string
    severity?: string
  }[]
}

export interface StudentHistory {
  studentId: string
  years: HistoryYear[]
}

export type StudentDocumentCategory =
  | "BIRTH_CERTIFICATE"
  | "IMMUNIZATION_RECORD"
  | "PREVIOUS_TRANSCRIPT"
  | "PAYMENT_RECEIPT"
  | "ID_DOCUMENT"
  | "OTHER"

export interface StudentDocument {
  id: string
  studentId: string | null
  organizationId: string
  category: StudentDocumentCategory
  title: string
  academicYear: string | null
  fileName: string
  fileUrl: string
  mimeType: string | null
  sizeBytes: number | null
  aiSuggestedCategory: string | null
  aiSuggestedStudentId: string | null
  aiMatchConfidence: number | null
  aiSuggestedStudent?: { id: string; name: string; email: string } | null
  uploadedById: string | null
  createdAt: string
  uploadedBy?: { id: string; name: string } | null
}

export type FeeType = "TUITION" | "REGISTRATION" | "EXAM" | "MATERIALS" | "OTHER"
export type FeeStatus = "PAID" | "PARTIAL" | "POSTPONED" | "UNPAID"

export interface StudentFee {
  id: string
  studentId: string
  academicYear: string
  feeType: FeeType
  amount: string
  amountPaid: string | null
  status: FeeStatus
  body: string | null
  paidAt: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export async function getAdminStudentProfile(studentId: string): Promise<AdminStudentProfile> {
  const res = await api.get<AdminStudentProfile>(`/students/${studentId}/admin-profile`)
  return res.data
}

export interface ResetStudentCredentialsResult {
  email: string
  invited: boolean
}

export async function resetStudentCredentials(
  studentId: string,
): Promise<ResetStudentCredentialsResult> {
  const res = await api.post<ResetStudentCredentialsResult>(
    `/students/${studentId}/credentials/reset`,
  )
  return res.data
}

export async function getStudentQuizGrades(studentId: string): Promise<StudentQuizGrade[]> {
  const res = await api.get<StudentQuizGrade[]>(`/students/${studentId}/quiz-grades`)
  return res.data
}

export async function getStudentHistory(studentId: string): Promise<StudentHistory> {
  const res = await api.get<StudentHistory>(`/students/${studentId}/history`)
  return res.data
}

export async function getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
  const res = await api.get<StudentDocument[]>(`/students/${studentId}/documents`)
  return res.data
}

export async function uploadStudentDocument(
  studentId: string,
  data: { file: File; title: string; category?: StudentDocumentCategory; academicYear?: string | null },
): Promise<StudentDocument> {
  const form = new FormData()
  form.append("file", data.file)
  form.append("title", data.title)
  if (data.category) form.append("category", data.category)
  if (data.academicYear) form.append("academicYear", data.academicYear)
  const res = await api.post<StudentDocument>(`/students/${studentId}/documents`, form)
  return res.data
}

export async function getStudentDocumentUrl(studentId: string, documentId: string): Promise<string> {
  const res = await api.get(`/students/${studentId}/documents/${documentId}/file`, { responseType: "blob" })
  return URL.createObjectURL(res.data as Blob)
}

export async function deleteStudentDocument(studentId: string, documentId: string): Promise<void> {
  await api.delete(`/students/${studentId}/documents/${documentId}`)
}

export interface BulkUploadResult {
  created: Array<{
    id: string
    fileName: string
    aiSuggestedCategory: string | null
    aiSuggestedStudentId: string | null
    aiMatchConfidence: number | null
    category: StudentDocumentCategory
    studentId: string | null
  }>
  failed: Array<{ fileName: string; reason: string }>
}

export async function bulkUploadStudentDocuments(files: File[]): Promise<BulkUploadResult> {
  const form = new FormData()
  for (const file of files) form.append("files", file)
  const res = await api.post<BulkUploadResult>("/documents/bulk-upload", form)
  return res.data
}

export async function listBulkDocuments(): Promise<StudentDocument[]> {
  const res = await api.get<StudentDocument[]>("/documents/bulk")
  return res.data
}

export async function confirmDocumentAssignment(
  documentId: string,
  data: { studentId: string; category: StudentDocumentCategory },
): Promise<StudentDocument> {
  const res = await api.patch<StudentDocument>(`/documents/${documentId}/confirm-assignment`, data)
  return res.data
}

export async function getStudentFees(studentId: string): Promise<StudentFee[]> {
  const res = await api.get<StudentFee[]>(`/students/${studentId}/fees`)
  return res.data
}

export interface CreateFeeInput {
  academicYear: string
  feeType: FeeType
  amount: number
  amountPaid?: number | null
  status: FeeStatus
  body?: string | null
  paidAt?: string | null
  dueDate?: string | null
}

export async function createStudentFee(studentId: string, data: CreateFeeInput): Promise<StudentFee> {
  const res = await api.post<StudentFee>(`/students/${studentId}/fees`, data)
  return res.data
}

export async function updateStudentFee(
  studentId: string,
  feeId: string,
  data: Partial<CreateFeeInput>,
): Promise<StudentFee> {
  const res = await api.patch<StudentFee>(`/students/${studentId}/fees/${feeId}`, data)
  return res.data
}

export async function deleteStudentFee(studentId: string, feeId: string): Promise<void> {
  await api.delete(`/students/${studentId}/fees/${feeId}`)
}

// ── Teacher admin ──────────────────────────────────────────────────

export type TeacherGender = "MALE" | "FEMALE" | "OTHER"

export interface EmergencyContact {
  name: string | null
  phone: string | null
  relationship: string | null
}

export interface TeacherPersonalFields {
  avatarUrl: string | null
  ssnMasked: string | null
  phone: string | null
  street: string | null
  city: string | null
  nationality: string | null
  personalEmail: string | null
  dateOfBirth: string | null
  emergencyContact: EmergencyContact
}

export type AdminTeacherProfile = {
  id: string
  name: string
  email: string
  gender: TeacherGender | null
  createdAt: string
  grades: { id: string; level: number; name: string | null }[]
  classes: {
    id: string
    name: string
    description: string | null
    grades: { id: string; level: number; name: string | null }[]
    studentCount: number
    quizCount: number
    assignmentCount: number
  }[]
  classCount: number
  studentCount: number
  quizCount: number
  documentsCount: number
  salaryRecordsCount: number
} & TeacherPersonalFields

export interface TeacherProfileUpdate {
  gender?: TeacherGender | null
  ssn?: string
  phone?: string | null
  street?: string | null
  city?: string | null
  nationality?: string | null
  personalEmail?: string | null
  dateOfBirth?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelationship?: string | null
}

export function teacherAvatarUrl(teacherId: string): string {
  return `${API_URL}/users/${teacherId}/avatar`
}

export interface TeacherClass {
  id: string
  name: string
  description: string | null
  createdAt: string
  grades: { id: string; level: number; name: string | null }[]
  students: { id: string; name: string; email: string }[]
}

export interface TeacherHistoryEntry {
  id: string
  classId: string
  className: string
  grades: { id: string; level: number; name: string | null }[]
  startedAt: string
  endedAt: string | null
  active: boolean
  studentCount: number
}

export type TeacherDocumentType =
  | "SOCIAL_SECURITY"
  | "NATIONAL_ID"
  | "PASSPORT"
  | "LICENSE"
  | "DEGREE"
  | "CONTRACT"
  | "OTHER"

export interface TeacherDocument {
  id: string
  teacherId: string
  type: TeacherDocumentType
  title: string
  fileName: string
  fileUrl: string
  mimeType: string | null
  sizeBytes: number | null
  uploadedById: string | null
  createdAt: string
  uploadedBy?: { id: string; name: string } | null
}

export type SalaryStatus = "PAID" | "PARTIAL" | "POSTPONED" | "UNPAID"

export interface SalaryRecord {
  id: string
  teacherId: string
  period: string
  amount: string
  amountPaid: string | null
  status: SalaryStatus
  body: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export async function getAdminTeacherProfile(teacherId: string): Promise<AdminTeacherProfile> {
  const res = await api.get<AdminTeacherProfile>(`/teachers/${teacherId}/admin-profile`)
  return res.data
}

export async function updateTeacherGender(
  teacherId: string,
  gender: TeacherGender | null,
): Promise<{ id: string; name: string; gender: TeacherGender | null }> {
  const res = await api.patch(`/teachers/${teacherId}/profile`, { gender })
  return res.data
}

export function signupTeacher(form: FormData): Promise<PendingSignupResult> {
  return api
    .post<PendingSignupResult>("/auth/signup/teacher", form)
    .then((res) => res.data)
}

export async function updateTeacherProfile(
  teacherId: string,
  data: TeacherProfileUpdate,
): Promise<TeacherPersonalFields> {
  const res = await api.patch<TeacherPersonalFields>(`/teachers/${teacherId}/profile`, data)
  return res.data
}

export async function revealTeacherSsn(teacherId: string): Promise<{ ssn: string }> {
  const res = await api.get<{ ssn: string }>(`/teachers/${teacherId}/ssn`)
  return res.data
}

export async function uploadTeacherAvatar(
  teacherId: string,
  file: File,
): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append("photo", file)
  const res = await api.post<{ avatarUrl: string }>(`/teachers/${teacherId}/avatar`, form)
  return res.data
}

export async function getMyTeacherProfile(): Promise<TeacherPersonalFields & { id: string; name: string; email: string; gender: TeacherGender | null; createdAt: string }> {
  const res = await api.get("/teachers/me/profile")
  return res.data
}

export async function updateMyTeacherProfile(data: TeacherProfileUpdate): Promise<TeacherPersonalFields> {
  const res = await api.patch<TeacherPersonalFields>("/teachers/me/profile", data)
  return res.data
}

export async function uploadMyTeacherAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append("photo", file)
  const res = await api.post<{ avatarUrl: string }>("/teachers/me/avatar", form)
  return res.data
}

export async function getTeacherClasses(teacherId: string): Promise<TeacherClass[]> {
  const res = await api.get<TeacherClass[]>(`/teachers/${teacherId}/classes`)
  return res.data
}

export async function getTeacherHistory(teacherId: string): Promise<TeacherHistoryEntry[]> {
  const res = await api.get<TeacherHistoryEntry[]>(`/teachers/${teacherId}/history`)
  return res.data
}

export async function getTeacherDocuments(teacherId: string): Promise<TeacherDocument[]> {
  const res = await api.get<TeacherDocument[]>(`/teachers/${teacherId}/documents`)
  return res.data
}

export async function uploadTeacherDocument(
  teacherId: string,
  data: { file: File; title: string; type: TeacherDocumentType },
): Promise<TeacherDocument> {
  const form = new FormData()
  form.append("file", data.file)
  form.append("title", data.title)
  form.append("type", data.type)
  const res = await api.post<TeacherDocument>(`/teachers/${teacherId}/documents`, form)
  return res.data
}

export async function getTeacherDocumentUrl(teacherId: string, documentId: string): Promise<string> {
  const res = await api.get(`/teachers/${teacherId}/documents/${documentId}/file`, { responseType: "blob" })
  return URL.createObjectURL(res.data as Blob)
}

export async function deleteTeacherDocument(teacherId: string, documentId: string): Promise<void> {
  await api.delete(`/teachers/${teacherId}/documents/${documentId}`)
}

export interface CreateSalaryInput {
  period: string
  amount: number
  amountPaid?: number | null
  status: SalaryStatus
  body?: string | null
  paidAt?: string | null
}

export async function getTeacherSalaries(teacherId: string): Promise<SalaryRecord[]> {
  const res = await api.get<SalaryRecord[]>(`/teachers/${teacherId}/salaries`)
  return res.data
}

export async function createTeacherSalary(teacherId: string, data: CreateSalaryInput): Promise<SalaryRecord> {
  const res = await api.post<SalaryRecord>(`/teachers/${teacherId}/salaries`, data)
  return res.data
}

export async function updateTeacherSalary(
  teacherId: string,
  salaryId: string,
  data: Partial<CreateSalaryInput>,
): Promise<SalaryRecord> {
  const res = await api.patch<SalaryRecord>(`/teachers/${teacherId}/salaries/${salaryId}`, data)
  return res.data
}

export async function deleteTeacherSalary(teacherId: string, salaryId: string): Promise<void> {
  await api.delete(`/teachers/${teacherId}/salaries/${salaryId}`)
}

// ── Notifications ─────────────────────────────────────────────────

export async function getNotifications(): Promise<components["schemas"]["NotificationDto"][]> {
  const res = await api.get<components["schemas"]["NotificationDto"][]>("/notifications")
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
  const res = await api.get<Material[]>(`/materials/offering/${classId}`)
  return res.data
}

export async function searchMaterials(classId: string, q: string, topK?: number, chapterId?: string): Promise<MaterialChunk[]> {
  const params: Record<string, string> = { q }
  if (topK) params.topK = String(topK)
  if (chapterId) params.chapterId = chapterId
  const res = await api.get<MaterialChunk[]>(`/materials/offering/${classId}/search`, { params })
  return res.data
}

export async function getMaterialChapters(classId: string): Promise<MaterialGrouped> {
  const res = await api.get<MaterialGrouped>(`/materials/chapters/offering/${classId}`)
  return res.data
}

export async function getCourseMaterials(courseId: string): Promise<Material[]> {
  const res = await api.get<Material[]>(`/materials/course/${courseId}`)
  return res.data
}

export async function getCourseMaterialChapters(courseId: string): Promise<MaterialGrouped> {
  const res = await api.get<MaterialGrouped>(`/materials/chapters/course/${courseId}`)
  return res.data
}

export async function createCourseChapter(courseId: string, title: string): Promise<MaterialChapter> {
  const res = await api.post<MaterialChapter>(`/materials/course/${courseId}/chapters`, { title })
  return res.data
}

export async function searchCourseMaterials(courseId: string, q: string, topK?: number, chapterId?: string): Promise<MaterialChunk[]> {
  const params: Record<string, string> = { q }
  if (topK) params.topK = String(topK)
  if (chapterId) params.chapterId = chapterId
  const res = await api.get<MaterialChunk[]>(`/materials/course/${courseId}/search`, { params })
  return res.data
}

export async function createMaterialChapter(classId: string, title: string): Promise<MaterialChapter> {
  const res = await api.post<MaterialChapter>("/materials/chapters", { courseOfferingId: classId, title })
  return res.data
}

export async function renameMaterialChapter(
  id: string,
  data: { title?: string; order?: number },
): Promise<MaterialChapter> {
  const res = await api.patch<MaterialChapter>(`/materials/chapters/${id}`, data)
  return res.data
}

export async function deleteMaterialChapter(id: string): Promise<void> {
  await api.delete(`/materials/chapters/${id}`)
}

export async function moveMaterialToChapter(
  materialId: string,
  chapterId: string | null,
  fromChapterId?: string,
): Promise<void> {
  if (chapterId) {
    await api.post(`/materials/chapters/${chapterId}/materials/${materialId}`)
  } else {
    const source = fromChapterId ?? "ungrouped"
    await api.delete(`/materials/chapters/${source}/materials/${materialId}`)
  }
}

export async function getAssignmentMaterials(assignmentId: string): Promise<Material[]> {
  const res = await api.get<Material[]>(`/materials/assignment/${assignmentId}`)
  return res.data
}

export async function getMaterialFileUrl(id: string): Promise<string> {
  const res = await api.get<{ url: string }>(`/materials/${id}/file`)
  return res.data.url
}

export function materialDownloadUrl(id: string): string {
  return `${API_URL}/materials/${id}/download`
}

export async function downloadMaterialFile(id: string): Promise<Blob> {
  return fetchFileBlob(materialDownloadUrl(id))
}

export async function uploadMaterial(
  title: string,
  classId: string,
  file: File,
  onProgress?: (percent: number) => void,
  assignmentId?: string,
  chapterId?: string,
): Promise<Material> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("title", title)
  fd.append("courseOfferingId", classId)
  if (assignmentId) fd.append("assignmentId", assignmentId)
  if (chapterId) fd.append("chapterId", chapterId)
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

export async function getStudentCourses(studentId: string): Promise<StudentClass[]> {
  const res = await api.get<StudentClass[]>(`/students/${studentId}/courses`)
  return res.data
}

// ── Grades & Levels (teacher hierarchy view) ──────────────────────

export interface TeacherGrade {
  id: string
  level: number
  name: string
  createdAt: string
}

export interface TeacherGradeWithCounts extends TeacherGrade {
  sections: number
  courses: number
  students: number
}

export interface AdminGrade extends TeacherGrade {
  sections: number
  courses: number
  students: number
}

export async function getTeacherGrades(teacherId: string): Promise<TeacherGradeWithCounts[]> {
  const res = await api.get<
    {
      id: string
      teacherId: string
      gradeId: string
      grade: { id: string; level: number; name: string | null; createdAt: string }
      _count?: { sections: number; courses: number; students: number }
    }[]
  >(`/teachers/${teacherId}/grades`)
  return res.data.map((row) => ({
    id: row.grade.id,
    level: row.grade.level,
    name: row.grade.name ?? "",
    createdAt: row.grade.createdAt,
    sections: row._count?.sections ?? 0,
    courses: row._count?.courses ?? 0,
    students: row._count?.students ?? 0,
  }))
}

export interface TeacherGradeDetail {
  id: string
  level: number
  name: string | null
  students: number
  sections: GradeSection[]
  courses: GradeCourse[]
}

export async function getTeacherGrade(teacherId: string, gradeId: string): Promise<TeacherGradeDetail> {
  const res = await api.get<{
    id: string
    level: number
    name: string | null
    students: number
    sections: {
      id: string
      name: string
      description: string | null
      enrollments: number
      courses: { id: string; name: string; description: string | null }[]
    }[]
    courses: { id: string; name: string; description: string | null }[]
  }>(`/teachers/${teacherId}/grades/${gradeId}`)
  return res.data
}

export async function getGradeClasses(gradeId: string): Promise<ClassEnriched[]> {
  const res = await api.get<ClassEnriched[]>(`/grades/${gradeId}/classes`)
  return res.data
}

export interface GradeSectionCourse {
  id: string
  name: string
}

export interface GradeSection {
  id: string
  name: string
  description: string | null
  enrollments: number
  courses: GradeSectionCourse[]
}

export interface GradeCourse {
  id: string
  name: string
  description: string | null
}

// ── Admin ─────────────────────────────────────────────────────────

export interface AdminUser { id: string; email: string; name: string; role: string; gradeId: string | null }

export async function getUsers(params?: { role?: string; q?: string; take?: number }): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>("/users", { params })
  return res.data
}

export interface DeletedUser {
  id: string
  email: string
  name: string
  role: string
  deletedAt: string
}

export async function deleteUser(userId: string): Promise<DeletedUser> {
  const res = await api.delete<DeletedUser>(`/users/${userId}`)
  return res.data
}

export async function getAllGrades(): Promise<AdminGrade[]> {
  const res = await api.get<AdminGrade[]>("/grades")
  return res.data
}

export async function createGrade(data: { level: number; name: string }): Promise<void> {
  await api.post("/grades", data)
}

export async function deleteGrade(id: string): Promise<void> {
  await api.delete(`/grade-levels/${id}`)
}

export async function linkGuardianToStudent(studentId: string, guardianId: string): Promise<void> {
  await api.post(`/students/${studentId}/guardian`, { guardianId })
}

export async function addClassToGrade(gradeId: string, classId: string): Promise<void> {
  await api.post(`/grades/${gradeId}/classes`, { classId })
}

export async function removeClassFromGrade(gradeId: string, classId: string): Promise<void> {
  await api.delete(`/grades/${gradeId}/classes/${classId}`)
}

// ── Assistant Chat ────────────────────────────────────────────────

export async function sendChatMessage(
  courseOfferingId: string,
  messages: AssistantChatMessage[],
  newMessage: string,
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/assistant/chat", { courseOfferingId, messages, newMessage })
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
  courseOfferingId: string
  question: string
  assignmentId?: string
}): Promise<HomeworkHelpResponse> {
  const res = await api.post<HomeworkHelpResponse>("/assistant/homework-help", data)
  return res.data
}

export type HomeworkAgentStep =
  | "search_material"
  | "search_assignment"
  | "search_web"
  | "thinking"
  | "teacher"

export interface HomeworkHelpStreamHandlers {
  onStep: (step: HomeworkAgentStep) => void
  onDone: (data: HomeworkHelpResponse) => void
}

/**
 * Streams the homework help agent's progress over SSE (POST + ReadableStream).
 * Emits a `step` event as each agent tool runs, then a `done` event carrying
 * the final HomeworkHelpResponse payload.
 */
export async function streamHomeworkHelp(
  data: { courseOfferingId: string; question: string; assignmentId?: string },
  handlers: HomeworkHelpStreamHandlers,
): Promise<void> {
  const token = getStoredToken()
  const res = await fetch(`${API_URL}/assistant/homework-help`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    if (shouldExpireSession(res.status, "/assistant/homework-help", token !== null)) {
      clearToken()
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
    let message = "Something went wrong. Please try again."
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message)
  }

  if (!res.body) {
    throw new Error("Streaming is not supported by this browser.")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let completed = false

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx: number
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      for (const line of rawEvent.split("\n")) {
        if (!line.startsWith("data:")) continue
        const payload = line.slice(5).trim()
        if (!payload) continue
        let evt: { type: string; step?: HomeworkAgentStep; data?: HomeworkHelpResponse; message?: string }
        try {
          evt = JSON.parse(payload)
        } catch {
          continue
        }
        if (evt.type === "step" && evt.step) {
          handlers.onStep(evt.step)
          await new Promise((resolve) => setTimeout(resolve, 60))
        } else if (evt.type === "done" && evt.data) {
          completed = true
          handlers.onDone(evt.data)
        } else if (evt.type === "error" && evt.message) {
          throw new Error(evt.message)
        }
      }
    }
  }

  if (!completed) {
    throw new Error("The assistant response ended unexpectedly. Please try again.")
  }
}

export async function getHomeworkHelpHistory(courseOfferingId?: string): Promise<HomeworkHelpInteraction[]> {
  const params = courseOfferingId ? { courseOfferingId } : undefined
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
  breakdown?: {
    kind: "alert"
    type: string
    severity?: string | null
    headline: string
    highlights: string[]
    strengths: string[]
    concerns: string[]
    recommendation: string
  }
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

export async function createOrGetChatThread(courseOfferingId: string, studentId?: string): Promise<ChatThread> {
  const res = await api.post<ChatThread>("/chat/threads", { courseOfferingId, studentId })
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

// ── Organizations & Billing ───────────────────────────────────────

export type SubscriptionTier = "TRIAL" | "BASIC" | "PRO" | "ENTERPRISE"
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED"
export type PlanId = "basic" | "pro" | "enterprise"

export interface Organization {
  id: string
  name: string
  joinCode?: string
  subscriptionStatus: SubscriptionStatus
  subscriptionTier: SubscriptionTier
  seatLimit: number | null
  userCount: number
}

export interface CheckoutSession {
  url: string
}

export interface ChangePlanResult {
  planId: PlanId
  status: string
  cancelAtPeriodEnd: boolean
}

export async function getOrganization(): Promise<Organization> {
  const res = await api.get<Organization>("/organizations/me")
  return res.data
}

export async function createCheckoutSession(planId: PlanId): Promise<CheckoutSession> {
  const res = await api.post<CheckoutSession>("/billing/checkout", {
    planId,
    successUrl: `${window.location.origin}/admin/billing`,
    cancelUrl: `${window.location.origin}/admin/billing`,
  })
  return res.data
}

export async function createBillingPortal(): Promise<CheckoutSession> {
  const res = await api.post<CheckoutSession>("/billing/portal", {
    returnUrl: `${window.location.origin}/admin/billing`,
  })
  return res.data
}

export async function changePlan(planId: PlanId, atPeriodEnd = false): Promise<ChangePlanResult> {
  const res = await api.post<ChangePlanResult>("/billing/change-plan", { planId, atPeriodEnd })
  return res.data
}

export async function inviteMember(
  organizationId: string,
  data: { email: string; name?: string; role: "TEACHER" | "STUDENT" },
): Promise<{ id: string; email: string; role: string }> {
  const res = await api.post(`/organizations/${organizationId}/invite`, data)
  return res.data
}

// ── Membership requests ───────────────────────────────────────────

export type MembershipRequestStatus = "PENDING" | "APPROVED" | "REJECTED"
export type MembershipRole = "TEACHER" | "STUDENT"

export interface MembershipRequest {
  id: string
  email: string
  name: string
  role: MembershipRole
  status: MembershipRequestStatus
  createdAt: string
}

export interface ApprovedMembershipRequest {
  id: string
  email: string
  name: string
  role: MembershipRole
}

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function getMembershipRequests(
  status: MembershipRequestStatus = "PENDING",
): Promise<MembershipRequest[]> {
  const res = await api.get<MembershipRequest[]>("/organizations/me/requests", {
    params: { status },
  })
  return res.data
}

export async function approveMembershipRequest(
  requestId: string,
  role?: MembershipRole,
): Promise<ApprovedMembershipRequest> {
  const res = await api.post<ApprovedMembershipRequest>(
    `/organizations/me/requests/${requestId}/approve`,
    role ? { role } : {},
  )
  return res.data
}

export async function rejectMembershipRequest(requestId: string): Promise<MembershipRequest> {
  const res = await api.post<MembershipRequest>(
    `/organizations/me/requests/${requestId}/reject`,
  )
  return res.data
}

export async function regenerateJoinCode(): Promise<Organization> {
  const res = await api.post<Organization>("/organizations/me/join-code")
  return res.data
}

// ── Student join requests (roster import + self-registration) ─────

export type JoinRequestSource = "ROSTER" | "SELF"
export type JoinRequestKind = "STUDENT" | "GUARDIAN"
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface SchoolByCode {
  id: string
  name: string
  gradeLevels: Array<{ id: string; level: number; name: string | null }>
}

export interface StudentSignupResult {
  requestId: string
  matchedFromRoster: boolean
  gradeLevelName: string | null
  status: "PENDING"
}

export interface GuardianSignupResult {
  requestId: string
  status: "PENDING"
}

export interface JoinRequestItem {
  id: string
  source: JoinRequestSource
  kind: JoinRequestKind
  status: JoinRequestStatus
  email: string
  name: string
  gradeId: string | null
  gradeLevelName: string | null
  sectionId: string | null
  sectionName: string | null
  targetStudentEmail: string | null
  guardianName: string | null
  guardianEmail: string | null
  guardianPhone: string | null
  guardianNationality: string | null
  appliedAt: string
  decidedAt: string | null
}

export interface JoinRequestList {
  items: JoinRequestItem[]
  counts: { pending: number; approved: number; rejected: number }
}

export interface JoinApprovalResult {
  approved: Array<{
    id: string
    email: string
    name: string
    kind?: JoinRequestKind
    generatedPassword?: boolean
  }>
  failed: Array<{ id: string; reason: string }>
}

export function fetchSchoolByCode(code: string): Promise<SchoolByCode> {
  return api
    .get<SchoolByCode>(`/auth/school/${encodeURIComponent(code)}`)
    .then((res) => res.data)
}

export function signStudentUp(input: {
  schoolCode: string
  firstName: string
  lastName?: string
  email: string
  password: string
  guardianName?: string
  guardianEmail?: string
  guardianSsn?: string
  guardianPhone?: string
  guardianNationality?: string
}): Promise<StudentSignupResult> {
  return api
    .post<StudentSignupResult>("/auth/signup/student", input)
    .then((res) => res.data)
}

export function signupGuardian(input: {
  schoolCode: string
  name: string
  personalEmail: string
  password: string
  childSchoolEmail: string
  phone?: string
  nationality?: string
}): Promise<GuardianSignupResult> {
  return api
    .post<GuardianSignupResult>("/auth/signup/guardian", input)
    .then((res) => res.data)
}

export function getJoinRequests(
  params?: { status?: JoinRequestStatus; source?: JoinRequestSource },
): Promise<JoinRequestList> {
  return api
    .get<JoinRequestList>("/students/join-requests", { params })
    .then((res) => res.data)
}

export function approveJoinRequests(ids: string[]): Promise<JoinApprovalResult> {
  return api
    .post<JoinApprovalResult>("/students/join-requests/approve", { ids })
    .then((res) => res.data)
}

export function rejectJoinRequests(ids: string[]): Promise<{ rejected: number }> {
  return api
    .post<{ rejected: number }>("/students/join-requests/reject", { ids })
    .then((res) => res.data)
}

export function reopenJoinRequest(id: string): Promise<JoinRequestItem> {
  return api
    .post<JoinRequestItem>(`/students/join-requests/${id}/reopen`)
    .then((res) => res.data)
}

// ── Timetable ─────────────────────────────────────────────────────

export type DayOfWeek = components["schemas"]["TimetableSlotDto"]["dayOfWeek"]

export const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

export type TimetableSlot = components["schemas"]["TimetableSlotDto"]
export type TimetableSlotWithOffering = components["schemas"]["TimetableSlotWithOfferingDto"]
export type CreateTimetableSlotData = components["schemas"]["CreateTimetableSlotDto"]
export type UpdateTimetableSlotData = components["schemas"]["UpdateTimetableSlotDto"]
export type SlotConflict = NonNullable<components["schemas"]["CheckConflictResultDto"]["conflict"]>

export interface CourseOffering {
  id: string
  course: { id: string; name: string; colorTag: string | null }
  section: { id: string; name: string; gradeLevelId: string }
  teacher: { id: string; name: string }
}

export async function getOfferings(filters?: { teacherId?: string; courseId?: string }): Promise<CourseOffering[]> {
  const res = await api.get<CourseOffering[]>("/offerings", { params: filters })
  return res.data
}

export async function getTeacherOfferings(teacherId: string, courseId?: string): Promise<CourseOffering[]> {
  return getOfferings({ teacherId, ...(courseId ? { courseId } : {}) })
}

export async function getCourse(courseId: string): Promise<components["schemas"]["CourseDto"]> {
  const res = await api.get<components["schemas"]["CourseDto"]>(`/courses/${courseId}`)
  return res.data
}

export async function getAllTimetableSlots(): Promise<TimetableSlotWithOffering[]> {
  const res = await api.get<TimetableSlotWithOffering[]>("/timetable/slots")
  return res.data
}

export async function getSectionTimetable(sectionId: string): Promise<TimetableSlotWithOffering[]> {
  const res = await api.get<TimetableSlotWithOffering[]>(`/timetable/sections/${sectionId}`)
  return res.data
}

export async function getTeacherTimetable(teacherId: string): Promise<TimetableSlotWithOffering[]> {
  const res = await api.get<TimetableSlotWithOffering[]>(`/timetable/teachers/${teacherId}`)
  return res.data
}

export async function createTimetableSlot(data: CreateTimetableSlotData): Promise<TimetableSlot> {
  const res = await api.post<TimetableSlot>("/timetable/slots", data)
  return res.data
}

export async function updateTimetableSlot(
  id: string,
  data: UpdateTimetableSlotData,
): Promise<TimetableSlot> {
  const res = await api.patch<TimetableSlot>(`/timetable/slots/${id}`, data)
  return res.data
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  await api.delete(`/timetable/slots/${id}`)
}

export async function checkTimetableConflict(params: {
  courseOfferingId: string
  day: DayOfWeek
  start: string
  end: string
  excludeSlotId?: string
}): Promise<{ conflict: SlotConflict | null }> {
  const res = await api.get<{ conflict: SlotConflict | null }>(
    "/timetable/slots/check-conflict",
    { params },
  )
  return res.data
}

// ── Study Lab ──────────────────────────────────────────────────────

export type StudyLabKind = "PODCAST" | "SLIDES" | "STUDY_MATERIAL"
export type StudyLabMaterialKind =
  | "STUDY_GUIDE"
  | "FLASHCARDS"
  | "PRACTICE_QUESTIONS"
  | "CHEAT_SHEET"
export type StudyLabPreset =
  | "OVERVIEW"
  | "DEEP_DIVE"
  | "EXAM_CRAM"
  | "CASUAL"
  | "BREAKDOWN"
export type StudyLabStatus = "PROCESSING" | "READY" | "FAILED"

export interface StudyLabOffering {
  id: string
  courseName: string
  sectionName: string
  teacherName: string | null
  materialCount: number
}

export interface PodcastSegment {
  speaker: "HOST" | "GUEST"
  text: string
}

export interface PodcastScript {
  title: string
  description: string
  segments: PodcastSegment[]
  audioAvailable: boolean
}

export interface ChartVisual {
  kind: "bar" | "line" | "pie" | "area"
  title?: string
  categories: string[]
  series: { label: string; values: number[] }[]
  xLabel?: string
  yLabel?: string
}

export interface FlowVisual {
  kind: "flow"
  title?: string
  steps: { label: string; detail?: string }[]
}

export interface TimelineVisual {
  kind: "timeline"
  title?: string
  events: { label: string; detail?: string }[]
}

export interface ComparisonVisual {
  kind: "comparison"
  title?: string
  leftTitle: string
  rightTitle: string
  rows: { left: string; right: string }[]
}

export interface ConceptMapVisual {
  kind: "concept_map"
  title?: string
  nodes: { id: string; label: string }[]
  edges: { from: string; to: string; label?: string }[]
}

export type SlideVisual =
  | ChartVisual
  | FlowVisual
  | TimelineVisual
  | ComparisonVisual
  | ConceptMapVisual

export type SlideBlock =
  | { type: "heading"; text: string; level: "h1" | "h2" | "h3" }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "callout"; text: string; tone: "info" | "tip" | "warn" }
  | { type: "code"; code: string; language?: string }
  | { type: "stat"; value: string; label: string }
  | {
      type: "columns"
      cols: { heading: string; items: string[] }[]
    }

export interface DeckTheme {
  background: "light" | "dark" | "gradient"
  accent?: string
  motion: "fade" | "rise" | "slide" | "scale"
}

export interface Slide {
  layout: "title" | "bullets" | "split" | "statement" | "summary"
  eyebrow?: string
  title?: string
  blocks: SlideBlock[]
  note?: string
  visual?: SlideVisual
  /** legacy aliases — normalized away by normalizeDeck */
  bullets?: string[]
  code?: string
  code_snippet?: string
  speakerNote?: string
  speaker_note?: string
}

export interface Deck {
  title: string
  theme?: DeckTheme
  slides: Slide[]
}

export interface StudyGuideSection {
  heading: string
  content: string
}

export interface StudyGuide {
  title: string
  summary: string
  sections: StudyGuideSection[]
}

export interface Flashcard {
  front: string
  back: string
}

export interface Flashcards {
  title: string
  cards: Flashcard[]
}

export interface PracticeQuestion {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface PracticeSet {
  title: string
  questions: PracticeQuestion[]
}

export interface CheatSheetSection {
  heading: string
  bullets: string[]
}

export interface CheatSheet {
  title: string
  sections: CheatSheetSection[]
}

export interface StudyGeneration {
  id: string
  kind: StudyLabKind
  materialKind: StudyLabMaterialKind | null
  preset: StudyLabPreset | null
  topic: string
  status: StudyLabStatus
  stage: string
  error: string | null
  recommendedForAnalysisId: string | null
  createdAt: string
  completedAt: string | null
  payload:
    | PodcastScript
    | Deck
    | StudyGuide
    | Flashcards
    | PracticeSet
    | CheatSheet
    | null
  audioUrl: string | null
  fileUrl: string | null
}

export interface GenerateStudyLabInput {
  courseOfferingId: string
  kind: StudyLabKind
  materialKind?: StudyLabMaterialKind
  preset?: StudyLabPreset
  topic: string
}

export async function getStudyLabOfferings(): Promise<StudyLabOffering[]> {
  const res = await api.get<{ offerings: StudyLabOffering[] }>(
    "/assistant/study-lab/offerings",
  )
  return res.data.offerings
}

export async function generateStudyLab(
  input: GenerateStudyLabInput,
): Promise<{ generationId: string; status: string }> {
  const res = await api.post("/assistant/study-lab/generate", input)
  return res.data
}

export async function getStudyLabHistory(
  courseOfferingId?: string,
): Promise<StudyGeneration[]> {
  const res = await api.get<{ generations: StudyGeneration[] }>(
    "/assistant/study-lab/history",
    { params: courseOfferingId ? { courseOfferingId } : undefined },
  )
  return res.data.generations
}

export async function getStudyLabGeneration(
  generationId: string,
): Promise<StudyGeneration> {
  const res = await api.get<{ generation: StudyGeneration }>(
    `/assistant/study-lab/${generationId}`,
  )
  return res.data.generation
}

export async function deleteStudyLabGeneration(
  generationId: string,
): Promise<void> {
  await api.delete(`/assistant/study-lab/${generationId}`)
}

export function studyLabFileUrl(generationId: string): string {
  return `${API_URL}/assistant/study-lab/${generationId}/download`
}

export async function fetchFileBlob(url: string): Promise<Blob> {
  const res = await api.get<Blob>(url, { responseType: "blob" })
  return res.data
}

// ─── Lab Simulations (AI-generated Matter.js sandbox labs) ──
export type LabStatus =
  | "GENERATING"
  | "AI_REVIEW_FAILED"
  | "PENDING_TEACHER_REVIEW"
  | "PUBLISHED"
  | "REJECTED"

export interface LabReviewFlags {
  flags: string[]
  reasoning: string
}

export interface Lab {
  id: string
  courseOfferingId: string
  topic: string
  status: LabStatus
  generatedCode: string | null
  reviewApproved: boolean | null
  reviewFlags: LabReviewFlags | null
  teacherNotes: string | null
  publishedAt: string | null
  createdAt: string
}

export interface GenerateLabInput {
  courseOfferingId: string
  topic: string
}

export interface GenerateLabResponse {
  grounded: boolean
  labId: string | null
  status: LabStatus | null
  message: string | null
  reviewApproved: boolean | null
  reviewFlags: LabReviewFlags | null
}

export async function generateLab(input: GenerateLabInput): Promise<GenerateLabResponse> {
  const res = await api.post<GenerateLabResponse>("/labs/generate", input)
  return res.data
}

export async function getLabs(courseOfferingId?: string): Promise<Lab[]> {
  const res = await api.get<Lab[]>("/labs", {
    params: courseOfferingId ? { courseOfferingId } : undefined,
  })
  return res.data
}

export async function getLab(id: string): Promise<Lab> {
  const res = await api.get<Lab>(`/labs/${id}`)
  return res.data
}

export async function publishLab(id: string): Promise<Lab> {
  const res = await api.post<Lab>(`/labs/${id}/publish`)
  return res.data
}

export async function rejectLab(id: string, notes?: string): Promise<Lab> {
  const res = await api.post<Lab>(`/labs/${id}/reject`, { notes })
  return res.data
}

// ─── Meetings ───────────────────────────────────────────
export type MeetingType = "CLASS" | "AD_HOC"
export type MeetingStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELED"
export type TranscriptStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED"

export interface MeetingSummary {
  id: string
  title: string
  type: MeetingType
  status: MeetingStatus
  transcriptStatus: TranscriptStatus
  courseOfferingId: string | null
  courseName: string | null
  sectionName: string | null
  scheduledStart: string
  scheduledEnd: string
  recordingEnabled: boolean
  recordingUrl: string | null
  createdBy: string
  hostName: string
  participantCount: number
  isHost: boolean
  canJoin: boolean
}

export interface MeetingDetail extends MeetingSummary {
  participants: { userId: string; name: string }[]
  attendance: { userId: string; name: string; joinedAt: string; leftAt: string | null }[]
}

export interface MeetingMessage {
  id: string
  meetingId: string
  userId: string
  name: string
  text: string
  createdAt: string
}

export interface TranscriptSegment {
  startMs: number
  endMs: number
  text: string
}

export type StruggleSignalStatus = 'PENDING' | 'SENT' | 'DISMISSED'

export interface StruggleSignal {
  id: string
  studentId: string
  studentName: string | null
  concept: string
  explanation: string
  status: StruggleSignalStatus
  classWide: boolean
  quizId: string | null
  interactionId: string | null
  createdAt: string
}

export interface ClassWideCluster {
  concept: string
  studentCount: number
  signals: StruggleSignal[]
}

export interface StruggleSignalsForMeeting {
  pending: {
    classWide: ClassWideCluster[]
    individual: StruggleSignal[]
  }
  history: StruggleSignal[]
}

export interface MeetingTranscript {
  status: TranscriptStatus
  segments: TranscriptSegment[]
}

export interface JoinMeetingResponse {
  token: string
  url: string
  roomName: string
  identity: string
}

export interface CreateMeetingInput {
  title: string
  type: MeetingType
  courseOfferingId?: string
  scheduledStart: string
  scheduledEnd: string
  recordingEnabled?: boolean
  participantIds?: string[]
}

export async function listMeetings(scope: "upcoming" | "past" | "all" = "all"): Promise<{ meetings: MeetingSummary[] }> {
  const res = await api.get<{ meetings: MeetingSummary[] }>("/meetings", { params: { scope } })
  return res.data
}

export async function getMeeting(id: string): Promise<MeetingDetail> {
  const res = await api.get<MeetingDetail>(`/meetings/${id}`)
  return res.data
}

export async function createMeeting(input: CreateMeetingInput): Promise<MeetingDetail> {
  const res = await api.post<MeetingDetail>("/meetings", input)
  return res.data
}

export async function joinMeeting(id: string): Promise<JoinMeetingResponse> {
  const res = await api.post<JoinMeetingResponse>(`/meetings/${id}/join`)
  return res.data
}

export async function leaveMeeting(id: string): Promise<{ leftAt: string }> {
  const res = await api.post<{ leftAt: string }>(`/meetings/${id}/leave`)
  return res.data
}

export async function endMeeting(id: string): Promise<MeetingDetail> {
  const res = await api.patch<MeetingDetail>(`/meetings/${id}/end`)
  return res.data
}

export async function setMeetingRecording(id: string, enabled: boolean): Promise<MeetingDetail> {
  const res = await api.patch<MeetingDetail>(`/meetings/${id}/recording`, { enabled })
  return res.data
}

export async function getMeetingRecording(id: string): Promise<{ recordingUrl: string }> {
  const res = await api.get<{ recordingUrl: string }>(`/meetings/${id}/recording`)
  return res.data
}

export async function getMeetingMessages(id: string): Promise<{ messages: MeetingMessage[] }> {
  const res = await api.get<{ messages: MeetingMessage[] }>(`/meetings/${id}/messages`)
  return res.data
}

export async function sendMeetingMessage(id: string, text: string): Promise<MeetingMessage> {
  const res = await api.post<MeetingMessage>(`/meetings/${id}/messages`, { text })
  return res.data
}

export async function getMeetingTranscript(id: string): Promise<MeetingTranscript> {
  const res = await api.get<MeetingTranscript>(`/meetings/${id}/transcript`)
  return res.data
}

export async function getStruggleSignalsForMeeting(
  meetingId: string,
): Promise<StruggleSignalsForMeeting> {
  const res = await api.get<StruggleSignalsForMeeting>(
    `/meetings/${meetingId}/struggle-signals`,
  )
  return res.data
}

export async function sendStruggleSignal(
  signalId: string,
): Promise<{ id: string; status: 'SENT'; quizId: string }> {
  const res = await api.post<{ id: string; status: 'SENT'; quizId: string }>(
    `/struggle-signals/${signalId}/send`,
  )
  return res.data
}

export async function dismissStruggleSignal(
  signalId: string,
): Promise<{ id: string; status: 'DISMISSED' }> {
  const res = await api.post<{ id: string; status: 'DISMISSED' }>(
    `/struggle-signals/${signalId}/dismiss`,
  )
  return res.data
}

// ── Student CSV migration ─────────────────────────────────────────

export type MigrateField =
  | 'STUDENT_NAME'
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'EMAIL'
  | 'GRADE_LEVEL'
  | 'SECTION'
  | 'GUARDIAN_NAME'
  | 'GUARDIAN_EMAIL'
  | 'GUARDIAN_SSN'
  | 'GUARDIAN_PHONE'
  | 'GUARDIAN_NATIONALITY'
  | 'UNMAPPED'

export const IMPORTABLE_FIELDS: MigrateField[] = [
  'STUDENT_NAME',
  'FIRST_NAME',
  'LAST_NAME',
  'EMAIL',
  'GRADE_LEVEL',
  'SECTION',
  'GUARDIAN_NAME',
  'GUARDIAN_EMAIL',
  'GUARDIAN_SSN',
  'GUARDIAN_PHONE',
  'GUARDIAN_NATIONALITY',
]

export interface MigrateColumn {
  sourceColumn: string
  sampleValues: string[]
  suggestedField: MigrateField
  confidence: number
  masked: boolean
}

export interface MigrateAnalyzeResult {
  columns: MigrateColumn[]
  totalRows: number
  maskedColumns: string[]
}

export interface ImportFollowUpRow {
  row: number
  reason: string
}

export interface UnassignedImportRow {
  row: number
  studentId: string
  reason: string
}

export interface UnmatchedImportRow {
  row: number
  providedValue: string
}

export interface MigrateImportResult {
  imported: number
  unassignedGradeOrSection: UnassignedImportRow[]
  needsFollowUp: ImportFollowUpRow[]
  unmatchedSectionsOrGrades: UnmatchedImportRow[]
}

export interface ImportFieldMapping {
  sourceColumn: string
  mappedField: MigrateField
}

export async function analyzeMigrationCsv(
  csv: string,
): Promise<MigrateAnalyzeResult> {
  const res = await api.post<MigrateAnalyzeResult>('/migration/csv/analyze', {
    csv,
  })
  return res.data
}

export async function analyzeMigrationPasted(
  text: string,
): Promise<MigrateAnalyzeResult> {
  const res = await api.post<MigrateAnalyzeResult>(
    '/migration/csv/analyze-pasted',
    { text },
  )
  return res.data
}

export async function importStudentsCsv(
  csv: string,
  mapping: ImportFieldMapping[],
): Promise<MigrateImportResult> {
  const res = await api.post<MigrateImportResult>('/migration/csv/import', {
    csv,
    mapping,
  })
  return res.data
}

export async function fetchImportTemplate(): Promise<string> {
  const res = await api.get('/migration/csv/template', {
    responseType: 'blob',
  })
  return res.data.text()
}

export interface CsvAnalyzeResult {
  columns: Array<{
    sourceColumn: string
    sampleValues: string[]
    suggestedField: "STUDENT_NAME" | "EMAIL" | "GRADE_LEVEL" | "SECTION" | "UNMAPPED"
    confidence: number
    masked: boolean
  }>
  totalRows: number
  maskedColumns: string[]
}

export async function analyzeCsv(csv: string): Promise<CsvAnalyzeResult> {
  const res = await api.post<CsvAnalyzeResult>("/migration/csv/analyze", { csv })
  return res.data
}

export interface CsvImportRowNote {
  row: number
  reason: string
}

export interface CsvUnassignedRow {
  row: number
  studentId?: string
  reason: string
}

export interface CsvUnmatchedRow {
  row: number
  providedValue: string
}

export interface CsvImportResult {
  imported: number
  autoApproved: number
  queued: number
  unassignedGradeOrSection: CsvUnassignedRow[]
  needsFollowUp: CsvImportRowNote[]
  unmatchedSectionsOrGrades: CsvUnmatchedRow[]
}

export async function importCsv(
  csv: string,
  mapping: Array<{ sourceColumn: string; mappedField: string }>,
): Promise<CsvImportResult> {
  const res = await api.post<CsvImportResult>("/migration/csv/import", { csv, mapping })
  return res.data
}

export interface UnassignedStudent {
  id: string
  name: string
  email: string
  gradeId: string | null
  grade: { id: string; level: number; name: string | null } | null
  enrollments: Array<{
    sectionId: string
    section: { id: string; name: string } | null
  }>
  createdAt: string
}

export async function getUnassignedStudents(): Promise<UnassignedStudent[]> {
  const res = await api.get<UnassignedStudent[]>('/students/unassigned')
  return res.data
}
