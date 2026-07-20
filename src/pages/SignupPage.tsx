import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { signupSchema, type SignupFormData } from "@/lib/validations"
import { cn } from "@/lib/utils"

type Role = "teacher" | "student"

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>("teacher")
  const { signup } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = (data: SignupFormData) => {
    signup.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role.toUpperCase() as "TEACHER" | "STUDENT",
      },
      {
        onSuccess: () => {
          toast.success("Account created!")
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <section className="hidden md:flex md:w-1/2 bg-surface relative flex-col justify-between p-margin-desktop overflow-hidden">
        <div className="z-10">
          <span className="font-headline-lg text-headline-lg text-primary tracking-tight">EduAI</span>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center">
          <div className="absolute top-1/4 left-1/4 animate-float bg-surface-container-lowest tactile-card p-4 rounded-2xl flex items-center gap-3 z-20">
            <span className="material-symbols-outlined text-primary-container text-3xl">smart_toy</span>
            <div className="flex flex-col">
              <span className="font-label-md text-on-surface">Assistant</span>
              <span className="text-xs text-on-surface-variant">Ready to help</span>
            </div>
          </div>

          <div className="absolute bottom-1/4 right-1/4 animate-float-delayed bg-surface-container-lowest tactile-card p-4 rounded-2xl flex items-center gap-3 z-20">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <div className="flex flex-col">
              <span className="font-label-md text-on-surface">Insight</span>
              <span className="text-xs text-on-surface-variant">New suggestion</span>
            </div>
          </div>

          <div className="w-full max-w-md relative z-10 transition-transform duration-700 hover:scale-105">
            <img
              alt="EduAI"
              className="w-full h-auto drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida/AP1WRLt9HJKH-lwtn2dFJvnDHn6htm1MKtHUIIlGtSUxPU3foL6CxC6kHZ8kem8HQwY1OXrTRJSZHrJHyURPtsVcUWK3BTB0HcrLrzAwAnBkGkMghjNZ_VeyMAVFax9E8ruSJUzpegKn9k2I-fS3qcaXqIwrcpEmFDRKrVeG-yDtIeAVJoWsq-VRd8V0rcP_mD3HUqwkfzimOwMBMgTIbMhnJeo0cDeg8F5TbF2tFAImQfzq9Mul2PUD9yJSfZE"
            />
          </div>
        </div>

        <div className="z-10 text-center">
          <p className="font-body-lg text-body-lg text-on-background opacity-80 max-w-sm mx-auto">
            Empowering education through artificial intelligence
          </p>
        </div>

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary-fixed opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface-container-low">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(10,24,66,0.05)] tactile-card">
          <div className="md:hidden mb-8 text-center">
            <span className="font-headline-lg text-headline-lg text-primary">EduAI</span>
          </div>

          <header className="mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Create Account</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Join the future of classroom management.</p>
          </header>

          <div className="flex p-1 bg-surface-variant rounded-full mb-8 relative">
            <button
              type="button"
              className={cn(
                "flex-1 py-2 rounded-full font-label-md transition-all duration-300 z-10",
                role === "teacher" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
              )}
              onClick={() => setRole("teacher")}
            >
              Teacher
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 py-2 rounded-full font-label-md transition-all duration-300 z-10",
                role === "student" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
              )}
              onClick={() => setRole("student")}
            >
              Student
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="font-label-md text-on-background ml-1" htmlFor="name">Full Name</label>
              <div className="group/input flex items-center gap-3 px-4 py-3 bg-white border-2 border-surface-container-highest rounded-xl focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)] transition-all">
                <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">person</span>
                <input
                  id="name"
                  className="bg-transparent border-none focus:ring-0 w-full text-body-md placeholder:text-outline-variant outline-none"
                  placeholder="John Doe"
                  type="text"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-error text-label-sm ml-1 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-on-background ml-1" htmlFor="email">Email Address</label>
              <div className="group/input flex items-center gap-3 px-4 py-3 bg-white border-2 border-surface-container-highest rounded-xl focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)] transition-all">
                <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">mail</span>
                <input
                  id="email"
                  className="bg-transparent border-none focus:ring-0 w-full text-body-md placeholder:text-outline-variant outline-none"
                  placeholder="name@school.edu"
                  type="email"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-error text-label-sm ml-1 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-on-background ml-1" htmlFor="password">Password</label>
              <div className="group/input flex items-center gap-3 px-4 py-3 bg-white border-2 border-surface-container-highest rounded-xl focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)] transition-all">
                <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">lock</span>
                <input
                  id="password"
                  className="bg-transparent border-none focus:ring-0 w-full text-body-md placeholder:text-outline-variant outline-none"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(prev => !prev)}
                  className="flex items-center justify-center hover:text-primary transition-colors shrink-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-outline">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-label-sm ml-1 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={signup.isPending}
              className="w-full mt-4 py-4 bg-secondary-container text-white font-headline-md rounded-full shadow-lg shadow-secondary-container/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {signup.isPending ? (
                "Creating account..."
              ) : (
                <>
                  Get Started
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-surface-container-highest" />
            <span className="font-label-sm text-label-sm text-outline-variant tracking-widest uppercase whitespace-nowrap">OR SIGN UP WITH</span>
            <div className="h-[1px] flex-1 bg-surface-container-highest" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-3 py-3 border-2 border-surface-container-highest rounded-xl hover:bg-surface transition-colors font-label-md text-on-surface"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-3 py-3 border-2 border-surface-container-highest rounded-xl hover:bg-surface transition-colors font-label-md text-on-surface"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <rect fill="#f35325" height="11" width="11" />
                <rect fill="#81bc06" height="11" width="11" x="12" />
                <rect fill="#05a6f0" height="11" width="11" y="12" />
                <rect fill="#ffba08" height="11" width="11" x="12" y="12" />
              </svg>
              Microsoft
            </button>
          </div>

          <footer className="mt-8 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{" "}
              <Link className="text-primary font-bold hover:underline ml-1" to="/login">Log in</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}
