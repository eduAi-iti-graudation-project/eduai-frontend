import { createContext } from "react"
import type { components } from "@/types/api-schema"
import { useMutation } from "@tanstack/react-query"

type UserDto = components["schemas"]["UserDto"]
type SignupDto = components["schemas"]["SignupDto"]
type LoginDto = components["schemas"]["LoginDto"]

export interface AuthContextType {
  user: UserDto | null
  isLoading: boolean
  isAuthenticated: boolean
  signup: ReturnType<typeof useMutation<UserDto, Error, SignupDto>>
  login: ReturnType<typeof useMutation<UserDto, Error, LoginDto>>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
