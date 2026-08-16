import { useState } from "react"
import * as api from "@/lib/api"
import {
  useStudyLabOfferings,
  useGenerateStudyLab,
  useStudyLabHistory,
  useStudyLabGeneration,
  useDeleteStudyLabGeneration,
  useRetryStudyLab,
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

// ── Slide Theme Configuration ──────────────────────────────────────────────

type ThemePresetDef = {
  value: api.StudyLabThemePreset
  label: string
  bg: string
  primary: string
  accent: string
  description: string
}

const THEME_PRESET_DEFS: ThemePresetDef[] = [
  {
    value: "modern",
    label: "Modern",
    bg: "#ffffff",
    primary: "#2563EB",
    accent: "#10B981",
    description: "Clean blue & emerald",
  },
  {
    value: "classic",
    label: "Classic",
    bg: "#ffffff",
    primary: "#1F2937",
    accent: "#DC2626",
    description: "Professional monochrome & red",
  },
  {
    value: "dark",
    label: "Dark",
    bg: "#0F172A",
    primary: "#93C5FD",
    accent: "#6EE7B7",
    description: "Dark slate with neon accents",
  },
  {
    value: "colorful",
    label: "Colorful",
    bg: "linear-gradient(135deg,#F9A8D4,#C4B5FD)",
    primary: "#EC4899",
    accent: "#F59E0B",
    description: "Vibrant gradient & warm tones",
  },
  {
    value: "minimal",
    label: "Minimal",
    bg: "#F9FAFB",
    primary: "#374151",
    accent: "#6B7280",
    description: "Subtle neutrals, clean layout",
  },
]

const BACKGROUND_OPTIONS: { value: api.StudyLabThemeBackground; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
  { value: "gradient", label: "Gradient", icon: "gradient" },
]

const MOTION_OPTIONS: { value: api.StudyLabThemeMotion; label: string; icon: string }[] = [
  { value: "rise", label: "Rise", icon: "arrow_upward" },
  { value: "fade", label: "Fade", icon: "opacity" },
  { value: "slide", label: "Slide", icon: "arrow_forward" },
  { value: "scale", label: "Scale", icon: "zoom_in" },
]

const QUICK_ACCENTS = [
  "#2563EB", "#10B981", "#DC2626", "#F59E0B",
  "#8B5CF6", "#EC4899", "#0EA5E9", "#F97316",
]

// ── Status / label helpers ─────────────────────────────────────────────────

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

const kindIcons: Record<string, string> = {
  PODCAST: "podcasts",
  SLIDES: "co_present",
  STUDY_GUIDE: "article",
  FLASHCARDS: "style",
  PRACTICE_QUESTIONS: "fact_check",
  CHEAT_SHEET: "bolt",
}

// ── Component ──────────────────────────────────────────────────────────────

export function StudyLabPage() {
  const offerings = useStudyLabOfferings()
  const generate = useGenerateStudyLab()
  const history = useStudyLabHistory()

  // Form state
  const [offeringId, setOfferingId] = useState("")
  const [kind, setKind] = useState<api.StudyLabKind>("PODCAST")
  const [materialKind, setMaterialKind] = useState<api.StudyLabMaterialKind>("STUDY_GUIDE")
  const [preset, setPreset] = useState<api.StudyLabPreset>("OVERVIEW")
  const [topic, setTopic] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)

  // Slide theme state
  const [themePreset, setThemePreset] = useState<api.StudyLabThemePreset>("modern")
  const [themeAccent, setThemeAccent] = useState<string>("#10B981")
  const [themeBackground, setThemeBackground] = useState<api.StudyLabThemeBackground>("light")
  const [themeMotion, setThemeMotion] = useState<api.StudyLabThemeMotion>("rise")

  // When preset changes, sync background + accent to preset defaults
  const applyPreset = (p: api.StudyLabThemePreset) => {
    const def = THEME_PRESET_DEFS.find((d) => d.value === p)
    setThemePreset(p)
    if (def) {
      setThemeAccent(def.accent)
      setThemeBackground(p === "dark" ? "dark" : p === "colorful" ? "gradient" : "light")
      setThemeMotion(p === "dark" ? "slide" : p === "colorful" ? "scale" : p === "minimal" ? "fade" : p === "classic" ? "fade" : "rise")
    }
  }

  const canGenerate = !!offeringId && topic.trim().length >= 3 && !generate.isPending

  const submit = () => {
    if (!canGenerate) return
    generate.mutate({
      courseOfferingId: offeringId,
      kind,
      ...(kind === "PODCAST" ? { preset } : {}),
      ...(kind === "STUDY_MATERIAL" ? { materialKind } : {}),
      ...(kind === "SLIDES"
        ? {
            theme: {
              preset: themePreset,
              accent: themeAccent,
              background: themeBackground,
              motion: themeMotion,
            },
          }
        : {}),
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
          <Select value={offeringId} onValueChange={setOfferingId}>
            <SelectTrigger className="form-input-focus rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[200px]">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {offerings.data?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.courseName} · {o.sectionName} ·{" "}
                  <span className={o.materialCount > 0 ? "text-primary" : "text-error"}>
                    {o.materialCount > 0 ? `${o.materialCount} material${o.materialCount === 1 ? "" : "s"}` : "no materials"}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="px-6 pb-6 flex-1">
        {/* ── Generation form ── */}
        <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
          {/* Kind selector */}
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

          {/* Kind-specific options */}
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

          {/* ── SLIDES: Theme Selector ── */}
          {kind === "SLIDES" && (
            <div className="rounded-lg border border-border bg-surface-container-lowest p-4 space-y-4">
              <p className="font-label-md text-label-md text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">palette</span>
                Presentation Theme
              </p>

              {/* Preset selector */}
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Style Preset</p>
                <div className="grid grid-cols-5 gap-2">
                  {THEME_PRESET_DEFS.map((def) => (
                    <button
                      key={def.value}
                      id={`theme-preset-${def.value}`}
                      type="button"
                      title={def.description}
                      onClick={() => applyPreset(def.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                        themePreset === def.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {/* Mini slide preview */}
                      <div
                        className="w-full h-10 rounded-md overflow-hidden flex items-center justify-center"
                        style={{ background: def.bg }}
                      >
                        <div className="w-6 h-1 rounded-full" style={{ backgroundColor: def.accent }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface">{def.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Accent color */}
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Accent Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      id="slide-theme-accent-picker"
                      type="color"
                      value={themeAccent}
                      onChange={(e) => setThemeAccent(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                      title="Pick accent color"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACCENTS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          onClick={() => setThemeAccent(color)}
                          className={cn(
                            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                            themeAccent === color ? "border-on-surface" : "border-transparent",
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">
                    {themeAccent}
                  </p>
                </div>

                {/* Background & Motion Row */}
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5">Background Style</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        key={bg.value}
                        id={`theme-bg-${bg.value}`}
                        type="button"
                        onClick={() => setThemeBackground(bg.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2 font-label-sm text-label-sm transition-all",
                          themeBackground === bg.value
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                            : "border-border text-on-surface-variant hover:bg-surface-container-low hover:border-outline-variant",
                        )}
                      >
                        <span className="material-symbols-outlined text-[16px]">{bg.icon}</span>
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion / transition */}
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5">Slide Transition</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MOTION_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        id={`theme-motion-${m.value}`}
                        type="button"
                        onClick={() => setThemeMotion(m.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-2 font-label-sm text-label-sm transition-all",
                          themeMotion === m.value
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                            : "border-border text-on-surface-variant hover:bg-surface-container-low hover:border-outline-variant",
                        )}
                      >
                        <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live preview strip */}
              <div className="rounded-lg overflow-hidden border border-border" style={{ height: 56 }}>
                <div
                  className="h-full flex items-center justify-between px-4"
                  style={{
                    background:
                      themeBackground === "dark"
                        ? "#0F172A"
                        : themeBackground === "gradient"
                          ? `linear-gradient(135deg, ${themeAccent}33, #ffffff)`
                          : "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-12 rounded-full" style={{ backgroundColor: themeAccent }} />
                    <div
                      className="h-3 w-24 rounded"
                      style={{
                        backgroundColor: themeBackground === "dark" ? "#F1F5F9" : "#1F2937",
                        opacity: 0.4,
                      }}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-2 rounded-full"
                        style={{
                          width: i === 1 ? 18 : 8,
                          backgroundColor: i === 1 ? themeAccent : (themeBackground === "dark" ? "#334155" : "#E5E7EB"),
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant/60 -mt-2">
                Preview — {THEME_PRESET_DEFS.find((d) => d.value === themePreset)?.description}
              </p>
            </div>
          )}

          {/* Topic input + Generate */}
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

        {/* ── History + Detail ── */}
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
              {history.data?.map((g) => {
                const resolvedKind = g.kind === "STUDY_MATERIAL" ? g.materialKind ?? "STUDY_MATERIAL" : g.kind
                return (
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
                        <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface truncate">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">
                            {kindIcons[resolvedKind] ?? "description"}
                          </span>
                          {kindLabels[resolvedKind]}
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
                )
              })}
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
  const { generation, isLoading, refetch } = useStudyLabGeneration(generationId)
  const remove = useDeleteStudyLabGeneration()
  const retry = useRetryStudyLab()

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
            Still generating ({generation.stage}) — refreshing automatically...
          </p>
          {/* Progress stages indicator */}
          <div className="mt-3 flex items-center gap-2">
            {["QUEUED", "GROUNDING", "GENERATING", "BUILDING"].map((stage, i) => {
              const stageOrder = ["QUEUED", "GROUNDING", "GENERATING", "BUILDING"]
              const currentIdx = stageOrder.indexOf(generation.stage)
              const isActive = i === currentIdx
              const isDone = i < currentIdx
              return (
                <div key={stage} className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold transition-colors",
                    isActive ? "bg-amber-500 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-amber-200 text-amber-600",
                  )}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={cn("font-label-sm text-label-sm capitalize hidden sm:block",
                    isActive ? "text-amber-800" : isDone ? "text-emerald-700" : "text-amber-400",
                  )}>
                    {stage.toLowerCase()}
                  </span>
                  {i < 3 && <div className={cn("h-px w-4 sm:w-8", isDone ? "bg-emerald-400" : "bg-amber-200")} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {generation.status === "FAILED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="font-label-md text-label-md text-red-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Generation failed: {generation.error ?? "unknown error"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
            disabled={retry.isPending}
            onClick={() => {
              retry.mutate(generation.id, {
                onSuccess: () => {
                  refetch()
                },
              })
            }}
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5">
              refresh
            </span>
            {retry.isPending ? "Retrying..." : "Retry Generation"}
          </Button>
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

