import { useState } from "react"
import * as api from "@/lib/api"
import { cn } from "@/lib/utils"

export function PracticeView({ generation }: { generation: api.StudyGeneration }) {
  const practice = generation.payload as api.PracticeSet
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const question = practice.questions[index]

  const isCorrect = selected === question.answerIndex

  const choose = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === question.answerIndex) setScore((s) => s + 1)
  }

  const next = () => {
    const nextIndex = index + 1
    if (nextIndex >= practice.questions.length) {
      setIndex(0)
      setScore(0)
    } else {
      setIndex(nextIndex)
    }
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {practice.title}
        </h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Score: {score} / {revealed ? index + 1 : index}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-surface-container-low p-5">
        <p className="font-body-md text-body-md text-on-surface-variant mb-2">
          Question {index + 1} of {practice.questions.length}
        </p>
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-4 py-2 font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            {index >= practice.questions.length - 1
              ? "Restart"
              : "Next question"}
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
