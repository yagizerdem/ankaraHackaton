import { redirect, RedirectType } from "next/navigation";

interface NavigateProps {
  href: string;
  /** "replace" (default) keeps the redirecting route out of browser history. */
  type?: "push" | "replace";
}

/**
 * Redirects to `href` while rendering, so a route can forward to another one
 * declaratively. Runs on the server, so there is no flash of empty content.
 */
export function Navigate({ href, type = "replace" }: NavigateProps): never {
  redirect(href, type === "push" ? RedirectType.push : RedirectType.replace);
}
