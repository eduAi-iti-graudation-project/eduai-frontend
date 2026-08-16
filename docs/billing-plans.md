# Billing plans — reference for frontend dev

Single source of truth for the plan matrix lives in the backend:
`eduai-backend/src/billing/plan-catalog.ts`. The frontend mirrors it in
`src/lib/plans.ts` (`PLANS`, `TRIAL`) and `src/lib/api.ts` (the
`SubscriptionTier` / `PlanId` types). Keep those three files in sync when
pricing changes.

## Tiers today

There are **3 paid tiers** (`PlanId`: `basic`, `pro`, `enterprise`) plus the
free **Trial**. Schools that belong to a school group are restricted to
Enterprise only.

| | Trial | Basic | Pro | Enterprise |
|---|---|---|---|---|
| **Id / tier** | `TRIAL` | `basic` / `BASIC` | `pro` / `PRO` | `enterprise` / `ENTERPRISE` |
| **Price** | $0 | $50/mo | $120/mo | $300/mo |
| **Seats** | Unlimited* | 30 | 100 | 500 (∞ in a group) |
| **Period copy** | 14 days · everything included | per month · per school | per month · per school | per month · for districts |
| **Tagline** | Free for 14 days — no card required. | Core EduAI for small classrooms. | The full AI suite for growing schools. | Advanced analytics & priority support for large institutions. |
| **Checkout** | n/a (signup) | `createCheckoutSession("basic")` | `createCheckoutSession("pro")` | `createCheckoutSession("enterprise")` |

\* Trial seats are `null` (unlimited) on the frontend; the trial is capped at
the trial window, not seats.

## Feature ladder

Plans are cumulative — each tier includes everything below it.

**Core (Trial + all paid):**
- AI grading & per-criterion feedback
- Curriculum materials & AI curriculum search
- Attendance tracking & import
- Struggle-signal alerts & guardian notifications

**Pro (adds):**
- AI assistant, chat & homework help
- AI quiz generation, grading & anti-cheat
- Three-tier automated reports
- Labs & study lab

**Enterprise (adds):**
- Advanced dashboard insights & analytics
- Dedicated support & onboarding

## Frontend usage map

| File | What it renders |
|---|---|
| `src/lib/plans.ts` | `TRIAL` + `PLANS` catalog, `formatSeats()`, `useStartCheckout()` hook |
| `src/lib/api.ts` | `PlanId`, `SubscriptionTier`, `SubscriptionStatus`, `Organization` (incl. `groupId`/`groupName`), `createCheckoutSession`, `changePlan`, `createBillingPortal`, `getBillingStatus` |
| `src/pages/PricingPage.tsx` | Public pricing page (guest-facing marketing) |
| `src/pages/admin/AdminBillingPage.tsx` | Admin billing dashboard; shows a group banner + **Enterprise-only** cards when `org.groupId` is set |
| `src/components/billing/UpgradeDialog.tsx` | Feature-gate dialog; for grouped orgs it renders only the Enterprise option |
| `src/components/billing/SubscriptionBanner.tsx` | Subscription status banner in the app shell |
| `src/pages/admin/GroupManagementPage.tsx` | School-group create/join + group overview (`/admin/groups`) |

### UI gating rules (current behavior)

- **Guests** clicking a paid plan → `useStartCheckout` navigates to `/signup`.
- **Non-admin** users → toast "Only an organization admin can purchase a plan."
  (UpgradeDialog shows "ask an administrator".)
- **Admin, trial / no active sub** → real Stripe Checkout via
  `createCheckoutSession(planId)`.
- **Admin, active sub** → plan change via `changePlan(planId)` (no second
  checkout; prorated immediately, or at period end). `AdminBillingPage` shows
  the "Apply at period end" switch.
- **Grouped school** (`org.groupId` set) → only Enterprise is offered;
  backend enforces this (`GROUP_REQUIRES_ENTERPRISE`, 403) and downgrades are
  rejected/ignored. `seatLimit` is `null` for groups.
- **CANCELED / PAST_DUE** orgs → treated as needing a new subscription
  (checkout, not change-plan).

### Tier → UI copy

Use the catalog strings (`plan.price`, `plan.period`, `plan.tagline`,
`plan.features`) from `src/lib/plans.ts` — don't hardcode "$120/mo" etc. in
pages. `formatSeats(plan.seats)` → "30 seats", "100 seats", "500 seats",
"Unlimited".

## Types

```ts
export type PlanId = "basic" | "pro" | "enterprise"
export type SubscriptionTier = "TRIAL" | "BASIC" | "PRO" | "ENTERPRISE"
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED"
```

## Gotchas

- Enterprise is **$300** for a standalone school (500 seats); inside a school
  group it is **$300 for the whole group** with **unlimited seats**
  (`seatLimit: null`) — one bill covers every school in the group.
- The backend rejects checkout/change-plan for a non-Enterprise plan when the
  org is grouped (403 `GROUP_REQUIRES_ENTERPRISE`); the UI must never let a
  grouped admin pick Basic/Pro.
- Stripe price IDs come from env (`STRIPE_PRICE_BASIC/PRO/ENTERPRISE`). A plan
  whose price ID is unset reports `available: false` and checkout fails with
  `PLAN_NOT_AVAILABLE` (400).