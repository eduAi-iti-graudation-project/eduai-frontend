import { useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const ROBOT_IMAGE =
  "https://lh3.googleusercontent.com/aida/AP1WRLvatK0oa70OgXYI1xwN07td_mPBmF4_jxbseRXIHjLqWfi-6Sddpc-OBnETMJlXbf4FqW1dafFVBrN6gcf76rrXRfcTqZXbeizOCyHlL0mhatN0HzPO_942mJDmaUDjyxE3wG0s4dLW4LAD7HJaz2G2PoCML2srU-Gppv9aKB1Yx_RDu48E1aGSlNG6M6NaVfTm5gh-2gsrMjsWw2LaB23PuSGy-Ukcpe4KJ9ALdMi5taaoQXiPpvLeIYw"

export function NotFoundPage() {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cardRef.current) return
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight
    const moveX = (x - 0.5) * 10
    const moveY = (y - 0.5) * 10
    cardRef.current.style.transform = `perspective(1000px) rotateX(${moveY}deg) rotateY(${moveX}deg)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-surface border-b-[1.5px] border-on-surface/10 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-headline-md font-bold text-primary">EduAI</span>
        </div>
        <nav className="hidden md:flex gap-8 items-center">
          <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md no-underline">Dashboard</Link>
          <Link to="/classes" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md no-underline">Classroom</Link>
          <Link to="/assistant" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md no-underline">Lessons</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-on-surface-variant hover:text-primary hover:bg-transparent active:scale-95 transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-on-surface-variant hover:text-primary hover:bg-transparent active:scale-95 transition-colors"
            aria-label="Help"
          >
            <span className="material-symbols-outlined">help_outline</span>
          </Button>
          <div className="w-10 h-10 rounded-lg bg-surface-variant border border-on-surface/10 overflow-hidden">
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-label-md text-label-md">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-12">
        <div className="max-w-2xl w-full flex flex-col items-center">
          <div ref={cardRef} className="p-8 md:p-12 w-full flex flex-col items-center text-center shadow-sm transition-transform duration-200 ease-out rounded-lg bg-surface-container-lowest border border-outline-variant">
            <div className="w-64 h-64 md:w-80 md:h-80 mb-8 animate-float">
              <img
                alt="Confused Robot Illustration"
                className="w-full h-full object-contain"
                src={ROBOT_IMAGE}
              />
            </div>

            <h1 className="font-headline-xl text-headline-xl text-primary mb-2">404</h1>

            <p className="font-headline-md text-headline-md text-on-surface-variant mb-8 max-w-2xl">
              Oops! This page seems to have wandered off to recess without telling anyone.
            </p>

            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
              <Button
                asChild
                className="bg-primary text-primary-foreground px-8 py-3 h-auto rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:bg-primary/90 active:scale-95 shadow-sm nudge-hover no-underline"
              >
                <Link to="/dashboard">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  Back to Dashboard
                </Link>
              </Button>
              <Button
                asChild
                className="bg-transparent border border-primary text-primary px-8 py-3 h-auto rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all hover:bg-primary/5 hover:text-primary active:scale-95 nudge-hover no-underline"
              >
                <Link to="/">
                  <span className="material-symbols-outlined">home</span>
                  Go Home
                </Link>
              </Button>
            </div>

            <div className="mt-12 p-4 border-[1.5px] border-dashed border-primary bg-primary/5 rounded-lg flex items-start gap-3 text-left max-w-2xl">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <div>
                <p className="font-label-md text-label-md text-primary mb-1">Looking for a specific lesson?</p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Our AI can help you find your teaching materials. Try searching in the main dashboard.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-6 text-on-surface-variant/60 font-label-sm text-label-sm">
            <a href="#" className="hover:text-primary transition-colors underline underline-offset-4">Report an issue</a>
            <a href="#" className="hover:text-primary transition-colors underline underline-offset-4">Status Page</a>
          </div>
        </div>
      </main>
    </div>
  )
}
