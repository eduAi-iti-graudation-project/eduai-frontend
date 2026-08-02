import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"

export function AvailableClassesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showAvailable, setShowAvailable] = useState(false)

  const enrolled = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

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

  if (enrolled.isLoading || available.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Classes</h1>
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

  const enrolledClasses = enrolled.data ?? []
  const availableClasses = available.data ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-4">My Classes</h1>

      {enrolledClasses.length === 0 ? (
        <div className="mb-6">
          <EmptyState
            icon="school"
            title="Not enrolled in any classes"
            description="Browse available classes for your grade level and request to join."
          />
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {enrolledClasses.map((cls) => (
            <Link
              key={cls.id}
              to={`/student/classes/${cls.id}`}
              className="block rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-label-md text-label-md text-on-surface">{cls.name}</h3>
                  {cls.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{cls.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {cls.teacherName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">assignment</span>
                      {cls.assignments.length} {cls.assignments.length === 1 ? "assignment" : "assignments"}
                    </span>
                  </div>
                </div>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 shrink-0 self-center">
                  View Grades
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAvailable((prev) => !prev)}
        className="flex items-center gap-2 font-label-md text-label-md text-primary hover:underline mb-4"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-200" style={{ transform: showAvailable ? "rotate(90deg)" : undefined }}>
          chevron_right
        </span>
        Available to Join
        {availableClasses.length > 0 && (
          <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">
            {availableClasses.length}
          </span>
        )}
      </button>

      {showAvailable && (
        <div className="space-y-3">
          {availableClasses.length === 0 ? (
            <EmptyState
              icon="check_circle"
              title="All set!"
              description="You've joined all available classes for your grade level."
            />
          ) : (
            availableClasses.map((c) => {
              const isPending = joinedIds.has(c.id) || joiningId === c.id
              return (
                <div
                  key={c.id}
                  className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-label-md text-label-md text-on-surface">{c.name}</h3>
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
            })
          )}
        </div>
      )}
    </div>
  )
}
