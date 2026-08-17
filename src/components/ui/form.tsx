import * as React from "react"
import { Controller, FormProvider, useFormContext } from "react-hook-form"
import type {
 ControllerProps,
 FieldPath,
 FieldValues,
 FormProviderProps,
} from "react-hook-form"
import { Slot } from "@radix-ui/react-slot"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function Form<TFieldValues extends FieldValues>(props: FormProviderProps<TFieldValues>) {
 return <FormProvider {...props} />
}

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
 name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)
const FormItemContext = React.createContext<string | null>(null)

function useFormField() {
 const fieldContext = React.useContext(FormFieldContext)
 const itemId = React.useContext(FormItemContext)
 const { getFieldState, formState } = useFormContext()

 if (!fieldContext) {
  throw new Error("useFormField must be used within a FormField")
 }

 const fieldState = getFieldState(fieldContext.name, formState)

 return {
  id: itemId ?? undefined,
  name: fieldContext.name,
  formItemId: itemId ? `${itemId}-form-item` : undefined,
  formDescriptionId: itemId ? `${itemId}-form-description` : undefined,
  formMessageId: itemId ? `${itemId}-form-message` : undefined,
  ...fieldState,
 }
}

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
 props: ControllerProps<TFieldValues, TName>,
) {
 const { name } = props

 return (
  <FormFieldContext.Provider value={{ name }}>
   <Controller {...props} />
  </FormFieldContext.Provider>
 )
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
 ({ className, ...props }, ref) => {
  const id = React.useId()

  return (
   <FormItemContext.Provider value={id}>
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
   </FormItemContext.Provider>
  )
 },
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
 React.ElementRef<typeof Label>,
 React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
 const { error, formItemId } = useFormField()

 return (
  <Label
   ref={ref}
   className={cn(error ? "text-destructive" : undefined, className)}
   htmlFor={formItemId}
   {...props}
  />
 )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Slot>>(
 ({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField()

  return (
   <Slot
    ref={ref}
    id={formItemId}
    aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
    aria-invalid={Boolean(error)}
    {...props}
   />
  )
 },
)
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
 ({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = children ?? error?.message

  if (!body) {
   return null
  }

  return (
   <p
    ref={ref}
    id={formMessageId}
    className={cn("text-sm font-medium text-destructive", className)}
    {...props}
   >
    {body}
   </p>
  )
 },
)
FormMessage.displayName = "FormMessage"

export { Form, FormControl, FormField, FormItem, FormLabel, FormMessage }