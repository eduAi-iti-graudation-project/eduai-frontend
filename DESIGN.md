---
name: SugarScript Learning
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#544249'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#87717a'
  outline-variant: '#dac0c9'
  surface-tint: '#a43073'
  primary: '#a43073'
  on-primary: '#ffffff'
  primary-container: '#f472b6'
  on-primary-container: '#6d0047'
  inverse-primary: '#ffafd3'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#40c2fd'
  on-secondary-container: '#004d6a'
  tertiary: '#006c4b'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b580'
  on-tertiary-container: '#003f2a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd8e7'
  primary-fixed-dim: '#ffafd3'
  on-primary-fixed: '#3d0026'
  on-primary-fixed-variant: '#85145a'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is built on a foundation of **Creative Pastel** aesthetics, specifically tailored to evoke an encouraging, kind, and creative emotional response. The personality is optimistic and playful, reducing the friction of learning through a gentle visual language.

The style blends **Minimalism** with **Tactile** elements. It prioritizes heavy whitespace and a restricted, soft palette to maintain focus, while using "squishy" pill-shaped elements and soft, organic depth to make the interface feel approachable and physically friendly. It avoids sharp edges and aggressive transitions in favor of a fluid, safe-feeling environment.

## Colors

The color palette is designed to be soothing yet vibrant enough to maintain engagement. 

- **Primary (Soft Pink):** Used for main actions, progress indicators, and celebratory moments. It represents the "heart" of the learning experience.
- **Secondary (Sky Blue):** Used for informational accents, secondary navigation, and calm interactions.
- **Tertiary (Mint Green):** Reserved for success states, "correct" feedback, and growth-related metaphors.
- **Neutral (Off-White):** A soft `#FDFCFB` background replaces pure white to reduce eye strain and provide a warmer, "paper-like" feel for the pastel elements to sit upon.

Text should primarily use a deep charcoal gray rather than pure black to maintain the gentle contrast levels of the system.

## Typography

This design system uses **Quicksand** exclusively across all levels to reinforce the rounded, friendly personality. 

- **Headlines:** Use heavier weights (Bold/SemiBold) with slightly tighter letter spacing to create a sense of "gravity" and playfulness.
- **Body Text:** Set at Medium weight. Quicksand's naturally large x-height ensures legibility even at smaller sizes, but we prioritize generous line heights (1.5x or greater) to keep the layout feeling airy.
- **Mobile Scaling:** Large display titles scale down aggressively on mobile to prevent awkward line breaks, ensuring the "softness" of the layout is preserved on small screens.

## Layout & Spacing

The layout follows a **fluid grid** model with a "bubbly" spacing rhythm. Elements are spaced generously to avoid a cluttered or "taxing" look.

- **Grid:** A 12-column system is used for desktop, 6 for tablet, and 2 for mobile. 
- **Rhythm:** Spacing follows an 8px base unit. Internal padding within cards and containers should lean toward the larger end (e.g., 32px or 40px) to maintain the airy, low-density aesthetic.
- **Safe Areas:** Large outer margins ensure the content feels centered and important, like a focused workspace or an open book.

## Elevation & Depth

This design system uses **Ambient Shadows** and **Tonal Layers** to create a soft, tactile feel.

- **Shadows:** Avoid harsh, black shadows. Use extremely diffused, high-blur shadows tinted with a hint of the primary or secondary color (e.g., a soft pink-tinted shadow for a pink button). This creates a "glow" effect rather than a traditional drop shadow.
- **Layers:** Use subtle shifts in background color (e.g., from Off-White to a very light Sky Blue) to define different sections without the need for hard lines.
- **Interaction:** On hover or active states, elements should appear to "squish" (slight scale down) or "float" higher (increased shadow blur and spread).

## Shapes

The shape language is fundamentally **Pill-shaped** and **Organic**.

- **Small Elements:** Buttons, chips, and tags must use full 999px (pill) rounding.
- **Large Elements:** Cards and containers use a consistent `rounded-xl` setting (24px to 32px) to ensure they feel soft but structured.
- **Organic Accents:** Use "blob" shapes as background decorations. These should be asymmetrical and hand-drawn in appearance, utilizing the pastel palette at 10-20% opacity.

## Components

- **Buttons:** Large, pill-shaped, and bouncy. Primary buttons use Soft Pink with white text. Secondary buttons use a thick 2px Sky Blue border with Sky Blue text.
- **Cards:** 24px corner radius, white background, and a soft primary-tinted ambient shadow. No borders.
- **Input Fields:** Pill-shaped with a soft Sky Blue border that thickens slightly on focus. Placeholder text is a light gray-blue.
- **Chips/Badges:** Full pill rounding. Use Tertiary (Mint Green) for progress-related badges or "lesson complete" indicators.
- **Lists:** Items are housed in individual soft-cornered containers rather than a single list with dividers. Each item should feel like its own "module."
- **Progress Bars:** Thick (12px height), fully rounded tracks. The unfilled portion should be a very pale version of the filled color, never gray.
- **Checkboxes/Radios:** Oversized and circular. When selected, they should "pop" with a scale-up animation and fill with the Primary color.