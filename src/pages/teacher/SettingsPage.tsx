import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"

type MyProfile = Awaited<ReturnType<typeof api.getMyTeacherProfile>>

export function SettingsPage() {
  const { user } = useAuth()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")

  const changePassword = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password updated")
      setCurrent("")
      setNext("")
      setConfirm("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const valid = next.length >= 8 && next === confirm

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || changePassword.isPending) return
    changePassword.mutate({ currentPassword: current, newPassword: next })
  }

  return (
    <div className="p-xl max-w-2xl mx-auto w-full space-y-6">
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-1">Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your account, personal info and password.</p>
      </header>

      <Card className="border-border mb-lg">
        <CardHeader>
          <CardTitle className="font-label-xl text-label-xl text-on-surface">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline-md">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface truncate">{user?.name ?? "—"}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user?.email ?? "—"}</p>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Role: <span className="text-on-surface font-semibold uppercase">{user?.role ?? "—"}</span>
          </p>
        </CardContent>
      </Card>

      {user?.role === "TEACHER" && <PersonalInfoCard />}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-label-xl text-label-xl text-on-surface">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="next">New password</Label>
                <Input
                  id="next"
                  type="password"
                  value={next}
                  onChange={(event) => setNext(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {confirm.length > 0 && next !== confirm && (
              <p className="text-error text-label-sm">Passwords do not match.</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={!current || !valid || changePassword.isPending}>
                {changePassword.isPending ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PersonalInfoCard() {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  const profileQ = useQuery({
    queryKey: ["my-teacher-profile"],
    queryFn: () => api.getMyTeacherProfile(),
  })

  const avatarM = useMutation({
    mutationFn: (file: File) => api.uploadMyTeacherAvatar(file),
    onSuccess: () => {
      toast.success("Photo updated")
      qc.invalidateQueries({ queryKey: ["my-teacher-profile"] })
    },
    onError: () => toast.error("Could not update the photo"),
  })

  const profile = profileQ.data
  const ec = profile?.emergencyContact

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-label-xl text-label-xl text-on-surface">Personal info</CardTitle>
          <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => setOpen(true)}>
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-headline-md shrink-0">
            {profile?.avatarUrl ? (
              <img src={api.teacherAvatarUrl(profile.id)} alt="" className="w-full h-full object-cover" />
            ) : (
              (userInitial(profile?.name) ?? "U")
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="rounded-md font-label-md text-label-md" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              {profile?.avatarUrl ? "Change photo" : "Add photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) avatarM.mutate(file)
                e.target.value = ""
              }}
            />
          </div>
        </div>

        {profileQ.isLoading ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Address" value={profile.street && profile.city ? `${profile.street}, ${profile.city}` : profile.street ?? profile.city} />
            <InfoRow label="Nationality" value={profile.nationality} />
            <InfoRow label="Personal email" value={profile.personalEmail} />
            <InfoRow label="Date of birth" value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : null} />
            <InfoRow label="SSN" value={profile.ssnMasked} />
            <InfoRow
              label="Emergency contact"
              value={ec && (ec.name ?? ec.phone)
                ? [ec.name, ec.phone, ec.relationship].filter(Boolean).join(" · ")
                : null}
            />
          </div>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant">Could not load your profile.</p>
        )}
      </CardContent>

      <PersonalDetailsDialog open={open} onOpenChange={setOpen} profile={profile} />
    </Card>
  )
}

function userInitial(name?: string): string | null {
  return name ? name.charAt(0).toUpperCase() : null
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-body-md text-body-md text-on-surface truncate">{value ?? "—"}</p>
    </div>
  )
}

function PersonalDetailsDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: MyProfile | undefined
}) {
  const qc = useQueryClient()
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [street, setStreet] = useState(profile?.street ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [nationality, setNationality] = useState(profile?.nationality ?? "")
  const [personalEmail, setPersonalEmail] = useState(profile?.personalEmail ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "")
  const [ecName, setEcName] = useState(profile?.emergencyContact.name ?? "")
  const [ecPhone, setEcPhone] = useState(profile?.emergencyContact.phone ?? "")
  const [ecRel, setEcRel] = useState(profile?.emergencyContact.relationship ?? "")

  const saveM = useMutation({
    mutationFn: () =>
      api.updateMyTeacherProfile({
        phone,
        street,
        city,
        nationality,
        personalEmail: personalEmail || null,
        dateOfBirth,
        emergencyContactName: ecName || null,
        emergencyContactPhone: ecPhone || null,
        emergencyContactRelationship: ecRel || null,
      }),
    onSuccess: () => {
      toast.success("Profile updated")
      qc.invalidateQueries({ queryKey: ["my-teacher-profile"] })
      onOpenChange(false)
    },
    onError: () => toast.error("Could not update the profile"),
  })

  const ready = phone.trim() && street.trim() && city.trim() && nationality.trim() && dateOfBirth

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text") => (
    <div>
      <Label className="font-label-sm text-label-sm text-on-surface">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 rounded-md border border-outline-variant bg-surface-container-lowest font-medium text-body-md"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saveM.isPending) onOpenChange(false) }}>
      <DialogContent className="rounded-lg max-w-lg bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">Edit personal info</DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Update your contact and personal details. Your SSN is managed by your school administrator.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Phone", phone, setPhone, "tel")}
            {field("Date of birth", dateOfBirth, setDateOfBirth, "date")}
          </div>
          {field("Street address", street, setStreet)}
          {field("City", city, setCity)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Nationality", nationality, setNationality)}
            {field("Personal email", personalEmail, setPersonalEmail, "email")}
          </div>
          <div className="rounded-lg border border-outline-variant p-4 space-y-4">
            <p className="font-label-md text-label-md text-on-surface">Emergency contact</p>
            {field("Name", ecName, setEcName)}
            {field("Phone", ecPhone, setEcPhone, "tel")}
            {field("Relationship", ecRel, setEcRel)}
          </div>
        </div>
        <DialogFooter className="flex gap-md sm:gap-md">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saveM.isPending} className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending || !ready}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveM.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
