import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface WelcomeBannerDetail {
 icon: string
 label: string
 value: string
}

interface WelcomeBannerProps {
 userName: string
 roleLabel: string
 email?: string
 details?: WelcomeBannerDetail[]
 action?: ReactNode
 className?: string
}

export function WelcomeBanner({ userName, roleLabel, email, details = [], action, className }: WelcomeBannerProps) {
 const firstName = (userName ?? "").trim().split(" ")[0] || userName
 const hour = new Date().getHours()
 const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

 return (
  <div
   className={cn(
    "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#7a1d55] to-[#3f0f33] text-white shadow-card",
    className,
   )}
  >
   <div className="pointer-events-none absolute -top-20 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
   <div className="pointer-events-none absolute -bottom-24 right-32 h-52 w-52 rounded-full bg-white/5 blur-2xl" />
   <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />

   <div className="relative flex flex-col gap-6 px-7 py-7 md:px-10 md:py-9 lg:flex-row lg:items-center">
    <div className="flex min-w-0 items-center gap-5">
     <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
      <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: "'FILL' 1" }}>
       psychology
      </span>
     </div>
     <div className="min-w-0">
      <div className="flex items-center gap-2">
       <span className="font-label-md text-label-md text-white/75">EduAI</span>
       <span className="h-1 w-1 rounded-full bg-white/40" />
       <span className="font-label-md text-label-md text-white/85">{roleLabel}</span>
      </div>
      <h1 className="mt-1 font-headline-xl text-headline-xl font-bold leading-tight">
       {greeting}, {firstName}
      </h1>
      {email && <p className="mt-1 truncate font-body-md text-body-md text-white/70">{email}</p>}
     </div>
    </div>

    <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
     {details.map((d) => (
      <div key={d.label} className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur">
       <span className="material-symbols-outlined text-[20px] text-white/80">{d.icon}</span>
       <div>
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-white/60">{d.label}</p>
        <p className="font-label-md text-label-md font-semibold leading-tight">{d.value}</p>
       </div>
      </div>
     ))}
     {action}
    </div>
   </div>
  </div>
 )
}