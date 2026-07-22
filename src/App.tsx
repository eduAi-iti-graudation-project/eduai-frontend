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
import { NotificationsListPage } from "./pages/teacher/NotificationsListPage"
import { TeacherLayout } from "./components/layout/TeacherLayout"
import { TeacherRoute, StudentRoute, RootRedirect } from "./components/auth/RouteGuards"

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
        <Route path="/rubrics/new" element={<TeacherRoute><RubricsPage /></TeacherRoute>} />
        <Route path="/submissions" element={<TeacherRoute><SubmissionsPage /></TeacherRoute>} />
        <Route path="/submissions/:id" element={<TeacherRoute><SubmissionsPage /></TeacherRoute>} />
        <Route path="/alerts" element={<TeacherRoute><AlertsPage /></TeacherRoute>} />
        <Route path="/assistant" element={<TeacherRoute><AssistantPage /></TeacherRoute>} />

        {/* Teacher Layout Routes */}
        <Route element={<TeacherRoute><TeacherLayout /></TeacherRoute>}>
          <Route path="/notifications" element={<NotificationsListPage />} />
        </Route>
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
