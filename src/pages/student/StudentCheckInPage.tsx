import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useCheckInAttendance } from "@/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import type { CheckInResult } from "@/lib/api"

function statusStyle(status: string): string {
 switch (status) {
  case "PRESENT":
   return "bg-success/15 text-success border-success/40"
  case "LATE":
   return "bg-surface-container-high text-on-surface border-surface-container-high"
  default:
   return "bg-surface-container-low text-on-surface-variant border-outline-variant"
 }
}

export function StudentCheckInPage() {
 const [searchParams] = useSearchParams()
 const initialToken = searchParams.get("session") ?? ""
 const [manualToken, setManualToken] = useState("")
 const checkIn = useCheckInAttendance()
 const [result, setResult] = useState<CheckInResult | null>(null)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  if (!initialToken) return
  checkIn.mutate(initialToken, {
   onSuccess: (res) => setResult(res),
   onError: (err: Error) => setError(err.message),
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [initialToken])

 const handleManual = () => {
  if (!manualToken.trim()) return
  setError(null)
  setResult(null)
  checkIn.mutate(manualToken.trim(), {
   onSuccess: (res) => setResult(res),
   onError: (err: Error) => setError(err.message),
  })
 }

 return (
  <div className="flex-1 p-xl max-w-md mx-auto w-full flex flex-col justify-center">
   <div className="text-center mb-lg">
    <div className="mx-auto w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-md">
     <span className="material-symbols-outlined text-3xl text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
      how_to_reg
     </span>
    </div>
    <h1 className="font-headline-xl text-headline-xl text-primary">Check-in</h1>
    <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Enter the code your teacher shared to record your attendance.</p>
   </div>

   {checkIn.isPending && <LoadingState className="py-lg" />}

   {result && (
    <div className="bg-surface-container-lowest rounded-lg p-xl border border-success/40 text-center">
     <div className="text-success mb-sm">
      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
       {result.alreadyCheckedIn ? "verified_user" : "check_circle"}
      </span>
     </div>
     <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
      {result.alreadyCheckedIn ? "Already checked in" : "Check-in confirmed"}
     </h2>
     <p className="font-label-md text-label-md text-on-surface-variant">
      {result.courseName} · {result.sectionName}
     </p>
     <div className="mt-md">
      <span className={`inline-block px-lg py-sm rounded-lg font-label-lg text-label-lg border ${statusStyle(result.status)}`}>{result.status}</span>
     </div>
     <p className="font-body-sm text-body-sm text-on-surface-variant mt-md">Teacher: {result.teacherName}</p>
    </div>
   )}

   {error && !result && (
    <div className="bg-surface-container-lowest rounded-lg p-xl border border-accent/40">
     <div className="text-accent mb-sm">
      <span className="material-symbols-outlined text-4xl">error</span>
     </div>
     <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Check-in failed</h2>
     <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
    </div>
   )}

   {!result && !checkIn.isPending && (
    <div className="bg-surface-container-lowest rounded-lg p-xl">
     <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Session code</label>
     <input
      value={manualToken}
      onChange={(e) => setManualToken(e.target.value)}
      placeholder={initialToken ? initialToken : "Paste the code from your teacher..."}
      className="w-full h-auto rounded-lg bg-surface px-4 py-2 font-body-md text-body-md text-on-surface form-input-focus"
     />
     <Button
      type="button"
      onClick={handleManual}
      disabled={!manualToken.trim() || checkIn.isPending}
      className="mt-md w-full px-lg h-auto py-sm bg-primary text-primary-foreground font-label-md text-label-md rounded-lg nudge-hover disabled:opacity-50"
     >
      Check in
     </Button>
    </div>
   )}

   {!initialToken && !result && (
    <div className="mt-lg">
     <EmptyState icon="qr_code_2" title="No session link" description="Scan the QR code in class or paste the session code above." />
    </div>
   )}
  </div>
 )
}