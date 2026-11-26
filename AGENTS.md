## Web UI Design Rules

These rules apply to any task that creates or changes UI: pages, components, layouts, styles, themes, icons, animations, or copy shown to users.

### 1. Read before you build (mandatory)

Before writing or editing any UI code, read these files in full. Do not skip them for small changes.

1. **Design system**
   - `DESIGN-light.md`: light theme tokens, palette, type scale, spacing, components.
   - `DESIGN-dark.md`: dark theme equivalents.
2. **UI skills.** Each skill's `SKILL.md` lives in both `.claude/skills/` and `.agents/skills/`. Read whichever copy exists.
   - `frontend-design`: visual quality, layout, typography, and avoiding generic "AI-looking" UI.
   - `web-design-guidelines`: accessibility, interaction, and UX checklist.
   - `vercel-react-best-practices`: React/Next.js performance and correctness.
   - `vercel-composition-patterns`: component API and composition structure.
   - `vercel-react-view-transitions`: read this when the task involves page or theme transitions and animation.
   - `writing-guidelines`: read this when the task adds or changes user-facing text.

If a skill's instructions conflict with the DESIGN files, **the DESIGN files win.** They are this project's source of truth.

### 2. Design system compliance

- Use only the colors, fonts, type sizes, radii, shadows, and spacing defined in the DESIGN files. Use them through the existing theme tokens (CSS variables / Tailwind theme). Never hard-code hex values or arbitrary pixel sizes.
- Every screen must work in **both light and dark themes**. Check both before you finish.
- Before creating a new component, reuse the existing ones in `src/components/` (and `ui/` primitives). Match the patterns already used in the codebase.
- If something you need is missing from the design system (a token, a state, a component), don't invent one silently. Pick the closest existing option and mention the gap in your summary.

### 3. Quality bar

- **Responsive:** layouts work from 360px mobile up to wide desktop, with no horizontal scroll.
- **Accessible:** use semantic HTML, label every interactive element, support keyboard navigation with a visible focus ring, and meet WCAG AA contrast in both themes.
- **States:** handle loading, empty, error, disabled, hover, and active states. Don't build only the happy path.
- **Motion:** keep it subtle and purposeful, and respect `prefers-reduced-motion`.
- **Language:** user-facing text stays in the language the page already uses, with a consistent tone.

### 4. Before finishing

- Run the type check / lint and fix any errors you introduced.
- Briefly list which DESIGN rules and skills shaped the change, plus any deviations or gaps you found.

## Adding new imports to files

These rules apply to every `.ts` and `.tsx` file in the project.

- **Always use the path alias.** `@/*` maps to `./src/*` (see `tsconfig.json`). Import anything under `src/` with `@/`, never with a relative path.

  ```ts
  // ✅ Correct
  import { Button } from "@/components/ui/button";
  import { cn } from "@/lib/utils";

  // ❌ Wrong
  import { Button } from "../../components/ui/button";
  import { cn } from "./utils";
  ```

- This applies to same-folder imports too: use `@/app/student-panel/components/...` instead of `./...`.
- Don't add new aliases or change `paths` in `tsconfig.json` without asking first.
- When you edit a file that still uses relative imports, convert the imports in the lines you touch to `@/`.
- **Import order:** external packages (`react`, `next`, libraries) first, then `@/` imports, then type-only imports (`import type`). Separate the groups with a blank line.
- Remove unused imports. Don't leave broken imports behind: run the type check after you change any.
