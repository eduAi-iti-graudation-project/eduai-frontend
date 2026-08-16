import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

export interface StudentOption {
  id: string
  name: string
  email: string
}

interface StudentSelectComboboxProps {
  value: StudentOption | null
  onChange: (student: StudentOption | null) => void
  searchFn: (query: string) => Promise<StudentOption[]>
  placeholder?: string
  className?: string
}

export function StudentSelectCombobox({
  value,
  onChange,
  searchFn,
  placeholder = "Search student…",
  className,
}: StudentSelectComboboxProps) {
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StudentOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setEditing(false)
        setResults([])
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing || query.trim().length < 2) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchFn(query.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, editing, searchFn])

  const startEditing = useCallback(() => {
    setQuery(value?.name ?? "")
    setResults([])
    setEditing(true)
  }, [value])

  const stopEditing = useCallback(() => {
    setEditing(false)
    setResults([])
  }, [])

  const handleSelect = useCallback(
    (student: StudentOption) => {
      onChange(student)
      stopEditing()
    },
    [onChange, stopEditing],
  )

  const handleClear = useCallback(() => {
    onChange(null)
    stopEditing()
  }, [onChange, stopEditing])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") stopEditing()
    },
    [stopEditing],
  )

  const showResults = editing && results.length > 0

  if (!editing) {
    return (
      <div ref={wrapperRef} className={cn("relative", className)}>
        {value ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5">
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0">person</span>
            <span className="min-w-0 flex-1 truncate font-label-sm text-label-sm text-on-surface">{value.name}</span>
            <button
              type="button"
              title="Change student"
              onClick={startEditing}
              className="shrink-0 rounded p-0.5 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button
              type="button"
              title="Clear selection"
              onClick={handleClear}
              className="shrink-0 rounded p-0.5 text-on-surface-variant hover:text-error"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="flex w-full items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-left font-label-sm text-label-sm text-on-surface-variant hover:border-primary"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">search</span>
            {placeholder}
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
        <span className="material-symbols-outlined text-outline text-[16px]">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none font-label-sm text-label-sm text-on-surface placeholder:text-muted-foreground"
        />
        {isSearching && (
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-lg animate-spin shrink-0" />
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-1 w-full bg-popover rounded-lg shadow-md border border-border py-2 max-h-60 overflow-y-auto">
          {results.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => handleSelect(student)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant font-label-sm font-bold shrink-0">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">{student.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{student.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
