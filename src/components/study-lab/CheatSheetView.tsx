import * as api from "@/lib/api"

export function CheatSheetView({ generation }: { generation: api.StudyGeneration }) {
  const cheatSheet = generation.payload as api.CheatSheet

  return (
    <div className="space-y-4">
      <h3 className="font-headline-md text-headline-md text-on-surface">
        {cheatSheet.title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {cheatSheet.sections.map((section, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface-container-low p-5"
          >
            <h4 className="font-headline-sm text-headline-sm text-primary mb-3">
              {section.heading}
            </h4>
            <ul className="space-y-2">
              {section.bullets.map((b, j) => (
                <li
                  key={j}
                  className="font-body-md text-body-md text-on-surface flex gap-2.5"
                >
                  <span className="text-primary mt-0.5">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
