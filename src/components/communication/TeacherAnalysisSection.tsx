import { useState } from "react"
import type { TeacherContentPayload } from "@/lib/api"
import { RichText } from "@/components/shared/RichText"

interface TeacherAnalysisSectionProps {
 content: TeacherContentPayload
}

const RESOURCE_LINKS: { match: RegExp; url?: string }[] = [
 { match: /purdue\s*owl/i, url: "https://owl.purdue.edu/owl/general_writing/the_writing_process/thesis_statement_tips.html" },
 { match: /khan\s*academy/i, url: "https://www.khanacademy.org/" },
 { match: /grammarly/i, url: "https://www.grammarly.com/" },
 { match: /hemingway/i, url: "https://hemingwayapp.com/" },
 { match: /google\s*docs/i, url: "https://docs.google.com/document/u/0/" },
 { match: /common\s*core/i, url: "https://www.corestandards.org/ELA-Literacy/" },
 { match: /writing\s*center|peer.*mentor/i, url: undefined },
 { match: /rubric/i, url: undefined },
]

const TYPE_PREFIX_RE = /^(article|video|pdf|website|book|tool|resource)\b\s*/i

function cleanResource(text: string): string {
 return text.replace(TYPE_PREFIX_RE, "").trim()
}

function resourceHref(text: string): string | undefined {
 const entry = RESOURCE_LINKS.find((r) => r.match.test(text))
 return entry?.url
}

export function TeacherAnalysisSection({ content }: TeacherAnalysisSectionProps) {
 const [open, setOpen] = useState(true)

 return (
  <div className="rounded-lg bg-surface-container-lowest border border-border overflow-hidden">
   <button
    onClick={() => setOpen(!open)}
    className="w-full flex items-center justify-between p-md hover:bg-surface-container transition-colors text-left"
   >
    <div className="flex items-center gap-2">
     <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 flex items-center justify-center">
      <span className="material-symbols-outlined text-[18px] text-secondary">school</span>
     </div>
     <h3 className="font-headline-md text-headline-md text-primary">Teacher Analysis</h3>
    </div>
    <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }}>
     expand_more
    </span>
   </button>

   {open && (
    <div className="px-md pb-md space-y-4">
     {content.analysis && (
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
       <RichText text={content.analysis} className="text-body-md text-on-surface" />
      </div>
     )}

     <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {content.skillGaps.length > 0 && (
       <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
        <h4 className="font-label-md text-label-md text-primary mb-2 flex items-center gap-1">
         <span className="material-symbols-outlined text-[16px] text-secondary">lightbulb</span>
         Skill Gaps ({content.skillGaps.length})
        </h4>
        <div className="flex flex-wrap gap-2">
         {content.skillGaps.map((gap, i) => (
          <span
           key={i}
           className="font-body-md text-body-md font-medium text-on-surface bg-secondary-container/50 border border-secondary-container rounded-lg px-3 py-1.5"
          >
           {gap}
          </span>
         ))}
        </div>
       </div>
      )}

      {content.interventions.length > 0 && (
       <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
        <h4 className="font-label-md text-label-md text-primary mb-2 flex items-center gap-1">
         <span className="material-symbols-outlined text-[16px] text-primary">recommend</span>
         Recommended Interventions ({content.interventions.length})
        </h4>
        <ul className="space-y-2">
         {content.interventions.map((item, i) => (
          <li key={i} className="flex items-start gap-3 font-body-md text-body-md text-on-surface bg-surface-container-lowest rounded-lg px-3 py-2.5">
           <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-label-sm font-bold shrink-0 mt-0.5">
            {i + 1}
           </span>
           {item}
          </li>
         ))}
        </ul>
       </div>
      )}
     </div>

     {content.resourceSuggestions.length > 0 && (
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
       <h4 className="font-label-md text-label-md text-primary mb-2 flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px] text-secondary">menu_book</span>
        Resource Suggestions
       </h4>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {content.resourceSuggestions.map((res, i) => {
         const label = cleanResource(res)
         const href = resourceHref(res)
         return (
          <div
           key={i}
           className="flex items-start gap-2 font-body-md text-body-md bg-surface-container-lowest rounded-lg border border-outline-variant px-3 py-2.5 min-w-0"
          >
           <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">article</span>
           <span className="min-w-0">
            {href ? (
             <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
             >
              {label}
             </a>
            ) : (
             <RichText text={label} className="text-on-surface" />
            )}
           </span>
          </div>
         )
        })}
       </div>
      </div>
     )}
    </div>
   )}
  </div>
 )
}