import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { AssistantScope, ScopeGroup } from "./scope"

interface ScopeSearchProps {
  value: AssistantScope
  groups: ScopeGroup[]
  placeholder?: string
  clearLabel?: string
  onChange: (scope: AssistantScope) => void
  className?: string
}

export function ScopeSearch({
  value,
  groups,
  placeholder = "All…",
  clearLabel,
  onChange,
  className,
}: ScopeSearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const scoped = value.kind !== "all"

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 2) return groups
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        {!scoped && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
            search
          </span>
        )}
        <input
          type="text"
          value={scoped ? value.name ?? "" : query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          readOnly={scoped}
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-text"
        />
        {scoped ? (
          <button
            type="button"
            title="Clear scope"
            onClick={() => {
              onChange({ kind: "all" })
              setQuery("")
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        ) : query.length > 0 ? (
          <button
            type="button"
            title="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">
            <span className="material-symbols-outlined">expand_more</span>
          </span>
        )}
      </div>

      {open && !scoped && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-30 max-h-72 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg py-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="px-3 py-2 text-xs text-on-surface-variant">
              Type at least 2 characters to search.
            </p>
          )}
          {matches.length === 0 && query.trim().length >= 2 && (
            <p className="px-3 py-2 text-sm text-on-surface-variant">
              Nothing matches “{query}”.
            </p>
          )}
          {matches.map((g) => (
            <div key={g.label}>
              <p className="px-3 py-1.5 font-meta text-meta uppercase text-on-surface-variant tracking-wider bg-surface-container-low/60">
                {g.label}
              </p>
              {g.items.map((item) => (
                <button
                  key={`${g.kind}:${item.id}`}
                  type="button"
                  onClick={() => {
                    onChange({ kind: g.kind, id: item.id, name: item.name })
                    setQuery("")
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    {g.kind === "student" ? "person" : g.kind === "teacher" ? "co_present" : "menu_book"}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          ))}
          {clearLabel && matches.length > 0 && (
            <>
              <div className="h-px bg-outline-variant my-1" />
              <button
                type="button"
                onClick={() => {
                  onChange({ kind: "all" })
                  setQuery("")
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">public</span>
                {clearLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}