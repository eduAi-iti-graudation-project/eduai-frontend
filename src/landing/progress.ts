export const SECTION_COUNT = 10

/**
 * Relative duration of each chapter in scroll. The gate walk, the portal
 * approach and the tunnel run get the most scroll — they are the story's
 * centerpiece — while the transition bands stay short. The pricing finale
 * gets a full beat of its own.
 */
export const SECTION_WEIGHTS = [1.0, 0.8, 1.4, 1.4, 1.6, 1.6, 1.0, 2.0, 1.0, 1.6]

export const TOTAL_WEIGHT = SECTION_WEIGHTS.reduce((a, b) => a + b, 0)

/**
 * Total story height in viewports. Each section's DOM band and its scroll
 * span are derived from this × its weight, so every beat gets real scroll
 * distance — a normal-speed wheel pass still gives each scene time to land.
 */
export const PAGE_HEIGHT_VH = 1800

/** Scroll span of the whole story (PAGE minus the viewport that rides on top). */
export const SCROLL_SPAN_VH = PAGE_HEIGHT_VH - 100

/** DOM height of one section's band, in vh, aligned to its timeline span. */
export function bandHeightVh(section: number): number {
  return Math.round((SECTION_WEIGHTS[section] / TOTAL_WEIGHT) * SCROLL_SPAN_VH)
}

/** Normalized [0..1) start of each section in the global scroll timeline. */
export const SECTION_STARTS = (() => {
  const starts: number[] = []
  let acc = 0
  for (const w of SECTION_WEIGHTS) {
    starts.push(acc / TOTAL_WEIGHT)
    acc += w
  }
  return starts
})()

/** Normalized [0..1] width of each section in the global scroll timeline. */
export const SECTION_WIDTHS = SECTION_WEIGHTS.map((w) => w / TOTAL_WEIGHT)

export function sectionStart(section: number): number {
  return SECTION_STARTS[section] ?? 1
}

export function sectionWidth(section: number): number {
  return SECTION_WIDTHS[section] ?? 0
}

export interface ScrollState {
  /** Global scroll progress, 0..1 across the whole wrapper. Single source of truth. */
  value: number
  ready: boolean
}

/**
 * Module-level mutable singleton. Read inside useFrame/rAF callbacks; never
 * use it to drive React re-renders. Writing it every frame is cheap and keeps
 * camera, characters and DOM overlays on exactly the same timeline.
 */
export const scrollState: ScrollState = { value: 0, ready: false }

/** Clamp + smoothstep into a band, returning local progress 0..1. */
export function localProgress(global: number, section: number): number {
  const raw = (global - sectionStart(section)) / sectionWidth(section)
  return Math.min(1, Math.max(0, raw))
}

/** A softened 0..1 eased value for fades (avoids hard opacity cutoffs). */
export function easedProgress(global: number, section: number): number {
  const t = localProgress(global, section)
  return t * t * (3 - 2 * t)
}

/** Re-maps local 0..1 into a sub-window [a..b], clamped. */
export function windowed(progress: number, a: number, b: number): number {
  if (progress <= a) return 0
  if (progress >= b) return 1
  return (progress - a) / (b - a)
}
