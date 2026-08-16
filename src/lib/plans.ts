import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import * as api from "./api"

export type PlanId = api.PlanId

export interface PlanOption {
  id: PlanId
  name: string
  /** Display price, e.g. "$120" */
  price: string
  priceCents: number
  period: string
  /** Seat limit enforced by the backend plan catalog (null = unlimited). */
  seats: number | null
  tagline: string
  features: string[]
  cta: string
  featured: boolean
}

export const TRIAL_DAYS = 14

export const TRIAL: {
  name: string
  price: string
  period: string
  seats: number | null
  tagline: string
  features: string[]
  cta: string
  to: string
} = {
  name: "Trial",
  price: "$0",
  period: "14 days · everything included",
  seats: null,
  tagline: "Free for 14 days — no card required.",
  features: [
    "Every core feature, fully unlocked",
    "AI grading & per-criterion feedback",
    "Curriculum materials & AI search",
    "Attendance tracking & import",
    "Struggle-signal alerts & guardian notifications",
  ],
  cta: "Start free — for teachers",
  to: "/signup",
}

/** Mirrors the backend plan catalog (src/billing/plan-catalog.ts). */
export const PLANS: PlanOption[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$50",
    priceCents: 5000,
    period: "per month · per school",
    seats: 30,
    tagline: "Core EduAI for small classrooms.",
    features: [
      "Everything in the 14-day trial",
      "AI grading & per-criterion feedback",
      "Curriculum materials & AI search",
      "Attendance tracking & import",
      "Struggle-signal alerts & guardian notifications",
      "30 seats",
    ],
    cta: "Get Basic now",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$120",
    priceCents: 12000,
    period: "per month · per school",
    seats: 100,
    tagline: "The full AI suite for growing schools.",
    features: [
      "Everything in Basic",
      "AI assistant, chat & homework help",
      "AI quiz generation, grading & anti-cheat",
      "Three-tier automated reports",
      "Labs & study lab",
      "100 seats",
    ],
    cta: "Get Pro now",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$300",
    priceCents: 30000,
    period: "per month · for districts",
    seats: 500,
    tagline: "Advanced analytics & priority support for large institutions.",
    features: [
      "Everything in Pro",
      "Advanced dashboard insights & analytics",
      "Dedicated support & onboarding",
      "500 seats",
    ],
    cta: "Get Enterprise now",
    featured: false,
  },
]

export function formatSeats(seats: number | null): string {
  return seats === null ? "Unlimited" : `${seats} seats`
}

/**
 * Starts a real Stripe checkout for a paid plan.
 * - Guests are sent to /signup (they must create an org first).
 * - Non-admin users are told to ask their administrator.
 * - Admins get a hosted Stripe Checkout session.
 */
export function useStartCheckout() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return useCallback(
    async (planId: PlanId) => {
      if (!user) {
        navigate("/signup")
        return
      }
      if (user.role !== "ADMIN") {
        toast.error("Only an organization admin can purchase a plan.")
        return
      }
      try {
        const { url } = await api.createCheckoutSession(planId)
        if (url) {
          window.location.assign(url)
        } else {
          toast.error("Checkout is not available right now. Please try again.")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.")
      }
    },
    [navigate, user],
  )
}