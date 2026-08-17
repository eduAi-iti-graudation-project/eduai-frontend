import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { cn } from "@/lib/utils"

function getGreeting() {
 const h = new Date().getHours()
 if (h < 12) return "Good morning! Time to start the class."
 if (h < 18) return "Good afternoon! Your AI assistant is ready."
 return "Good evening! Wrapping up the school day?"
}

export function LoginForm() {
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
     const teacherRoles = new Set(["TEACHER", "ADMIN"])
     navigate(teacherRoles.has(user.role) ? "/dashboard" : "/student")
    },
    onError: (error) => {
     toast.error(error.message)
    },
   }
  )
 }

 return (
  <div className="w-full max-w-[440px]">
   <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
    <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center text-white shrink-0">
     <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
      school
     </span>
    </div>
    <span className="font-headline-lg text-headline-lg text-on-surface">EduAI</span>
   </div>

   <header className="mb-6">
    <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-on-background mb-2">Welcome Back</h1>
    <p className="text-body-lg text-on-surface-variant" id="greeting">
     {getGreeting()}
    </p>
   </header>

   <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
    <div className="space-y-1.5">
     <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="email">
      Email Address
     </label>
     <div
      className={cn(
       "group/input flex items-center gap-3 px-4 py-3.5 bg-surface-container-lowest border border-border rounded-lg transition-all",
       "focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)]",
       errors.email ? "border-error" : "border-border",
      )}
     >
      <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">
       mail
      </span>
      <input
       id="email"
       className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
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
     <div className="flex justify-between items-center ml-1">
      <label className="text-body-md font-label-md text-on-background" htmlFor="password">
       Password
      </label>
      <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:underline">
       Forgot password?
      </Link>
     </div>
     <div
      className={cn(
       "group/input flex items-center gap-3 px-4 py-3.5 bg-surface-container-lowest border border-border rounded-lg transition-all",
       "focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)]",
       errors.password ? "border-error" : "border-border",
      )}
     >
      <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">
       lock
      </span>
      <input
       id="password"
       className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
       placeholder="••••••••"
       type={showPassword ? "text" : "password"}
       {...register("password")}
      />
      <button
       type="button"
       tabIndex={-1}
       onClick={() => setShowPassword((prev) => !prev)}
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
     className="w-full mt-4 py-4 bg-primary text-primary-foreground font-headline-md text-body-lg rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
     {login.isPending ? (
      "Logging in..."
     ) : (
      <>
       Login to Dashboard
       <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
        arrow_forward
       </span>
      </>
     )}
    </button>
   </form>

   <footer className="mt-6 text-center">
    <p className="font-body-md text-body-md text-on-surface-variant">
     Don&apos;t have an account?{" "}
     <Link className="text-primary font-bold hover:underline ml-1" to="/signup">
      Sign up for free
     </Link>
    </p>
   </footer>
  </div>
 )
}