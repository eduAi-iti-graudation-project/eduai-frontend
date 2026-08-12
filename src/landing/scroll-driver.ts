import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { scrollState } from "./progress"

gsap.registerPlugin(ScrollTrigger)

type ScrollSub = (progress: number) => void

const subscribers = new Set<ScrollSub>()
let rafLoop = 0
let loopRunning = false

function tick() {
  const p = scrollState.value
  subscribers.forEach((fn) => fn(p))
  if (loopRunning) rafLoop = requestAnimationFrame(tick)
}

/** Subscribe DOM-side consumers to the single scroll timeline (rAF-driven). */
export function subscribeScroll(fn: ScrollSub): () => void {
  subscribers.add(fn)
  if (!loopRunning) {
    loopRunning = true
    rafLoop = requestAnimationFrame(tick)
  }
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) {
      loopRunning = false
      cancelAnimationFrame(rafLoop)
    }
  }
}

/**
 * One Lenis instance + one scrub:1 ScrollTrigger over the tall invisible
 * wrapper. Every animated thing (camera, characters, text) reads
 * `scrollState.value` written here — a single source of truth.
 */
export function startScrollDriver(wrapper: HTMLElement): () => void {
  const lenis = new Lenis({
    smoothWheel: true,
    autoRaf: false,
    duration: 1.15,
  })

  const context = gsap.context(() => {
    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (st) => {
        scrollState.value = st.progress
      },
    })
  }, wrapper)

  const refresh = () => ScrollTrigger.refresh()
  window.addEventListener("load", refresh)
  const id = window.setTimeout(() => ScrollTrigger.refresh(), 300)

  return () => {
    window.clearTimeout(id)
    window.removeEventListener("load", refresh)
    context.revert()
    lenis.destroy()
    scrollState.value = 0
  }
}

/** Mounted inside the landing page — owns Lenis/ScrollTrigger lifecycle. */
export function useLandingScroll(wrapperRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const cleanup = startScrollDriver(wrapper)
    return cleanup
  }, [wrapperRef])
}