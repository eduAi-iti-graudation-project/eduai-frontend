import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { getErrorCode, normalizeJoinCode } from "@/lib/api"
import { joinSignupSchema, type JoinSignupFormData } from "@/lib/validations"
import { RoleToggle } from "./RoleToggle"
import { SocialLogin } from "./SocialLogin"

type Role = "teacher" | "student"
type Mode = "create" | "join"

const JOIN_CODE_ERRORS: Record<string, string> = {
  JOIN_CODE_INVALID: "This join code isn't valid. Check with your school administrator.",
  INVITE_EMAIL_TAKEN: "An account with this email already belongs to this organization.",
  REQUEST_ALREADY_EXISTS: "A request for this account is already awaiting review.",
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>("teacher")
  const [mode, setMode] = useState<Mode>("create")
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    unregister,
    formState: { errors },
  } = useForm<JoinSignupFormData>({
    resolver: zodResolver(joinSignupSchema),
  })

  const onSuccess = (result: { status: "PENDING"; message: string } | { role: string }) => {
    if ("status" in result) {
      setPendingMessage(result.message)
      return
    }
    toast.success("Account created!")
    const teacherRoles = new Set(["TEACHER", "ADMIN"])
    navigate(teacherRoles.has(result.role) ? "/dashboard" : "/student")
  }

  const submitCreate = (data: JoinSignupFormData) => {
    const organizationName = data.organizationName?.trim()
    if (!organizationName) {
      setError("organizationName", { type: "manual", message: "Please enter your school's name." })
      return
    }
    signup.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        organizationName,
      },
      { onSuccess, onError: (error) => toast.error(error.message) },
    )
  }

  const submitJoin = (data: JoinSignupFormData) => {
    const joinCode = normalizeJoinCode(data.joinCode ?? "")
    if (!joinCode) {
      setError("joinCode", { type: "manual", message: "Please enter your school's join code." })
      return
    }
    signup.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role.toUpperCase() as "TEACHER" | "STUDENT",
        joinCode,
        ...(role === "student" ? { gradeLevel: data.gradeLevel } : {}),
      },
      {
        onSuccess,
        onError: (error) => {
          const code = getErrorCode(error)
          if (code && JOIN_CODE_ERRORS[code]) {
            setError("joinCode", { type: "manual", message: JOIN_CODE_ERRORS[code] })
          } else {
            toast.error(error.message)
          }
        },
      },
    )
  }

  const switchMode = (next: Mode) => {
    if (next === "join") {
      unregister("organizationName")
    } else {
      unregister("joinCode")
      unregister("gradeLevel")
    }
    setMode(next)
    clearErrors()
  }

  if (pendingMessage) {
    return (
      <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-lg p-8 md:p-10 text-center">
        <div className="mx-auto w-16 h-16 rounded-lg bg-primary-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">hourglass_top</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Request submitted</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">{pendingMessage}</p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          You&apos;ll be able to sign in once your school administrator approves your account.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-block w-full py-4 bg-primary text-primary-foreground font-headline-md rounded-lg hover:scale-[1.01] active:scale-95 transition-all text-center"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-lg p-6 md:p-8">
      <div className="md:hidden mb-6 text-center">
        <span className="font-headline-lg text-headline-lg text-primary">EduAI</span>
      </div>

      <header className="mb-5">
        <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-on-background mb-2">Create Account</h1>
        <p className="text-body-lg text-on-surface-variant">Join the future of classroom management.</p>
      </header>

      {/* Mode toggle */}
      <div className="flex p-1 bg-surface-variant rounded-lg mb-5">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all duration-300 ${
            mode === "create" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
          }`}
          onClick={() => switchMode("create")}
        >
          Create a school
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all duration-300 ${
            mode === "join" ? "text-on-primary-container bg-primary-container" : "text-on-surface-variant"
          }`}
          onClick={() => switchMode("join")}
        >
          Join a school
        </button>
      </div>

      {mode === "join" && <RoleToggle value={role} onChange={setRole} className="mb-5" />}

      <form
        className="space-y-4"
        onSubmit={handleSubmit(mode === "create" ? submitCreate : submitJoin)}
      >
        {mode === "create" && (
          <div className="space-y-1.5">
            <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="organizationName">School Name</label>
            <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all ${
              errors.organizationName ? "border-error" : ""
            }`}>
              <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">school</span>
              <input
                id="organizationName"
                className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-outline-variant outline-none"
                placeholder="e.g. Springfield High School"
                type="text"
                {...register("organizationName")}
              />
            </div>
            {errors.organizationName && (
              <p className="text-error text-label-sm ml-1 mt-1">{errors.organizationName.message}</p>
            )}
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-1.5">
            <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="joinCode">Join Code</label>
            <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all ${
              errors.joinCode ? "border-error" : ""
            }`}>
              <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">key</span>
              <input
                id="joinCode"
                className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-outline-variant outline-none uppercase tracking-widest"
                placeholder="e.g. DEMO2026"
                type="text"
                autoComplete="off"
                {...register("joinCode")}
              />
            </div>
            {errors.joinCode && (
              <p className="text-error text-label-sm ml-1 mt-1">{errors.joinCode.message}</p>
            )}
            <p className="text-on-surface-variant text-label-sm ml-1">
              Ask your school administrator for the code to join their organization.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="name">Full Name</label>
          <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all">
            <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">person</span>
            <input
              id="name"
              className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-outline-variant outline-none"
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
          <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="email">Email Address</label>
          <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all">
            <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">mail</span>
            <input
              id="email"
              className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-outline-variant outline-none"
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
          <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="password">Password</label>
          <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all">
            <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">lock</span>
            <input
              id="password"
              className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-outline-variant outline-none"
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

        {mode === "join" && role === "student" && (
          <div className="space-y-1.5">
            <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="gradeLevel">Grade Level</label>
            <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all">
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
          className="w-full mt-4 py-4 bg-primary text-primary-foreground font-headline-md text-body-lg rounded-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {signup.isPending ? (
            "Submitting..."
          ) : (
            <>
              {mode === "join" ? "Request to Join" : "Get Started"}
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
