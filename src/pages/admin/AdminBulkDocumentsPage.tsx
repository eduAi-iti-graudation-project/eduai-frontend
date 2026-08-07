import { useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StudentSelectCombobox, type StudentOption } from "@/components/ui/StudentSelectCombobox"
import { cn } from "@/lib/utils"

const categoryLabels: Record<api.StudentDocumentCategory, string> = {
  BIRTH_CERTIFICATE: "Birth certificate",
  IMMUNIZATION_RECORD: "Immunization record",
  PREVIOUS_TRANSCRIPT: "Previous transcript",
  PAYMENT_RECEIPT: "Payment receipt",
  ID_DOCUMENT: "ID document",
  OTHER: "Other",
}

const categories = Object.keys(categoryLabels) as api.StudentDocumentCategory[]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function fmtBytes(bytes: number | null) {
  if (bytes === null || bytes === undefined) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function confidenceLabel(confidence: number | null): string | null {
  if (confidence === null) return null
  if (confidence >= 0.95) return "Very confident"
  if (confidence >= 0.75) return "Confident"
  return "Low confidence"
}

interface PendingRowState {
  category: api.StudentDocumentCategory
  student: StudentOption | null
}

export function AdminBulkDocumentsPage() {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [edits, setEdits] = useState<Record<string, PendingRowState>>({})

  const pendingQ = useQuery({
    queryKey: ["documents", "bulk"],
    queryFn: () => api.listBulkDocuments(),
  })

  const searchStudents = async (q: string): Promise<StudentOption[]> => {
    const rows = await api.getUsers({ role: "STUDENT", q, take: 20 })
    return rows.map(({ id, name, email }) => ({ id, name, email }))
  }

  const uploadM = useMutation({
    mutationFn: () => api.bulkUploadStudentDocuments(selectedFiles),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["documents", "bulk"] })
      setSelectedFiles([])
      if (result.created.length > 0) {
        toast.success(`${result.created.length} file${result.created.length === 1 ? "" : "s"} uploaded for review`)
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} file${result.failed.length === 1 ? "" : "s"} could not be uploaded`)
      }
    },
    onError: () => toast.error("Could not upload the files"),
  })

  const confirmM = useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: { studentId: string; category: api.StudentDocumentCategory } }) =>
      api.confirmDocumentAssignment(documentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", "bulk"] })
      toast.success("Document filed")
    },
    onError: () => toast.error("Could not file this document"),
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).filter(
      (f) => /\.(pdf|png|jpg|jpeg|webp|txt)$/i.test(f.name),
    )
    if (next.length === 0) {
      toast.error("Only PDF, image or text files are accepted")
      return
    }
    setSelectedFiles((prev) => [...prev, ...next])
    if (inputRef.current) inputRef.current.value = ""
  }

  const resolveStudent = (doc: api.StudentDocument): StudentOption | null => {
    const edit = edits[doc.id]
    if (edit?.student !== undefined) return edit.student
    return doc.aiSuggestedStudent ?? null
  }

  const canConfirm = (doc: api.StudentDocument): boolean => {
    return !!resolveStudent(doc)
  }

  return (
    <div className="px-6 pb-10">
      <PageHeader
        title="Document intake"
        subtitle="Upload student records in bulk — AI suggests a category and a student match for every file, and you confirm before anything is filed."
      />

      <section className="rounded-2xl bg-surface-container-lowest border border-border p-6 mb-6">
        <h2 className="font-label-md text-label-md text-on-surface font-medium mb-1">1 · Upload files</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          Nothing is filed until you review and confirm each file. Files without a readable text layer are listed for manual review.
        </p>
        <label
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all",
            isDragging ? "border-primary bg-primary-container/40" : "border-outline-variant hover:border-primary hover:bg-surface-container-low",
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="material-symbols-outlined text-[32px] text-primary">folder_upload</span>
          <span className="font-label-md text-label-md text-on-surface">
            {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected` : "Drag files here or click to browse"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">PDF, images or text · up to 20MB each · multiple files allowed</span>
        </label>

        {selectedFiles.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {selectedFiles.map((f, i) => (
              <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">description</span>
                {f.name}
                <button
                  type="button"
                  className="text-on-surface-variant hover:text-error"
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}
            <Button
              type="button"
              onClick={() => uploadM.mutate()}
              disabled={uploadM.isPending}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md h-auto py-sm px-md"
            >
              {uploadM.isPending ? "Uploading…" : "Upload for review"}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-surface-container-lowest border border-border p-6">
        <h2 className="font-label-md text-label-md text-on-surface font-medium mb-1">2 · Review &amp; confirm</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          AI-suggested values are marked with a sparkle. Change them if needed, then file each document. Unmatched files stay unassigned until a student is chosen.
        </p>

        {pendingQ.isLoading ? (
          <LoadingState label="Loading pending documents…" />
        ) : pendingQ.isError ? (
          <ErrorState message="Could not load pending documents." onRetry={() => pendingQ.refetch()} />
        ) : (pendingQ.data ?? []).length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="Nothing waiting for review"
            description="Uploaded documents will appear here with their AI suggestions."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low">
                  <TableHead className="font-label-sm text-label-sm text-on-surface-variant">File</TableHead>
                  <TableHead className="font-label-sm text-label-sm text-on-surface-variant">AI category</TableHead>
                  <TableHead className="font-label-sm text-label-sm text-on-surface-variant">AI student match</TableHead>
                  <TableHead className="font-label-sm text-label-sm text-on-surface-variant">Confirm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingQ.data ?? []).map((doc) => {
                  const edit = edits[doc.id]
                  const category = edit?.category ?? doc.aiSuggestedCategory ?? "OTHER"
                  const student = resolveStudent(doc)
                  const confidence = doc.aiMatchConfidence
                  return (
                    <TableRow key={doc.id} className="align-top">
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">description</span>
                          </span>
                          <div className="min-w-0">
                            <p className="font-label-md text-label-md text-on-surface truncate">{doc.fileName}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">{fmtBytes(doc.sizeBytes)} · uploaded {fmtDate(doc.createdAt)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[190px]">
                        <div className="flex items-center gap-1.5">
                          <Select value={category} onValueChange={(v) => setEdits((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], category: v as api.StudentDocumentCategory } }))}>
                            <SelectTrigger className="h-auto rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-label-sm text-label-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {doc.aiSuggestedCategory && !edit?.category ? (
                            <span className="material-symbols-outlined text-[16px] text-tertiary" title="AI suggested">auto_awesome</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-col gap-1">
                          <StudentSelectCombobox
                            value={student}
                            onChange={(s) =>
                              setEdits((prev) => ({
                                ...prev,
                                [doc.id]: { ...prev[doc.id], student: s },
                              }))
                            }
                            searchFn={searchStudents}
                          />
                          {student?.id === doc.aiSuggestedStudentId ? (
                            <Badge variant="secondary" className="w-fit rounded-md bg-tertiary-container text-on-tertiary-container border-0 font-label-sm text-label-sm">
                              <span className="material-symbols-outlined text-[12px] mr-1">auto_awesome</span>
                              AI · {confidenceLabel(confidence) ?? `${Math.round((confidence ?? 0) * 100)}%`}
                            </Badge>
                          ) : doc.aiSuggestedStudentId && !student ? (
                            <span className="font-label-sm text-label-sm text-on-tertiary-fixed">Unmatched — choose a student manually</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!canConfirm(doc) || confirmM.isPending}
                          onClick={() =>
                            confirmM.mutate({ documentId: doc.id, data: { studentId: student!.id, category } })
                          }
                          className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md"
                        >
                          File document
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
