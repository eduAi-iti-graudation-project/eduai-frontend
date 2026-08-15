---
name: EduAI Playground — Crayon Box
colors:
  surface: '#fff8fb'
  surface-dim: '#f0cfe0'
  surface-bright: '#fff8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf2f8'
  surface-container: '#fbe7f2'
  surface-container-high: '#f9dceb'
  surface-container-highest: '#f6d1e4'
  on-surface: '#35122b'
  on-surface-variant: '#7c4a63'
  inverse-surface: '#4a0d3f'
  inverse-on-surface: '#fdeef6'
  outline: '#96707e'
  outline-variant: '#d8b6c8'
  surface-tint: '#db2777'
  primary: '#db2777'
  on-primary: '#ffffff'
  primary-container: '#fce7f3'
  on-primary-container: '#9d174d'
  inverse-primary: '#f9a8d4'
  secondary: '#0284c7'
  on-secondary: '#ffffff'
  secondary-container: '#e0f2fe'
  on-secondary-container: '#075985'
  success: '#16a34a'
  on-success: '#ffffff'
  success-container: '#dcfce7'
  on-success-container: '#14532d'
  warning: '#d97706'
  on-warning: '#ffffff'
  warning-container: '#fef3c7'
  on-warning-container: '#78350f'
  error: '#e11d48'
  on-error: '#ffffff'
  error-container: '#ffe4e6'
  on-error-container: '#9f1239'
  primary-fixed: '#fce7f3'
  primary-fixed-dim: '#f9a8d4'
  on-primary-fixed: '#5b0d35'
  on-primary-fixed-variant: '#a11057'
  secondary-fixed: '#e0f2fe'
  secondary-fixed-dim: '#bae6fd'
  on-secondary-fixed: '#082f49'
  on-secondary-fixed-variant: '#075985'
  background: '#fff8fb'
  on-background: '#35122b'
  surface-variant: '#f6d1e4'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  number-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  number-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
  mono-md:
    fontFamily: 'JetBrains Mono'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
fixed-layout:
  sidebar-width: 256px
  sidebar-bg: '#4a0d3f'
  topbar-height: 64px
  content-max-width: 1600px
  page-margin: 24px
  gutter: 16px
  card-padding: 20px
  table-row-height: 44px
  table-header-height: 36px
spacing:
  stack-xs: 2px
  stack-sm: 4px
  stack-md: 8px
  stack-lg: 12px
  stack-lg2: 16px
  stack-xl: 24px
  stack-2xl: 32px
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.625rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
elevation:
  card: '0 1px 2px rgba(53,18,43,0.04), 0 6px 18px rgba(219,39,119,0.08)'
  hover: '0 2px 4px rgba(53,18,43,0.06), 0 10px 28px rgba(219,39,119,0.13)'
  floating: '0 4px 12px rgba(53,18,43,0.08), 0 16px 40px rgba(219,39,119,0.18)'
---

# EduAI Playground — Crayon Box Design System

A **warm, friendly, colorful** school app for every role — students, teachers,
guardians, and admins. The aesthetic is "Crayon Box": a fresh page of
school supplies. A bold magenta-pink primary (`#db2777`) partners with a
sky-blue secondary (`#0284c7`) for a cheerful two-tone base, while the status
colors, chips, and charts borrow from a full crayon box (sky, sunshine,
mint, coral, violet). Surfaces stay clean and warm-white so dense data stays
legible — color lives in the stickers: chips, icon tiles, buttons, and charts.
Body copy and tabular numbers remain in Inter.

## 1. Brand & Mood
- **Scale & Sentiment**: approachable, encouraging, alive — like a favorite
  classroom: colorful but organized. Rounded shapes, soft colored shadows,
  sticker-like chips, warm pastel tints. Playful, never childish.
- **Reference energy**: modern edtech (Duolingo polish, ClassDojo warmth) with
  the density of a real school-ops tool. Think "fresh notebooks + full crayon
  box on a clean desk".
- **Persona**: a student who checks grades without dread, a teacher who scans
  their day in one glance, a guardian who feels reassured.

## 2. Color Strategy
- **Foundation**: clean warm-white `#fff8fb` pages, pure-white cards separated by
  visible `1px` blush-pink outlines (`#d8b6c8`) and gentle magenta-tinted shadows.
  The page stays calm — the crayons do the talking.
- **Two-tone brand base**: magenta-pink primary `#db2777` + sky-blue secondary
  `#0284c7`. Primary drives buttons, active nav, links, focus rings, selected
  rows. Secondary appears in secondary actions, information, and curriculum
  surfaces — so the app never reads as all-pink.
- **Sidebar / dark chrome**: deep plum `#4a0d3f`. Active nav = magenta
  `#db2777` pill with white text OR left 3px rail + `rgba(255,255,255,0.08)` tint.
- **Crayon status containers** (fill + ink pairs — use together, never tone-on-tone):
  - Pink `#fce7f3` / `#9d174d` — the "AI / insight" family
  - Sky `#e0f2fe` / `#075985` — information & curriculum (secondary)
  - Mint `#dcfce7` / `#14532d` — success, positive trends
  - Amber `#fef3c7` / `#78350f` — warnings, in-progress
  - Rose `#ffe4e6` / `#9f1239` — errors, at-risk
- **Crayon box** (charts & data-viz, always label directly):
  `#db2777, #0ea5e9, #f59e0b, #10b981, #8b5cf6, #f43f5e, #38bdf8, #f97316` —
  magenta, sky, sunshine, mint, violet, coral, light-sky, orange.
- **Never** use color alone when it is the only signal — add labels, icons, or
  value text.

## 3. Typography
- **Quicksand** for all headlines — the playful, rounded display face already
  loaded in the app (weights 400–700). Use 600/700, tight tracking.
- **Inter** for everything else: body copy, tables, inputs, labels, tabular
  numbers. Dense screens stay scannable.
- Hierarchy:
  - Page title: `36px/700` Quicksand.
  - Card title: `14px/600` Inter with a small gray kicker when needed.
  - Stat number: `22px/700` tabular; large hero numbers `32px/700`.
  - Body: `14px` default; `13px` secondary metadata; `12px` table subtitles.
- Metric numbers use `font-variant-numeric: tabular-nums` to avoid jitter.

## 4. Density & Layout System
- **Base grid**: 8px. Page gutter 24px, inter-card 16px, card padding 20px.
- **Content width**: max `1600px` centered.
- **Tables**: row height 44px (dense 40px), header 36px with `11px` uppercase
  gray labels, horizontal 1px dividers, hover wash `#f6f2ff`, numeric columns
  right-aligned with tabular nums.
- **Avatar**: `32px` circle with initial (magenta on `#fce7f3`), `44px` on profile
  heads.
- **Structure: lines & separators (anchor, don't float)**: structure comes from
  lines, not extra shadow. Every card carries a visible `1px` outline (`#d8b6c8`).
  Stacked lists use hairline `divide-y` dividers between rows; section headers get
  a `1px` bottom rule (header bar separated from body); connected stat rows use
  `divide-x` vertical separators instead of separate floating cards; tables always
  show clear row lines and a header rule. Borders and dividers share the same
  `#d8b6c8` line token so panels read as anchored, never floating.

## 5. Components
- **Card**: white, `rounded-2xl`, visible `1px` blush-pink outline (`#d8b6c8`) plus
  soft magenta-tinted elevation (`0 6px 18px rgba(219,39,119,0.08)`). Panels are
  anchored by their outline, not floating. Hover lifts 1px with a warmer shadow.
- **Button**: `rounded-xl`, height 40px, `700` weight. Primary = magenta-pink
  `#db2777`; secondary = sky blue `#0284c7`; outline = 1px blush-pink border;
  ghost for quiet actions.
- **Input / Select / Textarea**: `rounded-xl`, 1px blush-pink border, magenta focus
  ring (`#ec4899`, 2px + offset).
- **Sticker chip / StatusBadge**: pill-shaped (`rounded-full`), 11px uppercase
  label, crayon fill + ink pairs from §2. Never bordered — they read as
  stickers stuck on the page, not bordered tags.
- **Icon tile**: rounded-squircle (28px, `rounded-xl`), crayon-tinted bg + ink
  icon — the playful avatar of each stat card. Magenta for primary stats, sky
  for info, mint for positive, amber for in-progress, rose for at-risk.
- **Insight/AI card**: header (AI icon, "AI", title), 2–3 lines of analysis,
  soft gradient border-left `2px` magenta/amber, footer "Ask AI" affordance.
  Use hedged language: "Likely", "Trend suggests", "Review".
- **Callout / alert banner**: left 3px accent rail, crayon container bg, title +
  message + action.
- **Empty/Error**: centered 120px doodle-style glyph + 16px Quicksand title +
  13px Inter description + primary ghost action. Doodles are simple line
  drawings (book, pencil, magnifier) — hand-drawn warmth without animation.
- **Highlighter accent**: key headlines get a 2px warm underline
  (`rgba(245,158,11,0.35)`) — like a yellow highlighter stroke, sparingly.

## 6. Role surfaces
- **Dashboard**: playful stat cards with crayon icon tiles (squircle 28px,
  tinted bg), delta pill (▲/▼), mini sparkline; the "What to watch" AI
  narrative card in pink. Alternate icon-tile hues across the stat row so the
  board reads like a row of crayons.
- **People/roster**: two-pane master/detail. Identity card → key stats → grades
  by class → attendance drill → alerts → AI brief.
- **AI Assistant**: three-column (entity picker / conversation / composer),
  replies as rounded cards, structured payloads in bordered blocks.
- Every entity surface ends with an **"Ask AI" affordance**.

## 7. Charts & Data-viz
- Prefer SVG built-ins; 8px stroke; 12px labels; grey grid (no vertical lines).
- Crayon box colors from §2, drawn in series order. Line/area for trends, bar
  for comparisons, donut for parts-of-whole, radar for skill gaps. Include
  min/max value labels on line endpoints.
- Interactive tooltips with name + value + delta.

## 8. Navigation & Shell
- Sidebar groups: **Overview** (Dashboard, Insights), **People**, **Academic**,
  **Operations**. Active = magenta tint + primary text + 3px magenta rail.
- Topbar: breadcrumb/title left, search center, notification bell + avatar right.
- No clutter: hide secondary items behind "More".

## 9. Motion & Interactions
- 120–200ms ease transitions on hover/focus; playful micro-bounces for badges
  and confirmation states (scale 1.04 → 1 on success).
- Sparklines draw on mount (200ms). Card hover: lift 1px + shadow warm-up 0.2s.
- Respect `prefers-reduced-motion`.
