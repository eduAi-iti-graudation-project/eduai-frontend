import { useCallback, useRef, useState } from "react"
import type { LabGameSpec } from "@/lib/api"
import { LabGameShell } from "./LabGameShell"
import { DragToRegionsBody } from "./DragToRegionsGame"
import { SortCategoriesBody } from "./SortCategoriesGame"
import { MatchPairsBody } from "./MatchPairsGame"
import { FlashcardsBody } from "./FlashcardsGame"

/**
 * Renders a template lab game from its data spec. The interaction and the win
 * condition are handled by these hand-written React templates — no generated
 * code, no physics engine — so every lab is guaranteed to be interactive and
 * beatable.
 */
export function LabGame({
  spec,
  onObjectiveComplete,
}: {
  spec: LabGameSpec
  onObjectiveComplete?: () => void
}) {
  const [won, setWon] = useState(false)
  const completedRef = useRef(false)

  const handleWin = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setWon(true)
    onObjectiveComplete?.()
  }, [onObjectiveComplete])

  return (
    <LabGameShell spec={spec} won={won}>
      {spec.template === "drag-to-regions" && (
        <DragToRegionsBody spec={spec} onWin={handleWin} />
      )}
      {spec.template === "sort-categories" && (
        <SortCategoriesBody spec={spec} onWin={handleWin} />
      )}
      {spec.template === "match-pairs" && (
        <MatchPairsBody spec={spec} onWin={handleWin} />
      )}
      {spec.template === "flashcards" && (
        <FlashcardsBody spec={spec} onWin={handleWin} />
      )}
    </LabGameShell>
  )
}