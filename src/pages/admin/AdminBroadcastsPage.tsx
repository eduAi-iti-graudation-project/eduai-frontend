import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { cn } from "@/lib/utils"

const ROLE_OPTIONS: Array<{ value: api.BroadcastTargetRole; label: string; icon: string }> = [
  { value: "STUDENT", label: "Students", icon: "school" },
  { value: "TEACHER", label: "Teachers", icon: "co_present" },
  { value: "GUARDIAN", label: "Guardians", icon: "family_history" },
  { value: "ADMIN", label: "Admins", icon: "admin_panel_settings" },
]

const ROLE_LABEL: Record<api.BroadcastTargetRole, string> = {
  STUDENT: "Students",
  TEACHER: "Teachers",
  GUARDIAN: "Guardians",
  ADMIN: "Admins",
}

function formatBroadcastDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AdminBroadcastsPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<api.BroadcastTargetRole[]>([])
  const [targetGradeId, setTargetGradeId] = useState<string | undefined>(undefined)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const broadcasts = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => api.getBroadcasts(),
  })

  const grades = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.getAllGrades(),
  })

  const create = useMutation({
    mutationFn: () =>
      api.createBroadcast({
        title: title.trim(),
        body: body.trim() || undefined,
        targetRoles: selectedRoles,
        targetGradeId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] })
      setTitle("")
      setBody("")
      setSelectedRoles([])
      setTargetGradeId(undefined)
      setConfirmOpen(false)
      toast.success("Broadcast sent")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const canSubmit = title.trim().length > 0 && selectedRoles.length > 0

  const toggleRole = (role: api.BroadcastTargetRole) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  if (broadcasts.isError) {
    return (
      <ErrorState
        title="Failed to load broadcasts"
        message={broadcasts.error instanceof Error ? broadcasts.error.message : "Something went wrong"}
        onRetry={() => broadcasts.refetch()}
      />
    )
  }

  return (
    <div className="flex-1 px-4 py-4 min-w-0">
      <div className="max-w-[1400px] mx-auto space-y-4 min-w-0">
        <PageHeader title="Broadcast" subtitle="Send school news to a targeted audience" />

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low/60">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">New announcement</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Delivered as an in-app notification and email to every recipient in the audience.
            </p>
          </div>

          <div className="p-5 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder="e.g. School closed Monday"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="broadcast-body">Message</Label>
              <Textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 5000))}
                placeholder="Optional details for the announcement…"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label>Who should receive it?</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const active = selectedRoles.includes(role.value)
                  return (
                    <label
                      key={role.value}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer select-none transition-colors",
                        active
                          ? "border-primary bg-primary-container text-on-primary-container"
                          : "border-outline-variant bg-surface-container-low hover:bg-surface-container-high",
                      )}
                    >
                      <Checkbox
                        checked={active}
                        onCheckedChange={() => toggleRole(role.value)}
                        className="pointer-events-none"
                      />
                      <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                      <span className="font-label-md text-label-md">{role.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Limit to a grade? (optional)</Label>
              <Select value={targetGradeId ?? "all"} onValueChange={(v) => setTargetGradeId(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-full md:w-72">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {grades.data?.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      Grade {grade.level}{grade.name ? ` · ${grade.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3">
              {selectedRoles.length > 0 && targetGradeId && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Guardians are limited to those with a child in this grade.
                </p>
              )}
              <Button disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
                <span className="material-symbols-outlined text-[18px] mr-1.5">campaign</span>
                Send broadcast
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low/60">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Sent announcements</h2>
          </div>

          {broadcasts.isLoading ? (
            <LoadingState label="Loading broadcasts…" className="py-lg" />
          ) : !broadcasts.data || broadcasts.data.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="campaign" title="Nothing sent yet" description="Your announcements will appear here." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {broadcasts.data.map((broadcast) => {
                const audience = broadcast.targetRoles.map((role) => ROLE_LABEL[role]).join(", ")
                const gradeLabel = broadcast.targetGradeName
                  ? `Grade ${broadcast.targetGradeLevel ?? ""}${broadcast.targetGradeName !== `Grade ${broadcast.targetGradeLevel}` ? ` · ${broadcast.targetGradeName}` : ""}`.trim()
                  : "All grades"
                return (
                  <div key={broadcast.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md text-on-surface font-semibold">{broadcast.title}</p>
                        {broadcast.body && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 whitespace-pre-wrap">{broadcast.body}</p>
                        )}
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          {audience} · {gradeLabel} · {formatBroadcastDate(broadcast.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-medium shrink-0">
                        {broadcast.deliveredCount} delivered
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Send this broadcast?"
        message={`This will immediately notify ${selectedRoles
          .map((role) => ROLE_LABEL[role].toLowerCase())
          .join(", ")}${targetGradeId ? " (one grade only)" : " (all grades)"} by notification and email.`}
        confirmLabel="Send"
        isLoading={create.isPending}
        onConfirm={() => create.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
