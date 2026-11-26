"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

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
import { useUpload } from "@/providers/upload-provider";

// The dialog portals out of the panel layout, so it needs the font itself.
const inter = Inter({ subsets: ["latin", "latin-ext"] });

interface DeleteDocumentButtonProps {
  documentId: string;
  documentName: string;
}

/** Trash button that asks for confirmation, then deletes the document. */
export function DeleteDocumentButton({
  documentId,
  documentName,
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const { deleteDocument } = useUpload();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    setPending(true);
    const response = await deleteDocument(documentId);
    setPending(false);

    if (!response.isSuccess) {
      toast.error(response.message ?? "Couldn't delete the document");
      return;
    }

    setOpen(false);
    toast.success(`Deleted ${documentName}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${documentName}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-label-md text-error transition-colors outline-none hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error"
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
            <AlertDialogTitle>Delete “{documentName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file, its embedded chunks and its knowledge
              graph. You can&apos;t undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "Deleting..." : "Delete document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
