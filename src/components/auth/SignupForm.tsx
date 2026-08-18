import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import {
  getErrorCode,
  normalizeJoinCode,
  fetchSchoolByCode,
  signStudentUp,
  signupTeacher,
  signupGuardian,
  uploadOrgLogo,
  type SchoolByCode,
} from "@/lib/api"
import {
 joinSignupSchema,
 teacherSignupSchema,
 guardianSignupSchema,
 type JoinSignupFormData,
 type TeacherSignupFormData,
 type GuardianSignupFormData,
} from "@/lib/validations"
import { RoleToggle, type SignupRole } from "./RoleToggle"
import { SocialLogin } from "./SocialLogin"

type Mode = "create" | "join"

type SignupFormData = TeacherSignupFormData & GuardianSignupFormData

const STUDENT_ERRORS: Record<string, string> = {
 SCHOOL_CODE_INVALID: "This school code isn't valid. Check with your school administrator.",
 EMAIL_IN_USE: "An account with this email already belongs to this school.",
 ALREADY_APPLIED: "A request for this email is already awaiting review.",
}

const GUARDIAN_ERRORS: Record<string, string> = {
 SCHOOL_CODE_INVALID: "This school code isn't valid. Check with your school administrator.",
 EMAIL_IN_USE: "An account with this email already belongs to this school.",
 ALREADY_APPLIED: "A request for this email is already awaiting review.",
 STUDENT_NOT_FOUND:
  "We couldn't find a student with this school email at this school. Ask your school for the exact address.",
}

const TEACHER_ERRORS: Record<string, string> = {
 JOIN_CODE_INVALID: "This join code isn't valid. Check with your school administrator.",
 INVITE_EMAIL_TAKEN: "An account with this email already belongs to this organization.",
 REQUEST_ALREADY_EXISTS: "A request for this account is already awaiting review.",
 SSN_INVALID: "That SSN doesn't look right. Please check it and try again.",
 PHOTO_INVALID: "The photo must be a JPEG or PNG image.",
 PHOTO_REQUIRED: "A personal photo is required.",
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const MAX_LOGO_BYTES = 5 * 1024 * 1024

export function SignupForm() {
 const [showPassword, setShowPassword] = useState(false)
 const [role, setRole] = useState<SignupRole>("teacher")
 const [mode, setMode] = useState<Mode>("create")
 const [pendingMessage, setPendingMessage] = useState<string | null>(null)
 const [schoolInfo, setSchoolInfo] = useState<SchoolByCode | null>(null)
 const [schoolInfoError, setSchoolInfoError] = useState<string | null>(null)
 const [photoFile, setPhotoFile] = useState<File | null>(null)
 const [photoPreview, setPhotoPreview] = useState<string | null>(null)
 const [photoError, setPhotoError] = useState<string | null>(null)
 const [logoFile, setLogoFile] = useState<File | null>(null)
 const [logoPreview, setLogoPreview] = useState<string | null>(null)
 const [logoError, setLogoError] = useState<string | null>(null)
 const [guardianSectionOpen, setGuardianSectionOpen] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const { signup } = useAuth()
 const navigate = useNavigate()

 const {
  register,
  handleSubmit,
  setError,
  clearErrors,
  unregister,
  formState: { errors },
 } = useForm<SignupFormData>({
  resolver: zodResolver(
   role === "teacher" && mode === "join"
    ? teacherSignupSchema
    : role === "guardian"
     ? guardianSignupSchema
     : joinSignupSchema,
  ) as unknown as Resolver<SignupFormData>,
 })

 const submitCreate = async (data: JoinSignupFormData) => {
  const organizationName = data.organizationName?.trim()
  if (!organizationName) {
   setError("organizationName", { type: "manual", message: "Please enter your school's name." })
   return
  }
  setSubmitting(true)
  try {
   const result = await signup.mutateAsync({
    name: data.name,
    email: data.email,
    password: data.password,
    organizationName,
   })
   if ("status" in result) {
    setPendingMessage(result.message)
    return
   }
   if (logoFile) {
    try {
     await uploadOrgLogo(logoFile)
    } catch {
     toast.error("Account created, but the school logo could not be uploaded. You can add it later from school settings.")
    }
   }
   toast.success("Account created!")
   const teacherRoles = new Set(["TEACHER", "ADMIN"])
   navigate(teacherRoles.has(result.role) ? "/dashboard" : "/student")
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Sign up failed. Please try again.")
  } finally {
   setSubmitting(false)
  }
 }

 const submitStudentJoin = async (data: JoinSignupFormData) => {
  const schoolCode = normalizeJoinCode(data.joinCode ?? "")
  if (!schoolCode) {
   setError("joinCode", { type: "manual", message: "Please enter your school's code." })
   return
  }
  try {
   const result = await signStudentUp({
    schoolCode,
    firstName: data.name,
    email: data.email,
    password: data.password,
    ...(data.guardianName && data.guardianEmail
     ? { guardianName: data.guardianName, guardianEmail: data.guardianEmail }
     : {}),
   })
   const matched =
    result.matchedFromRoster && result.gradeLevelName
     ? ` We matched you to your school's records (${result.gradeLevelName}).`
     : ""
   setPendingMessage(
    `Your request was submitted for review.${matched} An administrator will approve your account shortly.`,
   )
  } catch (error) {
   const code = getErrorCode(error)
   if (code === "EMAIL_IN_USE") {
    setError("email", { type: "manual", message: STUDENT_ERRORS[code] })
   } else if (code === "SCHOOL_CODE_INVALID") {
    setError("joinCode", { type: "manual", message: STUDENT_ERRORS[code] })
   } else if (code === "ALREADY_APPLIED") {
    setPendingMessage(
     "A request for this email is already awaiting review. You'll be able to sign in once an administrator approves it.",
    )
   } else if (code && STUDENT_ERRORS[code]) {
    toast.error(STUDENT_ERRORS[code])
   } else {
    toast.error(error instanceof Error ? error.message : "The request failed. Please try again.")
   }
  }
 }

 const submitTeacherJoin = async (data: TeacherSignupFormData) => {
  if (!photoFile) {
   setPhotoError("A personal photo is required.")
   return
  }
  setSubmitting(true)
  try {
   const form = new FormData()
   form.append("photo", photoFile)
   form.append("name", data.name)
   form.append("email", data.email)
   form.append("password", data.password)
   form.append("joinCode", normalizeJoinCode(data.joinCode ?? ""))
   form.append("ssn", data.ssn)
   form.append("phone", data.phone)
   form.append("street", data.street)
   form.append("city", data.city)
   if (data.nationality) form.append("nationality", data.nationality)
   if (data.personalEmail) form.append("personalEmail", data.personalEmail)
   form.append("dateOfBirth", data.dateOfBirth)
   if (data.emergencyContactName) form.append("emergencyContactName", data.emergencyContactName)
   if (data.emergencyContactPhone) form.append("emergencyContactPhone", data.emergencyContactPhone)
   if (data.emergencyContactRelationship)
    form.append("emergencyContactRelationship", data.emergencyContactRelationship)

   const result = await signupTeacher(form)
   setPendingMessage(result.message)
  } catch (error) {
   const code = getErrorCode(error)
   if (code === "JOIN_CODE_INVALID" || code === "PHOTO_INVALID" || code === "PHOTO_REQUIRED") {
    setError("joinCode", { type: "manual", message: TEACHER_ERRORS[code] })
   } else if (code === "INVITE_EMAIL_TAKEN") {
    setError("email", { type: "manual", message: TEACHER_ERRORS[code] })
   } else if (code === "REQUEST_ALREADY_EXISTS") {
    setPendingMessage(
     "A request for this email is already awaiting review. You'll be able to sign in once an administrator approves it.",
    )
   } else if (code && TEACHER_ERRORS[code]) {
    toast.error(TEACHER_ERRORS[code])
   } else {
    toast.error(error instanceof Error ? error.message : "The request failed. Please try again.")
   }
  } finally {
   setSubmitting(false)
  }
 }

 const submitGuardianJoin = async (data: GuardianSignupFormData) => {
  const schoolCode = normalizeJoinCode(data.joinCode ?? "")
  if (!schoolCode) {
   setError("joinCode", { type: "manual", message: "Please enter your school's code." })
   return
  }
  try {
   const result = await signupGuardian({
    schoolCode,
    name: data.name,
    personalEmail: data.personalEmail,
    password: data.password,
    childSchoolEmail: data.childSchoolEmail,
    phone: data.phone?.trim() || undefined,
    nationality: data.nationality?.trim() || undefined,
   })
   setPendingMessage(
    result.status === "PENDING"
     ? "Your parent request was submitted for review. An administrator will link your account to your child shortly — you'll get an email with your login details once approved."
     : "Your request was submitted for review.",
   )
  } catch (error) {
   const code = getErrorCode(error)
   if (code === "SCHOOL_CODE_INVALID") {
    setError("joinCode", { type: "manual", message: GUARDIAN_ERRORS[code] })
   } else if (code === "EMAIL_IN_USE") {
    setError("personalEmail", { type: "manual", message: GUARDIAN_ERRORS[code] })
   } else if (code === "STUDENT_NOT_FOUND") {
    setError("childSchoolEmail", { type: "manual", message: GUARDIAN_ERRORS[code] })
   } else if (code === "ALREADY_APPLIED") {
    setPendingMessage(
     "A request for this email is already awaiting review. You'll receive your login details once an administrator approves it.",
    )
   } else if (code && GUARDIAN_ERRORS[code]) {
    toast.error(GUARDIAN_ERRORS[code])
   } else {
    toast.error(error instanceof Error ? error.message : "The request failed. Please try again.")
   }
  }
 }

 const submitJoin = (data: SignupFormData) => {
  if (role === "student") {
   void submitStudentJoin(data)
   return
  }
  if (role === "guardian") {
   void submitGuardianJoin(data)
   return
  }
  void submitTeacherJoin(data)
 }

 const switchMode = (next: Mode) => {
  if (next === "join") {
   unregister("organizationName")
  } else {
   unregister("joinCode")
   unregister("gradeLevel")
  }
  setMode(next)
  setSchoolInfo(null)
  setSchoolInfoError(null)
  clearErrors()
 }

 const handleSchoolCheck = async (raw: string) => {
  if (mode !== "join" || (role !== "student" && role !== "guardian")) return
  const code = normalizeJoinCode(raw)
  if (!code) {
   setSchoolInfo(null)
   setSchoolInfoError(null)
   return
  }
  try {
   const info = await fetchSchoolByCode(code)
   setSchoolInfo(info)
   setSchoolInfoError(null)
  } catch (error) {
   setSchoolInfo(null)
   setSchoolInfoError(
    getErrorCode(error) === "SCHOOL_CODE_INVALID"
     ? "We couldn't find a school with this code."
     : "Couldn't reach the server. Please try again.",
   )
  }
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
    <span className="font-headline-lg text-headline-lg text-on-surface">EduAI</span>
   </div>

   <header className="mb-md">
    <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-on-background mb-2">Create Account</h1>
    <p className="text-body-lg text-on-surface-variant">Join the future of classroom management.</p>
   </header>

   {/* Mode toggle */}
   <div className="flex p-1 bg-surface-variant rounded-lg mb-md">
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

   {mode === "join" && <RoleToggle value={role} onChange={setRole} className="mb-md" />}

   <form
    className="space-y-4"
    onSubmit={handleSubmit(mode === "create" ? submitCreate : submitJoin)}
   >
    {mode === "create" && (
     <div className="space-y-1.5">
      <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="organizationName">School Name</label>
      <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${
       errors.organizationName ? "border-error" : ""
      }`}>
       <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">school</span>
       <input
        id="organizationName"
        className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
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

    {mode === "create" && (
     <div className="space-y-1.5">
      <label className="text-body-md font-label-md text-on-background ml-1">School Logo (optional)</label>
      {logoPreview ? (
       <div className="flex items-center gap-4 rounded-lg border border-border p-3 bg-background">
        <img
         src={logoPreview}
         alt="School logo preview"
         className="w-16 h-16 rounded-lg object-contain border border-border bg-white p-1"
        />
        <div className="flex-1">
         <p className="text-label-sm text-on-surface">{logoFile?.name}</p>
         <p className="text-label-sm text-on-surface-variant mb-2">
          JPEG or PNG, up to 5MB — this logo appears at the top of your school&apos;s reports.
         </p>
         <button
          type="button"
          className="text-primary font-label-md text-label-md hover:underline"
          onClick={() => {
           setLogoFile(null)
           setLogoPreview(null)
           setLogoError(null)
          }}
         >
          Remove and choose again
         </button>
        </div>
       </div>
      ) : (
       <label
        className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-border bg-background cursor-pointer hover:border-primary transition-colors"
        htmlFor="schoolLogo"
       >
        <span className="material-symbols-outlined text-outline text-3xl">image</span>
        <span className="text-label-md text-on-surface">Click to upload your school logo</span>
        <span className="text-label-sm text-on-surface-variant">JPEG or PNG, up to 5MB</span>
       </label>
      )}
      <input
       id="schoolLogo"
       type="file"
       accept="image/jpeg,image/png"
       className="hidden"
       onChange={(event) => {
        const file = event.target.files?.[0] ?? null
        event.target.value = ""
        setLogoFile(null)
        setLogoPreview(null)
        setLogoError(null)
        if (!file) return
        if (file.size > MAX_LOGO_BYTES) {
         setLogoError("The logo must be 5MB or smaller.")
         return
        }
        if (file.type !== "image/jpeg" && file.type !== "image/png") {
         setLogoError("The logo must be a JPEG or PNG image.")
         return
        }
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
       }}
      />
      {logoError && <p className="text-error text-label-sm ml-1 mt-1">{logoError}</p>}
     </div>
    )}

    {mode === "join" && (
     <div className="space-y-1.5">
      <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="joinCode">Join Code</label>
      <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${
       errors.joinCode ? "border-error" : ""
      }`}>
       <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">key</span>
       <input
        id="joinCode"
        className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none uppercase tracking-widest"
        placeholder="e.g. DEMO2026"
        type="text"
        autoComplete="off"
        {...register("joinCode")}
        onBlur={(event) => void handleSchoolCheck(event.target.value)}
       />
      </div>
      {errors.joinCode && (
       <p className="text-error text-label-sm ml-1 mt-1">{errors.joinCode.message}</p>
      )}
      {mode === "join" && role !== "teacher" && schoolInfo && (
       <div className="flex items-center gap-3 px-4 py-3 bg-primary-container/40 border border-primary-container rounded-lg">
        <span className="material-symbols-outlined text-primary shrink-0">verified</span>
        <div>
         <p className="font-label-md text-label-md text-on-surface">Joining {schoolInfo.name}</p>
         <p className="text-label-sm text-on-surface-variant">
          {role === "student"
           ? schoolInfo.gradeLevels.length === 1
            ? "1 grade level"
            : `${schoolInfo.gradeLevels.length} grade levels` + " — your grade will be matched from your school's records."
           : "Your account will be linked to your child once an administrator approves it."}
         </p>
        </div>
       </div>
      )}
      {mode === "join" && role !== "teacher" && !schoolInfo && schoolInfoError && (
       <p className="text-error text-label-sm ml-1">{schoolInfoError}</p>
      )}
      <p className="text-on-surface-variant text-label-sm ml-1">
       Ask your school administrator for the code to join their organization.
      </p>
     </div>
    )}

    <div className="space-y-1.5">
     <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="name">Full Name</label>
     <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
      <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">person</span>
      <input
       id="name"
       className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
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
     <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
      <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">mail</span>
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
     <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="password">Password</label>
     <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
      <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">lock</span>
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
     <>
      <button
       type="button"
       className="w-full flex items-center justify-between px-4 py-3 bg-surface-variant/60 border border-border rounded-lg hover:border-primary transition-colors"
       onClick={() => setGuardianSectionOpen((prev) => !prev)}
      >
       <span className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary shrink-0">family_restroom</span>
        <span className="font-label-md text-label-md text-on-surface">Add a parent (optional)</span>
       </span>
       <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300">
        {guardianSectionOpen ? "expand_less" : "expand_more"}
       </span>
      </button>
      {guardianSectionOpen && (
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
         <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="guardianName">Parent&apos;s Full Name</label>
         <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.guardianName ? "border-error" : ""}`}>
          <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">person</span>
          <input
           id="guardianName"
           className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
           placeholder="e.g. Sarah Doe"
           type="text"
           {...register("guardianName")}
          />
         </div>
         {errors.guardianName && (
          <p className="text-error text-label-sm ml-1 mt-1">{errors.guardianName.message}</p>
         )}
        </div>
        <div className="space-y-1.5">
         <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="guardianEmail">Parent&apos;s Email</label>
         <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.guardianEmail ? "border-error" : ""}`}>
          <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">mail</span>
          <input
           id="guardianEmail"
           className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
           placeholder="parent@example.com"
           type="email"
           {...register("guardianEmail")}
          />
         </div>
         {errors.guardianEmail && (
          <p className="text-error text-label-sm ml-1 mt-1">{errors.guardianEmail.message}</p>
         )}
        </div>
        <p className="text-label-sm text-on-surface-variant sm:col-span-2">
         They&apos;ll get an email with their login details when your account is approved. Your parent
         can also sign up themselves with your school code later.
        </p>
       </div>
      )}
      <div className="flex items-start gap-3 px-4 py-3 bg-surface-variant/60 border border-border rounded-lg">
       <span className="material-symbols-outlined text-primary shrink-0">auto_awesome</span>
       <p className="text-label-sm text-on-surface-variant">
        Your grade and section will be assigned automatically from your school&apos;s records when an
        administrator approves your request.
       </p>
      </div>
     </>
    )}

    {mode === "join" && role === "guardian" && (
     <>
      <div className="space-y-1.5">
       <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="childSchoolEmail">Child&apos;s School Email</label>
       <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.childSchoolEmail ? "border-error" : ""}`}>
        <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">school</span>
        <input
         id="childSchoolEmail"
         className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
         placeholder="e.g. john.doe@school.org"
         type="email"
         {...register("childSchoolEmail")}
        />
       </div>
       {errors.childSchoolEmail && (
        <p className="text-error text-label-sm ml-1 mt-1">{errors.childSchoolEmail.message}</p>
       )}
       <p className="text-on-surface-variant text-label-sm ml-1">
        Your child&apos;s school login address — ask the school if you&apos;re not sure.
       </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="phone">Phone</label>
        <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">call</span>
         <input
          id="phone"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="+1 555 123 4567"
          type="tel"
          {...register("phone")}
         />
        </div>
        {errors.phone && <p className="text-error text-label-sm ml-1 mt-1">{errors.phone.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="nationality">Nationality</label>
        <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">globe</span>
         <input
          id="nationality"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="e.g. American"
          type="text"
          {...register("nationality")}
         />
        </div>
        {errors.nationality && <p className="text-error text-label-sm ml-1 mt-1">{errors.nationality.message}</p>}
       </div>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-surface-variant/60 border border-border rounded-lg">
       <span className="material-symbols-outlined text-primary shrink-0">family_restroom</span>
       <p className="text-label-sm text-on-surface-variant">
        You&apos;ll use your personal email to receive your login details. An administrator links you
        to your child when they approve your request.
       </p>
      </div>
     </>
    )}

    {mode === "join" && role === "teacher" && (
     <>
      <div className="space-y-1.5">
       <label className="text-body-md font-label-md text-on-background ml-1">Personal Photo *</label>
       {photoPreview ? (
        <div className="flex items-center gap-4 rounded-lg border border-border p-3 bg-background">
         <img
          src={photoPreview}
          alt="Personal photo preview"
          className="w-16 h-16 rounded-lg object-cover border border-border"
         />
         <div className="flex-1">
          <p className="text-label-sm text-on-surface">{photoFile?.name}</p>
          <p className="text-label-sm text-on-surface-variant mb-2">
           JPEG or PNG, up to 5MB — this becomes your school profile photo.
          </p>
          <button
           type="button"
           className="text-primary font-label-md text-label-md hover:underline"
           onClick={() => {
            setPhotoFile(null)
            setPhotoPreview(null)
            setPhotoError(null)
           }}
          >
           Remove and choose again
          </button>
         </div>
        </div>
       ) : (
        <label
         className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-border bg-background cursor-pointer hover:border-primary transition-colors"
         htmlFor="photo"
        >
         <span className="material-symbols-outlined text-outline text-3xl">add_a_photo</span>
         <span className="text-label-md text-on-surface">Click to upload your photo</span>
         <span className="text-label-sm text-on-surface-variant">JPEG or PNG, up to 5MB</span>
        </label>
       )}
       <input
        id="photo"
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
         const file = event.target.files?.[0] ?? null
         event.target.value = ""
         setPhotoFile(null)
         setPhotoPreview(null)
         setPhotoError(null)
         if (!file) return
         if (file.size > MAX_PHOTO_BYTES) {
          setPhotoError("The photo must be 5MB or smaller.")
          return
         }
         if (file.type !== "image/jpeg" && file.type !== "image/png") {
          setPhotoError("The photo must be a JPEG or PNG image.")
          return
         }
         setPhotoFile(file)
         setPhotoPreview(URL.createObjectURL(file))
        }}
       />
       {photoError && <p className="text-error text-label-sm ml-1 mt-1">{photoError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="ssn">SSN *</label>
        <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.ssn ? "border-error" : ""}`}>
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">badge</span>
         <input
          id="ssn"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="123-45-6789"
          type="text"
          {...register("ssn")}
         />
        </div>
        {errors.ssn && <p className="text-error text-label-sm ml-1 mt-1">{errors.ssn.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-body-md text-on-background ml-1" htmlFor="phone">Phone *</label>
        <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.phone ? "border-error" : ""}`}>
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">call</span>
         <input
          id="phone"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="+1 555 123 4567"
          type="tel"
          {...register("phone")}
         />
        </div>
        {errors.phone && <p className="text-error text-label-sm ml-1 mt-1">{errors.phone.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="street">Street Address *</label>
        <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.street ? "border-error" : ""}`}>
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">home</span>
         <input
          id="street"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="1 Main Street"
          type="text"
          {...register("street")}
         />
        </div>
        {errors.street && <p className="text-error text-label-sm ml-1 mt-1">{errors.street.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="city">City *</label>
        <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.city ? "border-error" : ""}`}>
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">location_city</span>
         <input
          id="city"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="Springfield"
          type="text"
          {...register("city")}
         />
        </div>
        {errors.city && <p className="text-error text-label-sm ml-1 mt-1">{errors.city.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="nationality">Nationality</label>
        <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">globe</span>
         <input
          id="nationality"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="e.g. American"
          type="text"
          {...register("nationality")}
         />
        </div>
        {errors.nationality && <p className="text-error text-label-sm ml-1 mt-1">{errors.nationality.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="personalEmail">Personal Email</label>
        <div className="group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all">
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">alternate_email</span>
         <input
          id="personalEmail"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          placeholder="you@example.com"
          type="email"
          {...register("personalEmail")}
         />
        </div>
        {errors.personalEmail && <p className="text-error text-label-sm ml-1 mt-1">{errors.personalEmail.message}</p>}
       </div>
       <div className="space-y-1.5">
        <label className="text-body-md font-label-md text-on-background ml-1" htmlFor="dateOfBirth">Date of Birth *</label>
        <div className={`group/input flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-full focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(244,114,182,0.3)] transition-all ${errors.dateOfBirth ? "border-error" : ""}`}>
         <span className="material-symbols-outlined text-outline group-hover/input:text-primary shrink-0">cake</span>
         <input
          id="dateOfBirth"
          className="bg-transparent border-none focus:ring-0 w-full text-body-lg placeholder:text-muted-foreground outline-none"
          type="date"
          {...register("dateOfBirth")}
         />
        </div>
        {errors.dateOfBirth && <p className="text-error text-label-sm ml-1 mt-1">{errors.dateOfBirth.message}</p>}
       </div>
      </div>

      <div className="rounded-lg bg-surface-variant/50 border border-border p-4">
       <p className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[18px]">emergency</span>
        Emergency Contact (optional)
       </p>
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
         <input
          className="bg-surface-container-lowest border border-border rounded-lg px-4 py-3 text-body-md placeholder:text-muted-foreground outline-none focus:border-primary w-full"
          placeholder="Name"
          type="text"
          {...register("emergencyContactName")}
         />
        </div>
        <div className="space-y-1.5">
         <input
          className="bg-surface-container-lowest border border-border rounded-lg px-4 py-3 text-body-md placeholder:text-muted-foreground outline-none focus:border-primary w-full"
          placeholder="Phone"
          type="tel"
          {...register("emergencyContactPhone")}
         />
        </div>
        <div className="space-y-1.5">
         <input
          className="bg-surface-container-lowest border border-border rounded-lg px-4 py-3 text-body-md placeholder:text-muted-foreground outline-none focus:border-primary w-full"
          placeholder="Relationship (e.g. Spouse)"
          type="text"
          {...register("emergencyContactRelationship")}
         />
        </div>
       </div>
      </div>
     </>
    )}

    <button
     type="submit"
     disabled={signup.isPending || submitting}
     className="w-full mt-4 py-4 bg-primary text-primary-foreground font-headline-md text-body-lg rounded-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
     {signup.isPending || submitting ? (
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

   <p className="text-label-sm text-on-surface-variant text-center mt-3">
    School administrators can sign in with Google or Microsoft to create or join a school.
   </p>

   <footer className="mt-6 text-center">
    <p className="font-body-md text-body-md text-on-surface-variant">
     Already have an account?{" "}
     <Link className="text-primary font-bold hover:underline ml-1" to="/login">Log in</Link>
    </p>
   </footer>
  </div>
 )
}
