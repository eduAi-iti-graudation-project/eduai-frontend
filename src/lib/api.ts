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

export async function getSubmissions(): Promise<SubmissionEnriched[]> {
  return request("/submissions")
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
