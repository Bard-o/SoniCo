---
name: SaaS Minimalist
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is engineered for high-utility software environments where clarity and speed of interaction are paramount. The brand personality is professional, logical, and unobtrusive, positioning the interface as a high-performance tool rather than a decorative experience. 

The aesthetic follows a **Modern Corporate Minimalism** approach. It prioritizes heavy functional whitespace and a restricted color palette to reduce cognitive load. Visual interest is generated through precise typographic scaling and purposeful alignment rather than illustrative elements. The goal is to evoke a sense of reliability and institutional trust, ensuring that the user's data remains the focal point of the application.

## Colors

The palette is anchored by "Professional Blue," a high-vibrancy primary used exclusively for action intent and brand presence. The background utilizes a crisp off-white to soften the starkness of pure white while maintaining a clean "SaaS" feel.

- **Primary (#2563EB):** Reserved for primary buttons, active states, and critical progress indicators.
- **Surface:** The main canvas is #F9FAFB, with pure white (#FFFFFF) used for elevated cards and input fields to create subtle layering.
- **Border (#E5E7EB):** A consistent light gray used for all structural divisions, ensuring sections are defined without breaking the visual flow.
- **Neutral:** A scale of grays from #111827 (titles) to #64748B (meta-data) handles all typographic hierarchy.

## Typography

This design system utilizes **Inter** for its exceptional readability in data-heavy interfaces. The typographic system relies on weight shifts (Regular 400, Medium 500, and Semi-Bold 600) rather than drastic size changes to establish hierarchy.

Large display type uses negative letter-spacing to appear tighter and more "engineered." Small labels and captions use increased letter-spacing and Medium/Semi-Bold weights to maintain legibility at reduced scales. Line heights are generous (1.5x for body) to ensure text-heavy pages remain airy and scannable.

## Layout & Spacing

The design system employs a **8px soft grid** to ensure mathematical harmony across all components. Layouts should follow a **12-column fluid grid** for main content areas, with a fixed max-width of 1280px for dashboard views to prevent line-lengths from becoming unreadable on ultrawide monitors.

Spacing is "airy," meaning margins between major sections should lean toward the larger end of the scale (40px+) to prevent the interface from feeling cramped. Padding within cards and containers should be consistent—typically 24px (lg)—to create a rhythm of "white space frames" around data.

## Elevation & Depth

Depth is achieved primarily through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows. 

1.  **Level 0 (Base):** The #F9FAFB background.
2.  **Level 1 (Card/Surface):** Pure #FFFFFF surfaces with a 1px solid #E5E7EB border. 
3.  **Level 2 (Interaction):** Subtle, diffused shadows are used only for floating elements like dropdowns, popovers, or modals. Use a 10% opacity neutral tint: `0px 4px 12px rgba(0, 0, 0, 0.05)`.

This approach keeps the UI feeling "flat" and modern, aligned with contemporary SaaS aesthetics where the structure is defined by lines rather than physical weight.

## Shapes

The shape language is **Soft**, utilizing a consistent 4px (0.25rem) corner radius for most functional elements like buttons and input fields. Larger containers like cards or modals may use 8px (0.5rem) to differentiate them from smaller components.

This slight roundness takes the edge off the "industrial" feel of the system without making it appear too consumer-focused or "bubbly." The precision of the 4px radius reinforces the grid-based, functional nature of the software.

## Components

- **Buttons:** Primary buttons use a solid #2563EB fill with white text. Secondary buttons use a #FFFFFF fill with a #E5E7EB border and #111827 text. Ghost buttons (no border/fill) are used for tertiary actions.
- **Input Fields:** Fields must have a 1px #E5E7EB border and #FFFFFF background. On focus, the border transitions to #2563EB with a 2px soft outer glow.
- **Chips/Badges:** Small, 2px rounded containers with a light gray background (#F3F4F6) and Medium weight text. Status badges use low-saturation tints (e.g., light green background for "Success").
- **Cards:** White backgrounds, 1px light gray borders, and 24px internal padding. No shadows unless the card is interactive/hoverable.
- **Lists:** Data rows should be separated by 1px horizontal lines (#E5E7EB). Hover states for rows should use a subtle #F9FAFB tint to provide immediate feedback.
- **Checkboxes & Radios:** Use the primary blue for checked states. Maintain a 1.5px border weight for the unchecked state to ensure visibility against the off-white background.