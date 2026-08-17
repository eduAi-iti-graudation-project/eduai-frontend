import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as api from "@/lib/api"

type Phase = "idle" | "loading" | "set-password" | "revealed" | "failed"

export function VerifyPage() {
 const [searchParams] = useSearchParams()
 const token = searchParams.get("token")

 const [phase, setPhase] = useState<Phase>(token ? "loading" : "idle")
 const [credentials, setCredentials] = useState<api.VerifyEmailResult | null>(null)
 const [failure, setFailure] = useState("")
 const [resent, setResent] = useState(false)
 const [password, setPassword] = useState("")
 const [showPassword, setShowPassword] = useState(false)

 const verify = useMutation({
  mutationFn: (t: string) => api.verifyEmail(t),
  onSuccess: (data) => {
   setCredentials(data)
   setPhase(data.needsPassword ? "set-password" : "revealed")
  },
  onError: (err: Error) => {
   setFailure(err.message)
   setPhase("failed")
  },
 })

 useEffect(() => {
  if (token && phase === "loading") {
   verify.mutate(token)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [token])

 const setPasswordM = useMutation({
  mutationFn: (pw: string) => api.verifyEmail(token!, pw),
  onSuccess: (data) => {
   setCredentials(data)
   setPhase("revealed")
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const resend = useMutation({
  mutationFn: (email: string) => api.resendCredentials(email),
  onSuccess: () => {
   setResent(true)
   toast.success("We sent your login details again — check your inbox.")
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const copyValue = async (value: string) => {
  try {
   await navigator.clipboard.writeText(value)
   toast.success("Copied to clipboard.")
  } catch {
   toast.error("Could not copy. Please copy it manually.")
  }
 }

 return (
  <div className="min-h-screen bg-surface flex items-center justify-center p-xl">
   <div className="w-full max-w-[36rem] bg-surface-container-lowest rounded-lg p-6 md:p-8 shadow-[0_20px_50px_rgba(164,48,115,0.12)]">
    {phase === "loading" && (
     <>
      <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
       Verifying your invitation…
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
       Just a moment while we confirm your invite.
      </p>
     </>
    )}

    {phase === "set-password" && credentials && (
     <>
      <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
       Choose a password
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
       Your school account is ready. Pick a password (at least 8 characters) to
       sign in with your school email.
      </p>
      <form
       className="space-y-4"
       onSubmit={(event) => {
        event.preventDefault()
        if (password) setPasswordM.mutate(password)
       }}
      >
       <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
         <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          minLength={8}
          required
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="pr-10"
         />
         <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-outline transition-colors hover:text-primary"
          aria-label={showPassword ? "Hide password" : "Show password"}
         >
          <span className="material-symbols-outlined text-[20px]">
           {showPassword ? "visibility_off" : "visibility"}
          </span>
         </button>
        </div>
       </div>
       <Button type="submit" className="w-full" disabled={setPasswordM.isPending}>
        {setPasswordM.isPending ? "Setting password…" : "Set password"}
       </Button>
      </form>
     </>
    )}

    {phase === "revealed" && credentials && (
     <>
      <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
       Your school account is ready
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
       Sign in at {window.location.origin}/login with the school email below.
      </p>
      <div className="space-y-3">
       <div className="rounded-md border border-border bg-surface p-4">
        <p className="font-label-sm text-label-sm text-on-surface-variant">School email</p>
        <p className="font-body-md text-body-md text-on-background break-all">{credentials.email}</p>
        <Button
         type="button"
         variant="ghost"
         size="sm"
         className="mt-2"
         onClick={() => copyValue(credentials.email)}
        >
         Copy
        </Button>
       </div>
       {credentials.schoolCode && (
        <div className="rounded-md border border-border bg-surface p-4">
         <p className="font-label-sm text-label-sm text-on-surface-variant">School code</p>
         <p className="font-body-md text-body-md text-on-background">{credentials.schoolCode}</p>
         <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => copyValue(credentials.schoolCode!)}
         >
          Copy
         </Button>
        </div>
       )}
      </div>
      <Link to="/login" className="block mt-6">
       <Button className="w-full">Go to sign in</Button>
      </Link>
     </>
    )}

    {(phase === "failed" || phase === "idle") && (
     <>
      <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
       {phase === "failed" ? "This link has expired" : "Get your login details"}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
       {phase === "failed"
        ? `${failure} Enter the email the invitation was sent to and we'll re-send your details.`
        : "Enter the email the invitation was sent to and we'll send your login details there."}
      </p>
      {resent ? (
       <p className="font-body-md text-body-md text-primary">
        Your login details are on their way — check your inbox.
       </p>
      ) : (
       <form
        className="space-y-4"
        onSubmit={(event) => {
         event.preventDefault()
         const email = (
          event.currentTarget.elements.namedItem("email") as HTMLInputElement
         ).value
         if (email) resend.mutate(email)
        }}
       >
        <div className="space-y-1.5">
         <Label htmlFor="email">Personal email address</Label>
         <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoFocus
         />
        </div>
        <Button type="submit" className="w-full" disabled={resend.isPending}>
         {resend.isPending ? "Sending…" : "Re-send my login details"}
        </Button>
       </form>
      )}
     </>
    )}

    <p className="font-label-md text-label-md text-on-surface-variant text-center mt-6">
     <Link to="/login" className="text-primary hover:underline">
      Back to sign in
     </Link>
    </p>
   </div>
  </div>
 )
}