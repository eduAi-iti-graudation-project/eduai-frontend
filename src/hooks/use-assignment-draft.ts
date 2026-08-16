import { useCallback, useState } from "react"
import type { TargetOffering } from "@/components/quiz/QuizTargetPicker"
import type { AssignmentType, GeneratedAssignmentWithRubric } from "@/lib/api"

const DRAFT_KEY = "eduai_assignment_draft"

export interface AssignmentDraftSession {
  courseId: string
  targets: TargetOffering[]
  chapterId: string | null
  scopeTitle: string | null
  assignmentType: AssignmentType
  dueDate: string
  draft: GeneratedAssignmentWithRubric
}

export function readAssignmentDraft(): AssignmentDraftSession | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AssignmentDraftSession
    if (!parsed.courseId || !parsed.draft || !parsed.draft.assignment) return null
    return parsed
  } catch {
    return null
  }
}

function writeAssignmentDraft(session: AssignmentDraftSession | null) {
  try {
    if (session) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // storage unavailable — the review flow just won't restore the draft
  }
}

export function useAssignmentDraft() {
  const [session, setSession] = useState<AssignmentDraftSession | null>(() =>
    readAssignmentDraft(),
  )

  const store = useCallback((next: AssignmentDraftSession) => {
    writeAssignmentDraft(next)
    setSession(next)
  }, [])

  const clear = useCallback(() => {
    writeAssignmentDraft(null)
    setSession(null)
  }, [])

  return { session, store, clear }
}