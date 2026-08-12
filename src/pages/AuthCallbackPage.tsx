import { useEffect, useMemo } from "react"
import { LoadingState } from "@/components/shared/LoadingState"
import * as api from "@/lib/api"

export function AuthCallbackPage() {
  const params = useMemo(() => new URLSearchParams(window.location.hash.slice(1)), [])
  const token = params.get("access_token")

  useEffect(() => {
    if (token) {
      api.storeToken(token)
      window.location.assign("/")
    }
  }, [token])

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-xl">
        <div className="max-w-md text-center">
          <span className="material-symbols-outlined text-[48px] text-error block mb-3">error_outline</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Sign-in incomplete</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The sign-in link is incomplete or has expired. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return <LoadingState label="Completing sign-in…" className="min-h-screen" />
}