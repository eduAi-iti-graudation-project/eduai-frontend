import { useEffect, useMemo, useRef, useState } from "react"
import type { SortCategoriesSpec } from "@/lib/api"
import { cn } from "@/lib/utils"

export function SortCategoriesBody({
  spec,
  onWin,
}: {
  spec: SortCategoriesSpec
  onWin: () => void
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [wrongItem, setWrongItem] = useState<string | null>(null)
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allPlaced = useMemo(
    () => Object.keys(placed).length === spec.items.length,
    [placed, spec.items.length],
  )
  useEffect(() => {
    if (allPlaced) onWin()
  }, [allPlaced, onWin])

  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current)
    },
    [],
  )

  const deckItems = spec.items.filter((item) => !placed[item.id])
  const bucketItems = (categoryId: string) =>
    spec.items.filter((item) => placed[item.id] === categoryId)

  const onDrop = (categoryId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCategory(null)
    const itemId = e.dataTransfer.getData("text/plain")
    const item = spec.items.find((i) => i.id === itemId)
    if (!item) return
    if (item.categoryId === categoryId) {
      setPlaced((prev) => ({ ...prev, [itemId]: categoryId }))
    } else {
      setWrongItem(itemId)
      if (wrongTimer.current) clearTimeout(wrongTimer.current)
      wrongTimer.current = setTimeout(() => setWrongItem(null), 900)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 flex-1">
        {spec.categories.map((category) => {
          const items = bucketItems(category.id)
          const isOver = dragOverCategory === category.id
          return (
            <div
              key={category.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCategory(category.id)
              }}
              onDragLeave={() =>
                setDragOverCategory((prev) => (prev === category.id ? null : prev))
              }
              onDrop={onDrop(category.id)}
              className={cn(
                "min-h-[130px] rounded-lg border-2 border-dashed p-3 transition-colors",
                isOver
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant bg-surface-container-lowest",
              )}
            >
              <p className="font-label-md text-label-md text-on-surface">{category.label}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setPlaced((prev) => {
                        const next = { ...prev }
                        delete next[item.id]
                        return next
                      })
                    }
                    title="Click to return to the deck"
                    className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-label-sm text-label-sm text-on-surface border border-outline-variant cursor-pointer hover:border-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {deckItems.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-container-lowest p-3">
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
            Drag each statement into the right category
          </p>
          <div className="flex flex-wrap gap-2">
            {deckItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", item.id)
                  e.dataTransfer.effectAllowed = "move"
                }}
                className={cn(
                  "inline-flex select-none items-center rounded-lg border px-3 py-2 font-label-md text-label-md cursor-grab active:cursor-grabbing",
                  wrongItem === item.id
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-outline-variant bg-surface text-on-surface",
                )}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}