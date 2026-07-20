import { BrandingSection } from "@/components/auth/BrandingSection"
import { SignupForm } from "@/components/auth/SignupForm"

export function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row max-w-[1920px] mx-auto">
      <BrandingSection />
      <section className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop xl:p-24 bg-surface-container-low">
        <SignupForm />
      </section>
    </main>
  )
}
