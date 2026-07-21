import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage"
import { StudentPortalPage } from "./pages/StudentPortalPage"
import { ClassesPage } from "./pages/teacher/ClassesPage"
import { ClassDetailPage } from "./pages/teacher/ClassDetailPage"
import { InstructorAssignmentForm } from "./components/InstructorAssignmentForm"
import { RubricsPage } from "./pages/teacher/RubricsPage"
import { SubmissionsPage } from "./pages/teacher/SubmissionsPage"
import { AlertsPage } from "./pages/teacher/AlertsPage"
import { AssistantPage } from "./pages/teacher/AssistantPage"
import { SettingsPage } from "./pages/teacher/SettingsPage"
import { SupportPage } from "./pages/teacher/SupportPage"
import { useAuth } from "./providers/use-auth"

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

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role && TEACHER_ROLES.has(user.role)) return <>{children}</>
  return <Navigate to="/" replace />
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role && STUDENT_ROLES.has(user.role)) return <>{children}</>
  return <Navigate to="/" replace />
}

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated && user?.role) {
    if (TEACHER_ROLES.has(user.role)) return <Navigate to="/dashboard" replace />
    if (STUDENT_ROLES.has(user.role)) return <Navigate to="/student-portal" replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Teacher Portal */}
        <Route path="/dashboard" element={<TeacherRoute><TeacherDashboardPage /></TeacherRoute>} />
        <Route path="/classes" element={<TeacherRoute><ClassesPage /></TeacherRoute>} />
        <Route path="/classes/:id" element={<TeacherRoute><ClassDetailPage /></TeacherRoute>} />
        <Route path="/assignments/new" element={<TeacherRoute><InstructorAssignmentForm /></TeacherRoute>} />
        <Route path="/rubrics" element={<TeacherRoute><RubricsPage /></TeacherRoute>} />
        <Route path="/submissions" element={<TeacherRoute><SubmissionsPage /></TeacherRoute>} />
        <Route path="/alerts" element={<TeacherRoute><AlertsPage /></TeacherRoute>} />
        <Route path="/assistant" element={<TeacherRoute><AssistantPage /></TeacherRoute>} />
        <Route path="/settings" element={<TeacherRoute><SettingsPage /></TeacherRoute>} />
        <Route path="/support" element={<TeacherRoute><SupportPage /></TeacherRoute>} />

        {/* Student Portal */}
        <Route path="/student-portal" element={<StudentRoute><StudentPortalPage /></StudentRoute>} />
        <Route path="/student-portal/*" element={<StudentRoute><StudentPortalPage /></StudentRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
