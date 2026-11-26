"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteExam } from "@/app/student-panel/custom-exams/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// The dialog portals out of the panel layout, so it needs the font itself.
const inter = Inter({ subsets: ["latin", "latin-ext"] });

interface DeleteExamButtonProps {
  examId: string;
  title: string;
  /** Where to go afterwards; refreshes the current page when left out. */
  redirectTo?: string;
}

/** Trash button that asks for confirmation, then deletes the exam. */
export function DeleteExamButton({ examId, title, redirectTo }: DeleteExamButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    setPending(true);
    const response = await deleteExam(examId);
    setPending(false);

    if (!response.isSuccess) {
      toast.error(response.message ?? "Couldn't delete the exam");
      return;
    }

    setOpen(false);
    toast.success(`Deleted ${title}`);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${title}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-label-md text-error transition-colors outline-none hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error"
      >
        <Trash2Icon aria-hidden className="size-4" />
        Delete
      </button>

      <AlertDialog
        open={open}
        // Keep the dialog up while the request runs.
        onOpenChange={(next) => !pending && setOpen(next)}
      >
        <AlertDialogContent className={cn(inter.className)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the exam and its answer key. The document stays.
              You can&apos;t undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending ? "Deleting..." : "Delete exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
