import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  error: Error | null
}

/** Catches load failures (missing .glb) and clip-mismatch errors with a readable panel. */
export class LandingErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("Landing scene failed:", error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-lg rounded-xl border border-border bg-surface-container-lowest p-8 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">The 3D story couldn't load</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Check that your model files exist (defaults: <code className="rounded bg-surface-container px-1">/models/*.glb</code>) and the{" "}
            <code className="rounded bg-surface-container px-1">VITE_LANDING_*</code> values in{" "}
            <code className="rounded bg-surface-container px-1">.env.local</code> match the animation clip names inside them.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-on-surface p-4 font-mono text-label-sm text-inverse-on-surface whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset?.()
            }}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}