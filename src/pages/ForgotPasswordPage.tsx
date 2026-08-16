import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as api from "@/lib/api"

export function ForgotPasswordPage() {
 const searchParams = new URLSearchParams(window.location.search)
 const resetToken = searchParams.get("resetToken")
 const params = new URLSearchParams(window.location.hash.slice(1))
 const token = params.get("access_token") ?? resetToken

 const [password, setPassword] = useState("")
 const [confirm, setConfirm] = useState("")
 const [sent, setSent] = useState(false)

 const reset = useMutation({
  mutationFn: ({ token: t, password: p }: { token: string; password: string }) =>
   api.resetPassword(t, p),
  onSuccess: () => {
   toast.success("Password updated. Signing you in…")
   window.location.assign("/")
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const request = useMutation({
  mutationFn: (email: string) => api.forgotPassword(email),
  onSuccess: () => {
   setSent(true)
  },
  onError: (err: Error) => toast.error(err.message),
 })

 const valid = password.length >= 8 && password === confirm

 const submitNewPassword = (event: React.FormEvent) => {
  event.preventDefault()
  if (!token || !valid || reset.isPending) return
  reset.mutate({ token, password })
 }

 if (token) {
  return (
   <div className="min-h-screen bg-surface flex items-center justify-center p-xl">
    <div className="w-full max-w-[36rem] bg-surface-container-lowest rounded-lg p-6 md:p-8 shadow-[0_20px_50px_rgba(164,48,115,0.12)]">
     <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Choose a new password</h1>
     <p className="font-body-md text-body-md text-on-surface-variant mb-6">
      It must be at least 8 characters long.
     </p>
     <form onSubmit={submitNewPassword} className="space-y-4">
      <div className="space-y-1.5">
       <Label htmlFor="password">New password</Label>
       <Input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoFocus
       />
      </div>
      <div className="space-y-1.5">
       <Label htmlFor="confirm">Confirm password</Label>
       <Input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
       />
       {confirm.length > 0 && password !== confirm && (
        <p className="text-error text-label-sm mt-1">Passwords do not match.</p>
       )}
      </div>
      <Button type="submit" className="w-full" disabled={!valid || reset.isPending}>
       {reset.isPending ? "Updating…" : "Update password"}
      </Button>
     </form>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-surface flex items-center justify-center p-xl">
   <div className="w-full max-w-[36rem] bg-surface-container-lowest rounded-lg p-6 md:p-8 shadow-[0_20px_50px_rgba(164,48,115,0.12)]">
    <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
     {sent ? "Check your inbox" : "Reset your password"}
    </h1>
    <p className="font-body-md text-body-md text-on-surface-variant mb-6">
     {sent
      ? "If an account exists for that email, a password reset link has been sent. The link expires after 30 minutes."
      : "Enter the email you signed up with and we'll send you a reset link."}
    </p>
    {!sent && (
     <form
      className="space-y-4"
      onSubmit={(event) => {
       event.preventDefault()
       const email = (event.currentTarget.elements.namedItem("email") as HTMLInputElement).value
       if (email) request.mutate(email)
      }}
     >
      <div className="space-y-1.5">
       <Label htmlFor="email">Email Address</Label>
       <Input id="email" name="email" type="email" placeholder="name@school.edu" required autoFocus />
      </div>
      <Button type="submit" className="w-full" disabled={request.isPending}>
       {request.isPending ? "Sending…" : "Send reset link"}
      </Button>
     </form>
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
