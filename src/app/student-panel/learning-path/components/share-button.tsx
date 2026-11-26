"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { CheckIcon, CopyIcon, LoaderCircleIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { createShareLink } from "@/app/student-panel/learning-path/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// The dialog portals out of the panel layout, so it needs the font itself.
const inter = Inter({ subsets: ["latin", "latin-ext"] });

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** Creates a read-only report link the student can send to their teacher. */
export function ShareButton({ graphId }: { graphId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setPending(true);
    const response = await createShareLink(graphId);
    setPending(false);
    if (!response.isSuccess || !response.data) {
      toast.error(response.message ?? "Couldn't create the link");
      return;
    }
    setLink({
      url: `${window.location.origin}/student-panel/analytics/shared/${response.data.token}`,
      expiresAt: response.data.expiresAt,
    });
    setCopied(false);
    setOpen(true);
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy; select the link and copy it");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={create}
        disabled={pending}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? (
          <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Share2Icon aria-hidden className="size-4" />
        )}
        Show my teacher
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(inter.className, "sm:max-w-md")}>
          <DialogHeader>
            <DialogTitle>Share with your teacher</DialogTitle>
            <DialogDescription>
              Anyone with this link can see a read-only report of this
              document: mastery, route, confidence and common mistakes. It
              doesn&apos;t give access to your account.
            </DialogDescription>
          </DialogHeader>
          {link && (
            <div className="flex flex-col gap-2">
              <label htmlFor="share-url" className="text-label-md text-on-surface">
                Report link
              </label>
              <div className="flex gap-2">
                <input
                  id="share-url"
                  readOnly
                  value={link.url}
                  onFocus={(event) => event.target.select()}
                  className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {copied ? (
                    <CheckIcon aria-hidden className="size-4" />
                  ) : (
                    <CopyIcon aria-hidden className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Works until {dateFormat.format(new Date(link.expiresAt))}.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
