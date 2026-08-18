import { cn } from "@/lib/utils"

export interface StepperStep {
  key: number
  label: string
  caption?: string
}

interface StepperProps {
  steps: readonly StepperStep[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const completed = step.key < currentStep
        const active = step.key === currentStep
        const clickable = completed && Boolean(onStepClick)
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => {
                if (clickable) onStepClick?.(step.key)
              }}
              disabled={!clickable}
              className={cn("flex flex-col items-center gap-1.5 group", clickable && "cursor-pointer")}
            >
              <span
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  completed
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "border-2 border-primary text-primary bg-primary-container/30"
                      : "bg-surface-container text-on-surface-variant",
                )}
              >
                {completed ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  <span className="font-label-lg text-label-lg">{step.key}</span>
                )}
              </span>
              <span
                className={cn(
                  "font-label-md text-label-md whitespace-nowrap",
                  (active || completed) && "text-primary",
                )}
              >
                {step.label}
              </span>
              {step.caption && (
                <span className="font-label-sm text-label-sm text-on-surface-variant/70 whitespace-nowrap hidden sm:block">
                  {step.caption}
                </span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-3 mb-md rounded-full transition-colors",
                  completed ? "bg-primary" : "bg-outline-variant",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}