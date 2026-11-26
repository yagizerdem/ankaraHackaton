import { BellIcon, PlusIcon, SearchIcon } from "lucide-react";
import { notifications } from "../mockdata";

interface PanelToolbarProps {
  onUploadClick: () => void;
}

export function PanelToolbar({ onUploadClick }: PanelToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <label className="relative w-full max-w-md">
        <span className="sr-only">Search</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-outline" />
        <input
          type="search"
          placeholder="Search concepts, formulas or PDFs..."
          className="w-full rounded-lg bg-surface-container py-1.5 pr-4 pl-10 text-body-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </label>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label={`Notifications (${notifications.unread} unread)`}
          className="relative rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <BellIcon className="size-5" />
          {notifications.unread > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-error" />
          )}
        </button>
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Upload New Document</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </div>
  );
}
