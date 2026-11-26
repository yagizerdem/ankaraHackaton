import type * as z from "zod";
import type { FromErrors } from "@/error/app-error";

export { cn } from "cn";

export function zodErrorToFromErrors(
  error: z.ZodError,
  rootKey = "body",
): FromErrors {
  const fromErrors: FromErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || rootKey;
    fromErrors[field] ??= issue.message;
  }
  return fromErrors;
}

interface CameraFlashOptions {
  duration?: number;
  color?: string;
  intensity?: number;
}

export function cameraFlashEffect({
  duration = 700,
  color = "#fff",
  intensity = 1,
}: CameraFlashOptions = {}): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const peak = reduceMotion ? Math.min(intensity, 0.35) : intensity;

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    pointerEvents: "none",
    background: `radial-gradient(circle at center, ${color} 0%, ${color} 55%, color-mix(in srgb, ${color} 80%, transparent) 100%)`,
    opacity: "0",
  });
  document.body.appendChild(overlay);

  const animation = overlay.animate(
    [
      { opacity: 0 },
      { opacity: peak, offset: 0.06 },
      { opacity: peak, offset: 0.14 },
      { opacity: 0 },
    ],
    { duration, easing: "cubic-bezier(0.2, 0, 0.3, 1)" },
  );

  return animation.finished.catch(() => {}).then(() => overlay.remove());
}
