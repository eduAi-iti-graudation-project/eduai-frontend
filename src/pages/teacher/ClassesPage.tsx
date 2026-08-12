import { useState } from "react"
import { Link } from "react-router-dom"
import { useClasses } from "@/hooks/use-classes"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

export function ClassesPage() {
  const [query, setQuery] = useState("")

  const { isLoading, isError, error, classCards, taughtSectionCount } = useClasses()

  const filtered = classCards.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  if (isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error instanceof Error ? error.message : "Failed to load sections"}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (isLoading) {
    return <LoadingState label="Loading sections..." />
  }

  return (
    <div className="min-h-full bg-surface-container-low">
      <div className="mx-auto flex max-w-6xl flex-col gap-md p-gutter pb-24 md:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Your Sections</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Sections you're currently teaching.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-sm">
          <div className="relative flex-grow max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-md border border-outline-variant text-sm font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search sections..."
              type="text"
            />
          </div>
        </div>

        {/* Bento Grid / Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant shadow-sm p-md flex flex-col items-center justify-center text-center gap-sm py-xl">
              <span className="material-symbols-outlined text-[40px] text-outline">school</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">No sections found</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {classCards.length === 0
                  ? taughtSectionCount === 0
                    ? "You're not teaching any sections yet — the sections assigned to your courses will appear here."
                    : "No sections match your search"
                  : ""}
              </p>
            </div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div className="p-md border-b border-outline-variant flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-headline-md text-headline-md text-on-surface truncate">{c.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 truncate">
                    {c.courses.length > 0 ? c.courses.join(" · ") : c.section}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border border-outline-variant">
                    {c.courses.length > 0 ? `${c.courses.length} course${c.courses.length !== 1 ? "s" : ""}` : "No course"}
                  </span>
                </div>
              </div>
              <div className="p-md">
                <div className="flex justify-between items-center mb-sm">
                  <span className="font-meta text-meta text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    {c.students} Student{c.students !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-label-sm text-label-sm border border-outline-variant">
                    Active
                  </span>
                </div>
                <Link
                  to={`/classes/${c.id}`}
                  className="mt-md w-full flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-outline-variant bg-surface-container-highest/40 text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary transition-colors font-body-md text-body-md"
                >
                  View Section
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}