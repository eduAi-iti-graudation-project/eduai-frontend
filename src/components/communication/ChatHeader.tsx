import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  peerName: string
  peerInitials: string
  subtitle: string
  connected?: boolean
  basePath: string
}

export function ChatHeader({ peerName, peerInitials, subtitle, connected, basePath }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-3 py-2.5 border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur">
      <Link
        to={basePath}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
        aria-label="Back to conversations"
      >
        <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
      </Link>

      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-label-md font-bold">
          {peerInitials}
        </div>
        {connected !== undefined && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest",
              connected ? "bg-success" : "bg-warning",
            )}
            aria-hidden
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="font-label-md text-label-md text-primary truncate font-semibold">{peerName}</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{subtitle}</p>
      </div>
    </header>
  )
}