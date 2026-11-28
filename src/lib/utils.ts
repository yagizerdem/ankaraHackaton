import { createCn } from "cn/config";

import { AppError } from "@/error/app-error";
import HttpStatusCode from "@/lib/http-status-code";

import type * as z from "zod";
import type { FormErrors } from "@/error/app-error";

// The Stitch type scale in globals.css adds text-* font sizes that the merger
// would otherwise read as colors and drop next to text-primary and friends.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-xl",
            "headline-xl-mobile",
            "headline-lg",
            "headline-lg-mobile",
            "headline-md",
            "title-md",
            "body-lg",
            "body-md",
            "body-sm",
            "label-md",
            "label-sm",
            "mono-data",
          ],
        },
      ],
    },
  },
});

export function zodErrorToFromErrors(
  error: z.ZodError,
  rootKey = "body",
): FormErrors {
  const fromErrors: FormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || rootKey;
    fromErrors[field] ??= issue.message;
  }
  return fromErrors;
}

export async function getJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Expected a JSON body", HttpStatusCode.BAD_REQUEST);
  }
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
