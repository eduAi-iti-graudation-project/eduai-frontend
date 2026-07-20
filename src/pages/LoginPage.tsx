import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import authImg from "@/assets/auth.png"

type Role = "teacher" | "student"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning! Time to start the class."
  if (h < 18) return "Good afternoon! Your AI assistant is ready."
  return "Good evening! Wrapping up the school day?"
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>("teacher")
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
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side: Branding & Illustration */}
      <section className="relative w-full md:w-1/2 bg-surface flex flex-col items-center justify-center p-8 md:p-10 overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-fixed/20 blur-3xl rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="absolute top-8 left-8 z-20">
          <span className="font-headline-lg text-headline-lg text-primary font-bold">EduAI</span>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-1/4 left-[6%] z-20 animate-float hidden lg:block" style={{ animationDelay: "0.5s" }}>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-surface-variant">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-1/4 right-[6%] z-20 animate-float hidden lg:block" style={{ animationDelay: "1.2s" }}>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-surface-variant">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-on-surface-variant leading-none">Insight</p>
              <p className="text-[10px] text-outline">Real-time Data</p>
            </div>
          </div>
        </div>

        {/* Central Content */}
        <div className="relative z-10 text-center w-[85%] max-w-2xl">
          <div className="mb-4 shadow-2xl rounded-2xl overflow-hidden">
            <img
              alt="3D graduation cap resting on a stack of books"
              className="w-full h-auto object-contain drop-shadow-2xl"
              src={authImg}
            />
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            Empowering education through artificial intelligence
          </p>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface-container-low">
        <div className="w-full max-w-[460px] bg-surface-container-lowest p-6 md:p-8 lg:p-10 rounded-[32px] tactile-card">
          {/* Header */}
          <header className="mb-md text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Welcome Back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant" id="greeting">{getGreeting()}</p>
          </header>

          {/* Role Toggle */}
          <div className="mb-md p-1 bg-surface-variant rounded-full flex">
            <button
              type="button"
              className={cn(
                "flex-1 py-2 rounded-full font-label-md flex items-center justify-center gap-2 transition-all duration-300",
                role === "teacher"
                  ? "bg-primary-container text-on-primary-container shadow-sm"
                  : "text-on-surface-variant"
              )}
              onClick={() => setRole("teacher")}
            >
              <span className="material-symbols-outlined text-[20px]">school</span>
              Teacher
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 py-2 rounded-full font-label-md flex items-center justify-center gap-2 transition-all duration-300",
                role === "student"
                  ? "bg-primary-container text-on-primary-container shadow-sm"
                  : "text-on-surface-variant"
              )}
              onClick={() => setRole("student")}
            >
              <span className="material-symbols-outlined text-[20px]">face</span>
              Student
            </button>
          </div>

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface ml-base" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">mail</span>
                <input
                  id="email"
                  className={cn(
                    "form-input-focus w-full pl-12 pr-md py-4 rounded-xl border-2 bg-white text-on-surface placeholder:text-outline-variant font-body-md transition-all outline-none",
                    errors.email ? "border-error" : "border-surface-container-highest"
                  )}
                  placeholder="e.g. name@school.edu"
                  type="email"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-error text-label-sm ml-1 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center px-base">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <button type="button" className="font-label-sm text-label-sm text-primary hover:underline font-bold">Forgot password?</button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">lock</span>
                <input
                  id="password"
                  className={cn(
                    "form-input-focus w-full pl-12 pr-md py-4 rounded-xl border-2 bg-white text-on-surface placeholder:text-outline-variant font-body-md transition-all outline-none",
                    errors.password ? "border-error" : "border-surface-container-highest"
                  )}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-outline-variant">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-label-sm ml-1 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* CTA Button + Social + Footer (inside form in Stitch) */}
            <div className="pt-lg space-y-4">
              <button
                type="submit"
                disabled={login.isPending}
                className="btn-hover-arrow w-full py-4 bg-secondary-container text-white font-label-md text-label-md rounded-full shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {login.isPending ? (
                  "Logging in..."
                ) : (
                  <>
                    Login to Dashboard
                    <span className="material-symbols-outlined transition-transform duration-300" data-icon="arrow_forward">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Social Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-surface-container-highest" />
                <span className="font-label-sm text-label-sm text-outline-variant uppercase tracking-wider whitespace-nowrap">OR CONTINUE WITH</span>
                <div className="h-px flex-1 bg-surface-container-highest" />
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-surface-container-highest rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <img
                    alt="Google Logo"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJkzg9rDLE7XZdaUozY_15Wi43RZS2kgdG0eeCJ9pkLVFuDyNSoaWsi8H4h5t8CXZuG6cKkJHO1jt9hzxmRrbOn6crP1dWEvxsNkk0l5YV66sOKe88wd3ygQgQ8d8snOpgDfXJ9rNqdEUYXf0jOZfG39mEp6mOVu1GVKWWZWwezFrTACmZQcEGKPJlURa_mU5Pk7xVSrajlsEXdnZ5kRzXUs2POOXh4n7ffNCKS6oqeG1B0eZYPg5M"
                  />
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-surface-container-highest rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-primary" data-icon="grid_view">grid_view</span>
                  Microsoft
                </button>
              </div>

              {/* Footer Links */}
              <footer className="mt-md text-center">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Don&apos;t have an account?{" "}
                  <Link className="text-primary font-bold hover:underline" to="/signup">Sign up for free</Link>
                </p>
              </footer>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
