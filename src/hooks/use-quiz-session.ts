import { useCallback, useEffect, useRef, useState } from "react"
import { getErrorMessage } from "@/lib/api"
import * as api from "@/lib/api"

const SESSION_KEY = "eduai_quiz_session"

export interface QuizSessionState {
  attemptId: string
  quizId: string
  expiresAt: string | null
  serverNow: string
  startedAt: number
  answers: Record<string, string>
}

export type QuizPhase = "pre" | "active" | "expired" | "submitted"

function readSession(): QuizSessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizSessionState
    if (!parsed.attemptId || !parsed.quizId || !parsed.serverNow) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(state: QuizSessionState | null) {
  try {
    if (state) sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // storage unavailable — attempt still works, resume just won't
  }
}

interface ViolationQueue {
  [type: string]: { timer: number; lastSent: number }
}

export function useQuizSession(quizId: string, endsAt: string | null = null) {
  const [session, setSession] = useState<QuizSessionState | null>(() => readSession())
  const [phase, setPhase] = useState<QuizPhase>(() => (readSession() ? "active" : "pre"))
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const violationTimers = useRef<ViolationQueue>({})
  const autoSubmitDone = useRef(false)

  if (session && session.quizId !== quizId) {
    writeSession(null)
    setSession(null)
    setPhase("pre")
  }

  const attemptId = session?.attemptId ?? null

  const maxDurationMs =
    session?.expiresAt != null
      ? new Date(session.expiresAt).getTime() - new Date(session.serverNow).getTime()
      : null

  const deadlineMs = endsAt ? new Date(endsAt).getTime() : null

  const start = async (): Promise<boolean> => {
    if (phase === "active") return true
    if (deadlineMs != null && Date.now() >= deadlineMs) return false
    setSubmitError(null)
    try {
      const attempt = await api.startQuizAttempt(quizId)
      const next: QuizSessionState = {
        attemptId: attempt.id,
        quizId,
        expiresAt: attempt.expiresAt,
        serverNow: attempt.serverNow ?? new Date().toISOString(),
        startedAt: performance.now(),
        answers: {},
      }
      writeSession(next)
      setSession(next)
      setPhase("active")
      return true
    } catch {
      return false
    }
  }

  const setAnswer = (questionId: string, answer: string) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, answers: { ...prev.answers, [questionId]: answer } }
      writeSession(next)
      return next
    })
  }

  const submit = useCallback(
    async (answers: Record<string, string>): Promise<api.QuizAttemptDto | null> => {
      if (!session?.attemptId) return null
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        const attempt = await api.submitQuizAttempt(
          session.quizId,
          Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        )
        writeSession(null)
        setSession(null)
        setPhase("submitted")
        return attempt
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 410) {
          writeSession(null)
          setSession(null)
          setPhase("expired")
          return null
        }
        if (status === 404) {
          writeSession(null)
          setSession(null)
          setPhase("pre")
          setSubmitError(
            "Your previous attempt is no longer available — it was removed with the quiz. You can start a new one below.",
          )
          return null
        }
        setSubmitError(getErrorMessage(err))
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [session],
  )

  const reportViolation = useCallback(
    (type: api.QuizViolationType) => {
      if (!session?.attemptId || phase !== "active") return
      const attemptId = session.attemptId
      const queue = violationTimers.current
      const now = performance.now()
      const entry = queue[type]
      const send = () => {
        queue[type] = { timer: 0, lastSent: performance.now() }
        api.reportQuizViolation(attemptId, type).catch(() => {
          // violations are best-effort; never block the quiz on them
        })
      }
      if (!entry || now - entry.lastSent >= 1000) {
        if (entry?.timer) window.clearTimeout(entry.timer)
        send()
      } else if (!entry.timer) {
        const delay = 1000 - (now - entry.lastSent)
        queue[type] = { ...entry, timer: window.setTimeout(send, delay) }
      }
    },
    [session, phase],
  )

  const reportViolationRef = useRef(reportViolation)
  useEffect(() => {
    reportViolationRef.current = reportViolation
  }, [reportViolation])
  const reportViolationStable = useCallback(
    (type: api.QuizViolationType) => reportViolationRef.current(type),
    [],
  )

  useEffect(() => {
    if (phase !== "active" || !session?.expiresAt || maxDurationMs == null) return
    const tick = () => {
      const elapsed = performance.now() - session.startedAt
      const deadlineRemaining = deadlineMs != null ? deadlineMs - Date.now() : Infinity
      const remaining = Math.max(0, Math.min(maxDurationMs - elapsed, deadlineRemaining))
      setRemainingMs(remaining)
      if (remaining === 0 && !autoSubmitDone.current) {
        autoSubmitDone.current = true
        setRemainingMs(null)
        void submit(session.answers).catch(() => {
          // leave on screen; teacher sees IN_PROGRESS attempt
        })
      }
    }
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [phase, session, maxDurationMs, deadlineMs, submit])

  useEffect(() => {
    const timers = violationTimers.current
    return () => {
      Object.values(timers).forEach((t) => {
        if (t.timer) window.clearTimeout(t.timer)
      })
    }
  }, [])

  return {
    phase,
    attemptId,
    answers: session?.answers ?? {},
    setAnswer,
    remainingMs,
    isSubmitting,
    submitError,
    start,
    submit,
    reportViolation: reportViolationStable,
  }
}
