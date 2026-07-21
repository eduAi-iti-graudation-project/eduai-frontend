import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { useClassDetail } from "@/hooks/use-classes"
import { useAuth } from "@/providers/use-auth"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    detail,
    assignments,
    isLoading,
    isError,
    error,
    deleteClass,
  } = useClassDetail(id ?? "")

  const cls = detail.data
  const assignmentsData = assignments.data ?? []

  const handleDelete = async () => {
    if (!id) return
    await deleteClass.mutateAsync()
    navigate("/classes", { replace: true })
  }

  if (isError) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-xl relative z-10">
          <div className="text-center w-full">
            <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Class not found</h2>
            <p className="font-body-md text-on-surface-variant mb-lg">{error instanceof Error ? error.message : "Failed to load class"}</p>
            <Link to="/classes" className="bg-secondary-container text-white px-lg py-sm rounded-full font-label-md nudge-hover inline-block">
              Back to Classes
            </Link>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  if (isLoading || !cls) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-xl relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Loading class...</p>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  const students = cls.enrollments?.map((e) => e.student) ?? []

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob absolute -top-20 -left-20 w-96 h-96 bg-primary-fixed rounded-full animate-pulse" />
        <div className="blob absolute top-1/3 -right-20 w-80 h-80 bg-secondary-fixed rounded-full" style={{ animation: "bounce 10s infinite" }} />
      </div>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        {/* TopNavBar */}
        <header className="flex justify-between items-center h-16 px-md bg-surface sticky top-0 z-40">
          <div className="flex items-center gap-md">
            <Link to="/classes" className="text-on-surface-variant hover:text-primary transition-colors p-1">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="relative w-96 group">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full pl-10 pr-md py-xs bg-surface-container-lowest border-2 border-outline-variant rounded-full text-body-md focus:ring-2 focus:ring-primary-container outline-none transition-all"
                placeholder="Search students, assignments..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button type="button" className="text-on-surface-variant hover:text-primary transition-colors rounded-full p-1">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-10 w-10 rounded-full border-2 border-primary-fixed overflow-hidden bg-primary-container flex items-center justify-center text-white font-label-md">
              {user?.name ? getInitials(user.name) : <span className="material-symbols-outlined text-[20px]">person</span>}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-xl max-w-7xl mx-auto w-full">
          {/* Back link */}
          <Link to="/classes" className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Classes
          </Link>

          {/* Class Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-md mb-xl">
            <div className="flex items-center gap-md">
              <div className="w-16 h-16 bg-primary-container rounded-3xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <div>
                <h2 className="font-headline-xl text-headline-xl text-primary mb-xs">{cls.name}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  {cls.description ?? "No description"} &bull; {students.length} Student{students.length !== 1 ? "s" : ""} &bull; {assignmentsData.length} Assignment{assignmentsData.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-sm">
              <Link
                to={`/assignments?classId=${cls.id}`}
                className="px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover"
              >
                View Submissions
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-md py-sm border-2 border-error text-error font-label-md text-label-md rounded-full hover:bg-error/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
            {/* Left: Assignments */}
            <div className="lg:col-span-2 space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-primary">Assignments</h3>
                <Link
                  to={`/assignments/new?classId=${cls.id}`}
                  className="flex items-center gap-xs px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Assignment
                </Link>
              </div>

              {assignmentsData.length === 0 && (
                <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10 text-center">
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-sm block">assignment</span>
                  <p className="font-body-md text-body-md text-on-surface-variant">No assignments yet</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-xs">Create an assignment to start grading</p>
                </div>
              )}

              <div className="space-y-sm">
                {assignmentsData.map((a) => (
                  <div key={a.id} className="bg-white rounded-3xl p-md shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:border-primary-container/30 transition-all">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{a.title}</h4>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Due {new Date(a.dueDate).toLocaleDateString()} &bull; {a.totalPoints} pts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Link
                        to={`/submissions?assignmentId=${a.id}`}
                        className="px-md py-2 bg-primary-container/10 text-primary font-label-sm text-label-sm rounded-2xl hover:bg-primary-container/20 transition-colors"
                      >
                        View Submissions
                      </Link>
                      <button
                        type="button"
                        className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Roster */}
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-primary">Class Roster</h3>
                <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">
                  {students.length}
                </span>
              </div>
              <div className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10">
                {students.length === 0 && (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center py-md">No students enrolled</p>
                )}
                <div className="space-y-sm">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center gap-sm p-sm rounded-2xl hover:bg-surface-container transition-colors">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-label-sm font-bold shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-md text-label-md text-on-surface truncate">{s.name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{s.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10">
                <h4 className="font-label-md text-label-md text-primary mb-sm">Quick Actions</h4>
                <div className="space-y-sm">
                  <Link
                    to={`/assignments/new?classId=${cls.id}`}
                    className="flex items-center gap-sm px-sm py-sm rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-primary-container">add_circle</span>
                    <span className="font-label-sm text-label-sm">New Assignment</span>
                  </Link>
                  <Link
                    to={`/submissions?classId=${cls.id}`}
                    className="flex items-center gap-sm px-sm py-sm rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-primary-container">list_alt</span>
                    <span className="font-label-sm text-label-sm">All Submissions</span>
                  </Link>
                  <Link
                    to={`/rubrics?classId=${cls.id}`}
                    className="flex items-center gap-sm px-sm py-sm rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-primary-container">assignment</span>
                    <span className="font-label-sm text-label-sm">Manage Rubrics</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-[32px] p-xl shadow-xl max-w-sm w-full mx-md border border-outline-variant/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-error text-[28px]">warning</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Delete {cls.name}?</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              This will permanently delete this class and all associated assignments, submissions, and rubrics. This action cannot be undone.
            </p>
            <div className="flex gap-md">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteClass.isPending}
                className="flex-1 py-sm bg-error text-on-error font-label-md text-label-md rounded-full disabled:opacity-50"
              >
                {deleteClass.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant FAB */}
      <div className="fixed bottom-md right-md z-50">
        <button type="button" className="flex items-center gap-sm bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-full shadow-2xl hover:scale-105 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className="font-label-md text-label-md">Ask EduAI Assistant</span>
        </button>
      </div>

      <MobileNav />
    </div>
  )
}
