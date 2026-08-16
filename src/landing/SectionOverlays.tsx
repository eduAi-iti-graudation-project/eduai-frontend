import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import * as THREE from "three"
import { Band, BandOverlay } from "./BandOverlay"
import { bandHeightVh, localProgress, scrollState } from "./progress"
import { subscribeScroll } from "./scroll-driver"
import { viewState, robotState } from "./view-state"

/** Brand name — solid violet highlight (portal palette). */
function Brand({ children }: { children: React.ReactNode }) {
 return <span className="text-primary [text-shadow:0_2px_18px_rgba(15,23,42,0.35)]">{children}</span>
}

const HERO_SHADOW = "[text-shadow:0_2px_24px_rgba(15,23,42,0.5)]"

function HeroHeadline({ children }: { children: React.ReactNode }) {
 return (
  <h2 className={`font-headline-xl text-[clamp(48px,7vw,96px)] font-extrabold leading-[1.02] tracking-tight text-white ${HERO_SHADOW}`}>
   {children}
  </h2>
 )
}

function Headline({ children }: { children: React.ReactNode }) {
 return (
  <h2 className={`font-headline-xl text-[clamp(40px,5.5vw,72px)] font-extrabold leading-[1.05] tracking-tight text-white ${HERO_SHADOW}`}>
   {children}
  </h2>
 )
}

function Body({ children }: { children: React.ReactNode }) {
 return (
  <p className={`mt-lg max-w-2xl text-[clamp(17px,2vw,24px)] leading-[1.55] text-white/90 font-body-md ${HERO_SHADOW}`}>
   {children}
  </p>
 )
}

function Kicker({ children }: { children: React.ReactNode }) {
 return (
  <p className="mb-md text-label-md tracking-[0.24em] uppercase text-white/80 font-label-md [text-shadow:0_1px_12px_rgba(15,23,42,0.45)]">
   {children}
  </p>
 )
}

/** Guardian email toast — flies in with the celebration, fades out before the CTA. */
function EmailToast() {
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
  const apply = () => {
   const p = localProgress(scrollState.value, 7)
   const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
   const enter = clamp01((p - 0.55) / 0.16)
   const exit = clamp01((p - 0.86) / 0.12)
   if (ref.current) {
    ref.current.style.opacity = String(enter * (1 - exit))
    ref.current.style.transform = `translateY(${(1 - enter) * -24}px)`
   }
  }
  const unsub = subscribeScroll(apply)
  apply()
  return unsub
 }, [])

 return (
  <div
   ref={ref}
   className="flex items-center gap-md rounded-xl border border-border bg-on-surface px-xl py-lg text-inverse-on-surface shadow-lg"
   style={{ opacity: 0 }}
  >
   <span className="material-symbols-outlined text-[20px] text-primary">mark_email_read</span>
   <div>
    <p className="text-headline-sm font-headline-sm">Report sent to guardians</p>
    <p className="text-label-md opacity-70">Amina's progress update is on its way.</p>
   </div>
  </div>
 )
}

/** Robot speech bubbles — each fades in on its own scroll window (scene 7). */
const DIALOGUE = [
 { a: 0.18, b: 0.46, text: "Tough one — I saw it happen in real time." },
 { a: 0.4, b: 0.82, text: "Here's the why: one small step at a time. Try again?" },
 { a: 0.7, b: 0.9, text: "Same problem, new approach. I'm right here." },
]

/** One robot speech bubble — fades in/out on its own scroll window (scene 7). */
function Bubble({ index, text }: { index: number; text: string }) {
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
  const apply = () => {
   const p = localProgress(scrollState.value, 7)
   const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
   const d = DIALOGUE[index]
   const enter = clamp01((p - d.a) / 0.13)
   const exit = clamp01((p - (d.b - 0.02)) / 0.09)
   if (ref.current) {
    ref.current.style.opacity = String(enter * (1 - exit))
    ref.current.style.transform = `translateX(${(1 - enter) * 24}px)`
   }
  }
  const unsub = subscribeScroll(apply)
  apply()
  return unsub
 }, [index])

 return (
  <div
   ref={ref}
   className="flex items-start gap-sm rounded-xl border border-border bg-on-surface px-lg py-md text-inverse-on-surface shadow-lg"
   style={{ opacity: 0 }}
  >
   <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
    <span className="material-symbols-outlined text-[14px] text-white">smart_toy</span>
   </span>
   <p className="text-body-md leading-snug">{text}</p>
  </div>
 )
}

/**
 * Robot speech bubbles — anchored to the robot's LIVE screen position by
 * projecting its world position through the camera every frame. Unlike a
 * fixed screen percentage this matches the 3D robot at every zoom level and
 * aspect ratio — the bubbles sit beside the robot, always.
 */
function DialogueBubbles() {
 const stackRef = useRef<HTMLDivElement>(null)
 const proj = useRef(new THREE.Vector3())

 useEffect(() => {
  const apply = () => {
   const el = stackRef.current
   const camera = viewState.camera
   if (!el || !camera) return
   proj.current.copy(robotState.pos).project(camera)
   const tx = (proj.current.x * 0.5 + 0.5) * window.innerWidth
   const ty = (-proj.current.y * 0.5 + 0.5) * window.innerHeight
   const w = el.offsetWidth || 360
   const h = el.offsetHeight || 180
   // right-anchor the stack beside the robot, clamped inside the viewport
   const left = Math.min(window.innerWidth - w - 24, Math.max(24, tx - w - 26))
   const top = Math.min(window.innerHeight - h - 24, Math.max(24, ty - h * 0.35))
   el.style.transform = `translate(${left}px, ${top}px)`
  }
  const unsub = subscribeScroll(apply)
  apply()
  window.addEventListener("resize", apply)
  return () => {
   unsub()
   window.removeEventListener("resize", apply)
  }
 }, [])

 return (
  <div ref={stackRef} className="absolute left-0 top-0 flex w-[min(360px,38vw)] flex-col gap-md will-change-transform">
   {DIALOGUE.map((d, i) => (
    <Bubble key={i} index={i} text={d.text} />
   ))}
  </div>
 )
}

const btn =
 "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-label-md font-label-md transition-colors"

/** One plan on the pricing finale — Trial / Pro / Enterprise. */
const PLANS = [
 {
  name: "Trial",
  price: "$0",
  unit: "",
  period: "14 days · everything included",
  features: ["Every feature, fully unlocked", "AI grading assistant", "Rubric builder", "Homework help", "Guardian reports"],
  cta: "Start free — for teachers",
  to: "/signup",
  email: false,
  featured: false,
 },
 {
  name: "Pro",
  price: "$15",
  unit: "/ month",
  period: "per school, billed yearly",
  features: [
   "Everything in the 14-day trial",
   "Unlimited classes & seats",
   "Auto-generated quizzes",
   "Advanced reports & analysis",
   "Guardian progress updates",
  ],
  cta: "Get Pro now",
  to: "/signup",
  email: false,
  featured: true,
 },
 {
  name: "Enterprise",
  price: "Let's talk",
  unit: "",
  period: "Custom pricing · for districts",
  features: [
   "Everything in Pro",
   "Advanced insights & analytics",
   "District-wide admin controls",
   "Dedicated onboarding",
   "Priority support",
  ],
  cta: "Contact sales",
  to: "sales@eduai.app",
  email: true,
  featured: false,
 },
]

function PlanCard({ plan }: { plan: (typeof PLANS)[number] }) {
 const cta = plan.email ? (
  <a
   href={`mailto:${plan.to}`}
   className={`${btn} mt-lg ${
    plan.featured
     ? "bg-white text-primary hover:bg-white/90"
     : "bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container"
   }`}
  >
   {plan.cta}
  </a>
 ) : (
  <Link
   to={plan.to}
   className={`${btn} mt-lg ${
    plan.featured
     ? "bg-white text-primary hover:bg-white/90"
     : "bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container"
   }`}
  >
   {plan.cta}
  </Link>
 )
 return (
  <div
   className={`flex flex-col rounded-2xl border p-lg text-left shadow-lg ${
    plan.featured
     ? "border-primary bg-primary text-primary-foreground"
     : "border-border bg-surface-container-lowest text-on-surface"
   }`}
  >
   <div className="flex items-center justify-between gap-sm">
    <p className="font-label-md text-label-md tracking-[0.16em] uppercase opacity-80">{plan.name}</p>
    {plan.featured && <span className="rounded-full bg-white/25 px-3 py-1 font-label-sm text-label-sm">Most popular</span>}
   </div>
   <p className="mt-md flex items-baseline gap-1">
    <span className="font-headline-xl text-headline-xl leading-none">{plan.price}</span>
    {plan.unit && <span className="font-body-sm text-body-sm opacity-75">{plan.unit}</span>}
   </p>
   <p className="mt-1 font-body-sm text-body-sm opacity-75">{plan.period}</p>
   <ul className="mt-md flex flex-col gap-sm font-body-sm text-body-sm">
    {plan.features.map((f) => (
     <li key={f} className="flex items-start gap-sm">
      <span className="material-symbols-outlined mt-0.5 text-[15px] opacity-90">check_circle</span>
      {f}
     </li>
    ))}
   </ul>
   {cta}
  </div>
 )
}

export function SectionOverlays() {
 return (
  <>
   {/* ── 1 · The Hello ── */}
   <Band heightVh={bandHeightVh(0)}>
    <BandOverlay section={0} horizontal="start" startVisible rise={300} out={[0.92, 1]} className="px-10">
     <div className="max-w-3xl">
      <Kicker>
       <Brand>EduAI</Brand> · A day in the life
      </Kicker>
      <HeroHeadline>
       <Brand>EduAI</Brand> sees the story behind every student's day.
      </HeroHeadline>
      <Body>Attendance, grades, and the quiet signals in between — one clear picture for every teacher.</Body>
      <div className="mt-xl flex items-center gap-md">
       <Link to="/signup" className={`${btn} bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container`}>
        Start free — for teachers
       </Link>
       <Link to="/login" className={`${btn} border border-white/60 text-white hover:bg-white/10`}>
        Log in
       </Link>
      </div>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 2 · The Fall — pure transition, no text ── */}
   <Band heightVh={bandHeightVh(1)} />

   {/* ── 3 · The School Gate ── */}
   <Band heightVh={bandHeightVh(2)}>
    <BandOverlay section={2} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 01 — Through the gate</Kicker>
      <Headline>Small signals hide in every goodbye.</Headline>
      <Body>A quiet drop-off, a sleepy walk in — the little signs before the first bell.</Body>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 4 · Portal part 1 ── */}
   <Band heightVh={bandHeightVh(3)}>
    <BandOverlay section={3} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 02 — Through the door</Kicker>
      <Headline>One walk becomes a data trail.</Headline>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 5 · Portal part 2 — the tunnel ── */}
   <Band heightVh={bandHeightVh(4)}>
    <BandOverlay section={4} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 03 — The data stream</Kicker>
      <Headline>Every step counted, every signal saved.</Headline>
      <Body>Attendance, submissions, feedback — a story assembled from moments.</Body>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 6 · Fall into the school ── */}
   <Band heightVh={bandHeightVh(5)}>
    <BandOverlay section={5} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 04 — Arrival</Kicker>
      <Headline>The story of the day begins here.</Headline>
      <Body>The bell, the hallways, the room — every signal counted from the first step.</Body>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 7 · Test 1 — the red X ── */}
   <Band heightVh={bandHeightVh(6)}>
    <BandOverlay section={6} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 05 — The first attempt</Kicker>
      <Headline>Not every try lands.</Headline>
      <Body>One red cross — a signal, not a verdict.</Body>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 8 · The robot talks ── */}
   <Band heightVh={bandHeightVh(7)}>
    <BandOverlay section={7} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
     <div className="max-w-2xl">
      <Kicker>Chapter 06 — The second pair of eyes</Kicker>
      <Headline>
       <Brand>AI</Brand> suggests. Teachers decide.
      </Headline>
     </div>
    </BandOverlay>
    <DialogueBubbles />
    <div className="absolute left-[6%] top-[14%]">
     <EmailToast />
    </div>
   </Band>

   {/* ── 9 · Celebration + CTA ── */}
   <Band heightVh={bandHeightVh(8)}>
    <BandOverlay section={8} horizontal="center" in={[0.02, 0.06]}>
     <div className="max-w-2xl px-6">
      <Kicker>Chapter 07 — The payoff</Kicker>
      <Headline>Every win deserves an audience.</Headline>
      <Body>Grades confirmed, guardians in the loop, one less worry at dinner.</Body>
     </div>
    </BandOverlay>
    <BandOverlay section={8} horizontal="center" vertical="end" in={[0.55, 0.7]} className="pb-32">
     <div className="flex flex-col items-center gap-md pointer-events-auto">
      <div className="flex items-center gap-md">
       <Link
        to="/signup"
        className={`${btn} bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container`}
       >
        Start free — for teachers
       </Link>
       <Link to="/login" className={`${btn} text-on-surface hover:bg-surface-container-low`}>
        Log in
       </Link>
      </div>
      <div className="flex gap-lg pt-4 text-label-md text-on-surface-variant">
       <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
       <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
      </div>
     </div>
    </BandOverlay>
   </Band>

   {/* ── 10 · Pricing finale ── */}
   <Band heightVh={bandHeightVh(9) + 100}>
    <BandOverlay section={9} horizontal="center" vertical="end" in={[0.05, 0.2]} className="pb-14">
     <div className="flex w-full flex-col items-center gap-lg px-6">
      <div className="text-center">
       <Kicker>Simple pricing · per school</Kicker>
       <Headline>Start free. Scale when you&apos;re ready.</Headline>
      </div>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-lg md:grid-cols-3">
       {PLANS.map((plan) => (
        <PlanCard key={plan.name} plan={plan} />
       ))}
      </div>
      <p className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
       Not sure yet?
       <Link to="/pricing" className="text-primary hover:underline">
        Compare all features →
       </Link>
      </p>
     </div>
    </BandOverlay>
   </Band>
  </>
 )
}
