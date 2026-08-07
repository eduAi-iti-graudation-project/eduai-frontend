import { useState } from "react"
import type { GuardianContentPayload } from "@/lib/api"

interface GuardianMessagePreviewProps {
  content: GuardianContentPayload
}

export function GuardianMessagePreview({ content }: GuardianMessagePreviewProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg bg-white border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-md hover:bg-surface-container transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-accent-foreground">family_history</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-primary">Guardian Notification</h3>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-md pb-md space-y-4">
          <div className="bg-accent rounded-lg p-4 border border-outline-variant">
            <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{content.message}</p>
          </div>

          {content.homeSupport.length > 0 && (
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2">Things You Can Do at Home</h4>
              <ol className="space-y-2 list-decimal list-inside">
                {content.homeSupport.map((strategy, i) => (
                  <li key={i} className="font-body-sm text-body-sm text-on-surface-variant">
                    {strategy}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
