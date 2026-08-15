import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ChapterCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (title: string, files: File[]) => Promise<void>
  isSubmitting?: boolean
}

export function ChapterCreateDialog({
  open,
  onOpenChange,
  onCreate,
  isSubmitting = false,
}: ChapterCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [lastOpen, setLastOpen] = useState(open)
  const inputRef = useRef<HTMLInputElement>(null)

  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setTitle("")
      setFiles([])
      setDragging(false)
    }
  }

  const handleFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.type.includes("pdf"))
    if (valid.length !== incoming.length) {
      toast.warning("Only PDF files can be uploaded")
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid])
    }
  }, [])

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || isSubmitting) return
    await onCreate(trimmed, files)
  }

  const canSubmit = title.trim().length > 0 && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Chapter</DialogTitle>
          <DialogDescription>
            Name the chapter and upload its PDFs — or create it empty and add
            files later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-md">
          <div>
            <label
              htmlFor="chapter-title"
              className="font-label-md text-label-md text-on-surface block mb-1"
            >
              Chapter title
            </label>
            <input
              id="chapter-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              placeholder="e.g. Chapter 1 — Intro to Cells"
              className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <span className="font-label-md text-label-md text-on-surface block mb-1">
              PDFs (optional)
            </span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFiles(Array.from(e.dataTransfer.files))
              }}
              className={cn(
                "rounded-lg border-2 border-dashed px-md py-lg text-center cursor-pointer transition-colors",
                dragging
                  ? "border-primary bg-primary-fixed/10"
                  : "border-outline-variant hover:border-primary/50",
              )}
            >
              <span className="material-symbols-outlined text-[28px] text-on-surface-variant block mb-1">
                upload_file
              </span>
              <p className="font-label-md text-label-md text-on-surface">
                Drop PDFs here, or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                Files are uploaded into this chapter right after it is created.
              </p>
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
            </div>

            {files.length > 0 && (
              <div className="mt-sm space-y-1.5">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg bg-surface-container px-sm py-1.5 border border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      picture_as_pdf
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface flex-1 min-w-0 truncate">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-on-surface-variant hover:text-error transition-colors"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-auto px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="h-auto px-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? "Creating..."
              : files.length > 0
                ? `Create & upload ${files.length} file${files.length !== 1 ? "s" : ""}`
                : "Create chapter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}