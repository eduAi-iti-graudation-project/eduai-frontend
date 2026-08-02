import { useState, useMemo } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

interface LocalCriterion {
  id: string
  description: string
  maxPoints: number
}

let critIdCounter = 0
function freshCritId() {
  critIdCounter += 1
  return `crit_${critIdCounter}`
}

export function RubricConfirmPage() {
  const { rubricId } = useParams<{ rubricId: string }>()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get("classId")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [edits, setEdits] = useState<{ title?: string; criteria?: LocalCriterion[] }>({})

  const { data: rubric, isLoading } = useQuery({
    queryKey: ["rubric", rubricId],
    queryFn: () => api.getRubric(rubricId!),
    enabled: !!rubricId,
  })

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (edits.title !== undefined || edits.criteria !== undefined) {
        await api.updateRubric(rubricId!, {
          ...(edits.title !== undefined ? { title: edits.title } : {}),
          ...(edits.criteria !== undefined ? { criteria: edits.criteria.map((c) => ({ id: c.id.startsWith("crit_") ? undefined : c.id, description: c.description, maxPoints: c.maxPoints })) } : {}),
        })
      }
      await api.confirmRubric(rubricId!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] })
      queryClient.invalidateQueries({ queryKey: ["rubric", rubricId] })
      toast.success("Rubric confirmed successfully")
      navigate(classId ? `/classes/${classId}` : "/rubrics")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const title = edits.title ?? rubric?.title ?? ""
  const criteria: LocalCriterion[] = useMemo(() => {
    if (edits.criteria) return edits.criteria
    return (rubric?.criteria ?? []).map((c) => ({ id: c.id, description: c.description, maxPoints: c.maxPoints }))
  }, [rubric, edits.criteria])

  function baseCriteria(): LocalCriterion[] {
    return (rubric?.criteria ?? []).map((c) => ({ id: c.id, description: c.description, maxPoints: c.maxPoints }))
  }

  function setTitle(v: string) {
    setEdits((prev) => ({ ...prev, title: v }))
  }

  function updateCriterion(id: string, field: "description" | "maxPoints", value: string | number) {
    setEdits((prev) => ({
      ...prev,
      criteria: (prev.criteria ?? baseCriteria()).map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))
  }

  function addCriterion() {
    setEdits((prev) => ({
      ...prev,
      criteria: [...(prev.criteria ?? baseCriteria()), { id: freshCritId(), description: "", maxPoints: 10 }],
    }))
  }

  function removeCriterion(id: string) {
    setEdits((prev) => ({
      ...prev,
      criteria: (prev.criteria ?? baseCriteria()).filter((c) => c.id !== id),
    }))
  }

  const totalPoints = criteria.reduce((sum, c) => sum + (c.maxPoints || 0), 0)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading rubric...</p>
      </div>
    )
  }

  if (!rubric) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">Rubric not found</p>
      </div>
    )
  }

  if (rubric.isConfirmed) {
    return (
      <div className="flex-1 p-margin-desktop max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-xl shadow-sm border border-outline-variant/10 space-y-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-background">{rubric.title}</h1>
              <p className="font-label-md text-label-md text-primary">Already confirmed</p>
            </div>
          </div>
          <div className="space-y-md">
            {rubric.criteria.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-md bg-surface-container-low rounded-2xl">
                <p className="font-body-md text-body-md text-on-surface flex-1">{c.description}</p>
                <span className="font-label-md text-label-md text-primary font-bold ml-4">{c.maxPoints} pts</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center p-md bg-surface-container-high rounded-2xl">
            <span className="font-label-md text-label-md text-on-surface font-bold">Total</span>
            <span className="font-headline-md text-headline-md text-primary">{rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} pts</span>
          </div>
          <button onClick={() => navigate(classId ? `/classes/${classId}` : "/rubrics")} className="w-full py-3 bg-primary-container text-white rounded-full font-label-md text-label-md">
            Back to Class
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-3xl p-xl shadow-sm border border-outline-variant/10 space-y-lg">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-background">Review & Confirm Rubric</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Review the criteria below, make any edits, then confirm when ready.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-background ml-1">Rubric Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-2xl p-4 font-body-md text-body-md transition-all"
            />
          </div>

          {criteria.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl">
              <div className="flex-1 space-y-2">
                <textarea
                  value={c.description}
                  onChange={(e) => updateCriterion(c.id, "description", e.target.value)}
                  rows={2}
                  className="w-full bg-white border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-xl p-3 font-body-md text-body-md transition-all resize-none"
                  placeholder="Criterion description..."
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={c.maxPoints || ""}
                    onChange={(e) => updateCriterion(c.id, "maxPoints", Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-24 bg-white border-2 border-transparent focus:border-primary-container focus:ring-0 rounded-xl p-2 font-body-md text-body-md text-center transition-all"
                    placeholder="pts"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">points</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCriterion(c.id)}
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error rounded-full hover:bg-error-container/30 transition-colors shrink-0 mt-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCriterion}
            className="flex items-center justify-center gap-sm py-sm px-md bg-secondary-container text-on-secondary-container rounded-full font-label-md text-label-md hover:opacity-90 transition-all active:scale-95 w-full"
          >
            <span className="material-symbols-outlined">add</span>
            Add Criterion
          </button>
        </div>

        <div className="flex justify-between items-center p-md bg-surface-container-high rounded-2xl">
          <span className="font-label-md text-label-md text-on-surface font-bold">Total</span>
          <span className="font-headline-md text-headline-md text-primary">{totalPoints} pts</span>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-md flex items-start gap-3">
          <span className="material-symbols-outlined text-warning shrink-0">warning</span>
          <div>
            <p className="font-label-md text-label-md text-on-surface font-bold">This action cannot be undone</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Confirming will generate embeddings for each criterion and make the rubric available for grading.</p>
          </div>
        </div>

        <button
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending || criteria.length === 0}
          className="w-full py-4 rounded-full font-headline-md text-headline-md font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FF6B5D", color: "#fff", border: "none" }}
        >
          {confirmMutation.isPending ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</>
          ) : (
            <><span className="material-symbols-outlined">check_circle</span>Confirm & Publish Rubric</>
          )}
        </button>
      </div>
    </div>
  )
}
