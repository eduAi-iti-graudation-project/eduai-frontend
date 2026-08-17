import type { InsightSection } from "@/lib/api"
import type { InsightsInterval } from "@/hooks/use-dashboard-insights"
import { InsightSectionCard } from "./InsightSectionCard"

interface InsightSectionsGridProps {
 sections: InsightSection[]
 interval?: InsightsInterval
 studentId?: string
}

export function InsightSectionsGrid({ sections, interval = "week", studentId }: InsightSectionsGridProps) {
 const odd = sections.length % 2 !== 0
 const hero = odd ? sections[0] : null
 const rest = odd ? sections.slice(1) : sections

 return (
  <div className="stagger-enter grid gap-4 md:grid-cols-2">
   {hero && (
    <div className="md:col-span-2">
     <InsightSectionCard section={hero} interval={interval} studentId={studentId} />
    </div>
   )}
   {rest.map((section) => (
    <InsightSectionCard key={section.key} section={section} interval={interval} studentId={studentId} />
   ))}
  </div>
 )
}