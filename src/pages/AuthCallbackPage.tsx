import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"
import * as api from "@/lib/api"

type Mode = "create" | "join"

export function AuthCallbackPage() {
 const params = useMemo(() => new URLSearchParams(window.location.hash.slice(1)), [])
 const token = params.get("access_token")

 const [checking, setChecking] = useState(Boolean(token) || Boolean(api.getStoredToken()))
 const [needsOnboarding, setNeedsOnboarding] = useState(false)
 const [mode, setMode] = useState<Mode>("create")
 const [organizationName, setOrganizationName] = useState("")
 const [joinCode, setJoinCode] = useState("")
 const [fieldError, setFieldError] = useState<string | null>(null)

 useEffect(() => {
  const stored = api.getStoredToken()
  if (token) {
   api.storeToken(token)
   window.history.replaceState(null, "", window.location.pathname + window.location.search)
  }
  if (!token && !stored) return
  void api
   .getMe()
   .then((user) => {
    if (!user.organizationId) {
     setNeedsOnboarding(true)
    } else {
     window.location.assign("/")
    }
   })
   .catch(() => {
    window.location.assign("/login")
   })
   .finally(() => setChecking(false))
 }, [token])

 const onboard = useMutation({
  mutationFn: () =>
   api.oauthOnboard(
    mode === "create"
     ? { organizationName: organizationName.trim() }
     : { joinCode: joinCode.trim().toUpperCase() },
   ),
  onSuccess: () => {
   window.location.assign("/admin")
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const submit = (event: React.FormEvent) => {
  event.preventDefault()
  setFieldError(null)
  const value = mode === "create" ? organizationName.trim() : joinCode.trim()
  if (!value) {
   setFieldError(
    mode === "create"
     ? "Please enter your school's name."
     : "Please enter your school's code.",
   )
   return
  }
  onboard.mutate()
 }

 if (checking) {
  return <LoadingState label="Completing sign-in…" className="min-h-screen" />
 }

 if (!token && !needsOnboarding) {
  return (
   <div className="min-h-screen bg-surface flex items-center justify-center p-xl">
    <div className="max-w-[36rem] text-center">
     <span className="material-symbols-outlined text-[48px] text-error block mb-3">error_outline</span>
     <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Sign-in incomplete</h1>
     <p className="font-body-md text-body-md text-on-surface-variant">
      The sign-in link is incomplete or has expired. Please try again.
     </p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-surface flex items-center justify-center p-xl">
   <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-lg p-6 md:p-8 shadow-[0_20px_50px_rgba(164,48,115,0.12)]">
    <div className="md:hidden mb-6 text-center">
     <span className="font-headline-lg text-headline-lg text-on-surface">EduAI</span>
    </div>

    <header className="mb-md">
     <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-on-background mb-2">
      Finish setting up your school
     </h1>
     <p className="text-body-lg text-on-surface-variant">
      Create a new school or join an existing one to continue.
     </p>
    </header>

    <div className="flex p-1 bg-surface-variant rounded-lg mb-md">
     <button
      type="button"
      className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all duration-300 ${
       mode === "create" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
      }`}
      onClick={() => setMode("create")}
     >
      Create a school
     </button>
     <button
      type="button"
      className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all duration-300 ${
       mode === "join" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
      }`}
      onClick={() => setMode("join")}
     >
      Join a school
     </button>
    </div>

    <form className="space-y-4" onSubmit={submit}>
     {mode === "create" ? (
      <div className="space-y-1.5">
       <Label htmlFor="organizationName">School Name</Label>
       <Input
        id="organizationName"
        placeholder="e.g. Springfield High School"
        value={organizationName}
        onChange={(event) => setOrganizationName(event.target.value)}
        autoFocus
       />
       <p className="text-on-surface-variant text-label-sm ml-1">
        This creates the school's workspace and its join code.
       </p>
      </div>
     ) : (
      <div className="space-y-1.5">
       <Label htmlFor="joinCode">Join Code</Label>
       <Input
        id="joinCode"
        placeholder="e.g. DEMO2026"
        className="uppercase tracking-widest"
        value={joinCode}
        onChange={(event) => setJoinCode(event.target.value)}
        autoFocus
       />
       <p className="text-on-surface-variant text-label-sm ml-1">
        Ask your school administrator for the code to join their organization.
       </p>
      </div>
     )}
     {fieldError && <p className="text-error text-label-sm ml-1">{fieldError}</p>}
     <Button type="submit" className="w-full" disabled={onboard.isPending}>
      {onboard.isPending ? "Setting up…" : mode === "create" ? "Create school" : "Join school"}
     </Button>
    </form>
   </div>
  </div>
 )
}