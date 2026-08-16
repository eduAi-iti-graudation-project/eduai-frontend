import { Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SubmitButtonProps {
 isSubmitting: boolean
}

export function SubmitButton({ isSubmitting }: SubmitButtonProps) {
 return (
  <Button
   type="submit"
   disabled={isSubmitting}
   className="w-full rounded-lg bg-gradient-to-r from-primary via-primary-dark to-tertiary px-16 py-10 text-2xl font-black text-white shadow-[0_10px_40px_rgba(244,114,182,0.4)] transition-all duration-500 hover:scale-105 hover:from-primary hover:via-primary-dark hover:to-secondary hover:shadow-[0_20px_60px_rgba(0,108,75,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
  >
   {isSubmitting ? (
    <span className="flex items-center gap-4">
     <Loader2 className="h-9 w-9 animate-spin" />
     Submitting
    </span>
   ) : (
    <span className="flex items-center gap-4">
     <Send className="h-9 w-9" />
     Submit
    </span>
   )}
  </Button>
 )
}