import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useMaterialChapters } from "@/hooks/use-materials"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ViewerState {
 material: api.Material
 kind: "pdf" | "text"
 url?: string
 text?: string
 loading: boolean
}

export function StudentMaterialsPage() {
 const { classId } = useParams<{ classId: string }>()
 const { user } = useAuth()

 const [viewer, setViewer] = useState<ViewerState | null>(null)

 const { data: studentClasses, isLoading: classesLoading } = useQuery({
  queryKey: ["student", "courses", user?.id],
  queryFn: () => api.getStudentCourses(user!.id),
  enabled: !!user?.id,
 })

 const { chapters, unassigned, isLoading: materialsLoading } = useMaterialChapters(classId ?? "")

 const cls = studentClasses?.find((c) => c.id === classId)

 const isPdf = (m: api.Material) => m.fileUrl?.toLowerCase().endsWith(".pdf") ?? false

 const download = async (material: api.Material) => {
  try {
   const blob = await api.downloadMaterialFile(material.id)
   const url = URL.createObjectURL(blob)
   const a = document.createElement("a")
   a.href = url
   a.download = `${material.title}.${isPdf(material) ? "pdf" : "txt"}`
   document.body.appendChild(a)
   a.click()
   a.remove()
   URL.revokeObjectURL(url)
  } catch (err) {
   toast.error(`${material.title}: ${api.getErrorMessage(err)}`)
  }
 }

 const view = async (material: api.Material) => {
  if (isPdf(material)) {
   setViewer({ material, kind: "pdf", loading: true })
   try {
    const url = await api.getMaterialFileUrl(material.id)
    setViewer({ material, kind: "pdf", url, loading: false })
   } catch (err) {
    setViewer(null)
    toast.error(`${material.title}: ${api.getErrorMessage(err)}`)
   }
   return
  }
  setViewer({ material, kind: "text", loading: true })
  try {
   const blob = await api.downloadMaterialFile(material.id)
   const text = await blob.text()
   setViewer({ material, kind: "text", text, loading: false })
  } catch (err) {
   setViewer(null)
   toast.error(`${material.title}: ${api.getErrorMessage(err)}`)
  }
 }

 if (classesLoading || materialsLoading) {
  return (
   <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
    <LoadingState label="Loading materials..." />
   </div>
  )
 }

 if (!cls) {
  return (
   <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
    <EmptyState icon="school" title="Section not found" description="This section doesn't exist or you're not enrolled." />
   </div>
  )
 }

 const estimateStudyMinutes = (m: api.Material): number | null => {
  const chunks = m._count?.chunks ?? 0
  if (!chunks) return null
  return Math.max(1, Math.round(chunks * 2))
 }

 const renderMaterialCard = (m: api.Material, chapterTitle?: string) => {
  const chunkCount = m._count?.chunks ?? 0
  const minutes = estimateStudyMinutes(m)

  return (
   <div
    key={m.id}
    className="w-full rounded-xl bg-surface-container-lowest p-lg border border-border hover:border-primary/40 hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center gap-4"
   >
    <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 flex items-center justify-center shrink-0">
     <span className="material-symbols-outlined text-[24px] text-primary">
      {isPdf(m) ? "picture_as_pdf" : "description"}
     </span>
    </div>

    <div className="flex-1 min-w-0">
     <p className="font-body-lg text-body-lg font-medium text-on-surface leading-snug">
      {m.title}
     </p>
     <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
      <Badge
       variant="outline"
       className="rounded-lg px-2 py-0.5 font-label-sm text-label-sm text-primary border-primary/30 bg-primary-fixed/20"
      >
       {isPdf(m) ? "PDF" : "Text file"}
      </Badge>
      {chapterTitle && (
       <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">menu_book</span>
        {chapterTitle}
       </span>
      )}
      <span className="font-label-sm text-label-sm text-on-surface-variant">
       Uploaded {new Date(m.createdAt).toLocaleDateString()}
      </span>
      {chunkCount > 0 && (
       <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">segment</span>
        {chunkCount} content section{chunkCount !== 1 ? "s" : ""}
       </span>
      )}
      {minutes !== null && (
       <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        ~{minutes} min to study
       </span>
      )}
      {m.assignmentId && (
       <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary">
        <span className="material-symbols-outlined text-[16px]">assignment</span>
        attached to assignment
       </span>
      )}
     </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
     <Button variant="ghost" className="rounded-lg" onClick={() => view(m)}>
      <span className="material-symbols-outlined text-[18px]">visibility</span>
      View
     </Button>
     <Button variant="outline" className="rounded-lg" onClick={() => download(m)}>
      <span className="material-symbols-outlined text-[18px]">download</span>
      Download
     </Button>
    </div>
   </div>
  )
 }

 return (
  <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
   <div className="flex items-center gap-3 mb-4">
    <Link
     to={`/student/classes/${classId}`}
     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
    >
     <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
    </Link>
    <h1 className="font-headline-lg text-headline-lg text-primary">{cls.name}</h1>
    <Link
     to={`/student/homework-help?course=${classId}`}
     className="ml-auto inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-md py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shrink-0"
    >
     <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
     Ask AI
    </Link>
   </div>

   <p className="font-body-md text-body-md text-on-surface-variant mb-6">
    Course materials, organized by chapter. View any file inline or download it — files marked “attached to assignment” are also part of an assignment's assets.
   </p>

   {cls.materialTitles.length === 0 && unassigned.length === 0 ? (
    <EmptyState
     icon="folder"
     title="No materials yet"
     description="Your teacher hasn't uploaded any materials for this section yet."
    />
   ) : (
    <div className="space-y-md">
     {chapters.map((chapter) => (
      <section
       key={chapter.id}
       className="rounded-lg bg-background p-md border border-border"
      >
       <h2 className="font-headline-sub text-headline-sub text-primary mb-sm">
        {chapter.title}
        <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">
         {chapter.materials.length} file{chapter.materials.length !== 1 ? "s" : ""}
        </span>
       </h2>
       {chapter.materials.length === 0 ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
         No files in this chapter yet.
        </p>
       ) : (
        <div className="grid gap-3">
         {chapter.materials.map((m) => renderMaterialCard(m, chapter.title))}
        </div>
       )}
      </section>
     ))}

     {unassigned.length > 0 && (
      <section className="rounded-lg bg-background p-md border border-border">
       <h2 className="font-headline-md text-headline-md text-primary mb-sm flex items-center gap-2">
        <span
         className={cn(
          "inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-lg",
          "bg-surface-container-high text-on-surface-variant",
         )}
        >
         General
        </span>
       </h2>
       <div className="grid gap-3">
        {unassigned.map((m) => renderMaterialCard(m))}
       </div>
      </section>
     )}
    </div>
   )}

   <div className="mt-6 flex justify-end">
    <Button
     asChild
     variant="outline"
     className="rounded-lg"
    >
     <Link to={`/student/classes/${classId}`}>
      Back to class
     </Link>
    </Button>
   </div>

   <Dialog open={viewer !== null} onOpenChange={(open) => !open && setViewer(null)}>
    <DialogContent className="max-w-4xl">
     <DialogHeader>
      <DialogTitle className="font-headline-md text-headline-md text-on-surface pr-8">
       {viewer?.material.title}
      </DialogTitle>
      <DialogDescription className="font-label-sm text-label-sm text-on-surface-variant">
       {viewer?.kind === "pdf" ? "PDF document" : "Text file"} · {cls?.name}
      </DialogDescription>
     </DialogHeader>
     {viewer?.loading ? (
      <div className="h-[70vh] flex items-center justify-center">
       <LoadingState label="Loading document..." />
      </div>
     ) : viewer?.kind === "pdf" && viewer.url ? (
      <iframe
       src={viewer.url}
       title={viewer.material.title}
       className="w-full h-[70vh] rounded-lg border border-border bg-background"
      />
     ) : viewer?.kind === "text" ? (
      <pre className="w-full h-[70vh] overflow-auto rounded-lg border border-border bg-surface-container-lowest p-4 font-mono text-sm text-on-surface whitespace-pre-wrap">
       {viewer.text}
      </pre>
     ) : null}
     {viewer && !viewer.loading && (
      <div className="flex justify-end">
       <Button className="rounded-lg" onClick={() => download(viewer.material)}>
        <span className="material-symbols-outlined text-[18px]">download</span>
        Download
       </Button>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 )
}