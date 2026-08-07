import { useState } from "react"
import { Link } from "react-router-dom"
import { useClasses } from "@/hooks/use-classes"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [newClassName, setNewClassName] = useState("")
  const [newClassDesc, setNewClassDesc] = useState("")

  const { isLoading, isError, error, classCards, createClass, deleteClass } = useClasses()

  const filtered = classCards.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  const handleCreate = async () => {
    if (!newClassName.trim()) return
    await createClass.mutateAsync({ name: newClassName.trim(), description: newClassDesc.trim() || undefined })
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
      <ErrorState
        title="Something went wrong"
        message={error instanceof Error ? error.message : "Failed to load classes"}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (isLoading) {
    return <LoadingState label="Loading classes..." />
  }

  return (
    <div className="min-h-full bg-surface-container-low">
      <div className="mx-auto flex max-w-6xl flex-col gap-md p-gutter pb-24 md:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Your Classes</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Manage and organize your current teaching schedule.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 h-auto rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Class
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-sm">
          <div className="relative flex-grow max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-md border border-outline-variant text-sm font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search classes..."
              type="text"
            />
          </div>
        </div>

        {/* Bento Grid / Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant shadow-sm p-md flex flex-col items-center justify-center text-center gap-sm py-xl">
              <span className="material-symbols-outlined text-[40px] text-outline">school</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">No classes found</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {classCards.length === 0
                  ? "Add your first class to get started"
                  : "No classes match your search"}
              </p>
              {classCards.length === 0 && (
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-sm px-4 py-2 h-auto rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add New Class
                </Button>
              )}
            </div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div className="p-md border-b border-outline-variant flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-headline-md text-headline-md text-on-surface truncate">{c.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 truncate">{c.section}</p>
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(deleteConfirm === c.id ? null : c.id)}
                    className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-container cursor-pointer"
                    aria-label="Class options"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {deleteConfirm === c.id && (
                    <div className="absolute top-10 right-0 w-48 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg py-1 z-20">
                      <Link
                        to={`/classes/${c.id}`}
                        className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View Class
                      </Link>
                      <div className="h-px bg-outline-variant my-1" />
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deleteClass.isPending}
                        className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container flex items-center gap-2 font-medium disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        {deleteClass.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-md">
                <div className="flex justify-between items-center mb-sm">
                  <span className="font-meta text-meta text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    {c.students} Student{c.students !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-label-sm text-label-sm border border-outline-variant">
                    Active
                  </span>
                </div>
                <Link
                  to={`/classes/${c.id}`}
                  className="mt-md w-full flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-outline-variant bg-surface-container-highest/40 text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors font-body-md text-body-md"
                >
                  View Class
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="rounded-lg w-full max-w-[600px] mx-md border border-outline-variant bg-surface-container-lowest p-xl">
          <DialogHeader>
            <DialogTitle className="font-headline-md text-headline-md text-on-surface">Create New Class</DialogTitle>
            <DialogDescription className="sr-only">Create a new class workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-md">
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Class Name</label>
              <input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Grade 10 Math"
                type="text"
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Description</label>
              <input
                value={newClassDesc}
                onChange={(e) => setNewClassDesc(e.target.value)}
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Section B - Advanced Algebra"
                type="text"
              />
            </div>
            <div className="flex gap-md pt-sm">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-auto py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!newClassName.trim() || createClass.isPending}
                className="flex-1 h-auto py-sm rounded-md bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
              >
                {createClass.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}