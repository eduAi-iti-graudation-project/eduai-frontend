import { FormMessage } from "@/components/ui/form"

interface FormFieldErrorProps {
  message?: string
}

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <FormMessage className="absolute -bottom-10 left-2 inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm">
      {message}
    </FormMessage>
  )
}