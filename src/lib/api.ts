import type { components } from "@/types/api-schema"

type SignupDto = components["schemas"]["SignupDto"]
type LoginDto = components["schemas"]["LoginDto"]
type UserDto = components["schemas"]["UserDto"]

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
const TOKEN_KEY = "eduai_token"

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface LoginResponse {
  accessToken: string
  user: UserDto
}

interface SignupResponse {
  accessToken: string
  user: UserDto
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

export async function signup(data: SignupDto): Promise<UserDto> {
  const raw = await request<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
  storeToken(raw.accessToken)
  return raw.user
}

export async function login(data: LoginDto): Promise<UserDto> {
  const raw = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
  storeToken(raw.accessToken)
  return raw.user
}

export async function getMe(): Promise<UserDto> {
  return request<UserDto>("/auth/me")
}

// Dashboard data

export interface ClassEnriched {
  id: string
  name: string
  description: string | null
  teacherId: string
  teacher: {
    id: string
    email: string
    name: string
    role: string
  }
  enrollments: { id: string; classId: string; studentId: string; createdAt: string }[]
  createdAt: string
  updatedAt: string
}

export interface SubmissionEnriched {
  id: string
  assignmentId: string
  studentId: string
  status: "SUBMITTED" | "GRADING_IN_PROGRESS" | "REVIEW_READY" | "CONFIRMED"
  student?: { id: string; email: string; name: string; role: string }
  scores?: {
    id: string
    pointsAwarded: number
    aiFeedback: string | null
    teacherNotes: string | null
    isConfirmed: boolean
    criteria: { id: string; description: string; maxPoints: number }
  }[]
  createdAt: string
  updatedAt: string
}

export async function getClasses(): Promise<ClassEnriched[]> {
  return request("/classes")
}

export async function getAssignments(classId?: string): Promise<components["schemas"]["AssignmentDto"][]> {
  const params = classId ? `?classId=${encodeURIComponent(classId)}` : ""
  return request(`/assignments${params}`)
}

export async function getSubmissions(status?: string, assignmentId?: string): Promise<SubmissionEnriched[]> {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (assignmentId) params.set("assignmentId", assignmentId)
  const qs = params.toString()
  return request(`/submissions${qs ? `?${qs}` : ""}`)
}

export async function getSubmission(id: string): Promise<SubmissionEnriched & { assignment?: components["schemas"]["AssignmentDto"]; chunks?: { id: string; content: string }[] }> {
  return request(`/submissions/${id}`)
}

export async function getAlerts(status?: string): Promise<components["schemas"]["AlertDto"][]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ""
  return request(`/alerts${params}`)
}

// ── Class CRUD ─────────────────────────────────────────────────

export interface ClassDetailEnriched extends ClassEnriched {
  enrollments: ({
    id: string
    classId: string
    studentId: string
    createdAt: string
    student: { id: string; email: string; name: string; role: string }
  })[]
}

export async function getClass(id: string): Promise<ClassDetailEnriched> {
  return request(`/classes/${id}`)
}

export async function createClass(data: components["schemas"]["CreateClassDto"]): Promise<components["schemas"]["ClassDto"]> {
  return request("/classes", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateClass(id: string, data: components["schemas"]["UpdateClassDto"]): Promise<components["schemas"]["ClassDto"]> {
  return request(`/classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteClass(id: string): Promise<void> {
  return request(`/classes/${id}`, { method: "DELETE" })
}

// ── Enrollments ─────────────────────────────────────────────────

export async function addEnrollment(classId: string, studentId: string): Promise<unknown> {
  return request(`/classes/${classId}/enrollments`, {
    method: "POST",
    body: JSON.stringify({ studentId }),
  })
}

export async function removeEnrollment(classId: string, studentId: string): Promise<void> {
  return request(`/classes/${classId}/enrollments/${studentId}`, { method: "DELETE" })
}

// ── Assignment CRUD ─────────────────────────────────────────────

export async function createAssignment(data: components["schemas"]["CreateAssignmentDto"]): Promise<components["schemas"]["AssignmentDto"]> {
  return request("/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateAssignment(id: string, data: components["schemas"]["UpdateAssignmentDto"]): Promise<components["schemas"]["AssignmentDto"]> {
  return request(`/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteAssignment(id: string): Promise<void> {
  return request(`/assignments/${id}`, { method: "DELETE" })
}

// ── Assistant Chat ──────────────────────────────────────────────

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

export async function sendChatMessage(
  classId: string,
  messages: ChatMessage[],
  newMessage: string,
): Promise<ChatResponse> {
  return request("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ classId, messages, newMessage }),
  })
}

// ── Rubrics ─────────────────────────────────────────────────────

export interface RubricCriterion {
  id: string
  description: string
  maxPoints: number
  rubricId: string
  embedding?: number[] | null
}

export interface RubricEnriched {
  id: string
  title: string
  assignmentId: string
  isConfirmed: boolean
  criteria: RubricCriterion[]
  createdAt: string
  updatedAt: string
}

export async function getRubrics(assignmentId?: string): Promise<RubricEnriched[]> {
  const params = assignmentId ? `?assignmentId=${encodeURIComponent(assignmentId)}` : ""
  return request(`/rubrics${params}`)
}

export async function getRubric(id: string): Promise<RubricEnriched> {
  return request(`/rubrics/${id}`)
}

export async function createRubric(data: components["schemas"]["CreateRubricDto"]): Promise<RubricEnriched> {
  return request("/rubrics", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function createRubricFromPdf(formData: FormData): Promise<{ title?: string; criteria: { description: string; maxPoints: number }[] }> {
  const token = getStoredToken()
  const res = await fetch(`${API_URL}/rubrics/import-pdf`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Import failed" }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function confirmRubric(id: string): Promise<RubricEnriched> {
  return request(`/rubrics/${id}/confirm`, { method: "PATCH" })
}

// ── Grading ─────────────────────────────────────────────────────

export async function gradeSubmission(submissionId: string): Promise<unknown> {
  return request(`/grades/submissions/${submissionId}/grade`, { method: "POST" })
}

export async function confirmGrade(id: string, data: components["schemas"]["ConfirmGradeDto"]): Promise<unknown> {
  return request(`/grades/${id}/confirm`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// ── Materials ───────────────────────────────────────────────────

export async function uploadMaterial(title: string, classId: string, file: File): Promise<unknown> {
  const token = getStoredToken()
  const fd = new FormData()
  fd.append("file", file)
  fd.append("title", title)
  fd.append("classId", classId)
  const res = await fetch(`${API_URL}/materials/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}
