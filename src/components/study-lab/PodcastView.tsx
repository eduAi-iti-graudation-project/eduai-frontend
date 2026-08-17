import { useEffect, useMemo, useState } from "react"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function useAudioUrl(generationId: string, hasAudio: boolean) {
 const [url, setUrl] = useState<string | null>(null)
 const [error, setError] = useState(false)

 useEffect(() => {
  if (!hasAudio) return
  let revoked: string | null = null
  let cancelled = false
  api
   .fetchFileBlob(api.studyLabFileUrl(generationId))
   .then((blob) => {
    if (cancelled) return
    revoked = URL.createObjectURL(blob)
    setUrl(revoked)
   })
   .catch(() => {
    if (!cancelled) setError(true)
   })
  return () => {
   cancelled = true
   if (revoked) URL.revokeObjectURL(revoked)
  }
 }, [generationId, hasAudio])

 return { url, error }
}

export function PodcastView({
 generation,
}: {
 generation: api.StudyGeneration
}) {
 const script = generation.payload as api.PodcastScript
 const hasAudio = !!generation.audioUrl
 const { url, error } = useAudioUrl(generation.id, hasAudio)
 const [speaking, setSpeaking] = useState(false)

 const speakerLabel = (speaker: "HOST" | "GUEST") =>
  speaker === "HOST" ? "Host" : "Guest"

 const speak = () => {
  if (!("speechSynthesis" in window)) return
  const synth = window.speechSynthesis
  if (speaking) {
   synth.cancel()
   setSpeaking(false)
   return
  }
  script.segments.forEach((seg) => {
   const utter = new SpeechSynthesisUtterance(seg.text)
   utter.rate = 1.0
   utter.pitch = seg.speaker === "HOST" ? 1.0 : 0.85
   synth.speak(utter)
  })
  setSpeaking(true)
 }

 const onEnd = useMemo(
  () => () => {
   setSpeaking(false)
  },
  [],
 )

 useEffect(() => {
  if (!speaking) return
  const synth = window.speechSynthesis
  const check = setInterval(() => {
   if (!synth.speaking) {
    setSpeaking(false)
    clearInterval(check)
   }
  }, 500)
  return () => clearInterval(check)
 }, [speaking])

 return (
  <div className="space-y-4">
   <div className="rounded-lg bg-surface-container-low border border-border p-4">
    <h3 className="font-headline-md text-headline-md text-primary">
     {script.title}
    </h3>
    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
     {script.description}
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-3">
     {url && !error ? (
      <audio controls src={url} className="w-full max-w-xl" />
     ) : null}
     {error && (
      <p className="font-label-sm text-label-sm text-destructive">
       Audio could not be loaded.
      </p>
     )}
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
       window.speechSynthesis.cancel()
       onEnd()
       window.setTimeout(speak, 50)
      }}
     >
      <span className="material-symbols-outlined text-[18px] mr-1.5">
       {speaking ? "stop_circle" : "record_voice_over"}
      </span>
      {speaking ? "Stop reading" : "Read aloud (browser voice)"}
     </Button>
    </div>
   </div>

   <div className="space-y-3">
    {script.segments.map((seg, i) => (
     <div
      key={i}
      className={cn(
       "rounded-lg border border-border p-4",
       seg.speaker === "HOST"
        ? "bg-primary/5 border-primary/20"
        : "bg-surface-container-low",
      )}
     >
      <p
       className={cn(
        "font-label-sm text-label-sm mb-1.5 flex items-center gap-1.5",
        seg.speaker === "HOST" ? "text-primary" : "text-on-surface-variant",
       )}
      >
       <span className="material-symbols-outlined text-[16px]">
        {seg.speaker === "HOST" ? "mic" : "headphones"}
       </span>
       {speakerLabel(seg.speaker)}
      </p>
      <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
       {seg.text}
      </p>
     </div>
    ))}
   </div>
  </div>
 )
}
