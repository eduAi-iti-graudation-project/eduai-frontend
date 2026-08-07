import { useState } from "react"
import { useReports } from "@/hooks/use-reports"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { renderReportSection } from "@/lib/report-sections"
import { RichText } from "@/components/shared/RichText"

export function ReportsPage() {
  const [studentId, setStudentId] = useState("")
  const [search, setSearch] = useState("")
  const { reports, isLoading } = useReports(studentId || undefined)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="flex-1 p-xl max-w-4xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-xl">Reports</h1>

      <div className="bg-surface-container-lowest rounded-lg p-md border border-outline-variant mb-xl">
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Filter by Student ID</label>
        <div className="flex gap-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter student ID..."
            className="flex-1 h-auto rounded-lg border border-outline-variant bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
          />
          <Button
            type="button"
            onClick={() => setStudentId(search)}
            className="px-md h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover"
          >
            Filter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState className="py-xl" />
      ) : reports.length === 0 ? (
        <EmptyState icon="description" title="No reports found" description={studentId ? "No reports for this student yet." : "Enter a student ID to view their reports."} />
      ) : (
        <div className="space-y-sm">
          {reports.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="w-full h-auto p-md flex items-center justify-between hover:bg-surface-container transition-colors text-left rounded-none"
              >
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface">Report</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Student {r.studentId.slice(0, 8)} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: expandedId === r.id ? "rotate(180deg)" : "" }}>
                  expand_more
                </span>
              </Button>
              {expandedId === r.id && (
                <div className="px-md pb-md space-y-sm">
                  {(
                    [
                      ["Teacher Section", r.teacherSection],
                      ["Parent Section", r.parentSection],
                      ["Management Section", r.managementSection],
                    ] as [string, unknown][]
                  ).map(([heading, content]) => (
                    <div key={heading} className="p-sm rounded-lg bg-surface-container">
                      <p className="font-label-sm text-label-sm text-primary mb-xs">{heading}</p>
                      <RichText text={renderReportSection(content)} className="text-on-surface-variant" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
