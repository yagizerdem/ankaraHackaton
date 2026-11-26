---
name: Obsidian Knowledge Engine
colors:
  surface: "#0b1326"
  surface-dim: "#0b1326"
  surface-bright: "#31394d"
  surface-container-lowest: "#060e20"
  surface-container-low: "#131b2e"
  surface-container: "#171f33"
  surface-container-high: "#222a3d"
  surface-container-highest: "#2d3449"
  on-surface: "#dae2fd"
  on-surface-variant: "#c7c4d7"
  inverse-surface: "#dae2fd"
  inverse-on-surface: "#283044"
  outline: "#908fa0"
  outline-variant: "#464554"
  surface-tint: "#c0c1ff"
  primary: "#c0c1ff"
  on-primary: "#1000a9"
  primary-container: "#8083ff"
  on-primary-container: "#0d0096"
  inverse-primary: "#494bd6"
  secondary: "#4edea3"
  on-secondary: "#003824"
  secondary-container: "#00a572"
  on-secondary-container: "#00311f"
  tertiary: "#ffb95f"
  on-tertiary: "#472a00"
  tertiary-container: "#ca8100"
  on-tertiary-container: "#3e2400"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
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
  background: "#0b1326"
  on-background: "#dae2fd"
  surface-variant: "#2d3449"
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

The design system establishes a high-performance, academic-grade analytical environment for learning pathway visualization and mastery analytics. Tailored for researchers, technical learners, and engineering students navigating complex curriculum graphs, the aesthetic combines deep dark-mode utility with surgical data density.

The design language balances modern corporate precision with subtle glassmorphism and technical instrumentation. Visual feedback prioritizes immediate cognitive comfort through low-glare obsidian surfaces, high-contrast typography, and vivid semantic signal indicators (mastery, review, and blocker states) that bring structural clarity to dense academic knowledge graphs.

## Colors

The color architecture utilizes a structured hierarchy optimized for low-fatigue, high-duration analytical sessions:

- **Primary (`#6366F1`):** Electric Indigo acts as the focal accent for primary actions, active node selections, navigational anchors, and graph traversal highlights.
- **Secondary / Success (`#10B981`):** Vivid Emerald indicates topic mastery, verified competencies, and completed prerequisite paths.
- **Tertiary / Warning (`#F59E0B`):** Warm Amber denotes active progress, spaced repetition intervals due, and topics flagged for immediate review.
- **Critical / Deficit (`#F43F5E`):** Coral Red serves as the diagnostic indicator for knowledge gaps, unmet prerequisite bottlenecks, and critical assessment drop-offs.
- **Base Surfaces (`#0B0F19` to `#1E293B`):** Multi-tiered slate and obsidian neutrals anchor the dark environment without pure-black clipping, retaining perceptual depth across containers.

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

Depth in the dark interface is achieved through surface luminance shifts, crisp borders, and subtle translucent backing rather than heavy drop shadows:

- **Surface Tiers:**
  - Base Canvas: Solid `#0B0F19` deep obsidian backdrop.
  - Surface Mid: `#111827` at 85% opacity with an 8px backdrop blur for floating inspect panels, navigation chrome, and detached overlays.
  - Surface High: `#1E293B` for hover overlays, tooltips, and interactive card states.
- **Low-Contrast Outlines:** Every container utilizes a hairline border (`1px solid rgba(255, 255, 255, 0.08)`) to preserve component definition against low-luminance backdrops.
- **Ambient Illumination:** Active nodes, interactive edges, and status chips apply a low-spread glow using their respective semantic tokens (e.g., `0 0 12px rgba(99, 102, 241, 0.25)` for primary focus targets).

## Shapes

The design system applies a balanced 8px (`0.5rem`) base corner radius across all standard interactive elements and containers.

- Standard buttons, input fields, and telemetry badges employ the baseline radius (8px / `0.5rem`).
- Large analytical panels, modal overlays, and visual graph containers scale to `rounded-xl` (24px / `1.5rem`) to create smooth visual envelopes around technical data.
- Knowledge graph nodes leverage distinct geometric profiles: circular anchors (full pill/round) designate pivotal parent concepts, while rounded rectangles (8px) encapsulate individual competency leaves.

## Components

- **Buttons:**
  - _Primary:_ Filled with `#6366F1`, white text (`Inter`, `label-md`), 8px border radius, with a subtle 1px border (`rgba(255, 255, 255, 0.15)`). Hover elevates luminance to `#4F46E5`.
  - _Secondary / Outline:_ Translucent slate fill (`rgba(30, 41, 59, 0.5)`), bordered with `rgba(255, 255, 255, 0.12)`, text in high-contrast neutral (`#F8FAFC`).
  - _Status Action:_ Semantic low-saturation tint backgrounds paired with bright text (e.g., `#10B981` tint for "Mark as Mastered").

- **Cards & Diagnostic Containers:**
  - Built with `rounded-xl` geometry (24px), glassmorphic backdrop filter (`12px blur`), and a dark base (`rgba(17, 24, 39, 0.7)`).
  - Divided internally with `1px rgba(255, 255, 255, 0.06)` dividers.
  - Padding follows strict 16px (`space-md`) to 24px (`space-lg`) steps.

- **Chips & Node Status Indicators:**
  - Compact height (24px), 4px or 8px corner radii, `label-sm` font with tabular metrics.
  - Semantic variants:
    - _Mastered:_ `#10B981` background at 15% opacity, `#34D399` text, solid 1px border at 30% emerald opacity.
    - _In Progress / Review:_ `#F59E0B` background at 15% opacity, `#FBBF24` text, solid 1px border at 30% amber opacity.
    - _Bottleneck / Gap:_ `#F43F5E` background at 15% opacity, `#FB7185` text, solid 1px border at 30% coral opacity.

- **Input Fields:**
  - Inset fields using `#0B0F19` background, `1px solid rgba(255, 255, 255, 0.1)` border, 8px border radius.
  - Active/Focused state: Shifts border color directly to `#6366F1` with an inner ring shadow of `0 0 0 1px #6366F1`.

- **Checkboxes & Radios:**
  - Square (8px radius) and circular controls built on a dark slate canvas.
  - Checked state displays filled Electric Indigo with a clean white vector glyph; hover adds a diffused primary glow.

- **Graph Telemetry Panels & Node Tooltips:**
  - Specialized diagnostic overlays anchored directly to graph nodes.
  - High-density layout displaying prerequisites, estimated time-to-mastery, spaced repetition health bars, and direct remediation action triggers.
