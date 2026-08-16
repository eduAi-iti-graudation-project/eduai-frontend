import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as api from "@/lib/api"
import { normalizeDeck } from "@/lib/deck"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SlideVisualView } from "@/components/study-lab/SlideVisualView"

const ACCENT_FALLBACK = "#a43073"

type Palette = {
 bg: string
 panel: string
 border: string
 text: string
 muted: string
 accent: string
}

function paletteFor(deck: api.Deck): Palette {
 const accent = deck.theme?.accent ?? ACCENT_FALLBACK
 const base: Palette = {
  bg: "#ffffff",
  panel: "#ffffff",
  border: "#334155",
  text: "#1F2937",
  muted: "#6B7280",
  accent,
 }
 if (deck.theme?.background === "dark") {
  return {
   bg: "#2f3130",
   panel: "#3a3d3c",
   border: "#464a49",
   text: "#f1f0f0",
   muted: "#8f8b8a",
   accent,
  }
 }
 if (deck.theme?.background === "gradient") {
  base.bg = `linear-gradient(180deg, ${accent}1A 0%, #ffffff 55%)`
 }
 return base
}

function motionClass(motion?: string): string {
 switch (motion) {
  case "fade":
   return "deck-fade-up"
  case "slide":
   return "deck-slide-in"
  case "scale":
   return "deck-zoom-in"
  default:
   return "deck-rise-in"
 }
}

function BlockView({
 block,
 palette,
 delay,
 anim,
}: {
 block: api.SlideBlock
 palette: Palette
 delay: number
 anim: string
}) {
 const style = { animationDelay: `${delay}ms` }
 switch (block.type) {
  case "heading":
   return (
    <h3
     className={cn(anim, "font-headline-lg text-headline-lg")}
     style={{ animationDelay: `${delay}ms`, color: palette.text }}
    >
     {block.text}
    </h3>
   )
  case "paragraph":
   return (
    <p
     className={cn(anim, "font-body-lg text-body-lg leading-relaxed")}
     style={{ animationDelay: `${delay}ms`, color: palette.text }}
    >
     {block.text}
    </p>
   )
  case "list":
   return block.ordered ? (
    <ol className={cn(anim, "space-y-2.5")} style={style}>
     {block.items.map((item, i) => (
      <li
       key={i}
       className="font-body-lg text-body-lg flex gap-3"
       style={{ color: palette.text }}
      >
       <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm"
        style={{ backgroundColor: palette.accent, color: "#ffffff" }}
       >
        {i + 1}
       </span>
       <span>{item}</span>
      </li>
     ))}
    </ol>
   ) : (
    <ul className={cn(anim, "space-y-2.5")} style={style}>
     {block.items.map((item, i) => (
      <li
       key={i}
       className="font-body-lg text-body-lg flex gap-2.5"
       style={{ color: palette.text }}
      >
       <span
        className="mt-0.5 font-bold"
        style={{ color: palette.accent }}
       >
        ▸
       </span>
       <span>{item}</span>
      </li>
     ))}
    </ul>
   )
  case "quote":
   return (
    <blockquote
     className={cn(
      anim,
      "rounded-lg border-l-4 bg-surface-container-lowest px-5 py-4",
     )}
     style={{
      animationDelay: `${delay}ms`,
      borderColor: palette.accent,
      backgroundColor: palette.panel,
     }}
    >
     <p
      className="font-headline-md text-headline-md italic leading-snug"
      style={{ color: palette.text }}
     >
      “{block.text}”
     </p>
     {block.attribution ? (
      <footer
       className="mt-2 font-label-md text-label-md"
       style={{ color: palette.muted }}
      >
       — {block.attribution}
      </footer>
     ) : null}
    </blockquote>
   )
  case "callout": {
   const tones: Record<
    string,
    { bg: string; border: string; fg: string; icon: string }
   > = {
    info: {
     bg: "rgba(164, 48, 115, 0.08)",
     border: "#a43073",
     fg: palette.text,
     icon: "info",
    },
    tip: {
     bg: "rgba(164, 48, 115, 0.08)",
     border: "#00668a",
     fg: palette.text,
     icon: "lightbulb",
    },
    warn: {
     bg: "rgba(14, 165, 233, 0.12)",
     border: "#006c4b",
     fg: palette.text,
     icon: "warning",
    },
   }
   const tone = tones[block.tone] ?? tones.info
   return (
    <div
     className={cn(anim, "flex gap-3 rounded-lg border-l-4 px-5 py-4")}
     style={{
      animationDelay: `${delay}ms`,
      backgroundColor: tone.bg,
      borderColor: tone.border,
     }}
    >
     <span
      className="material-symbols-outlined shrink-0 text-[22px]"
      style={{ color: tone.border }}
     >
      {tone.icon}
     </span>
     <p
      className="font-body-lg text-body-lg leading-relaxed"
      style={{ color: tone.fg }}
     >
      {block.text}
     </p>
    </div>
   )
  }
  case "code":
   return (
    <pre
     className={cn(anim, "overflow-x-auto rounded-lg p-4 text-sm")}
     style={{
      animationDelay: `${delay}ms`,
      backgroundColor: "#2f3130",
      color: "#ffafd3",
     }}
    >
     <code>{block.code}</code>
    </pre>
   )
  case "stat":
   return (
    <div
     className={cn(anim, "flex flex-col items-center gap-1 py-4")}
     style={{ animationDelay: `${delay}ms` }}
    >
     <span
      className="font-headline-xl text-headline-xl font-bold tracking-tight"
      style={{ color: palette.accent }}
     >
      {block.value}
     </span>
     <span
      className="font-label-md text-label-md uppercase tracking-wide"
      style={{ color: palette.muted }}
     >
      {block.label}
     </span>
    </div>
   )
  case "columns": {
   const cols = block.cols
   return (
    <div
     className={cn(anim, "grid gap-4")}
     style={{
      animationDelay: `${delay}ms`,
      gridTemplateColumns: `repeat(${Math.max(
       2,
       Math.min(3, cols.length),
      )}, minmax(0, 1fr))`,
     }}
    >
     {cols.map((col, i) => (
      <div
       key={i}
       className="rounded-lg border px-4 py-3"
       style={{
        borderColor: palette.border,
        backgroundColor: palette.panel,
       }}
      >
       <p
        className="font-headline-md text-headline-md mb-2"
        style={{ color: palette.accent }}
       >
        {col.heading}
       </p>
       <ul className="space-y-1.5">
        {col.items.map((item, j) => (
         <li
          key={j}
          className="font-body-sm text-body-sm leading-snug"
          style={{ color: palette.text }}
         >
          {item}
         </li>
        ))}
       </ul>
      </div>
     ))}
    </div>
   )
  }
 }
}

function SlideBody({
 slide,
 palette,
 anim,
}: {
 slide: api.Slide
 palette: Palette
 anim: string
}) {
 const accentBar = (
  <div
   className="h-1 w-14 rounded-full"
   style={{ backgroundColor: palette.accent }}
  />
 )

 if (slide.layout === "title" || slide.blocks.length === 0) {
  return (
   <div className="flex h-full flex-col items-center justify-center text-center">
    <div className={cn(anim, "mb-4")} style={{ animationDelay: "0ms" }}>
     {accentBar}
    </div>
    <h2
     className={cn(
      anim,
      "font-headline-xl text-headline-xl font-bold tracking-tight",
     )}
     style={{ animationDelay: "90ms", color: palette.text }}
    >
     {slide.title}
    </h2>
    {slide.eyebrow ? (
     <p
      className={cn(anim, "mt-3 font-label-md text-label-md uppercase")}
      style={{ animationDelay: "180ms", color: palette.muted }}
     >
      {slide.eyebrow}
     </p>
    ) : null}
   </div>
  )
 }

 const hasVisual = Boolean(slide.visual)
 const isSplit = slide.layout === "split" && hasVisual

 const textCol = (
  <div className="space-y-5">
   {slide.eyebrow ? (
    <div
     className={cn(anim, "flex items-center gap-2")}
     style={{ animationDelay: "0ms" }}
    >
     {accentBar}
     <span
      className="font-label-sm text-label-sm uppercase tracking-wider"
      style={{ color: palette.accent }}
     >
      {slide.eyebrow}
     </span>
    </div>
   ) : null}
   {slide.title ? (
    <h2
     className={cn(anim, "font-headline-xl text-headline-xl font-bold")}
     style={{ animationDelay: "60ms", color: palette.text }}
    >
     {slide.title}
    </h2>
   ) : null}
   <div className="space-y-4">
    {slide.blocks.map((block, i) => (
     <BlockView
      key={i}
      block={block}
      palette={palette}
      anim={anim}
      delay={140 + i * 90}
     />
    ))}
   </div>
  </div>
 )

 const visualCol = slide.visual ? (
  <div
   className={cn(
    anim,
    "rounded-lg border bg-surface-container-lowest p-4",
   )}
   style={{ animationDelay: "200ms", borderColor: palette.border }}
  >
   <SlideVisualView visual={slide.visual} />
  </div>
 ) : null

 if (isSplit) {
  return (
   <div className="grid h-full items-center gap-8 lg:grid-cols-2">
    <div>{textCol}</div>
    {visualCol}
   </div>
  )
 }

 return (
  <div className="flex h-full flex-col">
   <div className="flex-1 overflow-y-auto">
    <div className={cn("space-y-5", !isSplit && "mx-auto max-w-3xl")}>
     {textCol}
    </div>
   </div>
   {visualCol ? <div className="pt-6">{visualCol}</div> : null}
   {slide.note ? (
    <p
     className="mt-auto pt-5 font-label-sm text-label-sm italic"
     style={{ color: palette.muted }}
    >
     {slide.note}
    </p>
   ) : null}
  </div>
 )
}

export function SlidesView({ generation }: { generation: api.StudyGeneration }) {
 const deck = useMemo(
  () => normalizeDeck(generation.payload as api.Deck),
  [generation.payload],
 )
 const palette = useMemo(() => paletteFor(deck), [deck])
 const [index, setIndex] = useState(0)
 const [overview, setOverview] = useState(false)
 const stageRef = useRef<HTMLDivElement>(null)
 const slide = deck.slides[index]
 const anim = motionClass(deck.theme?.motion)

 const go = useCallback(
  (next: number) => {
   setIndex(Math.max(0, Math.min(deck.slides.length - 1, next)))
  },
  [deck.slides.length],
 )

 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "ArrowRight") go(index + 1)
   if (e.key === "ArrowLeft") go(index - 1)
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [go, index])

 const toggleFullscreen = () => {
  if (document.fullscreenElement) {
   void document.exitFullscreen()
  } else {
   void stageRef.current?.requestFullscreen?.()
  }
 }

 const progress = ((index + 1) / deck.slides.length) * 100

 return (
  <div className="space-y-4">
   <div className="flex items-center justify-between gap-3">
    <div>
     <h3 className="font-headline-md text-headline-md text-primary">
      {deck.title}
     </h3>
     <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
      Slide {index + 1} of {deck.slides.length}
     </p>
    </div>
    <Button
     type="button"
     size="sm"
     onClick={() => window.open(api.studyLabFileUrl(generation.id), "_blank")}
    >
     <span className="material-symbols-outlined text-[18px] mr-1.5">
      download
     </span>
     Download .pptx
    </Button>
   </div>

   <div
    ref={stageRef}
    className="relative overflow-hidden rounded-lg border shadow-sm"
    style={{
     backgroundColor: palette.bg,
     borderColor: palette.border,
    }}
   >
    <div
     className="h-1 transition-[width] duration-300"
     style={{ width: `${progress}%`, backgroundColor: palette.accent }}
    />
    {overview ? (
     <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {deck.slides.map((s, i) => (
       <button
        key={i}
        type="button"
        onClick={() => {
         setIndex(i)
         setOverview(false)
        }}
        className={cn(
         "rounded-lg border p-4 text-left transition-colors",
         i === index && "ring-2",
        )}
        style={{
         borderColor: i === index ? palette.accent : palette.border,
         backgroundColor: palette.panel,
        }}
       >
        <span
         className="font-label-sm text-label-sm uppercase"
         style={{ color: palette.muted }}
        >
         Slide {i + 1}
        </span>
        <span
         className="mt-1 block truncate font-headline-md text-headline-md"
         style={{ color: palette.text }}
        >
         {s.title ?? deck.title}
        </span>
       </button>
      ))}
     </div>
    ) : (
     <div className="relative" style={{ aspectRatio: "16 / 9" }}>
      <div className="absolute inset-0 flex flex-col p-6 sm:p-10">
       <SlideBody
        key={index}
        slide={slide}
        palette={palette}
        anim={anim}
       />
      </div>
      <button
       type="button"
       aria-label="Previous slide"
       className="absolute inset-y-0 left-0 w-[12%]"
       onClick={() => go(index - 1)}
      />
      <button
       type="button"
       aria-label="Next slide"
       className="absolute inset-y-0 right-0 w-[12%]"
       onClick={() => go(index + 1)}
      />
     </div>
    )}

    <div className="flex items-center justify-between px-4 py-2.5">
     <button
      type="button"
      aria-label="Toggle fullscreen"
      onClick={toggleFullscreen}
      className="font-label-sm text-label-sm flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-surface-container-lowest"
      style={{ color: palette.muted }}
     >
      <span className="material-symbols-outlined text-[18px]">
       fullscreen
      </span>
      Fullscreen
     </button>
     <div className="flex gap-1.5">
      {deck.slides.map((_, i) => (
       <button
        key={i}
        type="button"
        aria-label={`Go to slide ${i + 1}`}
        onClick={() => setIndex(i)}
        className="h-2 rounded-full transition-all"
        style={{
         width: i === index ? 22 : 8,
         backgroundColor: i === index ? palette.accent : palette.border,
        }}
       />
      ))}
     </div>
     <button
      type="button"
      onClick={() => setOverview((o) => !o)}
      className="font-label-sm text-label-sm flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-surface-container-lowest"
      style={{ color: palette.muted }}
     >
      <span className="material-symbols-outlined text-[18px]">
       grid_view
      </span>
      {overview ? "Close" : "Overview"}
     </button>
    </div>
   </div>

   <div className="flex items-center justify-center gap-3">
    <Button
     type="button"
     variant="outline"
     size="sm"
     disabled={index === 0}
     onClick={() => go(index - 1)}
    >
     <span className="material-symbols-outlined text-[18px]">
      chevron_left
     </span>
     Previous
    </Button>
    <span className="font-label-sm text-label-sm text-on-surface-variant">
     {index + 1} / {deck.slides.length}
    </span>
    <Button
     type="button"
     variant="outline"
     size="sm"
     disabled={index >= deck.slides.length - 1}
     onClick={() => go(index + 1)}
    >
     Next
     <span className="material-symbols-outlined text-[18px]">
      chevron_right
     </span>
    </Button>
   </div>
  </div>
 )
}