import { createBrowserRouter } from "react-router-dom"
import { TeacherLayout } from "./components/layout/TeacherLayout"
import { StudentLayout } from "./components/layout/StudentLayout"
import { MeetingsListPage } from "./pages/meetings/MeetingsListPage"
import { ScheduleMeetingPage } from "./pages/meetings/ScheduleMeetingPage"
import { MeetingDetailPage } from "./pages/meetings/MeetingDetailPage"
import { MeetingCallPage } from "./pages/meetings/MeetingCallPage"
import { TeacherRoute, StudentRoute, GuardianRoute, AdminRoute, GuestRoute } from "./components/auth/RouteGuards"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { LandingPage } from "./pages/LandingPage"
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage"
import { TimetablePage } from "./pages/teacher/TimetablePage"
import { ClassesPage } from "./pages/teacher/ClassesPage"
import { GradeListPage } from "./pages/teacher/GradeListPage"
import { GradeDetailPage } from "./pages/teacher/GradeDetailPage"
import { CoursePage } from "./pages/teacher/CoursePage"
import { ClassDetailPage } from "./pages/teacher/ClassDetailPage"
import { InstructorAssignmentForm } from "./components/InstructorAssignmentForm"
import { AssignmentDetailPage } from "./pages/teacher/AssignmentDetailPage"
import { AssignmentsPage } from "./pages/teacher/AssignmentsPage"
import { AssignmentReviewPage } from "./pages/teacher/AssignmentReviewPage"
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
import { StudentTimetablePage } from "./pages/student/StudentTimetablePage"
import { StudentAssignmentsPage } from "./pages/student/StudentAssignmentsPage"
import { AvailableClassesPage } from "./pages/student/AvailableClassesPage"
import { SubmissionStatusPage } from "./pages/student/SubmissionStatusPage"
import { StudentClassGradesPage } from "./pages/student/StudentClassGradesPage"
import { StudentMaterialsPage } from "./pages/student/StudentMaterialsPage"
import { StudentAssignmentGradePage } from "./pages/student/StudentAssignmentGradePage"
import { HomeworkHelpPage } from "./pages/student/HomeworkHelpPage"
import { HomeworkHelpHistoryPage } from "./pages/student/HomeworkHelpHistoryPage"
import { StudyLabPage } from "./pages/student/StudyLabPage"
import { StudentQuizzesPage } from "./pages/student/StudentQuizzesPage"
import { QuizTakePage } from "./pages/student/QuizTakePage"
import { StudentQuizResultPage } from "./pages/student/StudentQuizResultPage"
import { QuizzesPage } from "./pages/teacher/QuizzesPage"
import { QuizEditorPage } from "./pages/teacher/QuizEditorPage"
import { QuizAttemptsListPage } from "./pages/teacher/QuizAttemptsListPage"
import { QuizAttemptDetailPage } from "./pages/teacher/QuizAttemptDetailPage"
import { MyGradesPage } from "./pages/student/MyGradesPage"
import { MyAttendancePage } from "./pages/student/MyAttendancePage"
import { StudentLabsPage } from "./pages/student/StudentLabsPage"
import { StudentLabDetailPage } from "./pages/student/StudentLabDetailPage"
import { LabsPage } from "./pages/teacher/LabsPage"
import { LabDetailPage } from "./pages/teacher/LabDetailPage"
import { GuardianDashboardPage } from "./pages/guardian/GuardianDashboardPage"
import { GuardianAlertsPage } from "./pages/guardian/GuardianAlertsPage"
import { GuardianAssistantPage } from "./pages/guardian/GuardianAssistantPage"
import { ChildDetailPage } from "./pages/guardian/ChildDetailPage"
import { GuardianLayout } from "./components/layout/GuardianLayout"
import { AdminLayout } from "./components/layout/AdminLayout"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminTimetablePage } from "./pages/admin/AdminTimetablePage"
import { AdminAssistantPage } from "./pages/admin/AdminAssistantPage"
import { AdminBillingPage } from "./pages/admin/AdminBillingPage"
import { GroupManagementPage } from "./pages/admin/GroupManagementPage"
import { AdminRequestsPage } from "./pages/admin/AdminRequestsPage"
import { AdminJoinApprovalsPage } from "./pages/admin/AdminJoinApprovalsPage"
import { GradeManagementPage } from "./pages/admin/GradeManagementPage"
import { MigrationWizardPage } from "./pages/admin/MigrationWizardPage"
import { StudentManagementPage } from "./pages/admin/StudentManagementPage"
import { AdminStudentDetailPage } from "./pages/admin/AdminStudentDetailPage"
import { AdminBulkDocumentsPage } from "./pages/admin/AdminBulkDocumentsPage"
import { AdminCsvImportPage } from "./pages/admin/AdminCsvImportPage"
import { TeacherManagementPage } from "./pages/admin/TeacherManagementPage"
import { AdminTeacherDetailPage } from "./pages/admin/AdminTeacherDetailPage"
import { InsightsPage } from "./pages/insights/InsightsPage"
import { StudentInsightsPage } from "./pages/insights/StudentInsightsPage"
import { ChatListPage } from "./pages/chat/ChatListPage"
import { ChatThreadPage } from "./pages/chat/ChatThreadPage"
import { AdminBroadcastsPage } from "./pages/admin/AdminBroadcastsPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { AuthCallbackPage } from "./pages/AuthCallbackPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { VerifyPage } from "./pages/VerifyPage"
import { PrivacyPage } from "./pages/PrivacyPage"
import { TermsPage } from "./pages/TermsPage"
import { PricingPage } from "./pages/PricingPage"
// PREVIEW THEME ROUTE — remove this import to roll back the design preview
import { DesignPreviewPage } from "./pages/DesignPreviewPage"

export const TEACHER_ROUTES = [
  { path: "/dashboard", element: <TeacherDashboardPage /> },
  { path: "/timetable", element: <TimetablePage /> },
  { path: "/classes", element: <ClassesPage /> },
  { path: "/grades", element: <GradeListPage /> },
  { path: "/grades/:gradeId", element: <GradeDetailPage /> },
  { path: "/courses/:courseId", element: <CoursePage /> },
  { path: "/classes/:id", element: <ClassDetailPage /> },
  { path: "/assignments", element: <AssignmentsPage /> },
  { path: "/assignments/new", element: <InstructorAssignmentForm /> },
  { path: "/assignments/review", element: <AssignmentReviewPage /> },
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
  { path: "/labs", element: <LabsPage /> },
  { path: "/labs/:id", element: <LabDetailPage /> },
  { path: "/alerts", element: <AlertsPage /> },
  { path: "/alerts/:alertId", element: <AlertDetailPage /> },
  { path: "/insights", element: <InsightsPage /> },
  { path: "/insights/students/:id", element: <StudentInsightsPage /> },
  { path: "/chat", element: <ChatListPage /> },
  { path: "/chat/:threadId", element: <ChatThreadPage /> },
  { path: "/assistant", element: <AssistantPage /> },
  { path: "/notifications", element: <NotificationsListPage /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/attendance/import", element: <AttendanceImportPage /> },
  { path: "/meetings", element: <MeetingsListPage /> },
  { path: "/meetings/new", element: <ScheduleMeetingPage /> },
  { path: "/meetings/:id", element: <MeetingDetailPage /> },
  { path: "/meetings/:id/call", element: <MeetingCallPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/support", element: <SupportPage /> },
]

export const STUDENT_ROUTES = [
  { path: "/student", element: <StudentDashboardPage /> },
  { path: "/student/timetable", element: <StudentTimetablePage /> },
  { path: "/student/classes", element: <AvailableClassesPage /> },
  { path: "/student/classes/:classId", element: <StudentClassGradesPage /> },
  { path: "/student/classes/:classId/materials", element: <StudentMaterialsPage /> },
  { path: "/student/classes/:classId/assignments/:assignmentId", element: <StudentAssignmentGradePage /> },
  { path: "/student/assignments", element: <StudentAssignmentsPage /> },
  { path: "/student/submissions/:id", element: <SubmissionStatusPage /> },
  { path: "/student/grades", element: <MyGradesPage /> },
  { path: "/student/attendance", element: <MyAttendancePage /> },
  { path: "/student/homework-help", element: <HomeworkHelpPage /> },
  { path: "/student/homework-help/history", element: <HomeworkHelpHistoryPage /> },
  { path: "/student/study-lab", element: <StudyLabPage /> },
  { path: "/student/labs", element: <StudentLabsPage /> },
  { path: "/student/labs/:id", element: <StudentLabDetailPage /> },
  { path: "/student/quizzes", element: <StudentQuizzesPage /> },
  { path: "/student/quizzes/:id/take", element: <QuizTakePage /> },
  { path: "/student/quizzes/:id/result", element: <StudentQuizResultPage /> },
  { path: "/student/insights", element: <InsightsPage /> },
  { path: "/student/chat", element: <ChatListPage /> },
  { path: "/student/chat/:threadId", element: <ChatThreadPage /> },
  { path: "/student/notifications", element: <NotificationsListPage /> },
  { path: "/student/meetings", element: <MeetingsListPage /> },
  { path: "/student/meetings/:id", element: <MeetingDetailPage /> },
  { path: "/student/meetings/:id/call", element: <MeetingCallPage /> },
  { path: "/student/support", element: <SupportPage /> },
  { path: "/student/settings", element: <SettingsPage /> },
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
    element: <GuardianRoute><GuardianLayout /></GuardianRoute>,
    children: [
      { index: true, element: <GuardianDashboardPage /> },
      { path: "assistant", element: <GuardianAssistantPage /> },
      { path: "children/:id", element: <ChildDetailPage /> },
      { path: "alerts", element: <GuardianAlertsPage /> },
      { path: "alerts/:id", element: <GuardianAlertDetailPage /> },
      { path: "chat", element: <ChatListPage /> },
      { path: "chat/:threadId", element: <ChatThreadPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "insights/students/:id", element: <StudentInsightsPage /> },
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
      { path: "timetable", element: <AdminTimetablePage /> },
      { path: "assistant", element: <AdminAssistantPage /> },
      { path: "alerts", element: <AdminAlertsPage /> },
      { path: "broadcasts", element: <AdminBroadcastsPage /> },
      { path: "chat", element: <ChatListPage /> },
      { path: "chat/:threadId", element: <ChatThreadPage /> },
      { path: "grades", element: <GradeManagementPage /> },
      { path: "migration", element: <MigrationWizardPage /> },
      { path: "students", element: <StudentManagementPage /> },
      { path: "students/:id", element: <AdminStudentDetailPage /> },
      { path: "documents", element: <AdminBulkDocumentsPage /> },
      { path: "import", element: <AdminCsvImportPage /> },
      { path: "teachers", element: <TeacherManagementPage /> },
      { path: "teachers/:id", element: <AdminTeacherDetailPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "insights/students/:id", element: <StudentInsightsPage /> },
      { path: "billing", element: <AdminBillingPage /> },
      { path: "groups", element: <GroupManagementPage /> },
      { path: "requests", element: <AdminRequestsPage /> },
      { path: "join-approvals", element: <AdminJoinApprovalsPage /> },
    ],
  }
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GuestRoute>
        <LandingPage />
      </GuestRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <GuestRoute>
        <SignupPage />
      </GuestRoute>
    ),
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/verify",
    element: <VerifyPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  // PREVIEW THEME ROUTE — remove this block to roll back the design preview
  {
    path: "/design-preview",
    element: <DesignPreviewPage />,
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
