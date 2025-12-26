// centralized registry of all query keys. Think of it like enum for your cache keys

export const queryKeys = {
  auth: {
    session: ["auth", "session"], // static keys
  },

  urls: {
    all: ["urls"], // base key for invalidation
    list: () => [...queryKeys.urls.all, "list"],
    detail: (code: string) => [...queryKeys.urls.all, "detail", code], // each url has unique cache entry
  },
};
