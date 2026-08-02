import { createBrowserRouter, Outlet } from "react-router-dom"
import { TeacherLayout } from "./components/layout/TeacherLayout"
import { StudentLayout } from "./components/layout/StudentLayout"
import { TeacherRoute, StudentRoute, GuardianRoute, AdminRoute, RootRedirect } from "./components/auth/RouteGuards"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage"
import { GradeListPage } from "./pages/teacher/GradeListPage"
import { ClassesInGradePage } from "./pages/teacher/ClassesInGradePage"
import { ClassDetailPage } from "./pages/teacher/ClassDetailPage"
import { InstructorAssignmentForm } from "./components/InstructorAssignmentForm"
import { AssignmentDetailPage } from "./pages/teacher/AssignmentDetailPage"
import { RubricsPage } from "./pages/teacher/RubricsPage"
import { RubricConfirmPage } from "./pages/teacher/RubricConfirmPage"
import { SubmissionsPage } from "./pages/teacher/SubmissionsPage"
import { SubmissionDetailPage } from "./pages/teacher/SubmissionDetailPage"
import { AlertsPage } from "./pages/teacher/AlertsPage"
import { AlertDetailPage } from "./pages/teacher/AlertDetailPage"
import { GuardianAlertDetailPage } from "./pages/guardian/GuardianAlertDetailPage"
import { AdminAlertsPage } from "./pages/admin/AdminAlertsPage"
import { AssistantPage } from "./pages/teacher/AssistantPage"
import { SettingsPage } from "./pages/teacher/SettingsPage"
import { SupportPage } from "./pages/teacher/SupportPage"
import { NotificationsListPage } from "./pages/teacher/NotificationsListPage"
import { StudentDetailPage } from "./pages/teacher/StudentDetailPage"
import { AttendanceImportPage } from "./pages/teacher/AttendanceImportPage"
import { ReportsPage } from "./pages/ReportsPage"
import { StudentDashboardPage } from "./pages/student/StudentDashboardPage"
import { StudentAssignmentsPage } from "./pages/student/StudentAssignmentsPage"
import { AvailableClassesPage } from "./pages/student/AvailableClassesPage"
import { SubmissionStatusPage } from "./pages/student/SubmissionStatusPage"
import { AvailableClassesPage } from "./pages/student/AvailableClassesPage"
import { StudentClassGradesPage } from "./pages/student/StudentClassGradesPage"
import { StudentAssignmentGradePage } from "./pages/student/StudentAssignmentGradePage"
import { HomeworkHelpPage } from "./pages/student/HomeworkHelpPage"
import { HomeworkHelpHistoryPage } from "./pages/student/HomeworkHelpHistoryPage"
import { StudentQuizzesPage } from "./pages/student/StudentQuizzesPage"
import { QuizTakePage } from "./pages/student/QuizTakePage"
import { StudentQuizResultPage } from "./pages/student/StudentQuizResultPage"
import { QuizzesPage } from "./pages/teacher/QuizzesPage"
import { QuizEditorPage } from "./pages/teacher/QuizEditorPage"
import { QuizAttemptsListPage } from "./pages/teacher/QuizAttemptsListPage"
import { QuizAttemptDetailPage } from "./pages/teacher/QuizAttemptDetailPage"
import { MyGradesPage } from "./pages/student/MyGradesPage"
import { MyAttendancePage } from "./pages/student/MyAttendancePage"
import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"
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
  { path: "/grades", element: <GradeListPage /> },
  { path: "/grades/:gradeId", element: <ClassesInGradePage /> },
  { path: "/classes/:id", element: <ClassDetailPage /> },
  { path: "/assignments/new", element: <InstructorAssignmentForm /> },
  { path: "/assignments/:id", element: <AssignmentDetailPage /> },
  { path: "/students/:id", element: <StudentDetailPage /> },
  { path: "/rubrics", element: <RubricsPage /> },
  { path: "/rubrics/new", element: <RubricsPage /> },
  { path: "/rubrics/confirm/:rubricId", element: <RubricConfirmPage /> },
  { path: "/submissions", element: <SubmissionsPage /> },
  { path: "/submissions/:id", element: <SubmissionDetailPage /> },
  { path: "/quizzes", element: <QuizzesPage /> },
  { path: "/quizzes/new", element: <QuizEditorPage /> },
  { path: "/quizzes/:id", element: <QuizEditorPage /> },
  { path: "/quizzes/:id/attempts", element: <QuizAttemptsListPage /> },
  { path: "/quizzes/attempts/:id", element: <QuizAttemptDetailPage /> },
  { path: "/alerts", element: <AlertsPage /> },
  { path: "/alerts/:alertId", element: <AlertDetailPage /> },
  { path: "/assistant", element: <AssistantPage /> },
  { path: "/notifications", element: <NotificationsListPage /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/attendance/import", element: <AttendanceImportPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/support", element: <SupportPage /> },
]

export const STUDENT_ROUTES = [
  { path: "/student", element: <StudentDashboardPage /> },
  { path: "/student/classes", element: <AvailableClassesPage /> },
  { path: "/student/classes/:classId", element: <StudentClassGradesPage /> },
  { path: "/student/classes/:classId/assignments/:assignmentId", element: <StudentAssignmentGradePage /> },
  { path: "/student/assignments", element: <StudentAssignmentsPage /> },
  { path: "/student/submissions/:id", element: <SubmissionStatusPage /> },
  { path: "/student/grades", element: <MyGradesPage /> },
  { path: "/student/attendance", element: <MyAttendancePage /> },
  { path: "/student/homework-help", element: <HomeworkHelpPage /> },
  { path: "/student/homework-help/history", element: <HomeworkHelpHistoryPage /> },
  { path: "/student/quizzes", element: <StudentQuizzesPage /> },
  { path: "/student/quizzes/:id/take", element: <QuizTakePage /> },
  { path: "/student/quizzes/:id/result", element: <StudentQuizResultPage /> },
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
    element: <GuardianRoute><div className="min-h-screen bg-surface"><header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
          <h1 className="font-headline-md text-headline-md text-primary">Guardian Portal</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </header><div className="flex-1 p-xl"><Outlet /></div></div></GuardianRoute>,
    children: [
      { index: true, element: <GuardianDashboardPage /> },
      { path: "children/:id", element: <ChildDetailPage /> },
      { path: "alerts/:id", element: <GuardianAlertDetailPage /> },
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
      { path: "alerts", element: <AdminAlertsPage /> },
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
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
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
