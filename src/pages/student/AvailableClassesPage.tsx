import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

export function AvailableClassesPage() {
  const queryClient = useQueryClient()
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const available = useQuery({
    queryKey: ["classes", "available"],
    queryFn: api.getAvailableClasses,
  })

  const joinMutation = useMutation({
    mutationFn: api.joinClass,
    onMutate: (classId) => setJoiningId(classId),
    onSuccess: (_data, classId) => {
      setJoinedIds((prev) => new Set(prev).add(classId))
      queryClient.invalidateQueries({ queryKey: ["classes", "available"] })
    },
    onSettled: () => setJoiningId(null),
    onError: (err: Error, classId) => {
      if (err.message?.includes("Already requested")) {
        setJoinedIds((prev) => new Set(prev).add(classId))
        return
      }
      toast.error(err.message)
    },
  })

  if (available.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Available Classes</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
              <div className="h-5 w-48 bg-surface-container-high rounded-full mb-2" />
              <div className="h-4 w-32 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const classes = available.data ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Available Classes</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Browse classes available for your grade level. Request to join and a teacher will approve your enrollment.
      </p>

      {classes.length === 0 ? (
        <EmptyState
          icon="school"
          title="No classes available"
          description="There are no classes available for your grade level right now."
        />
      ) : (
        <div className="space-y-3">
          {classes.map((c) => {
            const isPending = joinedIds.has(c.id) || joiningId === c.id
            return (
              <div
                key={c.id}
                className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-label-md text-label-md text-on-surface">{c.name}</h3>
                  </div>
                  {c.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{c.description}</p>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{(c as any).teacher?.name ?? "Teacher"}</p>
                </div>
                <button
                  onClick={() => joinMutation.mutate(c.id)}
                  disabled={isPending}
                  className={`shrink-0 px-md py-sm rounded-full font-label-md transition-all disabled:opacity-50 ${
                    isPending
                      ? "bg-surface-container text-on-surface-variant"
                      : "bg-secondary-container text-white hover:opacity-90"
                  }`}
                >
                  {isPending ? "Pending..." : "Join"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
