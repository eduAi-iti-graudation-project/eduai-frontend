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
      className="w-full rounded-[32px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-16 py-10 text-2xl font-black text-white shadow-[0_10px_40px_rgba(139,92,246,0.5)] transition-all duration-500 hover:scale-105 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:shadow-[0_20px_60px_rgba(217,70,239,0.6)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
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