import { useEffect, useRef } from "react"
import { scrollState } from "./progress"
import { subscribeScroll } from "./scroll-driver"
import { warpStrength } from "./scenes"

/**
 * Full-screen radial flash that masks every pocket-environment swap — the
 * "dream dissolve" between scenes. Opacity is driven from the scroll timeline
 * through ref mutation (no re-renders, backwards-safe).
 */
export function WarpFlash() {
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
  const apply = () => {
   if (ref.current) ref.current.style.opacity = String(warpStrength(scrollState.value) * 0.9)
  }
  const unsub = subscribeScroll(apply)
  apply()
  return unsub
 }, [])

 return (
  <div
   ref={ref}
   className="pointer-events-none fixed inset-0 z-20"
   style={{
    opacity: 0,
    background:
     "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.98), rgba(217,230,246,0.7) 45%, rgba(120,140,165,0.85) 100%)",
   }}
  />
 )
}
