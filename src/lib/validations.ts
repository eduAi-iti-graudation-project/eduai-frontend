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
  guardianName: z.string().trim().min(1, "Parent name is required").max(120).optional(),
  guardianEmail: z
    .string()
    .email("Please enter a valid parent email")
    .optional()
    .or(z.literal("")),
})

export const teacherSignupSchema = joinSignupSchema.extend({
  ssn: z
    .string()
    .trim()
    .regex(/^\d{3}[- ]?\d{2}[- ]?\d{4}$/, "SSN must be 9 digits (e.g. 123-45-6789)"),
  phone: z.string().trim().min(6, "Phone number is required").max(30),
  street: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(120, "Street address must be at most 120 characters"),
  city: z.string().trim().min(1, "City is required").max(80),
  nationality: z
    .string()
    .trim()
    .min(1, "Nationality is required")
    .max(80)
    .optional(),
  personalEmail: z
    .string()
    .email("Please enter a valid personal email")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  emergencyContactRelationship: z.string().trim().max(60).optional(),
})

export type TeacherSignupFormData = z.infer<typeof teacherSignupSchema>

export const guardianSignupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(4, "Join code must be at least 4 characters")
    .max(12, "Join code must be at most 12 characters"),
  name: z.string().min(1, "Name is required"),
  personalEmail: z.string().email("Please enter a valid personal email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  childSchoolEmail: z.string().email("Please enter your child's school email"),
  phone: z.string().trim().min(6, "Phone number is required").max(30).optional(),
  nationality: z.string().trim().min(1, "Nationality is required").max(80).optional(),
})

export type GuardianSignupFormData = z.infer<typeof guardianSignupSchema>

export const teacherProfileSchema = z.object({
  phone: z.string().trim().min(6, "Phone number is required").max(30),
  street: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(120, "Street address must be at most 120 characters"),
  city: z.string().trim().min(1, "City is required").max(80),
  nationality: z.string().trim().min(1, "Nationality is required").max(80),
  personalEmail: z
    .string()
    .email("Please enter a valid personal email")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  emergencyContactName: z.string().trim().max(120),
  emergencyContactPhone: z.string().trim().max(30),
  emergencyContactRelationship: z.string().trim().max(60),
})

export type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type JoinSignupFormData = z.infer<typeof joinSignupSchema>
