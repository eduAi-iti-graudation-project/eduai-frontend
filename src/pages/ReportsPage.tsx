import { useState } from "react"
import { useReports } from "@/hooks/use-reports"
import { EmptyState } from "@/components/ui/EmptyState"

export function ReportsPage() {
  const [studentId, setStudentId] = useState("")
  const [search, setSearch] = useState("")
  const { reports, isLoading } = useReports(studentId || undefined)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-xl">Reports</h1>

      <div className="bg-white rounded-[32px] p-md shadow-sm border border-outline-variant/10 mb-xl">
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Filter by Student ID</label>
        <div className="flex gap-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter student ID..."
            className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
          />
          <button
            onClick={() => setStudentId(search)}
            className="px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full nudge-hover"
          >
            Filter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-xl">
          <p className="font-body-md text-body-md text-on-surface-variant">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon="description" title="No reports found" description={studentId ? "No reports for this student yet." : "Enter a student ID to view their reports."} />
      ) : (
        <div className="space-y-sm">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-[24px] shadow-sm border border-outline-variant/10 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="w-full flex items-center justify-between p-md hover:bg-surface-container transition-colors text-left"
              >
                <div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <h3 className="font-label-md text-label-md text-on-surface">{(r as any).title ?? "Report"}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: expandedId === r.id ? "rotate(180deg)" : "" }}>
                  expand_more
                </span>
              </button>
              {expandedId === r.id && (
                <div className="px-md pb-md space-y-sm">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(r as any).sections?.map((s: any, i: number) => (
                    <div key={i} className="p-sm rounded-xl bg-surface-container">
                      <p className="font-label-sm text-label-sm text-primary mb-xs">{s.heading ?? s.title ?? `Section ${i + 1}`}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{s.content}</p>
                    </div>
                  ))}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {!(r as any).sections && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No sections available.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
