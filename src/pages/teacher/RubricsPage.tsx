import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { useRubrics } from "@/hooks/use-rubrics"

export function RubricsPage() {
  const { rubrics, isLoading, confirmRubric, importRubricPdf } = useRubrics()
  const [showImport, setShowImport] = useState(false)

  function handlePdfImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    importRubricPdf.mutate(fd, {
      onSuccess: () => setShowImport(false),
    })
    e.target.value = ""
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20 sticky top-0 z-30">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Rubrics</h1>
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-primary text-on-primary rounded-xl px-4 py-2 font-label-sm text-label-sm flex items-center gap-1 transition-all hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Import PDF
          </button>
        </header>

        <div className="flex-1 p-md">
          {showImport && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="upload-zone rounded-[24px] p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface mb-1">
                  Upload a PDF rubric to extract criteria
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">
                  The AI will parse the document and extract all grading criteria automatically.
                </p>
                <label className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-xl px-6 py-3 font-label-md text-label-md cursor-pointer transition-all hover:opacity-90">
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Select PDF
                  <input type="file" accept=".pdf" onChange={handlePdfImport} className="hidden" />
                </label>
                {importRubricPdf.isPending && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
                    Extracting criteria from PDF...
                  </p>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-body-md text-body-md text-on-surface-variant">Loading rubrics...</p>
            </div>
          ) : rubrics.data?.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">checklist</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-2">No rubrics yet</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Create a rubric from the assignment detail page or import from PDF.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {rubrics.data?.map((rubric) => (
                <div key={rubric.id} className="tactile-card rounded-[24px] bg-surface-container-lowest p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">{rubric.title}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {rubric.criteria.length} criteria
                        {rubric.isConfirmed ? (
                          <span className="ml-2 text-primary font-medium">● Confirmed</span>
                        ) : null}
                      </p>
                    </div>
                    {!rubric.isConfirmed && (
                      <button
                        onClick={() => confirmRubric.mutate(rubric.id)}
                        disabled={confirmRubric.isPending}
                        className="bg-primary text-on-primary rounded-xl px-4 py-2 font-label-sm text-label-sm transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {rubric.criteria.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-2">
                        <span className="font-body-md text-body-md text-on-surface">{c.description}</span>
                        <span className="font-label-md text-label-md text-on-surface-variant shrink-0 ml-4">
                          {c.maxPoints} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
