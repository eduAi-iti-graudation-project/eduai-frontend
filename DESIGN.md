---
name: EduAI Institutional Command Center
colors:
  surface: '#faf9ff'
  surface-dim: '#d5d9ea'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edfe'
  surface-container-high: '#e4e8f8'
  surface-container-highest: '#dee2f3'
  on-surface: '#161b27'
  on-surface-variant: '#434752'
  inverse-surface: '#2b303d'
  inverse-on-surface: '#edf0ff'
  outline: '#737783'
  outline-variant: '#c3c6d3'
  surface-tint: '#285cb0'
  primary: '#004699'
  on-primary: '#ffffff'
  primary-container: '#2c5fb3'
  on-primary-container: '#d0ddff'
  inverse-primary: '#adc6ff'
  secondary: '#595d75'
  on-secondary: '#ffffff'
  secondary-container: '#dde1fd'
  on-secondary-container: '#5f637b'
  success: '#15803d'
  on-success: '#ffffff'
  success-container: '#dcfce7'
  on-success-container: '#14532d'
  warning: '#b45309'
  on-warning: '#ffffff'
  warning-container: '#fef3c7'
  on-warning-container: '#78350f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#dde1fd'
  secondary-fixed-dim: '#c1c5e0'
  on-secondary-fixed: '#161a2f'
  on-secondary-fixed-variant: '#41465c'
  background: '#faf9ff'
  on-background: '#161b27'
  surface-variant: '#dee2f3'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-xs:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  number-md:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  number-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
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
  sidebar-bg: '#151a2e'
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
  sm: 0.1875rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.75rem
  full: 9999px
elevation:
  card: '0 1px 2px rgba(22,27,39,0.04)'
  hover: '0 2px 6px rgba(22,27,39,0.06)'
  floating: '0 4px 16px rgba(22,27,39,0.10)'
---

# EduAI Institutional Command Center — Design System (Admin)

A **high-density institutional command center** for administrators. The aesthetic is
"modern institutional intelligence": calm enterprise-grade surfaces, near-grayscale
neutral foundation, restrained navy accent, and extremely high information density
without clutter. A senior admin must be able to scan 40+ data rows per screen, read
a metric trend at a glance, and trust every number.

## 1. Brand & Mood
- **Scale & Sentiment**: precise, calm, authoritative. Zero decorative flourish.
  Data is the hero; chrome is invisible.
- **Reference energy**: modern school-ops dashboards, Bloomberg-terminal density
  with Figma-level polish. Think "PowerSchool 2026" not "consumer fintech".
- **Persona**: the person behind the screen is a principal or academic operations
  lead who reviews the school daily. They are decision-makers, not end-users.

## 2. Color Strategy
- **Foundation**: near-white `#faf9ff` app background with pure-white card panels
  separated by `1px` outlines (`#dee2f3`), rarely shadow.
- **Sidebar**: deep navy `#151a2e` (fixed 256px). Active nav item = `#2c5fb3` pill
  with white text OR left 3px indicator + `rgba(255,255,255,0.06)` tint.
- **Accent**: `#2c5fb3` navy reserved ONLY for interactive affordances: primary
  buttons, active nav, links, focus rings, selected rows, small trend sparklines.
- **Semantic sets** (use alone, never tone-on-tone unless container-filled):
  - Success `#15803d` on `#dcfce7` (or plain text w/ delta ▲)
  - Warning `#b45309` on `#fef3c7`
  - Danger `#ba1a1a` on `#ffdad6`
  - Info/Neutral `#595d75` on `#dde1fd`
- **Data-viz palette** (charts): `#2c5fb3, #7c4dff, #0ea5e9, #f59e0b, #ef4444, #22c55e, #64748b` — 8 grades, always label directly.
- **Never** use color alone to convey meaning when it is the only signal (add
  labels, icons, or value text).

## 3. Typography
- **Hanken Grotesk** everywhere. Mono variant `JetBrains Mono` for IDs, join codes.
- Hierarchy for dense dashboards:
  - Page title: `32px/700` (never dupe a redundant "page header" label).
  - Card title: `14px/600` with a small gray kicker when needed.
  - Stat number: `22px/700` tabular; large hero numbers `32px/700`.
  - Body: `14px` default; `13px` for secondary metadata; `12px` for
    table subtitles, chips, footer meta.
- **Tabular-numeric**: metric numbers should be `font-variant-numeric: tabular-nums`
  to avoid jitter in live data.
- Line height tight: `1.43` body, `1.3` headings. Keep the "dense but legible".

## 4. Density & Layout System
- **Base grid**: 8px. Everything is a multiple of 4px, ideally 8px. Page gutter 24px,
  inter-card 16px. Card internal padding 20px.
- **Content width**: max `1600px` centered; the admin shell stretches further than
  other roles deliberately for tables & charts.
- **Scannable cards**: every data card gets a compact header row (title + one
  right-aligned action) with a `1px` bottom divider when content is long.
- **Tables** (the workhorse of admin):
  - Row height 44px (dense 40px); header 36px, `11px` uppercase gray labels.
  - No zebra stripes; horizontal 1px dividers `#eceef5`.
  - Hover row: `#f6f8ff` wash, no border jump.
  - Numeric columns right-aligned with tabular nums.
- **Avatar**: `32px` circle w/ initial (navy on `#e9edfe`), `20px` when inline in
  tight lists, `44px` on profile heads. Provide colored "math-of-name" initials.

## 5. Components
- **StatCard (precision variant)**: icon chip (square, 28px, tinted bg) + label
  (12px gray) + value (28px 700) + **delta pill** (▲/▼ + % text) + optional
  **mini sparkline** (40x24 inline SVG) in card footer. Never stack value + delta
  in the same color as primary.
- **Delta chip**: 10.5px uppercase, colored pair (green up, red down, gray flat),
  borderless, `font-weight 500`, padding 2px 6px, radius 6px.
- **Search / Command**: global search at topbar right (280px), `Search` glyph,
  shortcut hint chip `⌘K`. Entity search filters typed results inline.
- **Entity/profile row**: avatar + two-line (name 600 / sub meta 12px gray),
  right-side trailing value, chevron only when navigable.
- **Insight/AI card**: top header (AI icon, "AI", title), body 2-3 lines of
  analysis narrative with soft gradient border-left `2px gold/indigo`, footer
  "Ask AI" affordance. Never pretend deterministic certainty—use "Likely",
  "Trend suggests", "Review".
- **Callout / alert banner**: left 3px accent rail, tinted container bg, title +
  message + action button right-aligned. Tint = severity semantics above.
- **StatusChip**: 4px radius, no border, 11px label uppercase. Use the
  semantic tint pairs in §2.
- **Tag filter row**: segmented chips (All | Students | Teachers | Classes) 32px
  height, active = `#2c5fb3` text + `#eef3fc` bg underline, inactive gray.
- **Empty/Error**: centered 120px glyph + 16px title + 13px description +
  primary ghost action button.

## 6. Admin-specific personas (screen patterns)
- **Command Center (Dashboard)** is the *decision* surface: 6 StatCards w/ delta +
  sparkline, 2-3 trend charts, an at-risk/flagged ranked list (max 6 rows),
  and a 1-column "What to watch" AI narrative. It must answer "what changed
  today/week" in one glance.
- **People/Roster**: always a two-pane master/detail. List pane `320–360px`
  (search + compact rows), detail pane rich-profile with stacked sections:
  identity card → key stats → grades by class → attendance drill → alerts →
  AI brief. Never a bare name+email.
- **Directory of roles (Teachers/Faculty)**: card grid with avatar init 8-bit,
  name, dept/grade scope, class count, avg class grade honor, flagged indicator.
- **AI Assistant**: full-height three-column (entity picker list / conversation /
  sticky composer). Replies render as Markdown-ish cards; square encloses
  structured payloads (analytics) inside an indented bordered block.
- Every entity surface ends with an **"Ask AI" affordance** (auto-fill that
  entity into the assistant context).

## 7. Charts & Data-viz
- Prefer SVG built-ins; consistent 8px stroke; 12px labels; grey-grid (no
  vertical grid lines).
- Line/area for trends; bar for comparisons; donut only when parts-of-whole
  matter (attendance status breakdown); radar for skill-gap profiles.
- Include explicit `min/max` value labels on any line endpoint to kill guesswork.
- Interactive tooltips (hover) with name + value + delta.

## 8. Navigation & Shell
- Sidebar section groups: **Overview** (Dashboard, Insights), **People** (Students,
  Teachers), **Academic** (Grades, Attendance, Alerts), **Operations** (Requests,
  Billing).
- Active item: `#2c5fb3` tinted `#eff3fc` bg + primary text + 3px navy rail.
- Topbar: breadcrumb/title left, search center (⌘K), notification bell + avatar
  right. System status = subtle `[· Live data]` chip.
- No clutter: hide secondary nav items behind "More".

## 9. Motion & Interactions
- 120–180ms ease transitions on hover/focus only. No entrance animations for
  full-screen chrome; micro-only.
- Sparklines draw on mount (200ms). Chart hover shows crosshair + tooltip.
- Row hover: 120ms bg wash; card hover: `1px darken` + slight translate-y 1px +
  0.2s. Respect `prefers-reduced-motion`.