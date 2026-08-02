import { createBrowserRouter, Outlet } from "react-router-dom"
import { TeacherLayout } from "./components/layout/TeacherLayout"
import { StudentLayout } from "./components/layout/StudentLayout"
import { TeacherRoute, StudentRoute, GuardianRoute, AdminRoute, GuestRoute, RootRedirect } from "./components/auth/RouteGuards"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage"
import { ClassesPage } from "./pages/teacher/ClassesPage"
import { ClassDetailPage } from "./pages/teacher/ClassDetailPage"
import { InstructorAssignmentForm } from "./components/InstructorAssignmentForm"
import { AssignmentDetailPage } from "./pages/teacher/AssignmentDetailPage"
import { RubricsPage } from "./pages/teacher/RubricsPage"
import { SubmissionsPage } from "./pages/teacher/SubmissionsPage"
import { SubmissionDetailPage } from "./pages/teacher/SubmissionDetailPage"
import { AlertsPage } from "./pages/teacher/AlertsPage"
import { AssistantPage } from "./pages/teacher/AssistantPage"
import { SettingsPage } from "./pages/teacher/SettingsPage"
import { SupportPage } from "./pages/teacher/SupportPage"
import { NotificationsListPage } from "./pages/teacher/NotificationsListPage"
import { StudentDetailPage } from "./pages/teacher/StudentDetailPage"
import { AttendanceImportPage } from "./pages/teacher/AttendanceImportPage"
import { ReportsPage } from "./pages/ReportsPage"
import { StudentDashboardPage } from "./pages/student/StudentDashboardPage"
import { StudentAssignmentsPage } from "./pages/student/StudentAssignmentsPage"
import { SubmissionStatusPage } from "./pages/student/SubmissionStatusPage"
import { MyGradesPage } from "./pages/student/MyGradesPage"
import { MyAttendancePage } from "./pages/student/MyAttendancePage"
import { GuardianDashboardPage } from "./pages/guardian/GuardianDashboardPage"
import { ChildDetailPage } from "./pages/guardian/ChildDetailPage"
import { AdminLayout } from "./components/layout/AdminLayout"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { GradeManagementPage } from "./pages/admin/GradeManagementPage"
import { StudentManagementPage } from "./pages/admin/StudentManagementPage"
import { StudentGradesPage } from "./pages/admin/StudentGradesPage"
import { AttendancePage } from "./pages/admin/AttendancePage"
import { NotFoundPage } from "./pages/NotFoundPage"

export const TEACHER_ROUTES = [
  { path: "/dashboard", element: <TeacherDashboardPage /> },
  { path: "/classes", element: <ClassesPage /> },
  { path: "/classes/:id", element: <ClassDetailPage /> },
  { path: "/assignments/new", element: <InstructorAssignmentForm /> },
  { path: "/assignments/:id", element: <AssignmentDetailPage /> },
  { path: "/students/:id", element: <StudentDetailPage /> },
  { path: "/rubrics", element: <RubricsPage /> },
  { path: "/rubrics/new", element: <RubricsPage /> },
  { path: "/submissions", element: <SubmissionsPage /> },
  { path: "/submissions/:id", element: <SubmissionDetailPage /> },
  { path: "/alerts", element: <AlertsPage /> },
  { path: "/assistant", element: <AssistantPage /> },
  { path: "/notifications", element: <NotificationsListPage /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/attendance/import", element: <AttendanceImportPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/support", element: <SupportPage /> },
]

export const STUDENT_ROUTES = [
  { path: "/student", element: <StudentDashboardPage /> },
  { path: "/student/assignments", element: <StudentAssignmentsPage /> },
  { path: "/student/submissions/:id", element: <SubmissionStatusPage /> },
  { path: "/student/grades", element: <MyGradesPage /> },
  { path: "/student/attendance", element: <MyAttendancePage /> },
  { path: "/student/notifications", element: <NotificationsListPage /> },
]

export function teacherRoutes() {
  return {
    element: <TeacherRoute><TeacherLayout /></TeacherRoute>,
    children: TEACHER_ROUTES,
  }
}

export function studentRoutes() {
  return {
    element: <StudentRoute><StudentLayout /></StudentRoute>,
    children: STUDENT_ROUTES,
  }
}

export function guardianRoutes() {
  return {
    path: "/guardian",
    element: <GuardianRoute><div className="min-h-screen bg-surface"><div className="flex-1 p-xl"><Outlet /></div></div></GuardianRoute>,
    children: [
      { index: true, element: <GuardianDashboardPage /> },
      { path: "children/:id", element: <ChildDetailPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "notifications", element: <NotificationsListPage /> },
    ],
  }
}

export function adminRoutes() {
  return {
    path: "/admin",
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "grades", element: <GradeManagementPage /> },
      { path: "students", element: <StudentManagementPage /> },
      { path: "student-grades", element: <StudentGradesPage /> },
      { path: "attendance", element: <AttendancePage /> },
    ],
  }
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <GuestRoute><LoginPage /></GuestRoute>,
  },
  {
    path: "/signup",
    element: <GuestRoute><SignupPage /></GuestRoute>,
  },
  teacherRoutes(),
  studentRoutes(),
  guardianRoutes(),
  adminRoutes(),
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
