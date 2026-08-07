import { LoginForm } from "@/components/auth/LoginForm"

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low p-margin-mobile md:p-margin-desktop">
      <LoginForm />
    </main>
  )
}