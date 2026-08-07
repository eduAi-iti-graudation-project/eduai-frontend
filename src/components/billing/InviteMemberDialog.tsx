import { useState } from "react"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InviteMemberDialogProps {
  organizationId: string
  seatLimit: number | null
  userCount: number
}

export function InviteMemberDialog({ organizationId, seatLimit, userCount }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER")
  const [submitting, setSubmitting] = useState(false)

  const atSeatLimit = seatLimit !== null && userCount >= seatLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }
    setSubmitting(true)
    try {
      await api.inviteMember(organizationId, { email: email.trim(), name: name.trim() || undefined, role })
      toast.success(`Invitation sent to ${email.trim()}`)
      setOpen(false)
      setName("")
      setEmail("")
      setRole("TEACHER")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-primary text-primary-foreground font-label-md text-label-md px-5 py-2.5 h-auto hover:scale-[1.01] hover:bg-primary/90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg bg-surface-container-lowest">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Invite a member</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            They&apos;ll receive an email invitation to join {""}
            {seatLimit !== null ? `(${userCount}/${seatLimit} seats used)` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-xs">
            <Label htmlFor="invite-name" className="font-label-md text-label-md text-on-surface">Full name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sara Ahmed"
              className="rounded-lg border border-border bg-white py-4 h-auto font-body-md text-body-md"
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="invite-email" className="font-label-md text-label-md text-on-surface">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sara@school.edu"
              className="rounded-lg border border-border bg-white py-4 h-auto font-body-md text-body-md"
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="invite-role" className="font-label-md text-label-md text-on-surface">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "TEACHER" | "STUDENT")}>
              <SelectTrigger
                id="invite-role"
                className="rounded-lg border border-border bg-white py-4 h-auto font-body-md text-body-md"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {atSeatLimit && (
            <p className="text-error font-label-sm text-label-sm">
              Seat limit reached ({userCount}/{seatLimit}). Upgrade your plan to add more members.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || atSeatLimit}
              className="rounded-lg bg-primary text-primary-foreground font-label-md text-label-md px-5 h-auto hover:scale-[1.01] hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
