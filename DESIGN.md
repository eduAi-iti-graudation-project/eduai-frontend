# Design System: EduAI Management Assistant
**Project ID:** 5189699912508134907
**Source Screen:** Signup - Desktop (Split Layout)

## 1. Visual Theme & Atmosphere

Warm, tactile, and approachable — built around a "Chalkboard Playful" narrative. The interface feels like a modern classroom assistant: soft surfaces, generous whitespace, and friendly geometry. Cream and navy create a stationery-like warmth, while coral CTAs provide energetic focal points. The mood is encouraging and human-centric, not cold or data-dense.

The aesthetic is **Modern-Tactile**: layered surfaces, soft-edged cards, and human-centric messaging. Every interaction should feel like a helpful assistant providing a nudge, not a rigid database system.

## 2. Color Palette & Roles

### Primary Palette
- **Chalkboard Teal (#006951)** — `primary`. Used for brand identity, active states, navigation highlights, and link text. Represents growth and stability.
- **Vibrant Teal (#008467)** — `primary-container`. Used for the active role toggle pill and badge icon tints. A lighter, more energetic teal.
- **Coral Red (#ae3028)** — `secondary`. Reserved for secondary accents and the "Forgot password?" link hover states.
- **Coral CTA (#fc695b)** — `secondary-container`. Primary call-to-action buttons ("Login to Dashboard", "Get Started"). High visibility without aggression.
- **Warm Gold (#785600)** — `tertiary`. Used sparingly for decorative icons and badge highlights.
- **Golden Yellow (#976d00)** — `tertiary-container`. Used for icon tints (e.g., lightbulb badge).
- **Error Red (#ba1a1a)** — `error`. Form validation and error messages.
- **Error Tint (#ffdad6)** — `error-container`. Error state backgrounds.

### Surface Palette
- **Cream Background (#faf8ff)** — `surface`, `background`, `surface-bright`. The global background. Softer on the eyes than pure white.
- **White Card (#ffffff)** — `surface-container-lowest`. Used for form cards, floating badges, and input fields to create distinction from the cream background.
- **Lavender Tint (#f3f2ff)** — `surface-container-low`. The right-side form section background. Creates subtle visual separation.
- **Lavender (#ebedff)** — `surface-container`. Used for the role toggle's inactive track background.
- **Soft Lavender (#e3e7ff)** — `surface-container-high`.
- **Periwinkle (#dce1ff)** — `surface-container-highest`. Used for input field borders and divider lines.
- **Faded Lavender (#d0d8ff)** — `surface-dim`.

### Text & Borders
- **Deep Navy (#0a1842)** — `on-surface`, `on-background`. Primary text color for headings, labels, and body copy. High contrast on cream.
- **Slate Gray (#3d4944)** — `on-surface-variant`. Secondary text for subtitles, descriptions, and placeholder text.
- **Muted Sage (#6d7a74)** — `outline`. Icon tints, non-focus states.
- **Soft Sage (#bccac2)** — `outline-variant`. Divider text, subtle borders.

## 3. Typography Rules

### Headlines — Quicksand (Rounded, Friendly, Bold)
- **Headline XL (40px / 48px line-height / -0.02em tracking / 700 weight)** — Reserved for the hero "EduAI" brand mark on the left panel.
- **Headline LG (32px / 40px / 700 weight)** — Card titles ("Create Account", "Welcome Back"). Friendly yet authoritative.
- **Headline MD (24px / 32px / 600 weight)** — Section headers within dense content.
- **Headline LG Mobile (28px / 36px / 700 weight)** — Card titles on mobile screens to prevent overflow.

### Body — Inter (Clean, Legible, Systematic)
- **Body LG (18px / 28px / 400 weight)** — Tagline text on the left branding panel.
- **Body MD (16px / 24px / 400 weight)** — Input values, footer text, and general body copy.

### Labels — Inter (Structured, Professional)
- **Label MD (14px / 20px / 600 weight / 0.01em tracking)** — Form field labels, role toggle text, social button text.
- **Label SM (12px / 16px / 500 weight)** — Divider text ("OR CONTINUE WITH"), forgot password link, error messages.

## 4. Component Stylings

### Buttons
- **Primary CTA (Coral):** Pill-shaped (`rounded-full`), `bg-secondary-container` (#fc695b) with white text. Full-width within forms. Includes a `shadow-lg shadow-secondary-container/20` for depth. On hover: `scale-[1.02]`. On click: `scale-95`. The arrow icon shifts right on hover via `group-hover:translate-x-1`.
- **Social Login (Google / Microsoft):** Squared (`rounded-xl`) with a `border-2 border-surface-container-highest`. White background with navy text. On hover: `bg-surface` (#faf8ff). Contains brand SVG icon + text.
- **Forgot Password:** Ghost link-style button. `font-label-sm text-primary hover:underline`. No background or border.
- **Role Toggle Button (Teacher/Student):** Inside a segmented pill (`rounded-full bg-surface-variant`). Active state uses `bg-primary-container text-on-primary-container`. Inactive uses `text-on-surface-variant`. Transitions smoothly.

### Cards & Containers
- **Form Card:** Deeply rounded (`rounded-3xl` = 1.5rem). White background (`bg-surface-container-lowest`). Padding: `p-8 md:p-10` (32px / 40px). Subtle border (`tactile-card`: 1.5px solid rgba(35,48,90,0.08)). Shadow: `shadow-[0_20px_50px_rgba(10,24,66,0.05)]`.
- **Floating Badges:** `rounded-2xl` (1rem). White background (`bg-surface-container-lowest`). Same `tactile-card` 1.5px border. Padding: `p-4`. No shadow. Icon (text-3xl) + label stack. Positioned absolutely with float animation.
- **Branding Card (Left Panel):** No formal card. Just `p-margin-desktop` (40px) with image and tagline.

### Inputs & Forms
- **Input Container:** Flex row with icon + input. White background (`bg-white`). `border-2 border-surface-container-highest` (#dce1ff). `rounded-xl` (0.75rem). Padding: `gap-3 px-4 py-3`.
- **Input Field:** Transparent background (`bg-transparent`). No border (`border-none`). No ring on focus (`focus:ring-0`). Full width (`w-full`). `text-body-md` (16px). Placeholder uses `text-outline-variant` (#bccac2).
- **Focus State:** Container border shifts to `border-primary` (#006951) with `shadow-[0_0_0_4px_rgba(0,105,81,0.1)]`.
- **Hover State:** Icon tints shift to primary teal via `group-hover/input:text-primary`.
- **Label:** `font-label-md` (14px/600). `ml-1` (4px left offset to align visually with input text). `text-on-background` (#0a1842).
- **Error State:** Container border shifts to `border-error` (#ba1a1a). Error message below: `text-error text-label-sm ml-1 mt-1`.
- **Form Layout:** `space-y-5` (20px) between field groups. Each field group: `space-y-1.5` (6px) between label + input wrapper.

### Dividers
- **OR Divider:** Flex row with horizontal rule (`h-[1px] bg-surface-container-highest`), centered uppercase label (`font-label-sm text-outline-variant tracking-widest uppercase`), and closing rule. Gap: `gap-4`. Margin: `my-8` (32px).

### Toggles / Segmented Controls
- **Role Toggle:** Pill-shaped container (`rounded-full bg-surface-variant`). `p-1` (4px inner padding). Two flex buttons. Active pill slides via `bg-primary-container text-on-primary-container`. No visible slider animation — active state is simply toggled.

## 5. Layout Principles

### Split Screen Structure
- **Desktop (≥1280px):** Two equal halves (`md:w-1/2`). Left: branding panel. Right: form panel. Constrained to 1920px max-width.
- **Laptop (≥1024px):** Split preserves. Section padding: 40px (`p-margin-desktop`).
- **Tablet (≤768px):** Stacks vertically. Left panel hidden. Right form full-width.
- **Mobile (≤480px):** Section padding: 16px (`p-margin-mobile`). Card fills available width. Max card width: 460px.

### Left Panel (Branding)
- `flex-col justify-between` — logo at top, image centered, tagline at bottom.
- Padding: `p-margin-desktop` (40px all sides).
- Image: centered within `max-w-md` (448px). `w-full h-auto drop-shadow-2xl`. Hover: `scale-105` with 700ms transition.
- Floating badges: absolute positioned at `top-1/4 left-1/4` and `bottom-1/4 right-1/4`. Float animation (4s cycle, 15px vertical displacement).

### Right Panel (Form)
- `flex items-center justify-center`. Centered vertically and horizontally.
- Padding: `p-margin-mobile` (16px) mobile, `md:p-margin-desktop` (40px) tablet/desktop, `xl:p-24` (96px) wide desktop.
- Background: `bg-surface-container-low` for subtle panel separation.

### Spacing Scale
Based on 8px grid with custom tokens:
- `xs`: 4px (label offset, inner pill padding)
- `base`: 8px
- `sm`: 12px (field group inner spacing)
- `md`: 24px (standard between sections)
- `lg`: 48px
- `xl`: 80px
- `gutter`: 24px
- `margin-mobile`: 16px
- `margin-desktop`: 40px

### Responsive Behavior
- The form card (`max-w-[460px]`) never exceeds 460px on any screen.
- Social buttons use `grid grid-cols-2 gap-4` and collapse gracefully.
- The role toggle spans full card width, each button `flex-1`.
- CTA button is always `w-full` within the form.
- Error messages are inline below inputs (`text-label-sm`), never overlapping.
