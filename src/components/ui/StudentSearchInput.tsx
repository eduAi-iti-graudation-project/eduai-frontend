import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
}

interface StudentSearchInputProps {
  onSelect: (student: Student) => void
  searchFn: (query: string) => Promise<Student[]>
  placeholder?: string
  className?: string
}

export function StudentSearchInput({
  onSelect,
  searchFn,
  placeholder = "Search students...",
  className,
}: StudentSearchInputProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Student[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchFn(query)
        setResults(data)
        setIsOpen(data.length > 0)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchFn])

  const handleSelect = useCallback(
    (student: Student) => {
      onSelect(student)
      setQuery("")
      setResults([])
      setIsOpen(false)
    },
    [onSelect],
  )

  const showResults = isOpen && results.length > 0

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all">
        <span className="material-symbols-outlined text-outline text-[20px] group-focus-within/input:text-primary">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-body-md text-body-md text-on-surface placeholder:text-outline-variant"
        />
        {isSearching && (
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-lg animate-spin" />
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-border py-2 max-h-60 overflow-y-auto">
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
