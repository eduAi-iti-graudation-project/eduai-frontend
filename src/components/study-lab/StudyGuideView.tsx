import * as api from "@/lib/api"

export function StudyGuideView({ generation }: { generation: api.StudyGeneration }) {
 const guide = generation.payload as api.StudyGuide

 return (
  <div className="space-y-4">
   <div>
    <h3 className="font-headline-md text-headline-md text-primary">
     {guide.title}
    </h3>
    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
     {guide.summary}
    </p>
   </div>
   {guide.sections.map((section, i) => (
    <div
     key={i}
     className="rounded-lg border border-border bg-surface-container-low p-md"
    >
     <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
      {section.heading}
     </h4>
     <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
      {section.content}
     </p>
    </div>
   ))}
  </div>
 )
}
