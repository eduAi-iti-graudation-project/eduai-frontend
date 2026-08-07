import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
})

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gradeLevel: z.number().min(1, "Grade is required").max(12).optional(),
})

export const joinSignupSchema = signupSchema.extend({
  organizationName: z
    .string()
    .trim()
    .min(1, "School name is required")
    .max(100, "School name must be at most 100 characters")
    .optional(),
  joinCode: z
    .string()
    .trim()
    .min(4, "Join code must be at least 4 characters")
    .max(12, "Join code must be at most 12 characters")
    .optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type JoinSignupFormData = z.infer<typeof joinSignupSchema>
