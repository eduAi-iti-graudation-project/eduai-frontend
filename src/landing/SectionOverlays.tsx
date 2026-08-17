import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import * as THREE from "three"
import { Band, BandOverlay } from "./BandOverlay"
import { bandHeightVh, localProgress, scrollState } from "./progress"
import { subscribeScroll } from "./scroll-driver"
import { viewState, robotState } from "./view-state"
import { PLANS, useStartCheckout } from "@/lib/plans"

/** Brand name — solid pink highlight (crayon-box primary). */
function Brand({ children }: { children: React.ReactNode }) {
  return <span className="text-[#db2777] [text-shadow:0_2px_18px_rgba(15,23,42,0.35)]">{children}</span>
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

/**
 * Dark frosted panel behind chapter text — guarantees strong contrast on the
 * bright sky pockets no matter the camera angle. Matte black-glass sticker
 * that matches the design system's hard-offset card language.
 */
function ChapterPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0b1120]/60 px-6 py-5 shadow-[0_12px_50px_rgba(2,6,23,0.55)] backdrop-blur-md sm:px-8 sm:py-6 ${className}`}
    >
      {children}
    </div>
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
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#db2777]">
        <span className="material-symbols-outlined text-[14px] text-white">smart_toy</span>
      </span>
      <p className="text-body-md leading-snug">{text}</p>
    </div>
  )
}

/**
 * Robot speech bubbles — anchored to the robot's LIVE head position by
 * projecting its world anchor through the camera every frame. Unlike a fixed
 * screen percentage this matches the 3D robot at every zoom level and aspect
 * ratio — the bubbles float beside the robot's face with a tail pointing at
 * it, so it reads as the robot actually talking.
 */
function DialogueBubbles() {
  const stackRef = useRef<HTMLDivElement>(null)
  const proj = useRef(new THREE.Vector3())

  useEffect(() => {
    const apply = () => {
      const el = stackRef.current
      const camera = viewState.camera
      if (!el || !camera) return
      proj.current.copy(robotState.head).project(camera)
      const tx = (proj.current.x * 0.5 + 0.5) * window.innerWidth
      const ty = (-proj.current.y * 0.5 + 0.5) * window.innerHeight
      const w = el.offsetWidth || 360
      const h = el.offsetHeight || 180
      // right-anchor the stack just beside the robot's head, clamped in-viewport
      const left = Math.min(window.innerWidth - w - 24, Math.max(24, tx - w - 16))
      const top = Math.min(window.innerHeight - h - 24, Math.max(24, ty - h * 0.42))
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
    <div ref={stackRef} className="fixed left-0 top-0 flex w-[min(360px,38vw)] flex-col gap-md will-change-transform">
      {DIALOGUE.map((d, i) => (
        <Bubble key={i} index={i} text={d.text} />
      ))}
      {/* speech-tail pointing at the robot's face */}
      <span className="absolute right-[-8px] top-[42%] h-4 w-4 rotate-45 rounded-sm border-r border-t border-border bg-on-surface shadow-[3px_-3px_8px_rgba(2,6,23,0.16)]" />
    </div>
  )
}

/** One plan on the pricing finale — Basic / Pro / Enterprise (the 3 paid tiers). */
const PLAN_CARDS = PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: plan.price,
  unit: plan.id === "enterprise" ? "" : " / month",
  period: plan.period,
  features: plan.features,
  cta: plan.cta,
  featured: plan.featured,
}))

function PlanCard({
  plan,
  onSelect,
}: {
  plan: (typeof PLAN_CARDS)[number]
  onSelect: (planId: (typeof PLAN_CARDS)[number]["id"]) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`group flex flex-col rounded-2xl border p-lg text-left shadow-lg transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer ${
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
      <span
        className={`mt-lg inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-label-md font-label-md transition-colors ${
          plan.featured
            ? "bg-white text-primary group-hover:bg-white/90"
            : "bg-primary text-primary-foreground group-hover:bg-primary-container group-hover:text-on-primary-container"
        }`}
      >
        {plan.cta}
      </span>
    </button>
  )
}

export function SectionOverlays() {
  const startCheckout = useStartCheckout()

  return (
    <>
      {/* ── 1 · The Hello ── */}
      <Band heightVh={bandHeightVh(0)}>
        <BandOverlay section={0} horizontal="start" startVisible rise={300} out={[0.92, 1]} className="px-10 pb-[16vh]">
          <ChapterPanel className="max-w-3xl">
            <Kicker>
              <Brand>EduAI</Brand> · A day in the life
            </Kicker>
            <HeroHeadline>
              <Brand>EduAI</Brand> sees the story behind every student's day.
            </HeroHeadline>
            <Body>Attendance, grades, and the quiet signals in between — one clear picture for every teacher.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 2 · The Fall — pure transition, no text ── */}
      <Band heightVh={bandHeightVh(1)} />

      {/* ── 3 · The School Gate ── */}
      <Band heightVh={bandHeightVh(2)}>
        <BandOverlay section={2} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 01 — Through the gate</Kicker>
            <Headline>Small signals hide in every goodbye.</Headline>
            <Body>A quiet drop-off, a sleepy walk in — the little signs before the first bell.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 4 · Portal part 1 ── */}
      <Band heightVh={bandHeightVh(3)}>
        <BandOverlay section={3} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 02 — Through the door</Kicker>
            <Headline>One walk becomes a data trail.</Headline>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 5 · Portal part 2 — the tunnel ── */}
      <Band heightVh={bandHeightVh(4)}>
        <BandOverlay section={4} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 03 — The data stream</Kicker>
            <Headline>Every step counted, every signal saved.</Headline>
            <Body>Attendance, submissions, feedback — a story assembled from moments.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 6 · Fall into the school ── */}
      <Band heightVh={bandHeightVh(5)}>
        <BandOverlay section={5} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 04 — Arrival</Kicker>
            <Headline>The story of the day begins here.</Headline>
            <Body>The bell, the hallways, the room — every signal counted from the first step.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 7 · Test 1 — the red X ── */}
      <Band heightVh={bandHeightVh(6)}>
        <BandOverlay section={6} horizontal="end" in={[0, 0.02]} out={[0.98, 1]} className="pr-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 05 — The first attempt</Kicker>
            <Headline>Not every try lands.</Headline>
            <Body>One red cross — a signal, not a verdict.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 8 · The robot talks ── */}
      <Band heightVh={bandHeightVh(7)}>
        <BandOverlay section={7} horizontal="start" in={[0, 0.02]} out={[0.98, 1]} className="pl-10">
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 06 — The second pair of eyes</Kicker>
            <Headline>
              <Brand>AI</Brand> suggests. Teachers decide.
            </Headline>
          </ChapterPanel>
        </BandOverlay>
        <DialogueBubbles />
        <div className="absolute left-[6%] top-[14%]">
          <EmailToast />
        </div>
      </Band>

      {/* ── 9 · Celebration + CTA ── */}
      <Band heightVh={bandHeightVh(8)}>
        <BandOverlay section={8} horizontal="center" in={[0.02, 0.06]}>
          <ChapterPanel className="max-w-2xl">
            <Kicker>Chapter 07 — The payoff</Kicker>
            <Headline>Every win deserves an audience.</Headline>
            <Body>Grades confirmed, guardians in the loop, one less worry at dinner.</Body>
          </ChapterPanel>
        </BandOverlay>
      </Band>

      {/* ── 10 · Pricing finale ── */}
      <Band heightVh={bandHeightVh(9) + 100}>
        <BandOverlay section={9} horizontal="center" vertical="end" in={[0.3, 0.42]} className="pb-14">
          <div className="flex w-full flex-col items-center gap-lg px-6">
            <ChapterPanel className="pointer-events-auto text-center">
              <Kicker>Simple pricing · per school</Kicker>
              <Headline>Start free. Scale when you&apos;re ready.</Headline>
            </ChapterPanel>
            <div className="pointer-events-auto grid w-full max-w-6xl grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
              {PLAN_CARDS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} onSelect={startCheckout} />
              ))}
            </div>
            <p className="pointer-events-auto flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
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
