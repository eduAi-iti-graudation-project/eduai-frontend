import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form"
import { CheckCircle2, FileUp, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { FileUpload } from "@/components/FileUpload"
import { FormFieldError } from "@/components/FormFieldError"
import { SubmitButton } from "@/components/SubmitButton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const assignmentSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .min(10, "Notes must be at least 10 characters")
      .max(1000, "Notes must be 1000 characters or fewer"),
    file: z.instanceof(File).nullable(),
  })
  .superRefine((value, context) => {
    if (!value.file) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Please upload a PDF file",
      })
      return
    }

    if (value.file.type !== "application/pdf") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Only PDF files are allowed",
      })
    }

    if (value.file.size > MAX_FILE_SIZE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "File size must be 10MB or less",
      })
    }
  })

export type AssignmentFormData = z.infer<typeof assignmentSchema>

const defaultValues: AssignmentFormData = {
  notes: "",
  file: null,
}

export function AssignmentForm() {
  const [isSuccess, setIsSuccess] = useState(false)
  const successTimerRef = useRef<number | null>(null)

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    mode: "onChange",
    defaultValues,
  })

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const clearSuccessState = () => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  const onSubmit: SubmitHandler<AssignmentFormData> = async (data) => {
    try {
      console.log(data)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Assignment submitted successfully")
      setIsSuccess(true)
      reset(defaultValues)
      clearSuccessState()
      successTimerRef.current = window.setTimeout(() => {
        setIsSuccess(false)
        successTimerRef.current = null
      }, 2500)
    } catch {
      toast.error("Something went wrong while submitting")
    }
  }

  const onInvalid: SubmitErrorHandler<AssignmentFormData> = () => {
    toast.error("Please fix the highlighted fields")
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit, onInvalid)(event)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-[float_8s_ease-in-out_infinite] rounded-full bg-purple-500 opacity-60 mix-blend-screen blur-3xl" />
      <div className="absolute right-1/3 top-1/3 h-80 w-80 animate-[float_10s_ease-in-out_infinite_2s] rounded-full bg-pink-500 opacity-50 mix-blend-screen blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 h-72 w-72 animate-[float_12s_ease-in-out_infinite_4s] rounded-full bg-blue-500 opacity-40 mix-blend-screen blur-3xl" />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(20px) scale(1.05);
          }
          66% {
            transform: translateY(15px) translateX(-15px) scale(0.98);
          }
        }
      `}</style>

      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <Card className="w-full max-w-3xl overflow-hidden border-0 bg-white/10 backdrop-blur-3xl shadow-2xl">
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-indigo-400/30 via-purple-400/30 to-pink-400/30 blur-xl" />

          <CardHeader className="pb-10 pt-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_60px_rgba(217,70,239,0.6)]">
                  {isSuccess ? (
                    <CheckCircle2 className="h-14 w-14 animate-[bounce_0.6s_ease-in-out_infinite] text-white" />
                  ) : (
                    <FileUp className="h-14 w-14 text-white" />
                  )}
                </div>
              </div>
            </div>

            <CardTitle className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-6xl font-black text-transparent drop-shadow-sm">
              {isSuccess ? "Success!" : "Upload Assignment"}
            </CardTitle>

            <CardDescription className="mt-5 text-2xl text-white/90">
              {isSuccess ? "Your assignment has been submitted!" : "Share your work with your instructor"}
            </CardDescription>
          </CardHeader>

          {!isSuccess ? (
            <Form {...form}>
              <form onSubmit={handleFormSubmit} noValidate>
                <CardContent className="space-y-12 px-10">
                  <FormField
                    control={control}
                    name="notes"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-5">
                        <FormLabel className="flex items-center gap-3 text-xl font-bold text-white">
                          <Sparkles className="h-7 w-7 text-pink-400" />
                          Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            id={field.name}
                            placeholder="Write a brief description of your assignment..."
                            className="min-h-[200px] resize-none rounded-[24px] border-2 border-white/20 bg-white/5 p-7 text-xl text-white shadow-lg transition-all duration-500 placeholder:text-white/40 focus:border-indigo-400 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormFieldError message={fieldState.error?.message} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="file"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-5">
                        <FormLabel className="flex items-center gap-3 text-xl font-bold text-white">
                          <Sparkles className="h-7 w-7 text-indigo-400" />
                          PDF Upload
                        </FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                            errorMessage={fieldState.error?.message}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>

                <CardFooter className="justify-center px-10 pb-10 pt-8">
                  <SubmitButton isSubmitting={isSubmitting} />
                </CardFooter>
              </form>
            </Form>
          ) : (
            <CardContent className="px-10 pb-10 pt-4 text-center">
              <div className="rounded-[28px] border-[3px] border-white/20 bg-white/10 p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.25)]">
                <p className="text-2xl font-black uppercase tracking-[0.2em]">Submission complete</p>
                <p className="mt-3 text-lg text-white/80">The form has been reset and is ready for another file.</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}