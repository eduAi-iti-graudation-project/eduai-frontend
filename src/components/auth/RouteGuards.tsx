import { Navigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"

const TEACHER_ROLES = new Set(["TEACHER", "ADMIN"])
const STUDENT_ROLES = new Set(["STUDENT", "GUARDIAN"])

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </div>
    </div>
  )
}

export function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role && TEACHER_ROLES.has(user.role)) return <>{children}</>
  return <Navigate to="/" replace />
}

export function StudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role && STUDENT_ROLES.has(user.role)) return <>{children}</>
  return <Navigate to="/" replace />
}

export function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated && user?.role) {
    if (TEACHER_ROLES.has(user.role)) return <Navigate to="/dashboard" replace />
    if (STUDENT_ROLES.has(user.role)) return <Navigate to="/student-portal" replace />
  }
  return <Navigate to="/login" replace />
}
