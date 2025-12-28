import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUrl, getErrorMessage } from "@/hooks/useUrls";
import { toast } from "sonner";

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tanstack query also return isPending, so can use that
  const createUrl = useCreateUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // mutateAsync fires the mutation
      // it is a promise based hence we need to await
      await createUrl.mutateAsync({
        url,
        customAlias: customAlias.trim() || undefined,
      });

      setUrl("");
      setCustomAlias("");
      setShowAdvanced(false);
      toast.success("Created the shorten url!");
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error("Error during creation.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Input
          type="url"
          placeholder="https://example.com/very/long/url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="flex-1"
          disabled={createUrl.isPending}
        />
        <Button type="submit" disabled={createUrl.isPending || !url.trim()}>
          {createUrl.isPending ? "Creating..." : "Shorten"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdvanced ? "− Hide options" : "+ Custom alias"}
      </button>

      {showAdvanced && (
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <Label htmlFor="alias">Custom alias (optional)</Label>
          <Input
            id="alias"
            type="text"
            placeholder="my-custom-link"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            disabled={createUrl.isPending}
            minLength={3}
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            3-30 characters. Letters, numbers, hyphens, and underscores only.
          </p>
        </div>
      )}
    </form>
  );
}
