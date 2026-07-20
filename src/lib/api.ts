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

interface LoginResponse extends UserDto {
  access_token?: string
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
    credentials: "include",
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

function extractUser(raw: LoginResponse): UserDto {
  if (raw.access_token) {
    storeToken(raw.access_token)
  }
  return { id: raw.id, email: raw.email, name: raw.name, role: raw.role }
}

export async function signup(data: SignupDto): Promise<UserDto> {
  const raw = await request<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return extractUser(raw)
}

export async function login(data: LoginDto): Promise<UserDto> {
  const raw = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return extractUser(raw)
}

export async function getMe(): Promise<UserDto> {
  return request<UserDto>("/auth/me")
}
