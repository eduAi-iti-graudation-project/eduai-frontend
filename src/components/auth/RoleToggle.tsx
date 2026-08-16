import { cn } from "@/lib/utils"

export type SignupRole = "teacher" | "student" | "guardian"

interface RoleToggleProps {
 value: SignupRole
 onChange: (role: SignupRole) => void
 className?: string
}

const OPTIONS: { value: SignupRole; label: string }[] = [
 { value: "teacher", label: "Teacher" },
 { value: "student", label: "Student" },
 { value: "guardian", label: "Parent" },
]

export function RoleToggle({ value, onChange, className }: RoleToggleProps) {
 return (
  <div className={cn("flex p-1 bg-surface-variant rounded-lg relative", className)}>
   {OPTIONS.map((option) => (
    <button
     key={option.value}
     type="button"
     className={cn(
      "flex-1 py-2 rounded-lg font-label-md transition-all duration-300 z-10",
      value === option.value
       ? "text-on-primary-container bg-primary-container"
       : "text-on-surface-variant",
     )}
     onClick={() => onChange(option.value)}
    >
     {option.label}
    </button>
   ))}
  </div>
 )
}