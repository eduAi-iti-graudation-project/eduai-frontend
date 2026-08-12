import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

/** Fixed top navigation — visible over every band. */
export function NavBar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface">EduAI</span>
        </Link>
        <div className="flex items-center gap-md">
          <Link
            to="/pricing"
            className="hidden font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary sm:inline-flex"
          >
            Pricing
          </Link>
          <Button asChild variant="outline" className="h-9 rounded-lg px-4 text-on-surface-variant hover:text-primary">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="h-9 rounded-lg px-4">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}