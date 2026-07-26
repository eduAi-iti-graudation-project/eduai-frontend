import { useState, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useSubmissionDetail } from "@/hooks/use-submissions"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import { toast } from "sonner"
import type { SubmissionStatus } from "@/components/ui/StatusBadge"

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState<Record<string, { pointsAwarded: number; teacherNotes: string }>>({})

  const { data: sub, isLoading, isError } = useSubmissionDetail(id ?? "")

  const confirmAll = useMutation({
    mutationFn: () => api.confirmAllGrades(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submission", id] })
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("All grades confirmed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handlePointsChange = (scoreId: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [scoreId]: { ...prev[scoreId], pointsAwarded: value },
    }))
  }

  const handleNotesChange = (scoreId: string, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [scoreId]: { ...prev[scoreId], teacherNotes: value },
    }))
  }

  const handleConfirmAll = async () => {
    if (!id) return
    const entry = Object.entries(edits)
    if (entry.length > 0) {
      for (const [scoreId, data] of entry) {
        await api.confirmGrade(scoreId, {
          pointsAwarded: data.pointsAwarded,
          teacherNotes: data.teacherNotes || undefined,
        })
      }
      queryClient.invalidateQueries({ queryKey: ["submission", id] })
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
    }
    await confirmAll.mutateAsync()
  }

  const mergedScores = useMemo(() => {
    if (!sub?.scores) return []
    return sub.scores.map((s) => ({
      ...s,
      pointsAwarded: edits[s.id]?.pointsAwarded ?? s.pointsAwarded,
      teacherNotes: edits[s.id]?.teacherNotes ?? s.teacherNotes ?? "",
    }))
  }, [sub, edits])

  const isReadOnly = sub?.status === "CONFIRMED"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (isError || !sub) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <EmptyState icon="error" title="Submission not found" description="This submission may have been deleted." />
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <Link to={sub.assignmentId ? `/assignments/${sub.assignmentId}` : "/submissions"} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors mb-md">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Assignment
      </Link>

      {/* Status-specific banner */}
      {(sub.status === "SUBMITTED" || sub.status === "GRADING_IN_PROGRESS") && (
        <div className="bg-primary-fixed/20 rounded-3xl p-xl mb-xl border border-primary-fixed/30 flex items-center gap-md">
          <span className="material-symbols-outlined text-[32px] text-primary">hourglass_top</span>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-xs">Grading in Progress</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {sub.status === "SUBMITTED"
                ? "This submission has been submitted and is waiting for AI review to complete."
                : "The AI is currently reviewing this submission. Scores will appear here once ready."}
            </p>
          </div>
        </div>
      )}

      {sub.status === "REVIEW_READY" && (
        <div className="bg-secondary-fixed/20 rounded-3xl p-xl mb-xl border border-secondary-fixed/30 flex items-center gap-md">
          <span className="material-symbols-outlined text-[32px] text-secondary">rate_review</span>
          <div>
            <h2 className="font-headline-md text-headline-md text-secondary mb-xs">Ready for Review</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">AI grading is complete. Review the suggested scores below, make any adjustments, then confirm.</p>
          </div>
        </div>
      )}

      {sub.status === "CONFIRMED" && (
        <div className="bg-primary-container/20 rounded-3xl p-xl mb-xl border border-primary-container/30 flex items-center gap-md">
          <span className="material-symbols-outlined text-[32px] text-primary">check_circle</span>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-xs">Confirmed</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">These grades have been confirmed and are visible to the student.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-xl">
        {/* Left panel — Student & Content */}
        <div className="lg:col-span-3 space-y-md">
          <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-md mb-lg">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white font-bold font-label-md">{(sub as any).student?.name?.[0] ?? "S"}</div>
              <div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <h3 className="font-headline-md text-headline-md text-primary">{(sub as any).student?.name ?? "Student"}</h3>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="font-label-sm text-label-sm text-on-surface-variant">{(sub as any).student?.email ?? ""}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={sub.status as SubmissionStatus} />
              </div>
            </div>

            {sub.assignment && (
              <div className="bg-surface-container-low rounded-2xl p-md mb-lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Assignment</p>
                <p className="font-label-md text-label-md text-on-surface">{sub.assignment.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Due {new Date(sub.assignment.dueDate).toLocaleDateString()} &bull; {sub.assignment.totalPoints} pts
                </p>
              </div>
            )}

            <h4 className="font-label-md text-label-md text-primary mb-md">Submission Content</h4>
            {sub.chunks && sub.chunks.length > 0 ? (
              <div className="space-y-sm">
                {sub.chunks.map((chunk, i) => (
                  <div key={chunk.id} className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/10">
                    {sub.chunks && sub.chunks.length > 1 && (
                      <p className="font-label-sm text-label-sm text-primary mb-xs">Part {i + 1}</p>
                    )}
                    <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{chunk.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant italic">No submission content available.</p>
            )}
          </div>
        </div>

        {/* Right panel — Scores */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-white rounded-[32px] p-xl shadow-sm border border-outline-variant/10">
            <h3 className="font-headline-md text-headline-md text-primary mb-lg">Scores</h3>

            {(sub.status === "SUBMITTED" || sub.status === "GRADING_IN_PROGRESS") && (
              <div className="flex flex-col items-center justify-center py-xl text-center">
                <span className="material-symbols-outlined text-[48px] text-primary mb-md animate-pulse">hourglass_empty</span>
                <p className="font-body-md text-body-md text-on-surface-variant">AI grading in progress...</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">Scores will appear here once the AI review is complete.</p>
              </div>
            )}

            {sub.status !== "SUBMITTED" && sub.status !== "GRADING_IN_PROGRESS" && mergedScores.length === 0 && (
              <div className="flex flex-col items-center justify-center py-xl text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-md">info</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No scores available</p>
              </div>
            )}

            {(sub.status === "REVIEW_READY" || sub.status === "CONFIRMED") && mergedScores.length > 0 && (
              <div className="space-y-md">
                {mergedScores.map((score) => (
                  <div key={score.id} className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/10 space-y-sm">
                    <div className="flex items-start justify-between gap-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface">{score.criterion.description}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Max {score.criterion.maxPoints} pts</p>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-primary whitespace-nowrap">{score.pointsAwarded}/{score.criterion.maxPoints}</span>
                    </div>

                    {score.aiFeedback && (
                      <div className="bg-primary-fixed/10 rounded-xl p-sm">
                        <p className="font-label-sm text-label-sm text-primary mb-xs">AI Feedback</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{score.aiFeedback}</p>
                      </div>
                    )}

                    {isReadOnly ? (
                      score.teacherNotes && (
                        <div className="bg-surface-container-high rounded-xl p-sm">
                          <p className="font-label-sm text-label-sm text-primary mb-xs">Teacher Notes</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{score.teacherNotes}</p>
                        </div>
                      )
                    ) : (
                      <div className="space-y-sm pt-sm border-t border-outline-variant/10">
                        <div>
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">Points Awarded</label>
                          <input
                            type="number"
                            min={0}
                            max={score.criterion.maxPoints}
                            value={score.pointsAwarded}
                            onChange={(e) => handlePointsChange(score.id, Number(e.target.value))}
                            className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface form-input-focus"
                          />
                        </div>
                        <div>
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">Teacher Notes</label>
                          <textarea
                            rows={2}
                            value={score.teacherNotes}
                            onChange={(e) => handleNotesChange(score.id, e.target.value)}
                            placeholder="Add notes for the student..."
                            className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface form-input-focus resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div className="bg-primary-container/10 rounded-2xl p-md border border-primary-container/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-primary font-bold">Total</span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {mergedScores.reduce((a, s) => a + s.pointsAwarded, 0)} / {mergedScores.reduce((a, s) => a + s.criterion.maxPoints, 0)} pts
                    </span>
                  </div>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={handleConfirmAll}
                    disabled={confirmAll.isPending}
                    className="w-full flex items-center justify-center gap-xs px-md py-sm bg-primary-container text-white font-label-md text-label-md rounded-full shadow-lg nudge-hover active:scale-95 disabled:opacity-50"
                  >
                    {confirmAll.isPending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">check_circle</span>Confirm All Grades</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
