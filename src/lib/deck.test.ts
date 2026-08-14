import { describe, expect, it } from "vitest"
import type { Deck } from "@/lib/api"
import { normalizeDeck } from "@/lib/deck"

describe("normalizeDeck", () => {
  it("defaults theme and preserves designer blocks", () => {
    const deck = normalizeDeck({
      title: "Deck",
      slides: [
        { layout: "title", title: "Deck", blocks: [] },
        {
          layout: "bullets",
          title: "Intro",
          blocks: [{ type: "list", items: ["a", "b"], ordered: false }],
        },
      ],
    })
    expect(deck.theme).toEqual({ background: "light", motion: "rise" })
    expect(deck.slides[1].blocks).toHaveLength(1)
  })

  it("converts legacy bullets/code/speakerNote to blocks", () => {
    const legacy = {
      title: "Legacy",
      slides: [
        { title: "Intro", bullets: ["one", "two"] },
        {
          title: "Code",
          bullets: ["x"],
          code: "print(1)",
          speakerNote: "say this",
        },
      ],
    } as unknown as Deck
    const deck = normalizeDeck(legacy)
    const intro = deck.slides[0]
    expect(intro.layout).toBe("bullets")
    expect(intro.blocks).toEqual([
      { type: "list", items: ["one", "two"], ordered: false },
    ])
    const code = deck.slides[1]
    expect(code.blocks.map((b) => b.type)).toEqual(["code", "list"])
    expect(code.note).toBe("say this")
  })

  it("keeps accent and motion from the payload theme", () => {
    const deck = normalizeDeck({
      title: "Deck",
      theme: { background: "dark", accent: "#FF8800", motion: "scale" },
      slides: [],
    })
    expect(deck.theme.accent).toBe("#FF8800")
    expect(deck.theme.motion).toBe("scale")
  })
})