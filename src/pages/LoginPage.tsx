import { LoginForm } from "@/components/auth/LoginForm"

const features = [
 { icon: "monitoring", label: "AI-powered insights" },
 { icon: "notifications_active", label: "Real-time alerts" },
 { icon: "shield", label: "Secure by design" },
]

const stats = [
 { value: "12,000+", label: "educators" },
 { value: "99.9%", label: "uptime" },
 { value: "4.9★", label: "rated" },
]

export function LoginPage() {
 return (
  <main className="flex min-h-screen bg-surface">
   <div className="hidden lg:flex w-[48%] xl:w-1/2 gradient-brand relative overflow-hidden flex-col justify-between p-10 xl:p-14">
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
    <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" aria-hidden />

    <div className="relative z-10 flex items-center gap-3">
     <div className="w-11 h-11 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
       school
      </span>
     </div>
     <span className="font-headline-lg text-headline-lg font-bold text-white leading-none">EduAI</span>
    </div>

    <div className="relative z-10 max-w-md">
     <h1 className="font-headline-xl text-headline-xl text-white font-bold leading-tight">
      Your school, managed by AI.
     </h1>
     <p className="mt-4 font-body-lg text-body-lg text-white/85">
      Streamline grading, flag at-risk students, and keep every stakeholder in the loop — automatically.
     </p>
     <div className="mt-8 flex flex-wrap gap-2.5">
      {features.map((f) => (
       <span
        key={f.label}
        className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 font-label-md text-label-md text-white"
       >
        <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
        {f.label}
       </span>
      ))}
     </div>
    </div>

    <div className="relative z-10 grid grid-cols-3 gap-6">
     {stats.map((s) => (
      <div key={s.label}>
       <p className="font-headline-md text-headline-md font-bold text-white">{s.value}</p>
       <p className="mt-0.5 font-label-sm text-label-sm text-white/75">{s.label}</p>
      </div>
     ))}
    </div>
   </div>

   <div className="flex-1 min-w-0 flex items-center justify-center p-margin-mobile md:p-margin-desktop">
    <LoginForm />
   </div>
  </main>
 )
}