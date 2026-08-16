import { useMemo, useState } from "react"
import * as api from "@/lib/api"
import { cn } from "@/lib/utils"

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function shuffleOptions(
  question: api.PracticeQuestion,
): { question: api.PracticeQuestion } {
  const indices = question.options.map((_, i) => i)
  const shuffledIndices = shuffleArray(indices)
  const shuffledOptions = shuffledIndices.map((i) => question.options[i])
  const newAnswerIndex = shuffledIndices.indexOf(question.answerIndex)

  return {
    question: {
      ...question,
      options: shuffledOptions,
      answerIndex: newAnswerIndex,
    },
  }
}

export function PracticeView({ generation }: { generation: api.StudyGeneration }) {
  const practice = generation.payload as api.PracticeSet

  const { shuffledQuestions } = useMemo(() => {
    const shuffled = shuffleArray(practice.questions)
    const result = shuffled.map((q) => shuffleOptions(q))
    return {
      shuffledQuestions: result.map((r) => r.question),
    }
  }, [practice.questions])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [mode, setMode] = useState<"practice" | "results">("practice")
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([])
  const question = shuffledQuestions[index]

  const isCorrect = selected === question.answerIndex

  const choose = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === question.answerIndex) {
      setScore((s) => s + 1)
    } else {
      setWrongAnswers((prev) => [...prev, index])
    }
  }

  const showResults = () => {
    setMode("results")
  }

  const retryWrong = () => {
    setIndex(0)
    setScore(0)
    setWrongAnswers([])
    setSelected(null)
    setRevealed(false)
    setMode("practice")
  }

  const restart = () => {
    setIndex(0)
    setScore(0)
    setWrongAnswers([])
    setSelected(null)
    setRevealed(false)
    setMode("practice")
  }

  if (mode === "results") {
    const accuracy = Math.round((score / practice.questions.length) * 100)
    return (
      <div className="space-y-4">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {practice.title} — Results
        </h3>
        <div className="rounded-lg border border-border bg-surface-container-low p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-headline-lg text-headline-lg">
              {score}/{practice.questions.length}
            </div>
            <div>
              <p className="font-body-md text-body-md text-on-surface">
                {accuracy >= 80
                  ? "Great job!"
                  : accuracy >= 50
                    ? "Good effort — keep practicing!"
                    : "Keep studying — you'll get there!"}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {accuracy}% accuracy
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {practice.questions.map((q, i) => {
              const shuffledQ = shuffledQuestions[i]
              return (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Question {i + 1}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface mb-2">
                    {q.question}
                  </p>
                  <p className="font-label-sm text-label-sm text-primary">
                    Correct answer: {shuffledQ.options[shuffledQ.answerIndex]}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-4">
            {wrongAnswers.length > 0 && (
              <button
                type="button"
                onClick={retryWrong}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-4 py-2 font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Retry wrong answers ({wrongAnswers.length})
              </button>
            )}
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-label-md text-label-md hover:bg-surface-container-low transition-colors"
            >
              Restart set
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {practice.title}
        </h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Score: {score} / {index + 1}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-surface-container-low p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Question {index + 1} of {practice.questions.length}
          </p>
          <div className="h-2 w-32 rounded-full bg-border">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${((index + 1) / practice.questions.length) * 100}%` }}
            />
          </div>
        </div>
        <p className="font-headline-sm text-headline-sm text-on-surface">
          {question.question}
        </p>
      </div>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const showCorrect = revealed && i === question.answerIndex
          const showWrong = revealed && selected === i && !showCorrect
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={revealed}
              className={cn(
                "w-full text-left rounded-lg border px-4 py-3 font-body-md text-body-md transition-colors",
                showCorrect
                  ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                  : showWrong
                    ? "bg-destructive/10 border-destructive/40 text-destructive"
                    : revealed
                      ? "bg-surface-container-low border-border text-on-surface-variant"
                      : "bg-surface border-border text-on-surface hover:border-primary/40",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border border-outline-variant inline-flex items-center justify-center font-label-sm text-label-sm shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
                {showCorrect && (
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                )}
                {showWrong && (
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="font-label-sm text-label-sm text-primary mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">info</span>
            {isCorrect ? "Correct!" : "Not quite — here's the explanation:"}
          </p>
          <p className="font-body-md text-body-md text-on-surface">
            {question.explanation}
          </p>
        </div>
      )}

      {revealed && (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={showResults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            View results
          </button>
          <div className="flex gap-2">
            {index < practice.questions.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const nextIndex = index + 1
                  setIndex(nextIndex)
                  setSelected(null)
                  setRevealed(false)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-4 py-2 font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Next question
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            )}
            {index >= practice.questions.length - 1 && (
              <button
                type="button"
                onClick={showResults}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-4 py-2 font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Finish
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
