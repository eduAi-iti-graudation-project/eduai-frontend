import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { TeacherLayout } from "./components/layout/TeacherLayout"
import { StudentLayout } from "./components/layout/StudentLayout"
import { TeacherRoute, StudentRoute, RootRedirect } from "./components/auth/RouteGuards"
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

export const TEACHER_ROUTES = [
  { path: "/dashboard", element: <TeacherDashboardPage /> },
  { path: "/classes", element: <ClassesPage /> },
  { path: "/classes/:id", element: <ClassDetailPage /> },
  { path: "/assignments/new", element: <InstructorAssignmentForm /> },
  { path: "/rubrics", element: <RubricsPage /> },
  { path: "/rubrics/new", element: <RubricsPage /> },
  { path: "/submissions", element: <SubmissionsPage /> },
  { path: "/submissions/:id", element: <SubmissionsPage /> },
  { path: "/alerts", element: <AlertsPage /> },
  { path: "/assistant", element: <AssistantPage /> },
  { path: "/notifications", element: <NotificationsListPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/support", element: <SupportPage /> },
]

export const STUDENT_ROUTES = [
  { path: "/student-portal", element: <StudentPortalPage /> },
  { path: "/student-portal/*", element: <StudentPortalPage /> },
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
    element: <div className="min-h-screen bg-surface"><div className="flex-1 p-xl"><Outlet /></div></div>,
    children: [
      { index: true, element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Guardian Dashboard</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "children", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Children</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "reports", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Reports</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "notifications", element: <NotificationsListPage /> },
    ],
  }
}

export function adminRoutes() {
  return {
    path: "/admin",
    element: <div className="min-h-screen bg-surface"><div className="flex-1 p-xl"><Outlet /></div></div>,
    children: [
      { index: true, element: <Navigate to="/admin/teachers" replace /> },
      { path: "teachers", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Teacher Management</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "reports", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Reports</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "notifications", element: <NotificationsListPage /> },
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
    element: <Navigate to="/" replace />,
  },
])

function teacherRoutes() {
  return {
    element: <TeacherRoute><TeacherLayout /></TeacherRoute>,
    children: [
      { path: "/dashboard", element: <TeacherDashboardPage /> },
      { path: "/classes", element: <ClassesPage /> },
      { path: "/classes/:id", element: <ClassDetailPage /> },
      { path: "/assignments/new", element: <InstructorAssignmentForm /> },
      { path: "/rubrics", element: <RubricsPage /> },
      { path: "/rubrics/new", element: <RubricsPage /> },
      { path: "/submissions", element: <SubmissionsPage /> },
      { path: "/submissions/:id", element: <SubmissionsPage /> },
      { path: "/alerts", element: <AlertsPage /> },
      { path: "/assistant", element: <AssistantPage /> },
      { path: "/notifications", element: <NotificationsListPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/support", element: <SupportPage /> },
    ],
  }
}

function studentRoutes() {
  return {
    element: <StudentRoute><StudentLayout /></StudentRoute>,
    children: [
      { path: "/student-portal", element: <StudentPortalPage /> },
      { path: "/student-portal/*", element: <StudentPortalPage /> },
    ],
  }
}

function guardianRoutes() {
  return {
    path: "/guardian",
    element: <div className="min-h-screen bg-surface"><div className="flex-1 p-xl"><Outlet /></div></div>,
    children: [
      { index: true, element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Guardian Dashboard</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "children", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Children</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "reports", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Reports</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "notifications", element: <NotificationsListPage /> },
    ],
  }
}

function adminRoutes() {
  return {
    path: "/admin",
    element: <div className="min-h-screen bg-surface"><div className="flex-1 p-xl"><Outlet /></div></div>,
    children: [
      { index: true, element: <Navigate to="/admin/teachers" replace /> },
      { path: "teachers", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Teacher Management</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "reports", element: <div className="text-center py-xl"><h1 className="font-headline-xl text-headline-xl text-primary">Reports</h1><p className="font-body-md text-body-md text-on-surface-variant mt-md">Coming soon</p></div> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "notifications", element: <NotificationsListPage /> },
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
    element: <Navigate to="/" replace />,
  },
])
