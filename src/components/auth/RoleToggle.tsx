import { cn } from "@/lib/utils"

type Role = "teacher" | "student"

interface RoleToggleProps {
  value: Role
  onChange: (role: Role) => void
  className?: string
}

export function RoleToggle({ value, onChange, className }: RoleToggleProps) {
  return (
    <div className={cn("flex p-1 bg-surface-variant rounded-full relative", className)}>
      <button
        type="button"
        className={cn(
          "flex-1 py-2 rounded-full font-label-md transition-all duration-300 z-10",
          value === "teacher"
            ? "text-on-primary-container bg-primary-container"
            : "text-on-surface-variant",
        )}
        onClick={() => onChange("teacher")}
      >
        Teacher
      </button>
      <button
        type="button"
        className={cn(
          "flex-1 py-2 rounded-full font-label-md transition-all duration-300 z-10",
          value === "student"
            ? "text-on-primary-container bg-primary-container"
            : "text-on-surface-variant",
        )}
        onClick={() => onChange("student")}
      >
        Student
      </button>
    </div>
  )
}
