import type { Tone } from "../mockdata";

// One semantic color per tone, shared by badges, icons, bars and graph edges.
export const toneText: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-tertiary",
  error: "text-error",
  neutral: "text-on-surface-variant",
};

export const toneSoft: Record<Tone, string> = {
  primary: "bg-primary/10",
  success: "bg-success/15",
  warning: "bg-tertiary/15",
  error: "bg-error/15",
  neutral: "bg-surface-container-highest",
};

export const toneSolid: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-tertiary",
  error: "bg-error",
  neutral: "bg-outline",
};

/** For SVG strokes and fills, which can't take Tailwind classes. */
export const toneVar: Record<Tone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--tertiary)",
  error: "var(--error)",
  neutral: "var(--outline)",
};
