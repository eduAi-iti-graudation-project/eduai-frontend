import { useState } from "react"
import * as api from "@/lib/api"
import { cn } from "@/lib/utils"

export function FlashcardsView({ generation }: { generation: api.StudyGeneration }) {
  const flashcards = generation.payload as api.Flashcards
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = flashcards.cards[index]

  return (
    <div className="space-y-4">
      <h3 className="font-headline-md text-headline-md text-on-surface">
        {flashcards.title}
      </h3>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        Card {index + 1} of {flashcards.cards.length} — click to flip
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "w-full min-h-[240px] rounded-lg border p-6 flex flex-col items-center justify-center text-center transition-colors",
          flipped
            ? "bg-primary/10 border-primary/30"
            : "bg-surface-container-low border-border hover:border-primary/40",
        )}
      >
        <span className="material-symbols-outlined text-on-surface-variant mb-4">
          {flipped ? "lightbulb" : "quiz"}
        </span>
        {flipped ? (
          <>
            <h4 className="font-headline-md text-headline-md text-primary mb-2">
              Answer
            </h4>
            <p className="font-body-lg text-body-lg text-on-surface">
              {card.back}
            </p>
          </>
        ) : (
          <>
            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">
              Question
            </h4>
            <p className="font-body-lg text-body-lg text-on-surface">
              {card.front}
            </p>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1))
            setFlipped(false)
          }}
          className="font-label-md text-label-md text-primary disabled:opacity-40 hover:underline"
        >
          ← Previous
        </button>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {index + 1} / {flashcards.cards.length}
        </span>
        <button
          type="button"
          disabled={index >= flashcards.cards.length - 1}
          onClick={() => {
            setIndex((i) => Math.min(flashcards.cards.length - 1, i + 1))
            setFlipped(false)
          }}
          className="font-label-md text-label-md text-primary disabled:opacity-40 hover:underline"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
