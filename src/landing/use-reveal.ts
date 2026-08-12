import { useEffect, useRef } from "react"
import { localProgress, scrollState, windowed } from "./progress"
import { subscribeScroll } from "./scroll-driver"

interface RevealOptions {
  /** sub-window of local section progress where the element fades/slides in */
  in?: [number, number]
  /** sub-window where it fades back out */
  out?: [number, number]
  /** downwards slide distance in px for the reveal */
  drift?: number
}

function ease(t: number) {
  return t * t * (3 - 2 * t)
}

/**
 * Plain-DOM section overlay driver: mutates style.opacity/transform on a ref
 * every rAF tick (shared loop in scroll-driver) — zero React re-renders during
 * scroll. Backwards-safe since it derives purely from the shared timeline.
 */
export function useReveal<T extends HTMLElement>(section: number, opts: RevealOptions = {}) {
  const ref = useRef<T>(null)
  const { in: fadeIn = [0.15, 0.5], out: fadeOut, drift = 24 } = opts

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      const p = localProgress(scrollState.value, section)
      let alpha = ease(windowed(p, fadeIn[0], fadeIn[1]))
      if (fadeOut) alpha *= 1 - ease(windowed(p, fadeOut[0], fadeOut[1]))
      el.style.opacity = String(alpha)
      el.style.transform = `translateY(${(1 - alpha) * drift}px)`
    }

    const unsub = subscribeScroll(apply)
    apply()

    return unsub
  }, [section, fadeIn, fadeOut, drift])

  return ref
}