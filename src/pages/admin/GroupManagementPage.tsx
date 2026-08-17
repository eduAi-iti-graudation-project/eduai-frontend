import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useOrganization, organizationQueryKey } from "@/hooks/use-organization"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function tierLabel(tier: api.SubscriptionTier): string {
  return tier === "TRIAL" ? "Trial" : tier.charAt(0) + tier.slice(1).toLowerCase()
}

function SchoolRow({ school }: { school: api.GroupSchool }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 shrink-0 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">school</span>
        </span>
        <div className="min-w-0">
          <p className="font-label-md text-label-md font-bold text-on-surface truncate">{school.name}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Join code: <span className="font-mono tracking-widest">{school.joinCode}</span>
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-headline-md text-headline-md text-on-surface">{school.seatUsage}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">seats used</p>
      </div>
    </div>
  )
}

export function GroupManagementPage() {
  const queryClient = useQueryClient()
  const { data: org, isError: orgIsError, error: orgError, isLoading: orgLoading } = useOrganization()
  const [groupName, setGroupName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState(false)

  const isGrouped = Boolean(org?.groupId)

  const groupQuery = useQuery({
    queryKey: ["group"],
    queryFn: () => api.getGroup(),
    enabled: isGrouped,
  })

  const insightsQuery = useQuery({
    queryKey: ["group-insights"],
    queryFn: () => api.getGroupInsights(),
    enabled: isGrouped,
  })

  const createGroup = useMutation({
    mutationFn: (name: string) => api.createGroup(name),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["group"] })
      queryClient.invalidateQueries({ queryKey: organizationQueryKey() })
      if (result.requiresCheckout) {
        toast.info(result.message)
        try {
          const { url } = await api.createCheckoutSession("enterprise")
          window.location.assign(url)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not start Enterprise checkout")
        }
      } else {
        toast.success(result.message)
        setGroupName("")
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const joinGroup = useMutation({
    mutationFn: (code: string) => api.joinGroup(code),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["group"] })
      queryClient.invalidateQueries({ queryKey: organizationQueryKey() })
      setJoinCode("")
      toast.success(result.message)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleCopyCode = () => {
    if (!groupQuery.data?.joinCode) return
    void navigator.clipboard?.writeText(groupQuery.data.joinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (orgIsError) {
    return (
      <ErrorState
        message={orgError instanceof Error ? orgError.message : "Failed to load organization"}
        onRetry={() => queryClient.invalidateQueries({ queryKey: organizationQueryKey() })}
      />
    )
  }

  if (orgLoading || !org) {
    return <LoadingState label="Loading group information..." />
  }

  // Grouped view: show the group, join code, schools, and insights.
  if (isGrouped) {
    if (groupQuery.isError) {
      return <ErrorState message={(groupQuery.error as Error).message} onRetry={() => groupQuery.refetch()} />
    }
    if (groupQuery.isLoading || !groupQuery.data) {
      return <LoadingState label="Loading your school group..." />
    }
    const group = groupQuery.data
    const insights = insightsQuery.data

    return (
      <div className="flex-1 p-xl max-w-6xl mx-auto w-full space-y-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">domain</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface">{group.name}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                School group · {tierLabel(group.subscriptionTier)} · {group.schools.length} school
                {group.schools.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-lg font-label-md text-label-md border border-border bg-white text-primary hover:bg-surface-container h-auto px-5 py-2.5"
            onClick={() => {
              window.location.assign("/admin/billing")
            }}
          >
            Group billing
          </Button>
        </div>

        {/* Join code card */}
        <div className="rounded-lg bg-primary-container border border-primary/30 p-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">key</span>
            <div>
              <p className="font-headline-md text-headline-md text-on-primary-container">Invite schools to join</p>
              <p className="font-body-sm text-body-sm text-on-primary-container/80">
                Share this code with another school&apos;s admin. Joining schools inherit the group&apos;s Enterprise billing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-white border border-primary/40 px-4 py-2 font-mono font-label-md text-label-md tracking-[0.2em] text-primary">
              {group.joinCode}
            </span>
            <Button
              variant="outline"
              className="rounded-lg font-label-md text-label-md border border-primary bg-white text-primary hover:bg-primary-container h-auto px-4 py-2.5"
              onClick={handleCopyCode}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Schools */}
        <div className="rounded-lg bg-white border border-border p-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">Schools in this group</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Seats: unlimited (Enterprise)
            </p>
          </div>
          <div className="space-y-3">
            {group.schools.map((school) => (
              <SchoolRow key={school.id} school={school} />
            ))}
          </div>
        </div>

        {/* Insights */}
        {insights && (
          <div className="rounded-lg bg-white border border-border p-md">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Group usage at a glance</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(
                [
                  ["groups", "Users", insights.totals.users],
                  ["group", "Students", insights.totals.students],
                  ["co_present", "Teachers", insights.totals.teachers],
                  ["notifications_active", "Active alerts", insights.totals.activeAlerts],
                  ["quiz", "Quiz attempts", insights.totals.quizAttempts],
                ] as const
              ).map(([icon, label, value]) => (
                <div key={label} className="rounded-lg bg-surface-container p-4">
                  <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
                  <p className="font-headline-md text-headline-md text-on-surface mt-2">{value}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Ungrouped view: create or join.
  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full space-y-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface">School groups</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Group multiple schools under one Enterprise subscription with unlimited seats.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-md">
        {/* Create */}
        <div className="rounded-lg bg-white border border-border p-md flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-11 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">domain_add</span>
            </span>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Create a group</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Your school becomes the owner and is billed on Enterprise.
              </p>
            </div>
          </div>
          <form
            className="space-y-4 flex-1 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              if (groupName.trim()) createGroup.mutate(groupName.trim())
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Edu Chain Schools"
                className="rounded-lg"
                maxLength={200}
              />
            </div>
            <Button
              type="submit"
              className="mt-auto rounded-lg font-label-md text-label-md px-6 py-3 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!groupName.trim() || createGroup.isPending}
            >
              {createGroup.isPending ? "Creating..." : "Create group"}
            </Button>
          </form>
        </div>

        {/* Join */}
        <div className="rounded-lg bg-white border border-border p-md flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-11 rounded-lg bg-surface-container text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">key</span>
            </span>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Join a group</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Enter the join code from the group owner. Your school inherits the group&apos;s billing.
              </p>
            </div>
          </div>
          <form
            className="space-y-4 flex-1 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              if (joinCode.trim()) joinGroup.mutate(joinCode.trim().toUpperCase())
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="join-code">Join code</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. GROUP1234"
                className="rounded-lg font-mono tracking-[0.2em] uppercase"
                maxLength={50}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="mt-auto rounded-lg font-label-md text-label-md px-6 py-3 h-auto border border-border bg-white text-primary hover:bg-surface-container"
              disabled={!joinCode.trim() || joinGroup.isPending}
            >
              {joinGroup.isPending ? "Joining..." : "Join group"}
            </Button>
          </form>
        </div>
      </div>

      <div className={cn("rounded-lg border p-md flex items-start gap-3", "bg-primary-container/60 border-primary/20")}>
        <span className="material-symbols-outlined text-[22px] text-primary mt-0.5">info</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Groups are billed on the Enterprise plan with unlimited seats. Creating a group moves your school&apos;s
          billing into the group; joining a group stops your own subscription at the end of the billing period.
        </p>
      </div>
    </div>
  )
}