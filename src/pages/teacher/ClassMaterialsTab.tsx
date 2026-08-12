import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useMaterialChapters } from "@/hooks/use-materials"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import * as api from "@/lib/api"
import type { Material } from "@/lib/api"
import { cn } from "@/lib/utils"

interface QueuedFile {
  file: File
  chapterId?: string
}

interface ClassMaterialsTabProps {
  classId: string
}

export function ClassMaterialsTab({ classId }: ClassMaterialsTabProps) {
  const { chapters, unassigned, create, update, remove, move, refetch } =
    useMaterialChapters(classId)

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [queued, setQueued] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState<Record<string, number>>({})
  const [dragChapter, setDragChapter] = useState<string | null>(null)
  const [dragMaterial, setDragMaterial] = useState<{
    id: string
    fromChapterId: string | null
  } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: "chapter" | "material"
    id: string
    title: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  const isUploading = Object.keys(uploading).length > 0

  const openChapter = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type.includes("pdf"))
    if (valid.length !== files.length) {
      toast.warning("Only PDF files can be uploaded")
    }
    if (valid.length > 0) {
      setQueued((prev) => [
        ...prev,
        ...valid.map((file) => ({ file })),
      ])
    }
  }, [])

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    try {
      await create.mutateAsync(title)
      toast.success(`Chapter "${title}" created`)
      setNewTitle("")
      setIsCreating(false)
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    }
  }

  const handleRename = async (id: string) => {
    const title = editingValue.trim()
    if (!title) {
      setEditingId(null)
      return
    }
    try {
      await update.mutateAsync({ id, data: { title } })
      toast.success("Chapter renamed")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    } finally {
      setEditingId(null)
    }
  }

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= sortedChapters.length
    ) {
      return
    }
    const list = [...sortedChapters]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    try {
      await Promise.all(
        list.map((c, i) => update.mutateAsync({ id: c.id, data: { order: i } })),
      )
      toast.success("Chapters reordered")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    }
  }

  const handleDeleteChapter = async () => {
    if (!confirmDelete || confirmDelete.kind !== "chapter") return
    try {
      await remove.mutateAsync(confirmDelete.id)
      toast.success("Chapter deleted")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!confirmDelete || confirmDelete.kind !== "material") return
    try {
      await api.deleteMaterial(confirmDelete.id)
      refetch()
      toast.success("Material deleted")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleViewMaterial = async (materialId: string) => {
    try {
      const url = await api.getMaterialFileUrl(materialId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    }
  }

  const uploadQueued = async () => {
    const targets = [...queued]
    if (targets.length === 0) return
    let detected = 0
    let failed = 0
    for (const target of targets) {
      const title = target.file.name.replace(/\.pdf$/i, "")
      setUploading((prev) => ({ ...prev, [target.file.name]: 0 }))
      try {
        const res = await api.uploadMaterial(
          title,
          classId,
          target.file,
          (p) =>
            setUploading((prev) => ({ ...prev, [target.file.name]: p })),
          undefined,
          target.chapterId,
        )
        if (res.detectedChapterCount && res.detectedChapterCount > 0) {
          detected += res.detectedChapterCount
        }
      } catch (err) {
        failed += 1
        toast.error(`${title}: ${api.getErrorMessage(err)}`)
      } finally {
        setUploading((prev) => {
          const next = { ...prev }
          delete next[target.file.name]
          return next
        })
      }
    }
    setQueued([])
    await refetch()
    const okCount = targets.length - failed
    if (detected > 0) {
      toast.info(`Auto-detected ${detected} chapter${detected !== 1 ? "s" : ""} in this document`)
    } else if (okCount > 0) {
      toast.success(`Uploaded ${okCount} file${okCount !== 1 ? "s" : ""}`)
    }
  }

  const handleMoveMaterial = async (
    materialId: string,
    targetChapterId: string | null,
    fromChapterId: string | null,
  ) => {
    try {
      await move.mutateAsync({
        materialId,
        chapterId: targetChapterId,
        fromChapterId: fromChapterId ?? undefined,
      })
    } catch (err) {
      toast.error(api.getErrorMessage(err))
    }
  }

  const renderMaterial = (m: Material) => (
    <div
      key={m.id}
      draggable
      onDragStart={(e) => {
        setDragMaterial({ id: m.id, fromChapterId: m.chapterId ?? null })
        e.dataTransfer.setData("text/plain", m.id)
      }}
      onDragEnd={() => setDragMaterial(null)}
      className="group flex items-center justify-between gap-sm rounded-md bg-surface-container-low px-sm py-2 border border-outline-variant/60 hover:border-primary/40 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
          description
        </span>
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-on-surface truncate">
            {m.title}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {new Date(m.createdAt).toLocaleDateString()}
            {m.assignmentId ? " · attached to assignment" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {m.fileUrl && (
          <button
            type="button"
            title="Download"
            onClick={() => handleViewMaterial(m.id)}
            className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={() =>
            setConfirmDelete({ kind: "material", id: m.id, title: m.title })
          }
          className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sub text-headline-sub text-on-surface">
          Materials
        </h3>
        <Button
          type="button"
          onClick={() => setIsCreating((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 h-auto rounded-md bg-primary text-on-primary font-body-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Chapter
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-sm bg-surface-container-lowest rounded-lg p-md border border-outline-variant">
          <span className="material-symbols-outlined text-primary">menu_book</span>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Chapter title, e.g. Chapter 1 — Intro to Cells"
            className="flex-1 px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
            autoFocus
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!newTitle.trim() || create.isPending}
            className="h-auto px-md py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-colors disabled:opacity-50"
          >
            Create
          </Button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (e.dataTransfer.types.includes("Files")) setDragChapter(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragChapter(null)
          handleFiles(Array.from(e.dataTransfer.files))
        }}
        className="bg-surface-container-lowest rounded-lg p-md border-2 border-dashed border-outline-variant hover:border-primary/50 transition-colors"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
          <div className="flex-1">
            <h4 className="font-label-md text-label-md text-on-surface">
              Bulk Upload
            </h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Drop one or more PDFs anywhere here — or straight onto a chapter
              below. Full books are auto-split into chapters when detected.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="h-auto px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">folder_open</span>
              Browse files
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files))
            e.target.value = ""
          }}
        />

        {queued.length > 0 && (
          <div className="mt-md space-y-sm">
            <div className="flex flex-wrap gap-2">
              {queued.map((q, i) => (
                <div
                  key={`${q.file.name}-${i}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-sm py-1.5 border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    picture_as_pdf
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface max-w-[220px] truncate">
                    {q.file.name}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {q.chapterId ? "→ chapter" : "→ ungrouped"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQueued((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-on-surface-variant hover:text-error transition-colors"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => uploadQueued()}
              disabled={isUploading}
              className="h-auto px-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : `Upload ${queued.length} file${queued.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="mt-sm text-on-surface-variant">
            Uploading PDFs — titles come from file names and can be re-organized
            after upload…
          </div>
        )}
      </div>

      <div className="space-y-sm">
        {sortedChapters.map((chapter) => (
          <div
            key={chapter.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-chapter", chapter.id)
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragEnd={() => setDragMaterial(null)}
            onDragOver={(e) => {
              e.preventDefault()
              setDragChapter(chapter.id)
            }}
            onDragLeave={() => setDragChapter((c) => (c === chapter.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault()
              const chapterDrag = e.dataTransfer.getData("application/x-chapter")
              if (chapterDrag) {
                const fromIndex = sortedChapters.findIndex((c) => c.id === chapterDrag)
                const toIndex = sortedChapters.findIndex((c) => c.id === chapter.id)
                handleReorder(fromIndex, toIndex)
                return
              }
              if (e.dataTransfer.types.includes("Files")) {
                const files = Array.from(e.dataTransfer.files)
                setQueued((prev) => [
                  ...prev,
                  ...files.map((file) => ({ file, chapterId: chapter.id })),
                ])
                setDragChapter(null)
                return
              }
              if (dragMaterial) {
                handleMoveMaterial(dragMaterial.id, chapter.id, dragMaterial.fromChapterId)
                setDragMaterial(null)
              }
            }}
            className={cn(
              "rounded-lg border bg-surface-container-lowest transition-colors",
              dragChapter === chapter.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-outline-variant",
            )}
          >
            <div className="flex items-center gap-2 px-md py-sm">
              <span
                className="material-symbols-outlined text-on-surface-variant cursor-grab text-[18px]"
                title="Drag to reorder"
              >
                drag_handle
              </span>
              <button
                type="button"
                onClick={() => openChapter(chapter.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <span className="material-symbols-outlined text-primary">menu_book</span>
                {editingId === chapter.id ? (
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(chapter.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    onBlur={() => handleRename(chapter.id)}
                    className="flex-1 px-2 py-1 rounded border border-primary bg-surface-container-low font-label-md text-label-md text-on-surface focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="font-label-md text-label-md text-on-surface truncate">
                    {chapter.title}
                    <span className="text-on-surface-variant font-label-sm">
                      {"  "}· {chapter.materials.length}{" "}
                      {chapter.materials.length === 1 ? "file" : "files"}
                    </span>
                  </span>
                )}
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="Move up"
                  onClick={() => {
                    const idx = sortedChapters.findIndex((c) => c.id === chapter.id)
                    handleReorder(idx, idx - 1)
                  }}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  title="Move down"
                  onClick={() => {
                    const idx = sortedChapters.findIndex((c) => c.id === chapter.id)
                    handleReorder(idx, idx + 1)
                  }}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>
                <button
                  type="button"
                  title="Rename"
                  onClick={() => {
                    setEditingId(chapter.id)
                    setEditingValue(chapter.title)
                  }}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                  type="button"
                  title="Delete chapter"
                  onClick={() =>
                    setConfirmDelete({ kind: "chapter", id: chapter.id, title: chapter.title })
                  }
                  className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => openChapter(chapter.id)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                  title={expanded.has(chapter.id) ? "Collapse" : "Expand"}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px] transition-transform",
                      expanded.has(chapter.id) && "rotate-180",
                    )}
                  >
                    expand_more
                  </span>
                </button>
              </div>
            </div>
            {dragChapter === chapter.id && (
              <div className="mx-md mb-sm px-md py-sm rounded-md border-2 border-dashed border-primary bg-primary-fixed/10 text-center">
                <p className="font-label-sm text-label-sm text-primary">
                  Drop PDFs here to upload into this chapter
                </p>
              </div>
            )}
            {expanded.has(chapter.id) && chapter.materials.length > 0 && (
              <div className="px-md pb-md space-y-1.5">
                {chapter.materials.map(renderMaterial)}
              </div>
            )}
            {expanded.has(chapter.id) && chapter.materials.length === 0 && (
              <div className="px-md pb-md">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  No files yet — drop a PDF onto this chapter to add one.
                </p>
              </div>
            )}
          </div>
        ))}

        {sortedChapters.length === 0 && (
          <EmptyState
            icon="menu_book"
            title="No chapters yet"
            description="Upload a full book and chapters are detected automatically, or create one manually."
          />
        )}
      </div>

      <div className="space-y-sm">
        <div className="flex items-center gap-2">
          <h4 className="font-label-md text-label-md text-on-surface-variant">
            Ungrouped ({unassigned.length})
          </h4>
        </div>
        {unassigned.length > 0 ? (
          <div
            className="grid gap-1.5 p-md bg-surface-container-lowest rounded-lg border border-outline-variant"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragMaterial) {
                handleMoveMaterial(dragMaterial.id, null, dragMaterial.fromChapterId)
                setDragMaterial(null)
              }
            }}
          >
            {unassigned.map((m) => (
              <div key={m.id}>
                {renderMaterial({ ...m, chapterId: null })}
              </div>
            ))}
            <p className="font-label-sm text-label-sm text-on-surface-variant pt-sm">
              Drag a file onto a chapter to group it there — or drop one here to
              ungroup it.
            </p>
          </div>
        ) : (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Everything is organized — nothing ungrouped.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete?.kind === "chapter"}
        title={`Delete chapter "${confirmDelete?.title ?? ""}"?`}
        message="The files inside will become ungrouped and stay available."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={handleDeleteChapter}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmDelete?.kind === "material"}
        title={`Delete "${confirmDelete?.title ?? ""}"?`}
        message="This permanently removes the file and its embedded content."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={false}
        onConfirm={handleDeleteMaterial}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}