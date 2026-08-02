import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { signupSchema, type SignupFormData } from "@/lib/validations"
import { RoleToggle } from "./RoleToggle"
import { SocialLogin } from "./SocialLogin"

type Role = "teacher" | "student"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>("teacher")
  const { signup } = useAuth()
  const navigate = useNavigate()

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
        ...(role === "student" && data.gradeLevel ? { gradeLevel: data.gradeLevel } : {}),
      },
      {
        onSuccess: (user) => {
          toast.success("Account created!")
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
    <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(10,24,66,0.05)] tactile-card">
      <div className="md:hidden mb-8 text-center">
        <span className="font-headline-lg text-headline-lg text-primary">EduAI</span>
      </div>

      <header className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Create Account</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Join the future of classroom management.</p>
      </header>

      <RoleToggle value={role} onChange={setRole} className="mb-6" />

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

        {role === "student" && (
          <div className="space-y-1.5">
            <label className="font-label-md text-on-background ml-1" htmlFor="gradeLevel">Grade Level</label>
            <div className="group/input flex items-center gap-3 px-4 py-3 bg-white border-2 border-surface-container-highest rounded-xl focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,105,81,0.1)] transition-all">
              <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">school</span>
              <select
                id="gradeLevel"
                className="bg-transparent border-none focus:ring-0 w-full text-body-md text-on-surface placeholder:text-outline-variant outline-none appearance-none cursor-pointer"
                {...register("gradeLevel", { valueAsNumber: true })}
              >
                <option value="" className="text-outline-variant">Select your grade</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
                  <option key={level} value={level} className="text-on-surface">Grade {level}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline pointer-events-none">expand_more</span>
            </div>
            {errors.gradeLevel && (
              <p className="text-error text-label-sm ml-1 mt-1">{errors.gradeLevel.message}</p>
            )}
          </div>
        )}

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

      <div className="flex items-center gap-4 my-6">
        <div className="h-[1px] flex-1 bg-surface-container-highest" />
        <span className="font-label-sm text-label-sm text-outline-variant tracking-widest uppercase whitespace-nowrap">OR SIGN UP WITH</span>
        <div className="h-[1px] flex-1 bg-surface-container-highest" />
      </div>

      <SocialLogin />

      <footer className="mt-6 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already have an account?{" "}
          <Link className="text-primary font-bold hover:underline ml-1" to="/login">Log in</Link>
        </p>
      </footer>
    </div>
  )
}
