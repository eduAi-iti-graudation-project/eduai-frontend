import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

/** Fixed top navigation — visible over every band. */
export function NavBar() {
 return (
  <nav className="fixed inset-x-0 top-0 z-50">
   <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
    <Link to="/" className="flex items-center gap-2">
     <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
      school
     </span>
     <span className="font-headline-md text-headline-md text-on-surface">EduAI</span>
    </Link>
    <div className="flex items-center gap-md">
     <Link
      to="/pricing"
      className="hidden font-label-lg text-label-lg text-on-surface-variant transition-colors hover:text-primary sm:inline-flex"
     >
      Pricing
     </Link>
     <Button asChild variant="outline" className="h-11 rounded-lg px-6 text-label-lg font-label-lg text-on-surface-variant hover:text-primary">
      <Link to="/login">Log in</Link>
     </Button>
     <Button asChild className="h-11 rounded-lg px-6 text-label-lg font-label-lg">
      <Link to="/signup">Get Started</Link>
     </Button>
    </div>
   </div>
  </nav>
 )
}