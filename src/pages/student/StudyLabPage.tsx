import { useState } from "react"
import * as api from "@/lib/api"
import {
  useStudyLabOfferings,
  useGenerateStudyLab,
  useStudyLabHistory,
  useStudyLabGeneration,
  useDeleteStudyLabGeneration,
} from "@/hooks/use-study-lab"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PodcastView } from "@/components/study-lab/PodcastView"
import { SlidesView } from "@/components/study-lab/SlidesView"
import { StudyGuideView } from "@/components/study-lab/StudyGuideView"
import { FlashcardsView } from "@/components/study-lab/FlashcardsView"
import { PracticeView } from "@/components/study-lab/PracticeView"
import { CheatSheetView } from "@/components/study-lab/CheatSheetView"
import { cn } from "@/lib/utils"

const kindOptions: { value: api.StudyLabKind; label: string; icon: string; description: string }[] = [
  { value: "PODCAST", label: "Podcast", icon: "podcasts", description: "Two-voice audio episode with transcript" },
  { value: "SLIDES", label: "Slides", icon: "co_present", description: "Slide deck with .pptx download" },
  { value: "STUDY_MATERIAL", label: "Study Material", icon: "menu_book", description: "Guide, flashcards, practice, or cheat sheet" },
]

const materialKindOptions: { value: api.StudyLabMaterialKind; label: string; icon: string }[] = [
  { value: "STUDY_GUIDE", label: "Study Guide", icon: "article" },
  { value: "FLASHCARDS", label: "Flashcards", icon: "style" },
  { value: "PRACTICE_QUESTIONS", label: "Practice Questions", icon: "fact_check" },
  { value: "CHEAT_SHEET", label: "Cheat Sheet", icon: "bolt" },
]

const presetOptions: { value: api.StudyLabPreset; label: string }[] = [
  { value: "OVERVIEW", label: "Overview" },
  { value: "DEEP_DIVE", label: "Deep Dive" },
  { value: "EXAM_CRAM", label: "Exam Cram" },
  { value: "CASUAL", label: "Casual" },
  { value: "BREAKDOWN", label: "Breakdown" },
]

const statusStyles: Record<string, string> = {
  PROCESSING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
}

const kindLabels: Record<string, string> = {
  PODCAST: "Podcast",
  SLIDES: "Slides",
  STUDY_GUIDE: "Study Guide",
  FLASHCARDS: "Flashcards",
  PRACTICE_QUESTIONS: "Practice Questions",
  CHEAT_SHEET: "Cheat Sheet",
}

export function StudyLabPage() {
  const offerings = useStudyLabOfferings()
  const generate = useGenerateStudyLab()
  const history = useStudyLabHistory()

  const [offeringId, setOfferingId] = useState("")
  const [kind, setKind] = useState<api.StudyLabKind>("PODCAST")
  const [materialKind, setMaterialKind] = useState<api.StudyLabMaterialKind>("STUDY_GUIDE")
  const [preset, setPreset] = useState<api.StudyLabPreset>("OVERVIEW")
  const [topic, setTopic] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)

  const canGenerate =
    !!offeringId && topic.trim().length >= 3 && !generate.isPending

  const submit = () => {
    if (!canGenerate) return
    generate.mutate({
      courseOfferingId: offeringId,
      kind,
      ...(kind === "PODCAST" ? { preset } : {}),
      ...(kind === "STUDY_MATERIAL" ? { materialKind } : {}),
      topic: topic.trim(),
    })
    setTopic("")
  }

  const selectedKind = kindOptions.find((k) => k.value === kind)

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Study Lab"
        subtitle="Generate a podcast, slide deck, or study material from your course content."
        actions={
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Course</label>
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger aria-label="Course" className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[200px]">
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {offerings.data?.map((o) => (
                  <SelectItem key={o.offeringId} value={o.offeringId}>
                    {o.courseName}{" "}
                    <span className={o.materialCount > 0 ? "text-primary" : "text-error"}>
                      · {o.materialCount > 0 ? `${o.materialCount} material${o.materialCount === 1 ? "" : "s"}` : "no materials"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="px-6 pb-6 flex-1">
        <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {kindOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  kind === option.value
                    ? "bg-primary/5 border-primary/40"
                    : "border-border hover:border-primary/30",
                )}
              >
                <span className={cn("material-symbols-outlined text-[22px]", kind === option.value ? "text-primary" : "text-on-surface-variant")}>
                  {option.icon}
                </span>
                <p className="font-label-md text-label-md text-on-surface mt-1.5">{option.label}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {kind === "PODCAST" && (
              <Select value={preset} onValueChange={(v) => setPreset(v as api.StudyLabPreset)}>
                <SelectTrigger className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {kind === "STUDY_MATERIAL" && (
              <div className="flex flex-wrap gap-2">
                {materialKindOptions.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMaterialKind(m.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-label-sm text-label-sm transition-colors",
                      materialKind === m.value
                        ? "bg-primary/5 border-primary/40 text-primary"
                        : "border-border text-on-surface-variant hover:border-primary/30",
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canGenerate) submit()
              }}
              placeholder={
                kind === "PODCAST"
                  ? "What should the episode be about? (e.g. Photosynthesis)"
                  : kind === "SLIDES"
                    ? "What should the slides cover? (e.g. The French Revolution)"
                    : `Topic for the ${selectedKind?.label.toLowerCase()}...`
              }
              className="flex-1 form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60"
            />
            <Button type="button" onClick={submit} disabled={!canGenerate}>
              {generate.isPending ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] mr-1.5">auto_awesome</span>
              )}
              {generate.isPending ? "Starting..." : "Generate"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
              History
            </h2>
            <div className="space-y-2">
              {history.data?.length === 0 && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Nothing generated yet — pick a course and hit Generate.
                </p>
              )}
              {history.data?.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveId(g.id === activeId ? null : g.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    g.recommendedForAnalysisId
                      ? "border-primary/60 bg-primary/10"
                      : activeId === g.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    {g.recommendedForAnalysisId ? (
                      <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary">
                        <span className="material-symbols-outlined text-[18px]">spark</span>
                        Recommended practice
                      </span>
                    ) : (
                      <span className="font-label-md text-label-md text-on-surface truncate">
                        {kindLabels[g.kind === "STUDY_MATERIAL" ? g.materialKind ?? "STUDY_MATERIAL" : g.kind]}
                      </span>
                    )}
                    <span className={cn("font-label-sm text-label-sm rounded-full px-2 py-0.5 shrink-0", statusStyles[g.status])}>
                      {g.status === "PROCESSING" ? g.stage : g.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 truncate">
                    {g.topic}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-0.5">
                    {new Date(g.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            {!activeId && (
              <EmptyState
                icon="auto_stories"
                title="Pick a generation to view it"
                description="Your generated podcast, slides, and study materials will appear here."
              />
            )}
            {activeId && (
              <GenerationDetailView
                key={activeId}
                generationId={activeId}
                onDelete={() => setActiveId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GenerationDetailView({
  generationId,
  onDelete,
}: {
  generationId: string
  onDelete: () => void
}) {
  const { generation, isLoading } = useStudyLabGeneration(generationId)
  const remove = useDeleteStudyLabGeneration()

  if (isLoading && !generation) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 flex items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-primary">
          progress_activity
        </span>
        <span className="font-body-md text-body-md text-on-surface-variant">
          Loading generation...
        </span>
      </div>
    )
  }

  if (!generation) return null

  return (
    <div className="space-y-4">
      {generation.status === "PROCESSING" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="font-label-md text-label-md text-amber-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            Still generating — refreshing automatically...
          </p>
        </div>
      )}
      {generation.status === "FAILED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-label-md text-label-md text-red-800">
            Generation failed: {generation.error ?? "unknown error"}
          </p>
        </div>
      )}
      {generation.status === "READY" && generation.payload && (
        <div className="rounded-lg border border-border bg-surface p-5">
          {generation.kind === "PODCAST" && <PodcastView generation={generation} />}
          {generation.kind === "SLIDES" && <SlidesView generation={generation} />}
          {generation.kind === "STUDY_MATERIAL" &&
            generation.materialKind === "STUDY_GUIDE" && (
              <StudyGuideView generation={generation} />
            )}
          {generation.kind === "STUDY_MATERIAL" &&
            generation.materialKind === "FLASHCARDS" && (
              <FlashcardsView generation={generation} />
            )}
          {generation.kind === "STUDY_MATERIAL" &&
            generation.materialKind === "PRACTICE_QUESTIONS" && (
              <PracticeView generation={generation} />
            )}
          {generation.kind === "STUDY_MATERIAL" &&
            generation.materialKind === "CHEAT_SHEET" && (
              <CheatSheetView generation={generation} />
            )}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => {
          remove.mutate(generation.id)
          onDelete()
        }}
      >
        <span className="material-symbols-outlined text-[18px] mr-1">delete</span>
        Delete
      </Button>
    </div>
  )
}
