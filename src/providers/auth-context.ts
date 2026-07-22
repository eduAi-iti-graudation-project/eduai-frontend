import { createContext } from "react"
import { useMutation } from "@tanstack/react-query"
import type { User } from "@/lib/api"
import type { components } from "@/types/api-schema"

type SignupDto = components["schemas"]["SignupDto"]
type LoginDto = components["schemas"]["LoginDto"]

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signup: ReturnType<typeof useMutation<User, Error, SignupDto>>
  login: ReturnType<typeof useMutation<User, Error, LoginDto>>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
