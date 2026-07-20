import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: (user) => {
          toast.success("Welcome back!")
          navigate(user.role === "TEACHER" ? "/dashboard" : "/student-portal")
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <main className="min-h-screen bg-surface-bright flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <div className="w-full max-w-[450px]">
        <div className="text-center mb-lg">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-md">EduAI</h1>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Welcome Back</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Sign in to your account to continue.</p>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(10,24,66,0.05)] tactile-card">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="font-label-md text-on-background ml-1" htmlFor="email">Email Address</label>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-xl transition-all",
                "focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)]",
                errors.email ? "border-error" : "border-surface-container-highest"
              )}>
                <span className="material-symbols-outlined text-outline shrink-0">mail</span>
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

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <button type="button" className="font-label-sm text-label-sm text-primary hover:underline">Forgot?</button>
              </div>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-xl transition-all",
                "focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)]",
                errors.password ? "border-error" : "border-surface-container-highest"
              )}>
                <span className="material-symbols-outlined text-outline shrink-0">lock</span>
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
              disabled={login.isPending}
              className="w-full py-4 bg-secondary-container text-white font-headline-md rounded-full shadow-lg shadow-secondary-container/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {login.isPending ? (
                "Logging in..."
              ) : (
                <>
                  Login to Dashboard
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-surface-container-highest" />
            <span className="font-label-sm text-label-sm text-outline-variant tracking-widest uppercase whitespace-nowrap">OR SIGN IN WITH</span>
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
              Don&apos;t have an account?{" "}
              <Link className="text-primary font-bold hover:underline ml-1" to="/signup">Sign up for free</Link>
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
