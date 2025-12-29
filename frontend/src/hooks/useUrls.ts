import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import type { Url, CreateUrlInput, ApiError } from "../types";

// basically tanstack query is a client side state management. it helps to synchronize server state.
// server state is still the source of truth
// it helps to cache the state
// useQuery is for idempotent read operations
// useMutation is for side effectul writes
export function useUrls() {
  return useQuery({
    // the query keys are ['urls', 'list']
    queryKey: queryKeys.urls.list(),
    queryFn: async (): Promise<Url[]> => {
      const { data } = await apiClient.get("/api/urls");
      return data;
    },
    staleTime: 30 * 1000,
    // fresh refetch on return
    refetchOnWindowFocus: "always",
  });
}

// mental model
// 1. Optimistically assume creation will succeed → update cache immediately
// 2. Fire POST in background
// 3. If success → invalidate cache → TanStack Query auto-fires GET
// 4. If error → rollback cache → TanStack Query still auto-fires GET (to confirm correct state)
// 5. Cache now matches server** (source of truth)

export function useCreateUrl() {
  // get the singleton QueryClient
  // think of QueryClient as in memory database, and useQuery and useMutation read and writes to this cache through queryKey
  // tanstack query executes in this order
  // 1. onMutate (sync cache update)
  // 2. mutationFn (API call)
  // 3. onSuccess OR onError
  // 4. onSettled (always runs)
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn is the actuall API call
    mutationFn: async (input: CreateUrlInput): Promise<Url> => {
      const { data } = await apiClient.post("/api/urls", input);
      return data;
    },

    onMutate: async (newUrlInput) => {
      // cancel any outgoing refetches to avoid overwriting optimistic update
      // for tanstack query, it doesnt care about the api route
      // it recognise using the queryKeys

      // we are stopping the queries to get the list of urls
      // we would like to mutate the cache optimistically
      await queryClient.cancelQueries({ queryKey: queryKeys.urls.list() });

      // snapshot current cache for rollback
      // in case the api call fails, we would like to revert the optimistic update back to the original state
      const previousUrls = queryClient.getQueryData<Url[]>(
        queryKeys.urls.list()
      );

      // optimistically add new URL to cache
      // setQueryData directly mutates the cache (similar to setState)
      queryClient.setQueryData<Url[]>(queryKeys.urls.list(), (old = []) => [
        {
          // Placeholder data - will be replaced on success
          // prepend the data because we expect the new data to be at the top (sort by createdAt desc)
          id: -Date.now(), // Temporary negative ID to mark that this is a fake id
          // in the case that shortCode and shortUrl have to be generated from the backend server, we put a fake one as 'generating'
          shortCode: newUrlInput.customAlias || "generating...",
          shortUrl: "generating...",
          originalUrl: newUrlInput.url,
          clickCount: 0,
          isCustomAlias: !!newUrlInput.customAlias,
          createdAt: new Date().toISOString(),
        },
        ...old,
      ]);

      // Return context for rollback
      return { previousUrls };
    },

    // rollback on failure
    // underscore prefix just a convention for unused parameters
    onError: (_error, _variables, context) => {
      // rollback to previous state on error
      if (context?.previousUrls) {
        // setQueryData to overwrite the cache back with the old data before onMutate
        queryClient.setQueryData(queryKeys.urls.list(), context.previousUrls);
      }
    },
    // onSettled would always run
    onSettled: () => {
      // invalidateQueries would mark the cache entry as stale and triggers a background refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.urls.list() });
    },
  });
  // difference between onSuccess and onSettled is that, onSuccess is like the code after await in the try block
  // onSettled is the code in the finally block
}

export function useDeleteUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shortCode: string): Promise<void> => {
      await apiClient.delete(`/api/urls/${shortCode}`);
    },

    onMutate: async (shortCode) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.urls.list() });

      const previousUrls = queryClient.getQueryData<Url[]>(
        queryKeys.urls.list()
      );

      queryClient.setQueryData<Url[]>(queryKeys.urls.list(), (old = []) =>
        old.filter((url) => url.shortCode !== shortCode)
      );

      return { previousUrls };
    },

    onError: (_error, _shortCode, context) => {
      if (context?.previousUrls) {
        queryClient.setQueryData(queryKeys.urls.list(), context.previousUrls);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.urls.list() });
    },
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;

    if (data?.details) {
      const firstField = Object.keys(data.details)[0];
      const firstError = data.details[firstField]?.[0];
      if (firstError) return firstError;
    }

    return data?.error || error.message;
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}
