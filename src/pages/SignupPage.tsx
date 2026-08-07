import { SignupForm } from "@/components/auth/SignupForm"

export function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low p-margin-mobile md:p-margin-desktop">
      <SignupForm />
    </main>
  )
}