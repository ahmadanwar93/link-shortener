// centralized registry of all query keys. Think of it like enum for your cache keys
// think of them like folder structure.
// if you invalidate the parent folder, it will invalidate the subfolders in it as well
export const queryKeys = {
  auth: {
    session: ["auth", "session"], // static keys
  },

  urls: {
    all: ["urls"], // base key for invalidation
    list: () => [...queryKeys.urls.all, "list"],
    detail: (code: string) => [...queryKeys.urls.all, "detail", code], // each url has unique cache entry
  },
  analytics: {
    all: ["analytics"] as const,
    byCode: (code: string) => [...queryKeys.analytics.all, code] as const,
  },
};
