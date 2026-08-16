import { useEffect, useMemo, useState } from "react"
import type { MatchPairsSpec } from "@/lib/api"
import { cn } from "@/lib/utils"

function shuffle<T>(items: T[]): T[] {
  const order = [...items]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export function MatchPairsBody({
  spec,
  onWin,
}: {
  spec: MatchPairsSpec
  onWin: () => void
}) {
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [wrongDefinition, setWrongDefinition] = useState<string | null>(null)
  const [definitions] = useState<string[]>(() =>
    shuffle(spec.pairs.map((pair) => pair.definition)),
  )

  const allMatched = useMemo(
    () => matched.size === spec.pairs.length,
    [matched, spec.pairs.length],
  )
  useEffect(() => {
    if (allMatched) onWin()
  }, [allMatched, onWin])

  const chooseTerm = (pairId: string) => {
    if (matched.has(pairId)) return
    setSelectedTerm((prev) => (prev === pairId ? null : pairId))
  }

  const chooseDefinition = (definition: string) => {
    const pair = spec.pairs.find((p) => p.definition === definition)
    if (!pair || matched.has(pair.id)) return
    if (!selectedTerm) {
      setWrongDefinition(definition)
      setTimeout(() => setWrongDefinition(null), 600)
      return
    }
    if (selectedTerm === pair.id) {
      setMatched((prev) => new Set(prev).add(pair.id))
      setSelectedTerm(null)
    } else {
      setWrongDefinition(definition)
      setSelectedTerm(null)
      setTimeout(() => setWrongDefinition(null), 600)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        Select a term, then tap its matching definition.
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 flex-1 min-h-0">
        <div className="space-y-2">
          {spec.pairs.map((pair) => {
            const isMatched = matched.has(pair.id)
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => chooseTerm(pair.id)}
                disabled={isMatched}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left font-label-md text-label-md transition-colors cursor-pointer",
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : selectedTerm === pair.id
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-outline-variant bg-surface text-on-surface hover:border-primary/50",
                )}
              >
                {isMatched && <span className="mr-1.5 text-emerald-600">✓</span>}
                {pair.term}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {definitions.map((definition) => {
            const pair = spec.pairs.find((p) => p.definition === definition)
            const isMatched = pair ? matched.has(pair.id) : false
            return (
              <button
                key={definition}
                type="button"
                onClick={() => chooseDefinition(definition)}
                disabled={isMatched}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left font-body-md text-body-md transition-colors cursor-pointer",
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : wrongDefinition === definition
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-outline-variant bg-surface text-on-surface hover:border-primary/50",
                )}
              >
                {isMatched && <span className="mr-1.5 text-emerald-600">✓</span>}
                {definition}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}