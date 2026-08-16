import { useIsFetching, useIsMutating } from "@tanstack/react-query"

/**
 * Thin top progress bar driven by react-query's GLOBAL mutation/fetch
 * counters. Shown whenever any mutation or query is in flight anywhere in the
 * app, so short operations (publish, delete, saves) don't appear to vanish
 * when the user switches tabs.
 */
export function GlobalMutationBar() {
  const isMutating = useIsMutating()
  const isFetching = useIsFetching()
  const active = isMutating > 0 || isFetching > 0

  return (
    <div className="fixed inset-x-0 top-0 z-[95] h-0.5 pointer-events-none" aria-hidden>
      <div
        className={`h-full bg-primary transition-opacity duration-300 ${
          active ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
        style={{ width: active ? "100%" : "0%" }}
      />
    </div>
  )
}