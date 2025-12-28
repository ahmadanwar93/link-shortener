import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useUrls, useDeleteUrl, getErrorMessage } from "@/hooks/useUrls";
import type { Url } from "@/types";
import { toast } from "sonner";

export function UrlList() {
  const { data: urls, isLoading, error } = useUrls();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load URLs. Please try again.</p>
        <p className="text-sm mt-1">{getErrorMessage(error)}</p>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No URLs yet. Create your first short link above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {urls.map((url) => (
        <UrlCard key={url.id} url={url} />
      ))}
    </div>
  );
}

function UrlCard({ url }: { url: Url }) {
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteUrl = useDeleteUrl();

  // Detect optimistic placeholder
  const isOptimistic = url.id < 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast.success("Copied to clipboard");
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUrl.mutateAsync(url.shortCode);
      toast.success("URL deleted");
    } catch (err) {
      toast.success("Failed to delete URL");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-4 transition-opacity ${
          isOptimistic ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={url.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline truncate max-w-full"
              >
                {url.shortUrl}
              </a>
              {url.isCustomAlias && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  custom
                </span>
              )}
            </div>

            <p
              className="mt-1 text-sm text-muted-foreground truncate"
              title={url.originalUrl}
            >
              {url.originalUrl}
            </p>

            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {url.clickCount} {url.clickCount === 1 ? "click" : "clicks"}
              </span>
              <span>
                Created {new Date(url.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isOptimistic}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isOptimistic || deleteUrl.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {deleteUrl.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete URL?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {url.shortUrl}
              </span>
              . All analytics data and the short link will be lost. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="ghost"
                className="bg-destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
