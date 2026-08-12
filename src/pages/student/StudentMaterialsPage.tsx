import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useMaterialChapters } from "@/hooks/use-materials"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function StudentMaterialsPage() {
  const { classId } = useParams<{ classId: string }>()
  const { user } = useAuth()

  const { data: studentClasses, isLoading: classesLoading } = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const { chapters, unassigned, isLoading: materialsLoading } = useMaterialChapters(classId ?? "")

  const cls = studentClasses?.find((c) => c.id === classId)

  const handleDownload = async (materialId: string, title: string) => {
    try {
      const url = await api.getMaterialFileUrl(materialId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(`${title}: ${api.getErrorMessage(err)}`)
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

  const allMaterials = chapters.flatMap((c) =>
    c.materials.map((m) => ({ ...m, chapterTitle: c.title })),
  )

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
      </div>

      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Course materials, organized by chapter. Download any file — files marked “attached to assignment” are also part of an assignment's assets.
      </p>

      {allMaterials.length === 0 && unassigned.length === 0 ? (
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
              className="rounded-lg bg-white p-md border border-border"
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
                <div className="grid gap-2">
                  {chapter.materials.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleDownload(m.id, m.title)}
                      className="w-full text-left flex items-center gap-3 rounded-lg bg-surface-container-low p-md border border-border hover:border-primary/40 hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body-medium text-sm text-on-surface truncate">{m.title}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {new Date(m.createdAt).toLocaleDateString()}
                          {m.assignmentId ? " · attached to assignment" : ""}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                        download
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ))}

          {unassigned.length > 0 && (
            <section className="rounded-lg bg-white p-md border border-border">
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
              <div className="grid gap-2">
                {unassigned.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleDownload(m.id, m.title)}
                    className="w-full text-left flex items-center gap-3 rounded-md bg-surface-container p-md border border-border hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-medium text-sm text-on-surface truncate">{m.title}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                      download
                    </span>
                  </button>
                ))}
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
    </div>
  )
}