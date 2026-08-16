import { useEffect, useMemo, useRef, useState } from "react"
import type { DragToRegionsSpec } from "@/lib/api"
import { cn } from "@/lib/utils"

export function DragToRegionsBody({
  spec,
  onWin,
}: {
  spec: DragToRegionsSpec
  onWin: () => void
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [activeTabId, setActiveTabId] = useState(spec.tabs[0]?.id)
  const [dragOverRegion, setDragOverRegion] = useState<string | null>(null)
  const [wrongItem, setWrongItem] = useState<string | null>(null)
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeTab = spec.tabs.find((t) => t.id === activeTabId) ?? spec.tabs[0]

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

  if (!activeTab) return null

  const deckItems = spec.items.filter(
    (item) => item.tabId === activeTab.id && !placed[item.id],
  )
  const placedItems = (regionId: string) =>
    spec.items.filter(
      (item) => item.tabId === activeTab.id && placed[item.id] === regionId,
    )

  const onDrop = (regionId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverRegion(null)
    const itemId = e.dataTransfer.getData("text/plain")
    const item = spec.items.find((i) => i.id === itemId)
    if (!item) return
    if (item.regionId === regionId) {
      setPlaced((prev) => ({ ...prev, [itemId]: regionId }))
    } else {
      setWrongItem(itemId)
      if (wrongTimer.current) clearTimeout(wrongTimer.current)
      wrongTimer.current = setTimeout(() => setWrongItem(null), 900)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {spec.tabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {spec.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "rounded-full px-3 py-1 font-label-md text-label-md transition-colors cursor-pointer",
                tab.id === activeTab.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 flex-1">
        {activeTab.regions.map((region) => {
          const items = placedItems(region.id)
          const isOver = dragOverRegion === region.id
          const isWrongTarget =
            isOver &&
            wrongItem !== null &&
            spec.items.find((i) => i.id === wrongItem)?.regionId !== region.id
          return (
            <div
              key={region.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverRegion(region.id)
              }}
              onDragLeave={() => setDragOverRegion((prev) => (prev === region.id ? null : prev))}
              onDrop={onDrop(region.id)}
              className={cn(
                "min-h-[110px] rounded-lg border-2 border-dashed p-3 transition-colors",
                isOver
                  ? "border-primary bg-primary/5"
                  : isWrongTarget
                    ? "border-red-400 bg-red-50"
                    : "border-outline-variant bg-surface-container-lowest",
              )}
            >
              <p className="font-label-md text-label-md text-on-surface">{region.label}</p>
              {region.hint && (
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{region.hint}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlaced((prev) => {
                      const next = { ...prev }
                      delete next[item.id]
                      return next
                    })}
                    title="Click to return to the deck"
                    className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-label-sm text-label-sm text-on-surface border border-outline-variant cursor-pointer hover:border-primary"
                  >
                    {item.emoji && <span>{item.emoji}</span>}
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
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Drag each item to its region</p>
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
                  "inline-flex select-none items-center gap-1.5 rounded-lg border px-3 py-2 font-label-md text-label-md cursor-grab active:cursor-grabbing",
                  wrongItem === item.id
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-outline-variant bg-surface text-on-surface",
                )}
              >
                {item.emoji && <span className="text-[16px]">{item.emoji}</span>}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}