import { useState } from "react"
import { Link } from "react-router-dom"
import { useClasses } from "@/hooks/use-classes"
import { useAuth } from "@/providers/use-auth"

const iconOptions = [
  { icon: "functions", bg: "bg-surface-container", color: "text-primary-container" },
  { icon: "menu_book", bg: "bg-secondary-fixed", color: "text-secondary" },
  { icon: "biotech", bg: "bg-surface-container-high", color: "text-primary" },
  { icon: "history_edu", bg: "bg-surface-container", color: "text-primary-container" },
  { icon: "language", bg: "bg-secondary-fixed", color: "text-secondary" },
  { icon: "palette", bg: "bg-surface-container-high", color: "text-primary" },
]

const blobColors = [
  "bg-primary-fixed/10",
  "bg-secondary-fixed/20",
  "bg-primary-fixed-dim/20",
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ClassesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newClassName, setNewClassName] = useState("")
  const [newClassDesc, setNewClassDesc] = useState("")

  const { user } = useAuth()
  const { isLoading, isError, error, classCards, createClass, deleteClass } = useClasses()

  const totalActive = classCards.length
  const bestClass = classCards.length > 0
    ? classCards.reduce((best, c) => (c.students > best.students ? c : best))
    : null

  const handleCreate = async () => {
    if (!newClassName.trim()) return
    await createClass.mutateAsync({ name: newClassName.trim(), description: newClassDesc.trim() || undefined, teacherId: user!.id })
    setNewClassName("")
    setNewClassDesc("")
    setShowCreateModal(false)
  }

  const handleDelete = async (id: string) => {
    await deleteClass.mutateAsync(id)
    setDeleteConfirm(null)
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center w-full">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-on-surface-variant mb-lg">{error instanceof Error ? error.message : "Failed to load classes"}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-secondary-container text-white px-lg py-sm rounded-full font-label-md nudge-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob absolute -top-20 -left-20 w-96 h-96 bg-primary-fixed rounded-full animate-pulse" />
        <div className="blob absolute top-1/3 -right-20 w-80 h-80 bg-secondary-fixed rounded-full" style={{ animation: "bounce 10s infinite" }} />
        <div className="blob absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-tertiary-fixed rounded-full opacity-20" />
      </div>

      <div className="flex-1 overflow-y-auto p-xl max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-primary mb-xs">Your Classes</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              {totalActive} Active Section{totalActive !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-xs px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full shadow-lg nudge-hover"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Add New Class
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest/60 backdrop-blur-md rounded-3xl p-md mb-xl flex flex-wrap gap-md items-center justify-between border border-outline-variant/30">
          <div className="flex items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">{totalActive} class{totalActive !== 1 ? "es" : ""}</span>
          </div>
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-xs rounded-lg material-symbols-outlined ${viewMode === "grid" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              grid_view
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-xs rounded-lg material-symbols-outlined ${viewMode === "list" ? "text-primary bg-primary-fixed/20" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              list
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
          {classCards.length === 0 && (
            <div className="col-span-full bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-md">
                <span className="material-symbols-outlined text-4xl">school</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface-variant mb-xs">No classes yet</h4>
              <p className="font-body-md text-body-md text-on-surface-variant/60 max-w-[200px]">Create your first class to get started</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-md px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover"
              >
                Create Class
              </button>
            </div>
          )}
          {classCards.map((c, i) => {
            const style = iconOptions[i % iconOptions.length]
            const blob = blobColors[i % blobColors.length]
            return (
              <div key={c.id} className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10 flex flex-col nudge-hover group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${blob} rounded-bl-[100px] -z-0`} />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-md">
                    <div className={`w-14 h-14 ${style.bg} rounded-3xl flex items-center justify-center ${style.color}`}>
                      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className={`px-sm py-1 ${"bg-surface-container-high text-primary"} font-label-sm text-label-sm rounded-full`}>
                        {c.students} Student{c.students !== 1 ? "s" : ""}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(deleteConfirm === c.id ? null : c.id)}
                          className="p-1 text-on-surface-variant hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        {deleteConfirm === c.id && (
                          <div className="absolute right-0 top-full mt-xs z-50 bg-white rounded-2xl shadow-xl border border-outline-variant/20 p-sm min-w-[160px]">
                            <p className="font-label-sm text-label-sm text-on-surface mb-sm px-sm">Delete this class?</p>
                            <div className="flex gap-xs">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-1.5 bg-surface-container text-on-surface-variant font-label-sm text-label-sm rounded-xl"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(c.id)}
                                disabled={deleteClass.isPending}
                                className="flex-1 py-1.5 bg-error text-on-error font-label-sm text-label-sm rounded-xl disabled:opacity-50"
                              >
                                {deleteClass.isPending ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-xs">{c.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md">{c.section}</p>
                  <div className="mt-auto pt-md border-t border-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary-container text-base">group</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">{c.students} Student{c.students !== 1 ? "s" : ""}</span>
                    </div>
                    <Link
                      to={`/classes/${c.id}`}
                      className="px-md py-2 bg-primary-container text-white font-label-md text-label-md rounded-2xl group-hover:bg-teal-vibrant transition-colors"
                    >
                      View Class
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {bestClass && bestClass.students > 0 && (
            <div className="bg-primary-container rounded-[32px] p-xl shadow-xl md:col-span-2 flex flex-col md:flex-row gap-lg relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-fixed-dim/40 rounded-full blur-3xl" />
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-sm mb-md">
                  <div className="px-sm py-1 bg-primary-fixed text-primary font-label-sm text-label-sm rounded-full">Featured Section</div>
                  <div className="flex items-center gap-xs text-white/80 font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-xs">star</span>
                    Most Students
                  </div>
                </div>
                <h3 className="font-headline-xl text-headline-xl text-white mb-md">{bestClass.name}</h3>
                <p className="text-white/80 text-body-lg font-body-lg mb-lg max-w-2xl">
                  {bestClass.name} has {bestClass.students} enrolled student{bestClass.students !== 1 ? "s" : ""}. View their assignments and submissions.
                </p>
                <div className="flex flex-wrap gap-md items-center">
                  <div className="flex -space-x-4">
                    {classCards.slice(0, 3).map((cc, j) => (
                      <div key={j} className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-white flex items-center justify-center text-primary font-label-sm text-label-sm">
                        {getInitials(cc.name)}
                      </div>
                    ))}
                  </div>
                  <span className="text-white font-label-md text-label-md">{totalActive} Active</span>
                </div>
              </div>
              <div className="md:w-1/3 flex flex-col justify-center relative z-10">
                <Link
                  to={`/classes/${bestClass.id}`}
                  className="w-full py-md bg-secondary-container text-white font-label-md text-label-md rounded-3xl shadow-lg nudge-hover flex items-center justify-center gap-sm mb-sm"
                >
                  Open Dashboard
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-sm border-2 border-white/30 text-white font-label-md text-label-md rounded-3xl hover:bg-white/10 transition-colors"
                >
                  New Class
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-outline-variant rounded-[32px] p-md flex flex-col items-center justify-center text-center group hover:border-primary-container hover:bg-primary-fixed/5 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary-container group-hover:bg-primary-fixed/20 mb-md transition-all">
              <span className="material-symbols-outlined text-4xl">add</span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface-variant group-hover:text-primary transition-colors">Start New Section</h4>
            <p className="font-body-md text-body-md text-on-surface-variant/60 mt-sm">Create a new class workspace</p>
          </button>
        </div>

        <footer className="p-md text-center text-on-surface-variant/50 font-label-sm text-label-sm mt-xl">
          &copy; 2025 EduAI Teacher Portal &bull; <a className="hover:text-primary underline" href="#">Privacy Policy</a> &bull; <a className="hover:text-primary underline" href="#">Help Center</a>
        </footer>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-[32px] p-xl shadow-xl w-full max-w-[600px] mx-md border border-outline-variant/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-primary mb-md">Create New Class</h3>
            <div className="space-y-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface mb-xs block">Class Name</label>
                <input
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary-container outline-none transition-all"
                  placeholder="e.g. Grade 10 Math"
                  type="text"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface mb-xs block">Description</label>
                <input
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full px-md py-sm bg-surface-container-lowest border-2 border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary-container outline-none transition-all"
                  placeholder="e.g. Section B - Advanced Algebra"
                  type="text"
                />
              </div>
              <div className="flex gap-md pt-sm">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newClassName.trim() || createClass.isPending}
                  className="flex-1 py-sm bg-primary-container text-white font-label-md text-label-md rounded-full disabled:opacity-50 nudge-hover"
                >
                  {createClass.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-md right-md z-50">
        <Link to="/assistant" className="flex items-center gap-sm bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-full shadow-2xl hover:scale-105 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className="font-label-md text-label-md">Ask EduAI Assistant</span>
        </Link>
      </div>
    </>
  )
}
