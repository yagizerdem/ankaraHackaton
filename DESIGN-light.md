---
name: Obsidian Knowledge Engine
colors:
  surface: "#faf8ff"
  surface-dim: "#d2d9f4"
  surface-bright: "#faf8ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f3ff"
  surface-container: "#eaedff"
  surface-container-high: "#e2e7ff"
  surface-container-highest: "#dae2fd"
  on-surface: "#131b2e"
  on-surface-variant: "#464554"
  inverse-surface: "#283044"
  inverse-on-surface: "#eef0ff"
  outline: "#767586"
  outline-variant: "#c7c4d7"
  surface-tint: "#494bd6"
  primary: "#4648d4"
  on-primary: "#ffffff"
  primary-container: "#6063ee"
  on-primary-container: "#fffbff"
  inverse-primary: "#c0c1ff"
  secondary: "#006c49"
  on-secondary: "#ffffff"
  secondary-container: "#6cf8bb"
  on-secondary-container: "#00714d"
  tertiary: "#825100"
  on-tertiary: "#ffffff"
  tertiary-container: "#a36700"
  on-tertiary-container: "#fffbff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#e1e0ff"
  primary-fixed-dim: "#c0c1ff"
  on-primary-fixed: "#07006c"
  on-primary-fixed-variant: "#2f2ebe"
  secondary-fixed: "#6ffbbe"
  secondary-fixed-dim: "#4edea3"
  on-secondary-fixed: "#002113"
  on-secondary-fixed-variant: "#005236"
  tertiary-fixed: "#ffddb8"
  tertiary-fixed-dim: "#ffb95f"
  on-tertiary-fixed: "#2a1700"
  on-tertiary-fixed-variant: "#653e00"
  background: "#faf8ff"
  on-background: "#131b2e"
  surface-variant: "#dae2fd"
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: "600"
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.04em
  mono-data:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-performance, academic-grade analytical environment for learning pathway visualization and mastery analytics. Tailored for researchers, technical learners, and engineering students navigating complex curriculum graphs, the aesthetic combines clean light-mode utility with surgical data density.

The design language balances modern corporate precision with subtle glassmorphism and technical instrumentation. Visual feedback prioritizes immediate cognitive comfort through crisp light-mode surfaces, high-contrast typography, and vivid semantic signal indicators (mastery, review, and blocker states) that bring structural clarity to dense academic knowledge graphs.

## Colors

The color architecture utilizes a structured hierarchy optimized for low-fatigue, high-duration analytical sessions:

- **Primary (`#6366F1`):** Electric Indigo acts as the focal accent for primary actions, active node selections, navigational anchors, and graph traversal highlights.
- **Secondary / Success (`#10B981`):** Vivid Emerald indicates topic mastery, verified competencies, and completed prerequisite paths.
- **Tertiary / Warning (`#F59E0B`):** Warm Amber denotes active progress, spaced repetition intervals due, and topics flagged for immediate review.
- **Critical / Deficit (`#F43F5E`):** Coral Red serves as the diagnostic indicator for knowledge gaps, unmet prerequisite bottlenecks, and critical assessment drop-offs.
- **Base Surfaces (`#F8FAFC` to `#E2E8F0`):** Multi-tiered slate and neutral surfaces anchor the light environment without pure-white glare, retaining perceptual depth across containers.

## Typography

Typography is configured for academic rigor, precision telemetry, and dense metric arrays. Inter is deployed across display, body, and micro-label tiers to maintain consistent vertical rhythm and character structure.

- Headings utilize tighter tracking (`-0.02em` to `-0.01em`) to create compact visual lockups that conserve vertical screen real estate.
- Small data displays and code-adjacent properties utilize tabular numbers (`font-variant-numeric: tabular-nums`) within the body scale to ensure column alignment in telemetry views.
- Micro-labels (`label-sm`) default to uppercase with widened letter spacing (`+0.04em`) when applied to category headers, node badges, or status counters.

## Layout & Spacing

The layout architecture utilizes an analytical fluid grid with fixed outer gutters and strict internal constraints.

- **Desktop Layout:** Standardizes on a 12-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) page margins. Canvas zones for knowledge graphs stretch infinitely within viewport boundaries, flanked by collapsible analytic sidebars (standardized at 320px width).
- **Responsive Adaptations:**
  - On viewports below 1024px, the dual-column layout collapses to a modular stacked canvas where graph controls dock into an overlay bottom sheet.
  - Margins contract to 16px (`1rem`) on mobile, while component spacing drops down by one tier (`space-lg` scales to `space-md`).
- **Internal Density:** Internal component padding prioritizes high-density data matrices: table cells, metric tiles, and inspection panels default to `space-sm` (8px) and `space-md` (16px) bounding paddings.

## Elevation & Depth

Depth in the light interface is achieved through surface luminance shifts, crisp borders, and subtle translucent backing rather than heavy drop shadows:

- **Surface Tiers:**
  - Base Canvas: Solid light slate backdrop (`#F8FAFC`).
  - Surface Mid: `#FFFFFF` at 85% opacity with an 8px backdrop blur for floating inspect panels, navigation chrome, and detached overlays.
  - Surface High: `#F1F5F9` for hover overlays, tooltips, and interactive card states.
- **Low-Contrast Outlines:** Every container utilizes a hairline border (`1px solid rgba(15, 23, 42, 0.08)`) to preserve component definition against light-luminance backdrops.
- **Ambient Illumination:** Active nodes, interactive edges, and status chips apply a low-spread glow using their respective semantic tokens (e.g., `0 0 12px rgba(99, 102, 241, 0.15)` for primary focus targets).

## Shapes

The design system applies a balanced 8px (`0.5rem`) base corner radius across all standard interactive elements and containers.

- Standard buttons, input fields, and telemetry badges employ the baseline radius (8px / `0.5rem`).
- Large analytical panels, modal overlays, and visual graph containers scale to `rounded-xl` (24px / `1.5rem`) to create smooth visual envelopes around technical data.
- Knowledge graph nodes leverage distinct geometric profiles: circular anchors (full pill/round) designate pivotal parent concepts, while rounded rectangles (8px) encapsulate individual competency leaves.

## Components

- **Buttons:**
  - _Primary:_ Filled with `#6366F1`, white text (`Inter`, `label-md`), 8px border radius, with a subtle 1px border (`rgba(0, 0, 0, 0.1)`). Hover elevates luminance to `#4F46E5`.
  - _Secondary / Outline:_ Translucent slate fill (`rgba(241, 245, 249, 0.8)`), bordered with `rgba(15, 23, 42, 0.12)`, text in high-contrast neutral (`#0F172A`).
  - _Status Action:_ Semantic low-saturation tint backgrounds paired with dark text (e.g., `#10B981` tint for "Mark as Mastered").

- **Cards & Diagnostic Containers:**
  - Built with `rounded-xl` geometry (24px), glassmorphic backdrop filter (`12px blur`), and a light base (`rgba(255, 255, 255, 0.85)`).
  - Divided internally with `1px rgba(15, 23, 42, 0.06)` dividers.
  - Padding follows strict 16px (`space-md`) to 24px (`space-lg`) steps.

- **Chips & Node Status Indicators:**
  - Compact height (24px), 4px or 8px corner radii, `label-sm` font with tabular metrics.
  - Semantic variants:
    - _Mastered:_ `#10B981` background at 12% opacity, `#047857` text, solid 1px border at 25% emerald opacity.
    - _In Progress / Review:_ `#F59E0B` background at 12% opacity, `#B45309` text, solid 1px border at 25% amber opacity.
    - _Bottleneck / Gap:_ `#F43F5E` background at 12% opacity, `#BE123C` text, solid 1px border at 25% coral opacity.

- **Input Fields:**
  - Inset fields using `#FFFFFF` background, `1px solid rgba(15, 23, 42, 0.15)` border, 8px border radius.
  - Active/Focused state: Shifts border color directly to `#6366F1` with an inner ring shadow of `0 0 0 1px #6366F1`.

- **Checkboxes & Radios:**
  - Square (8px radius) and circular controls built on a light slate canvas.
  - Checked state displays filled Electric Indigo with a clean white vector glyph; hover adds a diffused primary glow.

- **Graph Telemetry Panels & Node Tooltips:**
  - Specialized diagnostic overlays anchored directly to graph nodes.
  - High-density layout displaying prerequisites, estimated time-to-mastery, spaced repetition health bars, and direct remediation action triggers.
