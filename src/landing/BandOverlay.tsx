import { useEffect, useRef } from "react"
import { localProgress, scrollState } from "./progress"
import { subscribeScroll } from "./scroll-driver"

/**
 * Section headline/body overlay. Absolutely positioned inside its band via
 * alignment props; opacity/translateY are driven from the shared scroll
 * timeline through ref mutation — no React re-renders, backwards-safe.
 *
 * `startVisible` skips the fade-in (text fully opaque at scroll 0 — the hero).
 * `rise` lifts the text upward with the scroll (px over the whole band).
 */
export function BandOverlay({
 section,
 className = "",
 horizontal = "start",
 vertical = "center",
 in: fadeIn = [0, 0.12],
 out: fadeOut,
 startVisible = false,
 rise = 0,
 children,
}: {
 section: number
 className?: string
 horizontal?: "start" | "center" | "end"
 vertical?: "start" | "center" | "end"
 in?: [number, number]
 out?: [number, number]
 startVisible?: boolean
 rise?: number
 children: React.ReactNode
}) {
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
  const el = ref.current
  if (!el) return
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const win = (p: number, [a, b]: [number, number]) => clamp01((p - a) / (b - a))
  const ease = (t: number) => t * t * (3 - 2 * t)
  const apply = () => {
   const p = localProgress(scrollState.value, section)
   let alpha = startVisible ? 1 : ease(win(p, fadeIn))
   if (fadeOut) alpha *= 1 - ease(win(p, fadeOut))
   let ty = (1 - alpha) * 28 - rise * p
   // Sections are ~1.8 viewports tall — instead of scrolling past in the
   // first half, chapter text slides in, holds on a readable line, then
   // hands off at the end. Pure function of local progress: no jumps.
   if (vertical === "center" && !startVisible && rise === 0) {
    const band = el.parentElement
    if (band) {
     const span = band.offsetHeight || 1
     const slideIn = ease(win(p, [0.1, 0.22]))
     const slideOut = ease(win(p, [0.86, 0.98]))
     const desiredViewY = (0.76 - 0.34 * slideIn) * window.innerHeight - (0.54 * window.innerHeight) * slideOut
     ty += desiredViewY + p * span - el.offsetTop
    }
   }
   el.style.opacity = String(alpha)
   el.style.transform = `translateY(${ty}px)`
  }
  const unsub = subscribeScroll(apply)
  apply()
  return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [section, fadeIn.join(","), fadeOut?.join(","), startVisible, rise, vertical])

 const h = horizontal === "end" ? "justify-end text-right" : horizontal === "center" ? "justify-center text-center" : "justify-start text-left"
 const v = vertical === "end" ? "items-end" : vertical === "start" ? "items-start" : "items-center"

 return (
  <div className={`absolute inset-0 flex h-full w-full ${h} ${v} ${className}`}>
   <div ref={ref} className="will-change-transform" style={{ opacity: 0 }}>
    {children}
   </div>
  </div>
 )
}

/** One story chapter band — defaults to 100vh; taller bands slow the pace. */
export function Band({
 children,
 className = "",
 heightVh = 100,
}: {
 children?: React.ReactNode
 className?: string
 heightVh?: number
}) {
 return <div className={`relative h-screen ${className}`} style={heightVh !== 100 ? { height: `${heightVh}vh` } : undefined}>{children}</div>
}
