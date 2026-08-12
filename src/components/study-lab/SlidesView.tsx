import { useState } from "react"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SlidesView({ generation }: { generation: api.StudyGeneration }) {
  const deck = generation.payload as api.Deck
  const [index, setIndex] = useState(0)
  const slide = deck.slides[index]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">
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

      <div className="rounded-lg border border-border bg-surface-container-lowest p-8 min-h-[380px] flex flex-col">
        <h4 className="font-headline-lg text-headline-lg text-primary mb-4">
          {slide.title}
        </h4>
        {slide.code ? (
          <pre className="rounded-lg bg-[#0f172a] text-emerald-200 p-4 text-sm overflow-x-auto mb-4">
            {slide.code}
          </pre>
        ) : null}
        <ul className="space-y-3">
          {slide.bullets.map((b, i) => (
            <li
              key={i}
              className="font-body-md text-body-md text-on-surface flex gap-2.5"
            >
              <span className="text-primary mt-0.5">▸</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {slide.speakerNote ? (
          <p className="mt-auto pt-6 font-label-sm text-label-sm text-on-surface-variant italic border-t border-border mt-8">
            Note: {slide.speakerNote}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Previous
        </Button>
        <div className="flex gap-1.5">
          {deck.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === index ? "bg-primary" : "bg-outline-variant hover:bg-on-surface-variant",
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index >= deck.slides.length - 1}
          onClick={() => setIndex((i) => Math.min(deck.slides.length - 1, i + 1))}
        >
          Next
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </Button>
      </div>
    </div>
  )
}
