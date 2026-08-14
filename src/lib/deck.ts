import type { Deck, Slide, SlideBlock, DeckTheme } from "@/lib/api"

const DEFAULT_THEME: DeckTheme = { background: "light", motion: "rise" }

function normalizeSlide(slide: Slide): Slide {
  const blocks: SlideBlock[] = [...(slide.blocks ?? [])]
  const code = slide.code ?? slide.code_snippet
  if (blocks.length === 0) {
    if (code) blocks.push({ type: "code", code })
    if (slide.bullets?.length) {
      blocks.push({ type: "list", items: slide.bullets, ordered: false })
    }
  }
  return {
    layout: slide.layout ?? "bullets",
    eyebrow: slide.eyebrow,
    title: slide.title,
    blocks,
    note: slide.note ?? slide.speakerNote ?? slide.speaker_note,
    visual: slide.visual,
  }
}

/** Normalizes a deck payload (legacy or designer shape) into the designer shape. */
export function normalizeDeck(payload: Deck): Deck & { theme: DeckTheme } {
  const theme = { ...DEFAULT_THEME, ...(payload.theme ?? {}) }
  return {
    title: payload.title ?? "Untitled",
    theme,
    slides: (payload.slides ?? []).map(normalizeSlide),
  }
}