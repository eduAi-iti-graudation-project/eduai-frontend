import { useEffect, useState, type ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { SESSION_EXPIRED_EVENT } from "@/lib/api"
import { AuthContext, type AuthContextType } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
 const queryClient = useQueryClient()
 const [token, setToken] = useState<string | null>(() => api.getStoredToken())

 useEffect(() => {
  const handleSessionExpired = () => {
   api.clearToken()
   setToken(null)
   queryClient.setQueryData(["auth", "me"], null)
   queryClient.clear()
  }
  window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
 }, [queryClient])

 const { data: user, isLoading } = useQuery({
  queryKey: ["auth", "me"],
  queryFn: api.getMe,
  enabled: !!token,
  retry: false,
 })

 const signupMutation = useMutation({
  mutationFn: api.signup,
  onSuccess: async (data) => {
   if ("status" in data) return
   await queryClient.cancelQueries({ queryKey: ["auth", "me"] })
   queryClient.setQueryData(["auth", "me"], data)
   setToken(api.getStoredToken())
  },
 })

 const loginMutation = useMutation({
  mutationFn: api.login,
  onSuccess: async (data) => {
   await queryClient.cancelQueries({ queryKey: ["auth", "me"] })
   queryClient.setQueryData(["auth", "me"], data)
   setToken(api.getStoredToken())
  },
 })

 const logout = () => {
  api.clearToken()
  setToken(null)
  queryClient.setQueryData(["auth", "me"], null)
  queryClient.clear()
 }

 const value: AuthContextType = {
  user: user ?? null,
  isLoading: token ? isLoading : false,
  isAuthenticated: !!user,
  signup: signupMutation,
  login: loginMutation,
  logout,
 }

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
