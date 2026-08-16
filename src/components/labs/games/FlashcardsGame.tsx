import { useEffect, useMemo, useState } from "react"
import type { FlashcardsSpec } from "@/lib/api"
import { cn } from "@/lib/utils"

export function FlashcardsBody({
  spec,
  onWin,
}: {
  spec: FlashcardsSpec
  onWin: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())

  const card = spec.cards[index]

  const allReviewed = useMemo(
    () => reviewed.size === spec.cards.length,
    [reviewed, spec.cards.length],
  )
  useEffect(() => {
    if (allReviewed) onWin()
  }, [allReviewed, onWin])

  if (!card) return null

  const flip = () => {
    setFlipped((prev) => {
      const next = !prev
      if (next) setReviewed((prevSet) => new Set(prevSet).add(card.id))
      return next
    })
  }

  const goTo = (next: number) => {
    setFlipped(false)
    setIndex(Math.min(Math.max(next, 0), spec.cards.length - 1))
  }

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {reviewed.size} of {spec.cards.length} cards reviewed
      </p>

      <button
        type="button"
        onClick={flip}
        className={cn(
          "w-full max-w-md flex-1 min-h-[220px] rounded-xl border-2 p-6 transition-all cursor-pointer select-none",
          flipped
            ? "border-primary bg-primary/5"
            : "border-outline-variant bg-surface hover:border-primary/50",
        )}
      >
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {flipped ? "Back" : "Front"} — tap to flip
        </p>
        <p className="mt-4 font-headline-sm text-headline-sm text-on-surface text-center break-words">
          {flipped ? card.back : card.front}
        </p>
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="rounded-md border border-outline-variant bg-surface px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:border-primary disabled:opacity-40 cursor-pointer"
        >
          Previous
        </button>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {index + 1} / {spec.cards.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === spec.cards.length - 1}
          className="rounded-md border border-outline-variant bg-surface px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:border-primary disabled:opacity-40 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  )
}