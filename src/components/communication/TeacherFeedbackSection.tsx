import { useState } from "react"
import type { TeacherFeedbackPayload } from "@/lib/api"

interface TeacherFeedbackSectionProps {
 content: TeacherFeedbackPayload
}

export function TeacherFeedbackSection({ content }: TeacherFeedbackSectionProps) {
 const [open, setOpen] = useState(false)

 return (
  <div className="rounded-lg bg-surface-container-lowest border border-border overflow-hidden">
   <button
    onClick={() => setOpen(!open)}
    className="w-full flex items-center justify-between p-md hover:bg-surface-container transition-colors text-left"
   >
    <div className="flex items-center gap-2">
     <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
      <span className="material-symbols-outlined text-[18px] text-primary">feedback</span>
     </div>
     <h3 className="font-headline-md text-headline-md text-primary">Teacher Feedback</h3>
    </div>
    <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }}>
     expand_more
    </span>
   </button>

   {open && (
    <div className="px-md pb-md space-y-4">
     {content.feedback && (
      <div className="bg-surface-container-low rounded-lg p-3">
       <p className="font-body-md text-body-md text-on-surface">{content.feedback}</p>
      </div>
     )}

     {content.patternAnalysis && (
      <div>
       <h4 className="font-label-md text-label-md text-primary mb-2">Pattern Analysis</h4>
       <p className="font-body-sm text-body-sm text-on-surface-variant">{content.patternAnalysis}</p>
      </div>
     )}

     {content.strategies.length > 0 && (
      <div>
       <h4 className="font-label-md text-label-md text-primary mb-2">Strategies</h4>
       <ul className="space-y-1">
        {content.strategies.map((s, i) => (
         <li key={i} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="text-primary mt-0.5">•</span>
          {s}
         </li>
        ))}
       </ul>
      </div>
     )}
    </div>
   )}
  </div>
 )
}
